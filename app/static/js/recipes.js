document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("recipe-modal");
    const closeButton = document.querySelector(".close-button");
    const modalTitle = document.getElementById("modal-title");

    const formInputs = {
        name: document.getElementById("name"),
        servingsType: document.getElementById("servings-type"),
        servingsCount: document.getElementById("servings-count"),
        tags: document.getElementById("tags"),
        prepTime: document.getElementById("prep-time"),
        cookTime: document.getElementById("cook-time"),
        totalTime: document.getElementById("total-time"),
        notes: document.getElementById("notes")
    };

    const ingredientsTable = document.getElementById("ingredients-table");
    const stepsTable = document.getElementById("steps-table");

    let recipeData = [];
    let editingIndex = null;

    // Ensure modal is hidden by default
    modal.style.display = "none";

    /** Fetches recipes from API **/
    async function fetchRecipes() {
        try {
            const response = await fetch("/api/recipes/");
            recipeData = await response.json();
            renderTable();
        } catch (error) {
            console.error("Error fetching recipes:", error);
        }
    }

    /** Handles opening the modal **/
    function openModal(editIndex = null) {
        editingIndex = editIndex;
        modalTitle.textContent = editingIndex !== null ? "Edit Recipe" : "Add Recipe";

        if (editingIndex !== null) {
            const entry = recipeData[editingIndex];
            for (const key in formInputs) {
                formInputs[key].value = entry[key] || "";
            }
            loadIngredients(entry.ingredients);
            loadSteps(entry.steps);
        } else {
            for (const key in formInputs) {
                formInputs[key].value = "";
            }
            loadIngredients([]); // Ensure empty starting row
            loadSteps([]); // Ensure empty starting row
        }

        modal.style.display = "block";
    }

    function closeModal() {
        modal.style.display = "none";
        editingIndex = null;
    }

    /** Loads ingredients, ensuring one empty row **/
    function loadIngredients(ingredients) {
        ingredientsTable.innerHTML = "";
        ingredients.forEach(addIngredientRow);
        addIngredientRow(); // Ensure there's at least one blank row
    }

    /** Loads steps, ensuring one empty row **/
    function loadSteps(steps) {
        stepsTable.innerHTML = "";
        steps.forEach(addStepRow);
        addStepRow(); // Ensure there's at least one blank row
    }

    /** Dynamically adds an ingredient row **/
    function addIngredientRow(data = {}) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="text" class="ingredient-name" placeholder="Ingredient" value="${data.name || ""}"></td>
            <td><input type="number" class="ingredient-quantity" placeholder="Quantity" value="${data.quantity || ""}"></td>
            <td><input type="text" class="ingredient-unit" placeholder="Unit" value="${data.unit || ""}"></td>
            <td><input type="text" class="ingredient-note" placeholder="Notes (Optional)" value="${data.notes || ""}"></td>
            <td><button class="delete-ingredient">X</button></td>
        `;

        row.querySelector(".ingredient-name").addEventListener("input", handleIngredientInput);
        row.querySelector(".delete-ingredient").addEventListener("click", () => deleteRow(row, ingredientsTable));

        ingredientsTable.appendChild(row);
    }

    /** Dynamically adds a step row **/
    function addStepRow(data = {}) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="text" class="step-title" placeholder="Step Title (Optional)" value="${data.title || ""}"></td>
            <td><textarea class="step-description" placeholder="Step Description">${data.description || ""}</textarea></td>
            <td>
                <table class="step-ingredients">
                    <thead><tr><th>Ingredient</th><th>Quantity</th><th>Unit</th></tr></thead>
                    <tbody></tbody>
                </table>
            </td>
            <td><button class="delete-step">X</button></td>
        `;

        row.querySelector(".delete-step").addEventListener("click", () => deleteRow(row, stepsTable));
        row.querySelector(".step-description").addEventListener("input", () => autoAddStep(row));

        stepsTable.appendChild(row);
    }

    /** Deletes a row, ensuring at least one remains **/
    function deleteRow(row, table) {
        if (table.children.length > 1) {
            row.remove();
        }
    }

    /** Handles ingredient name input (autocomplete & searching) **/
    async function handleIngredientInput(event) {
        const input = event.target;
        const query = input.value.trim();

        if (query.length > 1) {
            try {
                const response = await fetch(`/api/ingredients/search?q=${query}`);
                const results = await response.json();
                showAutocomplete(input, results);
            } catch (error) {
                console.error("Error searching ingredients:", error);
            }
        } else {
            hideAutocomplete();
        }
    }

    /** Shows autocomplete suggestions **/
    function showAutocomplete(input, results) {
        const autocompleteList = document.createElement("ul");
        autocompleteList.className = "autocomplete-list";

        results.forEach(item => {
            const option = document.createElement("li");
            option.textContent = item.name;
            option.addEventListener("click", () => {
                input.value = item.name;
                hideAutocomplete();
            });
            autocompleteList.appendChild(option);
        });

        input.parentNode.appendChild(autocompleteList);
    }

    /** Hides autocomplete suggestions **/
    function hideAutocomplete() {
        document.querySelectorAll(".autocomplete-list").forEach(el => el.remove());
    }

    /** Automatically adds a new empty step if user types in the last one **/
    function autoAddStep(lastRow) {
        const rows = Array.from(stepsTable.children);
        if (rows.indexOf(lastRow) === rows.length - 1) {
            addStepRow();
        }
    }

    /** Saves the recipe **/
    async function saveRecipe() {
        const newRecipe = {
            name: formInputs.name.value.trim(),
            servingsType: formInputs.servingsType.value.trim(),
            servingsCount: parseInt(formInputs.servingsCount.value) || 1,
            tags: formInputs.tags.value.trim(),
            prepTime: formInputs.prepTime.value.trim(),
            cookTime: formInputs.cookTime.value.trim(),
            totalTime: formInputs.totalTime.value.trim(),
            notes: formInputs.notes.value.trim(),
            ingredients: getIngredientsData(),
            steps: getStepsData(),
        };

        if (!newRecipe.name) {
            alert("Recipe name is required.");
            return;
        }

        try {
            const method = editingIndex !== null ? "PUT" : "POST";
            const url = editingIndex !== null ? `/api/recipes/${recipeData[editingIndex].id}` : "/api/recipes/";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRecipe),
            });

            if (!response.ok) throw new Error("Failed to save recipe.");
            closeModal();
            fetchRecipes();
        } catch (error) {
            console.error("Error saving recipe:", error);
            alert("Failed to save the recipe.");
        }
    }

    function getIngredientsData() {
        return Array.from(ingredientsTable.children).map(row => ({
            name: row.querySelector(".ingredient-name").value.trim(),
            quantity: parseFloat(row.querySelector(".ingredient-quantity").value) || null,
            unit: row.querySelector(".ingredient-unit").value.trim(),
            notes: row.querySelector(".ingredient-note").value.trim(),
        })).filter(item => item.name);
    }

    function getStepsData() {
        return Array.from(stepsTable.children).map(row => ({
            title: row.querySelector(".step-title").value.trim(),
            description: row.querySelector(".step-description").value.trim(),
        })).filter(step => step.description);
    }

    closeButton.addEventListener("click", closeModal);
    fetchRecipes();
});
