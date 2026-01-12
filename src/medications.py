import requests

FHIR_MEDICATIONS_URL = "https://fhir.hl7.de/fhir/Medication?_count=1000"

# Cache for medications data
_medications_cache = None

async def fetch_medications():
    """
    Fetches all Medications from the FHIR server and returns a list of dicts:
    [{ "code": "319996000", "name": "Simvastatin 10 mg oral tablet" }, ...]
    Only unique medications are returned based on the SNOMED code.
    Uses cache if available to improve performance.
    """
    global _medications_cache

    # Return cached data if available
    if _medications_cache is not None:
        return _medications_cache

    try:
        resp = requests.get(FHIR_MEDICATIONS_URL, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        medications_dict = {}  # remove duplicates keyed by SNOMED code
        for entry in data.get("entry", []):
            resource = entry.get("resource", {})
            code = resource.get("code", {})
            coding_list = code.get("coding", [])

            if coding_list:
                snomed_code = coding_list[0].get("code")
                display_name = coding_list[0].get("display", "Unknown")

                if snomed_code and snomed_code not in medications_dict:
                    medications_dict[snomed_code] = display_name

        # Convert to list of dicts and sort alphabetically by name
        unique_medications = [{"code": code, "name": name} for code, name in medications_dict.items()]
        unique_medications.sort(key=lambda x: x["name"].lower())

        # Cache the result
        _medications_cache = unique_medications
        return unique_medications

    except Exception as e:
        print("Error fetching medications:", e)
        return []
