import json
from pathlib import Path
import asyncio

PATIENTS_DIR = Path("data/sample_patients_data_from_hl7")

# Global in-memory patient store
PATIENTS_DB: dict[str, dict] = {}


async def load_dropdown_data():
    """Load conditions, procedures, and medications into cache during startup"""
    from .conditions import fetch_conditions
    from .procedures import fetch_procedures
    from .medications import fetch_medications

    try:
        print("🚀 Loading dropdown data from FHIR server...")
        await fetch_conditions()
        await fetch_procedures()
        await fetch_medications()
        print("✔ Dropdown data loaded into cache")
    except Exception as e:
        print(f"⚠️ Failed loading dropdown data: {e}")


def load_patients_data():
    print("🚀 Loading HL7 patient bundles into memory...")

    PATIENTS_DB.clear()

    for file in PATIENTS_DIR.glob("*.json"):
        try:
            with open(file, encoding="utf-8") as f:
                bundle = json.load(f)

            entries = [e["resource"] for e in bundle.get("entry", [])]

            def get_resources(rt):
                return [r for r in entries if r.get("resourceType") == rt]

            # ---------------- PATIENT ----------------
            patient = get_resources("Patient")[0]

            name = patient["name"][0]
            patient_name = f'{name["given"][0]} {name["family"]}'
            gender = patient.get("gender")
            dob = patient.get("birthDate")
            contact = patient.get("telecom", [{}])[0].get("value")

            addr = patient.get("address", [{}])[0]
            address = ", ".join(filter(None, [
                addr.get("line", [""])[0],
                addr.get("city"),
                addr.get("postalCode"),
                addr.get("country")
            ]))

            # ---------------- CONDITIONS ----------------
            conditions = [
                c["code"]["coding"][0]["code"]
                for c in get_resources("Condition")
            ]

            # ---------------- PROCEDURES ----------------
            procedures = [
                p["code"]["coding"][0]["code"]
                for p in get_resources("Procedure")
            ]

            # ---------------- MEDICATIONS ----------------
            medications = [
                m["medicationCodeableConcept"]["coding"][0]["code"]
                for m in get_resources("MedicationStatement")
            ]

            # ---------------- VITALS ----------------
            vitals = {}
            for o in get_resources("Observation"):
                if "valueQuantity" in o:
                    vitals[o["code"]["coding"][0]["display"]] = o["valueQuantity"]["value"]

            # ---------------- ENCOUNTERS ----------------
            encounters = [
                e["type"][0]["coding"][0]["display"]
                for e in get_resources("Encounter")
            ]

            # ---------------- FINAL OBJECT ----------------
            PATIENTS_DB[patient_name] = {
                "name": patient_name,
                "gender": gender,
                "dob": dob,
                "contact": contact,
                "address": address,
                "conditions": conditions,
                "procedures": procedures,
                "medications": medications,
                "vitals": vitals,
                "encounters": encounters,
            }
            
        except Exception as e:
            print(f"⚠️ Failed loading {file.name}: {e}")
    print(f"✔ Loaded {len(PATIENTS_DB)} patients into RAM")
