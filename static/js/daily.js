document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/api/daily-report");
        const data = await response.json();
        loadFormData(data);
        setupInputListeners(new Date().toISOString().split("T")[0]);
    } catch (error) {
        console.error("Error initializing daily report:", error);
    }
});
