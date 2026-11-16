/* Settore: concessionaria / showroom auto.
   Quando arrivano le immagini: hero.image / hero.foreground / tour.frames (vedi ../../README.md). */
window.SITE = {
  lang: "it",
  title: "Linea GT Elettrica",
  description: "Auto selezionate e consegnate a mano, con il prezzo finale scritto prima del test drive.",

  theme: {
    page: "#0b0c0f",
    skyTop: "#0c0f16",
    skyMid: "#2c3446",
    ground: "#15171c",
    stage: "#141518",
    menu: "rgba(60, 66, 82, 0.5)",
    chip: "rgba(190, 196, 210, 0.16)",
    chipHover: "rgba(210, 214, 226, 0.26)",
    accent: "#e2b45c",
  },

  brand: { name: "Linea", wordmark: "linea" },
  nav: { items: [{ label: "Modelli" }, { label: "Usato garantito" }, { label: "Officina" }, { label: "Contatti" }], active: 0 },
  cta: { label: "Prenota un test drive", href: "#closing" },
  chips: [
    { n: "01", label: "Elettriche", meta: "12 modelli" },
    { n: "02", label: "Sportive", meta: "6 modelli" },
    { n: "03", label: "SUV", meta: "9 modelli" },
  ],

  hero: {
    image: null,
    foreground: null,
    word: { fit: 0.86, baseline: 418, stretch: 1.02, tracking: -0.0231 }, // fit = larghezza della scritta / larghezza foto
  },

  card: {
    kicker: "In showroom",
    title: "GT Elettrica",
    place: "Showroom di Torino",
    specs: ["0–100 in 3,4 s", "610 km", "2+2 posti"],
    price: "da € 129.000",
    link: { label: "Configura" },
  },

  intro: {
    text: "Auto selezionate e consegnate a mano, con il prezzo finale scritto prima del test drive.",
    link: { label: "Scopri i modelli" },
  },

  tour: {
    label: "GT Elettrica — il tour",
    playLabel: "Avvia il tour",
    height: "820vh",
    frames: null,
    chapters: [
      {
        align: "center",
        size: "xl",
        y: 358,
        kicker: "Linea — In showroom",
        title: "GT Elettrica",
        sub: "Dal profilo all'abitacolo, in un'unica ripresa. Scorri per salire.",
        play: true,
        range: [-1, -1, 0.057, 0.094],
      },
      { align: "left", y: 226, kicker: "01 / Esterni", title: "Il\nprofilo", sub: "Una sola linea, dal muso alla coda.", range: [0.205, 0.242, 0.352, 0.389] },
      { align: "right", y: 242, kicker: "02 / Abitacolo", title: "L'abitacolo", sub: "Pelle naturale, comandi fisici.", range: [0.488, 0.529, 0.635, 0.684] },
      { align: "left", y: 627, kicker: "03 / Dettagli", title: "I dettagli", sub: "Cerchi forgiati da 21 pollici.", range: [0.77, 0.824, 2, 2] },
    ],
  },

  closing: {
    kicker: "Test drive su appuntamento",
    title: "Guidala prima\ndi decidere.",
    cta: { label: "Rivedi il tour", href: "#tour" },
  },
  footer: { left: "© 2026 Linea Automobili", right: "Torino · Milano" },
};
