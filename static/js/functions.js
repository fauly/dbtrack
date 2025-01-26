async function updateField(field, value) {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
        try {
            const response = await fetch("/api/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field, value, date: new Date().toISOString().split("T")[0] }),
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
