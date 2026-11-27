# M1 — Fondamenta tecniche

## Decisioni implementative

- Applicazione statica HTML/CSS/JavaScript a moduli ES: nessun framework e nessuna dipendenza runtime.
- IndexedDB `capitale`, schema `1`; i record finanziari restano separati in `positions`, `snapshots`, `snapshotItems` e `movements`.
- Le categorie predefinite vengono inizializzate solo nello schema e non sono dati finanziari dimostrativi.
- Gli importi sono centesimi interi; le date civili sono stringhe `YYYY-MM-DD`. Il database non usa `localStorage` come fallback.
- Il service worker usa una cache versionata limitata allo stesso origin e non effettua caching di richieste esterne.

## Migrazioni

La migrazione da un archivio inesistente a schema `1` è gestita in `onupgradeneeded` in un'unica transazione. Le migrazioni future devono incrementare `DB_VERSION`, aggiungere uno specifico ramo versionato senza eliminare store o record e aggiungere il relativo test prima dell'uso reale.

## Verifiche effettive

- Test automatici Node: parsing/formattazione degli importi, date civili, validazione, inizializzazione IndexedDB, categorie, CRUD e riapertura del database.
- Browser desktop locale: shell vuota visualizzata su `http://127.0.0.1:4173/`, senza errori console osservati.

## Verifiche pendenti

- Prima installazione e offline dopo il completamento della cache in un browser con service worker verificabile.
- Installazione, persistenza e offline su Safari/iPhone reale (M7).
