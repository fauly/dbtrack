document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("/api/daily-report");
    const data = await response.json();
    loadFormData(data);
});

let timeout;
async function updateField(field, value) {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
        try {
            const response = await fetch("/api/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field, value }),
            });
            const result = await response.json();
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
        if (data[key]) input.value = data[key];
    });
    document.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
        const key = checkbox.dataset.field;
        if (data[key]) checkbox.checked = data[key] === "true";
    });
}

document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", (e) => {
        const field = e.target.dataset.field;
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        updateField(field, value);
    });
});
