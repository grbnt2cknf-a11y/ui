/* Settore: hotel / boutique hotel.
   Quando arrivano le immagini: hero.image / hero.foreground / tour.frames (vedi ../../README.md). */
window.SITE = {
  lang: "it",
  title: "Albe Bellagio",
  description: "Ventiquattro camere sul Lago di Como, spa e terrazza sull'acqua.",

  theme: {
    page: "#0f1114",
    skyTop: "#1d2944",
    skyMid: "#5873a0",
    ground: "#1b2027",
    stage: "#1c1d22",
    menu: "rgba(45, 60, 95, 0.45)",
    chip: "rgba(160, 180, 215, 0.22)",
    chipHover: "rgba(180, 198, 228, 0.32)",
    accent: "#e9bb8c",
  },

  brand: { name: "Albe", wordmark: "albe" },
  nav: { items: [{ label: "Camere" }, { label: "Spa" }, { label: "Ristorante" }, { label: "Offerte" }], active: 0 },
  cta: { label: "Prenota il soggiorno", href: "#closing" },
  chips: [
    { n: "01", label: "Camere", meta: "24" },
    { n: "02", label: "Suite", meta: "6" },
    { n: "03", label: "Spa", meta: "1.200 m²" },
  ],

  hero: {
    image: null,
    foreground: null,
    word: { fit: 0.86, baseline: 418, stretch: 1.02, tracking: -0.0231 }, // fit = larghezza della scritta / larghezza foto
  },

  card: {
    kicker: "Questa settimana",
    title: "Suite Lago",
    place: "Bellagio, Lago di Como",
    specs: ["2 ospiti", "48 m²", "Terrazza"],
    price: "da € 690 a notte",
    link: { label: "Vedi la suite" },
  },

  intro: {
    text: "Un albergo di ventiquattro camere sull'acqua, dove la colazione si serve fino a mezzogiorno e il lago fa il resto.",
    link: { label: "Scopri le camere" },
  },

  tour: {
    label: "Albe — il tour",
    playLabel: "Avvia il tour",
    height: "820vh",
    frames: null,
    chapters: [
      {
        align: "center",
        size: "xl",
        y: 358,
        kicker: "Albe — Bellagio",
        title: "Suite Lago",
        sub: "Dalla hall alla terrazza, in un'unica ripresa. Scorri per entrare.",
        play: true,
        range: [-1, -1, 0.057, 0.094],
      },
      { align: "left", y: 226, kicker: "01 / Arrivo", title: "La\nhall", sub: "Pietra di Moltrasio e noce.", range: [0.205, 0.242, 0.352, 0.389] },
      { align: "right", y: 242, kicker: "02 / Camera", title: "La\nsuite", sub: "Il letto guarda il lago.", range: [0.488, 0.529, 0.635, 0.684] },
      { align: "left", y: 627, kicker: "03 / Terrazza", title: "La terrazza", sub: "In luglio il sole cala alle 21:10.", range: [0.77, 0.824, 2, 2] },
    ],
  },

  closing: {
    kicker: "Aperto da aprile a ottobre",
    title: "La tua camera\nsul lago.",
    cta: { label: "Rivedi il tour", href: "#tour" },
  },
  footer: { left: "© 2026 Albe", right: "Bellagio · Lago di Como" },
};
