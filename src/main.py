from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import uvicorn
from fastapi.responses import JSONResponse
from .conditions import fetch_conditions
from .procedures import fetch_procedures
from .medications import fetch_medications
from contextlib import asynccontextmanager
from .startup import load_patients_data, load_dropdown_data
from pydantic import BaseModel
from .models import SearchCriteria
from .patient_match import find_matching_patient
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_patients_data()          # startup
    await load_dropdown_data()    # load dropdown data into cache
    yield
    # (shutdown logic could go here)

app = FastAPI(lifespan=lifespan)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # src folder path
STATIC_DIR = os.path.join(BASE_DIR, "static")          # src/static
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")   

# Templates
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Static files (CSS/JS)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# Endpoints
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("homepage.html", {"request": request})


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/conditions")
async def get_conditions():
    """
    Returns a list of conditions for populating the dropdown
    """
    conditions = await fetch_conditions()
    return JSONResponse(content=conditions)

@app.get("/api/procedures")
async def get_procedures():
    procedures = await fetch_procedures()
    return JSONResponse(content=procedures)

@app.get("/api/medications")
async def get_medications():
    return await fetch_medications()

class MatchRequest(BaseModel):
    criteria: SearchCriteria
    code: str

@app.post("/api/match")
async def match_patients(req: MatchRequest):
    return await find_matching_patient(req.criteria, req.code)


if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
