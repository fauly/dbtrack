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
    const tagSuggestions = document.getElementById("tag-suggestions");
    const tagContainer = document.getElementById("tag-container");

    const servingsSuggestions = document.getElementById("servings-suggestions");

    const ingredientTable = document.querySelector("#ingredient-table tbody");

    const stepContainer = document.getElementById("step-container");

    const saveButton = document.getElementById("save-button");
    const cancelButton = document.getElementById("cancel-button");

    let recipeData = [];
    let editingIndex = null;
    let selectedTags = new Set();

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

    tagInput.addEventListener("input", async () => {
        const searchTerm = tagInput.value.trim().toLowerCase();
        if (!searchTerm) {
            tagSuggestions.innerHTML = "";
            return;
        }
        try {
            const response = await fetch(`/api/tags/search?query=${searchTerm}`);
            const results = await response.json();
            tagSuggestions.innerHTML = results.map(tag => `<li>${tag}</li>`).join("");
        } catch (error) {
            console.error("Error fetching tag suggestions:", error);
        }
    });

    servingsSuggestions.addEventListener("input", async () => {
        const searchTerm = formInputs.servingsType.value.trim().toLowerCase();
        if (!searchTerm) {
            servingsSuggestions.innerHTML = "";
            return;
        }
        try {
            const response = await fetch(`/api/recipes/servings/search?query=${searchTerm}`);
            const results = await response.json();
            servingsSuggestions.innerHTML = results.map(type => `<li>${type}</li>`).join("");
        } catch (error) {
            console.error("Error fetching serving suggestions:", error);
        }
    });

    searchInput.addEventListener("input", renderTable);
    addEntryButton.addEventListener("click", () => openModal());
    saveButton.addEventListener("click", closeModal);
    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);

    fetchRecipes();
});
