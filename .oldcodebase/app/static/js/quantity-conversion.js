document.addEventListener('DOMContentLoaded', function() {
    const fromUnitSelect = document.getElementById('from-unit');
    const toUnitSelect = document.getElementById('to-unit');
    const convertAmount = document.getElementById('convert-amount');
    const convertButton = document.getElementById('convert-button');
    const conversionResult = document.getElementById('conversion-result');
    const conversionTable = document.getElementById('conversion-table');
    const modal = document.getElementById('conversion-modal');
    const addEntryButton = document.getElementById('add-entry-button');
    const closeButton = document.querySelector('.close-button');
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');
    const unitInput = document.getElementById('unit');
    const valueInput = document.getElementById('value');
    const referenceUnitInput = document.getElementById('reference-unit');

    // Load conversions on page load
    loadConversions();

    convertButton.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const fromUnit = fromUnitSelect.value;
        const toUnit = toUnitSelect.value;
        const amount = convertAmount.value;

        if (!fromUnit || !toUnit || !amount) {
            showError('Please fill in all fields');
            return;
        }

        try {
            console.log('Sending conversion request:', {
                from_unit: fromUnit,
                to_unit: toUnit,
                amount: amount
            });

            const response = await fetch('/api/quantity-conversions/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from_unit: fromUnit,
                    to_unit: toUnit,
                    amount: amount
                })
            });

            const data = await response.json();
            console.log('Conversion response:', data);
            
            if (response.ok) {
                const result = Number(data.result).toFixed(3);
                conversionResult.textContent = `${amount} ${fromUnit} = ${result} ${toUnit}`;
                conversionResult.classList.remove('error');
            } else {
                showError(data.error || 'Conversion failed');
            }
        } catch (error) {
            console.error('Conversion error:', error);
            showError('An error occurred during conversion');
        }
    });

    addEntryButton.addEventListener('click', () => {
        modal.style.display = 'block';
        unitInput.value = '';
        valueInput.value = '';
        referenceUnitInput.value = '';
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    cancelButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    saveButton.addEventListener('click', async () => {
        const unit = unitInput.value.trim();
        const value = valueInput.value;
        const referenceUnit = referenceUnitInput.value.trim();

        if (!unit || !value || !referenceUnit) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch('/api/quantity-conversions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    unit_name: unit,
                    reference_unit_name: referenceUnit,
                    reference_unit_amount: parseFloat(value),
                    unit_type: getReferenceType(referenceUnit)
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                modal.style.display = 'none';
                loadConversions();
            } else {
                alert(data.error || 'Failed to save conversion');
            }
        } catch (error) {
            console.error('Error saving conversion:', error);
            alert('An error occurred while saving the conversion');
        }
    });

    async function loadConversions() {
        try {
            const response = await fetch('/api/quantity-conversions/');
            const conversions = await response.json();
            
            if (response.ok) {
                updateConversionTable(conversions);
                updateUnitSelects(conversions);
            } else {
                showError('Failed to load conversions');
            }
        } catch (error) {
            console.error('Error loading conversions:', error);
            showError('An error occurred while loading conversions');
        }
    }

    function updateConversionTable(conversions) {
        const tbody = conversionTable.querySelector('tbody');
        tbody.innerHTML = '';

        conversions.forEach(conversion => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${conversion.unit_name}</td>
                <td>${conversion.reference_unit_amount}</td>
                <td>${conversion.reference_unit_name}</td>
                <td class="actions">
                    <button class="edit-button" onclick="editConversion(${conversion.id})"><i class="fas fa-edit"></i></button>
                    <button class="delete-button" onclick="deleteConversion(${conversion.id})"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    function updateUnitSelects(conversions) {
        const units = [...new Set(conversions.map(c => c.unit_name))];
        const referenceUnits = [...new Set(conversions.map(c => c.reference_unit_name))];
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

    // Helper function to determine unit type based on reference unit
    function getReferenceType(referenceUnit) {
        const massUnits = ['g', 'kg', 'oz', 'lb'];
        const volumeUnits = ['ml', 'L', 'fl oz', 'gal', 'quart', 'pint'];
        const timeUnits = ['mins', 'hours'];

        referenceUnit = referenceUnit.toLowerCase();
        
        if (massUnits.includes(referenceUnit)) return 'mass';
        if (volumeUnits.includes(referenceUnit)) return 'volume';
        if (timeUnits.includes(referenceUnit)) return 'time';
        return 'count';
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
        const response = await fetch(`/api/quantity-conversions/${id}`, {
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
