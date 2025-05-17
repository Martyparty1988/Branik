// app.js - Hlavní vstupní bod aplikace
import { loadData, saveData, DEFAULT_KURZ, DEFAULT_ITEMS, CATEGORIES, LS_KEYS } from './data.js';
import { renderInvoice } from './invoice.js';
import { renderHistory } from './history.js';
import { renderStats } from './stats.js';
import { initModal, showModal, closeModal } from './ui.js';
import { showSettings } from './settings.js';
import { initTheme } from './theme.js';

// Globální stav aplikace
export let stav = {
  kurz: loadData(LS_KEYS.KURZ, DEFAULT_KURZ),
  items: loadData(LS_KEYS.ITEMS, DEFAULT_ITEMS),
  historie: loadData(LS_KEYS.HIST, []),
  settings: loadData(LS_KEYS.SETTINGS, { mena: "Kč" }),
  tab: "invoice"
};

// Aktualizuje stav a znovu vykreslí
export function updateState(newState) {
  stav = { ...stav, ...newState };
  renderApp();
}

// Přepínání záložek
export function switchTab(tab) {
  stav.tab = tab;
  document.querySelectorAll(".tab-btn").forEach(b => 
    b.classList.toggle("active", b.dataset.tab === tab)
  );
  renderApp();
}

// Hlavní render funkce
function renderApp() {
  const main = document.getElementById("app");
  main.innerHTML = ''; // Vyčistit obsah

  const content = document.createElement('div');
  content.className = 'fade-in';
  
  switch (stav.tab) {
    case "invoice":
      renderInvoice(content);
      break;
    case "history":
      renderHistory(content);
      break;
    case "stats":
      renderStats(content);
      break;
  }
  
  main.appendChild(content);
}

// Inicializace aplikace
function initApp() {
  // Přepínače záložek
  document.querySelectorAll(".tab-btn").forEach(btn =>
    btn.addEventListener("click", () => switchTab(btn.dataset.tab))
  );

  // Nastavení
  document.getElementById("settingsBtn").addEventListener("click", showSettings);
  
  // Inicializace modálního okna
  initModal();
  
  // Inicializace přepínače témat
  initTheme();
  
  // Zaregistrovat service worker pro offline režim
  registerServiceWorker();
  
  // Vykreslit aplikaci
  renderApp();
}

// Service worker pro offline režim
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registered: ', registration);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
}

// Po načtení stránky
window.addEventListener('DOMContentLoaded', initApp);

// Exporty pro globální použití (pro kompatibilitu se starým kódem)
window.closeModal = closeModal;
window.showModal = showModal;