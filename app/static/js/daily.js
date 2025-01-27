document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("date-input");
    const reportContainer = document.getElementById("report-form");
    const lastEditedElement = document.getElementById("last-edited");
    const prevDateButton = document.getElementById("prev-date");
    const nextDateButton = document.getElementById("next-date");
    const today = formatDate(new Date());
    dateInput.value = today;

    function getAdjacentDate(currentDate, days) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + days);
        return formatDate(date);
    }    

    async function fetchReport(date) {
        try {
            const response = await fetch(`/api/daily-report?date=${date}`);
            const data = await response.json();

            if (data.error) {
                reportContainer.innerHTML = `<p>${data.error}</p>`;
                return;
            }

            lastEditedElement.textContent = `Last edited: ${
                data.last_edited ? new Date(data.last_edited).toLocaleString() : "Not yet edited"
            }`;

            populateForm(data);
        } catch (error) {
            console.error("Error fetching report:", error);
        }
    }

    function populateForm(data) {
        reportContainer.innerHTML = "";

        // Temperature Table
        const tempTable = document.createElement("table");
        tempTable.innerHTML = `<tr><th>Time</th><th>Fridge Temperature</th><th>Freezer Temperature</th></tr>`;

        ["8", "9", "10", "11", "12", "1", "2", "3", "4"].forEach((hour) => {
            const row = document.createElement("tr");
            const fridgeTemp = data.temperatures[`fridge_${hour}`] || "";
            const freezerTemp = data.temperatures[`freezer_${hour}`] || "";            

            row.innerHTML = `
                <td>${hour}:00</td>
                <td><input type="text" data-field="temperatures" data-key="fridge_${hour}" value="${fridgeTemp}"></td>
                <td><input type="text" data-field="temperatures" data-key="freezer_${hour}" value="${freezerTemp}"></td>
            `;
            tempTable.appendChild(row);
        });

        reportContainer.appendChild(tempTable);

        // // Stock Usage Section
        // const stockSection = document.createElement("div");
        // stockSection.innerHTML = `<h3>Stock Usage</h3>`;
        // ["Pastries", "Coffee Beans", "Tea Bags", "Protein Shake Powder"].forEach((item) => {
        //     const stockValue = data.stock_used[item] || "";
        //     stockSection.innerHTML += `
        //         <div>
        //             <label>${item}:</label>
        //             <input type="number" data-field="stock_used" data-key="${item}" value="${stockValue}">
        //         </div>
        //     `;
        // });
        // reportContainer.appendChild(stockSection);

        // // Food Waste Section
        // const wasteSection = document.createElement("div");
        // wasteSection.innerHTML = `
        //     <h3>Food Waste</h3>
        //     <label>Amount of Food Waste (grams):</label>
        //     <input type="number" data-field="food_waste" value="${data.food_waste || ""}">
        // `;
        // reportContainer.appendChild(wasteSection);

    // Additional notes Section
    const notesSection = document.createElement("div");
    notesSection.innerHTML = `
        <h3>Additional Notes</h3>
        <textarea data-field="additional_notes" rows="4">${data.additional_notes || ""}</textarea>
    `;
    reportContainer.appendChild(notesSection);

        // Customer Feedback Section
        const feedbackSection = document.createElement("div");
        feedbackSection.innerHTML = `
            <h3>Customer Feedback</h3>
            <textarea data-field="customer_feedback" rows="4">${data.customer_feedback || ""}</textarea>
        `;
        reportContainer.appendChild(feedbackSection);

        // Equipment Issues Section
        const equipmentSection = document.createElement("div");
        equipmentSection.innerHTML = `
            <h3>Equipment Issues</h3>
            <textarea data-field="equipment_issues" rows="4">${data.equipment_issues || ""}</textarea>
        `;
        reportContainer.appendChild(equipmentSection);
        // Additional Checkboxes
        const checkboxSection = document.createElement("div");
        checkboxSection.innerHTML = `<h3>Additional Checks</h3>`;
        const checks = [
            { field: "opening_clean", label: "Opening Clean" },
            { field: "midday_clean", label: "Midday Clean" },
            { field: "end_of_day_clean", label: "End of Day Clean" },
            { field: "grey_water", label: "Grey Water Emptied" },
            { field: "bin_emptied", label: "Bin Emptied" },
        ];

        checks.forEach(({ field, label }) => {
            const isChecked = !!data[field];
            const completionTime = isChecked ? new Date(data[field]).toLocaleTimeString() : "";
            const checkboxId = `checkbox-${field}`;

            const checkboxHTML = `
                <div>
                    <label for="${checkboxId}" class="${isChecked ? "strike" : ""}">
                        <input type="checkbox" id="${checkboxId}" data-field="${field}" ${isChecked ? "checked" : ""}>
                        ${label}
                    </label>
                    ${isChecked ? `<span class="completion-time">(${completionTime})</span>` : ""}
                </div>
            `;
            checkboxSection.innerHTML += checkboxHTML;
        });

        reportContainer.appendChild(checkboxSection);
    }

    async function updateField(field, value, date) {
        try {
            const response = await fetch("/api/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field, value, date }),
            });
            const result = await response.json();
            if (result.success) {
                showNotification("Data saved successfully!");

                // If the field is a checkbox, update its UI dynamically
                if (["opening_clean", "midday_clean", "end_of_day_clean", "grey_water", "bin_emptied"].includes(field)) {
                    const checkboxLabel = document.querySelector(`label[for="checkbox-${field}"]`);
                    const completionTime = value ? new Date().toLocaleTimeString() : "";
                    if (checkboxLabel) {
                        checkboxLabel.classList.toggle("strike", value);
                        const completionSpan = checkboxLabel.nextElementSibling;
                        if (completionSpan) {
                            completionSpan.textContent = value ? `(${completionTime})` : "";
                        } else if (value) {
                            const timeSpan = document.createElement("span");
                            timeSpan.className = "completion-time";
                            timeSpan.textContent = `(${completionTime})`;
                            checkboxLabel.after(timeSpan);
                        }
                    }
                }
            } else {
                console.error("Failed to update:", result.error);
            }
        } catch (error) {
            console.error("Error updating field:", error);
        }
    }

    dateInput.addEventListener("change", () => {
        const selectedDate = dateInput.value;
        fetchReport(selectedDate);
    });

    reportContainer.addEventListener("change", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
            const field = e.target.dataset.field;
            const key = e.target.dataset.key;
            const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
            const selectedDate = dateInput.value;
    
            // if (field === "stock_used") {
            //     updateField(field, { [key]: value }, selectedDate);
            // } else {
            //     updateField(field, value, selectedDate);
            // }
        }
    });    

    prevDateButton.addEventListener("click", () => {
        const currentDate = dateInput.value;
        const newDate = getAdjacentDate(currentDate, -1);
        dateInput.value = newDate;
        fetchReport(newDate);
    });
    
    nextDateButton.addEventListener("click", () => {
        const currentDate = dateInput.value;
        const newDate = getAdjacentDate(currentDate, 1);
        dateInput.value = newDate;
        fetchReport(newDate);
    });
    
    fetchReport(today);
});
