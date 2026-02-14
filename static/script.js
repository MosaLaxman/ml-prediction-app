const elements = {
    form: document.getElementById("predictionForm"),
    name: document.getElementById("name"),
    age: document.getElementById("age"),
    attendance: document.getElementById("attendance_rate"),
    academic: document.getElementById("academic_percentage"),
    activities: document.getElementById("activities_participation"),
    ageValue: document.getElementById("ageValue"),
    attendanceValue: document.getElementById("attendanceRateValue"),
    academicValue: document.getElementById("academicPercentageValue"),
    loading: document.getElementById("loading"),
    result: document.getElementById("result"),
    summary: document.getElementById("summary"),
    recommendations: document.getElementById("recommendations"),
    errorMessage: document.getElementById("errorMessage"),
    historyBody: document.getElementById("historyBody"),
    clearButton: document.getElementById("clearButton"),
    downloadButton: document.getElementById("downloadButton"),
    exportHistoryButton: document.getElementById("exportHistoryButton"),
};

const HISTORY_KEY = "retention_history";
let latestPrediction = null;

function syncRangeValues() {
    elements.ageValue.textContent = elements.age.value;
    elements.attendanceValue.textContent = elements.attendance.value;
    elements.academicValue.textContent = elements.academic.value;
}

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveHistory(item) {
    const history = getHistory();
    history.unshift(item);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

function renderHistory() {
    const history = getHistory();
    if (!history.length) {
        elements.historyBody.innerHTML = `<tr><td colspan="4" class="empty-history">No predictions yet.</td></tr>`;
        return;
    }

    elements.historyBody.innerHTML = history
        .map(
            (row) => `
            <tr>
                <td>${row.student_name}</td>
                <td>${row.retention_status}</td>
                <td>${row.retention_probability}%</td>
                <td>${row.risk_level}</td>
            </tr>`
        )
        .join("");
}

function toPayload() {
    return {
        name: elements.name.value.trim(),
        age: elements.age.value,
        attendance_rate: elements.attendance.value,
        academic_percentage: elements.academic.value,
        activities_participation: elements.activities.value,
    };
}

function renderPrediction(data) {
    const retained = data.retention_status === "Retained";
    const statusClass = retained ? "status-retained" : "status-not-retained";

    elements.result.innerHTML = `
        <div class="status-card ${statusClass}">
            <h3>${data.retention_status}</h3>
            <p>Retention probability: <strong>${data.retention_probability}%</strong></p>
            <p>Risk level: <strong>${data.risk_level}</strong></p>
            <div class="prob-track"><div class="prob-fill" style="width:${data.retention_probability}%"></div></div>
        </div>
    `;

    elements.summary.innerHTML = `
        <div class="summary-item"><strong>Name:</strong> ${data.student_name}</div>
        <div class="summary-item"><strong>Age:</strong> ${data.student_age}</div>
        <div class="summary-item"><strong>Attendance:</strong> ${data.attendance_rate}%</div>
        <div class="summary-item"><strong>Academic:</strong> ${data.academic_percentage}%</div>
        <div class="summary-item"><strong>Activities:</strong> ${data.activities_participation === "1" ? "Yes" : "No"}</div>
    `;

    elements.recommendations.innerHTML = (data.recommendations || [])
        .map((item) => `<li>${item}</li>`)
        .join("");
}

function clearOutput() {
    elements.result.innerHTML = "Submit a profile to view retention insights.";
    elements.summary.innerHTML = "";
    elements.recommendations.innerHTML = "";
    elements.errorMessage.textContent = "";
}

function loadPreset(type) {
    const presets = {
        "high-risk": { age: "19", attendance: "42", academic: "48", activities: "0" },
        improving: { age: "20", attendance: "74", academic: "69", activities: "1" },
        "high-performing": { age: "21", attendance: "93", academic: "89", activities: "1" },
    };
    const preset = presets[type];
    if (!preset) return;
    elements.age.value = preset.age;
    elements.attendance.value = preset.attendance;
    elements.academic.value = preset.academic;
    elements.activities.value = preset.activities;
    syncRangeValues();
}

function downloadText(filename, content, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

elements.age.addEventListener("input", syncRangeValues);
elements.attendance.addEventListener("input", syncRangeValues);
elements.academic.addEventListener("input", syncRangeValues);

document.querySelectorAll(".preset-btn").forEach((button) => {
    button.addEventListener("click", () => loadPreset(button.dataset.preset));
});

elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.loading.style.display = "flex";
    elements.errorMessage.textContent = "";
    clearOutput();

    try {
        const response = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toPayload()),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Prediction failed.");
        }

        latestPrediction = data;
        renderPrediction(data);
        saveHistory(data);
        renderHistory();
    } catch (error) {
        elements.errorMessage.textContent = error.message || "Prediction failed.";
    } finally {
        elements.loading.style.display = "none";
    }
});

elements.clearButton.addEventListener("click", () => {
    elements.form.reset();
    elements.age.value = "18";
    elements.attendance.value = "75";
    elements.academic.value = "70";
    elements.activities.value = "0";
    syncRangeValues();
    clearOutput();
    latestPrediction = null;
});

elements.downloadButton.addEventListener("click", () => {
    if (!latestPrediction) {
        elements.errorMessage.textContent = "Run a prediction before downloading a report.";
        return;
    }
    const lines = [
        "Student Retention Prediction Report",
        "",
        `Name: ${latestPrediction.student_name}`,
        `Status: ${latestPrediction.retention_status}`,
        `Probability: ${latestPrediction.retention_probability}%`,
        `Risk: ${latestPrediction.risk_level}`,
        `Attendance: ${latestPrediction.attendance_rate}%`,
        `Academic: ${latestPrediction.academic_percentage}%`,
        `Activities: ${latestPrediction.activities_participation === "1" ? "Yes" : "No"}`,
        "",
        "Recommendations:",
        ...latestPrediction.recommendations.map((item) => `- ${item}`),
    ];
    downloadText("student_retention_report.txt", lines.join("\n"), "text/plain");
});

elements.exportHistoryButton.addEventListener("click", () => {
    const history = getHistory();
    if (!history.length) {
        elements.errorMessage.textContent = "No history available to export.";
        return;
    }

    const header = "name,status,probability,risk";
    const rows = history.map(
        (h) =>
            `"${h.student_name.replace(/"/g, '""')}","${h.retention_status}",${h.retention_probability},"${h.risk_level}"`
    );
    downloadText("retention_history.csv", [header, ...rows].join("\n"), "text/csv");
});

syncRangeValues();
renderHistory();
