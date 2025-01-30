document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#recipe-table tbody");
    const searchInput = document.getElementById("search-input");
    const addEntryButton = document.getElementById("add-entry-button");
    const modal = document.getElementById("recipe-modal");
    const closeButton = document.querySelector(".close-button");
    const modalTitle = document.getElementById("modal-title");

    const formInputs = {
        name: document.getElementById("name"),
        servingsType: document.getElementById("servings-type"),
        servingsCount: document.getElementById("servings-count"),
    };

    const tagInput = document.getElementById("tag-input");
    const tagContainer = document.getElementById("tag-container");

    const ingredientTable = document.querySelector("#ingredient-table tbody");
    const addIngredientButton = document.getElementById("add-ingredient-button");

    const stepContainer = document.getElementById("step-container");
    const addStepButton = document.getElementById("add-step-button");

    const saveButton = document.getElementById("save-button");
    const cancelButton = document.getElementById("cancel-button");

    let recipeData = [];
    let editingIndex = null;
    let selectedTags = new Set();

    // Ensure modal is hidden by default
    modal.style.display = "none";

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
        const filteredData = recipeData.filter(item =>
            item.name.toLowerCase().includes(searchInput.value.toLowerCase())
        );

        filteredData.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.servings_type}</td>
                <td>${item.servings_count}</td>
                <td>${item.tags || "None"}</td>
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
        modalTitle.textContent = editingIndex !== null ? "Edit Recipe" : "Add Recipe";

        if (editingIndex !== null) {
            const entry = recipeData[editingIndex];
            formInputs.name.value = entry.name;
            formInputs.servingsType.value = entry.servings_type;
            formInputs.servingsCount.value = entry.servings_count;
            selectedTags = new Set(entry.tags ? entry.tags.split(", ") : []);
            renderTags();
        } else {
            for (const key in formInputs) {
                formInputs[key].value = "";
            }
            selectedTags.clear();
            renderTags();
        }

        modal.style.display = "block";
    }

    function closeModal() {
        modal.style.display = "none";
        editingIndex = null;
    }

    function renderTags() {
        tagContainer.innerHTML = "";
        selectedTags.forEach(tag => {
            const tagElement = document.createElement("span");
            tagElement.className = "tag";
            tagElement.textContent = tag;
            tagElement.addEventListener("click", () => {
                selectedTags.delete(tag);
                renderTags();
            });
            tagContainer.appendChild(tagElement);
        });
    }

    tagInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter" && tagInput.value.trim() !== "") {
            event.preventDefault();
            selectedTags.add(tagInput.value.trim());
            tagInput.value = "";
            renderTags();
        }
    });

    function addIngredientRow(ingredient = { name: "", quantity: "", unit: "" }) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="text" class="ingredient-name" value="${ingredient.name}"></td>
            <td><input type="number" class="ingredient-quantity" value="${ingredient.quantity}" step="0.01"></td>
            <td><input type="text" class="ingredient-unit" value="${ingredient.unit}"></td>
            <td><button class="remove-ingredient">X</button></td>
        `;
        ingredientTable.appendChild(row);

        row.querySelector(".remove-ingredient").addEventListener("click", () => {
            row.remove();
        });
    }

    function addStepRow(step = { text: "", ingredient: "", quantity: "", unit: "" }) {
        const stepRow = document.createElement("div");
        stepRow.className = "step-row";
        stepRow.innerHTML = `
            <textarea class="step-text" placeholder="Describe the step...">${step.text}</textarea>
            <input type="text" class="step-ingredient" placeholder="Ingredient (optional)" value="${step.ingredient}">
            <input type="number" class="step-quantity" placeholder="Quantity" value="${step.quantity}">
            <input type="text" class="step-unit" placeholder="Unit" value="${step.unit}">
            <button class="remove-step">X</button>
        `;
        stepContainer.appendChild(stepRow);

        stepRow.querySelector(".remove-step").addEventListener("click", () => {
            stepRow.remove();
        });
    }

    async function saveEntry() {
        const newEntry = {
            name: formInputs.name.value.trim(),
            servings_type: formInputs.servingsType.value.trim(),
            servings_count: parseInt(formInputs.servingsCount.value, 10),
            tags: Array.from(selectedTags).join(", "),
            ingredients: [],
            steps: []
        };

        document.querySelectorAll("#ingredient-table tbody tr").forEach(row => {
            const ingredient = {
                name: row.querySelector(".ingredient-name").value.trim(),
                quantity: parseFloat(row.querySelector(".ingredient-quantity").value),
                unit: row.querySelector(".ingredient-unit").value.trim(),
            };
            if (ingredient.name) {
                newEntry.ingredients.push(ingredient);
            }
        });

        document.querySelectorAll(".step-row").forEach(row => {
            const step = {
                text: row.querySelector(".step-text").value.trim(),
                ingredient: row.querySelector(".step-ingredient").value.trim(),
                quantity: parseFloat(row.querySelector(".step-quantity").value),
                unit: row.querySelector(".step-unit").value.trim(),
            };
            if (step.text) {
                newEntry.steps.push(step);
            }
        });

        if (!newEntry.name) {
            alert("Recipe name is required.");
            return;
        }

        try {
            if (editingIndex !== null) {
                const response = await fetch(`/api/recipes/${recipeData[editingIndex].id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newEntry),
                });
                if (!response.ok) throw new Error("Failed to update recipe.");
            } else {
                const response = await fetch("/api/recipes/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newEntry),
                });
                if (!response.ok) throw new Error("Failed to add recipe.");
            }

            closeModal();
            fetchRecipes();
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
    addIngredientButton.addEventListener("click", () => addIngredientRow());
    addStepButton.addEventListener("click", () => addStepRow());

    tableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("edit-button")) {
            openModal(parseInt(e.target.dataset.index));
        } else if (e.target.classList.contains("delete-button")) {
            const id = recipeData[parseInt(e.target.dataset.index)].id;
            fetch(`/api/recipes/${id}`, { method: "DELETE" })
                .then(() => fetchRecipes())
                .catch(error => console.error("Error deleting entry:", error));
        }
    });

    fetchRecipes();
});
