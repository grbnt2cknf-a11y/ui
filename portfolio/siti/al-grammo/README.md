# Al Grammo — sito "la bilancia"

Ristorante fast casual fit in viale Pindaro, Pescara (dati dal business plan del cliente).
Pagina statica: `index.html`, `style.css`, `main.js`, immagini in `img/`. Nessuna libreria.

Cinque momenti:
1. **Hero**: foto con la scritta "AL GRAMMO" (stampatello condensato) dietro la bowl e la sua ombra
   sul muro, che segue il cursore, si allunga scorrendo e oscilla piano; il display della bilancia
   è disegnato in codice e "si assesta" su 350 g come una bilancia vera.
2. **La prova del peso**: un video vero (mirtilli versati nella ciotola sulla bilancia) che avanza
   con lo scroll, 96 fotogrammi in `img/pesata/`. Il display a LED della bilancia sfarfalla nelle
   registrazioni, quindi le cifre sono state cancellate da ogni fotogramma (`tools/pour_frames.py`)
   e vengono ridisegnate sulla pagina; seguono le letture vere del video: 0, 5, 40, 46, 49, 62 g.
   Il monitor accanto mostra grammi, calorie, macro e prezzo in sincrono.
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
- **Video della bilancia**: è la registrazione dello schermo di un video trovato online, quindi
  vale come per le foto: da rifare con un video vostro. I mirtilli non sono tra gli ingredienti
  del menu; il prezzo usa quello del mix di frutta (150 g a 4,00 €) ed è da confermare. Valori
  nutrizionali: mirtilli freschi, 57 kcal, 0,74 g proteine, 14,5 g carboidrati, 0,33 g grassi
  ogni 100 g.

## Vederlo in locale
```bash
cd portfolio && python3 -m http.server 8770
# http://localhost:8770/siti/al-grammo/
```
