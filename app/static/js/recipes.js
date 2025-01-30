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
    let activeSuggestionIndex = -1;

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

    function selectTag(tag) {
        console.log("Tag selected:", tag);
    }

    function selectIngredient(ingredient) {
        console.log("Ingredient selected:", ingredient);
    }

    setupAutosuggest(formInputs.tags, tagSuggestions, fetchTags, selectTag);

    document.querySelectorAll(".step-ingredient-search").forEach(inputElement => {
        const suggestionList = inputElement.nextElementSibling;
        setupAutosuggest(inputElement, suggestionList, fetchIngredients, selectIngredient);
    });

    addRecipeButton.addEventListener("click", openModal);
    closeButton.addEventListener("click", closeModal);
    saveButton.addEventListener("click", () => console.log("Saving..."));
    fetchRecipes();
});
