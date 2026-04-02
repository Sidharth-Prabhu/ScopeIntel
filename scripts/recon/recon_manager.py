import requests
import subprocess
import logging
import socket
import concurrent.futures
import os
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class ReconManager:
    def __init__(self):
        self.wordlist_path = os.path.join(os.path.dirname(__file__), "wordlist.txt")

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

    def dns_brute_force(self, domain: str):
        """Performs DNS brute-forcing using a wordlist."""
        if not os.path.exists(self.wordlist_path):
            logger.warning(f"Wordlist not found at {self.wordlist_path}. Skipping brute-force.")
            return []

        subdomains = []
        try:
            with open(self.wordlist_path, 'r') as f:
                words = [line.strip() for line in f if line.strip()]
            
            def check_sub(word):
                sub = f"{word}.{domain}"
                try:
                    socket.gethostbyname(sub)
                    return sub
                except socket.gaierror:
                    return None

            with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
                results = list(executor.map(check_sub, words))
                subdomains = [r for r in results if r]
        except Exception as e:
            logger.error(f"Error during DNS brute-force for {domain}: {str(e)}")
        
        return subdomains

    def get_securitytrails_subdomains(self, domain: str):
        """Discovers subdomains using SecurityTrails API."""
        if not settings.SECURITYTRAILS_API_KEY:
            return []
        
        url = f"https://api.securitytrails.com/v1/domain/{domain}/subdomains"
        headers = {"apikey": settings.SECURITYTRAILS_API_KEY}
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return [f"{sub}.{domain}" for sub in data.get("subdomains", [])]
        except Exception as e:
            logger.error(f"Error fetching from SecurityTrails for {domain}: {str(e)}")
        return []

    def run_recon(self, domain: str):
        """Orchestrates multi-source recon."""
        logger.info(f"Starting multi-source recon for {domain}")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_crtsh = executor.submit(self.get_crtsh_subdomains, domain)
            future_subfinder = executor.submit(self.get_subfinder_subdomains, domain)
            future_brute = executor.submit(self.dns_brute_force, domain)
            future_strails = executor.submit(self.get_securitytrails_subdomains, domain)

            results = []
            results.extend(future_crtsh.result())
            results.extend(future_subfinder.result())
            results.extend(future_brute.result())
            results.extend(future_strails.result())

        all_subdomains = set(s.lower() for s in results if s)
        logger.info(f"Recon found {len(all_subdomains)} unique subdomains for {domain}")
        return list(all_subdomains)
