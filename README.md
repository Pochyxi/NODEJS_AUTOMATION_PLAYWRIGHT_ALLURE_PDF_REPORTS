# PLAYWRIGHT ADI FRAMEWORK

Questo framework di automazione dei test è progettato per semplificare l'esecuzione di test utilizzando [Playwright](https://playwright.dev/). L'unico prerequisito per utilizzare questo framework è avere installato [Node.js](https://nodejs.org/it/).

## Installazione

1. Clona il repository
2. Esegui `npm install` per installare le dipendenze
3. Esegui `npm start` per avviare l'applicazione con il test DEMO
4. Esegui 'npm run allure' per generare il report di Allure e aprire la dashboard
5. Esegui 'npm run trace' per aprire il programma di visualizzazione delle tracce(le tracce sono disponibili nella cartella /TracesReport)

## Configurazione

Nel file `CONFIG.ts` è possibile specificare diverse opzioni di configurazione:

- `nomeProgetto`: Il nome del progetto da eseguire tra quelli presenti nella cartella `/test-suites`
- `mostraEsecuzione`: Decidere se eseguire i test in modalità headless o meno
- `mostraDashboard`: Decidere se aprire la dashboard di Allure alla fine dei test
- `altezzaFinestraInPixels`: Altezza della finestra del browser
- `larghezzaFinestraInPixels`: Larghezza della finestra del browser
- `attesaPrimaDelFallimentoInSecondi`: Tempo di attesa prima di considerare un test fallito

## Struttura dei test

I test sono organizzati in una struttura gerarchica all'interno della cartella `/test-suites`. Ogni progetto di test è rappresentato da un file JSON che contiene le informazioni necessarie per l'esecuzione dei test.

Il file JSON del progetto di test include le seguenti sezioni:

- `info`: Contiene le informazioni generali per l'esecuzione dei test, come il nome del progetto, i browser da utilizzare, il tipo di esecuzione e il nome dell'esecuzione.
  - `name`: Il nome del progetto da eseguire tra quelli presenti nella cartella `/test-suites`, è importante che questo nome corrisponda al nome del file JSON del progetto.
  - `browser`: Il browser da utilizzare per l'esecuzione dei test, può essere "chrome", "firefox" o "safari". I test saranno eseguiti in parallelo.
  - `runType`: Specifica il tipo di esecuzione, che può essere "cap" (esegue tutti i test in un capitolo) o "test" (esegue un singolo test).
  - `runName`: il nome del capitolo o del singolo test.
- `tests`: Contiene la definizione dei test da eseguire, organizzati in capitoli e singoli test.

Ogni test è composto da una serie di passaggi (`testStep`) che rappresentano le azioni da eseguire durante il test. Ogni `testStep` ha un nome (`stepName`), un'azione (`actionName`) da compiere e gli eventuali argomenti (`args`) necessari per eseguire l'azione.

## Azioni disponibili

Il framework supporta le seguenti azioni predefinite:

- `settaggio_storage`: Imposta un valore nello storage del browser (local o session)
    - Args: `storageConfigName` (nome del file JSON contenente i valori da impostare), `storageType` (local o session)

- `atterraggio_pagina`: Atterra sulla pagina specificata
    - Args: `url`

- `clicca`: Fa clic sull'elemento specificato
    - Args: `selector` (selettore CSS)

- `inserisci_testo`: Inserisce il testo specificato nell'elemento specificato
    - Args: `selector`, `text`

- `controlla`: Controlla se l'elemento specificato è visibile
    - Args: `selector`

## Selettori

### Il framework supporta diversi tipi di selettori per individuare gli elementi nella pagina:

- `Selettore CSS`: Utilizza un selettore CSS standard
- `Selettore di testo`: Utilizza il prefisso `text=` seguito dal testo esatto dell'elemento
- `Selettore di testo` parziale: Utilizza il prefisso `has-text=` seguito da una parte del testo dell'elemento
- `Selettore XPath`: Utilizza il prefisso `xpath=` seguito da un'espressione XPath
- `Selettore di attributo`: Utilizza il formato `[attribute=value]`
- `Selettore di visibilità`: Utilizza il suffisso `:visible`
- `Selettore di contenimento`: Utilizza il suffisso `:has(selector)`
- `Selettore di corrispondenza multipla`: Utilizza il selettore `:is(selector1, selector2, ...)`

### Ecco un elenco completo dei selettori CSS disponibili in Playwright, inclusi i selettori specifici di Playwright come has-text:

### Selettori CSS standard:

- `Selettore di tag`: tagname
- `Selettore di classe`: .classname
- `Selettore di ID`: #idname
- `Selettore di attributo`: [attribute=value]
- `Selettore di discendente`: ancestor descendant
- `Selettore di figlio diretto`: parent > child
- `Selettore di fratello adiacente`: element + sibling
- `Selettore di fratello generale`: element ~ sibling
- `Pseudo-classi`: :hover, :focus, :active, :visited, :nth-child(n), :nth-of-type(n), :first-child, :last-child, :empty, :checked, :disabled, :enabled, :not(selector), ecc.
- `Pseudo-elementi`: ::before, ::after, ::first-letter, ::first-line, ::selection, ecc.


### Selettori specifici di Playwright:

#### text=: Seleziona un elemento che contiene esattamente il testo specificato.

`'text=Invia modulo'`


#### has-text=: Seleziona un elemento che contiene il testo specificato.

`'button:has-text("Invia")'`


#### xpath=: Seleziona un elemento utilizzando un'espressione XPath.

`'xpath=//button[contains(text(), "Invia")]'`


#### css=: Seleziona un elemento utilizzando un selettore CSS (opzionale, poiché i selettori CSS sono il comportamento predefinito).

`'css=button.submit-button'`


#### :visible: Seleziona un elemento che è visibile sulla pagina.

`'button:visible'`


#### :has(selector): Seleziona un elemento che contiene un discendente corrispondente al selettore specificato.

`'div:has(button.submit-button)'`


#### :is(selector1, selector2, ...): Seleziona un elemento che corrisponde a uno dei selettori specificati.

`':is(button, a)[href="/submit"]'`

### Generazione di report

Dopo l'esecuzione dei test, il framework genera automaticamente report in diversi formati:

- Report in formato PDF: Viene generata una cartella chiamata `PDFReports` contenente i file PDF ordinati per progetto e test, con la reportistica degli step eseguiti.

- Backup dei file di traccia: Viene generata una cartella chiamata `TracesReport` contenente tutti i file di traccia generati dai test.

## Esecuzione di script

- Per generare il report di Allure e aprire la dashboard e il programma di visualizzazione delle tracce, esegui: `npm run allure`

- Per aprire il programma di visualizzazione delle tracce, esegui: `npm run trace`

## Contributi

Sono benvenuti contributi al progetto! Se desideri contribuire, segui questi passaggi:

1. Forka il repository
2. Crea un nuovo branch per la tua funzionalità o correzione di bug
3. Effettua le modifiche necessarie
4. Invia una pull request con una descrizione dettagliata delle modifiche apportate

## Licenza
Questo progetto è rilasciato sotto la licenza [MIT](https://opensource.org/licenses/MIT).