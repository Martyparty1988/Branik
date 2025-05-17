// theme.js - Správa tmavého/světlého režimu
import { loadData, saveData, LS_KEYS } from './data.js';

// Výchozí téma (light/dark)
const DEFAULT_THEME = 'light';

// Inicializace tématu
export function initTheme() {
  // Načtení uloženého tématu
  const savedTheme = loadData(LS_KEYS.THEME, DEFAULT_THEME);
  
  // Nastavení tématu
  setTheme(savedTheme);
  
  // Přidání event listeneru na přepínač
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Nastavení tématu
export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  saveData(LS_KEYS.THEME, theme);
}

// Přepnutí tématu
export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  setTheme(newTheme);
}