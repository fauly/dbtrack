document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("recipe-modal");
    const closeButton = document.querySelector(".close-button");
    const modalTitle = document.getElementById("modal-title");
    const addRecipeButton = document.getElementById("add-recipe-button");
    const recipeTableBody = document.querySelector("#recipe-table tbody");
    const saveButton = document.getElementById("save-button");

    const formInputs = {
        name: document.getElementById("name"),
        servingsType: document.getElementById("servings-type"),
        servingsCount: document.getElementById("servings-count"),
        tags: document.getElementById("tag-input"),
        prepTime: document.getElementById("prep-time"),
        cookTime: document.getElementById("cook-time"),
        totalTime: document.getElementById("total-time"),
        notes: document.getElementById("notes"),
    };

    const ingredientsTable = document.getElementById("ingredient-table");
    const stepsTable = document.getElementById("step-container");
    const tagSuggestions = document.getElementById("tag-suggestions");

    let recipeData = [];
    let editingIndex = null;

    // Ensure modal is fullscreen
    modal.classList.add("fullscreen");
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.top = "0";
    modal.style.left = "0";

    async function fetchRecipes() {
        try {
            const response = await fetch("/api/recipes/");
            recipeData = await response.json();
            renderTable();
        } catch (error) {
            console.error("Error fetching recipes:", error);
        }
    }

    function renderTable() {
        recipeTableBody.innerHTML = "";
        recipeData.forEach((recipe, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${recipe.name}</td>
                <td>${recipe.servingsType}</td>
                <td>${recipe.servingsCount}</td>
                <td>${recipe.tags || "None"}</td>
                <td>
                    <button class="edit-button" data-index="${index}">Edit</button>
                    <button class="delete-button" data-index="${index}">Delete</button>
                </td>
            `;
            recipeTableBody.appendChild(row);
        });
    }

    function openModal(editIndex = null) {
        editingIndex = editIndex;
        modalTitle.textContent = editingIndex !== null ? "Edit Recipe" : "Add Recipe";

        if (editingIndex !== null) {
            const entry = recipeData[editingIndex];
            for (const key in formInputs) {
                if (formInputs[key]) {
                    formInputs[key].value = entry[key] || "";
                }
            }
            loadIngredients(entry.ingredients);
            loadSteps(entry.steps);
        } else {
            for (const key in formInputs) {
                if (formInputs[key]) {
                    formInputs[key].value = "";
                }
            }
            loadIngredients([]);
            loadSteps([]);
        }

        modal.style.display = "block";
        modal.style.visibility = "visible";
        modal.style.opacity = "1";
    }

    function closeModal() {
        modal.style.display = "none";
        editingIndex = null;
    }
    
    async function fetchIngredients(query, callback) {
        if (query.length < 2) {
            return;
        }
        try {
            const response = await fetch(`/api/ingredients/search?query=${query}`);
            const ingredients = await response.json();
            callback(ingredients);
        } catch (error) {
            console.error("Error fetching ingredients:", error);
        }
    }

    function setupIngredientSearch(inputElement, suggestionList) {
        inputElement.addEventListener("input", () => {
            fetchIngredients(inputElement.value, (ingredients) => {
                suggestionList.innerHTML = "";
                ingredients.slice(0, 5).forEach(ingredient => {
                    const item = document.createElement("li");
                    item.textContent = ingredient.name;
                    item.addEventListener("click", () => {
                        inputElement.value = ingredient.name;
                        suggestionList.innerHTML = "";
                    });
                    suggestionList.appendChild(item);
                });
                if (ingredients.length === 0) {
                    const searchDbItem = document.createElement("li");
                    searchDbItem.textContent = `Search ingredient database`;
                    searchDbItem.addEventListener("click", () => {
                        fetchIngredients(inputElement.value, (dbIngredients) => {
                            suggestionList.innerHTML = "";
                            dbIngredients.slice(0, 5).forEach(ingredient => {
                                const dbItem = document.createElement("li");
                                dbItem.textContent = ingredient.name;
                                dbItem.addEventListener("click", () => {
                                    inputElement.value = ingredient.name;
                                    suggestionList.innerHTML = "";
                                });
                                suggestionList.appendChild(dbItem);
                            });
                        });
                    });
                    suggestionList.appendChild(searchDbItem);
                }
            });
        });
    }

    function loadIngredients(ingredients) {
        ingredientsTable.innerHTML = "";
        ingredients.forEach(addIngredientRow);
        addIngredientRow(); // Ensure at least one empty row
    }

    function addIngredientRow(data = {}) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="text" class="ingredient-name" placeholder="Ingredient" value="${data.name || ""}"></td>
            <td><input type="number" class="ingredient-quantity" placeholder="Quantity" value="${data.quantity || ""}"></td>
            <td><input type="text" class="ingredient-unit" placeholder="Unit" value="${data.unit || ""}"></td>
            <td><button class="delete-ingredient">X</button></td>
        `;

        row.querySelector(".delete-ingredient").addEventListener("click", () => deleteRow(row, ingredientsTable));
        ingredientsTable.appendChild(row);
    }

    function loadSteps(steps) {
        stepsTable.innerHTML = "";
        steps.forEach(addStepRow);
        addStepRow(); // Ensure at least one empty row
    }

    function addStepRow(data = {}) {
        const row = document.createElement("div");
        row.classList.add("step-row");

        row.innerHTML = `
            <div class="step-left">
                <input type="text" class="step-title" placeholder="Step Title" value="${data.title || ""}">
                <textarea class="step-description" placeholder="Step Description">${data.description || ""}</textarea>
            </div>
            <div class="step-right">
                <table class="step-ingredients">
                    <thead>
                        <tr><th>Ingredient</th><th>Quantity</th><th>Unit</th></tr>
                    </thead>
                    <tbody></tbody>
                </table>
                <input type="text" class="step-ingredient-search" placeholder="Search ingredient...">
                <ul class="ingredient-suggestions"></ul>
            </div>
            <button class="delete-step">X</button>
        `;

        const searchInput = row.querySelector(".step-ingredient-search");
        const suggestionList = row.querySelector(".ingredient-suggestions");

        setupIngredientSearch(searchInput, suggestionList);


        row.querySelector(".delete-step").addEventListener("click", () => deleteRow(row, stepsTable));
        stepsTable.appendChild(row);
    }

    function deleteRow(row, table) {
        if (table.children.length > 1) {
            row.remove();
        }
    }

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
            ingredients: [],
            steps: [],
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

    addRecipeButton.addEventListener("click", () => openModal());
    closeButton.addEventListener("click", closeModal);
    saveButton.addEventListener("click", saveRecipe);
    fetchRecipes();
});
