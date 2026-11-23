# Al Grammo — sito

Ristorante fast casual fit in viale Pindaro, Pescara (dati dal business plan del cliente).
Pagina statica: `index.html`, `style.css`, `main.js`, immagini in `img/`. Nessuna libreria.

Cinque momenti:
1. **Hero**: foto con il nome "AL GRAMMO" in primo piano (stampatello condensato) e un riflesso
   sfumato sotto le lettere; il display della bilancia è disegnato in codice e "si assesta" su
   350 g come una bilancia vera.
2. **Come funziona**: sezione statica, senza animazioni. Tre passi (scegli, leggi, controlla) e lo
   scontrino di esempio del business plan: pasta 160 g, pollo 150 g, peperoni 100 g, salsa 20 g,
   in totale 430 g, 553 kcal, 10,48 €.
3. **Bowl pronte**: Green, Protein, Mare, con macro e prezzi del menu.
4. **Prezzi a peso**: fasce verde, gialla e rossa.
5. **Dove siamo**: indirizzo, orari, modi di ordinare.

## Da sostituire prima di pubblicare
- Dati tra parentesi quadre: civico, partita IVA, Instagram, telefono.
- **Foto**: sono prese da Pinterest e stock (pasta, peperoni e salsa con filigrana Adobe Stock,
  bowl Mare da Freepik, marchio Etekcity rimosso dalla bilancia della foto principale). Vanno
  bene per una bozza, non per il sito pubblico o le sponsorizzate: servono foto con licenza,
  generate con l'AI o scattate nel locale.
- Le ricette delle bowl nel testo vengono dal business plan; le foto mostrano bowl simili, non
  identiche.

## Vederlo in locale
```bash
cd portfolio && python3 -m http.server 8770
# http://localhost:8770/siti/al-grammo/
```
