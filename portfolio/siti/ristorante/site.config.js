/* Settore: ristorante.
   Quando arrivano le immagini: hero.image / hero.foreground / tour.frames (vedi ../../README.md). */
window.SITE = {
  lang: "it",
  title: "Brace Milano",
  description: "Cucina sul fuoco in via Tortona: forno a legna, filiera corta, cotture lente.",

  theme: {
    page: "#0e0b0a",
    skyTop: "#1c0f0a",
    skyMid: "#6a3018",
    ground: "#1e1410",
    stage: "#1a120d",
    menu: "rgba(90, 45, 22, 0.5)",
    chip: "rgba(255, 150, 90, 0.18)",
    chipHover: "rgba(255, 170, 110, 0.28)",
    accent: "#ff8a4c",
  },

  brand: { name: "Brace", wordmark: "brace" },
  nav: { items: [{ label: "Menu" }, { label: "Prenota" }, { label: "Eventi" }, { label: "Chi siamo" }], active: 0 },
  cta: { label: "Prenota un tavolo", href: "#closing" },
  chips: [
    { n: "01", label: "Pranzo", meta: "12–15" },
    { n: "02", label: "Cena", meta: "19–23" },
    { n: "03", label: "Degustazione", meta: "7 portate" },
  ],

  hero: {
    image: null,
    foreground: null,
    word: { fit: 0.86, baseline: 418, stretch: 1.02, tracking: -0.0231 }, // fit = larghezza della scritta / larghezza foto
  },

  card: {
    kicker: "Stasera",
    title: "Menu del fuoco",
    place: "Via Tortona 18, Milano",
    specs: ["7 portate", "2 ore", "Vini abbinati"],
    price: "€ 85 a persona",
    link: { label: "Vedi il menu" },
  },

  intro: {
    text: "Una cucina a vista costruita attorno a un forno a legna. Prodotti di filiera corta, cotture lente, nessuna fretta.",
    link: { label: "Scopri la cucina" },
  },

  tour: {
    label: "Brace — la sala",
    playLabel: "Avvia il tour",
    height: "820vh",
    frames: null,
    chapters: [
      {
        align: "center",
        size: "xl",
        y: 358,
        kicker: "Brace — Stasera",
        title: "Brace Milano",
        sub: "Dalla porta al forno, in un'unica ripresa. Scorri per sederti.",
        play: true,
        range: [-1, -1, 0.057, 0.094],
      },
      { align: "left", y: 226, kicker: "01 / Sala", title: "La\nsala", sub: "Venti coperti, luce bassa.", range: [0.205, 0.242, 0.352, 0.389] },
      { align: "right", y: 242, kicker: "02 / Banco", title: "Il\nbancone", sub: "Cocktail al tramonto, vini naturali.", range: [0.488, 0.529, 0.635, 0.684] },
      { align: "left", y: 627, kicker: "03 / Cucina", title: "Il forno", sub: "Resta acceso tutta la sera.", range: [0.77, 0.824, 2, 2] },
    ],
  },

  closing: {
    kicker: "Martedì – Domenica · Su prenotazione",
    title: "Ti teniamo\nun posto al banco.",
    cta: { label: "Rivedi il tour", href: "#tour" },
  },
  footer: { left: "© 2026 Brace", right: "Via Tortona 18 · Milano" },
};
