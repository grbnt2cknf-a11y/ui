# Altura — replica del sito dal video

Replica statica (HTML + CSS + JS, nessuna dipendenza) della landing "Altura / Casa Pietra"
vista nella registrazione dello schermo.

## Avvio

```bash
cd sito-altura
python3 -m http.server 8765
# poi apri http://localhost:8765
```

Serve un server locale (non `file://`) perché le immagini del tour vengono caricate via JS.

## Struttura

| File | Cosa fa |
| --- | --- |
| `index.html` | markup: hero, tour a scorrimento, chiusura |
| `styles.css` | stile; i titoli del tour sono posizionati in "unità stage" misurate sul video |
| `main.js` | layout dell'hero (scritta dietro la casa), parallasse, sequenza di 245 fotogrammi su `<canvas>` guidata dallo scroll, dissolvenze con blur dei titoli |
| `assets/hero-bg.webp` | foto dell'hero ripulita (cielo ricostruito, senza UI) |
| `assets/hero-fg.webp` | solo casa e alberi con cielo trasparente: sta sopra la scritta "altura" |
| `assets/tour/000-244.webp` | fotogrammi del tour (ingresso → soggiorno → pranzo → cucina) |
| `tools/` | script Python/OpenCV usati per estrarre e ripulire le immagini dal video |

## Note

- Font: **Poppins 500** per il logo (fit sul video, IoU 0.97), **Inter 200** per i titoli,
  **Geist Mono** per le etichette, **Inter** per l'interfaccia.
- Le immagini vengono dalla registrazione (circa 1160 px di larghezza): su schermi grandi
  sono un po' morbide. Con il video sorgente in alta risoluzione basta rilanciare gli
  script in `tools/` per rigenerarle.
- Il video si ferma alla cucina, quindi il tour finisce lì. Dopo c'è una sezione di chiusura
  minimale ("Book a viewing") perché la pagina non si interrompa di colpo: nel video non si vede.
