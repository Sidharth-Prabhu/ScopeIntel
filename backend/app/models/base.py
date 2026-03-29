from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="idle") # idle, scanning, completed, failed
    progress = Column(Integer, default=0) # 0 to 100
    discovered_at = Column(DateTime, default=datetime.utcnow)
    last_scan = Column(DateTime, nullable=True)
    
    assets = relationship("Asset", back_populates="domain")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    subdomain = Column(String, index=True, nullable=False)
    ip = Column(String, nullable=True)
    status = Column(String, nullable=True) # up/down
    risk_score = Column(Integer, default=0)
    technologies = Column(JSON, default={}) # Store discovered tech stack
    discovered_at = Column(DateTime, default=datetime.utcnow)
    
    domain = relationship("Domain", back_populates="assets")
    services = relationship("Service", back_populates="asset")
    risks = relationship("Risk", back_populates="asset")

class Risk(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    type = Column(String, nullable=False) # e.g., "Exposed Port", "Admin Panel"
    severity = Column(String, nullable=False) # Critical, High, Medium, Low
    description = Column(String)
    discovered_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset", back_populates="risks")

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    port = Column(Integer, nullable=False)
    protocol = Column(String, default="tcp")
    service_name = Column(String, nullable=True) # http, ssh, etc.
    banner = Column(String, nullable=True)
    last_scan = Column(DateTime, default=datetime.utcnow)
    details = Column(JSON, nullable=True)

    asset = relationship("Asset", back_populates="services")
