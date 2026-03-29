import socket
import logging
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.models.base import Domain, Asset, Service
from scripts.recon.recon_manager import ReconManager
from scripts.scanning.scanner import PortScanner
from backend.app.services.risk_service import RiskService
from backend.app.services.fingerprint_service import FingerprintService
from backend.app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

class ReconService:
    def __init__(self, db: AsyncSession = None):
        self.db = db
        self.recon_manager = ReconManager()
        self.port_scanner = PortScanner()
        self.fingerprint_service = FingerprintService()

    async def update_progress(self, domain_id: int, progress: int):
        """Helper to update domain progress using a fresh session."""
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Domain).where(Domain.id == domain_id))
            db_domain = result.scalar_one_or_none()
            if db_domain:
                db_domain.progress = progress
                await db.commit()

    async def scan_single_asset(self, domain_id: int, sub: str, scan_ports: bool, semaphore: asyncio.Semaphore):
        """Scans a single asset with its own session to avoid transaction conflicts."""
        async with semaphore:
            async with AsyncSessionLocal() as db:
                risk_service = RiskService(db)
                try:
                    # 1. DNS Resolution with timeout
                    ip = None
                    try:
                        ip = await asyncio.wait_for(asyncio.to_thread(socket.gethostbyname, sub), timeout=5.0)
                    except (asyncio.TimeoutError, socket.gaierror):
                        logger.debug(f"DNS resolution failed or timed out for {sub}")
                    
                    # 2. Tech Fingerprinting
                    technologies = {}
                    if ip:
                        technologies = await self.fingerprint_service.identify_tech(sub)

                    # Check if asset exists
                    asset_result = await db.execute(
                        select(Asset).where(Asset.subdomain == sub, Asset.domain_id == domain_id)
                    )
                    db_asset = asset_result.scalar_one_or_none()
                    
                    if not db_asset:
                        db_asset = Asset(
                            domain_id=domain_id,
                            subdomain=sub,
                            ip=ip,
                            status="up" if ip else "down",
                            technologies=technologies
                        )
                        db.add(db_asset)
                        await db.flush()
                    else:
                        db_asset.ip = ip
                        db_asset.status = "up" if ip else "down"
                        db_asset.technologies = technologies

                    # 3. Port Scanning with timeout
                    open_ports = []
                    if scan_ports and ip:
                        try:
                            nmap_output = await asyncio.wait_for(
                                asyncio.to_thread(self.port_scanner.run_nmap, sub), 
                                timeout=60.0
                            )
                            open_ports = self.port_scanner.parse_nmap_output(nmap_output)
                            
                            for port_data in open_ports:
                                service = Service(
                                    asset_id=db_asset.id,
                                    port=port_data["port"],
                                    service_name=port_data["service"]
                                )
                                db.add(service)
                        except Exception as e:
                            logger.error(f"Scanning error for {sub}: {str(e)}")

                    # 4. Risk Analysis
                    await risk_service.analyze_asset(db_asset, open_ports)
                    await db.commit()
                except Exception as e:
                    logger.error(f"Unexpected error scanning {sub}: {str(e)}")
                    await db.rollback()

    def check_host(self, host: str):
        try:
            socket.gethostbyname(host)
            return True
        except:
            return False

    async def run_full_scan(self, domain_name: str, scan_ports: bool = True):
        """Runs the full recon process for a domain in parallel."""
        logger.info(f"Running parallel scan for {domain_name}")
        
        # 1. Get or create domain
        result = await self.db.execute(select(Domain).where(Domain.name == domain_name))
        db_domain = result.scalar_one_or_none()
        if not db_domain:
            db_domain = Domain(name=domain_name)
            self.db.add(db_domain)
            await self.db.commit()
            await self.db.refresh(db_domain)

        db_domain.status = "scanning"
        db_domain.progress = 5
        await self.db.commit()

        try:
            # 2. Run multi-source recon (20% progress)
            subdomains = await asyncio.to_thread(self.recon_manager.run_recon, domain_name)
            await self.update_progress(db_domain.id, 20)
            
            if not subdomains:
                db_domain.status = "completed"
                db_domain.progress = 100
                await self.db.commit()
                return []

            # 3. Parallel Scanning (20% to 95% progress)
            semaphore = asyncio.Semaphore(5) 
            
            total = len(subdomains)
            completed_count = 0

            async def tracked_scan(sub):
                nonlocal completed_count
                await self.scan_single_asset(db_domain.id, sub, scan_ports, semaphore)
                completed_count += 1
                new_progress = 20 + int((completed_count / total) * 75)
                await self.update_progress(db_domain.id, new_progress)

            await asyncio.gather(*(tracked_scan(sub) for sub in subdomains))
            
            db_domain.status = "completed"
            db_domain.progress = 100
            db_domain.last_scan = datetime.utcnow()
            await self.db.commit()
            return subdomains
            
        except Exception as e:
            logger.error(f"Scan failed for {domain_name}: {str(e)}")
            db_domain.status = "failed"
            await self.db.commit()
            raise e
