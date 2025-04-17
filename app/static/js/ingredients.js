document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#ingredient-table tbody");
    const searchInput = document.getElementById("search-input");
    const addEntryButton = document.getElementById("add-entry-button");
    const modal = document.getElementById("ingredient-modal");
    const closeButton = document.querySelector(".close-button");
    const modalTitle = document.getElementById("modal-title");
    const formInputs = {
        name: document.getElementById("name"),
        source: document.getElementById("source"),
        lead_time: document.getElementById("lead-time"),
        quantity: document.getElementById("quantity"),
        unit: document.getElementById("unit"),
        cost: document.getElementById("cost"),
    };
    const saveButton = document.getElementById("save-button");
    const cancelButton = document.getElementById("cancel-button");

    let ingredientData = [];
    let editingIndex = null;

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

            unitList.innerHTML = ""; 
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
                <td class="editable" data-field="name" data-id="${item.id}">${item.name}</td>
                <td class="editable" data-field="allergens" data-id="${item.id}">${item.allergens || "None"}</td>
                <td class="editable" data-field="dietary_mentions" data-id="${item.id}">${item.dietary_mentions || "None"}</td>
                <td class="editable" data-field="source" data-id="${item.id}">${item.source || "Unknown"}</td>
                <td class="editable" data-field="lead_time" data-id="${item.id}">${item.lead_time || "Unknown"}</td>
                <td class="editable" data-field="quantity" data-id="${item.id}">${item.quantity || 0}</td>
                <td class="editable" data-field="unit" data-id="${item.id}">${item.unit || ""}</td>
                <td class="editable" data-field="cost" data-id="${item.id}">${item.cost || 0}</td>
                <td>
                    <button data-index="${index}" class="edit-button">✏️</button>
                    <button data-index="${index}" class="delete-button">🗑️</button>
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

        // Clear cell content
        cell.textContent = '';

        if (field === 'allergens' || field === 'dietary_mentions') {
            // Create container for toggle buttons
            const container = document.createElement('div');
            container.className = 'grid-container';
            
            // Determine which list to use
            const items = field === 'allergens' ? allergens : dietaryMentions;
            const selectedItems = originalValue.split(',').map(item => item.trim());
            
            items.forEach(item => {
                const button = document.createElement('button');
                button.className = 'toggle-button';
                button.textContent = item;
                if (selectedItems.includes(item)) {
                    button.classList.add('active');
                }
                button.addEventListener('click', () => button.classList.toggle('active'));
                container.appendChild(button);
            });

            // Add container to cell
            cell.appendChild(container);

            // Handle saving on blur
            const handleSave = () => {
                const activeButtons = container.querySelectorAll('.toggle-button.active');
                const newValue = Array.from(activeButtons)
                    .map(button => button.textContent)
                    .join(', ');

                if (newValue !== originalValue) {
                    const item = ingredientData.find(i => i.id === parseInt(id));
                    if (!item) return;

                    const updatedData = { ...item };
                    updatedData[field] = newValue || '';

                    fetch(`/api/ingredients/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updatedData)
                    })
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to update');
                        fetchIngredients();
                    })
                    .catch(error => {
                        console.error('Error updating value:', error);
                        cell.textContent = originalValue;
                    });
                } else {
                    cell.textContent = originalValue || 'None';
                }
            };

            // Add a save button
            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.className = 'primary-button';
            saveButton.style.marginTop = '5px';
            saveButton.addEventListener('click', () => {
                handleSave();
            });
            cell.appendChild(saveButton);

            // Handle outside clicks
            const handleOutsideClick = (event) => {
                if (!cell.contains(event.target)) {
                    handleSave();
                    document.removeEventListener('click', handleOutsideClick);
                }
            };
            setTimeout(() => {
                document.addEventListener('click', handleOutsideClick);
            }, 0);

        } else if (field === 'unit') {
            // Create input with datalist for units
            const input = document.createElement('input');
            input.type = 'text';
            input.setAttribute('list', 'unit-list');
            input.value = originalValue;
            input.style.width = '90%';
            
            // Handle input blur
            input.addEventListener('blur', async () => {
                const newValue = input.value.trim();
                
                if (newValue !== originalValue) {
                    try {
                        const item = ingredientData.find(i => i.id === parseInt(id));
                        if (!item) throw new Error('Item not found');

                        const updatedData = { ...item };
                        updatedData[field] = newValue;

                        const response = await fetch(
                            `/api/ingredients/${id}`,
                            {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updatedData)
                            }
                        );

                        if (!response.ok) throw new Error('Failed to update');
                        fetchIngredients();
                    } catch (error) {
                        console.error('Error updating value:', error);
                        cell.textContent = originalValue;
                        return;
                    }
                } else {
                    cell.textContent = originalValue;
                }
            });

            // Handle Enter key
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });

            cell.appendChild(input);
            input.focus();
        } else {
            // Default behavior for other fields
            const input = document.createElement('input');
            
            if (field === 'quantity' || field === 'cost') {
                input.type = 'number';
                input.step = '0.01';
            } else {
                input.type = 'text';
            }

            input.value = originalValue === 'None' || originalValue === 'Unknown' ? '' : originalValue;
            input.style.width = '90%';
            
            input.addEventListener('blur', async () => {
                const newValue = input.value.trim();
                
                if (newValue !== originalValue) {
                    try {
                        const item = ingredientData.find(i => i.id === parseInt(id));
                        if (!item) throw new Error('Item not found');

                        const updatedData = { ...item };

                        if (field === 'quantity' || field === 'cost') {
                            updatedData[field] = parseFloat(newValue) || 0;
                        } else {
                            updatedData[field] = newValue;
                        }

                        const response = await fetch(
                            `/api/ingredients/${id}`,
                            {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updatedData)
                            }
                        );

                        if (!response.ok) throw new Error('Failed to update');
                        fetchIngredients();
                    } catch (error) {
                        console.error('Error updating value:', error);
                        cell.textContent = originalValue;
                        return;
                    }
                } else {
                    cell.textContent = originalValue;
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });

            cell.appendChild(input);
            input.focus();
        }
    }

    function openModal(editIndex = null) {
        editingIndex = editIndex;
        modalTitle.textContent = editingIndex !== null ? "Edit Ingredient" : "Add Ingredient";

        if (editingIndex !== null) {
            const entry = ingredientData[editingIndex];
            for (const key in formInputs) {
                if (formInputs[key]) {
                    formInputs[key].value = entry[key] || "";
                }
            }

            // Set active states for allergens and dietary mentions
            document.querySelectorAll("#allergen-buttons .toggle-button").forEach(button => {
                button.classList.toggle("active", (entry.allergens || "").includes(button.textContent));
            });

            document.querySelectorAll("#dietary-buttons .toggle-button").forEach(button => {
                button.classList.toggle("active", (entry.dietary_mentions || "").includes(button.textContent));
            });
        } else {
            for (const key in formInputs) {
                if (formInputs[key]) {
                    formInputs[key].value = "";
                }
            }
            document.querySelectorAll(".toggle-button").forEach(button => button.classList.remove("active"));
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
            if (formInputs[key]) {
                const value = formInputs[key].value.trim();
                newEntry[key] = isNaN(value) || value === "" ? value : parseFloat(value);
            }
        }
    
        // Add allergens and dietary mentions to the entry
        newEntry.allergens = selectedAllergens.join(", "); // Save as a comma-separated string
        newEntry.dietary_mentions = selectedDietary.join(", "); // Save as a comma-separated string
    
        // Validate required fields based on your model
        if (!newEntry.name || !newEntry.cost) {
            alert("Please provide all required fields: name and cost.");
            return;
        }
    
        try {
            // Check if editing an existing entry or creating a new one
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

    populateUnits();
    populateAllergensAndDietary();
    fetchIngredients();
});
