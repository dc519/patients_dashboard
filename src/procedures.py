import requests

FHIR_PROCEDURE_URL = "https://fhir.hl7.de/fhir/Procedure?_count=1057"

async def fetch_procedures():
    """
    Fetches all Procedures from the FHIR server and returns a list of dicts:
    [{ "code": "225386006", "name": "Pre-discharge assessment (procedure)" }, ...]
    Only unique procedures are returned based on the SNOMED code.
    """
    try:
        resp = requests.get(FHIR_PROCEDURE_URL, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        procedures_dict = {}  # use dict to remove duplicates keyed by SNOMED code
        for entry in data.get("entry", []):
            resource = entry.get("resource", {})
            code = resource.get("code", {})
            coding_list = code.get("coding", [])
            
            if coding_list:
                snomed_code = coding_list[0].get("code")
                display_name = coding_list[0].get("display", "Unknown")
                
                if snomed_code and snomed_code not in procedures_dict:
                    procedures_dict[snomed_code] = display_name
        
        # Convert to list of dicts
        unique_procedures = [{"code": code, "name": name} for code, name in procedures_dict.items()]
        unique_procedures.sort(key=lambda x: x["name"].lower())
        return unique_procedures

    except Exception as e:
        print("Error fetching procedures:", e)
        return []
