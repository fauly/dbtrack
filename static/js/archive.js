document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("date-input");
    const reportDate = document.getElementById("report-date");
    const lastEditedElement = document.getElementById("last-edited");
    const reportForm = document.getElementById("report-form");

    async function fetchReport(date) {
        try {
            const response = await fetch(`/api/archived-report?date=${date}`);
            const data = await response.json();

            if (data.error) {
                reportForm.style.display = "none";
                reportDate.textContent = "No report selected";
                lastEditedElement.textContent = "Last edited: Not available";
                alert(data.error);
                return;
            }

            // Display the report date and last edited timestamp
            reportDate.textContent = `Report for ${new Date(data.date).toLocaleDateString()}`;
            lastEditedElement.textContent = `Last edited: ${
                data.last_edited ? new Date(data.last_edited).toLocaleString() : "Not yet edited"
            }`;

            // Clear and populate the form dynamically
            reportForm.innerHTML = ""; // Clear previous fields
            reportForm.style.display = "block";

            Object.keys(data).forEach((key) => {
                if (key === "id" || key === "date" || key === "last_edited") {
                    // Skip non-editable fields
                    return;
                }

                const value = data[key];
                const fieldContainer = document.createElement("div");
                fieldContainer.className = "field-container";

                // Generate label
                const label = document.createElement("label");
                label.textContent = key.replace(/_/g, " ").toUpperCase() + ":";
                fieldContainer.appendChild(label);

                if (typeof value === "boolean") {
                    // Checkbox for boolean fields
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.checked = value;
                    checkbox.dataset.field = key;
                    checkbox.addEventListener("change", (e) =>
                        updateField(key, e.target.checked, date)
                    );
                    fieldContainer.appendChild(checkbox);
                } else {
                    // Textbox for other fields
                    const input = document.createElement("input");
                    input.type = "text";
                    input.value = value || "";
                    input.dataset.field = key;
                    input.addEventListener("change", (e) =>
                        updateField(key, e.target.value, date)
                    );
                    fieldContainer.appendChild(input);
                }

                reportForm.appendChild(fieldContainer);
            });
        } catch (error) {
            console.error("Error fetching report:", error);
            alert("An error occurred while fetching the report.");
        }
    }

    // Attach event listener to the fetch button
    document.getElementById("fetch-report").addEventListener("click", () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            alert("Please select a date.");
            return;
        }
        fetchReport(selectedDate);
    });
});
