// invoice.js - Komponenty a logika účtenky
import { stav, updateState } from './app.js';
import { 
  CATEGORIES, 
  saveData, 
  LS_KEYS, 
  vypocitejCelkem, 
  konvertujCastku, 
  formatujCastku,
  resetForm
} from './data.js';

import { 
  createEl, 
  formatDate, 
  generateId, 
  validateNumberInput, 
  validateAmountInput,
  confirmAction
} from './utils.js';

import {
  createCard, 
  createCategorySection, 
  createButton, 
  createFormField, 
  createTextInput, 
  createNumberInput, 
  createCheckbox,
  createCurrencySelector,
  notifySuccess
} from './ui.js';

import { exportToPdf } from './export.js';

// Render účtenky
export function renderInvoice(container) {
  // Přidání záhlaví stránky
  const pageHeader = createEl('div', { className: 'page-header' }, [
    createEl('h2', { className: 'page-title' }, 'Nová účtenka')
  ]);
  container.appendChild(pageHeader);
  
  // Přidání detailů účtenky (jméno hosta, rezervace, poznámka)
  container.appendChild(renderInvoiceDetails());
  
  // Přidání výběru měny
  const currencySelector = createCurrencySelector(
    stav.settings.mena, 
    stav.kurz,
    (e) => {
      stav.settings.mena = e.target.value;
      saveData(LS_KEYS.SETTINGS, stav.settings);
      updateState({});
    }
  );
  container.appendChild(createCard('Měna', currencySelector, 'currency-card'));
  
  // Přidání sekcí s položkami
  CATEGORIES.forEach(category => {
    const categoryItems = stav.items.filter(i => i.kategorie === category && !i.skryto);
    
    // Přeskočit prázdné kategorie (kromě Dárků, ty zobrazit vždy)
    if (categoryItems.length === 0 && category !== "Dárky") return;
    
    // Speciální třída pro Dárky
    const className = category === "Dárky" ? 'gift-section' : '';
    
    const categorySection = createCategorySection(
      category, 
      categoryItems, 
      (item, index) => renderItemRow(item, index, category), 
      className
    );
    
    // Přidání tlačítka "Přidat dárek" pro kategorii Dárky
    if (category === "Dárky") {
      const addGiftBtn = createButton('Přidat dárek', addGift, {
        type: 'success',
        icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M20,11V13H13V20H11V13H4V11H11V4H13V11H20Z" fill="currentColor"/></svg>',
        className: 'add-gift-btn'
      });
      categorySection.appendChild(addGiftBtn);
    }
    
    container.appendChild(categorySection);
  });
  
  // Přidání součtu a tlačítek pro akce
  container.appendChild(renderInvoiceSummary());
}

// Render detailů účtenky
function renderInvoiceDetails() {
  const detailsCard = createCard('Detaily účtenky', '', 'details-card');
  const detailsContent = detailsCard.querySelector('.card-content');
  
  // Formulář pro detaily
  const formRow = createEl('div', { className: 'form-row' });
  
  // Jméno hosta
  const hostNameInput = createTextInput(
    stav.settings.hostName || '',
    (e) => {
      stav.settings.hostName = e.target.value;
      saveData(LS_KEYS.SETTINGS, stav.settings);
    },
    { id: 'hostName', placeholder: 'Jméno hosta' }
  );
  formRow.appendChild(createEl('div', { className: 'form-col' }, [
    createFormField('Jméno hosta', hostNameInput, { id: 'hostName' })
  ]));
  
  // Číslo rezervace
  const resNumInput = createTextInput(
    stav.settings.resNum || '',
    (e) => {
      stav.settings.resNum = e.target.value;
      saveData(LS_KEYS.SETTINGS, stav.settings);
    },
    { id: 'reservationNum', placeholder: 'Číslo rezervace' }
  );
  formRow.appendChild(createEl('div', { className: 'form-col' }, [
    createFormField('Číslo rezervace', resNumInput, { id: 'reservationNum' })
  ]));
  
  detailsContent.appendChild(formRow);
  
  // Druhý řádek s poznámkou a datem
  const formRow2 = createEl('div', { className: 'form-row' });
  
  // Poznámka
  const noteInput = createTextInput(
    stav.settings.invoiceNote || '',
    (e) => {
      stav.settings.invoiceNote = e.target.value;
      saveData(LS_KEYS.SETTINGS, stav.settings);
    },
    { id: 'invoiceNote', placeholder: 'Např. Přejeme krásný pobyt!' }
  );
  formRow2.appendChild(createEl('div', { className: 'form-col' }, [
    createFormField('Poznámka k účtence', noteInput, { id: 'invoiceNote' })
  ]));
  
  // Datum
  formRow2.appendChild(createEl('div', { className: 'form-col' }, [
    createEl('div', { className: 'form-group' }, [
      createEl('label', { className: 'form-label' }, 'Datum'),
      createEl('div', { className: 'form-control-static' }, formatDate())
    ])
  ]));
  
  detailsContent.appendChild(formRow2);
  
  return detailsCard;
}

// Render řádku s položkou
function renderItemRow(item, index, category) {
  const id = `item-${category}-${index}`;
  const row = createEl('div', { className: `item-row ${category === "Dárky" ? "gift-row" : ""}` });
  
  // Název položky
  const nameElement = createEl('div', { className: 'item-name' }, [
    createEl('span', {}, item.nazev),
    item.poznamka ? createEl('small', { className: 'item-note' }, `(${item.poznamka})`) : null
  ]);
  row.appendChild(nameElement);
  
  // Ovládací prvky dle typu položky
  const controls = createEl('div', { className: 'item-controls' });
  
  // City tax
  if (item.typ === "citytax") {
    // Input pro počet osob
    const osobyInput = createNumberInput(
      item.osoby || '',
      (e) => {
        item.osoby = parseInt(e.target.value) || 0;
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { id: `${id}-osoby`, placeholder: 'Osob', min: 0 }
    );
    controls.appendChild(createFormField('Osob', osobyInput, { className: 'mini-form' }));
    
    // Input pro počet dní
    const dnyInput = createNumberInput(
      item.dny || '',
      (e) => {
        item.dny = parseInt(e.target.value) || 0;
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { id: `${id}-dny`, placeholder: 'Dní', min: 0 }
    );
    controls.appendChild(createFormField('Dní', dnyInput, { className: 'mini-form' }));
  }
  // Manuální položky (např. wellness)
  else if (item.manualni) {
    const manualInput = createNumberInput(
      item.castka || '',
      (e) => {
        item.castka = validateAmountInput(e.target);
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { 
        id: `${id}-manual`, 
        placeholder: 'částka', 
        min: 0, 
        step: '0.01',
        className: 'amount-input'
      }
    );
    controls.appendChild(manualInput);
  }
  // Dárky
  else if (category === "Dárky") {
    // Poznámka k dárku
    const noteInput = createTextInput(
      item.poznamka || '',
      (e) => {
        item.poznamka = e.target.value;
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { 
        id: `${id}-note`, 
        placeholder: 'Poznámka (např. welcome drink)',
        className: 'gift-note' 
      }
    );
    controls.appendChild(noteInput);
    
    // Checkbox pro výběr
    const checkbox = createCheckbox(
      item.vybrano || false,
      (e) => {
        item.vybrano = e.target.checked;
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { id: `${id}-select` }
    );
    controls.appendChild(checkbox);
  }
  // Standardní položky s počtem kusů
  else {
    const countInput = createNumberInput(
      item.pocet || '',
      (e) => {
        item.pocet = validateNumberInput(e.target);
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { 
        id: `${id}-count`, 
        placeholder: '0',
        min: 0,
        className: 'count-input'
      }
    );
    controls.appendChild(countInput);
  }
  
  row.appendChild(controls);
  
  // Cena
  const cenaStr = category === "Dárky" 
    ? "—" 
    : formatujCenu(item);
  
  row.appendChild(createEl('div', { className: 'item-price' }, cenaStr));
  
  return row;
}

// Formátování ceny položky
function formatujCenu(item) {
  // Pro manuální položku zobrazujeme zadanou částku
  if (item.manualni && item.castka) {
    return stav.settings.mena === item.mena
      ? `${item.castka} ${item.mena}`
      : `${konvertujCastku(item.castka, item.mena, stav.settings.mena, stav.kurz)} ${stav.settings.mena}`;
  }
  
  // Pro standardní položku zobrazujeme základní cenu
  if (stav.settings.mena === item.mena) {
    return `${item.cena} ${item.mena}`;
  } 
  else if (stav.settings.mena === "€" && item.mena === "Kč") {
    return `${Math.round(item.cena / stav.kurz * 100) / 100} €`;
  } 
  else if (stav.settings.mena === "Kč" && item.mena === "€") {
    return `${Math.round(item.cena * stav.kurz)} Kč`;
  }
  
  return `${item.cena} ${item.mena}`;
}

// Render souhrnu účtenky
function renderInvoiceSummary() {
  const sum = vypocitejCelkem(stav.items, stav.settings, stav.kurz);
  const summaryContainer = createEl('div', { className: 'invoice-summary' });
  
  // Celková částka
  summaryContainer.appendChild(createEl('div', { 
    className: 'total-amount' 
  }, `Celkem k platbě: ${sum.celkova} ${stav.settings.mena}`));
  
  // Sleva pokud existuje
  if (sum.sleva > 0) {
    summaryContainer.appendChild(createEl('div', { 
      className: 'discount-info' 
    }, `Sleva/akce: -${sum.sleva} ${stav.settings.mena}`));
  }
  
  // Tlačítka pro akce
  const actionButtons = createEl('div', { className: 'action-buttons' });
  
  // Uložit účtenku
  const saveBtn = createButton('Uložit účtenku', ulozUctenku, {
    type: 'primary',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" fill="currentColor"/></svg>'
  });
  actionButtons.appendChild(saveBtn);
  
  // Export PDF
  const pdfBtn = createButton('Export PDF', exportToPdf, {
    type: 'secondary',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19M10.59,10.08C10.57,10.13 10.3,11.84 8.5,14.77C8.5,14.77 5,14 5,16C5,17.5 7.5,16.5 7.5,16.5L10.08,15.15C10.08,15.15 14.62,15.8 15.5,15.07C16.5,14.25 14.46,13.08 14.46,13.08L13.5,11.08C13.5,11.08 15.18,8.62 14.58,7.92C13.85,7.29 12,9.69 12,9.69L10.59,10.08M13.34,12.72C13.43,12.53 13.35,12.4 13.12,12.36C12.85,12.31 12.54,12.46 12.43,12.74C12.34,13 12.41,13.15 12.65,13.19C12.94,13.25 13.24,13.03 13.34,12.72M13.17,11.28C13.25,11.15 13.22,11 13.09,10.94C12.95,10.87 12.73,10.92 12.62,11.09C12.5,11.26 12.53,11.43 12.67,11.5C12.81,11.56 13.03,11.45 13.17,11.28M13.72,12C14.04,11.74 14.06,11.31 13.76,11.15C13.47,11 13,11.16 12.69,11.45C12.38,11.73 12.35,12.16 12.64,12.31C12.94,12.46 13.39,12.26 13.72,12M15,13.67C15.17,13.47 14.96,13.16 14.56,12.93C14.16,12.71 13.72,12.69 13.55,12.88C13.24,13.18 14.3,14.14 15,13.67Z" fill="currentColor"/></svg>'
  });
  actionButtons.appendChild(pdfBtn);
  
  // Export CSV
  const csvBtn = createButton('Export CSV', exportCsv, {
    type: 'secondary',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L10.9,15H13.3L12.2,19H15L16,15H13.8L14.7,11H11.8L10.9,15H8.6L9.5,11H7L6,15H8.2L7.1,19H10Z" fill="currentColor"/></svg>'
  });
  actionButtons.appendChild(csvBtn);
  
  // Reset
  const resetBtn = createButton('Resetovat', () => {
    confirmAction(
      'Opravdu chcete resetovat všechny zadané položky?',
      () => {
        const resetItems = resetForm(stav.items);
        updateState({ items: resetItems });
        notifySuccess('Formulář byl resetován');
      }
    );
  }, {
    type: 'danger',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" fill="currentColor"/></svg>'
  });
  
  actionButtons.appendChild(resetBtn);
  summaryContainer.appendChild(actionButtons);
  
  return summaryContainer;
}

// Uložení účtenky
function ulozUctenku() {
  // Filtrování položek, které mají být na účtence
  let polozkyNaUctence = stav.items
    .filter(item => {
      if (item.kategorie === "Dárky") return item.vybrano;
      if (item.typ === "citytax") return item.osoby && item.dny;
      if (item.manualni) return item.castka && item.castka > 0;
      return item.pocet && item.pocet > 0;
    })
    .map(item => {
      // Vytvoření kopie položky bez interních atributů
      let vystup = { ...item };
      delete vystup.fixni;
      return vystup;
    });
  
  // Pokud nejsou žádné položky, zobrazit upozornění
  if (polozkyNaUctence.length === 0) {
    notifyError('Účtenka neobsahuje žádné položky');
    return;
  }
  
  // Vytvoření objektu faktury
  let faktura = {
    id: generateId(),
    timestamp: Date.now(),
    datum: (new Date()).toLocaleString("cs-CZ"),
    hostName: stav.settings.hostName || "",
    resNum: stav.settings.resNum || "",
    invoiceNote: stav.settings.invoiceNote || "",
    mena: stav.settings.mena,
    kurz: stav.kurz,
    celkem: vypocitejCelkem(stav.items, stav.settings, stav.kurz).celkova,
    sleva: vypocitejCelkem(stav.items, stav.settings, stav.kurz).sleva,
    polozky: polozkyNaUctence
  };
  
  // Přidání do historie
  const historie = [faktura, ...stav.historie];
  saveData(LS_KEYS.HIST, historie);
  
  // Reset formuláře
  const resetItems = resetForm(stav.items);
  
  // Aktualizace stavu
  updateState({ 
    historie: historie,
    items: resetItems,
    tab: "history" // Přepnutí na záložku historie
  });
  
  // Notifikace
  notifySuccess('Účtenka byla uložena do historie');
}

// Přidání nového dárku
function addGift() {
  const newItems = [...stav.items, {
    kategorie: "Dárky",
    nazev: "Nový dárek",
    vybrano: false,
    poznamka: ""
  }];
  
  saveData(LS_KEYS.ITEMS, newItems);
  updateState({ items: newItems });
}

// Export do CSV
function exportCsv() {
  const sum = vypocitejCelkem(stav.items, stav.settings, stav.kurz);
  let rows = [
    ["Položka", "Počet/částka", "Poznámka", "Cena"],
  ];
  
  stav.items.forEach(item => {
    if (item.kategorie === "Dárky" && !item.vybrano) return;
    
    if (item.kategorie === "Dárky") {
      rows.push([`🎁 ${item.nazev}`, "", item.poznamka || "", ""]);
      return;
    }
    
    let popis = "";
    let pocet = "";
    let cena = "";
    
    if (item.typ === "citytax" && item.osoby && item.dny) {
      popis = "City tax";
      pocet = `${item.osoby} os. × ${item.dny} dní`;
      cena = stav.settings.mena === "€"
        ? `${(item.osoby * item.dny * item.cena)} €`
        : `${Math.round(item.osoby * item.dny * item.cena * stav.kurz)} Kč`;
    } 
    else if (item.manualni && item.castka && item.castka > 0) {
      popis = item.nazev;
      pocet = "—";
      cena = stav.settings.mena === item.mena
        ? `${item.castka} ${item.mena}`
        : (item.mena === "Kč"
          ? `${Math.round(item.castka / stav.kurz * 100) / 100} €`
          : `${Math.round(item.castka * stav.kurz)} Kč`);
    } 
    else if (item.pocet && item.pocet > 0) {
      popis = item.nazev;
      pocet = `${item.pocet}×`;
      let val = stav.settings.mena === item.mena
        ? `${item.cena} ${item.mena}`
        : (item.mena === "Kč"
          ? `${Math.round(item.cena / stav.kurz * 100) / 100} €`
          : `${Math.round(item.cena * stav.kurz)} Kč`);
      
      cena = val + (item.sleva ? ` (sleva: -${item.sleva} ${stav.settings.mena})` : "");
    }
    
    if (popis) {
      rows.push([popis, pocet, item.poznamka || "", cena]);
    }
  });
  
  rows.push(["Celkem", "", "", `${sum.celkova} ${stav.settings.mena}`]);
  
  let csvContent = rows.map(r => r.map(cell => `"${cell}"`).join(";")).join("\n");
  
  // Vytvoření odkazu pro stažení
  let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "uctenka.csv";
  a.click();
  
  // Notifikace
  notifySuccess('CSV bylo exportováno');
}