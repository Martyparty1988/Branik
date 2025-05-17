// stats.js - Statistiky a přehledy
import { stav } from './app.js';
import { createEl, groupBy } from './utils.js';
import { createCard } from './ui.js';

// Render statistik
export function renderStats(container) {
  // Přidání záhlaví stránky
  const pageHeader = createEl('div', { className: 'page-header' }, [
    createEl('h2', { className: 'page-title' }, 'Statistiky')
  ]);
  container.appendChild(pageHeader);
  
  // Kontrola, zda máme dostatek dat pro statistiky
  if (!stav.historie || stav.historie.length === 0) {
    const emptyState = createEl('div', { className: 'empty-state' }, [
      createEl('div', { className: 'empty-state-icon' }, '📊'),
      createEl('h3', { className: 'empty-state-title' }, 'Zatím nemáte data pro statistiky'),
      createEl('p', { className: 'empty-state-text' }, 'Vytvořte účtenky a pak se vraťte na tuto obrazovku.')
    ]);
    container.appendChild(emptyState);
    return;
  }
  
  // Zařazení a zobrazení karet se statistikami
  container.appendChild(createSummaryStats());
  container.appendChild(createTopItemsCard());
  container.appendChild(createSalesChartCard());
  
  // Přidání vizualizací
  renderCharts();
}

// Vytvoření karty s přehledovými statistikami
function createSummaryStats() {
  const statsGrid = createEl('div', { className: 'stats-grid' });
  
  // Celkový počet účtenek
  statsGrid.appendChild(createStatCard(
    stav.historie.length,
    'Počet účtenek',
    '🧾'
  ));
  
  // Tržby v Kč
  const sumKc = stav.historie
    .filter(u => u.mena === "Kč")
    .reduce((total, uctenka) => total + uctenka.celkem, 0);
  
  statsGrid.appendChild(createStatCard(
    `${Math.round(sumKc)} Kč`,
    'Tržby v Kč',
    '💰'
  ));
  
  // Tržby v €
  const sumEur = stav.historie
    .filter(u => u.mena === "€")
    .reduce((total, uctenka) => total + uctenka.celkem, 0);
  
  statsGrid.appendChild(createStatCard(
    `${Math.round(sumEur * 100) / 100} €`,
    'Tržby v €',
    '💶'
  ));
  
  // Průměrná účtenka
  const avgValue = stav.historie.length > 0 
    ? Math.round((stav.historie
        .filter(u => u.mena === "Kč")
        .reduce((total, uctenka) => total + uctenka.celkem, 0)) / 
      stav.historie.filter(u => u.mena === "Kč").length)
    : 0;
  
  statsGrid.appendChild(createStatCard(
    `${avgValue} Kč`,
    'Průměrná účtenka',
    '📈'
  ));
  
  return statsGrid;
}

// Vytvoření karty s TOP položkami
function createTopItemsCard() {
  // Počítání položek
  const polozkyStat = {};
  
  stav.historie.forEach(uctenka => {
    uctenka.polozky.forEach(item => {
      if (item.kategorie === "Dárky") return;
      
      const key = item.nazev;
      
      // Počet kusů nebo 1 u manuálních položek
      const count = item.pocet || 1;
      
      polozkyStat[key] = (polozkyStat[key] || 0) + count;
    });
  });
  
  // Seřazení položek podle počtu
  const topItems = Object.entries(polozkyStat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Vytvoření obsahu karty
  const content = createEl('div', { className: 'top-items' });
  
  if (topItems.length > 0) {
    const list = createEl('ol', { className: 'top-items-list' });
    
    topItems.forEach(([name, count]) => {
      list.appendChild(createEl('li', {}, `${name} (${count}×)`));
    });
    
    content.appendChild(list);
  } else {
    content.appendChild(createEl('p', {}, 'Nemáte žádné položky k zobrazení.'));
  }
  
  return createCard('TOP položky', content);
}

// Vytvoření karty s grafem
function createSalesChartCard() {
  const chartContainer = createEl('div', { className: 'chart-container' });
  
  // Nadpis
  chartContainer.appendChild(createEl('h3', { className: 'chart-title' }, 'Vývoj tržeb'));
  
  // Kontejner pro graf
  const canvas = createEl('canvas', { id: 'salesChart', width: '100%', height: '300px' });
  chartContainer.appendChild(canvas);
  
  return chartContainer;
}

// Vytvoření karty se statistikou
function createStatCard(value, label, icon = null) {
  const card = createEl('div', { className: 'stat-card' });
  
  if (icon) {
    card.appendChild(createEl('div', { className: 'stat-icon' }, icon));
  }
  
  card.appendChild(createEl('div', { className: 'stat-value' }, value));
  card.appendChild(createEl('div', { className: 'stat-label' }, label));
  
  return card;
}

// Vykreslení grafů
function renderCharts() {
  // Kontrola, zda máme data pro grafy
  if (!stav.historie || stav.historie.length === 0) return;
  
  // Příprava dat pro graf vývoje tržeb
  
  // Seřazení účtenek podle data (od nejstarších po nejnovější)
  const sortedInvoices = [...stav.historie].sort((a, b) => {
    return new Date(a.datum) - new Date(b.datum);
  });
  
  // Extrahování dat pro graf
  const dates = [];
  const amountsKc = [];
  const amountsEur = [];
  
  // Pomocná funkce pro extrakci data ve formátu MM/DD
  const extractDateMMDD = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  // Seskupení tržeb podle data
  const salesByDate = {};
  
  sortedInvoices.forEach(invoice => {
    // Zjednodušené datum (DD.MM)
    let dateKey;
    
    try {
      // Pokus o extrakci data z českého formátu (běžný formát)
      const parts = invoice.datum.split(' ')[0].split('.');
      dateKey = `${parts[0]}.${parts[1]}`;
    } catch (error) {
      // Fallback na datum jako timestamp
      dateKey = new Date(invoice.timestamp).toLocaleDateString('cs-CZ').split(' ')[0];
    }
    
    if (!salesByDate[dateKey]) {
      salesByDate[dateKey] = { kc: 0, eur: 0 };
    }
    
    if (invoice.mena === "Kč") {
      salesByDate[dateKey].kc += invoice.celkem;
    } else if (invoice.mena === "€") {
      salesByDate[dateKey].eur += invoice.celkem;
    }
  });
  
  // Převedení na pole pro graf
  Object.entries(salesByDate).forEach(([date, amounts]) => {
    dates.push(date);
    amountsKc.push(amounts.kc);
    amountsEur.push(amounts.eur);
  });
  
  // Vykreslení grafu pomocí Chart.js
  renderSalesChart(dates, amountsKc, amountsEur);
}

// Vykreslení grafu pomocí Chart.js
function renderSalesChart(dates, amountsKc, amountsEur) {
  // Kontrola existence elementu
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;
  
  // Vykreslení grafu pomocí CDN Chart.js
  // Vytvoření skriptu pro načtení Chart.js, pokud ještě není načten
  if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      createSalesChart(canvas, dates, amountsKc, amountsEur);
    };
    document.head.appendChild(script);
  } else {
    createSalesChart(canvas, dates, amountsKc, amountsEur);
  }
}

// Vytvoření grafu tržeb
function createSalesChart(canvas, dates, amountsKc, amountsEur) {
  const ctx = canvas.getContext('2d');
  
  // Vytvoření grafu
  new window.Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Tržby (Kč)',
          data: amountsKc,
          borderColor: '#4361ee',
          backgroundColor: 'rgba(67, 97, 238, 0.1)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Tržby (€)',
          data: amountsEur,
          borderColor: '#f9c74f',
          backgroundColor: 'rgba(249, 199, 79, 0.1)',
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 12
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
}