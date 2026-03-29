from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db, AsyncSessionLocal
from backend.app.services.recon_service import ReconService

router = APIRouter(prefix="/scan", tags=["scan"])

async def run_scan_task(domain: str):
    # Use a fresh session for background task
    async with AsyncSessionLocal() as db:
        recon_service = ReconService(db)
        await recon_service.run_full_scan(domain)

@router.post("/{domain}")
async def start_scan(domain: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_scan_task, domain)
    return {"status": "accepted", "message": f"Scan for {domain} started in background"}
