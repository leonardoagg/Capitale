# Capitale su Home Assistant OS

Questa cartella contiene la copia statica pronta da servire tramite Home Assistant.

## Installazione

1. Sul Raspberry, crea la cartella `/config/www/` se non esiste.
2. Copia **l'intera cartella** `capitale` in `/config/www/`, ottenendo `/config/www/capitale/index.html`.
3. Apri sempre il medesimo URL HTTPS, anche nella rete di casa:

   `https://<tuo-nome>.duckdns.org/local/capitale/`

4. In Safari su iPhone usa Condividi → **Aggiungi a schermata Home**.

I file sotto `/local/` non sono protetti dal login di Home Assistant: questa cartella contiene soltanto il codice dell'app, mai backup o dati finanziari.

## Aggiornamenti

Quando viene preparata una nuova copia, sostituisci tutti i file di `/config/www/capitale/` con quelli di questa cartella. Apri poi Capitale una volta online per aggiornare la cache della PWA.

I dati restano nell'IndexedDB dell'iPhone e sono legati all'URL DuckDNS: non alternare l'URL DuckDNS con un IP locale o `homeassistant.local`.
