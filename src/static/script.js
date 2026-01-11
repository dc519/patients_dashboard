// ---------- FILTER INFO DIV ----------
const filterInfoDiv = document.createElement("div");
filterInfoDiv.id = "filter-info";
filterInfoDiv.style.marginBottom = "10px";
document.getElementById("result").before(filterInfoDiv);

// ---------- LOAD CONDITIONS ----------
async function loadConditions() {
    try {
        const response = await fetch("/api/conditions");
        const data = await response.json();

        const dropdown = document.getElementById("dropdown1");
        dropdown.innerHTML = `<option value="" disabled selected>Select a condition...</option>`;

        data.forEach(cond => {
            const option = document.createElement("option");
            option.value = cond.code;
            option.textContent = cond.name.replace(/\s*\(disorder\)\s*$/i, '').trim();
            dropdown.appendChild(option);
        });

    } catch (err) {
        console.error("Failed to load conditions:", err);
    }
}

// ---------- LOAD PROCEDURES ----------
async function loadProcedures() {
    try {
        const response = await fetch("/api/procedures");
        const data = await response.json();

        const dropdown = document.getElementById("dropdown2");
        dropdown.innerHTML = `<option value="" disabled selected>Select a procedure...</option>`;

        data.forEach(proc => {
            const option = document.createElement("option");
            option.value = proc.code;
            option.textContent = proc.name;
            dropdown.appendChild(option);
        });

    } catch (err) {
        console.error("Failed to load procedures:", err);
    }
}

// ---------- LOAD MEDICATIONS ----------
async function loadMedications() {
    try {
        const response = await fetch("/api/medications");
        const data = await response.json();

        const dropdown = document.getElementById("dropdown3");
        dropdown.innerHTML = `<option value="" disabled selected>Select a medication...</option>`;

        data.forEach(med => {
            const option = document.createElement("option");
            option.value = med.code;
            option.textContent = med.name;
            dropdown.appendChild(option);
        });

    } catch (err) {
        console.error("Failed to load medications:", err);
    }
}

// ---------- ENABLE BUTTONS ----------
document.getElementById("dropdown1").addEventListener("change", () => {
    document.getElementById("nextConditionBtn").disabled = false;
});

document.getElementById("dropdown2").addEventListener("change", () => {
    document.getElementById("nextProcedureBtn").disabled = false;
});

document.getElementById("dropdown3").addEventListener("change", () => {
    document.getElementById("nextMedicationBtn").disabled = false;
});

// ---------- SEND MATCH ----------
async function sendMatch(criteria, code, displayName) {
    // Show filter info
    filterInfoDiv.textContent = `Filtered By (${criteria}): ${displayName}`;

    const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria, code })
    });

    const patients = await res.json();
    renderPatients(patients);

    // Clear dropdown
    if (criteria === "conditions") document.getElementById("dropdown1").value = "";
    else if (criteria === "procedures") document.getElementById("dropdown2").value = "";
    else if (criteria === "medications") document.getElementById("dropdown3").value = "";
}

// ---------- BUTTON EVENTS ----------
document.getElementById("nextConditionBtn").addEventListener("click", () => {
    const dropdown = document.getElementById("dropdown1");
    const code = dropdown.value;
    const displayName = dropdown.options[dropdown.selectedIndex].text;
    if (code) sendMatch("conditions", code, displayName);
});

document.getElementById("nextProcedureBtn").addEventListener("click", () => {
    const dropdown = document.getElementById("dropdown2");
    const code = dropdown.value;
    const displayName = dropdown.options[dropdown.selectedIndex].text;
    if (code) sendMatch("procedures", code, displayName);
});

document.getElementById("nextMedicationBtn").addEventListener("click", () => {
    const dropdown = document.getElementById("dropdown3");
    const code = dropdown.value;
    const displayName = dropdown.options[dropdown.selectedIndex].text;
    if (code) sendMatch("medications", code, displayName);
});

// ---------- RENDER RESULTS ----------
function renderPatients(patients) {
    const box = document.getElementById("result");
    box.innerHTML = "";

    if (!Array.isArray(patients) || patients.length === 0) {
        box.innerHTML = "<p>No matching patients found.</p>";
        return;
    }

    patients.forEach(p => {
        const div = document.createElement("div");
        div.className = "patient-card collapsed";

        div.innerHTML = `
            <h3>${p.name}</h3>
            <p><b>DOB:</b> ${p.dob}</p>
            <div class="patient-details" style="display:none;">
                <p><b>Address:</b> ${p.address}</p>
                ${p.vitals
                    ? Object.entries(p.vitals)
                          .map(([k, v]) => `<p><b>${k}:</b> ${v}</p>`)
                          .join("")
                    : "<p>No vitals available</p>"
                }
            </div>
        `;

        div.addEventListener("click", () => {
            const details = div.querySelector(".patient-details");
            const isVisible = details.style.display === "block";
            details.style.display = isVisible ? "none" : "block";
            div.classList.toggle("expanded", !isVisible);
            div.classList.toggle("collapsed", isVisible);
        });

        box.appendChild(div);
    });
}

// ---------- INIT ----------
window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("nextConditionBtn").disabled = true;
    document.getElementById("nextProcedureBtn").disabled = true;
    document.getElementById("nextMedicationBtn").disabled = true;

    loadConditions();
    loadProcedures();
    loadMedications();
});
