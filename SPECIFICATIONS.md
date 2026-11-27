# Capitale — Specifiche funzionali e tecniche V1.0

**Stato:** progettazione funzionale concordata; implementazione e collaudo da iniziare.  
**Nome:** Capitale · **Versione obiettivo:** 1.0.0 · **Lingua:** italiano · **Valuta:** EUR  
**Slogan proposto:** Il tuo patrimonio. Le tue spese. Il tuo controllo.

## 1. Visione e perimetro

Capitale riunisce in un'unica app la visione di più conti e investimenti e il registro delle entrate e delle spese. Deve rispondere rapidamente a due domande: quanti soldi possiedo e quanto ho guadagnato/speso nel mese? Non deve obbligare l'utente a registrare ogni movimento bancario o a riconciliare continuamente i saldi.

È una PWA mobile-first, installabile da Safari sulla schermata Home di iPhone, senza App Store né abbonamento sviluppatore. Nessun account, backend o costo ricorrente previsto. Il codice sarà ospitato su GitHub Pages (repository pubblica `capitale`); il sito è raggiungibile pubblicamente, ma i dati sono locali per dispositivo/origine. Nessuna sincronizzazione tra dispositivi. Eventuale spazio iCloud per i backup è quello a disposizione dell'utente.

### 1.1 Due sistemi indipendenti (requisito fondamentale)

| Sistema | Fonte dei dati | Risposta |
|---|---|---|
| Patrimonio | Valori aggiornati manualmente e snapshot | Quanto possiedo all'ultimo aggiornamento? |
| Movimenti | Entrate e uscite inserite manualmente | Quanto ho registrato come entrata e spesa in un periodo? |

- Una spesa, uno stipendio o una cedola registrati nei Movimenti non modificano i valori del Patrimonio.
- Un nuovo saldo o una variazione di un ETF non generano movimenti.
- Trasferire denaro tra propri conti o acquistare un titolo non costituisce una spesa personale (eventuali commissioni possono essere registrate separatamente come uscite).
- Non si richiede associazione di un movimento a un conto. Non introdurre quadratura obbligatoria, saldi bancari derivati dai movimenti o correzioni automatiche.
- I totali dei Movimenti sono esplicitamente «registrati»: possono essere incompleti. Il bilancio mensile non è il saldo disponibile né la variazione del patrimonio.
- Un confronto tra le due grandezze non dimostra l'esistenza di spese mancanti: può dipendere anche da rendimenti, flussi non registrati o date di aggiornamento. Nessuna riconciliazione nella V1.0.

## 2. Navigazione

Barra inferiore persistente con quattro sezioni: **Home**, **Patrimonio**, **Movimenti**, **Analisi**. Impostazioni accessibili dall'ingranaggio nella Home. Home è la schermata iniziale. Il pulsante «Nuovo movimento» è facilmente raggiungibile da Home e Movimenti. Navigazione coerente, ritorno dalle schede di dettaglio, nessuna procedura di registrazione account.

| Schermata | Contenuto |
|---|---|
| Home / Panoramica | Totale patrimoniale, grafico storico, liquidità, investimenti, data aggiornamento, riepilogo movimenti del mese, accesso rapido |
| Patrimonio | Gruppi espandibili, singole posizioni, aggiornamento massivo, storico e schede dettaglio |
| Movimenti / Movimenti mensili | Selettore mese, entrate, uscite, bilancio registrato, ripartizione delle spese, elenco e inserimento/modifica |
| Analisi | Grafici patrimoniali e dei movimenti, distinti per contesto |
| Impostazioni | Categorie, privacy/PIN, backup, esportazione e ripristino |

## 3. Patrimonio

### 3.1 Posizioni finanziarie

L'utente può creare più posizioni di ciascun tipo, senza un limite applicativo arbitrario. Nome obbligatorio; banca/broker e altri dettagli informativi facoltativi salvo quanto sotto. I saldi e i valori sono in euro, aggiornati manualmente.

| Tipo | Campi specifici |
|---|---|
| Conto corrente | Nome, banca, saldo |
| Conto deposito | Nome, banca, saldo, libero/vincolato, tasso d'interesse informativo, eventuale scadenza |
| ETF | Nome, ISIN, broker facoltativo, capitale investito, valore attuale |
| Obbligazione | Nome, ISIN, broker facoltativo, capitale investito, valore attuale, cedola e scadenza |
| Contanti | Nome e saldo |

ISIN e dettagli come tasso, cedola e scadenza sono facoltativi per facilitare l'inserimento. Tassi/cedole sono informativi: nessun calcolo automatico di maturazione, imposte o accrediti. Il valore attuale di ETF/obbligazioni è quello complessivo inserito dall'utente, non il prezzo per quota. Non sono richiesti quantità, prezzo medio di carico o storico delle compravendite. Non duplicare il valore di un investimento già conteggiato nel saldo di una posizione: il saldo del conto broker, se inserito, rappresenta solo la liquidità non investita.

### 3.2 Aggiornamento manuale e storico

- Creare, modificare e chiudere/archiviare posizioni. Le posizioni archiviate non contribuiscono al patrimonio corrente; lo storico resta consultabile.
- «Aggiorna patrimonio»: schermata unica con tutte le posizioni attive, valori precedenti precompilati, nuovo totale in anteprima e possibilità di modificare capitale investito insieme al valore corrente, ove pertinente.
- Alla conferma, salvare atomicamente uno snapshot datato con i valori di tutte le posizioni attive, inclusi quelli lasciati invariati. Conservare gli snapshot precedenti; nessuna modifica retroattiva implicita.
- Aggiornamento possibile con qualsiasi frequenza; nessuna ricorrenza automatica. Mostrare data dell'ultimo snapshot e data dell'ultima rilevazione di ciascuna posizione se diversa. Un importo riportato senza nuova rilevazione non è una quotazione aggiornata.
- Consentire correzione/eliminazione di snapshot con conferma e ricalcolo coerente. Non distruggere lo storico alla modifica del nome/tipo di una posizione; conservare nei record storici i metadati necessari a ricostruirlo.
- Prima registrazione patrimoniale: lo storico inizia dalla prima fotografia effettiva; non inventare valori precedenti.
- Creazione/archiviazione/aggiornamento dei valori correnti va associata a una fotografia coerente, evitando disallineamenti fra Home, Patrimonio e Analisi. Le modifiche puramente descrittive non richiedono un nuovo snapshot.

### 3.3 Calcoli patrimoniali

- Patrimonio complessivo = somma dei valori delle posizioni attive, non somma di tutti gli snapshot.
- Liquidità totale = conti correnti + conti deposito + contanti. Evidenziare separatamente liquidità subito disponibile e depositi vincolati, che non sono automaticamente spendibili.
- Investimenti = valori attuali degli ETF e delle obbligazioni attive.
- Capitale investito = costo di carico complessivo delle posizioni ancora detenute, aggiornato manualmente dall'utente anche in caso di vendite parziali. Non dedurlo dai Movimenti.
- Plus/minusvalenza non realizzata = valore attuale − capitale investito. Percentuale semplice = differenza / capitale investito × 100, se capitale positivo; altrimenti indicare non disponibile.
- Calcolo aggregato degli investimenti: sommare valori e capitali prima di calcolare la percentuale (non media delle singole percentuali).
- Il rendimento mostrato è una variazione semplice non realizzata, non un rendimento totale, annualizzato o ponderato per i flussi. Non comprende automaticamente cedole, dividendi, imposte o rendimenti realizzati. Non etichettare l'aumento del patrimonio come rendimento di mercato.
- Variazione patrimoniale su un periodo = ultimo valore disponibile − valore di riferimento disponibile, con date effettive indicate. Se non esistono due rilevazioni idonee, mostrare dato non disponibile. Percentuale non disponibile se riferimento non positivo.
- Non è previsto un modulo per debiti o mutui residui; «patrimonio» indica il valore complessivo delle attività censite (non il patrimonio netto completo). Un eventuale saldo di conto negativo può essere gestito come valore firmato, senza introdurre un modulo debiti.

### 3.4 Scheda investimento

Mostrare nome, tipo, ISIN se presente, valore attuale, capitale investito, plus/minusvalenza in euro e percentuale, storico dei due valori. Per obbligazioni aggiungere cedola/scadenza se inserite. Nessuna API di quotazione. Archivio consultabile senza alterare i totali correnti.

## 4. Movimenti mensili

Registro manuale di entrate e uscite, separato dal patrimonio. Nessun movimento programmato, nemmeno lo stipendio. Nessun budget, previsione o avviso di soglia.

### 4.1 Dati di un movimento

| Campo | Requisito |
|---|---|
| Tipo | Entrata oppure uscita |
| Importo | Positivo, in euro, obbligatorio, due decimali al massimo |
| Tipologia di spesa | Obbligatoria per uscite: fissa, variabile, straordinaria |
| Categoria | Selezionabile tra le categorie compatibili con il tipo |
| Data | Data civile, precompilata con oggi, modificabile |
| Descrizione | Facoltativa |

Non richiedere il conto di provenienza/destinazione. Consentire modifica ed eliminazione con conferma, registrazione di spese cumulative (es. spesa settimanale) tramite il normale inserimento manuale. Un nuovo movimento deve essere inseribile con pochi tocchi; tastiera decimale e formato locale. Nessun doppio salvataggio involontario.

### 4.2 Categorie iniziali

Le tre macro-tipologie di uscita restano fisse. Le sottocategorie sono personalizzabili dalle impostazioni. Conservare il riferimento dei movimenti storici quando una categoria è rinominata o archiviata; non cancellare movimenti eliminando una categoria.

| Fisse | Variabili | Straordinarie | Entrate |
|---|---|---|---|
| Affitto o mutuo | Supermercato | Vacanze | Stipendio |
| Abbonamenti | Ristoranti e bar | Elettronica | Rimborsi |
| Assicurazioni | Carburante | Automobile | Regali |
| Bollette | Abbigliamento | Arredamento | Interessi e cedole |
| Telefonia | Svago | Imprevisti | Altro |
| Altro | Altro | Altro | |

### 4.3 Schermata e calcoli

- Apertura sul mese corrente; selezione di mesi precedenti e mesi con dati, con navigazione semplice.
- Totale entrate = somma importi dei movimenti di tipo entrata del mese selezionato.
- Totale uscite = somma importi delle uscite del mese selezionato, espressa come grandezza positiva; mostrare segno negativo nelle singole righe ove utile.
- Bilancio mensile registrato = entrate − uscite. Può essere positivo, nullo o negativo. Non definirlo saldo bancario o risparmio effettivo.
- Ripartizione delle uscite in fisse, variabili, straordinarie, con importi e percentuali sul totale uscite. Se il totale è zero, mostrare stato vuoto, non NaN.
- Elenco cronologico dal più recente, filtro Tutti / Entrate / Fisse / Variabili / Straordinarie. I filtri agiscono sull'elenco senza cambiare i totali mensili generali, salvo indicazione esplicita.
- Modifica della data sposta il movimento al mese corretto; i riepiloghi si aggiornano subito dopo il commit.
- Mese senza dati: mostrare zero per i totali registrati e un messaggio «Nessun movimento registrato», non suggerire che non ci siano state spese reali.
- Importazione di estratti conto CSV e categorizzazione automatica non incluse nella V1.0; l'esportazione CSV è invece inclusa.

## 5. Home — Panoramica

Ordine di visualizzazione su iPhone:
1. Intestazione «Panoramica», icona occhio (oscuramento importi) e ingranaggio Impostazioni.
2. Scheda patrimonio totale, variazione in euro e percentuale quando disponibile, grafico storico con selettori 1M / 3M / 6M / 1A / Tutto.
3. Schede liquidità e investimenti; distinguere la quota vincolata nella liquidità.
4. Data ultimo aggiornamento del patrimonio.
5. Movimenti del mese corrente: entrate, uscite registrate, bilancio registrato, piccola ripartizione per le tre tipologie.
6. Pulsante «Nuovo movimento», accesso rapido alle sezioni e barra di navigazione inferiore.
7. Avviso discreto per il backup quando dovuto (vedi §8).

I due riepiloghi devono essere visivamente distinti. Il patrimonio deriva dagli ultimi dati patrimoniali, non dal bilancio del mese. Niente grafici fittizi, percentuali o trend inventati quando mancano dati.

## 6. Analisi e grafici

Cinque visualizzazioni nella V1.0, con valori leggibili, legende e tooltip:

| Grafico | Dati | Tipo indicativo |
|---|---|---|
| Andamento del patrimonio | Snapshot effettivi nel tempo | Linea/area |
| Distribuzione patrimoniale | Ultimi valori per tipo di posizione | Anello, con legenda |
| Andamento investimenti | Valore attuale e capitale investito degli snapshot | Due linee |
| Entrate e uscite mensili | Totali registrati per mese | Barre affiancate |
| Suddivisione delle spese | Fisse, variabili, straordinarie | Anello/barre |

- Filtri temporali patrimoniali 1 mese, 3 mesi, 6 mesi, 1 anno, tutto; analisi movimenti con selezione mensile e confronto tra mesi/anni. Non inventare snapshot in giorni senza rilevazione: asse cronologico e punti reali; eventuale linea tra punti è soltanto connessione visiva.
- Se disponibili, per il confronto usare la fotografia alla data di riferimento o l'ultima precedente, segnalando la data effettiva; non presentare una rilevazione lontana come esattamente all'inizio del periodo.
- Anelli e percentuali di allocazione non devono rappresentare importi negativi come fette positive: se saldi negativi rendono la ripartizione non significativa, mostrare importi in elenco/barre firmate e una spiegazione. Gestire totali nulli e assenza di dati.
- Con un solo snapshot mostrare un punto e la data, senza trend fittizio. Rendere disponibili i valori anche in testo per accessibilità.
- Colori coerenti con il design e indicazioni testuali/segni, non solo il colore. Quando gli importi sono oscurati, non rivelarli attraverso assi, tooltip o etichette; il comportamento dell'export è separato.

## 7. Design system

Direzione approvata: **Dark finanziario**, modalità scura permanente, ispirazione iOS, moderna ma sobria. Nessuna modalità chiara necessaria in V1.0. Tipografia di sistema (system font stack), numeri tabulari, icone semplici, carte arrotondate, gerarchia visiva chiara, animazioni leggere e disattivabili.

| Token / ruolo | Valore di riferimento |
|---|---|
| Sfondo | `#101216` |
| Superfici/card | `#1C2028` |
| Testo primario | `#F2F4F8` |
| Testo secondario | `#9299A8` |
| Accento / entrate / guadagni | `#69D6A5` |
| Uscite / perdite | `#F07878` |
| Liquidità / spese fisse | `#7299EA` |
| Investimenti / spese straordinarie | `#A78BDF` |
| Informazioni / spese variabili | `#E3B66F` |

Usare questi colori come base e adattare le combinazioni per contrasto/accessibilità. Per il patrimonio mantenere colori distinguibili e stabili per tutte e cinque le tipologie. Icona provvisoria: sfondo scuro e tre barre verdi crescenti, senza marchi di terzi. Preparare icone PWA e Apple touch icon adeguate. Layout mobile-first, responsive anche su tablet/desktop senza richiedere una versione separata. Barra inferiore con safe area; elementi tattili di circa 44 px o più; evitare overflow orizzontale, zoom forzato e grafici illeggibili.

## 8. Persistenza, backup e ripristino

### 8.1 Salvataggio quotidiano

IndexedDB come fonte di verità persistente. Salvataggio immediato per ogni operazione confermata. Mostrare errori effettivi, non successi prematuri. Nessuna dipendenza da rete per inserire, consultare o esportare dati dopo la prima inizializzazione offline riuscita. Valutare `navigator.storage.persist()` dove disponibile senza promettere persistenza garantita.

Lo storage web su iPhone può essere eliminato per azioni dell'utente, pressione dello spazio, rimozione dell'app o altri comportamenti della piattaforma. Non assumere che Safari e la PWA installata condividano lo stesso database. Non fare affidamento su backup automatici iOS per IndexedDB. Cambiare origine/URL di distribuzione può rendere inaccessibili i dati precedenti. Il backup esportato è il meccanismo esplicito di recupero.

### 8.2 Backup completo manuale

Da Impostazioni > Backup e ripristino, pulsante «Crea backup completo». File standard JSON e opzione di backup cifrato con password. Nome indicativo `Capitale_backup_YYYY-MM-DD_HHmm.json` (per cifrato usare un suffisso riconoscibile, es. `.encrypted.json`). Esportazione tramite funzionalità supportate dal browser, condivisione/salvataggio in File o iCloud Drive scelti dall'utente. Prevedere fallback download quando la condivisione di file non è disponibile. Non promettere scrittura automatica in iCloud o accesso a cartelle senza interazione.

Contenuto: tutte le posizioni anche archiviate, snapshot e valori storici, movimenti, categorie anche archiviate, preferenze esportabili, versione schema/formato, data di creazione. Escludere PIN, verificatori di autenticazione, password, chiavi crittografiche, cache e stato temporaneo di sessione. Le impostazioni di sicurezza locali vanno riconfigurate dopo un ripristino su un nuovo dispositivo.

- Backup standard: testo leggibile, avvisare della sensibilità del contenuto.
- Backup cifrato: AES-256-GCM tramite Web Crypto, chiave derivata da password con PBKDF2-SHA-256, sale e IV casuali, parametri versionati e documentati. Dimenticando la password, il file non è recuperabile. Il database locale non è cifrato da questa opzione.
- Mostrare data dell'ultima esportazione avviata/completata osservabile e distinguere ciò che il browser può attestare dall'effettiva presenza del file in iCloud. Non segnare esportazione annullata come riuscita quando è possibile rilevarla. L'utente deve verificare che il file sia stato salvato.
- Avviso interno discreto in Home e Impostazioni dopo 30 giorni dall'ultima esportazione, oppure indicazione «Nessun backup effettuato» se non esiste ancora un backup; nessuna notifica push, backup in background o sincronizzazione cloud automatica.

### 8.3 Ripristino

Selezione manuale file JSON o JSON cifrato, eventuale richiesta password. Validare struttura, versioni, tipi, importi, date, ID univoci, riferimenti, integrità e compatibilità prima di toccare il database. Rifiutare file corrotti, incompatibili, password errate e dati non validi con messaggi comprensibili. Migrazioni solo per formati supportati.

Presentare anteprima con data del backup, conteggi e avviso di sostituzione completa. Offrire la creazione di un backup dei dati correnti prima di procedere. Richiedere conferma esplicita. Ripristino atomico, non unione dei database. Se fallisce, conservare i dati preesistenti. Ricalcolare riepiloghi e grafici e verificare conteggi dopo l'importazione. Non ripristinare automaticamente un PIN esportato né una falsa data di ultimo backup locale.

### 8.4 CSV e cancellazione

Esportazione CSV compatibile con Excel/Numbers (UTF-8, BOM se utile, separatore `;`, importi con virgola decimale, escaping corretto). Prevedere almeno export dei Movimenti e dati patrimoniali/storici; eventualmente file separati per tabelle omogenee. Neutralizzare formule da testo inserito dall'utente per evitare CSV injection. CSV è per consultazione, non sostituisce il backup JSON.

Impostazioni > Cancella tutti i dati: azione chiaramente distruttiva, conferma esplicita con secondo passaggio e possibilità di backup prima; non invocarla durante aggiornamenti/migrazioni. Dopo la cancellazione tornare allo stato iniziale vuoto (categorie predefinite, nessun dato finanziario), azzerando anche le impostazioni locali secondo la semantica dichiarata.

## 9. Privacy e accesso

- Accesso diretto senza PIN per impostazione iniziale. Possibilità di attivare/disattivare/modificare un PIN dalle impostazioni. Blocco al riavvio e dopo ritorno da inattività/secondo piano secondo regola documentata; quando il PIN è attivo, nessuna visualizzazione finanziaria prima dello sblocco.
- PIN locale: non salvarlo in chiaro, usare derivazione con sale, mitigare tentativi ripetuti. Non è cifratura del database né una difesa contro chi controlla browser/dispositivo. Nessuna promessa di autenticazione biometrica o sicurezza bancaria.
- Se dimenticato, prevedere percorso chiaramente spiegato e non aggirabile accidentalmente (es. reset dei dati locali con ripristino da backup). Nessun server di recupero.
- Occhio per mostrare/nascondere gli importi nell'intera interfaccia, comprese legende, tooltip, schede di dettaglio e riepiloghi. È una funzione di riservatezza visiva, non cifratura. Non richiedere di mostrare i saldi per registrare un movimento; rendere chiaro quando un modulo contiene importi in inserimento.
- Nessun caricamento di dati finanziari sul repository o server. L'hosting del codice implica normali richieste web per installazione/aggiornamenti, non l'invio del database. Non includere font remoti, tracciatori o script da CDN. Evitare log di informazioni sensibili.

## 10. Architettura e PWA

HTML5, CSS3, JavaScript modulare, IndexedDB, Chart.js locale, Web App Manifest, Service Worker e Web Crypto API. Nessun backend. GitHub Pages statico, HTTPS, percorsi relativi compatibili con repository project site. Repository pubblica; licenza ancora da definire, non aggiungere una licenza automaticamente.

- Manifest: nome/short_name Capitale, `lang: it`, `display: standalone`, `start_url`/scope relativi, theme/background color, icone 192/512 e Apple touch icon, risorse locali.
- Service worker: precache shell e risorse essenziali (inclusi grafici, icone e moduli), fallback offline, cache versionata. Aggiornare in modo controllato senza cancellare IndexedDB, senza mescolare versioni incompatibili di asset; eliminare solo cache proprie obsolete. Segnalare problemi di installazione/caching. La prima visita e il download degli aggiornamenti richiedono rete.
- Versionare schema DB e backup separatamente; migrazioni atomiche. Gestire database non accessibile, errori quota e versioni aperte in più schede. Non simulare persistenza con memoria volatile.
- README finale: avvio/test/build se presenti, configurazione GitHub Pages, URL, installazione da Safari (Condividi > Aggiungi alla schermata Home, con eventuali variazioni UI iOS), primo avvio online, verifica offline, backup, limiti storage, aggiornamento e recupero.

### 10.1 Modello dati logico proposto

La struttura seguente traduce i requisiti in un modello iniziale; Codex può adattare i nomi e gli indici senza alterarne la semantica.

| Store / entità | Campi essenziali |
|---|---|
| `positions` | id, type, name, institution?, status, currentValueCents, investedCapitalCents?, isin?, depositType?, interestRate?, coupon?, maturityDate?, valuedOn?, createdAt, updatedAt |
| `snapshots` | id, effectiveDate, createdAt, valori delle posizioni (o relazione atomica a snapshot items) |
| `snapshotItems` (se separato) | snapshotId, positionId, type/name storici, valueCents, investedCapitalCents?, depositType?, valuedOn |
| `movements` | id, kind, amountCents, categoryId, expenseType? (solo uscite), date, description?, createdAt, updatedAt |
| `categories` | id, kind, expenseType?, name, archived |
| `settings` | preferenze UI, metadati di backup locale, impostazioni applicative |
| `security` | metadati PIN locali, non esportabili |

Importi in centesimi interi, ID stabili (es. UUID), date civili `YYYY-MM-DD`, timestamp ISO 8601. Indici per data movimento, tipo/categoria e data snapshot secondo necessità. I totali sono derivati da record, non duplicati come dati indipendenti. Snapshot completi e riferimento all'ultima fotografia devono rimanere coerenti. Per correzione/eliminazione dell'ultimo snapshot o rimozione dell'unico snapshot definire comportamento deterministico, senza perdere anagrafiche o inventare valori: documentare e testare prima dell'uso reale. Gestire più fotografie nello stesso giorno con timestamp/ID e ordinamento stabile.

## 11. Esempi di accettazione (solo fixture sintetiche)

| Caso | Atteso |
|---|---|
| Conti correnti 6.500 €, depositi 15.000 €, contanti 300 €, ETF 13.000 €, obbligazioni 8.000 € | Patrimonio 42.800 €, liquidità 21.800 €, investimenti 21.000 € |
| ETF valore 8.500 €, capitale 7.000 € | Plusvalenza 1.500 €, +21,43% (arrotondato) |
| Capitale investito 0 o mancante | Percentuale non disponibile |
| Stipendio 2.100 €, fisse 630 €, variabili 170 €, straordinarie 150 € | Entrate 2.100 €, uscite 950 €, bilancio +1.150 € |
| Registrare una nuova spesa di 50 € | Uscite 1.000 €, bilancio +1.100 €; patrimonio ancora 42.800 € |
| Aggiornare patrimonio a 43.000 € | Nuovo snapshot; precedenti invariati; movimenti invariati |
| Mese senza movimenti / nessuno snapshot | Stato vuoto esplicito, niente divisioni per zero o trend inventati |
| Importare un backup valido su database vuoto | Stessi dati e totali esportati, sicurezza locale riconfigurabile |
| Backup non valido o password errata | Nessuna modifica ai dati esistenti |

## 12. Esclusioni e stato delle decisioni

Esclusi dalla V1.0: collegamenti bancari, importazione CSV bancaria, quotazioni automatiche, trading, storico dettagliato delle compravendite, contabilità completa, gestione debiti, budget, obiettivi, previsioni, movimenti programmati, notifiche push, account, sincronizzazione cloud, pubblicità e servizi a pagamento.

Le decisioni di prodotto concordate sono nome, PWA locale/offline, separazione dei sistemi, gestione intermedia investimenti, movimenti manuali con tre tipi di spesa, dashboard e navigazione, stile Dark, PIN facoltativo, backup manuale anche cifrato, avviso a 30 giorni, ripristino ed export CSV. Palette, categorie iniziali, struttura dati, campi facoltativi, regole tecniche di snapshot, gestione PIN e dettagli crittografici sono precisazioni di implementazione coerenti con la progettazione, non ulteriori funzionalità richieste dall'utente. Eventuali ambiguità residue vanno risolte privilegiando semplicità, conservazione dei dati e trasparenza, documentando le scelte. Compatibilità iOS, storage e backup restano da verificare su dispositivo reale; nessun codice è stato ancora collaudato con questi documenti.
