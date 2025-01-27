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

    // Ensure modal is hidden by default
    modal.style.display = "none";

    async function fetchConversions() {
        try {
            const response = await fetch("/api/quantity-conversions/");
            conversionData = await response.json();
            renderTable();
        } catch (error) {
            console.error("Error fetching conversions:", error);
        }
    }

    function renderTable() {
        tableBody.innerHTML = "";
        const filteredData = conversionData.filter(item =>
            item.unit_name.toLowerCase().includes(searchInput.value.toLowerCase())
        );

        filteredData.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.unit_name}</td>
                <td>${item.reference_unit_amount}</td>
                <td>${item.reference_unit_name}</td>
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
            unit_name: unitInput.value.trim(),
            reference_unit_name: referenceUnitInput.value.trim(),
            reference_unit_amount: parseFloat(valueInput.value),
        };
    
        if (!newEntry.unit_name || !newEntry.reference_unit_name || isNaN(newEntry.reference_unit_amount)) {
            alert("All fields are required and 'value' must be a valid number.");
            return;
        }
    
        console.log("Saving entry:", newEntry);
    
        try {
            if (editingIndex !== null) {
                // Update existing entry
                const response = await fetch(`/api/quantity-conversions/${conversionData[editingIndex].unit_name}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newEntry),
                });
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
    
    searchInput.addEventListener("input", renderTable);
    addEntryButton.addEventListener("click", () => openModal());
    saveButton.addEventListener("click", saveEntry);
    cancelButton.addEventListener("click", closeModal);
    tableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("edit-button")) {
            openModal(parseInt(e.target.dataset.index));
        } else if (e.target.classList.contains("delete-button")) {
            const unit = conversionData[parseInt(e.target.dataset.index)].unit;
            fetch(`/api/quantity-conversions/${unit}`, { method: "DELETE" })
                .then(() => fetchConversions())
                .catch(error => console.error("Error deleting entry:", error));
        }
    });

    fetchConversions();
});
