# Capitale — Roadmap di sviluppo V1.0

**Stato iniziale:** progettazione conclusa, repository predisposta dall'utente; codice e test da verificare/implementare. Nessuna milestone di sviluppo è dichiarata completata. Non ci sono date di consegna prestabilite.

Leggere `AGENTS.md` e `SPECIFICATIONS.md` prima di ogni sessione. Lavorare in ordine, con incrementi utilizzabili e testabili. Le milestone non sono una richiesta di creare funzionalità ulteriori. Aggiornare le checkbox con evidenza dei test effettivamente eseguiti; distinguere test automatizzati, browser desktop e verifiche su iPhone reale.

## M1 — Fondamenta tecniche

**Obiettivo:** repository ordinata, architettura minima, shell PWA e persistenza affidabile.

- [x] Ispezionare repository, README, branch e modifiche esistenti; non sovrascrivere il lavoro dell'utente. — 2026-11-27: `main` pulito, remoto `origin` verificato; commit documentazione creato separatamente.
- [x] Definire struttura moduli, comandi di avvio/test e convenzioni; aggiornare README. — Struttura ES modules e comandi locali documentati.
- [x] Creare HTML/CSS/JS base, manifest, icone, service worker e risorse locali. — Shell PWA senza dipendenze runtime o CDN.
- [x] Implementare IndexedDB versionato, store, indici, transazioni, migrazioni e gestione errori. — Schema 1 e migrazione iniziale documentati in `docs/m1-foundations.md`.
- [x] Implementare funzioni condivise per denaro in centesimi, date civili, validazione e formattazione italiana.
- [x] Predisporre categorie iniziali senza dati finanziari dimostrativi.
- [x] Testare apertura DB, CRUD di base, reload, migrazione, dati invalidi e calcoli monetari. — `npm test`: 5 test superati il 2026-11-27; migrazione verificata dal database vuoto a schema 1.
- [ ] Verificare installabilità tecnica, caricamento da sottopercorso e prima apertura offline dopo cache completata in ambiente di test.

**Gate:** app vuota utilizzabile, database persistente in ambiente di test, test fondamentali superati, nessuna dipendenza runtime da rete. Collaudo iPhone finale in M7.

## M2 — Interfaccia e navigazione

**Obiettivo:** app coerente con lo stile Dark finanziario e utilizzabile su schermi iPhone.

- [ ] Implementare design token, tipografia, card, pulsanti, moduli, icone e stati vuoti/errori.
- [ ] Navigazione Home / Patrimonio / Movimenti / Analisi, Impostazioni dalla Home.
- [ ] Predisporre layout dei cinque contesti senza mostrare dati fittizi in produzione.
- [ ] Gestire safe area, scroll, tastiera, contrasto, focus, reduced-motion e target tattili.
- [ ] Verificare layout su viewport mobile rappresentative e desktop; documentare i risultati.

**Gate:** tutte le schermate raggiungibili, navigazione coerente, niente overflow orizzontale o controlli essenziali coperti. Nessun pulsante presentato come funzionante quando non lo è ancora.

## M3 — Patrimonio e investimenti

**Obiettivo:** aggiornare più posizioni in pochi passaggi, mantenere lo storico e calcolare correttamente valori e plus/minusvalenze.

- [ ] Creazione/modifica/archiviazione di conti correnti, conti deposito, ETF, obbligazioni e contanti.
- [ ] Gruppi espandibili e schede singoli strumenti; campi specifici e facoltativi.
- [ ] Aggiornamento massivo, totale in anteprima, conferma e snapshot atomico completo.
- [ ] Storico, correzione/eliminazione snapshot e conservazione dati delle posizioni archiviate.
- [ ] Calcoli: totale, liquidità disponibile/vincolata, investimenti, capitale, plus/minusvalenza e percentuale semplice.
- [ ] Test: somme, valori nulli/negativi dove ammessi, capitale zero, vendite parziali tramite aggiornamento manuale del costo, archiviazione, più snapshot nella stessa data, correzione/eliminazione ultimo snapshot, rollback su errore.

**Gate:** gli esempi patrimoniali delle specifiche coincidono; lo storico resta immutato salvo correzione esplicita; nessuna generazione di movimenti; totale corrente coerente fra schermate.

## M4 — Movimenti mensili

**Obiettivo:** inserimento manuale rapido di entrate/uscite, consultazione mese per mese.

- [ ] Modulo Nuovo movimento: tipo, importo, tipologia spesa, categoria, data, descrizione facoltativa.
- [ ] Elenco con filtri, modifica ed eliminazione; prevenzione doppio invio.
- [ ] Categorie personalizzabili, archiviazione senza perdere lo storico.
- [ ] Selettore mese, totali registrati, bilancio, ripartizione fisse/variabili/straordinarie.
- [ ] Test: confini mese/anno, date locali, modifica importo/data, eliminazione, categorie archiviate, mesi vuoti, importi non validi e indipendenza dal patrimonio.

**Gate:** gli esempi di movimenti delle specifiche coincidono; una spesa non cambia alcun saldo patrimoniale; nessun automatismo o budget.

## M5 — Home e Analisi

**Obiettivo:** dare visione immediata del patrimonio e dei flussi registrati, senza mescolare i calcoli.

- [ ] Home con patrimonio, variazione, grafico storico, liquidità/investimenti, ultimo aggiornamento, riepilogo mensile e azione rapida.
- [ ] Chart.js locale; cinque grafici previsti dalle specifiche.
- [ ] Filtri temporali, legende, tooltip, date effettive e stati senza dati.
- [ ] Coerenza tra calcoli e viste; evitare grafici ingannevoli per saldi negativi, un solo snapshot e totali zero.
- [ ] Implementare oscuramento importi su tutte le viste, inclusi grafici e tooltip.
- [ ] Testare aggiornamento dei grafici dopo modifiche, filtri, archiviazione, cambio mese e reload.

**Gate:** la Home e le Analisi si aggiornano dopo ogni commit, non inventano dati o rendimenti, e i grafici funzionano senza CDN/rete.

## M6 — Backup, ripristino e sicurezza

**Obiettivo:** dati trasferibili e recuperabili, senza servizi esterni.

- [ ] Backup JSON completo, versionato, senza segreti; nome file con data.
- [ ] Backup cifrato facoltativo con Web Crypto, AES-256-GCM e derivazione PBKDF2, formati documentati.
- [ ] Esportazione tramite condivisione/file o fallback download; messaggi coerenti con l'esito osservabile.
- [ ] Ripristino con validazione, anteprima, conferma, sostituzione atomica e rollback.
- [ ] Export CSV per movimenti e patrimonio/storico, escaping e mitigazione formule.
- [ ] Stato backup e avviso interno a 30 giorni, nessuna notifica push.
- [ ] PIN facoltativo, sblocco e blocco di sessione, gestione PIN dimenticato; limitazioni documentate.
- [ ] Cancellazione dati con doppia conferma e offerta backup.
- [ ] Test round-trip standard/cifrato, password errata, file alterato, formato/versione non supportati, riferimenti invalidi, restore interrotto, export CSV, PIN e assenza di segreti nel backup.

**Gate:** backup e ripristino ricostruiscono esattamente dati e totali in ambiente di test; un errore non cancella o altera il database corrente; nessun PIN/password esportato.

## M7 — Collaudo integrato

**Obiettivo:** dimostrare la correttezza e la reale utilizzabilità della PWA. Eseguire i test su dati sintetici, mai sul database personale dell'utente.

- [ ] Eseguire suite unit/integration e controlli end-to-end disponibili; registrare comandi, ambiente e risultati.
- [ ] Ripetere i test finanziari riportati in `SPECIFICATIONS.md` e verificare indipendenza dei due sistemi.
- [ ] Verificare richieste di rete: nessun invio di dati finanziari, nessun asset runtime da terzi.
- [ ] Verificare aggiornamento di una versione dell'app con dati esistenti e migrazione DB non distruttiva.
- [ ] Verificare stati di storage non disponibile, errore quota, caching fallito, restore fallito e file annullato.
- [ ] Verificare su Safari/iPhone reale tramite URL HTTPS di test (può richiedere una preview GitHub Pages prima del rilascio pubblico definitivo; solo su richiesta/autorizzazione).

### Checklist manuale iPhone (da eseguire e registrare realmente)

| Verifica | Esito iniziale |
|---|---|
| Aprire URL HTTPS in Safari e aggiungere Capitale alla schermata Home | Da testare |
| Avviare dalla propria icona in modalità standalone e verificare safe area | Da testare |
| Creare posizioni e movimenti sintetici; chiudere/riaprire la PWA e verificare persistenza | Da testare |
| Dopo cache pronta, attivare modalità aereo; consultare, modificare, salvare e riaprire | Da testare |
| Tornare online e aggiornare l'app mantenendo dati e storico | Da testare |
| Salvare backup standard e cifrato in File/iCloud Drive; controllare presenza effettiva | Da testare |
| Ripristinare su istanza vuota o dispositivo di test; confrontare record e totali | Da testare |
| Provare file corrotto/password errata senza perdita dei dati di test | Da testare |
| Esportare CSV e aprirlo in Numbers/Excel | Da testare |
| Attivare PIN, chiudere/riaprire, verificare blocco e oscuramento importi | Da testare |
| Controllare inserimento rapido, tastiera decimale, scroll, grafici e lettura dei numeri | Da testare |

**Gate:** nessun difetto bloccante nei flussi principali e nessuna perdita dati nei test. Se l'agente non ha un iPhone reale, segnare test su dispositivo come pendenti e fornire questa checklist all'utente. Una simulazione non sostituisce la verifica reale. Eventuali test distruttivi solo su database di prova.

## M8 — Pubblicazione GitHub Pages e installazione

**Obiettivo:** distribuire Capitale senza App Store e consegnare istruzioni riproducibili.

- [ ] Verificare che il codice destinato alla pubblicazione non contenga dati reali, backup o segreti.
- [ ] Verificare asset inclusi, licenze delle dipendenze, manifest, scope/cache, HTTPS e path del project site.
- [ ] Preparare README definitivo: setup, test, deploy, installazione su iPhone, primo avvio online, backup, ripristino, aggiornamenti, limiti dello storage e del PIN.
- [ ] Configurare Pages dalla sorgente appropriata (branch/cartella o workflow secondo struttura adottata), solo con autorizzazione dell'utente.
- [ ] Verificare URL effettivo `https://<username>.github.io/capitale/` o quello configurato; non inventare username o link di deploy.
- [ ] Eseguire smoke test online/offline della release e completare eventuale checklist iPhone residua.
- [ ] Documentare versione effettivamente distribuita e limitazioni. Tag `v1.0.0` solo quando appropriato e autorizzato.

**Gate finale:** release staticamente distribuibile; app installabile e utilizzabile su iPhone; dati locali; backup e recupero collaudati; nessun costo ricorrente previsto. Se una verifica resta pendente, non dichiarare completato il gate.

## Registro sintetico di avanzamento

| Milestone | Stato iniziale | Evidenze / note |
|---|---|---|
| M1 Fondamenta | In corso | Fondamenta e test unitari completati; resta la verifica offline/installazione con service worker e su iPhone. |
| M2 Interfaccia | Da iniziare | |
| M3 Patrimonio | Da iniziare | |
| M4 Movimenti | Da iniziare | |
| M5 Home e Analisi | Da iniziare | |
| M6 Backup e sicurezza | Da iniziare | |
| M7 Collaudo | Da iniziare | |
| M8 Pubblicazione | Da iniziare | |

## Primo prompt consigliato per Codex

> Leggi AGENTS.md, SPECIFICATIONS.md e ROADMAP.md nella root. Ispeziona la repository esistente e inizia concretamente M1 — Fondamenta tecniche, rispettando tutti i vincoli. Non limitarti a descrivere un piano. Implementa e testa ciò che è possibile verificare, aggiorna ROADMAP.md con i risultati reali e riportami modifiche, comandi, test, limiti e prossimi passi. Non pubblicare né modificare dati o impostazioni remote senza mia autorizzazione. Non introdurre funzionalità fuori perimetro.

Dopo M1, proseguire con le milestone successive, usando i documenti e lo stato della repository come contesto persistente.
