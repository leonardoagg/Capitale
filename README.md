# Capitale

**Il tuo patrimonio. Le tue spese. Il tuo controllo.**

Capitale è una Progressive Web App (PWA) per la gestione delle finanze personali, progettata principalmente per iPhone.

L'obiettivo è offrire una visione completa della propria situazione finanziaria attraverso un'interfaccia semplice, moderna e intuitiva, senza abbonamenti o servizi esterni.

## Funzionalità previste

### Patrimonio
- Gestione di più conti correnti.
- Conti deposito liberi e vincolati.
- ETF e obbligazioni.
- Gestione dei contanti.
- Monitoraggio del capitale investito.
- Plusvalenze e minusvalenze.
- Aggiornamento manuale del patrimonio.
- Storico e distribuzione patrimoniale.

### Movimenti mensili
- Registrazione manuale di entrate e uscite.
- Spese fisse, variabili e straordinarie.
- Categorie personalizzabili.
- Bilancio mensile.
- Storico dei movimenti.

### Dashboard e analisi
- Patrimonio complessivo.
- Andamento storico delle finanze.
- Distribuzione degli investimenti.
- Grafici interattivi.
- Confronto mensile delle entrate e delle uscite.

### Privacy e sicurezza
- Database locale.
- Funzionamento offline.
- Nessun account obbligatorio.
- Nessun collegamento bancario.
- PIN facoltativo.
- Backup JSON con cifratura opzionale.
- Esportazione CSV.
- Ripristino completo dei dati.

## Stack tecnologico previsto

- HTML5
- CSS3
- JavaScript
- IndexedDB
- Chart.js
- Service Worker
- Web App Manifest
- Web Crypto API
- GitHub Pages

## Design

Interfaccia Dark finanziaria, ottimizzata per dispositivi mobili e ispirata all'esperienza utente di iOS.

## Principi del progetto

- Semplicità di utilizzo.
- Indipendenza dai servizi esterni.
- Privacy dei dati finanziari.
- Nessun costo ricorrente previsto.
- Separazione tra patrimonio e movimenti mensili.
- Architettura modulare ed estendibile.

## Sviluppo locale

Capitale è un sito statico, senza backend né dipendenze runtime. Per servirlo in locale è sufficiente un server HTTP, ad esempio:

```bash
python3 -m http.server 8080
```

Apri quindi `http://localhost:8080`. L'uso di un server HTTP è necessario per testare correttamente i moduli ES e il service worker; non aprire `index.html` direttamente dal file system.

### Test

La suite automatica usa il test runner incluso in Node.js e una dipendenza di sviluppo per simulare IndexedDB:

```bash
npm install
npm test
```

I test iPhone/Safari, installazione PWA e offline su dispositivo reale restano verifiche manuali da eseguire prima della release, come indicato in `ROADMAP.md`.

## Stato del progetto

**Versione obiettivo:** 1.0.0

La milestone M1 (fondamenta tecniche) è in corso. Nessun dato finanziario dimostrativo viene creato al primo avvio.

---

Capitale — Personal Finance Management
