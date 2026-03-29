import asyncio
import sys
from backend.app.core.database import engine
from backend.app.models.base import Base

async def init_db(reset=False):
    async with engine.begin() as conn:
        # Import models here to ensure they are registered with Base
        from backend.app.models.base import Domain, Asset, Service, Risk
        
        if reset:
            print("Dropping existing tables...")
            await conn.run_sync(Base.metadata.drop_all)
            
        print("Creating database tables...")
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialization complete.")

if __name__ == "__main__":
    # Check if 'reset' was passed as an argument
    reset_db = "--reset" in sys.argv
    asyncio.run(init_db(reset=reset_db))
