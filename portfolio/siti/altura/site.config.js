/* Altura — studio di riferimento (replica del video). Le immagini vengono dalla registrazione:
   usare solo come esempio interno, non nel portfolio pubblico. */
window.SITE = {
  lang: "en",
  title: "Altura Casa Pietra",
  description: "Architect-led homes on the California coast, shown privately with every cost on the table.",

  theme: {
    page: "#0f0f10",
    skyTop: "#0e2e6c",
    skyMid: "#1b4ea4",
    ground: "#1a2430",
    stage: "#1a1612",
    menu: "rgba(40, 70, 140, 0.45)",
    chip: "rgba(120, 150, 220, 0.24)",
    chipHover: "rgba(150, 175, 235, 0.34)",
    accent: "#f3a55a",
    display: "Poppins",
    displayWeight: 500,
  },

  brand: { name: "Altura", wordmark: "altura" },
  nav: { items: [{ label: "Residences" }, { label: "Buy" }, { label: "Rent" }, { label: "Sell with us" }], active: 0 },
  cta: { label: "Book a viewing", href: "#closing" },
  chips: [
    { n: "01", label: "Villas", meta: "23 homes" },
    { n: "02", label: "Penthouses", meta: "9 homes" },
    { n: "03", label: "Estates", meta: "14 homes" },
  ],

  hero: {
    image: { src: "assets/hero-bg.webp", width: 1160, height: 864, alt: "Casa Pietra at dusk, Laguna Beach" },
    foreground: { src: "assets/hero-fg.webp", top: 140, height: 330 },
    // wordmark in photo pixels (fitted on the recording)
    word: { x: 70, baseline: 418, size: 346, stretch: 1.02, tracking: -0.0231 },
    roofY: 380,
    parallax: 0.4,
  },

  card: {
    kicker: "Now showing",
    title: "Casa Pietra",
    place: "Laguna Beach, California",
    specs: ["5 bed", "6 bath", "6,420 sq ft"],
    price: "$11,850,000",
    link: { label: "View residence" },
  },

  intro: {
    text: "Architect-led homes on the California coast, shown privately with every cost on the table before you fall for the view.",
    link: { label: "Explore residences" },
  },

  tour: {
    label: "Casa Pietra — walkthrough",
    playLabel: "Play the walkthrough",
    height: "820vh",
    frames: { count: 245, path: "assets/tour/", ext: "webp", digits: 3, width: 1154, height: 856 },
    // crop focal point on narrow (portrait) screens: [tour progress, x 0–1]
    focus: [[0, 0.5], [0.24, 0.58], [0.4, 0.5], [0.53, 0.47], [0.68, 0.5], [0.82, 0.62]],
    chapters: [
      {
        align: "center",
        size: "xl",
        y: 358,
        kicker: "Altura — Now showing",
        title: "Casa Pietra",
        sub: "Laguna Beach, in one continuous take. Scroll to step inside.",
        play: true,
        range: [-1, -1, 0.057, 0.094],
      },
      { align: "left", y: 226, kicker: "01 / Living", title: "The living\nroom", sub: "Where the pool comes indoors.", range: [0.205, 0.242, 0.352, 0.389] },
      { align: "right", y: 242, kicker: "02 / Dining", title: "The dining\nroom", sub: "Long oak table, paper lanterns overhead.", range: [0.488, 0.529, 0.635, 0.684] },
      { align: "left", y: 627, kicker: "03 / Kitchen", title: "The kitchen", sub: "Honed stone and oak, nothing on show.", range: [0.77, 0.824, 2, 2] },
    ],
  },

  closing: {
    kicker: "Private viewings · By appointment",
    title: "See Casa Pietra\nin person.",
    cta: { label: "Watch the walkthrough", href: "#tour" },
  },
  footer: { left: "© 2026 Altura", right: "Laguna Beach · Malibu · Montecito" },
};
