import requests
import subprocess
import logging

logger = logging.getLogger(__name__)

class ReconManager:
    def __init__(self):
        pass

    def get_crtsh_subdomains(self, domain: str):
        """Discovers subdomains using Certificate Transparency (crt.sh)."""
        url = f"https://crt.sh/?q=%25.{domain}&output=json"
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                data = response.json()
                subdomains = set()
                for entry in data:
                    name_value = entry.get('name_value', '')
                    # Crt.sh sometimes returns multiple names in one string
                    for sub in name_value.split('\n'):
                        if sub.endswith(domain) and '*' not in sub:
                            subdomains.add(sub.strip().lower())
                return list(subdomains)
        except Exception as e:
            logger.error(f"Error fetching from crt.sh for {domain}: {str(e)}")
        return []

    def get_subfinder_subdomains(self, domain: str):
        """Discovers subdomains using subfinder CLI."""
        try:
            result = subprocess.run(
                ["subfinder", "-d", domain, "-silent"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                subdomains = [s.strip().lower() for s in result.stdout.splitlines() if s.strip()]
                return subdomains
        except FileNotFoundError:
            logger.warning("subfinder not found. Skipping...")
        except Exception as e:
            logger.error(f"Error running subfinder for {domain}: {str(e)}")
        return []

    def run_recon(self, domain: str):
        """Orchestrates multi-source recon."""
        logger.info(f"Starting recon for {domain}")
        crtsh_results = self.get_crtsh_subdomains(domain)
        subfinder_results = self.get_subfinder_subdomains(domain)
        
        all_subdomains = set(crtsh_results + subfinder_results)
        return list(all_subdomains)
