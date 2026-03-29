from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:sidharth@localhost:5432/amass"
    PROJECT_NAME: str = "ScopeIntel"

    class Config:
        env_file = ".env"

settings = Settings()
