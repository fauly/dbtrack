function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function updateField(field, value, date = new Date().toISOString()) {
    const normalizedDate = formatDate(date); // Normalize the date
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


function createTemperatureTable(data) {
    const timeSlots = ["8", "9", "10", "11", "12", "1", "2", "3", "4"];
    const table = document.createElement("table");
    table.className = "temp-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
        <th>Time</th>
        <th>Fridge Temperature (°C)</th>
        <th>Freezer Temperature (°C)</th>
    `;
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    timeSlots.forEach((time) => {
        const row = document.createElement("tr");
        const timeCell = document.createElement("td");
        timeCell.textContent = `${time}:00`;
        row.appendChild(timeCell);

        ["fridge", "freezer"].forEach((type) => {
            const tempCell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "text";
            input.value = data.temperatures?.[`${type}_${time}`] || "";
            input.dataset.field = `${type}_${time}`;
            input.addEventListener("change", (e) => {
                updateField("temperatures", { [e.target.dataset.field]: e.target.value }, data.date);
            });
            tempCell.appendChild(input);
            row.appendChild(tempCell);
        });

        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    return table;
}
