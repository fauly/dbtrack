document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#conversion-table tbody");
    const searchInput = document.getElementById("search-input");
    const addEntryButton = document.getElementById("add-entry-button");
    const modal = document.getElementById("conversion-modal");
    const closeButton = document.querySelector(".close-button");
    const modalTitle = document.getElementById("modal-title");
    const unitInput = document.getElementById("unit");
    const referenceUnitInput = document.getElementById("reference-unit");
    const valueInput = document.getElementById("value");
    const saveButton = document.getElementById("save-button");
    const cancelButton = document.getElementById("cancel-button");
    const checkboxFilters = document.getElementById("checkbox-filters");

    let conversionData = [];
    let editingIndex = null;
    let sortOrder = {};
    let activeFilters = [];

    // Ensure modal is hidden by default
    modal.style.display = "none";

    async function fetchConversions() {
        try {
            const response = await fetch("/api/quantity-conversions/");
            conversionData = await response.json();
            generateCheckboxFilters();
            renderTable();
        } catch (error) {
            console.error("Error fetching conversions:", error);
        }
    }

    function generateCheckboxFilters() {
        const uniqueUnits = [...new Set(conversionData.map(item => item.reference_unit_name))];
        checkboxFilters.innerHTML = uniqueUnits
            .map(
                unit => `
                <label>
                    <input type="checkbox" value="${unit}" checked>
                    ${unit}
                </label>`
            )
            .join("");
        activeFilters = uniqueUnits;

        // Event listener for checkboxes
        checkboxFilters.querySelectorAll("input").forEach(checkbox => {
            checkbox.addEventListener("change", handleCheckboxChange);
        });
    }

    function handleCheckboxChange() {
        activeFilters = Array.from(checkboxFilters.querySelectorAll("input:checked")).map(
            checkbox => checkbox.value
        );
        renderTable();
    }

    function renderTable() {
        tableBody.innerHTML = "";
        const filteredData = conversionData
            .filter(item =>
                item.unit_name.toLowerCase().includes(searchInput.value.toLowerCase()) &&
                activeFilters.includes(item.reference_unit_name)
            )
            .sort((a, b) => {
                const { column, order } = sortOrder;
                if (!column) return 0;
                if (a[column] < b[column]) return order === "asc" ? -1 : 1;
                if (a[column] > b[column]) return order === "asc" ? 1 : -1;
                return 0;
            });

        filteredData.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="editable" data-field="unit_name" data-id="${item.id}">${item.unit_name}</td>
                <td class="editable" data-field="reference_unit_amount" data-id="${item.id}">${item.reference_unit_amount}</td>
                <td class="editable" data-field="reference_unit_name" data-id="${item.id}">${item.reference_unit_name}</td>
                <td>
                    <button data-id="${item.id}" class="edit-button">✏️</button>
                    <button data-id="${item.id}" class="delete-button">🗑️</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Add double-click handlers to editable cells
        document.querySelectorAll('.editable').forEach(cell => {
            cell.addEventListener('dblclick', handleCellDblClick);
        });
    }

    function handleCellDblClick(e) {
        const cell = e.target;
        const originalValue = cell.textContent;
        const field = cell.dataset.field;
        const id = cell.dataset.id;

        // Create input element
        const input = document.createElement('input');
        input.type = field === 'reference_unit_amount' ? 'number' : 'text';
        input.value = originalValue;
        input.style.width = '90%';

        // Replace cell content with input
        cell.textContent = '';
        cell.appendChild(input);
        input.focus();

        // Handle input blur (when focus is lost)
        input.addEventListener('blur', async () => {
            const newValue = input.value.trim();
            
            if (newValue !== originalValue) {
                try {
                    const item = conversionData.find(i => i.id === parseInt(id));
                    if (!item) throw new Error('Item not found');

                    const updatedData = {
                        unit_name: item.unit_name,
                        reference_unit_name: item.reference_unit_name,
                        reference_unit_amount: item.reference_unit_amount
                    };

                    // Update the specific field
                    if (field === 'reference_unit_amount') {
                        updatedData[field] = parseFloat(newValue);
                    } else {
                        updatedData[field] = newValue;
                    }

                    const response = await fetch(
                        `/api/quantity-conversions/${item.unit_name}`,
                        {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(updatedData)
                        }
                    );

                    if (!response.ok) throw new Error('Failed to update');

                    // Refresh data
                    fetchConversions();
                } catch (error) {
                    console.error('Error updating value:', error);
                    cell.textContent = originalValue; // Revert on error
                    return;
                }
            } else {
                cell.textContent = originalValue; // No change made
            }
        });

        // Handle Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
    }

    function openModal(editIndex = null) {
        editingIndex = editIndex;
        modalTitle.textContent = editingIndex !== null ? "Edit Conversion" : "Add Conversion";
        const entry = editingIndex !== null
            ? conversionData[editingIndex]
            : { unit_name: "", reference_unit_name: "", reference_unit_amount: "" };
        unitInput.value = entry.unit_name;
        referenceUnitInput.value = entry.reference_unit_name;
        valueInput.value = entry.reference_unit_amount;
        modal.style.display = "block";
    }

        // Close modal when clicking outside the content
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

    function closeModal() {
        modal.style.display = "none";
        editingIndex = null;
    }

    async function saveEntry() {
        const newEntry = {
            unit_name: unitInput.value.trim(),
            reference_unit_name: referenceUnitInput.value.trim(),
            reference_unit_amount: parseFloat(valueInput.value),
        };

        if (!newEntry.unit_name || !newEntry.reference_unit_name || isNaN(newEntry.reference_unit_amount)) {
            alert("All fields are required and 'reference unit amount' must be a valid number.");
            return;
        }

        console.log("Saving entry:", newEntry);

        try {
            if (editingIndex !== null) {
                // Update existing entry
                const response = await fetch(
                    `/api/quantity-conversions/${conversionData[editingIndex].unit_name}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newEntry),
                    }
                );
                if (!response.ok) throw new Error("Failed to update conversion.");
            } else {
                // Add new entry
                const response = await fetch("/api/quantity-conversions/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newEntry),
                });
                if (!response.ok) throw new Error("Failed to add conversion.");
            }

            closeModal();
            fetchConversions();
        } catch (error) {
            console.error("Error saving entry:", error);
            alert("Failed to save the entry. Check the console for details.");
        }
    }

    function handleColumnClick(e) {
        const column = e.target.dataset.column;
        if (!column) return;

        const order = sortOrder.column === column && sortOrder.order === "asc" ? "desc" : "asc";
        sortOrder = { column, order };
        renderTable();
    }

    // Add sorting event listeners
    document.querySelectorAll("#conversion-table th").forEach(th => {
        th.addEventListener("click", handleColumnClick);
    });

    searchInput.addEventListener("input", renderTable);
    addEntryButton.addEventListener("click", () => openModal());
    saveButton.addEventListener("click", saveEntry);
    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);
    tableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("edit-button")) {
            const id = e.target.getAttribute("data-id");
            const entry = conversionData.find(item => item.id === parseInt(id));
            openModal(conversionData.indexOf(entry));
        } else if (e.target.classList.contains("delete-button")) {
            const id = e.target.getAttribute("data-id");
            fetch(`/api/quantity-conversions/${id}`, { method: "DELETE" })
                .then(() => fetchConversions())
                .catch(error => console.error("Error deleting entry:", error));
        }
    });
    

    fetchConversions();
});
