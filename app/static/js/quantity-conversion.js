document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#conversion-table tbody");
    const searchInput = document.getElementById("search-input");
    const addEntryButton = document.getElementById("add-entry-button");
    const modal = document.getElementById("conversion-modal");
    const modalTitle = document.getElementById("modal-title");
    const unitInput = document.getElementById("unit");
    const referenceUnitInput = document.getElementById("reference-unit");
    const valueInput = document.getElementById("value");
    const saveButton = document.getElementById("save-button");
    const cancelButton = document.getElementById("cancel-button");

    let conversionData = [];
    let editingIndex = null;

    async function fetchConversions() {
        try {
            const response = await fetch("/api/quantity-conversions");
            conversionData = await response.json();
            renderTable();
        } catch (error) {
            console.error("Error fetching conversions:", error);
        }
    }

    function renderTable() {
        tableBody.innerHTML = "";
        const filteredData = conversionData.filter(item =>
            item.unit.toLowerCase().includes(searchInput.value.toLowerCase())
        );

        filteredData.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.unit}</td>
                <td>${item.reference_unit}</td>
                <td>${item.value}</td>
                <td>
                    <button data-index="${index}" class="edit-button">Edit</button>
                    <button data-index="${index}" class="delete-button">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function openModal(editIndex = null) {
        editingIndex = editIndex;
        modalTitle.textContent = editingIndex !== null ? "Edit Conversion" : "Add Conversion";
        const entry = editingIndex !== null ? conversionData[editingIndex] : { unit: "", reference_unit: "", value: "" };
        unitInput.value = entry.unit;
        referenceUnitInput.value = entry.reference_unit;
        valueInput.value = entry.value;
        modal.style.display = "block";
    }

    function closeModal() {
        modal.style.display = "none";
        editingIndex = null;
    }

    async function saveEntry() {
        const newEntry = {
            unit: unitInput.value,
            reference_unit: referenceUnitInput.value,
            value: parseFloat(valueInput.value),
        };

        if (editingIndex !== null) {
            // Update existing entry
            conversionData[editingIndex] = newEntry;
        } else {
            // Add new entry
            conversionData.push(newEntry);
        }

        closeModal();
        renderTable();

        try {
            await fetch("/api/quantity-conversions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(conversionData),
            });
        } catch (error) {
            console.error("Error saving entry:", error);
        }
    }

    async function deleteEntry(index) {
        conversionData.splice(index, 1);
        renderTable();

        try {
            await fetch("/api/quantity-conversions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(conversionData),
            });
        } catch (error) {
            console.error("Error deleting entry:", error);
        }
    }

    searchInput.addEventListener("input", renderTable);
    addEntryButton.addEventListener("click", () => openModal());
    saveButton.addEventListener("click", saveEntry);
    cancelButton.addEventListener("click", closeModal);
    tableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("edit-button")) {
            openModal(parseInt(e.target.dataset.index));
        } else if (e.target.classList.contains("delete-button")) {
            deleteEntry(parseInt(e.target.dataset.index));
        }
    });

    fetchConversions();
});
