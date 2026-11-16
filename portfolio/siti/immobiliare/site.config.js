/* Settore: immobiliare di lusso.
   Quando arrivano le immagini: hero.image / hero.foreground / tour.frames (vedi ../../README.md). */
window.SITE = {
  lang: "it",
  title: "Dimora Villa Corallo",
  description: "Ville d'autore in Costa Smeralda, mostrate in privato con ogni costo chiaro.",

  theme: {
    page: "#0f0f10",
    skyTop: "#0d2a5c",
    skyMid: "#2a5aa8",
    ground: "#18222c",
    stage: "#1a1612",
    menu: "rgba(40, 70, 140, 0.45)",
    chip: "rgba(120, 150, 220, 0.24)",
    chipHover: "rgba(150, 175, 235, 0.34)",
    accent: "#f0a868",
  },

  brand: { name: "Dimora", wordmark: "dimora" },
  nav: { items: [{ label: "Residenze" }, { label: "Compra" }, { label: "Affitta" }, { label: "Vendi con noi" }], active: 0 },
  cta: { label: "Prenota una visita", href: "#closing" },
  chips: [
    { n: "01", label: "Ville", meta: "18 immobili" },
    { n: "02", label: "Attici", meta: "7 immobili" },
    { n: "03", label: "Tenute", meta: "5 immobili" },
  ],

  hero: {
    image: null, // es. { src: "assets/hero-bg.webp", width: 1600, height: 1200, alt: "Villa Corallo al tramonto" }
    foreground: null, // es. { src: "assets/hero-fg.webp", top: 180, height: 460 }
    word: { fit: 0.86, baseline: 418, stretch: 1.02, tracking: -0.0231 }, // fit = larghezza della scritta / larghezza foto
  },

  card: {
    kicker: "In evidenza",
    title: "Villa Corallo",
    place: "Porto Cervo, Sardegna",
    specs: ["6 camere", "5 bagni", "540 m²"],
    price: "€ 6.900.000",
    link: { label: "Vedi la villa" },
  },

  intro: {
    text: "Ville d'autore in Costa Smeralda, mostrate in privato e con ogni costo sul tavolo prima che ti innamori della vista.",
    link: { label: "Scopri le residenze" },
  },

  tour: {
    label: "Villa Corallo — il tour",
    playLabel: "Avvia il tour",
    height: "820vh",
    frames: null, // es. { count: 240, path: "assets/tour/", ext: "webp", digits: 3 }
    chapters: [
      {
        align: "center",
        size: "xl",
        y: 358,
        kicker: "Dimora — In evidenza",
        title: "Villa Corallo",
        sub: "Porto Cervo, in un'unica ripresa. Scorri per entrare.",
        play: true,
        range: [-1, -1, 0.057, 0.094],
      },
      { align: "left", y: 226, kicker: "01 / Soggiorno", title: "Il\nsoggiorno", sub: "Il mare entra dalle vetrate.", range: [0.205, 0.242, 0.352, 0.389] },
      { align: "right", y: 242, kicker: "02 / Pranzo", title: "La sala\nda pranzo", sub: "Tavolo in rovere, dodici posti.", range: [0.488, 0.529, 0.635, 0.684] },
      { align: "left", y: 627, kicker: "03 / Cucina", title: "La cucina", sub: "Pietra levigata, niente in vista.", range: [0.77, 0.824, 2, 2] },
    ],
  },

  closing: {
    kicker: "Visite private · Su appuntamento",
    title: "Vieni a vedere\nVilla Corallo.",
    cta: { label: "Rivedi il tour", href: "#tour" },
  },
  footer: { left: "© 2026 Dimora", right: "Porto Cervo · Capri · Forte dei Marmi" },
};
