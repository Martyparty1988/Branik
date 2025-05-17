// export.js - Funkce pro export do PDF a dalších formátů
import { stav } from './app.js';
import { vypocitejCelkem, formatujCastku } from './data.js';
import { formatDate } from './utils.js';
import { notifySuccess } from './ui.js';

// Export účtenky do PDF (jako HTML v novém okně pro tisk)
export function exportToPdf() {
  const sum = vypocitejCelkem(stav.items, stav.settings, stav.kurz);
  
  // Vytvoření HTML obsahu
  let html = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <title>Účtenka - Vila Praha Braník</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 20px;
        }
        h1 {
          color: #4361ee;
          margin-bottom: 5px;
        }
        h2 {
          color: #555;
          font-size: 1.2em;
          margin-top: 0;
          margin-bottom: 10px;
        }
        .info-row {
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .gift-row {
          background-color: rgba(144, 190, 109, 0.2);
        }
        .total-row {
          font-weight: bold;
          background-color: #f5f5f5;
        }
        .note {
          font-style: italic;
          color: #666;
          margin-top: 20px;
        }
        .logo {
          text-align: center;
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 0.9em;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        @media print {
          body {
            margin: 0;
            padding: 15px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="logo">
        <h1>Bary – Vila Praha Braník</h1>
        <h2>Accommodation and Conference Services Prague Agency, s.r.o.</h2>
      </div>
      
      <div class="info-row">
        <strong>Datum:</strong> ${formatDate()}
      </div>
      ${stav.settings.hostName ? `<div class="info-row"><strong>Host:</strong> ${stav.settings.hostName}</div>` : ''}
      ${stav.settings.resNum ? `<div class="info-row"><strong>Rezervace:</strong> ${stav.settings.resNum}</div>` : ''}
      
      <table>
        <thead>
          <tr>
            <th>Položka</th>
            <th>Počet/částka</th>
            <th>Poznámka</th>
            <th>Cena</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Přidání položek do tabulky
  stav.items.forEach(item => {
    if (item.kategorie === "Dárky" && !item.vybrano) return;
    
    if (item.kategorie === "Dárky") {
      html += `
        <tr class="gift-row">
          <td>🎁 ${item.nazev}</td>
          <td>—</td>
          <td>${item.poznamka || ""}</td>
          <td>—</td>
        </tr>
      `;
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
      
      cena = val + (item.sleva ? `<br>(sleva: -${item.sleva} ${stav.settings.mena})` : "");
    }
    
    if (popis) {
      html += `
        <tr>
          <td>${popis}</td>
          <td>${pocet}</td>
          <td>${item.poznamka || ""}</td>
          <td>${cena}</td>
        </tr>
      `;
    }
  });
  
  // Přidání celkové částky
  html += `
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">Celkem:</td>
          <td>${sum.celkova} ${stav.settings.mena}</td>
        </tr>
      </tbody>
    </table>
    
    ${stav.settings.invoiceNote ? `<div class="note">Poznámka: ${stav.settings.invoiceNote}</div>` : ''}
    
    <div class="footer">
      <p>Vila Praha Braník © ${new Date().getFullYear()}</p>
    </div>
    
    <div class="no-print" style="margin-top: 20px; text-align: center;">
      <button onclick="window.print()" style="padding: 10px 20px; background: #4361ee; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Vytisknout
      </button>
    </div>
    
    </body>
    </html>
  `;
  
  // Otevření nového okna s vytvořeným HTML
  const newWindow = window.open('', '_blank');
  newWindow.document.write(html);
  newWindow.document.close();
  
  // Notifikace
  notifySuccess('PDF bylo připraveno pro tisk');
}

// Export konkrétní účtenky z historie do PDF
export function exportHistoryItemToPdf(invoice) {
  // Vytvoření HTML obsahu
  let html = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <title>Účtenka ${invoice.resNum || ''} - Vila Praha Braník</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 20px;
        }
        h1 {
          color: #4361ee;
          margin-bottom: 5px;
        }
        h2 {
          color: #555;
          font-size: 1.2em;
          margin-top: 0;
          margin-bottom: 10px;
        }
        .info-row {
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .gift-row {
          background-color: rgba(144, 190, 109, 0.2);
        }
        .total-row {
          font-weight: bold;
          background-color: #f5f5f5;
        }
        .note {
          font-style: italic;
          color: #666;
          margin-top: 20px;
        }
        .logo {
          text-align: center;
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 0.9em;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        @media print {
          body {
            margin: 0;
            padding: 15px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="logo">
        <h1>Bary – Vila Praha Braník</h1>
        <h2>Accommodation and Conference Services Prague Agency, s.r.o.</h2>
      </div>
      
      <div class="info-row">
        <strong>Datum:</strong> ${invoice.datum}
      </div>
      ${invoice.hostName ? `<div class="info-row"><strong>Host:</strong> ${invoice.hostName}</div>` : ''}
      ${invoice.resNum ? `<div class="info-row"><strong>Rezervace:</strong> ${invoice.resNum}</div>` : ''}
      
      <table>
        <thead>
          <tr>
            <th>Položka</th>
            <th>Počet/částka</th>
            <th>Poznámka</th>
            <th>Cena</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Přidání položek do tabulky
  invoice.polozky.forEach(item => {
    if (item.kategorie === "Dárky") {
      html += `
        <tr class="gift-row">
          <td>🎁 ${item.nazev}</td>
          <td>—</td>
          <td>${item.poznamka || ""}</td>
          <td>—</td>
        </tr>
      `;
      return;
    }
    
    let pocet = item.pocet ? `${item.pocet}×` : "";
    let castka = item.castka ? item.castka : "";
    let cena = "";
    
    if (item.typ === "citytax" && item.osoby && item.dny) {
      cena = invoice.mena === "€"
        ? `${(item.osoby * item.dny * item.cena)} €`
        : `${Math.round(item.osoby * item.dny * item.cena * invoice.kurz)} Kč`;
    } 
    else if (item.manualni && castka) {
      cena = invoice.mena === item.mena
        ? `${castka} ${item.mena}`
        : (item.mena === "Kč"
          ? `${Math.round(castka / invoice.kurz * 100) / 100} €`
          : `${Math.round(castka * invoice.kurz)} Kč`);
    } 
    else if (pocet) {
      cena = invoice.mena === item.mena
        ? `${item.cena} ${item.mena}`
        : (item.mena === "Kč"
          ? `${Math.round(item.cena / invoice.kurz * 100) / 100} €`
          : `${Math.round(item.cena * invoice.kurz)} Kč`);
    }
    
    html += `
      <tr>
        <td>${item.nazev}</td>
        <td>${pocet || castka}</td>
        <td>${item.poznamka || ""}</td>
        <td>${cena}</td>
      </tr>
    `;
  });
  
  // Přidání celkové částky
  html += `
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">Celkem:</td>
          <td>${invoice.celkem} ${invoice.mena}</td>
        </tr>
      </tbody>
    </table>
    
    ${invoice.invoiceNote ? `<div class="note">Poznámka: ${invoice.invoiceNote}</div>` : ''}
    
    <div class="footer">
      <p>Vila Praha Braník © ${new Date().getFullYear()}</p>
    </div>
    
    <div class="no-print" style="margin-top: 20px; text-align: center;">
      <button onclick="window.print()" style="padding: 10px 20px; background: #4361ee; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Vytisknout
      </button>
    </div>
    
    </body>
    </html>
  `;
  
  // Otevření nového okna s vytvořeným HTML
  const newWindow = window.open('', '_blank');
  newWindow.document.write(html);
  newWindow.document.close();
  
  // Notifikace
  notifySuccess('PDF bylo připraveno pro tisk');
}