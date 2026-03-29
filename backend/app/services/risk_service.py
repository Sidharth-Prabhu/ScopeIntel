import httpx
import logging
import dns.resolver
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.base import Asset, Service, Risk

logger = logging.getLogger(__name__)

class RiskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Common high-risk ports
    RISKY_PORTS = {
        21: ("FTP", "Medium"),
        22: ("SSH", "Medium"),
        23: ("Telnet", "High"),
        3306: ("MySQL", "High"),
        5432: ("PostgreSQL", "High"),
        6379: ("Redis", "Critical"),
        27017: ("MongoDB", "Critical")
    }

    # CNAME fingerprints for subdomain takeover
    # format: {cname_suffix: (service_name, error_fingerprint)}
    TAKEOVER_FINGERPRINTS = {
        "github.io": ("GitHub Pages", "There isn't a GitHub Pages site here."),
        "s3.amazonaws.com": ("AWS S3", "The specified bucket does not exist"),
        "herokuapp.com": ("Heroku", "No such app"),
        "wpengine.com": ("WPEngine", "The site you were looking for couldn't be found."),
        "azurewebsites.net": ("Azure", "404 Web Site not found"),
        "bitbucket.io": ("Bitbucket", "Repository not found")
    }

    async def check_cname_takeover(self, subdomain: str):
        """Checks if a subdomain is vulnerable to CNAME takeover."""
        try:
            # Resolve CNAME record
            resolver = dns.resolver.Resolver()
            resolver.timeout = 2
            resolver.lifetime = 2
            answers = resolver.resolve(subdomain, 'CNAME')
            
            for rdata in answers:
                cname = str(rdata.target).lower()
                for suffix, (service, fingerprint) in self.TAKEOVER_FINGERPRINTS.items():
                    if cname.endswith(suffix):
                        # If CNAME matches a vulnerable service, check if it's "dead"
                        async with httpx.AsyncClient(timeout=5) as client:
                            try:
                                response = await client.get(f"http://{subdomain}")
                                if fingerprint.lower() in response.text.lower():
                                    return {
                                        "service": service,
                                        "cname": cname,
                                        "severity": "Critical",
                                        "description": f"Potential Subdomain Takeover on {service}. CNAME points to {cname} but service is not claimed."
                                    }
                            except:
                                pass
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.Timeout):
            pass
        except Exception as e:
            logger.debug(f"CNAME resolution error for {subdomain}: {str(e)}")
        
        return None

    async def analyze_asset(self, asset: Asset, open_ports: list):
        """Analyzes risks for an asset based on its open ports, subdomains, and CNAMEs."""
        score = 0
        risks = []

        # 1. Port-based risks
        for port_data in open_ports:
            port = port_data["port"]
            if port in self.RISKY_PORTS:
                name, severity = self.RISKY_PORTS[port]
                score += {"Medium": 20, "High": 50, "Critical": 100}[severity]
                risks.append(Risk(
                    asset_id=asset.id,
                    type="Exposed Sensitive Service",
                    severity=severity,
                    description=f"Exposed {name} service on port {port}"
                ))

        # 2. Subdomain-based risk (Development Infrastructure)
        if any(keyword in asset.subdomain for keyword in ["admin", "dev", "staging", "test"]):
            score += 15
            risks.append(Risk(
                asset_id=asset.id,
                type="Development Infrastructure",
                severity="Low",
                description="Development or Administrative subdomain discovered."
            ))

        # 3. CNAME Takeover Check (CRITICAL)
        takeover = await self.check_cname_takeover(asset.subdomain)
        if takeover:
            score += 150 # Massive boost for takeover
            risks.append(Risk(
                asset_id=asset.id,
                type="Subdomain Takeover",
                severity=takeover["severity"],
                description=takeover["description"]
            ))

        # Update asset score
        asset.risk_score = score
        for risk in risks:
            self.db.add(risk)
        
        return score
