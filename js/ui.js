// ui.js - UI komponenty a helpery
import { createEl, showToast } from './utils.js';

// Inicializace modálního okna
export function initModal() {
  const modal = document.getElementById('modal');
  
  // Zavření modálu kliknutím mimo obsah
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Zavření klávesou Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Otevření modálního okna
export function showModal(content, options = {}) {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');
  
  // Pokud je content string, použij jako innerHTML
  if (typeof content === 'string') {
    modalContent.innerHTML = content;
  } 
  // Jinak předpokládej, že content je DOM element
  else if (content instanceof Element) {
    modalContent.innerHTML = '';
    modalContent.appendChild(content);
  }
  
  modal.classList.add('active');
}

// Zavření modálního okna
export function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('active');
}

// Vytvoření karty
export function createCard(title, content, className = '') {
  return createEl('div', { className: `card ${className}` }, [
    createEl('div', { className: 'card-header' }, [
      createEl('h3', { className: 'card-title' }, title)
    ]),
    createEl('div', { className: 'card-content' }, content)
  ]);
}

// Vytvoření sekce pro kategorii
export function createCategorySection(category, items, renderItem, className = '') {
  // Ikonka pro kategorii (lze upravit dle potřeby)
  const categoryIcons = {
    'Služby': '🔧',
    'Nápoje – Alkohol': '🍸',
    'Nápoje – Nealko': '🥤',
    'Ostatní': '📦',
    'Snídaně': '🍳',
    'Poplatky': '💰',
    'Dárky': '🎁'
  };
  
  const icon = categoryIcons[category] || '';
  
  return createEl('div', { className: `category-section ${className}` }, [
    createEl('div', { className: 'category-header' }, [
      createEl('h3', { className: 'category-title' }, category),
      createEl('span', { className: 'category-icon' }, icon)
    ]),
    ...items.map(renderItem)
  ]);
}

// Vytvoření tlačítka
export function createButton(text, onClick, options = {}) {
  const { type = 'primary', size = '', icon = null, className = '' } = options;
  
  let btnContent = [];
  if (icon) {
    btnContent.push(createEl('span', { innerHTML: icon }));
  }
  btnContent.push(text);
  
  return createEl('button', {
    className: `btn btn-${type} ${size ? 'btn-' + size : ''} ${className}`,
    events: { click: onClick },
    type: 'button'
  }, btnContent);
}

// Vytvoření ikonového tlačítka
export function createIconButton(icon, onClick, options = {}) {
  const { title = '', type = 'primary', className = '' } = options;
  
  return createEl('button', {
    className: `btn btn-icon btn-${type} ${className}`,
    title,
    events: { click: onClick },
    type: 'button',
    innerHTML: icon
  });
}

// Vytvoření formulářového pole
export function createFormField(label, input, options = {}) {
  const { id = '', required = false, note = '', className = '' } = options;
  
  const formGroup = createEl('div', { className: `form-group ${className}` });
  
  if (label) {
    const labelElement = createEl('label', { 
      className: 'form-label', 
      for: id 
    }, label + (required ? ' *' : ''));
    formGroup.appendChild(labelElement);
  }
  
  formGroup.appendChild(input);
  
  if (note) {
    const noteElement = createEl('div', { className: 'form-note' }, note);
    formGroup.appendChild(noteElement);
  }
  
  return formGroup;
}

// Vytvoření select inputu
export function createSelect(options, selected, onChange, attrs = {}) {
  const select = createEl('select', {
    className: `form-control ${attrs.className || ''}`,
    id: attrs.id || '',
    name: attrs.name || '',
    events: { change: onChange }
  });
  
  options.forEach(opt => {
    const option = createEl('option', {
      value: opt.value,
      textContent: opt.text
    });
    
    if (opt.value === selected) {
      option.selected = true;
    }
    
    select.appendChild(option);
  });
  
  return select;
}

// Vytvoření textového inputu
export function createTextInput(value, onChange, attrs = {}) {
  return createEl('input', {
    type: attrs.type || 'text',
    className: `form-control ${attrs.className || ''}`,
    id: attrs.id || '',
    name: attrs.name || '',
    placeholder: attrs.placeholder || '',
    value: value || '',
    events: { 
      input: onChange,
      ...attrs.events
    }
  });
}

// Vytvoření number inputu
export function createNumberInput(value, onChange, attrs = {}) {
  return createEl('input', {
    type: 'number',
    className: `form-control ${attrs.className || ''}`,
    id: attrs.id || '',
    name: attrs.name || '',
    placeholder: attrs.placeholder || '',
    value: value !== undefined && value !== null ? value : '',
    min: attrs.min !== undefined ? attrs.min : 0,
    step: attrs.step || 1,
    events: { 
      input: onChange,
      ...attrs.events
    }
  });
}

// Vytvoření checkbox inputu
export function createCheckbox(checked, onChange, attrs = {}) {
  const container = createEl('div', { className: 'checkbox-container' });
  
  const checkbox = createEl('input', {
    type: 'checkbox',
    className: `form-checkbox ${attrs.className || ''}`,
    id: attrs.id || '',
    name: attrs.name || '',
    checked: !!checked,
    events: { 
      change: onChange,
      ...attrs.events
    }
  });
  
  container.appendChild(checkbox);
  
  if (attrs.label) {
    const label = createEl('label', {
      className: 'checkbox-label',
      for: attrs.id || ''
    }, attrs.label);
    container.appendChild(label);
  }
  
  return container;
}

// Vytvoření výběru měny
export function createCurrencySelector(selectedCurrency, kurz, onChange) {
  const container = createEl('div', { className: 'currency-selector' });
  
  const select = createSelect(
    [
      { value: 'Kč', text: 'Kč' },
      { value: '€', text: '€' }
    ],
    selectedCurrency,
    onChange,
    { className: 'currency-select' }
  );
  
  container.appendChild(select);
  
  const rateInfo = createEl('span', { 
    className: 'current-rate' 
  }, `(1 € = ${kurz} Kč)`);
  
  container.appendChild(rateInfo);
  
  return container;
}

// Vytvoření tabulky
export function createTable(headers, rows, options = {}) {
  const { className = '', emptyMessage = 'Žádná data k zobrazení' } = options;
  
  const table = createEl('table', { className: `table ${className}` });
  
  // Hlavička
  const thead = createEl('thead');
  const headerRow = createEl('tr');
  
  headers.forEach(header => {
    const th = createEl('th', {}, header);
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Tělo
  const tbody = createEl('tbody');
  
  if (rows.length === 0) {
    const emptyRow = createEl('tr');
    const emptyCell = createEl('td', { 
      colSpan: headers.length,
      style: 'text-align: center; padding: 20px;'
    }, emptyMessage);
    
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    rows.forEach(row => {
      const tr = createEl('tr');
      
      row.forEach(cell => {
        const td = createEl('td', {}, cell);
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
  }
  
  table.appendChild(tbody);
  
  return table;
}

// Vytvoření potvrzovacího dialogu
export function confirmDialog(message, confirmCallback, cancelCallback) {
  const container = createEl('div', { className: 'confirm-dialog' });
  
  container.appendChild(createEl('p', { className: 'confirm-message' }, message));
  
  const buttonsContainer = createEl('div', { className: 'confirm-buttons' });
  
  const confirmButton = createButton('Potvrdit', () => {
    closeModal();
    confirmCallback();
  }, { type: 'danger' });
  
  const cancelButton = createButton('Zrušit', () => {
    closeModal();
    if (cancelCallback) cancelCallback();
  }, { type: 'outline' });
  
  buttonsContainer.appendChild(cancelButton);
  buttonsContainer.appendChild(confirmButton);
  
  container.appendChild(buttonsContainer);
  
  showModal(container);
}

// Úspěšná notifikace
export function notifySuccess(message) {
  showToast(message, 'success');
}

// Chybová notifikace
export function notifyError(message) {
  showToast(message, 'error');
}

// Informační notifikace
export function notifyInfo(message) {
  showToast(message, 'info');
}