document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("date-input");
    const lastEditedElement = document.getElementById("last-edited");

    document.getElementById("fetch-report").addEventListener("click", async () => {
        const date = dateInput.value;
        if (!date) {
            alert("Please select a date.");
            return;
        }

        try {
            const response = await fetch(`/api/archived-report?date=${date}`);
            const data = await response.json();

            if (data.error) {
                alert(data.error);
            } else {
                loadFormData(data);
                setupInputListeners(date);
                lastEditedElement.textContent = `Last edited: ${data.last_edited || "Not yet edited"}`;
            }
        } catch (error) {
            console.error("Error fetching archived report:", error);
        }
    });
});