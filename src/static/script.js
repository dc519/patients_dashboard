// ---------- FILTER INFO DIV ----------
const filterInfoDiv = document.createElement("div");
filterInfoDiv.id = "filter-info";
filterInfoDiv.className = "filter-info";
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

// ---------- DROPDOWN CHANGE HANDLERS (Mutual Exclusivity) ----------
document.getElementById("dropdown1").addEventListener("change", () => {
    const dropdown1 = document.getElementById("dropdown1");
    if (dropdown1.value) {
        // Reset other dropdowns and disable their buttons
        document.getElementById("dropdown2").value = "";
        document.getElementById("dropdown3").value = "";
        document.getElementById("nextProcedureBtn").disabled = true;
        document.getElementById("nextMedicationBtn").disabled = true;
        document.getElementById("resetProcedureBtn").style.display = "none";
        document.getElementById("resetMedicationBtn").style.display = "none";
        // Enable this dropdown's button and show reset
        document.getElementById("nextConditionBtn").disabled = false;
        document.getElementById("resetConditionBtn").style.display = "inline";
    } else {
        document.getElementById("nextConditionBtn").disabled = true;
        document.getElementById("resetConditionBtn").style.display = "none";
    }
});

document.getElementById("dropdown2").addEventListener("change", () => {
    const dropdown2 = document.getElementById("dropdown2");
    if (dropdown2.value) {
        // Reset other dropdowns and disable their buttons
        document.getElementById("dropdown1").value = "";
        document.getElementById("dropdown3").value = "";
        document.getElementById("nextConditionBtn").disabled = true;
        document.getElementById("nextMedicationBtn").disabled = true;
        document.getElementById("resetConditionBtn").style.display = "none";
        document.getElementById("resetMedicationBtn").style.display = "none";
        // Enable this dropdown's button and show reset
        document.getElementById("nextProcedureBtn").disabled = false;
        document.getElementById("resetProcedureBtn").style.display = "inline";
    } else {
        document.getElementById("nextProcedureBtn").disabled = true;
        document.getElementById("resetProcedureBtn").style.display = "none";
    }
});

document.getElementById("dropdown3").addEventListener("change", () => {
    const dropdown3 = document.getElementById("dropdown3");
    if (dropdown3.value) {
        // Reset other dropdowns and disable their buttons
        document.getElementById("dropdown1").value = "";
        document.getElementById("dropdown2").value = "";
        document.getElementById("nextConditionBtn").disabled = true;
        document.getElementById("nextProcedureBtn").disabled = true;
        document.getElementById("resetConditionBtn").style.display = "none";
        document.getElementById("resetProcedureBtn").style.display = "none";
        // Enable this dropdown's button and show reset
        document.getElementById("nextMedicationBtn").disabled = false;
        document.getElementById("resetMedicationBtn").style.display = "inline";
    } else {
        document.getElementById("nextMedicationBtn").disabled = true;
        document.getElementById("resetMedicationBtn").style.display = "none";
    }
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

// ---------- RESET FUNCTIONALITY ----------
function resetAll() {
    document.getElementById("dropdown1").value = "";
    document.getElementById("dropdown2").value = "";
    document.getElementById("dropdown3").value = "";
    document.getElementById("nextConditionBtn").disabled = true;
    document.getElementById("nextProcedureBtn").disabled = true;
    document.getElementById("nextMedicationBtn").disabled = true;
    document.getElementById("resetConditionBtn").style.display = "none";
    document.getElementById("resetProcedureBtn").style.display = "none";
    document.getElementById("resetMedicationBtn").style.display = "none";
    filterInfoDiv.textContent = "";
    document.getElementById("result").innerHTML = "";
}

document.getElementById("resetConditionBtn").addEventListener("click", resetAll);
document.getElementById("resetProcedureBtn").addEventListener("click", resetAll);
document.getElementById("resetMedicationBtn").addEventListener("click", resetAll);

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
