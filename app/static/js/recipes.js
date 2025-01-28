document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#recipe-table tbody");
    const searchInput = document.getElementById("search-input");
    const addRecipeButton = document.getElementById("add-recipe-button");
    const modal = document.getElementById("recipe-modal");
    const closeButton = document.querySelector(".close-button");
    const modalTitle = document.getElementById("modal-title");
    const formInputs = {
        name: document.getElementById("recipe-name"),
        servingsType: document.getElementById("servings-type"),
        servingsCount: document.getElementById("servings-count"),
        prepTime: document.getElementById("prep-time"),
        cookTime: document.getElementById("cook-time"),
        totalTime: document.getElementById("total-time"),
        ingredients: document.getElementById("ingredients"),
        steps: document.getElementById("steps"),
        notes: document.getElementById("notes"),
    };
    const saveButton = document.getElementById("save-button");
    const cancelButton = document.getElementById("cancel-button");
    const tagButtonsContainer = document.getElementById("tag-buttons");

    let recipeData = [];
    let editingIndex = null;

    const tags = ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"];

    // Ensure modal is hidden by default
    modal.style.display = "none";

    function populateTags() {
        tags.forEach(tag => {
            const button = document.createElement("button");
            button.className = "toggle-button";
            button.textContent = tag;
            button.addEventListener("click", () => button.classList.toggle("active"));
            tagButtonsContainer.appendChild(button);
        });
    }

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
        tableBody.innerHTML = "";
        const filteredData = recipeData.filter(recipe =>
            recipe.name.toLowerCase().includes(searchInput.value.toLowerCase())
        );

        filteredData.forEach((recipe, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${recipe.name}</td>
                <td>${recipe.servings_type}</td>
                <td>${recipe.servings_count}</td>
                <td>${recipe.tags || "None"}</td>
                <td>${recipe.prep_time || "N/A"}</td>
                <td>${recipe.cook_time || "N/A"}</td>
                <td>${recipe.total_time || "N/A"}</td>
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
        modalTitle.textContent = editIndex !== null ? "Edit Recipe" : "Add Recipe";

        // Populate the modal with data if editing
        if (editIndex !== null) {
            const recipe = recipeData[editIndex];
            for (const key in formInputs) {
                formInputs[key].value = recipe[key] || "";
            }
            document.querySelectorAll("#tag-buttons .toggle-button").forEach(button => {
                button.classList.toggle("active", recipe.tags.includes(button.textContent));
            });
        } else {
            // Clear the form for adding a new recipe
            for (const key in formInputs) {
                formInputs[key].value = "";
            }
            document.querySelectorAll("#tag-buttons .toggle-button").forEach(button => {
                button.classList.remove("active");
            });
        }

        modal.style.display = "block";
    }

    function closeModal() {
        modal.style.display = "none";
        editingIndex = null;
    }

    async function saveRecipe() {
        const newRecipe = {};
        const selectedTags = Array.from(document.querySelectorAll("#tag-buttons .toggle-button.active"))
            .map(button => button.textContent);

        for (const key in formInputs) {
            const value = formInputs[key].value.trim();
            newRecipe[key] = isNaN(value) || value === "" ? value : parseFloat(value);
        }
        newRecipe.tags = selectedTags.join(", "); // Save tags as a comma-separated string

        if (!newRecipe.name) {
            alert("Recipe name is required.");
            return;
        }

        try {
            if (editingIndex !== null) {
                const response = await fetch(`/api/recipes/${recipeData[editingIndex].id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newRecipe),
                });
                if (!response.ok) throw new Error("Failed to update recipe.");
            } else {
                const response = await fetch("/api/recipes/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newRecipe),
                });
                if (!response.ok) throw new Error("Failed to add recipe.");
            }

            closeModal();
            fetchRecipes();
        } catch (error) {
            console.error("Error saving recipe:", error);
            alert("Failed to save the recipe. Check the console for details.");
        }
    }

    searchInput.addEventListener("input", renderTable);
    addRecipeButton.addEventListener("click", () => openModal());
    saveButton.addEventListener("click", saveRecipe);
    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);
    tableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("edit-button")) {
            openModal(parseInt(e.target.dataset.index));
        } else if (e.target.classList.contains("delete-button")) {
            const id = recipeData[parseInt(e.target.dataset.index)].id;
            fetch(`/api/recipes/${id}`, { method: "DELETE" })
                .then(() => fetchRecipes())
                .catch(error => console.error("Error deleting recipe:", error));
        }
    });

    populateTags();
    fetchRecipes();
});
