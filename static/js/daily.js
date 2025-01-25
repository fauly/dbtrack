console.log('Daily.js loaded')

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/api/daily-report");
        const data = await response.json();
        loadFormData(data);

        // Add event listeners after DOM is fully loaded
        document.querySelectorAll("input").forEach((input) => {
            input.addEventListener("change", (e) => {
                const field = e.target.dataset.field;
                const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
                updateField(field, value);
            });
        });
    } catch (error) {
        console.error("Error initializing daily report:", error);
    }
});


let timeout;
async function updateField(field, value) {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
        console.log(`Updating field ${field} with value ${value}`); // Debugging
        try {
            const response = await fetch("/api/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field, value }),
            });
            const result = await response.json();
            console.log("Update result:", result); // Debugging
            if (!result.success) {
                console.error("Failed to save data.");
            }
        } catch (error) {
            console.error("Error updating field:", error);
        }
    }, 300);
}


function loadFormData(data) {
    document.querySelectorAll("input[type='text']").forEach((input) => {
        const key = input.dataset.field;
        if (data[key]) {
            input.value = data[key];
            console.log(`Setting text field ${key} to value ${data[key]}`); // Debugging
        }
    });
    document.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
        const key = checkbox.dataset.field;
        if (data[key] !== undefined) {
            checkbox.checked = data[key] === true || data[key] === "true";
            console.log(`Setting checkbox ${key} to checked ${checkbox.checked}`); // Debugging
        }
    });
}

document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", (e) => {
        const field = e.target.dataset.field;
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        updateField(field, value);
    });
});
