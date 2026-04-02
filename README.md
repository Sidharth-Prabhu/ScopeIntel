# ScopeIntel

**ScopeIntel** is a high-performance Attack Surface Management (ASM) platform designed to automate external asset discovery, infrastructure mapping, and proactive threat analysis. Built for security engineers and bug bounty hunters, it translates raw reconnaissance data into actionable intelligence.

---

## 🖼️ Visual Showcase
*Placeholder for your screenshots - Replace with actual paths once captured*

### 1. Unified Security Dashboard
![Dashboard Placeholder](https://github.com/Sidharth-Prabhu/ScopeIntel/blob/main/screenshots/screenshot1.jpeg)
*A high-level overview of the organization's digital footprint, featuring real-time scan progress, asset counts, and prioritized risk metrics.*

### 2. Interactive Infrastructure Map
![Network Map Placeholder](https://github.com/Sidharth-Prabhu/ScopeIntel/blob/main/screenshots/screenshot2.jpeg)
*A D3-powered force-directed graph visualizing the relationships between root domains, subdomains, and IP addresses with animated data-packet flows.*

### 3. Intelligent Node Discovery & Search
![Search Placeholder](https://github.com/Sidharth-Prabhu/ScopeIntel/blob/main/screenshots/screenshot3.jpeg)
*Real-time search and click-to-focus capabilities allowing analysts to instantly isolate and inspect specific assets within complex network environments.*

### 4. Technical Risk Intelligence
![Risk Report Placeholder](https://github.com/Sidharth-Prabhu/ScopeIntel/blob/main/screenshots/screenshot4.jpeg)
*Deep analysis of vulnerabilities including CNAME Takeover detection, exposed sensitive services, and technographic stack fingerprinting.*

### 5. Board-Ready Security Audits (PDF)
![PDF Export Placeholder](https://github.com/Sidharth-Prabhu/ScopeIntel/blob/main/screenshots/screenshot5.jpeg)
*Functionally generated, branded PDF reports featuring executive summaries and technical inventories ready for stakeholder distribution.*

---

## 🚀 Key Features
- **Parallelized Recon Engine**: Engineered an asynchronous data pipeline using Python (FastAPI) and Async Semaphores to manage concurrent **Nmap** scans, reducing discovery time by 80%.
- **Multi-Source Subdomain Enumeration**: Integrated discovery from **crt.sh**, **subfinder**, and **SecurityTrails API** for exhaustive coverage.
- **DNS Brute Forcing**: High-performance subdomain discovery using a custom 200+ entry wordlist with multi-threaded resolution.
- **Deep Tech Fingerprinting**: Automated technographic discovery to identify server stacks, CMS frameworks (WordPress, React, etc.), and security headers (HSTS/CSP).
- **CNAME Takeover Detection**: Custom DNS resolution logic to identify high-risk unclaimed cloud resources (AWS S3, GitHub Pages, Heroku).
- **Relational Visualization**: Interactive infrastructure mapping using **React-Force-Graph** to visualize complex asset hierarchies.
- **Enterprise Reporting**: Structured, vector-based PDF generation using `@react-pdf/renderer` for high-fidelity security audits.
- **Flexible Data Exports**: Support for **JSON** and **CSV** output formats via CLI and API for easy integration with other security tools.

## 🛠️ Tech Stack
- **Backend**: Python (FastAPI), SQLAlchemy (Async), PostgreSQL, httpx, dnspython.
- **Frontend**: React (TypeScript), Vite, Tailwind CSS, Lucide Icons, react-force-graph.
- **Security Tools**: nmap, crt.sh API, subfinder, SecurityTrails integration.

## 💻 CLI Usage
The **ScopeIntel CLI** provides a powerful command-line interface for running scans and exporting results directly from your terminal.

### 1. Run a Scan
```bash
# Full scan (Recon + Port Scanning)
python3 cli.py scan example.com

# Recon only (Skip port scanning)
python3 cli.py scan example.com --no-ports
```

### 2. Export Results
```bash
# Export to JSON (default)
python3 cli.py export example.com --format json --output results.json

# Export to CSV
python3 cli.py export example.com --format csv --output results.csv
```

## ⚙️ Setup Instructions

### 1. API Configuration
To unlock full discovery power, add your API keys to `backend/app/core/config.py` or your `.env` file:
- `SECURITYTRAILS_API_KEY`: For enhanced subdomain enumeration.
- `SHODAN_API_KEY`: For deep service discovery.
- `VIRUSTOTAL_API_KEY`: For historical DNS data.

### 2. Backend Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Initialize the database (ensure PostgreSQL is running):
   ```bash
   python -m backend.setup_db
   ```
4. Start the API:
   ```bash
   uvicorn backend.app.main:app --reload
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🧠 Architecture
- **Recon Engine**: Multi-threaded/Async discovery scripts.
- **Correlation Engine**: Connects assets via shared IPs and infrastructure.
- **API Layer**: RESTful endpoints for triggering scans and retrieving findings.
- **Dashboard**: Professional-grade UI for security operations.
