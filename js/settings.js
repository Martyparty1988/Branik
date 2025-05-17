// settings.js - Správa nastavení aplikace
import { stav, updateState } from './app.js';
import { 
  saveData, 
  loadData, 
  LS_KEYS, 
  DEFAULT_KURZ, 
  DEFAULT_ITEMS,
  CATEGORIES 
} from './data.js';
import { 
  createEl, 
  confirmAction,
  validateAmountInput
} from './utils.js';
import {
  createCard,
  createButton,
  createFormField,
  createTextInput,
  createNumberInput,
  createSelect,
  showModal,
  notifySuccess,
  notifyError,
  confirmDialog
} from './ui.js';

// Zobrazení nastavení
export function showSettings() {
  // Vytvoření obsahu modálního okna
  const modalContent = createEl('div', { className: 'settings-modal' });
  
  // Záhlaví modálního okna
  const modalHeader = createEl('div', { className: 'modal-header' });
  modalHeader.appendChild(createEl('h3', { className: 'modal-title' }, 'Nastavení'));
  modalHeader.appendChild(createEl('button', { 
    className: 'close-modal',
    innerHTML: '×',
    events: { click: () => showModal(null) }
  }));
  modalContent.appendChild(modalHeader);
  
  // Sekce - Kurz měny
  modalContent.appendChild(createCurrencyRateSection());
  
  // Sekce - Správa položek
  modalContent.appendChild(createItemsManagementSection());
  
  // Sekce - Obecné nastavení
  modalContent.appendChild(createGeneralSettingsSection());
  
  // Zobrazení modálního okna
  showModal(modalContent);
}

// Sekce pro nastavení kurzu měny
function createCurrencyRateSection() {
  const sectionContent = createEl('div', { className: 'settings-section' });
  
  // Formulář pro nastavení kurzu
  const formGroup = createEl('div', { className: 'form-group' });
  
  // Vstup pro kurz
  const rateInput = createNumberInput(
    stav.kurz || DEFAULT_KURZ,
    (e) => {
      // Validace vstupu
      const value = parseFloat(e.target.value);
      if (isNaN(value) || value <= 0) {
        e.target.setCustomValidity('Zadejte platnou hodnotu kurzu');
      } else {
        e.target.setCustomValidity('');
      }
    },
    {
      id: 'kurzInput',
      min: 0.01,
      step: 0.01,
      required: true
    }
  );
  
  formGroup.appendChild(createFormField('Kurz Kč/€:', rateInput, {
    id: 'kurzInput',
    required: true
  }));
  
  // Tlačítko pro uložení kurzu
  const saveRateBtn = createButton('Uložit kurz', () => {
    const input = document.getElementById('kurzInput');
    const value = parseFloat(input.value);
    
    if (isNaN(value) || value <= 0) {
      notifyError('Zadejte platnou hodnotu kurzu');
      return;
    }
    
    // Uložení kurzu
    saveData(LS_KEYS.KURZ, value);
    
    // Aktualizace stavu
    updateState({ kurz: value });
    
    // Notifikace
    notifySuccess('Kurz byl úspěšně aktualizován');
  }, { type: 'primary' });
  
  formGroup.appendChild(saveRateBtn);
  sectionContent.appendChild(formGroup);
  
  // Tlačítko pro obnovení výchozího kurzu
  const resetRateBtn = createButton('Obnovit výchozí kurz', () => {
    document.getElementById('kurzInput').value = DEFAULT_KURZ;
    
    // Uložení výchozího kurzu
    saveData(LS_KEYS.KURZ, DEFAULT_KURZ);
    
    // Aktualizace stavu
    updateState({ kurz: DEFAULT_KURZ });
    
    // Notifikace
    notifySuccess('Kurz byl obnoven na výchozí hodnotu');
  }, { type: 'secondary' });
  
  sectionContent.appendChild(resetRateBtn);
  
  return createCard('Nastavení kurzu měny', sectionContent);
}

// Sekce pro správu položek
function createItemsManagementSection() {
  const sectionContent = createEl('div', { className: 'settings-section' });
  
  // Tabulka položek
  const table = createEl('table', { className: 'table items-table' });
  
  // Hlavička tabulky
  const tableHead = createEl('thead');
  const headerRow = createEl('tr');
  
  headerRow.appendChild(createEl('th', {}, 'Kategorie'));
  headerRow.appendChild(createEl('th', {}, 'Název'));
  headerRow.appendChild(createEl('th', {}, 'Cena'));
  headerRow.appendChild(createEl('th', {}, 'Měna'));
  headerRow.appendChild(createEl('th', {}, 'Akce'));
  
  tableHead.appendChild(headerRow);
  table.appendChild(tableHead);
  
  // Tělo tabulky
  const tableBody = createEl('tbody');
  
  stav.items.forEach((item, index) => {
    const row = createEl('tr');
    
    // Kategorie
    row.appendChild(createEl('td', {}, item.kategorie));
    
    // Název
    const nameCell = createEl('td');
    const nameInput = createTextInput(
      item.nazev,
      null,
      {
        id: `item-name-${index}`,
        readOnly: item.fixni
      }
    );
    nameCell.appendChild(nameInput);
    row.appendChild(nameCell);
    
    // Cena
    const priceCell = createEl('td');
    const priceInput = createNumberInput(
      item.cena,
      null,
      {
        id: `item-price-${index}`,
        min: 0,
        step: item.mena === "€" ? 0.01 : 1,
        readOnly: item.fixni || item.manualni
      }
    );
    priceCell.appendChild(priceInput);
    row.appendChild(priceCell);
    
    // Měna
    const currencyCell = createEl('td');
    const currencySelect = createSelect(
      [
        { value: 'Kč', text: 'Kč' },
        { value: '€', text: '€' }
      ],
      item.mena,
      null,
      {
        id: `item-currency-${index}`,
        disabled: item.fixni
      }
    );
    currencyCell.appendChild(currencySelect);
    row.appendChild(currencyCell);
    
    // Akce
    const actionsCell = createEl('td', { className: 'table-actions' });
    
    // Tlačítko pro uložení změn
    if (!item.fixni) {
      const saveBtn = createButton('Uložit', () => {
        // Získání hodnot
        const newName = document.getElementById(`item-name-${index}`).value;
        const newPrice = parseFloat(document.getElementById(`item-price-${index}`).value);
        const newCurrency = document.getElementById(`item-currency-${index}`).value;
        
        if (!newName.trim()) {
          notifyError('Název položky nemůže být prázdný');
          return;
        }
        
        if (isNaN(newPrice) || newPrice < 0) {
          notifyError('Cena musí být nezáporné číslo');
          return;
        }
        
        // Aktualizace položky
        const updatedItems = [...stav.items];
        updatedItems[index] = {
          ...updatedItems[index],
          nazev: newName,
          cena: newPrice,
          mena: newCurrency
        };
        
        // Uložení změn
        saveData(LS_KEYS.ITEMS, updatedItems);
        
        // Aktualizace stavu
        updateState({ items: updatedItems });
        
        // Notifikace
        notifySuccess('Položka byla aktualizována');
        
        // Zavření modálního okna
        showModal(null);
      }, { type: 'primary', size: 'sm' });
      
      actionsCell.appendChild(saveBtn);
    }
    
    // Tlačítko pro skrytí položky
    if (!item.fixni) {
      const hideBtn = createButton(item.skryto ? 'Zobrazit' : 'Skrýt', () => {
        // Aktualizace položky
        const updatedItems = [...stav.items];
        updatedItems[index] = {
          ...updatedItems[index],
          skryto: !updatedItems[index].skryto
        };
        
        // Uložení změn
        saveData(LS_KEYS.ITEMS, updatedItems);
        
        // Aktualizace stavu
        updateState({ items: updatedItems });
        
        // Notifikace
        notifySuccess(`Položka byla ${item.skryto ? 'zobrazena' : 'skryta'}`);
        
        // Zavření modálního okna
        showModal(null);
      }, { type: 'secondary', size: 'sm' });
      
      actionsCell.appendChild(hideBtn);
    }
    
    // Tlačítko pro smazání položky
    if (!item.fixni) {
      const deleteBtn = createButton('Smazat', () => {
        confirmDialog(
          'Opravdu chcete smazat tuto položku?',
          () => {
            // Odstranění položky
            const updatedItems = stav.items.filter((_, i) => i !== index);
            
            // Uložení změn
            saveData(LS_KEYS.ITEMS, updatedItems);
            
            // Aktualizace stavu
            updateState({ items: updatedItems });
            
            // Notifikace
            notifySuccess('Položka byla smazána');
          }
        );
      }, { type: 'danger', size: 'sm' });
      
      actionsCell.appendChild(deleteBtn);
    }
    
    row.appendChild(actionsCell);
    tableBody.appendChild(row);
  });
  
  table.appendChild(tableBody);
  sectionContent.appendChild(table);
  
  // Tlačítko pro přidání nové položky
  const addItemBtn = createButton('Přidat novou položku', () => {
    showAddItemModal();
  }, {
    type: 'primary',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/></svg>'
  });
  
  sectionContent.appendChild(addItemBtn);
  
  return createCard('Správa položek', sectionContent);
}

// Sekce pro obecné nastavení
function createGeneralSettingsSection() {
  const sectionContent = createEl('div', { className: 'settings-section' });
  
  // Tlačítko pro reset aplikace
  const resetAppBtn = createButton('Obnovit tovární nastavení', () => {
    confirmDialog(
      'Opravdu chcete obnovit tovární nastavení? Všechny vlastní položky i historie budou smazány!',
      () => {
        // Smazání všech dat
        localStorage.clear();
        
        // Obnovení výchozích hodnot
        const defaultState = {
          kurz: DEFAULT_KURZ,
          items: DEFAULT_ITEMS,
          historie: [],
          settings: { mena: "Kč" }
        };
        
        // Aktualizace stavu
        updateState(defaultState);
        
        // Notifikace
        notifySuccess('Aplikace byla obnovena do výchozího stavu');
        
        // Zavření modálního okna
        showModal(null);
      }
    );
  }, { 
    type: 'danger',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12,3A9,9 0 0,0 3,12H0L4,16L8,12H5A7,7 0 0,1 12,5A7,7 0 0,1 19,12A7,7 0 0,1 12,19C10.5,19 9.09,18.5 7.94,17.7L6.5,19.14C8.04,20.3 9.94,21 12,21A9,9 0 0,0 21,12A9,9 0 0,0 12,3Z" fill="currentColor"/></svg>'
  });
  
  sectionContent.appendChild(resetAppBtn);
  
  return createCard('Obecné nastavení', sectionContent);
}

// Zobrazení modálního okna pro přidání nové položky
function showAddItemModal() {
  // Vytvoření obsahu modálního okna
  const modalContent = createEl('div', { className: 'add-item-modal' });
  
  // Záhlaví modálního okna
  const modalHeader = createEl('div', { className: 'modal-header' });
  modalHeader.appendChild(createEl('h3', { className: 'modal-title' }, 'Přidat novou položku'));
  modalHeader.appendChild(createEl('button', { 
    className: 'close-modal',
    innerHTML: '×',
    events: { click: () => showModal(null) }
  }));
  modalContent.appendChild(modalHeader);
  
  // Formulář
  const form = createEl('form', { 
    className: 'add-item-form',
    events: { 
      submit: (e) => {
        e.preventDefault();
        addNewItem();
      }
    }
  });
  
  // Kategorie
  const categorySelect = createSelect(
    CATEGORIES.map(cat => ({ value: cat, text: cat })),
    CATEGORIES[0],
    null,
    { id: 'new-item-category', required: true }
  );
  form.appendChild(createFormField('Kategorie:', categorySelect, {
    id: 'new-item-category',
    required: true
  }));
  
  // Název
  const nameInput = createTextInput(
    '',
    null,
    { id: 'new-item-name', required: true, placeholder: 'Název položky' }
  );
  form.appendChild(createFormField('Název:', nameInput, {
    id: 'new-item-name',
    required: true
  }));
  
  // Cena
  const priceInput = createNumberInput(
    '',
    null,
    { id: 'new-item-price', min: 0, step: 0.01, required: true, placeholder: 'Cena' }
  );
  form.appendChild(createFormField('Cena:', priceInput, {
    id: 'new-item-price',
    required: true
  }));
  
  // Měna
  const currencySelect = createSelect(
    [
      { value: 'Kč', text: 'Kč' },
      { value: '€', text: '€' }
    ],
    'Kč',
    null,
    { id: 'new-item-currency', required: true }
  );
  form.appendChild(createFormField('Měna:', currencySelect, {
    id: 'new-item-currency',
    required: true
  }));
  
  // Poznámka
  const noteInput = createTextInput(
    '',
    null,
    { id: 'new-item-note', placeholder: 'Poznámka k položce (nepovinné)' }
  );
  form.appendChild(createFormField('Poznámka:', noteInput, {
    id: 'new-item-note'
  }));
  
  // Tlačítka
  const buttonContainer = createEl('div', { className: 'form-buttons' });
  
  const cancelBtn = createButton('Zrušit', () => {
    showModal(null);
  }, { type: 'secondary' });
  buttonContainer.appendChild(cancelBtn);
  
  const submitBtn = createButton('Přidat položku', null, { 
    type: 'primary',
    events: { click: () => form.dispatchEvent(new Event('submit')) }
  });
  buttonContainer.appendChild(submitBtn);
  
  form.appendChild(buttonContainer);
  modalContent.appendChild(form);
  
  // Zobrazení modálního okna
  showModal(modalContent);
}

// Přidání nové položky
function addNewItem() {
  // Získání hodnot z formuláře
  const category = document.getElementById('new-item-category').value;
  const name = document.getElementById('new-item-name').value;
  const price = parseFloat(document.getElementById('new-item-price').value);
  const currency = document.getElementById('new-item-currency').value;
  const note = document.getElementById('new-item-note').value;
  
  // Validace
  if (!category || !name || isNaN(price) || price < 0 || !currency) {
    notifyError('Vyplňte všechna povinná pole');
    return;
  }
  
  // Vytvoření nové položky
  const newItem = {
    kategorie: category,
    nazev: name,
    cena: price,
    mena: currency,
    fixni: false
  };
  
  // Přidání poznámky, pokud byla zadána
  if (note) {
    newItem.poznamka = note;
  }
  
  // Přidání položky do seznamu
  const updatedItems = [...stav.items, newItem];
  
  // Uložení změn
  saveData(LS_KEYS.ITEMS, updatedItems);
  
  // Aktualizace stavu
  updateState({ items: updatedItems });
  
  // Notifikace
  notifySuccess('Nová položka byla přidána');
  
  // Zavření modálního okna
  showModal(null);
}