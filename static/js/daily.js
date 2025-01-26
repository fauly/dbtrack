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
    }

    async function updateField(field, value, date = today) {
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
        fetchReport(dateInput.value);
    });

    fetchReport(today);

    reportContainer.addEventListener("change", (e) => {
        if (e.target.tagName === "INPUT") {
            const field = e.target.dataset.field;
            const key = e.target.dataset.key;
            const value = e.target.value;
            updateField(field, { [key]: value });
        }
    });
});
