document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("date-input");
    const reportContainer = document.getElementById("report-container");
    const lastEditedElement = document.getElementById("last-edited");
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;

    async function fetchReport(date) {
        try {
            const response = await fetch(`/api/daily-report?date=${date}`);
            const data = await response.json();

            if (data.error) {
                reportContainer.innerHTML = `<p>${data.error}</p>`;
                lastEditedElement.textContent = "Last edited: Not yet edited";
                return;
            }

            lastEditedElement.textContent = `Last edited: ${
                data.last_edited ? new Date(data.last_edited).toLocaleString() : "Not yet edited"
            }`;

            populateForm(data); // Dynamically populate fields based on data
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

    fetchReport(today);
});

async function updateField(field, value, date = new Date().toISOString().split("T")[0]) {
    if (field === "date") {
        console.error("Date field should not be updated dynamically.");
        return;
    }

    const normalizedDate = formatDate(date);
    try {
        const response = await fetch("/api/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field, value, date: normalizedDate }),
        });
        const result = await response.json();
        if (result.success) {
            console.log(`Successfully updated ${field}`);
        } else {
            console.error("Failed to update:", result.error);
        }
    } catch (error) {
        console.error("Error updating field:", error);
    }
}

function populateForm(data) {
    // Populate temperature fields
    if (data.temperatures) {
        Object.entries(data.temperatures).forEach(([key, value]) => {
            const input = document.querySelector(`[data-field="${key}"]`);
            if (input) {
                input.value = value || "";
            }
        });
    }

    // Populate checkbox fields
    document.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
        const key = checkbox.dataset.field;
        if (data[key] !== undefined) {
            checkbox.checked = data[key] === true || data[key] === "true";
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
