document.addEventListener('DOMContentLoaded', function() {
    const fromUnitSelect = document.getElementById('from_unit');
    const toUnitSelect = document.getElementById('to_unit');
    const fromValueInput = document.getElementById('from_value');
    const conversionForm = document.getElementById('conversion-form');
    const conversionResult = document.getElementById('conversion-result');
    const conversionTable = document.getElementById('conversion-table');

    // Load conversions on page load
    loadConversions();

    conversionForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fromUnit = fromUnitSelect.value;
        const toUnit = toUnitSelect.value;
        const fromValue = fromValueInput.value;

        if (!fromUnit || !toUnit || !fromValue) {
            showError('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from_unit: fromUnit,
                    to_unit: toUnit,
                    value: fromValue
                })
            });

            const data = await response.json();
            if (response.ok) {
                conversionResult.textContent = `${fromValue} ${fromUnit} = ${data.result} ${toUnit}`;
                conversionResult.classList.remove('error');
            } else {
                showError(data.error || 'Conversion failed');
            }
        } catch (error) {
            showError('An error occurred during conversion');
        }
    });

    async function loadConversions() {
        try {
            const response = await fetch('/api/quantity_conversions');
            const data = await response.json();
            
            if (response.ok) {
                updateConversionTable(data.conversions);
                updateUnitSelects(data.conversions);
            } else {
                showError('Failed to load conversions');
            }
        } catch (error) {
            showError('An error occurred while loading conversions');
        }
    }

    function updateConversionTable(conversions) {
        const tbody = conversionTable.querySelector('tbody');
        tbody.innerHTML = '';

        conversions.forEach(conversion => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${conversion.unit}</td>
                <td>${conversion.reference_unit}</td>
                <td>${conversion.conversion_factor}</td>
                <td class="actions">
                    <button class="edit-button" onclick="editConversion(${conversion.id})"><i class="fas fa-edit"></i></button>
                    <button class="delete-button" onclick="deleteConversion(${conversion.id})"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    function updateUnitSelects(conversions) {
        const units = [...new Set(conversions.map(c => c.unit))];
        const referenceUnits = [...new Set(conversions.map(c => c.reference_unit))];
        const allUnits = [...new Set([...units, ...referenceUnits])];

        [fromUnitSelect, toUnitSelect].forEach(select => {
            select.innerHTML = '<option value="">Select Unit</option>';
            allUnits.sort().forEach(unit => {
                const option = document.createElement('option');
                option.value = unit;
                option.textContent = unit;
                select.appendChild(option);
            });
        });
    }

    function showError(message) {
        conversionResult.textContent = message;
        conversionResult.classList.add('error');
    }
});

// Global functions for table actions
function editConversion(id) {
    window.location.href = `/quantity_conversion/edit/${id}`;
}

async function deleteConversion(id) {
    if (!confirm('Are you sure you want to delete this conversion?')) {
        return;
    }

    try {
        const response = await fetch(`/api/quantity_conversion/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete conversion');
        }
    } catch (error) {
        alert('An error occurred while deleting the conversion');
    }
}
