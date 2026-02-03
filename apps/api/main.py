from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("RMS API Starting up...")
    yield
    logger.info("RMS API Shutting down...")

app = FastAPI(
    title="RMS API - Version 01",
    description="Revenue Management System MVP API",
    version="0.1.0",
    lifespan=lifespan
)

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "version": "0.1.0",
        "service": "revenue-management-system"
    }

@app.get("/")
async def root():
    return {"message": "Welcome to RMS API V01"}
