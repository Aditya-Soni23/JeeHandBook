import coverShowcaseImg from '../assets/images/jee_handbook_cover_showcase_1793626040990.jpg';
import bindingsLineupImg from '../assets/images/jee_handbook_bindings_lineup_1793626042146.jpg';
import openSpreadImg from '../assets/images/jee_handbook_open_spread_1793626042152.jpg';
import editorialStudyImg from '../assets/images/jee_handbook_editorial_study_1793626042139.jpg';
import qrImg from '../assets/images/qr.jpeg';
import logoImg from '../assets/images/logo.png';

export const ASSETS = {
  coverShowcase: coverShowcaseImg,
  bindingsLineup: bindingsLineupImg,
  openSpread: openSpreadImg,
  editorialStudy: editorialStudyImg,
  qrImage: qrImg,
  logoImage: logoImg,
  fullHandbookPdf: `${import.meta.env.BASE_URL}samples/Diamond Hand Book.pdf`
};

export const BRANDING = {
  brandName: "DIAMOND",
  brandWordmark: "DIAMOND",
  logoPath: logoImg,
  websiteTitle: "DIAMOND JEE HANDBOOK",
  websiteDescription: "289-page physics, chemistry & mathematics formula and shortcut handbook for JEE Main & Advanced aspirants.",
  contactEmail: "adityasonihyderabad@gmail.com",
  adminEmail: "adityasonihyderabad@gmail.com",
  contactPhone: "+91 9154995314",
  whatsappNumber: "919154995314",
  whatsappLink: "https://wa.me/919154995314?text=Hi%20Aditya,%20I%20have%20a%20query%20about%20the%20DIAMOND%20JEE%20Handbook",
  operatingAddress: "Hyderabad, Telangana, India",
  footerCopyright: "© 2026 DIAMOND JEE HANDBOOK. All rights reserved.",
  deliveryNotice: {
    physical: "Estimated delivery: 10 working days via Speed Post / Express Courier.",
    digital: "Digital Edition manual verification: around 2–3 days (often within hours).",
    help: "If not received within this timeline, email adityasonihyderabad@gmail.com or WhatsApp message us directly at +91 9154995314."
  }
};

export const UPI_SETTINGS = {
  upiId: "9154995314@fam",
  payeeName: "Aditya Soni (DIAMOND)",
  qrImagePath: qrImg,
  instructions: "Scan the official FamPay QR code below using PhonePe, GPay, Paytm, BHIM or FamPay. Pay exact amount and enter your 12-digit UTR reference number below for manual administrator confirmation."
};

export const CREATION_INFO = {
  headline: "Crafted from Physics Wallah Resources • Supercharged with Frontier AI",
  badgeText: "PW Resources × ChatGPT · Claude · Gemini · Antigravity",
  story: "This handbook was meticulously curated from Physics Wallah foundational resources and transformed into a high-density, 289-page revision powerhouse using cutting-edge AI (ChatGPT, Claude, Gemini, and Google Antigravity) by the author.",
  creatorNote: "Crafted by an aspirant for aspirants — every single formula, shortcut, and concept was analyzed with multi-AI validation to eliminate repetitive padding and spotlight the exact tricks and traps tested in JEE Main & Advanced.",
  pillars: [
    {
      title: "Physics Wallah Foundation",
      desc: "Built on trusted, battle-tested concepts, key formulas, and lecture breakdowns from India's most beloved educators at Physics Wallah."
    },
    {
      title: "Frontier AI Synthesis",
      desc: "Distilled, checked for mathematical consistency, and optimized using ChatGPT, Claude, Gemini, and Google Antigravity to retain zero fluff."
    },
    {
      title: "Human Curation & Verification",
      desc: "Personally reviewed, structured, and typeset to ensure high-density readability, accurate units, and rapid exam-day recall."
    },
    {
      title: "Radically Affordable (₹30)",
      desc: "Full 289-page Digital Edition kept at just ₹30 so high-quality revision is accessible to every single aspirant across India."
    }
  ]
};

// Fixed prices - no discounts
export const FIXED_PRICES = {
  digital: 30, // Rs. 30
  spiral: 449, // Rs. 449
  softcover: 499, // Rs. 499
  hardcover: 649 // Rs. 649
};

export const PRODUCT_SPECS = {
  pages: "289 Pages",
  format: "A4 Standard (210 × 297 mm)",
  paper: "75 GSM Bright White (Highlighter Bleed-Proof)",
  printing: "Double-Sided Sharp Monochrome Text & Diagrams",
  cover: "350 GSM High-Gloss Laminated Color Cover",
  bindings: [
    {
      id: "spiral",
      name: "Spiral Binding",
      description: "Twin-loop metal coil. Lays 100% flat on desk for note-making.",
      price: FIXED_PRICES.spiral
    },
    {
      id: "softcover",
      name: "Soft Cover Paperback",
      description: "Perfect-bound paperback with reinforced spine. Lightweight and portable.",
      price: FIXED_PRICES.softcover
    },
    {
      id: "hardcover",
      name: "Hard Cover Deluxe",
      description: "Case-bound rigid hardback with protective lamination. Maximum durability.",
      price: FIXED_PRICES.hardcover
    }
  ]
};

// Two free sample PDFs as requested
export const FREE_SAMPLES = [
  {
    title: "Wave Optics",
    filename: "wave optics.pdf",
    url: "/samples/wave-optics.pdf",
    description: "Young's Double Slit Experiment, Diffraction, Polarization & High-Yield Formulas"
  },
  {
    title: "Modern Physics",
    filename: "modern physics.pdf",
    url: "/samples/modern-physics.pdf",
    description: "Photoelectric Effect, Bohr's Model, De Broglie Wavelength, Radioactivity & Nuclear Physics"
  }
];

// No fake reviews - start empty for real verified buyers only
export const INITIAL_REVIEWS: any[] = [];

export const INITIAL_CHAPTERS = [
  {
    subject: "Physics",
    chapters: [
      { num: "01", title: "Units, Dimensions & Errors", pages: "1–14" },
      { num: "02", title: "Kinematics 1D & 2D", pages: "15–38" },
      { num: "03", title: "Newton's Laws & Friction", pages: "39–62" },
      { num: "04", title: "Work, Power & Energy", pages: "63–83" },
      { num: "05", title: "Center of Mass & Collisions", pages: "84–102" },
      { num: "06", title: "Rotational Dynamics & Inertia", pages: "103–128" },
      { num: "07", title: "Gravitation & Kepler Laws", pages: "129–144" },
      { num: "08", title: "Mechanical Properties of Fluids", pages: "145–164" },
      { num: "09", title: "Thermodynamics & Heat", pages: "165–188" },
      { num: "10", title: "Wave Optics (Sample Available)", pages: "189–214" },
      { num: "11", title: "Electrostatics & Capacitors", pages: "215–248" },
      { num: "12", title: "Modern Physics (Sample Available)", pages: "249–289" }
    ]
  },
  {
    subject: "Chemistry",
    chapters: [
      { num: "01", title: "Atomic Structure & Quantum", pages: "1–25" },
      { num: "02", title: "Chemical Bonding & Molecular Orbitals", pages: "26–50" },
      { num: "03", title: "Thermodynamics & Enthalpy", pages: "51–75" },
      { num: "04", title: "Equilibrium & Solutions", pages: "76–100" },
      { num: "05", title: "General Organic Chemistry", pages: "101–150" },
      { num: "06", title: "Coordination Compounds", pages: "151–190" }
    ]
  },
  {
    subject: "Mathematics",
    chapters: [
      { num: "01", title: "Complex Numbers & Quadratics", pages: "1–35" },
      { num: "02", title: "Matrices & Determinants", pages: "36–65" },
      { num: "03", title: "Differential Calculus & Limits", pages: "66–110" },
      { num: "04", title: "Integral Calculus & Areas", pages: "111–150" },
      { num: "05", title: "Coordinate Conics: Circles, Parabola, Ellipse", pages: "151–200" },
      { num: "06", title: "Vectors & 3D Geometry", pages: "201–245" },
      { num: "07", title: "Probability & Permutations", pages: "246–289" }
    ]
  }
];
