document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("recipe-modal");
    const closeButton = document.querySelector(".close-button");
    const saveButton = document.getElementById("save-button");
    const cancelButton = document.getElementById("cancel-button");
    const tagInput = document.getElementById("tags-input");
    const servingsTypeInput = document.getElementById("servings-type");
    const ingredientsTable = document.getElementById("ingredients-table tbody");
    const stepsContainer = document.getElementById("steps-container");
    let tags = ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"];
    let servingsTypes = ["Cake", "Muffin", "Loaf", "Cookies", "Pastries"];
    let allIngredients = [];
    let allRecipes = [];
    let editingRecipe = null;

    // Modal Display Controls
    modal.style.display = "none";

    function openModal(editRecipe = null) {
        editingRecipe = editRecipe;
        modal.style.display = "block";
        resetModal(); // Clear and prepare modal for edit/add
    }

    function closeModal() {
        modal.style.display = "none";
    }

    // Tag Management
    function initializeTagInput() {
        const tagify = new Tagify(tagInput, {
            whitelist: tags,
            enforceWhitelist: false,
            callbacks: {
                add: (event) => {
                    const newTag = event.detail.data.value;
                    if (!tags.includes(newTag)) tags.push(newTag); // Add to global tags
                },
            },
        });
    }

    // Servings Type Management
    function initializeServingsTypeInput() {
        new Tagify(servingsTypeInput, {
            whitelist: servingsTypes,
            enforceWhitelist: false,
            callbacks: {
                add: (event) => {
                    const newType = event.detail.data.value;
                    if (!servingsTypes.includes(newType)) servingsTypes.push(newType); // Add to global list
                },
            },
        });
    }

    // Fetch Ingredients and Recipes
    async function fetchAllData() {
        try {
            const [ingredientsResponse, recipesResponse] = await Promise.all([
                fetch("/api/ingredients/"),
                fetch("/api/recipes/"),
            ]);
            allIngredients = await ingredientsResponse.json();
            allRecipes = await recipesResponse.json();
        } catch (error) {
            console.error("Error fetching ingredients/recipes:", error);
        }
    }

    // Ingredients Table
    function initializeIngredientsTable() {
        ingredientsTable.innerHTML = ""; // Clear table
        addIngredientRow(); // Start with one empty row
    }

    function addIngredientRow() {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <input type="text" class="ingredient-name" list="ingredients-datalist" placeholder="Search ingredients/recipes">
                <datalist id="ingredients-datalist">
                    ${[...allIngredients, ...allRecipes].map(
                        (item) => `<option value="${item.name}">${item.name}</option>`
                    ).join("")}
                </datalist>
            </td>
            <td><input type="number" class="ingredient-quantity" placeholder="Quantity"></td>
            <td>
                <input type="text" class="ingredient-unit" list="units-datalist">
                <datalist id="units-datalist">
                    ${allIngredients.map((ingredient) => `<option value="${ingredient.unit}">`).join("")}
                </datalist>
            </td>
        `;
        row.querySelector(".ingredient-name").addEventListener("input", handleIngredientInput);
        ingredientsTable.appendChild(row);
    }

    function handleIngredientInput(event) {
        const value = event.target.value;
        const ingredientOrRecipe = [...allIngredients, ...allRecipes].find((item) => item.name === value);
        if (ingredientOrRecipe) {
            // Add logic for handling recipes (e.g., scaling)
        } else {
            // Handle invalid input if needed
        }
    }

    // Steps Section
    function initializeStepsContainer() {
        stepsContainer.innerHTML = ""; // Clear steps
        addStepSection("General");
    }

    function addStepSection(title) {
        const section = document.createElement("div");
        section.className = "step-section";
        section.innerHTML = `
            <h3>${title}</h3>
            <div class="steps">
                <div class="step-row">
                    <textarea class="step-instruction" placeholder="Step instruction"></textarea>
                    <input type="text" class="step-ingredient" placeholder="Ingredient (optional)" list="ingredients-datalist">
                    <input type="number" class="step-quantity" placeholder="Qty">
                    <input type="text" class="step-unit" placeholder="Unit" list="units-datalist">
                </div>
            </div>
            <button class="add-step-button">+ Add Step</button>
        `;
        section.querySelector(".add-step-button").addEventListener("click", () => addStepRow(section));
        stepsContainer.appendChild(section);
    }

    function addStepRow(section) {
        const stepsDiv = section.querySelector(".steps");
        const row = document.createElement("div");
        row.className = "step-row";
        row.innerHTML = `
            <textarea class="step-instruction" placeholder="Step instruction"></textarea>
            <input type="text" class="step-ingredient" placeholder="Ingredient (optional)" list="ingredients-datalist">
            <input type="number" class="step-quantity" placeholder="Qty">
            <input type="text" class="step-unit" placeholder="Unit" list="units-datalist">
        `;
        stepsDiv.appendChild(row);
    }

    // Modal Reset
    function resetModal() {
        initializeIngredientsTable();
        initializeStepsContainer();
        initializeTagInput();
        initializeServingsTypeInput();
    }

    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);

    fetchAllData().then(() => {
        initializeTagInput();
        initializeServingsTypeInput();
    });
});
