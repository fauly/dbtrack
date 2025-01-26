document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("date-input");
    const reportContainer = document.getElementById("report-form");
    const lastEditedElement = document.getElementById("last-edited");
    const today = formatDate(new Date());
    dateInput.value = today;

    // Fetch and populate the report for a specific date
    async function fetchReport(date) {
        try {
            const response = await fetch(`/api/daily-report?date=${date}`);
            const data = await response.json();

            if (data.error) {
                reportContainer.innerHTML = `<p>${data.error}</p>`;
                return;
            }

            lastEditedElement.textContent = `Last edited: ${
                data.last_edited ? new Date(data.last_edited).toLocaleString() : "Not yet edited"
            }`;

            populateForm(data);
        } catch (error) {
            console.error("Error fetching report:", error);
        }
    }

    // Populate the form dynamically
    function populateForm(data) {
        reportContainer.innerHTML = "";

        // Temperature Table
        const tempTable = document.createElement("table");
        tempTable.innerHTML = `<tr><th>Time</th><th>Fridge Temperature</th><th>Freezer Temperature</th></tr>`;

        ["8", "9", "10", "11", "12", "1", "2", "3", "4"].forEach((hour) => {
            const row = document.createElement("tr");
            const fridgeTemp = data.temperatures[`fridge_${hour}`] || "";
            const freezerTemp = data.temperatures[`freezer_${hour}`] || "";

            row.innerHTML = `
                <td>${hour}:00</td>
                <td><input type="text" data-field="temperatures" data-key="fridge_${hour}" value="${fridgeTemp}"></td>
                <td><input type="text" data-field="temperatures" data-key="freezer_${hour}" value="${freezerTemp}"></td>
            `;
            tempTable.appendChild(row);
        });

        reportContainer.appendChild(tempTable);

        // Additional Checkboxes
        const checkboxSection = document.createElement("div");
        checkboxSection.innerHTML = `
            <h3>Additional Checks</h3>
            ${renderCheckbox("Opening Clean", "opening_clean", data.opening_clean)}
            ${renderCheckbox("Midday Clean", "midday_clean", data.midday_clean)}
            ${renderCheckbox("End of Day Clean", "end_of_day_clean", data.end_of_day_clean)}
            ${renderCheckbox("Grey Water Emptied", "grey_water", data.grey_water)}
            ${renderCheckbox("Bin Emptied", "bin_emptied", data.bin_emptied)}
        `;
        reportContainer.appendChild(checkboxSection);
    }

    // Render individual checkbox with timestamp
    function renderCheckbox(label, field, timestamp) {
        const checked = Boolean(timestamp);
        const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : "";

        return `
            <div>
                <label>
                    <input type="checkbox" data-field="${field}" ${checked ? "checked" : ""}>
                    ${label} ${checked ? `<span class="completion-time">${formattedTime}</span>` : ""}
                </label>
            </div>
        `;
    }

    // Update field in the database
    async function updateField(field, value, date) {
        try {
            const response = await fetch("/api/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field, value, date }),
            });
            const result = await response.json();
            if (result.success) {
                showNotification("Data saved successfully!");
                lastEditedElement.textContent = `Last edited: ${new Date(result.last_edited).toLocaleString()}`;
            } else {
                console.error("Failed to update:", result.error);
            }
        } catch (error) {
            console.error("Error updating field:", error);
        }
    }

    // Handle date change
    dateInput.addEventListener("change", () => {
        const selectedDate = dateInput.value;
        fetchReport(selectedDate);
    });

    // Handle form changes
    reportContainer.addEventListener("change", (e) => {
        if (e.target.tagName === "INPUT") {
            const field = e.target.dataset.field;
            const key = e.target.dataset.key;
            const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
            const selectedDate = dateInput.value;

            if (field === "temperatures") {
                updateField(field, { [key]: value }, selectedDate);
            } else {
                updateField(field, value ? new Date().toISOString() : null, selectedDate);
            }
        }
    });

    // Fetch today's report on load
    fetchReport(today);
});
