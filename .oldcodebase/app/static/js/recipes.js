console.log('recipes.js loading...');

// Wait for both DOM and script dependencies to be ready
function waitForElements(selectors, callback, maxAttempts = 50) {
    console.log('Waiting for elements:', selectors);
    const check = (attempts) => {
        const elements = selectors.map(selector => document.querySelector(selector));
        const results = selectors.reduce((acc, sel, i) => {
            acc[sel] = !!elements[i];
            return acc;
        }, {});
        
        console.log('Element check attempt:', maxAttempts - attempts, results);
        
        if (elements.every(el => el)) {
            console.log('All elements found');
            callback(elements);
            return;
        }
        if (attempts <= 0) {
            console.error('Could not find elements:', results);
            return;
        }
        setTimeout(() => check(attempts - 1), 100);
    };
    check(maxAttempts);
}

// Initialize as soon as DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM loaded, checking Sortable...');
    console.log('Sortable available:', typeof Sortable !== 'undefined');
    
    const requiredElements = [
        '#recipe-modal',
        '#steps-tree',
        '#section-template',
        '#step-template'
    ];

    // First ensure Sortable is loaded
    if (typeof Sortable === 'undefined') {
        console.error('Sortable not loaded! Make sure Sortable.min.js is loaded correctly.');
        return;
    }

    // Then check for all required elements
    waitForElements(requiredElements, ([modal, stepsTree, sectionTemplate, stepTemplate]) => {
        console.log('All required elements found, initializing application...');
        initializeRecipes();
    });
});

function initializeRecipes() {
    const modal = document.getElementById("recipe-modal");
    const closeButton = document.querySelector(".close-button");
    const modalTitle = document.getElementById("modal-title");
    const addRecipeButton = document.getElementById("add-recipe-button");
    const recipeTableBody = document.querySelector("#recipe-table tbody");
    const saveButton = document.getElementById("save-button");
    const cancelButton = document.getElementById("cancel-button");
    const sectionTemplate = document.getElementById("section-template");
    const stepTemplate = document.getElementById("step-template");
    const stepsTree = document.getElementById("steps-tree");
    const addSectionButton = document.getElementById("add-section");
    const addStepButton = document.getElementById("add-step");
    const ingredientTypeSelect = document.getElementById("ingredient-type");
    const ingredientsTable = document.getElementById("ingredient-table");
    const tagSuggestions = document.getElementById("tag-suggestions");
    const stepsTable = document.getElementById("steps-table");

    // Validate critical elements exist
    if (!modal || !stepsTree || !sectionTemplate || !stepTemplate) {
        console.error("Critical elements missing:", {
            modal: !!modal,
            stepsTree: !!stepsTree,
            sectionTemplate: !!sectionTemplate,
            stepTemplate: !!stepTemplate
        });
        return;
    }

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

    let recipeData = [];
    let editingIndex = null;
    let activeSuggestionIndex = -1;

    // Ensure modal is fullscreen and hidden by default
    modal.classList.add("fullscreen");
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.display = "none";

    // Initialize SortableJS for the main steps container
    let mainSortable = new Sortable(stepsTree, {
        group: 'nested',
        animation: 150,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        handle: '.drag-handle',
        dragClass: "sortable-drag",
        ghostClass: "sortable-ghost",
        chosenClass: "sortable-chosen"
    });

    async function loadAllRecipes() {
        try {
            const response = await fetch("/api/recipes/");
            recipeData = await response.json();
            renderTable();
        } catch (error) {
            console.error("Error fetching recipes:", error);
        }
    }

    async function fetchRecipes(query, callback) {
        if (!callback) {
            console.error('Callback is required for fetchRecipes');
            return;
        }
        
        if (query.length < 2) {
            callback([]);
            return;
        }
        try {
            const response = await fetch(`/api/recipes/search?query=${query}`);
            const recipes = await response.json();
            callback(recipes.map(r => ({
                id: r.id,
                name: r.name,
                type: 'recipe'
            })));
        } catch (error) {
            console.error("Error fetching recipes:", error);
            callback([]);
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

        // Clear the steps tree
        stepsTree.innerHTML = '';

        if (editingIndex !== null) {
            const entry = recipeData[editingIndex];
            for (const key in formInputs) {
                if (formInputs[key]) {
                    formInputs[key].value = entry[key] || "";
                }
            }
            loadIngredients(entry.ingredients || []);
            
            // Load steps and sections
            if (entry.steps) {
                function loadItems(items, container) {
                    items.forEach(item => {
                        if (item.type === 'section') {
                            const section = sectionTemplate.content.cloneNode(true).firstElementChild;
                            section.querySelector('.section-title').value = item.title;
                            const sectionContent = section.querySelector('.section-content');
                            initializeSortable(sectionContent);
                            loadItems(item.items, sectionContent);
                            container.appendChild(section);
                        } else {
                            const step = stepTemplate.content.cloneNode(true).firstElementChild;
                            step.querySelector('.step-title').value = item.title;
                            step.querySelector('.step-description').value = item.description;
                            setupStepIngredients(step);
                            
                            // Load step ingredients
                            const tbody = step.querySelector('.step-ingredients-table tbody');
                            item.ingredients.forEach(ing => {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${ing.name}</td>
                                    <td>${ing.quantity}</td>
                                    <td>${ing.unit}</td>
                                    <td><button class="delete-ingredient">×</button></td>
                                `;
                                tbody.appendChild(row);
                                row.querySelector('.delete-ingredient').addEventListener('click', () => row.remove());
                            });
                            
                            container.appendChild(step);
                        }
                    });
                }

                loadItems(entry.steps, stepsTree);
            }
        } else {
            for (const key in formInputs) {
                if (formInputs[key]) {
                    formInputs[key].value = "";
                }
            }
            loadIngredients([]);
        }

        modal.style.display = "block";
        modal.style.visibility = "visible";
        modal.style.opacity = "1";
    }

    function closeModal() {
        modal.style.display = "none";
        editingIndex = null;
    }

    function setupAutosuggest(inputElement, suggestionList, fetchFunction, selectCallback) {
        inputElement.addEventListener("input", () => {
            fetchFunction(inputElement.value, (suggestions) => {
                renderAutosuggest(suggestions, suggestionList, inputElement, selectCallback);
            });
        });

        inputElement.addEventListener("keydown", (event) => {
            if (suggestionList.children.length === 0) return;

            if (event.key === "ArrowDown") {
                event.preventDefault();
                activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, suggestionList.children.length - 1);
                updateActiveSuggestion(suggestionList);
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, 0);
                updateActiveSuggestion(suggestionList);
            } else if (event.key === "Enter") {
                event.preventDefault();
                if (activeSuggestionIndex >= 0) {
                    suggestionList.children[activeSuggestionIndex].click();
                }
            } else if (event.key === "Escape") {
                suggestionList.innerHTML = "";
                activeSuggestionIndex = -1;
            }
        });
    }

    function updateActiveSuggestion(suggestionList) {
        [...suggestionList.children].forEach((item, index) => {
            item.classList.toggle("active", index === activeSuggestionIndex);
        });
    }

    function renderAutosuggest(suggestions, suggestionList, inputElement, selectCallback) {
        suggestionList.innerHTML = "";
        activeSuggestionIndex = -1;

        suggestions.forEach((suggestion, index) => {
            const item = document.createElement("li");
            item.textContent = suggestion;
            item.classList.add("suggestion-item");
            item.addEventListener("click", () => {
                inputElement.value = suggestion;
                suggestionList.innerHTML = "";
                selectCallback(suggestion);
            });

            suggestionList.appendChild(item);
        });

        if (suggestions.length > 0) {
            suggestionList.style.display = "block";
        } else {
            suggestionList.style.display = "none";
        }
    }

    async function fetchTags(query, callback) {
        if (query.length < 2) {
            callback([]);
            return;
        }
        try {
            const response = await fetch(`/api/tags/search?query=${query}`);
            const tags = await response.json();
            tags.push(`Create a new tag "${query}"`);
            callback(tags.slice(0, 5));
        } catch (error) {
            console.error("Error fetching tags:", error);
        }
    }

    async function fetchIngredients(query, callback) {
        if (query.length < 2) {
            callback([]);
            return;
        }
        try {
            const response = await fetch(`/api/ingredients/search?query=${query}`);
            const ingredients = await response.json();
            ingredients.push(`Search ingredient database`);
            callback(ingredients.map(i => i.name).slice(0, 5));
        } catch (error) {
            console.error("Error fetching ingredients:", error);
        }
    }

    async function fetchServingTypes(query, callback) {
        if (query.length < 2) {
            callback([]);
            return;
        }
        try {
            const response = await fetch(`/api/recipes/serving-types/search?query=${query}`);
            const types = await response.json();
            types.push(`Create "${query}" as new serving type`);
            callback(types.slice(0, 5));
        } catch (error) {
            console.error("Error fetching serving types:", error);
            callback([]);
        }
    }

    function selectTag(tag) {
        if (tag.startsWith('Create a new tag')) {
            const newTag = tag.slice(17, -1);
            fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTag })
            })
            .then(() => addTagToContainer(newTag));
        } else {
            addTagToContainer(tag);
        }
    }

    function addTagToContainer(tag) {
        const container = document.getElementById('tag-container');
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag}
            <button class="remove-tag">×</button>
        `;
        
        tagElement.querySelector('.remove-tag').addEventListener('click', () => {
            tagElement.remove();
        });
        
        container.appendChild(tagElement);
        formInputs.tags.value = '';
    }

    function selectIngredient(ingredient) {
        console.log("Ingredient selected:", ingredient);
    }

    setupAutosuggest(formInputs.tags, tagSuggestions, fetchTags, selectTag);

    document.querySelectorAll(".step-ingredient-search").forEach(inputElement => {
        const suggestionList = inputElement.nextElementSibling;
        setupAutosuggest(inputElement, suggestionList, fetchIngredients, selectIngredient);
    });

    setupAutosuggest(formInputs.servingsType, document.getElementById('servings-suggestions'), fetchServingTypes, async (type) => {
        if (type.startsWith('Create "')) {
            const newType = type.slice(8, -20);
            try {
                await fetch('/api/recipes/serving-types', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newType })
                });
                formInputs.servingsType.value = newType;
            } catch (error) {
                console.error('Error creating serving type:', error);
            }
        } else {
            formInputs.servingsType.value = type;
        }
    });

    if (addRecipeButton) {
        addRecipeButton.addEventListener("click", () => openModal());
    }
    if (closeButton) {
        closeButton.addEventListener("click", closeModal);
    }
    if (saveButton) {
        saveButton.addEventListener("click", saveEntry);
    }
    if (cancelButton) {
        cancelButton.addEventListener("click", closeModal);
    }
    if (addSectionButton) {
        addSectionButton.addEventListener("click", addSection);
    }
    if (addStepButton) {
        addStepButton.addEventListener("click", () => addStep());
    }

    loadAllRecipes();

    const ingredientList = [];
    
    function loadIngredients(ingredients = []) {
        const tbody = ingredientsTable.querySelector("tbody");
        tbody.innerHTML = "";

        ingredients.forEach((ingredient, index) => {
            const row = document.createElement("tr");
            if (ingredient.type === 'recipe') {
                row.innerHTML = `
                    <td class="recipe-reference">
                        <div class="recipe-reference-header">
                            <span>${ingredient.name}</span>
                            <span>(Recipe Reference)</span>
                        </div>
                        <div class="recipe-reference-ingredients">
                            <!-- Referenced recipe ingredients will be loaded here -->
                        </div>
                    </td>
                    <td>${ingredient.quantity}</td>
                    <td>${ingredient.unit}</td>
                    <td>
                        <button class="delete-ingredient" data-index="${index}">×</button>
                    </td>
                `;

                // Load referenced recipe ingredients
                fetch(`/api/recipes/${ingredient.recipe_id}`)
                    .then(response => response.json())
                    .then(recipe => {
                        const ingredientsList = row.querySelector('.recipe-reference-ingredients');
                        recipe.ingredients.forEach(ing => {
                            const div = document.createElement('div');
                            div.textContent = `${ing.name} (${ing.quantity} ${ing.unit})`;
                            ingredientsList.appendChild(div);
                        });
                    });
            } else {
                row.innerHTML = `
                    <td>${ingredient.name}</td>
                    <td>${ingredient.quantity}</td>
                    <td>${ingredient.unit}</td>
                    <td>
                        <button class="delete-ingredient" data-index="${index}">×</button>
                    </td>
                `;
            }
            tbody.appendChild(row);
        });

        // Add a new row for ingredient input
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td>
                <select id="ingredient-type">
                    <option value="ingredient">Ingredient</option>
                    <option value="recipe">Recipe Reference</option>
                </select>
                <input type="text" class="ingredient-search" placeholder="Search...">
                <ul class="ingredient-suggestions suggestions-list"></ul>
            </td>
            <td><input type="number" class="ingredient-quantity" step="0.01"></td>
            <td>
                <input type="text" class="ingredient-unit" list="unit-list">
                <datalist id="unit-list"></datalist>
            </td>
            <td>
                <button class="add-ingredient primary-button">Add</button>
            </td>
        `;
        tbody.appendChild(newRow);

        // Set up ingredient/recipe search based on type
        const typeSelect = newRow.querySelector('#ingredient-type');
        const ingredientSearch = newRow.querySelector('.ingredient-search');
        const suggestionList = newRow.querySelector('.ingredient-suggestions');

        typeSelect.addEventListener('change', () => {
            const searchType = typeSelect.value;
            ingredientSearch.placeholder = `Search ${searchType}...`;
            setupAutosuggest(
                ingredientSearch, 
                suggestionList, 
                searchType === 'recipe' ? fetchRecipes : fetchIngredients,
                (item) => handleItemSelection(item, searchType, newRow)
            );
        });

        // Initial setup for ingredient search
        setupAutosuggest(
            ingredientSearch,
            suggestionList,
            fetchIngredients,
            (item) => handleItemSelection(item, 'ingredient', newRow)
        );

        // Handle adding new ingredients
        newRow.querySelector(".add-ingredient").addEventListener("click", () => {
            const search = newRow.querySelector(".ingredient-search");
            const quantity = newRow.querySelector(".ingredient-quantity");
            const unit = newRow.querySelector(".ingredient-unit");
            const type = newRow.querySelector("#ingredient-type").value;

            if (!search.value || !quantity.value || !unit.value) {
                alert("Please fill in all fields");
                return;
            }

            const newItem = {
                type,
                name: search.value,
                quantity: parseFloat(quantity.value),
                unit: unit.value
            };

            if (type === 'recipe') {
                newItem.recipe_id = parseInt(search.dataset.recipeId);
            } else {
                newItem.id = parseInt(search.dataset.ingredientId);
            }

            ingredients.push(newItem);
            loadIngredients(ingredients);
        });

        // Handle deleting ingredients
        tbody.querySelectorAll(".delete-ingredient").forEach(button => {
            button.addEventListener("click", () => {
                const index = parseInt(button.dataset.index);
                ingredients.splice(index, 1);
                loadIngredients(ingredients);
            });
        });

        populateUnits();
    }

    function loadSteps(steps = []) {
        stepsTable.innerHTML = "";
        
        steps.forEach((step, index) => {
            addStepRow(step, index);
        });
        
        // Add a button to add new steps
        const addButton = document.createElement("button");
        addButton.textContent = "Add Step";
        addButton.className = "primary-button";
        addButton.addEventListener("click", () => addStepRow());
        stepsTable.appendChild(addButton);
    }

    function addStepRow(step = {}, index = -1) {
        const stepRow = document.createElement("div");
        stepRow.className = "step-row";
        stepRow.innerHTML = `
            <div class="step-left">
                <input type="text" class="step-title" placeholder="Step Title" value="${step.title || ''}">
                <textarea class="step-description" placeholder="Step Description">${step.description || ''}</textarea>
            </div>
            <div class="step-right">
                <table class="step-ingredients">
                    <thead>
                        <tr>
                            <th>Ingredient</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
                <div class="step-ingredient-input">
                    <input type="text" class="step-ingredient-search" placeholder="Search ingredient...">
                    <input type="number" class="step-ingredient-quantity" step="0.01" placeholder="Quantity">
                    <input type="text" class="step-ingredient-unit" list="unit-list" placeholder="Unit">
                    <button class="add-step-ingredient primary-button">Add</button>
                </div>
                <ul class="ingredient-suggestions suggestions-list"></ul>
            </div>
            <button class="delete-step">X</button>
        `;

        const deleteButton = stepRow.querySelector(".delete-step");
        deleteButton.addEventListener("click", () => stepRow.remove());

        // Set up ingredient handling for this step
        const ingredientSearch = stepRow.querySelector(".step-ingredient-search");
        const suggestionList = stepRow.querySelector(".ingredient-suggestions");
        const tbody = stepRow.querySelector(".step-ingredients tbody");

        setupAutosuggest(ingredientSearch, suggestionList, fetchIngredients, (ingredient) => {
            if (ingredient.startsWith('Search')) return;
            
            const quantityInput = stepRow.querySelector(".step-ingredient-quantity");
            const unitInput = stepRow.querySelector(".step-ingredient-unit");
            
            fetch(`/api/ingredients/search?query=${ingredient}`)
                .then(response => response.json())
                .then(results => {
                    const match = results.find(i => i.name === ingredient);
                    if (match) {
                        ingredientSearch.dataset.selectedId = match.id;
                        unitInput.value = match.unit || '';
                    }
                });
        });

        // Load existing step ingredients if any
        if (step.ingredients) {
            step.ingredients.forEach(ingredient => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${ingredient.name}</td>
                    <td>${ingredient.quantity}</td>
                    <td>${ingredient.unit}</td>
                    <td><button class="delete-ingredient">X</button></td>
                `;
                tbody.appendChild(row);

                row.querySelector(".delete-ingredient").addEventListener("click", () => row.remove());
            });
        }

        // Handle adding new step ingredients
        const addIngredientButton = stepRow.querySelector(".add-step-ingredient");
        addIngredientButton.addEventListener("click", () => {
            const search = stepRow.querySelector(".step-ingredient-search");
            const quantity = stepRow.querySelector(".step-ingredient-quantity");
            const unit = stepRow.querySelector(".step-ingredient-unit");

            if (!search.value || !quantity.value || !unit.value) {
                alert("Please fill in all ingredient fields");
                return;
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${search.value}</td>
                <td>${quantity.value}</td>
                <td>${unit.value}</td>
                <td><button class="delete-ingredient">X</button></td>
            `;
            tbody.appendChild(row);

            row.querySelector(".delete-ingredient").addEventListener("click", () => row.remove());

            // Clear inputs
            search.value = "";
            quantity.value = "";
            unit.value = "";
        });

        if (index === -1) {
            stepsTable.insertBefore(stepRow, stepsTable.lastChild);
        } else {
            stepsTable.insertBefore(stepRow, stepsTable.children[index]);
        }
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

    function gatherRecipeData() {
        const steps = [];
        function processNode(node) {
            const items = [];
            node.children.forEach(child => {
                if (child.dataset.type === 'section') {
                    items.push({
                        type: 'section',
                        title: child.querySelector('.section-title').value,
                        items: processNode(child.querySelector('.section-content'))
                    });
                } else if (child.dataset.type === 'step') {
                    const stepIngredients = [];
                    child.querySelectorAll('.step-ingredients-table tbody tr').forEach(row => {
                        const cells = row.cells;
                        stepIngredients.push({
                            name: cells[0].textContent,
                            quantity: parseFloat(cells[1].textContent),
                            unit: cells[2].textContent
                        });
                    });

                    items.push({
                        type: 'step',
                        title: child.querySelector('.step-title').value,
                        description: child.querySelector('.step-description').value,
                        ingredients: stepIngredients
                    });
                }
            });
            return items;
        }

        const ingredients = [];
        ingredientsTable.querySelectorAll("tbody tr").forEach(row => {
            const search = row.querySelector(".ingredient-search");
            if (!search) return; // Skip if not an input row

            const type = row.querySelector("#ingredient-type")?.value;
            const quantity = row.querySelector(".ingredient-quantity");
            const unit = row.querySelector(".ingredient-unit");

            if (search.value && quantity?.value && unit?.value) {
                const item = {
                    type: type || 'ingredient',
                    name: search.value,
                    quantity: parseFloat(quantity.value),
                    unit: unit.value
                };

                if (type === 'recipe') {
                    item.recipe_id = parseInt(search.dataset.recipeId);
                } else {
                    item.id = parseInt(search.dataset.ingredientId);
                }

                ingredients.push(item);
            }
        });

        return {
            name: formInputs.name.value,
            servings_type: formInputs.servingsType.value,
            servings_count: parseInt(formInputs.servingsCount.value),
            prep_time: formInputs.prepTime.value,
            cook_time: formInputs.cookTime.value,
            total_time: formInputs.totalTime.value,
            ingredients,
            steps: processNode(stepsTree)
        };
    }

    async function saveEntry() {
        const recipeData = gatherRecipeData();
        
        if (!recipeData.name || !recipeData.servings_type || !recipeData.servings_count) {
            alert("Please fill in all required fields");
            return;
        }

        try {
            const url = editingIndex !== null 
                ? `/api/recipes/${recipeData[editingIndex].id}`
                : "/api/recipes/";
            
            const method = editingIndex !== null ? "PUT" : "POST";
            
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(recipeData)
            });

            if (!response.ok) throw new Error("Failed to save recipe");

            closeModal();
            loadAllRecipes();
        } catch (error) {
            console.error("Error saving recipe:", error);
            alert("Failed to save the recipe. Check the console for details.");
        }
    }

    function initializeSortable(element) {
        return new Sortable(element, {
            group: 'nested',
            animation: 150,
            fallbackOnBody: true,
            swapThreshold: 0.65,
            handle: '.drag-handle',
            dragClass: "sortable-drag",
            ghostClass: "sortable-ghost",
            chosenClass: "sortable-chosen"
        });
    }

    function addSection() {
        const section = sectionTemplate.content.cloneNode(true).firstElementChild;
        const sectionContent = section.querySelector('.section-content');
        
        // Initialize nested sortable
        initializeSortable(sectionContent);

        // Add event listeners
        section.querySelector('.toggle-section').addEventListener('click', (e) => {
            const content = e.target.closest('.recipe-section').querySelector('.section-content');
            content.classList.toggle('collapsed');
            e.target.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
        });

        section.querySelector('.delete-section').addEventListener('click', () => {
            section.remove();
        });

        stepsTree.appendChild(section);
    }

    function addStep(container = stepsTree) {
        const step = stepTemplate.content.cloneNode(true).firstElementChild;

        // Add event listeners
        step.querySelector('.toggle-step').addEventListener('click', (e) => {
            const content = e.target.closest('.recipe-step').querySelector('.step-content');
            content.classList.toggle('collapsed');
            e.target.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
        });

        step.querySelector('.delete-step').addEventListener('click', () => {
            step.remove();
        });

        // Set up ingredient handling for this step
        setupStepIngredients(step);

        container.appendChild(step);
    }

    function setupStepIngredients(step) {
        const ingredientSearch = step.querySelector('.step-ingredient-search');
        const suggestionList = step.querySelector('.ingredient-suggestions');
        setupAutosuggest(ingredientSearch, suggestionList, fetchIngredients, (ingredient) => {
            if (ingredient.startsWith('Search')) return;
            
            const quantityInput = step.querySelector('.step-ingredient-quantity');
            const unitInput = step.querySelector('.step-ingredient-unit');
            
            fetch(`/api/ingredients/search?query=${ingredient}`)
                .then(response => response.json())
                .then(results => {
                    const match = results.find(i => i.name === ingredient);
                    if (match) {
                        ingredientSearch.dataset.selectedId = match.id;
                        unitInput.value = match.unit || '';
                    }
                });
        });

        // Handle adding ingredients to step
        const addButton = step.querySelector('.add-step-ingredient');
        const tbody = step.querySelector('.step-ingredients-table tbody');
        
        addButton.addEventListener('click', () => {
            const search = step.querySelector('.step-ingredient-search');
            const quantity = step.querySelector('.step-ingredient-quantity');
            const unit = step.querySelector('.step-ingredient-unit');

            if (!search.value || !quantity.value || !unit.value) {
                alert("Please fill in all ingredient fields");
                return;
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${search.value}</td>
                <td>${quantity.value}</td>
                <td>${unit.value}</td>
                <td><button class="delete-ingredient">×</button></td>
            `;
            tbody.appendChild(row);

            row.querySelector('.delete-ingredient').addEventListener('click', () => row.remove());

            // Clear inputs
            search.value = '';
            quantity.value = '';
            unit.value = '';
        });
    }

    async function fetchRecipes(query, callback) {
        if (query.length < 2) {
            callback([]);
            return;
        }
        try {
            const response = await fetch(`/api/recipes/search?query=${query}`);
            const recipes = await response.json();
            callback(recipes.map(r => ({
                id: r.id,
                name: r.name,
                type: 'recipe'
            })));
        } catch (error) {
            console.error("Error fetching recipes:", error);
            callback([]);
        }
    }

    function handleItemSelection(item, type, row) {
        const search = row.querySelector('.ingredient-search');
        const unit = row.querySelector('.ingredient-unit');

        if (type === 'recipe') {
            search.dataset.recipeId = item.id;
            search.value = item.name;
            unit.value = 'x'; // Default unit for recipe references
        } else {
            fetch(`/api/ingredients/search?query=${item}`)
                .then(response => response.json())
                .then(results => {
                    const match = results.find(i => i.name === item);
                    if (match) {
                        search.dataset.ingredientId = match.id;
                        search.value = match.name;
                        unit.value = match.unit || '';
                    }
                });
        }
    }

    // Event listeners for adding sections and steps
    addSectionButton.addEventListener('click', addSection);
    addStepButton.addEventListener('click', () => addStep());
}
