# Capitale — Istruzioni per gli agenti di sviluppo

## 1. Mandato e fonti di riferimento

Capitale V1.0 è una Progressive Web App (PWA) di finanza personale, progettata per iPhone, senza backend, abbonamenti o pubblicazione sull'App Store. Realizzare software funzionante, non soltanto mockup.

Prima di intervenire:
1. Leggere questo file, `SPECIFICATIONS.md` e `ROADMAP.md` nella root della repository.
2. Esaminare lo stato effettivo della repository, eventuali modifiche dell'utente, i test disponibili e la milestone corrente.
3. Usare `SPECIFICATIONS.md` come fonte dei requisiti di prodotto, questo file come regole operative e `ROADMAP.md` come ordine di lavoro e criteri di verifica.
4. In caso di conflitto, rispettare le istruzioni esplicite più recenti dell'utente e documentare le modifiche ai requisiti. Non cambiare silenziosamente le specifiche.

## 2. Vincoli inderogabili

- Mantenere patrimonio e movimenti mensili come due sistemi indipendenti. Nessuna modifica automatica del patrimonio a seguito di un movimento; nessuna creazione automatica di movimenti a seguito di una variazione patrimoniale.
- Dati finanziari nel database IndexedDB del dispositivo. Nessun backend, account, analytics, telemetria, collegamento bancario, API di quotazione o invio di dati finanziari a terzi.
- Nessun budget, previsione, obiettivo di risparmio, movimento programmato o notifica push nella V1.0.
- Italiano, EUR, interfaccia Dark finanziaria, mobile-first, ottimizzata per Safari e PWA standalone su iPhone.
- Dipendenze runtime e risorse essenziali servite dallo stesso sito e disponibili offline; non dipendere da CDN, font remoti o servizi a pagamento.
- Hosting statico su GitHub Pages; il codice può essere pubblico, i dati dell'utente no. Non inserire dati reali, backup, credenziali o segreti in file, commit, log, issue o test.
- Nessun dato di esempio nel database al primo avvio. Fixture sintetiche soltanto in test isolati.
- Aggiornamenti senza cancellazione dei dati: migrazioni esplicite, versionate e non distruttive.

## 3. Regole di implementazione

- Preferire HTML semantico, CSS con design token e JavaScript modulare (ES modules), IndexedDB e Chart.js distribuito localmente. Evitare framework o infrastrutture non necessari. Un toolchain di sviluppo leggero è consentito se motivato; il risultato deve essere statico.
- Separare persistenza, dominio finanziario, rendering, navigazione, backup e sicurezza. Evitare formule duplicate tra schermate.
- Importi monetari in centesimi interi e validati con `Number.isSafeInteger`, senza somme su float. Usare funzioni condivise per parsing italiano e formattazione EUR. Date dei movimenti come date civili locali `YYYY-MM-DD`; timestamp tecnici in ISO 8601. Non far slittare le date per conversioni UTC.
- Validare input, identificatori, tipi, importi e riferimenti. Gestire stati vuoti, errori, caricamento, quote storage e operazioni annullate. Attendere il completamento della transazione IndexedDB prima di dichiarare salvato un dato.
- Usare transazioni atomiche per snapshot, migrazioni e ripristino; il fallimento di un ripristino non deve lasciare dati parziali.
- Non renderizzare note, nomi, categorie o backup importati come HTML non affidabile. Usare DOM API sicure e validazione rigorosa.
- PIN facoltativo: blocco dell'interfaccia, non protezione crittografica del database. Non conservare il PIN in chiaro; non esportarlo. Nascondere importi non equivale a proteggere i dati.
- Backup cifrati con Web Crypto, cifratura autenticata AES-256-GCM e derivazione password PBKDF2-SHA-256 con sale casuale e parametri versionati; IV nuovo per ogni cifratura. Non creare algoritmi crittografici propri. Non conservare la password. Testare password errata, file alterato e impossibilità di ripristino senza password.
- Non usare `localStorage` come database finanziario o come fallback silenzioso di IndexedDB.
- Gestire percorsi relativi compatibili con il sottopercorso GitHub Pages (`/capitale/`), scope del service worker e manifest coerenti. Non fare caching indiscriminato di richieste esterne.
- Rispettare safe area iOS, tastiera mobile, target tattili, contrasto, accessibilità da tastiera/lettore di schermo e preferenza reduced-motion. Non disabilitare lo zoom dell'utente.

## 4. Organizzazione indicativa dei file

```text
capitale/
  AGENTS.md
  SPECIFICATIONS.md
  ROADMAP.md
  README.md
  .gitignore
  .nojekyll
  index.html
  manifest.webmanifest
  sw.js
  css/
  js/
    db/
    domain/
    ui/
    backup/
    security/
  assets/
  icons/
  lib/
  tests/
  docs/
```

La struttura è indicativa, non un vincolo sui nomi dei moduli. Mantenere questi tre documenti nella root. Documentare comandi effettivi di avvio, test e build nel README; non inventare comandi se non ancora implementati. Ignorare backup ed esportazioni locali, file temporanei, `.env*`, `node_modules/` e artefatti di test non destinati al versionamento. Non ignorare risorse necessarie alla distribuzione statica.

## 5. Flusso di lavoro

1. Lavorare per milestone e piccoli cambiamenti verificabili; evitare riscritture inutili.
2. Prima di introdurre dipendenze, verificare necessità, licenza, compatibilità offline e mantenibilità.
3. Scrivere o aggiornare test insieme alla funzionalità; eseguire i test pertinenti e riportare i risultati effettivi.
4. Consultare `ROADMAP.md` per i criteri di completamento. Aggiornare le checkbox solo quando il criterio è soddisfatto; annotare separatamente verifiche pendenti.
5. Documentare decisioni tecniche rilevanti e migrazioni in `docs/`, senza duplicare integralmente le specifiche.
6. Non sovrascrivere modifiche dell'utente, usare comandi Git distruttivi, fare force push, cancellare database reali o cambiare visibilità/licenza del repository senza autorizzazione. Non eseguire push o pubblicazioni non richieste.
7. Se un requisito non è verificabile nell'ambiente disponibile, esplicitare il limite, fornire una procedura riproducibile e non dichiarare il test superato.

## 6. Definizione di lavoro completato

Una modifica è completa quando il codice è utilizzabile, gli stati vuoti e gli errori sono gestiti, i calcoli sono verificati con test pertinenti, i dati persistono senza regressioni, la documentazione è aggiornata e non sono stati introdotti servizi non concordati.

Nel riepilogo di ogni sessione indicare: milestone, modifiche, file principali, comandi/test eseguiti con esito, limiti o decisioni aggiuntive, prossimo passo. Distinguere test automatici, test in browser desktop, simulazione mobile e test su iPhone reale.

Non dichiarare Capitale V1.0 pronta per l'uso quotidiano finché il collaudo di installazione, offline, persistenza, aggiornamento e recupero dei backup su iPhone non è stato effettivamente svolto.
