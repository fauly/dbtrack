// searchbar.js
export function setupSearchbar(id) {
  const wrapper   = document.getElementById(`${id}-wrapper`);
  const inputDiv  = document.getElementById(`${id}-input`);
  const sugList   = document.getElementById(`${id}-suggestions`);
  const endpoint  = wrapper.dataset.endpoint;
  const tableSel  = wrapper.dataset.target;
  const columns   = JSON.parse(wrapper.dataset.columns);
  const fields    = JSON.parse(wrapper.dataset.fields);
  const rainbow   = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];

  const FILTER_DEFS = {
    search: { args: [ { name:'term', source: ()=>[] } ] },
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

  inputDiv.addEventListener('keydown', e => {
    if (e.key === '<' && !current) {
      e.preventDefault();
      current = { type: null, args: [], stage: 0 };
      insertHTMLAtCaret(`<span class="token building" contenteditable="true"></span>`);
      const span = inputDiv.querySelector('span.token.building');
      placeCaretInside(span);
      renderTypeSuggestions();
    } else if (e.key === 'Enter' && sugList.style.display === 'block') {
      e.preventDefault();
      const active = sugList.querySelector('.active');
      if (active) pickSuggestion(active.textContent);
    } else if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
      const items = [...sugList.querySelectorAll('.list-group-item-action')];
      let idx = items.findIndex(i => i.classList.contains('active'));
      if (e.key === 'ArrowDown') idx = (idx + 1) % items.length;
      if (e.key === 'ArrowUp') idx = (idx - 1 + items.length) % items.length;
      items.forEach(i => i.classList.remove('active'));
      if (items[idx]) items[idx].classList.add('active');
    }
  });

  inputDiv.addEventListener('input', () => {
    const building = inputDiv.querySelector('span.token.building');
    if (!building && current) { current = null; hideSuggestions(); debounceSearch(); return; }
    if (current) {
      const txt = building.textContent.trim();
      if (!current.type) {
        current.type = txt in FILTER_DEFS ? txt : null;
        if (current.type) {
          building.textContent = current.type;
          current.stage = 0;
          renderArgSuggestions();
        } else renderTypeSuggestions(txt);
      } else renderArgSuggestions();
    } else debounceSearch();
  });

  function triggerSearch(){
    const q = getRawQuery();
    fetch(`${endpoint}?query=${encodeURIComponent(q)}`)
      .then(r => r.json()).then(renderRows);
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
      if (n.nodeType === 3) out += n.textContent;
      else if (n.classList?.contains('token')) out += `<${n.dataset.blob}>`;
    });
    return out.trim();
  }
  function showSuggestions(list){
    sugList.innerHTML = list.map((item, i) =>
      `<li class="list-group-item list-group-item-action${i === 0 ? ' active' : ''}">${item}</li>`
    ).join('');
    sugList.style.display = list.length ? 'block' : 'none';
    sugList.querySelectorAll('.list-group-item-action')
           .forEach(li => li.onclick = () => pickSuggestion(li.textContent));
  }
  function hideSuggestions(){ sugList.style.display = 'none'; }
  function pickSuggestion(val){
    if (current){
      current.args.push(val);
      current.stage++;
      const def = FILTER_DEFS[current.type];
      if (current.stage < def.args.length) renderArgSuggestions();
      else { finalizeToken(); current = null; triggerSearch(); }
    }
  }
  function renderTypeSuggestions(filter=''){
    const types = Object.keys(FILTER_DEFS).filter(t => t.startsWith(filter));
    showSuggestions(types);
  }
  function renderArgSuggestions(){
    const def = FILTER_DEFS[current.type];
    const arg = def.args[current.stage];
    if (['value','min','max'].includes(arg.name)) {
      fetch(`${endpoint}/${current.args[0]}?term=`)
        .then(r=>r.json()).then(arr=> showSuggestions(arr));
    } else {
      showSuggestions(arg.source(current));
    }
  }
  function finalizeToken(){
    const def  = FILTER_DEFS[current.type];
    const blob = [current.type, ...current.args].join('__');
    const span = inputDiv.querySelector('span.token.building');
    span.classList.remove('building');
    span.dataset.blob = blob;
    span.innerHTML = '';
    span.textContent = current.type;
    current.args.forEach((a,i) => {
      const ael = document.createElement('span');
      ael.className = 'arg';
      ael.style.background = rainbow[i % rainbow.length];
      ael.textContent = a;
      span.appendChild(ael);
    });
    span.insertAdjacentText('afterend',' ');
    hideSuggestions();
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

  document.addEventListener('DOMContentLoaded', triggerSearch);
}
