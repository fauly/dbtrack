export function setupCrudTable(resource) {
    const container = document.getElementById(`crud-${resource}`);
    if (!container) return;
  
    const endpoint = container.dataset.endpoint;
    const columns  = JSON.parse(container.dataset.columns);
    const meta     = JSON.parse(container.dataset.meta || '{}');
  
    // Bootstrap-toaster
    function showToast() {
      const toastEl = document.getElementById(`toast-${resource}`);
      if (toastEl) new bootstrap.Toast(toastEl).show();
    }
  
    // Gather data from a row TR
    function getRowData(tr) {
      const data = {};
      for (const col of columns) {
        const m = meta[col] || {};
        if (m.readonly) {
          const el = tr.querySelector(`[data-field="${col}"]`);
          if (el) data[col] = el.textContent;
          continue;
        }
        const el = tr.querySelector(`[name="${col}"]`);
        if (!el) continue;
  
        if (m.type === 'json') {
          try {
            data[col] = JSON.parse(el.value || '{}');
            el.classList.remove('is-invalid');
          } catch {
            el.classList.add('is-invalid');
            return null;
          }
        } else {
          data[col] = el.value;
        }
      }
      return data;
    }
  
    // Calculate reference unit cost
    function calculateRefUnitCost(tr) {
        const store_quantity = parseFloat(tr.querySelector('[name="store_quantity"]')?.value);
        const cost = parseFloat(tr.querySelector('[name="cost_per_purchase"]')?.value);
        const store_unit = tr.querySelector('[name="store_unit"]')?.value;
        const default_unit = tr.querySelector('[name="default_unit"]')?.value;

        if (store_quantity && cost && store_unit && default_unit) {
            // Request conversion calculation from server
            fetch(`/api/quantities/convert?from_unit=${store_unit}&to_unit=${default_unit}&value=${store_quantity}`)
                .then(r => r.json())
                .then(result => {
                    if (result.value) {
                        const ref_cost = (cost / result.value).toFixed(4);
                        tr.querySelector('[name="ref_unit_cost"]').value = ref_cost;
                    }
                });
        }
    }
  
    // Update row with server response data
    function updateRowData(tr, serverData) {
      for (const col of columns) {
        const m = meta[col] || {};
        if (m.readonly) {
          const el = tr.querySelector(`[data-field="${col}"]`);
          if (el && serverData[col] !== undefined) {
            el.textContent = serverData[col];
          }
        }
        // Update JSON preview if this field was updated
        if (m.type === 'json' && !m.readonly) {
          const preview = tr.querySelector(`[data-field="${col}"]`);
          if (preview && serverData[col] !== undefined) {
            renderJsonPreview(preview, serverData[col]);
          }
        }
      }
    }
  
    // Save on any change
    container.addEventListener('input', async e => {
      const tr = e.target.closest('tr');
      if (!tr) return;

      // If changed field affects ref_unit_cost, recalculate it
      const affectingFields = ['store_quantity', 'cost_per_purchase', 'store_unit', 'default_unit'];
      if (affectingFields.includes(e.target.name)) {
          calculateRefUnitCost(tr);
      }

      const id = tr.dataset.id;
      const payload = getRowData(tr);
      if (!payload) return; // JSON invalid
      // enforce required
      if (columns.some(c => meta[c]?.required && !payload[c])) return;
  
      tr.classList.add('loading');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id, data: payload })
      }).then(r=>r.json());
      if (res.id) tr.dataset.id = res.id;
      if (res.data) updateRowData(tr, res.data);
      tr.classList.remove('loading');
      tr.classList.add('saving');
      showToast();
      setTimeout(()=> tr.classList.remove('saving'), 1000);
    });
  
    // Add Row
    window.addRow = function(resName) {
      if (resName !== resource) return;
      const tbody = container.querySelector('tbody');
      const tr    = document.createElement('tr');
      tr.dataset.id = '';
      tr.innerHTML = columns.map(col => {
        const m = meta[col] || {};
        if (m.readonly) {
          return `<td><span class="form-control-plaintext" data-field="${col}"></span></td>`;
        }
        if (m.type === 'select') {
          return `<td><select name="${col}" class="form-select"></select></td>`;
        } else if (m.type === 'json') {
          return `
            <td>
              <div class="d-flex align-items-start json-container">
                <div class="json-preview" data-field="${col}" data-json="{}"></div>
                <textarea name="${col}" class="form-control json-field d-none"></textarea>
                <button type="button" class="btn btn-sm btn-outline-secondary ms-2 json-edit-btn" data-col="${col}">✎</button>
              </div>
            </td>`;
        } else {
          return `<td><input type="${m.type||'text'}" name="${col}" class="form-control"></td>`;
        }
      }).join('') + `
        <td>
          <button type="button" class="btn btn-sm btn-danger" onclick="deleteRow(this,'${resource}')">🗑</button>
        </td>`;
      tbody.appendChild(tr);
      tbody.querySelector('input,select,textarea').focus();
      preloadSelects(tr);
      bindJsonButtons(tr);
      initJsonPreviews(tr);
    };
  
    // Delete Row
    window.deleteRow = function(btn, resName) {
      if (resName !== resource) return;
      const tr = btn.closest('tr');
      const id = tr.dataset.id;
      tr.classList.add('deleting');
      if (id) {
        fetch(`${endpoint}/${id}`,{method:'DELETE'})
          .then(()=> setTimeout(()=> tr.remove(),300));
      } else {
        setTimeout(()=> tr.remove(),300);
      }
    };
  
    // Preload <select> options from API
    function preloadSelects(scope) {
      columns.forEach(col => {
        const m = meta[col]||{};
        if (m.type==='select' && m.source?.includes('.')) {
          const [res, field] = m.source.split('.');
          fetch(`/api/options/${res}/${field}`)
            .then(r => r.json())
            .then(opts => {
                container
                .querySelectorAll(`select[name="${col}"]`)
                .forEach(sel => {
                    sel.innerHTML = opts
                    .map(opt => `<option value="${opt}">${opt}</option>`)
                    .join('');
                });
            });
        }
      });
    }
    
    // Function to render JSON in a user-friendly format
    function renderJsonPreview(container, data) {
      if (!data || Object.keys(data).length === 0) {
        container.innerHTML = '<em class="text-muted">Empty object</em>';
        return;
      }
    
      let html = '<div class="json-preview-content">';
    
      // For simple key-value objects
      if (typeof data === 'object' && !Array.isArray(data)) {
        html += '<table class="table table-sm table-borderless mb-0">';
        for (const [key, value] of Object.entries(data)) {
          html += `<tr>
            <td class="fw-bold text-muted" style="width:30%">${key}:</td>
            <td>${formatJsonValue(value)}</td>
          </tr>`;
        }
        html += '</table>';
      } else {
        // For arrays or other types
        html += formatJsonValue(data);
      }
    
      html += '</div>';
      container.innerHTML = html;
    }
    
    // Format values appropriately
    function formatJsonValue(value) {
      if (value === null) return '<em class="text-muted">null</em>';
      if (value === undefined) return '<em class="text-muted">undefined</em>';
      if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return `[${value.map(v => formatJsonValue(v)).join(', ')}]`;
      }
      if (typeof value === 'object') {
        return '{...}'; // Just show placeholder for nested objects
      }
      return String(value);
    }
  
    // Initialize JSON previews
    function initJsonPreviews(root = document) {
      root.querySelectorAll('.json-preview').forEach(preview => {
        try {
          const jsonData = JSON.parse(preview.dataset.json || '{}');
          renderJsonPreview(preview, jsonData);
        } catch (e) {
          console.error("Error parsing JSON data:", e);
          preview.innerHTML = '<em class="text-danger">Invalid JSON</em>';
        }
      });
    }
  
    // JSON Editor Modal plumbing
    const modalEl    = document.getElementById(`${resource}-json-editor-modal`);
    const modal      = modalEl ? new bootstrap.Modal(modalEl) : null;
    const tableBody  = modalEl ? modalEl.querySelector('tbody') : null;
    let  editingRow, editingCol, editingTextarea;
  
    function bindJsonButtons(root=document) {
      root.querySelectorAll('.json-edit-btn').forEach(btn=>{
        btn.onclick = ()=> {
          editingCol = btn.dataset.col;
          editingRow = btn.closest('tr');
          editingTextarea = editingRow.querySelector(`textarea[name="${editingCol}"]`);
          openJsonEditor();
        };
      });
    }
  
    function openJsonEditor() {
      if (!modal) return;
      
      // set title
      modalEl.querySelector(`#${resource}-json-editor-col`)
        .textContent = editingCol;
      // clear table
      tableBody.innerHTML = '';
      // populate rows
      let obj = {};
      try { obj = JSON.parse(editingTextarea.value||'{}'); } catch{}
      Object.entries(obj).forEach(([k,v])=> addJsonRow(k,v));
      modal.show();
    }
  
    // add a row to JSON editor table
    function addJsonRow(key='', val='') {
      if (!tableBody) return;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input class="form-control js-key" value="${key}"></td>
        <td><input class="form-control js-val" value="${val}"></td>
        <td><button class="btn btn-sm btn-outline-danger js-del">✖</button></td>`;
      tableBody.appendChild(tr);
      tr.querySelector('.js-del').onclick = ()=> tr.remove();
    }
  
    // Modal: Add field button
    if (modalEl) {
      modalEl.querySelector(`#${resource}-json-editor-add`)
        .onclick = ()=> addJsonRow();
    
      // Modal: Save button
      modalEl.querySelector(`#${resource}-json-editor-save`)
        .onclick = ()=>{
          const obj = {};
          tableBody.querySelectorAll('tr').forEach(tr=>{
            const k = tr.querySelector('.js-key').value;
            const v = tr.querySelector('.js-val').value;
            if (k) obj[k] = v;
          });
          editingTextarea.value = JSON.stringify(obj);
          editingTextarea.dispatchEvent(new Event('input'));  // trigger save
          
          // Update the preview
          const preview = editingRow.querySelector(`.json-preview[data-field="${editingCol}"]`);
          if (preview) {
            renderJsonPreview(preview, obj);
          }
          
          modal.hide();
        };
    }
  
    // initial setup
    document.addEventListener('DOMContentLoaded', () => {
      preloadSelects(container);
      bindJsonButtons();
      initJsonPreviews();
    });
  }
  
  // auto-setup all tables on page load
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[id^="crud-"]').forEach(div=>{
      const res = div.id.replace(/^crud-/,'');
      setupCrudTable(res);
    });
  });
