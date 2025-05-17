// utils.js - Pomocné utility a funkce

// Vytvoření elementu s atributy a obsahem
export function createEl(tag, attributes = {}, content = null) {
  const element = document.createElement(tag);
  
  // Přidání atributů
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'events') {
      // Přidání event listeners
      Object.entries(value).forEach(([event, handler]) => {
        element.addEventListener(event, handler);
      });
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Přidání obsahu
  if (content !== null) {
    if (Array.isArray(content)) {
      content.forEach(child => {
        if (child instanceof Element) {
          element.appendChild(child);
        } else if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        }
      });
    } else if (content instanceof Element) {
      element.appendChild(content);
    } else if (typeof content === 'string') {
      element.appendChild(document.createTextNode(content));
    }
  }
  
  return element;
}

// Formátování data a času
export function formatDateTime(date = new Date()) {
  const options = { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('cs-CZ', options);
}

// Formátování pouze data
export function formatDate(date = new Date()) {
  const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
  return date.toLocaleDateString('cs-CZ', options);
}

// Generování unikátního ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Debounce funkce (pro optimalizaci event listenerů)
export function debounce(func, delay = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Validace částky
export function isValidAmount(amount) {
  return !isNaN(parseFloat(amount)) && isFinite(amount) && amount >= 0;
}

// Omezení desetinných míst
export function roundTo(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Groupby helper
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
}

// Převedení první písmena na velké
export function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Formátování částky pro export
export function formatAmountForExport(amount, currency) {
  return `${amount} ${currency}`;
}

// Zobrazení toast notifikace
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  
  // Ikony podle typu
  const icons = {
    success: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" /></svg>',
    error: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>',
    info: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>'
  };
  
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div class="toast-content">${message}</div>
  `;
  
  toast.className = `toast toast-${type} show`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, duration);
}

// Potvrzovací dialog
export function confirmAction(message, confirmCallback, cancelCallback = null) {
  if (window.confirm(message)) {
    confirmCallback();
  } else if (cancelCallback) {
    cancelCallback();
  }
}

// Validace vstupu pro počet
export function validateNumberInput(input) {
  const value = input.value.trim();
  
  if (value === '') return '';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue < 0) {
    return 0;
  }
  
  return Math.floor(numValue); // Zajistí celé číslo pro počet
}

// Validace vstupu pro částku
export function validateAmountInput(input) {
  const value = input.value.trim();
  
  if (value === '') return '';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue < 0) {
    return 0;
  }
  
  return Math.round(numValue * 100) / 100; // Zaokrouhlení na 2 desetinná místa
}