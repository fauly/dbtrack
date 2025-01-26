let timeout;

// Update a field in the database
async function updateField(field, value, date = new Date().toISOString().split("T")[0]) {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
        try {
            const response = await fetch("/api/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field, value, date }),
            });
            const result = await response.json();
            if (!result.success) {
                console.error("Failed to save data:", result.error);
            }
        } catch (error) {
            console.error("Error updating field:", error);
        }
    }, 300);
}

// Load form data into input fields
function loadFormData(data) {
    document.querySelectorAll("input[type='text']").forEach((input) => {
        const key = input.dataset.field;
        if (data[key]) input.value = data[key];
    });
    document.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
        const key = checkbox.dataset.field;
        if (data[key]) checkbox.checked = data[key] === true || data[key] === "true";
    });
}

// Add change event listeners to inputs
function setupInputListeners(date) {
    document.querySelectorAll("input").forEach((input) => {
        input.addEventListener("change", (e) => {
            const field = e.target.dataset.field;
            const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
            updateField(field, value, date);
        });
    });
}
