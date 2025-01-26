document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("date-input");
    const reportContainer = document.getElementById("report-form");
    const lastEditedElement = document.getElementById("last-edited");
    const today = formatDate(new Date());
    dateInput.value = today;

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
            <label>
                <input type="checkbox" data-field="opening_clean" ${
                    data.opening_clean ? "checked" : ""
                }> Opening Clean
            </label>
            <br>
            <label>
                <input type="checkbox" data-field="midday_clean" ${
                    data.midday_clean ? "checked" : ""
                }> Midday Clean
            </label>
            <br>
            <label>
                <input type="checkbox" data-field="end_of_day_clean" ${
                    data.end_of_day_clean ? "checked" : ""
                }> End of Day Clean
            </label>
            <br>
            <label>
                <input type="checkbox" data-field="grey_water" ${
                    data.grey_water ? "checked" : ""
                }> Grey Water Emptied
            </label>
            <br>
            <label>
                <input type="checkbox" data-field="bin_emptied" ${
                    data.bin_emptied ? "checked" : ""
                }> Bin Emptied
            </label>
        `;
        reportContainer.appendChild(checkboxSection);
    }

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
            } else {
                console.error("Failed to update:", result.error);
            }
        } catch (error) {
            console.error("Error updating field:", error);
        }
    }

    dateInput.addEventListener("change", () => {
        const selectedDate = dateInput.value;
        fetchReport(selectedDate);
    });

    reportContainer.addEventListener("change", (e) => {
        if (e.target.tagName === "INPUT") {
            const field = e.target.dataset.field;
            const key = e.target.dataset.key;
            const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
            const selectedDate = dateInput.value;

            if (field === "temperatures") {
                updateField(field, { [key]: value }, selectedDate);
            } else {
                updateField(field, value, selectedDate);
            }
        }
    });

    fetchReport(today);
});
