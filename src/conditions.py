import requests

FHIR_CONDITIONS_URL = "https://fhir.hl7.de/fhir/Condition?_count=1057"

# Cache for conditions data
_conditions_cache = None

async def fetch_conditions():
    """
    Fetches all Conditions from the FHIR server and returns a list of dicts:
    [{ "code": "204256004", "name": "Congenital pointed ear" }, ...]
    Only unique conditions are returned based on the SNOMED code.
    Uses cache if available to improve performance.
    """
    global _conditions_cache

    # Return cached data if available
    if _conditions_cache is not None:
        return _conditions_cache

    try:
        resp = requests.get(FHIR_CONDITIONS_URL, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        conditions_dict = {}  # use dict to remove duplicates keyed by SNOMED code
        for entry in data.get("entry", []):
            resource = entry.get("resource", {})
            code = resource.get("code", {})
            coding_list = code.get("coding", [])

            if coding_list:
                snomed_code = coding_list[0].get("code")
                display_name = coding_list[0].get("display", "Unknown")

                if snomed_code and snomed_code not in conditions_dict:
                    conditions_dict[snomed_code] = display_name

        # Convert to list of dicts
        unique_conditions = [{"code": code, "name": name} for code, name in conditions_dict.items()]
        unique_conditions.sort(key=lambda x: x["name"].lower())

        # Cache the result
        _conditions_cache = unique_conditions
        return unique_conditions

    except Exception as e:
        print("Error fetching conditions:", e)
        return []
