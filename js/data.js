// data.js - Správa dat, localStorage a výchozí hodnoty

// Klíče pro localStorage
export const LS_KEYS = {
  KURZ: "bary-kurz",
  ITEMS: "bary-items",
  HIST: "bary-historie",
  SETTINGS: "bary-settings",
  THEME: "bary-theme"
};

// Výchozí kurz Kč/€
export const DEFAULT_KURZ = 25.0;

// Kategorie – pořadí v nabídce
export const CATEGORIES = [
  "Služby",
  "Nápoje – Alkohol",
  "Nápoje – Nealko",
  "Ostatní",
  "Snídaně",
  "Poplatky",
  "Dárky"
];

// Výchozí položky
export const DEFAULT_ITEMS = [
  // Služby
  { kategorie: "Služby", nazev: "Plyn do grilu", cena: 20, mena: "€", fixni: true },
  { kategorie: "Služby", nazev: "Wellness", cena: 0, mena: "Kč", manualni: true, fixni: true },

  // Nápoje – Alkohol
  { kategorie: "Nápoje – Alkohol", nazev: "Prosecco", cena: 390, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Alkohol", nazev: "Jack Daniels & Cola 0,33 l", cena: 100, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Alkohol", nazev: "Befeater Gin & Tonic 0,25 l", cena: 75, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Alkohol", nazev: "Budvar 10° 0,5 l", cena: 50, mena: "Kč", fixni: true },

  // Nápoje – Nealko
  { kategorie: "Nápoje – Nealko", nazev: "Red Bull 0,25 l", cena: 60, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Nealko", nazev: "Coca-Cola, Sprite, Fanta 0,33 l", cena: 30, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Nealko", nazev: "Korunní Citrus Mix 0,33 l", cena: 35, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Nealko", nazev: "Korunní Vitamin D3 0,33 l", cena: 35, mena: "Kč", fixni: true },

  // Ostatní
  { kategorie: "Ostatní", nazev: "Káva kapsle", cena: 30, mena: "Kč", fixni: true, poznamka: "Prvních 25 kapslí zdarma" },

  // Snídaně
  { kategorie: "Snídaně", nazev: "Snídaně", cena: 200, mena: "Kč", fixni: true },
  { kategorie: "Snídaně", nazev: "Fresh džus 330ml", cena: 115, mena: "Kč", fixni: true },

  // Poplatky
  { kategorie: "Poplatky", nazev: "City tax", cena: 2, mena: "€", typ: "citytax", fixni: true },
  { kategorie: "Poplatky", nazev: "Osoba navíc", cena: 1000, mena: "Kč", fixni: true },
];

// Helper pro ukládání dat do localStorage
export function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Chyba při ukládání dat (${key}):`, error);
    return false;
  }
}

// Helper pro načítání dat z localStorage
export function loadData(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (error) {
    console.error(`Chyba při načítání dat (${key}):`, error);
    return fallback;
  }
}

// Výpočet celkové ceny
export function vypocitejCelkem(items, settings, kurz) {
  let sum = 0;
  let sleva = 0;
  
  items.forEach(item => {
    // Dárky nepočítáme do ceny
    if (item.kategorie === "Dárky" && item.vybrano) return;
    
    let kusu = item.pocet || 0;
    
    // City tax – speciální zpracování
    if (item.typ === "citytax") {
      let osoby = item.osoby || 0;
      let dny = item.dny || 0;
      if (osoby > 0 && dny > 0) {
        let cityTaxCelk = osoby * dny * item.cena;
        sum += settings.mena === "€" ? cityTaxCelk : cityTaxCelk * kurz;
      }
    } 
    // Manuální položka (wellness, snídaně...)
    else if (item.manualni && item.castka) {
      sum += settings.mena === item.mena
        ? item.castka
        : (item.mena === "Kč" ? item.castka / kurz : item.castka * kurz);
    } 
    // Standardní položky
    else if (kusu > 0) {
      let cena = item.cena;
      // Konverze měny pokud je potřeba
      if (settings.mena === item.mena) {
        sum += cena * kusu;
      } else if (settings.mena === "€" && item.mena === "Kč") {
        sum += (cena / kurz) * kusu;
      } else if (settings.mena === "Kč" && item.mena === "€") {
        sum += (cena * kurz) * kusu;
      }
      
      // Slevy/akce
      if (item.sleva && item.sleva > 0) {
        sleva += item.sleva * kusu;
      }
    }
  });
  
  // Zaokrouhlení na 2 desetinná místa
  sum = Math.round(sum * 100) / 100;
  sleva = Math.round(sleva * 100) / 100;
  
  return { 
    celkova: sum - sleva, 
    sleva 
  };
}

// Konverze částky podle měny
export function konvertujCastku(castka, zdrojMena, cilMena, kurz) {
  if (zdrojMena === cilMena) return castka;
  
  if (zdrojMena === "Kč" && cilMena === "€") {
    return Math.round(castka / kurz * 100) / 100;
  } else if (zdrojMena === "€" && cilMena === "Kč") {
    return Math.round(castka * kurz);
  }
  
  return castka;
}

// Formátování částky s měnou
export function formatujCastku(castka, mena) {
  return `${castka} ${mena}`;
}

// Resetovat formulář
export function resetForm(items) {
  const resetItems = items.map(item => {
    const newItem = { ...item };
    delete newItem.pocet;
    delete newItem.osoby;
    delete newItem.dny;
    delete newItem.castka;
    delete newItem.vybrano;
    return newItem;
  });
  
  return resetItems;
}