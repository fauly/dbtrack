document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("date-input");
    const reportContainer = document.getElementById("report-form");
    const lastEditedElement = document.getElementById("last-edited");
    const reportDateElement = document.getElementById("report-date");
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;

    async function fetchReport(date) {
        try {
            const response = await fetch(`/api/daily-report?date=${date}`);
            const data = await response.json();

            if (data.error) {
                reportDateElement.textContent = `No report found for ${date}`;
                reportContainer.innerHTML = `<p>${data.error}</p>`;
                return;
            }

            reportDateElement.textContent = `Report for ${date}`;
            lastEditedElement.textContent = `Last edited: ${
                data.last_edited ? new Date(data.last_edited).toLocaleString() : "Not yet edited"
            }`;

            populateForm(data);
        } catch (error) {
            console.error("Error fetching report:", error);
        }
    }

    function populateForm(data) {
        reportContainer.style.display = "block";
        reportContainer.innerHTML = "";

        // Add a table for temperatures
        const table = document.createElement("table");
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Fridge Temperature</th>
                    <th>Freezer Temperature</th>
                </tr>
            </thead>
            <tbody id="temp-table-body"></tbody>
        `;
        reportContainer.appendChild(table);

        const tbody = table.querySelector("#temp-table-body");
        const temperatures = data.temperatures || {};

        // Populate the temperature table
        ["8", "9", "10", "11", "12", "1", "2", "3", "4"].forEach((hour) => {
            const fridgeTempKey = `fridge_${hour}`;
            const freezerTempKey = `freezer_${hour}`;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${hour}:00</td>
                <td><input type="text" placeholder="°C" data-field="temperatures" data-subfield="${fridgeTempKey}" value="${
                temperatures[fridgeTempKey] || ""
            }"></td>
                <td><input type="text" placeholder="°C" data-field="temperatures" data-subfield="${freezerTempKey}" value="${
                temperatures[freezerTempKey] || ""
            }"></td>
            `;
            tbody.appendChild(row);
        });

        // Add cleaning tasks
        ["opening_clean", "midday_clean", "end_of_day_clean", "grey_water", "bin_emptied"].forEach((key) => {
            const div = document.createElement("div");
            div.innerHTML = `
                <label>
                    <input type="checkbox" data-field="${key}" ${data[key] ? "checked" : ""}>
                    ${key.replace(/_/g, " ")}
                </label>
            `;
            reportContainer.appendChild(div);
        });

        // Add event listeners for input updates
        document.querySelectorAll("input").forEach((input) => {
            input.addEventListener("change", (e) => {
                const field = e.target.dataset.field;
                const subfield = e.target.dataset.subfield;
                const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;

                if (subfield) {
                    // Update nested temperatures
                    updateField(field, { [subfield]: value }, dateInput.value);
                } else {
                    // Update other fields
                    updateField(field, value, dateInput.value);
                }
            });
        });
    }

    dateInput.addEventListener("change", () => {
        fetchReport(dateInput.value);
    });

    fetchReport(today);
});
