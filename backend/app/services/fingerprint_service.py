import httpx
import logging
import re

logger = logging.getLogger(__name__)

class FingerprintService:
    def __init__(self):
        # Common technology fingerprints
        self.FINGERPRINTS = {
            "Server": {
                "nginx": r"nginx/?([\d\.]+)?",
                "apache": r"apache/?([\d\.]+)?",
                "cloudflare": r"cloudflare",
                "microsoft-iis": r"microsoft-iis/?([\d\.]+)?",
            },
            "Framework": {
                "wordpress": r"wp-content",
                "react": r"data-reactroot",
                "next.js": r"/_next/",
                "django": r"csrfmiddlewaretoken",
                "laravel": r"XSRF-TOKEN",
            },
            "Security": {
                "hsts": r"Strict-Transport-Security",
                "csp": r"Content-Security-Policy",
            }
        }

    async def identify_tech(self, subdomain: str):
        """Identifies technologies by analyzing HTTP headers and body."""
        tech_found = {}
        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True, verify=False) as client:
                response = await client.get(f"http://{subdomain}")
                headers = response.headers
                content = response.text

                # 1. Check Headers
                server = headers.get("Server", "").lower()
                for name, pattern in self.FINGERPRINTS["Server"].items():
                    if re.search(pattern, server):
                        tech_found[name] = {"category": "Server", "version": "detected"}

                # 2. Check Body & Other Headers
                for category, fingerprints in self.FINGERPRINTS.items():
                    if category == "Server": continue
                    for name, pattern in fingerprints.items():
                        if category == "Security":
                            if name.upper() in headers or pattern in headers:
                                tech_found[name] = {"category": category}
                        elif re.search(pattern, content, re.IGNORECASE):
                            tech_found[name] = {"category": category}

                return tech_found
        except Exception as e:
            logger.debug(f"Fingerprinting failed for {subdomain}: {str(e)}")
        return {}
