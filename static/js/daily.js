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
                if (e.target.type === "checkbox") handleCheckboxDisplay(e.target, e.target.checked);
                updateField(field, value);
            });
        });
    } catch (error) {
        console.error("Error initializing daily report:", error);
    }
});

function handleCheckboxDisplay(checkbox, isChecked) {
    const label = document.querySelector(`label[for="${checkbox.id}"]`);
    const time = new Date().toLocaleTimeString();
    if (isChecked) {
        label.classList.add("strike");
        label.innerHTML += `<span class="completion-time">(${time})</span>`;
    } else {
        label.classList.remove("strike");
        label.querySelector(".completion-time")?.remove();
    }
}

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
                console.error("Failed to save data:", result.error);
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
        checkbox.checked = data[key] === true || data[key] === "true";
        handleCheckboxDisplay(checkbox, checkbox.checked);
    });
}
