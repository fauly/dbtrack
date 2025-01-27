document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#ingredient-table tbody");
    const searchInput = document.getElementById("search-input");
    const addEntryButton = document.getElementById("add-entry-button");
    const modal = document.getElementById("ingredient-modal");
    const closeButton = document.querySelector(".close-button");
    const modalTitle = document.getElementById("modal-title");
    const formInputs = {
        name: document.getElementById("name"),
        allergens: document.getElementById("allergens"),
        dietaryMentions: document.getElementById("dietary-mentions"),
        source: document.getElementById("source"),
        leadTime: document.getElementById("lead-time"),
        quantity: document.getElementById("quantity"),
        unit: document.getElementById("unit"),
        cost: document.getElementById("cost"),
    };
    const saveButton = document.getElementById("save-button");
    const cancelButton = document.getElementById("cancel-button");

    let ingredientData = [];
    let editingIndex = null;

    // Ensure modal is hidden by default
    modal.style.display = "none";

    const allergens = ["Dairy", "Egg", "Gluten", "Peanut", "Soy", "Tree Nuts", "Shellfish"];
    const dietaryMentions = ["Vegan", "Vegetarian", "Dairy-Free", "Gluten-Free"];
    
    function populateAllergensAndDietary() {
        const allergenContainer = document.getElementById("allergen-buttons");
        const dietaryContainer = document.getElementById("dietary-buttons");
    
        allergens.forEach(allergen => {
            const button = document.createElement("button");
            button.className = "toggle-button";
            button.textContent = allergen;
            button.addEventListener("click", () => button.classList.toggle("active"));
            allergenContainer.appendChild(button);
        });
    
        dietaryMentions.forEach(mention => {
            const button = document.createElement("button");
            button.className = "toggle-button";
            button.textContent = mention;
            button.addEventListener("click", () => button.classList.toggle("active"));
            dietaryContainer.appendChild(button);
        });
    }    

    async function populateUnits() {
        try {
            const response = await fetch("/api/quantity-conversions/");
            const units = await response.json();
            const unitList = document.getElementById("unit-list");
    
            unitList.innerHTML = ""; // Clear existing options
            units.forEach(unit => {
                const option = document.createElement("option");
                option.value = unit.unit_name;
                unitList.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching units:", error);
        }
    }
    

    async function fetchIngredients() {
        try {
            const response = await fetch("/api/ingredients/");
            ingredientData = await response.json();
            renderTable();
        } catch (error) {
            console.error("Error fetching ingredients:", error);
        }
    }

    function renderTable() {
        tableBody.innerHTML = "";
        const filteredData = ingredientData.filter(item =>
            item.name.toLowerCase().includes(searchInput.value.toLowerCase())
        );

        filteredData.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.allergens || "None"}</td>
                <td>${item.dietary_mentions || "None"}</td>
                <td>${item.source || "Unknown"}</td>
                <td>${item.lead_time || "Unknown"}</td>
                <td>${item.quantity || 0} ${item.unit || ""}</td>
                <td>${item.cost || 0}</td>
                <td>${item.reference_cost || "N/A"}</td>
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
        modalTitle.textContent = editingIndex !== null ? "Edit Ingredient" : "Add Ingredient";
    
        if (editingIndex !== null) {
            const entry = ingredientData[editingIndex];
            for (const key in formInputs) {
                if (formInputs[key]) { // Ensure the input exists
                    formInputs[key].value = entry[key] || "";
                }
            }
        } else {
            for (const key in formInputs) {
                if (formInputs[key]) { // Ensure the input exists
                    formInputs[key].value = "";
                }
            }
        }
    
        modal.style.display = "block";
    }
    

    function closeModal() {
        modal.style.display = "none";
        editingIndex = null;
    }

    async function saveEntry() {
        const newEntry = {};
        const selectedAllergens = Array.from(document.querySelectorAll("#allergen-buttons .toggle-button.active"))
            .map(button => button.textContent);
        const selectedDietary = Array.from(document.querySelectorAll("#dietary-buttons .toggle-button.active"))
            .map(button => button.textContent);
    
        // Gather values from form inputs
        for (const key in formInputs) {
            const value = formInputs[key].value.trim();
            newEntry[key] = isNaN(value) || value === "" ? value : parseFloat(value);
        }
    
        // Add allergens and dietary mentions to the entry
        newEntry.allergens = selectedAllergens.join(", "); // Save as a comma-separated string
        newEntry.dietary_mentions = selectedDietary.join(", "); // Save as a comma-separated string
    
        // Validate required fields
        if (!newEntry.name) {
            alert("Ingredient name is required.");
            return;
        }
    
        try {
            // Determine if this is an edit or a new entry
            if (editingIndex !== null) {
                const response = await fetch(`/api/ingredients/${ingredientData[editingIndex].id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newEntry),
                });
                if (!response.ok) throw new Error("Failed to update ingredient.");
            } else {
                const response = await fetch("/api/ingredients/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newEntry),
                });
                if (!response.ok) throw new Error("Failed to add ingredient.");
            }
    
            closeModal();
            fetchIngredients(); // Refresh the table
        } catch (error) {
            console.error("Error saving entry:", error);
            alert("Failed to save the entry. Check the console for details.");
        }
    }
    
    searchInput.addEventListener("input", renderTable);
    addEntryButton.addEventListener("click", () => openModal());
    saveButton.addEventListener("click", saveEntry);
    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);
    tableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("edit-button")) {
            openModal(parseInt(e.target.dataset.index));
        } else if (e.target.classList.contains("delete-button")) {
            const id = ingredientData[parseInt(e.target.dataset.index)].id;
            fetch(`/api/ingredients/${id}`, { method: "DELETE" })
                .then(() => fetchIngredients())
                .catch(error => console.error("Error deleting entry:", error));
        }
    });

    populateUnits(); // Populate units when the page loads
    fetchIngredients();
});
