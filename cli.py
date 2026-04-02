import asyncio
import argparse
import json
import csv
import sys
import os
from datetime import datetime
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

# Add project root to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.app.core.database import AsyncSessionLocal
from backend.app.services.recon_service import ReconService
from backend.app.models.base import Domain, Asset, Service, Risk

async def run_scan(domain: str, no_ports: bool):
    async with AsyncSessionLocal() as db:
        service = ReconService(db)
        print(f"[*] Starting scan for {domain}...")
        try:
            subdomains = await service.run_full_scan(domain, scan_ports=not no_ports)
            print(f"[+] Scan completed. Discovered {len(subdomains)} subdomains.")
        except Exception as e:
            print(f"[!] Scan failed: {e}")

async def export_results(domain: str, format: str, output: str):
    async with AsyncSessionLocal() as db:
        # Fetch domain and its assets
        result = await db.execute(
            select(Domain)
            .where(Domain.name == domain)
            .options(
                selectinload(Domain.assets)
                .selectinload(Asset.services),
                selectinload(Domain.assets)
                .selectinload(Asset.risks)
            )
        )
        db_domain = result.scalar_one_or_none()
        
        if not db_domain:
            print(f"[!] Domain {domain} not found in database.")
            return

        data = []
        for asset in db_domain.assets:
            asset_data = {
                "subdomain": asset.subdomain,
                "ip": asset.ip,
                "status": asset.status,
                "risk_score": asset.risk_score,
                "technologies": asset.technologies,
                "services": [{"port": s.port, "name": s.service_name} for s in asset.services],
                "risks": [{"type": r.type, "severity": r.severity} for r in asset.risks]
            }
            data.append(asset_data)

        if format == "json":
            with open(output, 'w') as f:
                json.dump(data, f, indent=4)
            print(f"[+] Exported to {output}")
        
        elif format == "csv":
            with open(output, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["Subdomain", "IP", "Status", "Risk Score", "Ports", "Risks"])
                for row in data:
                    ports = ",".join([str(s["port"]) for s in row["services"]])
                    risks = ",".join([r["type"] for r in row["risks"]])
                    writer.writerow([
                        row["subdomain"], 
                        row["ip"], 
                        row["status"], 
                        row["risk_score"], 
                        ports, 
                        risks
                    ])
            print(f"[+] Exported to {output}")

def main():
    parser = argparse.ArgumentParser(description="ScopeIntel CLI - Attack Surface Mapper")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Scan command
    scan_parser = subparsers.add_parser("scan", help="Scan a domain")
    scan_parser.add_argument("domain", help="Domain to scan")
    scan_parser.add_argument("--no-ports", action="store_true", help="Skip port scanning")

    # Export command
    export_parser = subparsers.add_parser("export", help="Export scan results")
    export_parser.add_argument("domain", help="Domain to export")
    export_parser.add_argument("--format", choices=["json", "csv"], default="json", help="Export format")
    export_parser.add_argument("--output", help="Output file path")

    args = parser.parse_args()

    if args.command == "scan":
        asyncio.run(run_scan(args.domain, args.no_ports))
    elif args.command == "export":
        output = args.output or f"{args.domain}_export.{args.format}"
        asyncio.run(export_results(args.domain, args.format, output))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
