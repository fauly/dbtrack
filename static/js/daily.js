document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("date-input");
    const reportContainer = document.getElementById("report-container");
    const lastEditedElement = document.getElementById("last-edited");

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

            reportContainer.innerHTML = "";
            const tempTable = createTemperatureTable(data);
            reportContainer.appendChild(tempTable);
        } catch (error) {
            console.error("Error fetching report:", error);
        }
    }

    dateInput.addEventListener("change", () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            alert("Please select a date.");
            return;
        }
        fetchReport(selectedDate);
    });

    // Load today's report by default
    fetchReport(new Date().toISOString().split("T")[0]);
});
