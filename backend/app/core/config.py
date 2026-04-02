from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:sidharth@localhost:5432/amass"
    PROJECT_NAME: str = "ScopeIntel"
    
    # API Keys for Recon
    SECURITYTRAILS_API_KEY: str = ""
    ABUSEIPDB_API_KEY: str = ""
    VIRUSTOTAL_API_KEY: str = ""
    SHODAN_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
