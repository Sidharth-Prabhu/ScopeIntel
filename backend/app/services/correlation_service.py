from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.models.base import Domain, Asset, Service

class CorrelationEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def correlate_assets(self, domain_id: int):
        """Correlates assets for a domain, for example, identifying shared IPs."""
        result = await self.db.execute(select(Asset).where(Asset.domain_id == domain_id))
        assets = result.scalars().all()
        
        # Simple correlation: find assets sharing the same IP
        ip_map = {}
        for asset in assets:
            if asset.ip:
                if asset.ip not in ip_map:
                    ip_map[asset.ip] = []
                ip_map[asset.ip].append(asset.subdomain)
        
        return ip_map
