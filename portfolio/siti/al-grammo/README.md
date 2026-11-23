# Al Grammo — sito "la bilancia"

Ristorante fast casual fit in viale Pindaro, Pescara (dati dal business plan del cliente).
Pagina statica: `index.html`, `style.css`, `main.js`, immagini in `img/`. Nessuna libreria.

Cinque momenti:
1. **Hero**: foto con la scritta "AL GRAMMO" (stampatello condensato) dietro la bowl e la sua ombra
   sul muro, che segue il cursore, si allunga scorrendo e oscilla piano; il display della bilancia
   è disegnato in codice e "si assesta" su 350 g come una bilancia vera.
2. **La prova del peso**: vista dall'alto, come una ripresa sopra il banco. Scorrendo, pasta, pollo,
   peperoni e salsa cadono nel piatto (si rimpiccioliscono avvicinandosi al piatto, l'ombra si
   stringe sotto di loro); bilancia e monitor contano grammi, calorie, macro e prezzo (esempio
   reale del business plan: 430 g, 553 kcal, 10,48 €). Gli ingredienti sono foto dall'alto,
   quindi vanno mostrati dall'alto: inclinandoli sembravano adesivi.
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
