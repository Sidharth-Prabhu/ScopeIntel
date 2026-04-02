import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from backend.app.core.database import get_db
from backend.app.models.base import Domain, Asset, Service, Risk
from typing import List

router = APIRouter(prefix="/results", tags=["results"])

@router.get("/{domain}", response_model=List[dict])
async def get_results(domain: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Domain).where(Domain.name == domain))
    db_domain = result.scalar_one_or_none()
    
    if not db_domain:
        return [] # Return empty if no scan ever started
        
    asset_result = await db.execute(
        select(Asset)
        .where(Asset.domain_id == db_domain.id)
        .order_by(Asset.risk_score.desc())
        .options(selectinload(Asset.services), selectinload(Asset.risks))
    )
    assets = asset_result.scalars().all()
    
    return [
        {
            "id": asset.id,
            "subdomain": asset.subdomain,
            "ip": asset.ip,
            "status": asset.status,
            "risk_score": asset.risk_score,
            "technologies": asset.technologies,
            "discovered_at": asset.discovered_at,
            "scan_status": db_domain.status,
            "progress": db_domain.progress,
            "services": [{"port": s.port, "service": s.service_name} for s in asset.services],
            "risks": [{"type": r.type, "severity": r.severity} for r in asset.risks]
        }
        for asset in assets
    ]

@router.get("/{domain}/export/{format}")
async def export_results(domain: str, format: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Domain)
        .where(Domain.name == domain)
        .options(
            selectinload(Domain.assets).selectinload(Asset.services),
            selectinload(Domain.assets).selectinload(Asset.risks)
        )
    )
    db_domain = result.scalar_one_or_none()
    
    if not db_domain:
        raise HTTPException(status_code=404, detail="Domain not found")

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
        return data
    
    elif format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
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
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={domain}_export.csv"}
        )
    
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'json' or 'csv'.")

@router.get("/{domain}/risks")
async def get_risk_report(domain: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Domain)
        .where(Domain.name == domain)
        .options(selectinload(Domain.assets).selectinload(Asset.risks))
    )
    db_domain = result.scalar_one_or_none()
    
    if not db_domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    report = {
        "domain": db_domain.name,
        "scan_date": db_domain.last_scan,
        "total_assets": len(db_domain.assets),
        "critical_count": 0,
        "high_count": 0,
        "medium_count": 0,
        "low_count": 0,
        "findings": []
    }
    
    for asset in db_domain.assets:
        for risk in asset.risks:
            report["findings"].append({
                "subdomain": asset.subdomain,
                "ip": asset.ip,
                "type": risk.type,
                "severity": risk.severity,
                "description": risk.description,
                "discovered_at": risk.discovered_at
            })
            
            # Update counters
            if risk.severity == "Critical": report["critical_count"] += 1
            elif risk.severity == "High": report["high_count"] += 1
            elif risk.severity == "Medium": report["medium_count"] += 1
            elif risk.severity == "Low": report["low_count"] += 1
            
    # Sort findings by severity
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    report["findings"].sort(key=lambda x: severity_order.get(x["severity"], 4))
    
    return report
