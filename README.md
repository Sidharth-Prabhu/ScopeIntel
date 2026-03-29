# ScopeIntel

A robust system to discover, map, and analyze your external digital assets.

## 🚀 Features
- **Multi-Source Recon**: Discovers subdomains using Certificate Transparency (crt.sh) and Subfinder.
- **Asset Resolution**: Maps subdomains to IP addresses and tracks their status.
- **Port Scanning**: Integrated `nmap` support for identifying exposed services.
- **Modern Dashboard**: React-based UI with real-time scan monitoring and asset visualization.
- **Data Persistence**: PostgreSQL storage for historical tracking and correlation.

## 🛠️ Tech Stack
- **Backend**: Python (FastAPI), SQLAlchemy (Async), PostgreSQL.
- **Frontend**: React (Vite, TypeScript), Tailwind CSS, Lucide Icons.
- **Scanning Tools**: nmap, crt.sh API, subfinder (optional).

## ⚙️ Setup Instructions

### 1. Backend Setup
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
