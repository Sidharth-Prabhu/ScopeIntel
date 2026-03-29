import subprocess
import logging

logger = logging.getLogger(__name__)

class PortScanner:
    def __init__(self):
        pass

    def run_nmap(self, target: str):
        """Runs nmap against a target target."""
        try:
            # -F is for fast scan (top 100 ports)
            result = subprocess.run(
                ["nmap", "-F", target],
                capture_output=True,
                text=True
            )
            return result.stdout
        except FileNotFoundError:
            logger.warning("nmap not found. Skipping...")
        except Exception as e:
            logger.error(f"Error running nmap for {target}: {str(e)}")
        return ""

    def parse_nmap_output(self, output: str):
        """Parses nmap output to find open ports."""
        open_ports = []
        for line in output.splitlines():
            if "/tcp" in line and "open" in line:
                parts = line.split()
                port = int(parts[0].split("/")[0])
                service = parts[2]
                open_ports.append({"port": port, "service": service})
        return open_ports
