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
                if (!column) return 0; // No sorting applied
                if (a[column] < b[column]) return order === "asc" ? -1 : 1;
                if (a[column] > b[column]) return order === "asc" ? 1 : -1;
                return 0;
            });

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

    fetchConversions();
});
