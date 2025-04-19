export function setupSearchbar(id) {
  // DOM elements
  const wrapper   = document.getElementById(`${id}-wrapper`);
  const inputDiv  = document.getElementById(`${id}-input`);
  const sugList   = document.getElementById(`${id}-suggestions`);
  const endpoint  = wrapper.dataset.endpoint;
  const tableSel  = wrapper.dataset.target;
  const columns   = JSON.parse(wrapper.dataset.columns);
  const fields    = JSON.parse(wrapper.dataset.fields);

  // Color palette for argument pills
  const rainbow = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];

  // Global state
  let currentVisibleData = [];
  let lastQuery = undefined;
  let current = null;
  let activeArg = null;
  let debounceT;

  // Filter definitions
  const FILTER_DEFS = {
    condition: {
      args: [
        { name: 'column', source: () => fields },
        { name: 'operator', source: () => [
          'equal', 'not_equal', 'greater_than', 'greater_than_or_equal',
          'less_than', 'less_than_or_equal', 'contains'
        ]},
        { name: 'value', source: () => [] }
      ]
    },
    select: {
      args: [
        { name: 'column', source: () => fields },
        { name: 'value', source: () => [] }
      ]
    },
    between: {
      args: [
        { name: 'column', source: () => fields },
        { name: 'min', source: () => [] },
        { name: 'max', source: () => [] }
      ]
    },
    sort: {
      args: [
        { name: 'column', source: () => fields },
        { name: 'order', source: () => ['asc', 'desc'] }
      ]
    }
  };

  /** Debug logger */
  const debugState = () => {
    console.log('Current State:', {
      current,
      activeArg: activeArg?.textContent,
      suggestionsVisible: sugList.style.display !== 'none',
      activeSuggestion: sugList.querySelector('.active')?.textContent,
      buildingToken: inputDiv.querySelector('.token.building')?.innerHTML
    });
  };

  /** Insert raw HTML at current caret location */
  function insertHTMLAtCaret(html) {
    const range = window.getSelection().getRangeAt(0);
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const frag = document.createDocumentFragment();
    let node, lastNode;
  
    while ((node = temp.firstChild)) {
      lastNode = frag.appendChild(node);
    }
  
    range.deleteContents();
    range.insertNode(frag);
  
    // Move caret after inserted content
    if (lastNode) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }
  


  /** Prevent caret from entering finalized token spans */
  function handleCaretPosition(e) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const isInsideToken = range.commonAncestorContainer.closest('.token');
    const isInsideEditingArg = range.commonAncestorContainer.closest('.arg.editing');
    
    // Block cursor in finalized token spans
    if (isInsideToken && !isInsideEditingArg) {
      e.preventDefault();
      return false;
    }
    return true;
  }

  /** Observe mutations and scrub accidental edits */
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        const tokens = inputDiv.querySelectorAll('.token:not(.building)');
        tokens.forEach(token => {
          Array.from(token.childNodes).forEach(node => {
            if (node.nodeType === 3 && node.textContent.trim()) {
              node.remove();  // remove rogue text nodes
            }
          });
        });
      }
    });
  });

  observer.observe(inputDiv, {
    childList: true,
    subtree: true,
    characterData: true
  });

  /** Prevent direct edits unless token is building */
  inputDiv.addEventListener('beforeinput', (e) => {
    const token = e.target.closest('.token');
    if (!token) return; // allow normal input
    const isBuilding = token.classList.contains('building');
    const editingArg = token.querySelector('.arg.editing');
    if (!isBuilding && !editingArg) {
      e.preventDefault();
    }
  });
  /** Highlight hovered suggestion */
  sugList.addEventListener('mousemove', (e) => {
    const target = e.target.closest('.list-group-item-action');
    if (!target) return;

    sugList.querySelectorAll('.list-group-item-action')
      .forEach(item => item.classList.remove('active'));
    target.classList.add('active');
  });

  /** Select suggestion on click */
  sugList.addEventListener('click', (e) => {
    const target = e.target.closest('.list-group-item-action');
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    pickSuggestion(target.textContent);
  });

  function pickSuggestion(val) {
    if (!current) return;
  
    const building = inputDiv.querySelector('span.token.building');
  
    // Handle filter type selection
    if (!current.type) {
      if (val in FILTER_DEFS) {
        current.type = val;
        building.innerHTML = `<code>${val}</code>`;
        current.stage = 0;
        renderArgSuggestions();
      }
      return;
    }
  
    // Handle argument selection
    const def = FILTER_DEFS[current.type];
    const arg = def.args[current.stage];
  
    // Validate operator
    if (arg.name === 'operator' && !['equal', 'not_equal', 'greater_than', 'greater_than_or_equal','less_than', 'less_than_or_equal', 'contains'].includes(val)) {
      console.warn('Invalid operator:', val);
      return;
    }
  
    current.args.push(val);
    current.stage++;
  
    const currentArg = building.querySelector('.arg.editing');
    if (currentArg) {
      currentArg.textContent = val;
      currentArg.contentEditable = false;
      currentArg.classList.remove('editing');
    }
  
    if (current.stage < def.args.length) {
      renderArgSuggestions();
    } else {
      finalizeToken();
      current = null;
      activeArg = null;
      triggerSearch();
    }
  
    hideSuggestions();
    debugState();
  }
  

  /** Render suggestions into dropdown */
  function showSuggestions(list) {
    sugList.innerHTML = list.map((item, i) =>
      `<li class="list-group-item list-group-item-action${i === 0 ? ' active' : ''}">${item}</li>`
    ).join('');
    sugList.style.display = list.length ? 'block' : 'none';

    sugList.querySelectorAll('.list-group-item-action').forEach(li => {
      li.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        pickSuggestion(li.textContent);
      };
    });
  }

  /** Hide suggestion dropdown */
  function hideSuggestions() {
    sugList.style.display = 'none';
  }
  /** Keyboard navigation for building tokens and selecting suggestions */
  inputDiv.addEventListener('keydown', (e) => {
    const building = inputDiv.querySelector('span.token.building');
    const suggestions = sugList.querySelectorAll('.list-group-item-action');
    const editingArg = building?.querySelector('.arg.editing');
    const suggestionsVisible = sugList.style.display === 'block';

    console.log('Keydown:', e.key, {
      building: !!building,
      editingArg: !!editingArg,
      suggestionsVisible
    });

    // ⌫ Backspace inside an argument — supports smart deletion / rollback
    if (e.key === 'Backspace' && building && editingArg) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      if (range.startOffset === 0 && editingArg.textContent.trim() === '') {
        e.preventDefault();
        if (current.stage === 1 && current.type === 'condition') {
          editingArg.textContent = '';
          renderArgSuggestions('');
          return;
        }

        editingArg.classList.remove('editing');
        if (current.stage > 0) {
          current.stage--;
          const prevArg = building.querySelector(`.arg:nth-child(${current.stage + 2})`);
          if (prevArg) {
            prevArg.classList.add('editing');
            renderArgSuggestions(prevArg.textContent.trim());
          }
        } else {
          building.remove();
          current = null;
          hideSuggestions();
        }
      }
    }

    // ↩ Prevent newlines
    if (e.key === 'Enter') {
      e.preventDefault();
    }

    // ⌨️ Start new token with `<`
    if (e.key === '<' && !current) {
      e.preventDefault();
      current = { type: null, args: [], stage: 0 };
      insertHTMLAtCaret(`<span class="token building" contenteditable="true" style="min-width: 60px; display: inline-block;"></span>`);
      const span = inputDiv.querySelector('span.token.building');
      placeCaretInside(span);
      renderTypeSuggestions();
      return;
    }

    // ↩ or ␣ to confirm suggestions
    if ((e.key === 'Enter' || e.key === ' ') && suggestionsVisible) {
      const active = sugList.querySelector('.active');
      const first = sugList.querySelector('.list-group-item-action');

      if (!current?.type) {
        if (active || first) {
          e.preventDefault();
          e.stopPropagation();
          pickSuggestion((active || first).textContent);
        }
      } else {
        if (active) {
          e.preventDefault();
          e.stopPropagation();
          pickSuggestion(active.textContent);
        } else if (editingArg) {
          const val = editingArg.textContent.trim();
          if (val) {
            e.preventDefault();
            e.stopPropagation();
            pickSuggestion(val);
          }
        }
      }
    }

    // ↑↓ Arrow key navigation in suggestions
    if (['ArrowDown', 'ArrowUp'].includes(e.key) && suggestions.length > 0) {
      e.preventDefault();
      const items = Array.from(suggestions);
      let idx = items.findIndex(i => i.classList.contains('active'));
      if (idx === -1) {
        idx = e.key === 'ArrowDown' ? -1 : items.length;
      }
      items.forEach(i => i.classList.remove('active'));

      if (e.key === 'ArrowDown') {
        idx = (idx + 1) % items.length;
      } else {
        idx = (idx - 1 + items.length) % items.length;
      }

      items[idx].classList.add('active');
      items[idx].scrollIntoView({ block: 'nearest' });
    }
  });
  /** Handle user pasting */
  inputDiv.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');

    if (current?.type) {
      const editingArg = inputDiv.querySelector('.arg.editing');
      if (editingArg) {
        editingArg.textContent = text;
        renderArgSuggestions(text);
      }
    } else {
      document.execCommand('insertText', false, text);
      debounceSearch();
    }
  });

  /** Handle live typing to update tokens or trigger search */
  inputDiv.addEventListener('input', () => {
    const building = inputDiv.querySelector('span.token.building');

    console.log('Input event:', {
      building: !!building,
      currentType: current?.type,
      currentStage: current?.stage,
      text: building?.textContent
    });

    if (!building && current) {
      current = null;
      activeArg = null;
      hideSuggestions();
      debounceSearch();
      return;
    }

    if (current) {
      if (!current.type) {
        const txt = building.textContent.trim();
        renderTypeSuggestions(txt);
        const matchedType = Object.keys(FILTER_DEFS).find(t =>
          t.toLowerCase() === txt.toLowerCase().replace(/[<>]/g, '')
        );
        if (matchedType) {
          current.type = matchedType;
          building.innerHTML = `<code>${matchedType}</code>`;
          current.stage = 0;
          renderArgSuggestions();
        }
      } else {
        const editingArg = building.querySelector('.arg.editing');
        if (editingArg) {
          renderArgSuggestions(editingArg.textContent.trim());
        }
      }
    } else {
      debounceSearch();
    }
  });
  /** Debounced query execution */
  function debounceSearch() {
    clearTimeout(debounceT);
    debounceT = setTimeout(triggerSearch, 300);
  }

  function isQueryValid() {
    const building = inputDiv.querySelector('span.token.building');
    if (building) return false;
    return true;
  }
  

  /** Trigger search from query input */
  function triggerSearch() {
    if (!isQueryValid()) return;
    const q = getRawQuery();
    if (lastQuery !== undefined && q === lastQuery) return;
    lastQuery = q;

    console.log('Triggering search with query:', q);
    fetch(`${endpoint}?query=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(rows => {
        currentVisibleData = rows;
        renderRows(rows);
      });
  }

  /** Render result rows into target table */
  function renderRows(rows) {
    const tbody = document.querySelector(tableSel + ' tbody');
    tbody.innerHTML = '';

    rows.forEach(item => {
      const tr = document.createElement('tr');
      tr.dataset.id = item.id;

      columns.forEach(col => {
        const td = document.createElement('td');
        td.innerHTML = `<input class="form-control" name="${col}" value="${item[col] || ''}">`;
        tr.appendChild(td);
      });

      const tdDel = document.createElement('td');
      tdDel.innerHTML = `<button class="btn btn-sm btn-danger" onclick="deleteRow(this,'quantities')">🗑</button>`;
      tr.appendChild(tdDel);
      tbody.appendChild(tr);
    });
  }

  /** Build search query string from tokens */
  function getRawQuery() {
    let out = '';

    inputDiv.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        const text = n.textContent.trim();
        if (text) out += text;
      } else if (n.classList?.contains('token')) {
        if (n.dataset.blob) {
          out += `<${n.dataset.blob}>`;
        } else if (n.classList.contains('building')) {
          const type = n.querySelector('code')?.textContent;
          const args = Array.from(n.querySelectorAll('.arg'))
            .map(arg => arg.textContent.trim())
            .filter(Boolean);
          if (type && args.length > 0) {
            out += `<${[type, ...args].join('__')}>`;
          }
        }
      }
    });

    return out.trim();
  }
  /** Render available filter types (e.g. condition, sort) */
  function renderTypeSuggestions(filter = '') {
    filter = filter.replace(/[<>]/g, '').trim();
    const types = Object.keys(FILTER_DEFS)
      .filter(t => t.toLowerCase().includes(filter.toLowerCase()));
    showSuggestions(types);
  }

  /** Render suggestions for current argument stage */
  function renderArgSuggestions(inputValue = '') {
    const def = FILTER_DEFS[current.type];
    const arg = def.args[current.stage];
    const building = inputDiv.querySelector('span.token.building');
  
    let editingArg = building.querySelector('.arg.editing');
  
    // If we're just moving to the next stage and editingArg doesn't exist yet
    if (!editingArg) {
      // Build HTML from scratch
      let html = `<code>${current.type}</code>`;
      def.args.forEach((argDef, i) => {
        const isEditing = i === current.stage;
        const value = i < current.stage ? current.args[i] : '';
        const color = rainbow[i % rainbow.length];
        html += `<span class="arg${isEditing ? ' editing' : ''}"
                  style="min-width: 40px; ${i > current.stage ? 'opacity: 0.5;' : ''};
                  background-color: ${color}33; border-color: ${color}99;"
                  data-placeholder="${argDef.name}"
                  contenteditable="${isEditing}">${value}</span>`;
      });
      building.innerHTML = html;
      editingArg = building.querySelector('.arg.editing');
      if (editingArg) {
        placeCaretInside(editingArg);
        activeArg = editingArg;
      }
    }
  
    // If user is actively typing in the argument
    if (editingArg) {
      const currentInput = inputValue || editingArg.textContent.trim();
  
      if (arg.name === 'operator') {
        const suggestions = [
          'equal', 'not_equal', 'greater_than', 'greater_than_or_equal',
          'less_than', 'less_than_or_equal', 'contains'
        ].filter(op => !currentInput || op.includes(currentInput));
        showSuggestions(suggestions);
      } else if (['value', 'min', 'max'].includes(arg.name)) {
        const columnName = current.args[0];
        const suggestions = [...new Set(
          currentVisibleData
            .map(row => String(row[columnName]))
            .filter(val => val && (!currentInput || val.toLowerCase().includes(currentInput.toLowerCase())))
        )].sort();
  
        if (currentInput && !suggestions.includes(currentInput)) {
          suggestions.unshift(currentInput);
        }
        showSuggestions(suggestions);
      } else {
        const suggestions = arg.source(current)
          .filter(s => !currentInput || s.toLowerCase().includes(currentInput.toLowerCase()));
        showSuggestions(suggestions);
      }
    }
  }
  

  /** Finalize token as complete + lock it */
  function finalizeToken() {
    const blob = [current.type, ...current.args].join('__');
    const span = inputDiv.querySelector('span.token.building');
    span.classList.remove('building');
    span.dataset.blob = blob;
    span.contentEditable = false;

    span.querySelectorAll('.arg').forEach((arg, i) => {
      const color = rainbow[i % rainbow.length];
      arg.style.backgroundColor = `${color}33`;
      arg.style.borderColor = `${color}99`;
      arg.contentEditable = false;
      arg.classList.remove('editing');
    });

    span.insertAdjacentText('afterend', ' ');
    placeCaretOutside(span);
  }

    /** Place caret inside the given element */
    function placeCaretInside(el) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  
    /** Place caret just after the given element */
    function placeCaretOutside(el) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStartAfter(el);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  
  // Run once ready
  document.addEventListener('DOMContentLoaded', triggerSearch);
  debugState();
}
