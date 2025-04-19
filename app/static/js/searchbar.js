// app\static\js\searchbar.js

export function setupSearchbar(id) {
  const wrapper   = document.getElementById(`${id}-wrapper`);
  const inputDiv  = document.getElementById(`${id}-input`);
  const sugList   = document.getElementById(`${id}-suggestions`);
  const endpoint  = wrapper.dataset.endpoint;
  const tableSel  = wrapper.dataset.target;
  const columns   = JSON.parse(wrapper.dataset.columns);
  const fields    = JSON.parse(wrapper.dataset.fields);
  const rainbow   = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];

  // Store current visible data for filtering suggestions and search
  let currentVisibleData = [];
  let lastQuery = undefined;

  const FILTER_DEFS = {
    search: { args: [ { name:'column', source: ()=>fields } ] },
    condition: {
      args: [
        { name:'column',   source: ()=>fields },
        { name:'operator', source: ()=>['=','!=','>','>=','<','<=','contains'] },
        { name:'value',    source: ()=>[] }
      ]
    },
    select: {
      args: [
        { name:'column', source: ()=>fields },
        { name:'value',  source: ()=>[] }
      ]
    },
    between: {
      args: [
        { name:'column', source: ()=>fields },
        { name:'min',    source: ()=>[] },
        { name:'max',    source: ()=>[] }
      ]
    },
    sort: {
      args: [
        { name:'column', source: ()=>fields },
        { name:'order',  source: ()=>['asc','desc'] }
      ]
    }
  };

  let current = null, debounceT;
  let activeArg = null;

  // Prevent caret from moving into invalid positions
  function handleCaretPosition(e) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const isInsideToken = range.commonAncestorContainer.closest('.token');
    const isInsideEditingArg = range.commonAncestorContainer.closest('.arg.editing');
    
    // If we're inside a token but not in an editing arg, prevent the action
    if (isInsideToken && !isInsideEditingArg) {
      e.preventDefault();
      return false;
    }
    
    return true;
  }

  // Debug current state
  const debugState = () => {
    console.log('Current State:', {
      current,
      activeArg: activeArg?.textContent,
      suggestionsVisible: sugList.style.display !== 'none',
      activeSuggestion: sugList.querySelector('.active')?.textContent,
      buildingToken: inputDiv.querySelector('.token.building')?.innerHTML
    });
  }

  // Handle mouse movement over suggestions
  sugList.addEventListener('mousemove', (e) => {
    const target = e.target.closest('.list-group-item-action');
    if (!target) return;

    console.log('Mouse over suggestion:', target.textContent);
    // Remove active class from all items first
    sugList.querySelectorAll('.list-group-item-action').forEach(item => 
      item.classList.remove('active')
    );
    target.classList.add('active');
  });

  // Handle click selection
  sugList.addEventListener('click', (e) => {
    const target = e.target.closest('.list-group-item-action');
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    pickSuggestion(target.textContent);
  });

  // Prevent direct editing of tokens except during building
  inputDiv.addEventListener('beforeinput', (e) => {
    const target = e.target.closest('.token');
    if (!target) return;  // Allow typing in free text areas
    
    const isBuilding = target.classList.contains('building');
    const editingArg = target.querySelector('.arg.editing');
    
    // Allow editing in building tokens or editing args
    if (!isBuilding && !editingArg) {
      e.preventDefault();
    }
  });

  // Handle keydown events
  inputDiv.addEventListener('keydown', e => {
    const building = inputDiv.querySelector('span.token.building');
    const suggestions = sugList.querySelectorAll('.list-group-item-action');
    const editingArg = building?.querySelector('.arg.editing');
    const suggestionsVisible = sugList.style.display === 'block';
    
    console.log('Keydown:', e.key, { 
      building: !!building, 
      editingArg: !!editingArg,
      suggestionsVisible
    });

    // Handle backspace within tokens
    if (e.key === 'Backspace' && building) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      if (editingArg) {
        // Only handle special backspace behavior at the start of an argument
        if (range.startOffset === 0) {
          const content = editingArg.textContent.trim();
          
          // Only go back to previous argument if content is empty and we're backspacing
          if (content === '') {
            e.preventDefault();
            
            // For operators, just clear the content and stay in operator editing mode
            if (current.stage === 1 && current.type === 'condition') {
              editingArg.textContent = '';
              renderArgSuggestions('');
              return;
            }
            
            // Otherwise go back to previous argument
            editingArg.classList.remove('editing');
            if (current.stage > 0) {
              current.stage--;
              const prevArg = building.querySelector(`.arg:nth-child(${current.stage + 2})`);
              if (prevArg) {
                prevArg.classList.add('editing');
                renderArgSuggestions(prevArg.textContent.trim());
              }
            } else {
              // If we're at the first argument, delete the whole token
              building.remove();
              current = null;
              hideSuggestions();
            }
          }
        }
      }
    }

    // Always prevent newlines
    if (e.key === 'Enter') {
      e.preventDefault();
    }
    
    // Handle token creation and suggestion selection
    if (e.key === '<' && !current) {
      e.preventDefault();
      current = { type: null, args: [], stage: 0 };
      insertHTMLAtCaret(`<span class="token building" contenteditable="true" style="min-width: 60px; display: inline-block;"></span>`);
      const span = inputDiv.querySelector('span.token.building');
      placeCaretInside(span);
      renderTypeSuggestions();
    } else if ((e.key === 'Enter' || e.key === ' ') && suggestionsVisible) {
      const active = sugList.querySelector('.active');
      const firstSuggestion = sugList.querySelector('.list-group-item-action');
      
      // Only auto-select first item for filter types, not for arguments
      if (!current?.type) {
        // For filter type selection, always use the active item or first suggestion
        if (active || firstSuggestion) {
          e.preventDefault();
          e.stopPropagation();
          const selectedValue = (active || firstSuggestion).textContent;
          pickSuggestion(selectedValue);
        }
      } else {
        // For arguments, only use the active item if there is one
        if (active) {
          e.preventDefault();
          e.stopPropagation();
          pickSuggestion(active.textContent);
        } else if (editingArg) {
          // If no active suggestion but we have user input, use that
          const customValue = editingArg.textContent.trim();
          if (customValue) {
            e.preventDefault();
            e.stopPropagation();
            pickSuggestion(customValue);
          }
        }
      }
    } else if (['ArrowDown', 'ArrowUp'].includes(e.key) && suggestions.length > 0) {
      e.preventDefault();
      const items = Array.from(suggestions);
      let idx = items.findIndex(i => i.classList.contains('active'));
      
      // If no active item, start from beginning or end based on arrow direction
      if (idx === -1) {
        idx = e.key === 'ArrowDown' ? -1 : items.length;
      }
      
      // Remove active class from all items
      items.forEach(i => i.classList.remove('active'));
      
      // Calculate new index with wrapping
      if (e.key === 'ArrowDown') {
        idx = (idx + 1) % items.length;
      } else {
        idx = (idx - 1 + items.length) % items.length;
      }
      
      // Set active class and scroll into view
      items[idx].classList.add('active');
      items[idx].scrollIntoView({ block: 'nearest' });
    }
  });

  // Add mutation observer to ensure token integrity
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        // Check for any direct text nodes in completed tokens only
        const tokens = inputDiv.querySelectorAll('.token:not(.building)');
        tokens.forEach(token => {
          Array.from(token.childNodes).forEach(node => {
            if (node.nodeType === 3 && node.textContent.trim()) { // Text node
              // Remove any direct text in completed tokens
              node.remove();
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

  // Handle paste events
  inputDiv.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    
    if (current && current.type) {
      const editingArg = inputDiv.querySelector('.arg.editing');
      if (editingArg) {
        // Only allow pasting into editing arg
        editingArg.textContent = text;
        renderArgSuggestions(text);
      }
    } else {
      // Allow pasting in free text areas
      document.execCommand('insertText', false, text);
      debounceSearch();
    }
  });

  // Handle input events
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
        // Show filter suggestions as user types
        renderTypeSuggestions(txt);
        
        // Check if the text exactly matches a filter type (case insensitive)
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

  function triggerSearch() {
    const q = getRawQuery();
    // Only skip if we have a lastQuery and it matches current query
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

  function debounceSearch(){
    clearTimeout(debounceT);
    debounceT = setTimeout(triggerSearch, 300);
  }

  function renderRows(rows){
    const tbody = document.querySelector(tableSel + ' tbody');
    tbody.innerHTML = '';
    rows.forEach(item => {
      const tr = document.createElement('tr');
      tr.dataset.id = item.id;
      columns.forEach(col => {
        const td = document.createElement('td');
        td.innerHTML = `<input class="form-control" name="${col}" value="${item[col]||''}">`;
        tr.appendChild(td);
      });
      const tdDel = document.createElement('td');
      tdDel.innerHTML = `<button class="btn btn-sm btn-danger" onclick="deleteRow(this,'quantities')">🗑</button>`;
      tr.appendChild(tdDel);
      tbody.appendChild(tr);
    });
  }

  function getRawQuery(){
    let out = '';
    inputDiv.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        // Only add text nodes if they contain non-whitespace
        const text = n.textContent.trim();
        if (text) out += text;
      }
      else if (n.classList?.contains('token')) {
        // Get the blob from dataset, or construct it from the token content if building
        if (n.dataset.blob) {
          out += `<${n.dataset.blob}>`;
        } else if (n.classList.contains('building')) {
          const type = n.querySelector('code')?.textContent;
          const args = Array.from(n.querySelectorAll('.arg'))
            .map(arg => arg.textContent.trim())
            .filter(text => text);
          if (type && args.length > 0) {
            out += `<${[type, ...args].join('__')}>`;
          }
        }
      }
    });
    return out.trim();
  }

  function showSuggestions(list){
    sugList.innerHTML = list.map((item, i) =>
      `<li class="list-group-item list-group-item-action${i === 0 ? ' active' : ''}">${item}</li>`
    ).join('');
    sugList.style.display = list.length ? 'block' : 'none';

    // Add click handlers directly to suggestions
    sugList.querySelectorAll('.list-group-item-action').forEach(li => {
      li.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        pickSuggestion(li.textContent);
      };
    });
  }

  function hideSuggestions(){ sugList.style.display = 'none'; }

  function pickSuggestion(val) {
    if (!current) return;
    console.log('Picking suggestion:', { 
      value: val, 
      stage: current.stage,
      type: current.type,
      currentArgs: current.args 
    });
    
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
    
    // Validate the value based on the argument type
    if (arg.name === 'operator' && !['=', '!=', '>', '>=', '<', '<=', 'contains'].includes(val)) {
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
      console.log('Moving to next argument stage:', current.stage);
      renderArgSuggestions();
    } else {
      console.log('Finalizing token');
      finalizeToken();
      current = null;
      activeArg = null;
      triggerSearch();
    }
    hideSuggestions();
    debugState();
  }

  function renderTypeSuggestions(filter = '') {
    // Clean the filter text
    filter = filter.replace(/[<>]/g, '').trim();
    const types = Object.keys(FILTER_DEFS)
      .filter(t => t.toLowerCase().includes(filter.toLowerCase()));
    console.log('Filter suggestions:', { filter, types });
    showSuggestions(types);
  }

  function renderArgSuggestions(inputValue = '') {
    const def = FILTER_DEFS[current.type];
    const arg = def.args[current.stage];
    const building = inputDiv.querySelector('span.token.building');
    
    console.log('Rendering arguments:', { 
      type: current.type, 
      stage: current.stage, 
      argName: arg.name,
      currentArgs: current.args
    });

    // Only rebuild token structure if needed
    if (!building.querySelector('.arg.editing')) {
      let html = `<code>${current.type}</code>`;
      def.args.forEach((arg, i) => {
        const isEditing = i === current.stage;
        const value = i < current.stage ? current.args[i] : '';
        const color = rainbow[i % rainbow.length];
        html += `<span class="arg${isEditing ? ' editing' : ''}" 
          style="min-width: 40px; ${i > current.stage ? 'opacity: 0.5;' : ''}; 
          background-color: ${color}33; border-color: ${color}99;" 
          data-placeholder="${arg.name}" 
          contenteditable="${isEditing}">${value}</span>`;
      });
      building.innerHTML = html;
      const editingArg = building.querySelector('.arg.editing');
      if (editingArg) {
        placeCaretInside(editingArg);
        activeArg = editingArg;
      }
    }

    // Handle suggestions based on arg type
    if (arg.name === 'operator') {
      // Always show operator suggestions immediately, filtered by input
      const suggestions = ['=', '!=', '>', '>=', '<', '<=', 'contains']
        .filter(op => !inputValue || op.includes(inputValue));
      showSuggestions(suggestions);
    } else if (['value', 'min', 'max'].includes(arg.name)) {
      const columnName = current.args[0];
      let suggestions = [...new Set(
        currentVisibleData
          .map(row => String(row[columnName]))
          .filter(val => val && (!inputValue || val.toLowerCase().includes(inputValue.toLowerCase())))
      )].sort();

      // For free text fields, always include what the user is typing as first suggestion
      if (inputValue && !suggestions.includes(inputValue)) {
        suggestions.unshift(inputValue);
      }
      showSuggestions(suggestions);
    } else {
      // For other fixed fields (like column names), don't add user input
      const suggestions = arg.source(current)
        .filter(s => !inputValue || s.toLowerCase().includes(inputValue.toLowerCase()));
      showSuggestions(suggestions);
    }
  }

  function finalizeToken() {
    const blob = [current.type, ...current.args].join('__');
    const span = inputDiv.querySelector('span.token.building');
    span.classList.remove('building');
    span.dataset.blob = blob;
    span.contentEditable = false;
    
    // Keep the existing content but make it non-editable
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

  function insertHTMLAtCaret(html){
    document.execCommand('insertHTML', false, html);
  }

  function placeCaretInside(el){
    const range = document.createRange(), sel = window.getSelection();
    range.selectNodeContents(el); range.collapse(false);
    sel.removeAllRanges(); sel.addRange(range);
  }

  function placeCaretOutside(el){
    const range = document.createRange(), sel = window.getSelection();
    range.setStartAfter(el); range.collapse(true);
    sel.removeAllRanges(); sel.addRange(range);
  }

  document.addEventListener('DOMContentLoaded',   triggerSearch);
  debugState();
}
