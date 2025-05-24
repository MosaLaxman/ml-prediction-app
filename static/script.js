// Update range values in real-time
document.getElementById("age").addEventListener("input", function () {
    document.getElementById("ageValue").textContent = this.value;
});

document.getElementById("attendance_rate").addEventListener("input", function () {
    document.getElementById("attendanceRateValue").textContent = this.value;
});

document.getElementById("academic_percentage").addEventListener("input", function () {
    document.getElementById("academicPercentageValue").textContent = this.value;
});

// Form submission
document.getElementById("predictionForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    // Show loading state
    document.getElementById("loading").style.display = "block";
    document.getElementById("result").innerHTML = "";
    document.getElementById("summary").innerHTML = "";

    const formData = {
        name: document.getElementById("name").value,
        age: document.getElementById("age").value,
        attendance_rate: document.getElementById("attendance_rate").value,
        academic_percentage: document.getElementById("academic_percentage").value,
        activities_participation: document.getElementById("activities_participation").value
    };

    try {
        const response = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        // Display result with status badge
        const statusClass = data.retention_status === "Retained"
            ? "status-retained"
            : "status-not-retained";

        document.getElementById("result").innerHTML = `
            <div class="status-badge ${statusClass}">
                ${data.retention_status}
            </div>
        `;

        // Display detailed summary
        document.getElementById("summary").innerHTML = `
            <h3>Student Summary</h3>
            <p>Name: ${data.student_name}</p>
            <p>Age: ${data.student_age}</p>
            <p>Attendance: ${data.attendance_rate}%</p>
            <p>Academic: ${data.academic_percentage}%</p>
            <p>Activities: ${data.activities_participation === "1" ? "Yes" : "No"}</p>
        `;

    } catch (error) {
        console.error("Prediction error:", error);
    } finally {
        document.getElementById("loading").style.display = "none";
    }
});

// Clear form
document.getElementById("clearButton").addEventListener("click", function () {
    document.getElementById("predictionForm").reset();
    document.getElementById("ageValue").textContent = "18";
    document.getElementById("attendanceRateValue").textContent = "0";
    document.getElementById("academicPercentageValue").textContent = "0";
    document.getElementById("result").innerHTML = "";
    document.getElementById("summary").innerHTML = "";
});

// Download report
document.getElementById("downloadButton").addEventListener("click", function () {
    const result = document.getElementById("result").textContent;
    const summary = document.getElementById("summary").innerText;

    const report = `Student Retention Prediction Report\n\n${result}\n\n${summary}`;
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "student_retention_report.txt";
    a.click();
    URL.revokeObjectURL(url);
});