# Prompt per generare foto e video dei siti

Ogni sito ha bisogno di due materiali, generati da voi con un tool AI di immagini e di video.
Così i diritti sono vostri e il contenuto è originale.

1. **Foto hero**: il soggetto (edificio, locale, auto) che si staglia contro un cielo o uno
   sfondo pulito. Serve per l'effetto "nome dietro il soggetto".
2. **Video fly-through**: un'unica ripresa continua che entra nel soggetto e si ferma quasi
   del tutto su 3 punti (i capitoli del sito).

## Regole valide per tutti

**Foto hero**
- Formato 4:3 orizzontale (es. 1600×1200) o 16:9, almeno 1600 px di larghezza.
- Il terzo superiore deve essere **cielo o sfondo uniforme**: lì andrà il nome gigante.
- Il bordo superiore del soggetto (tetto, insegna, profilo dell'auto) deve essere netto, a circa
  metà altezza. È la linea dietro cui "scompare" la parte bassa delle lettere.
- Niente testo, loghi o watermark nell'immagine.

**Video**
- 16:9 o 4:3, almeno 1080p (meglio 4K), 24 o 30 fps, 10–15 secondi.
- **Una sola ripresa continua**, senza tagli: camera su carrello o drone stabilizzato, movimento
  lento in avanti.
- **3 soste**: in tre punti la camera rallenta fin quasi a fermarsi per circa 1,5 s. Lì il sito
  mostra i titoli dei capitoli.
- Primo fotogramma uguale (o molto simile) alla foto hero: usate la foto come immagine di
  partenza ("image to video"), così il passaggio dall'hero al tour è coerente.
- Niente testo, persone in primo piano, loghi o watermark. Illuminazione stabile (ora blu o sera).

**Consegna**: mettete foto e video nella cartella del sito (`siti/<nome>/sorgenti/`) e ditemi
quale sito è. Penso io a estrarre i fotogrammi, ritagliare il soggetto e collegare tutto.

---

## Immobiliare — "Dimora", Villa Corallo (Porto Cervo)

**Foto hero**
```
Architectural photograph of a contemporary luxury villa on the Costa Smeralda coast at blue hour,
low wide-angle shot from the garden, flat white roof line crossing the middle of the frame,
large glass walls glowing with warm interior light, infinity pool in the foreground reflecting the
house, Mediterranean scrub and olive trees at the sides, the upper third of the frame is a clean
deep-blue twilight sky with no clouds, photorealistic, 35mm, high dynamic range, no people, no text
```

**Video** (image-to-video partendo dalla foto hero)
```
One continuous cinematic dolly shot, no cuts. Start on the villa exterior at blue hour, glide slowly
forward across the terrace and through the open glass doors. Slow down and nearly stop in the living
room (sofa, stone coffee table, sea view through floor-to-ceiling windows), hold 1.5 seconds. Continue
smoothly into the dining room (long oak table, paper lantern pendants), slow down and hold 1.5 seconds.
Continue into the kitchen (stone island, oak cabinets, warm under-cabinet lights), slow down and hold
until the end. Stable gimbal movement, constant warm interior lighting, photorealistic, no people,
no text, 24fps
```
Capitoli: Soggiorno → Sala da pranzo → Cucina.

---

## Ristorante — "Brace" (Milano)

**Foto hero**
```
Exterior of an intimate modern Italian restaurant at dusk in a Milan courtyard, low angle, a single-storey
brick and steel pavilion with a flat roof line across the middle of the frame, tall glass windows showing
a warm dining room and the glow of a wood-fired oven, a few outdoor tables with candles in the foreground,
the upper third is a clean dark-orange to deep-blue twilight sky, photorealistic, 35mm, no people, no text,
no signage
```

**Video**
```
One continuous cinematic dolly shot, no cuts. Start outside the restaurant at dusk, move slowly through
the entrance into the dining room. Slow down and nearly stop on the dining room (about twenty seats,
low warm lights, linen tablecloths), hold 1.5 seconds. Continue smoothly to the bar counter (bottles
backlit, cocktail glasses), slow down and hold 1.5 seconds. Continue into the open kitchen and end on the
wood-fired oven with visible flames, slow down and hold until the end. Stable gimbal, warm firelight,
shallow depth of field, photorealistic, no people, no text, 24fps
```
Capitoli: Sala → Bancone → Forno.

---

## Hotel — "Albe" (Bellagio, Lago di Como)

**Foto hero**
```
Boutique lakeside hotel on Lake Como at blue hour, seen from a stone jetty, an elegant three-storey
villa with a straight cornice roof line across the middle of the frame, warm light in the windows,
the calm lake in the foreground reflecting the facade, mountains faint in the distance below the roof
line, the upper third is a clean soft-blue twilight sky, photorealistic, 35mm, no people, no text
```

**Video**
```
One continuous cinematic dolly shot, no cuts. Start on the hotel facade from the jetty, glide forward
through the main door into the lobby. Slow down and nearly stop in the lobby (Moltrasio stone floor,
walnut reception desk, soft lamps), hold 1.5 seconds. Continue up into a suite, slow down and hold
1.5 seconds on the bed facing tall windows with the lake view. Continue through the open French doors
onto the terrace overlooking the lake at sunset, slow down and hold until the end. Stable gimbal, calm
warm lighting, photorealistic, no people, no text, 24fps
```
Capitoli: Hall → Suite → Terrazza.

---

## Auto — "Linea", GT Elettrica (Torino)

**Foto hero**
```
A sleek two-door electric grand tourer parked on polished concrete in front of a minimal glass
showroom at dusk, low three-quarter front view, the car roof line sits in the middle of the frame,
soft reflections on the bodywork, warm interior light from the showroom behind, the upper third is a
clean dark-blue gradient sky, photorealistic automotive photography, no badges, no logos, no license
plate, no text
```

**Video**
```
One continuous cinematic camera move, no cuts. Start on the low three-quarter front view of the car at
dusk, slowly orbit along the side profile, slow down and nearly stop on the full side profile, hold
1.5 seconds. Continue to the open driver door and move inside the cabin, slow down and hold 1.5 seconds
on the dashboard and steering wheel (natural leather, physical buttons). Pull back out and end on a
close-up of the forged 21-inch wheel, slow down and hold until the end. Stable gimbal, studio-like
reflections, photorealistic, no badges, no logos, no people, no text, 24fps
```
Capitoli: Profilo → Abitacolo → Dettagli.

---

## Suggerimenti

- Se il tool non mantiene bene le soste, generate 3–4 clip brevi (una per tratto) partendo ogni
  volta dall'ultimo fotogramma della clip precedente, poi unitele: il risultato è una ripresa unica.
- Teniamo lo stesso orario di luce in foto e video, altrimenti il passaggio hero → tour stona.
- I nomi (Dimora, Brace, Albe, Linea) sono segnaposto: prima di sponsorizzare verificate che non
  coincidano con attività reali della stessa zona.
