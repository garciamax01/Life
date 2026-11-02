import { useState, useMemo, useEffect, useRef } from "react";

// Data preserved from Max's original classroom calculator. Prices are editable
// planning scenarios, not verified 2026 local averages or insurance quotes.
const C = {
  blue: "#2563eb",
  lightBlue: "#eff6ff",
  green: "#15803d",
  lightGreen: "#f0fdf4",
  amber: "#a85308",
  lightAmber: "#fffbeb",
  red: "#b91c1c",
  lightRed: "#fef2f2",
  ink: "#101b32",
  muted: "#5d6b82",
  line: "#e2e7ef",
  soft: "#f7f9fc",
};
const LOGO = "notebook-mark.png";
const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
const number = (n, limit = 10000000) =>
  Math.max(0, Math.min(limit, Number(n) || 0));
const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 650,
  color: C.ink,
  marginBottom: 8,
};
const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  background: "#fff",
  color: C.ink,
  fontSize: 15,
  fontFamily: "inherit",
  boxSizing: "border-box",
};
const eyebrow = {
  fontSize: 11,
  fontWeight: 750,
  letterSpacing: 2.1,
  color: C.muted,
  textTransform: "uppercase",
};
const divider = {
  border: 0,
  borderTop: `1px solid ${C.line}`,
  margin: "28px 0",
};
const PQ = [
  {
    q: "After school, what sounds most fun?",
    o: [
      { l: "Building or fixing things with tools", t: "R" },
      { l: "Solving puzzles or figuring out how things work", t: "I" },
      { l: "Making art, music, videos, or designs", t: "A" },
      { l: "Hanging out, helping people, community activities", t: "S" },
      { l: "Starting something, selling things, or leading", t: "E" },
    ],
  },
  {
    q: "Best work environment for you?",
    o: [
      { l: "Outdoors, a shop, or working with machines", t: "R" },
      { l: "A lab, tech setup, or quiet focused workspace", t: "I" },
      { l: "A creative studio with lots of freedom", t: "A" },
      { l: "A school, clinic, or somewhere I help people daily", t: "S" },
      { l: "An office, leading meetings, or running a team", t: "E" },
    ],
  },
  {
    q: "What are you naturally good at?",
    o: [
      { l: "Using my hands and solving physical problems", t: "R" },
      { l: "Math, science, research, or analyzing data", t: "I" },
      { l: "Creative ideas and making them look great", t: "A" },
      { l: "Listening, communicating, connecting with people", t: "S" },
      { l: "Convincing people, leading, spotting opportunities", t: "E" },
    ],
  },
  {
    q: "On a big group project, you usually...",
    o: [
      { l: "Handle the hands-on tasks nobody else wants", t: "R" },
      { l: "Research and figure out the best approach", t: "I" },
      { l: "Design the visuals or make the presentation pop", t: "A" },
      { l: "Keep the group together and boost morale", t: "S" },
      { l: "Take charge and delegate tasks", t: "E" },
    ],
  },
  {
    q: "What motivates you most?",
    o: [
      { l: "Seeing something I built or fixed with my hands", t: "R" },
      { l: "Figuring out something complex nobody else could", t: "I" },
      { l: "Creating something people think is cool or beautiful", t: "A" },
      { l: "Knowing I helped someone or made a difference", t: "S" },
      { l: "Earning money and building something of my own", t: "E" },
    ],
  },
  {
    q: "Which class sounds most like you?",
    o: [
      { l: "Auto shop, welding, construction, or PE", t: "R" },
      { l: "Biology, chemistry, math, or computer science", t: "I" },
      { l: "Art, photography, graphic design, or music", t: "A" },
      { l: "English, psychology, health, or peer counseling", t: "S" },
      { l: "Business, marketing, economics, or student government", t: "E" },
    ],
  },
];
const HOUSING = [
  {
    id: "family",
    l: "Live with Family",
    cost: 0,
    note: "Set your contribution toward costs at home",
    ins: null,
  },
  {
    id: "studio",
    l: "Studio Apartment",
    cost: 1350,
    note: "Classroom rent estimate; verify current listings",
    ins: "renters",
  },
  {
    id: "1br",
    l: "1-Bedroom Apartment",
    cost: 1600,
    note: "Classroom rent estimate",
    ins: "renters",
  },
  {
    id: "2br",
    l: "2-Bedroom Apartment",
    cost: 2100,
    note: "Classroom rent estimate",
    ins: "renters",
  },
  {
    id: "house_r",
    l: "Rent a House",
    cost: 2600,
    note: "Classroom rent estimate; utilities extra",
    ins: "renters",
  },
  {
    id: "house_o",
    l: "Own a Home",
    cost: 2151,
    note: "Example: $400k home, 20% down, 30 years at 7.1%",
    ins: "homeowners",
  },
];
const FIRE = [
  {
    id: "std",
    l: "Valley / Standard Area",
    sub: "Perris, Moreno Valley, Hemet valley floor",
    renters: 18,
    homeowners: 175,
  },
  {
    id: "mod",
    l: "Moderate Fire Risk Area",
    sub: "Foothills, eastern Hemet, canyon areas",
    renters: 28,
    homeowners: 280,
  },
  {
    id: "high",
    l: "High Fire Risk / Mountain Area",
    sub: "Idyllwild, mountain communities · premiums vary widely",
    renters: 45,
    homeowners: 540,
  },
];
const UTILS = [
  {
    id: "internet",
    l: "Internet",
    cost: 65,
    note: "Example internet plan; actual offers vary",
  },
  {
    id: "mobile",
    l: "Mobile Phone Plan",
    cost: 60,
    note: "Mid-tier · T-Mobile, Mint Mobile, etc.",
  },
  {
    id: "water_gas",
    l: "Water & Gas",
    cost: 115,
    note: "Example combined monthly bill",
  },
  {
    id: "electric",
    l: "Electricity",
    cost: 165,
    note: "Example electricity bill; usage and seasons vary",
  },
  {
    id: "stream",
    l: "Streaming Services",
    cost: 45,
    note: "Netflix + Spotify or similar combo",
  },
];
const FOOD = [
  {
    id: "home",
    l: "Cook at Home",
    cost: 350,
    note: "Groceries · Food4Less, Stater Bros, Smart & Final",
  },
  {
    id: "fast",
    l: "Mostly Fast Food",
    cost: 550,
    note: "Example food budget; meals and prices vary",
  },
  {
    id: "mix",
    l: "Mix of Home + Dining Out",
    cost: 650,
    note: "Balanced approach",
  },
  {
    id: "dine",
    l: "Mostly Restaurants",
    cost: 900,
    note: "Dining out most meals",
  },
];
const TRANS = [
  {
    id: "none",
    l: "Walk / Bike",
    cost: 0,
    note: "No vehicle costs",
    car: false,
  },
  {
    id: "transit",
    l: "Public Transit · RTA Bus",
    cost: 75,
    note: "Example transit budget; check current RTA fares",
    car: false,
  },
  {
    id: "beater",
    l: "Used Car · Older / High Miles",
    cost: 200,
    note: "Lower payment, higher repair risk",
    car: true,
    ct: "beater",
  },
  {
    id: "used",
    l: "Used Car · 3 to 5 Years",
    cost: 380,
    note: "Financed reliable used car",
    car: true,
    ct: "used",
  },
  {
    id: "new",
    l: "New Average Car",
    cost: 580,
    note: "New mid-range vehicle",
    car: true,
    ct: "new",
  },
  {
    id: "luxury",
    l: "Luxury or Sports Car",
    cost: 950,
    note: "New luxury/performance vehicle",
    car: true,
    ct: "luxury",
  },
];
const CINS = {
  beater: {
    cost: 138,
    note: "Example liability premium; lender may require more",
  },
  used: { cost: 168, note: "Example financed-car premium" },
  new: { cost: 198, note: "Example financed-car premium" },
  luxury: { cost: 290, note: "Example luxury-car premium" },
};
const CGAS = { beater: 190, used: 165, new: 145, luxury: 210 };
const HEALTH = [
  {
    id: "medi_cal",
    l: "Medi-Cal (Free)",
    cost: 0,
    note: "Income and household rules apply; eligibility is not automatic",
  },
  {
    id: "employer",
    l: "Employer Health Insurance",
    cost: 120,
    note: "Example employee premium; benefits vary",
  },
  {
    id: "bronze",
    l: "Covered CA · Bronze Plan",
    cost: 215,
    note: "Example premium; deductibles and subsidies vary",
  },
  {
    id: "silver",
    l: "Covered CA · Silver Plan",
    cost: 310,
    note: "Example premium; deductibles and subsidies vary",
  },
  {
    id: "premium",
    l: "Private Premium Plan",
    cost: 450,
    note: "Example premium; check the actual plan",
  },
];
const HADD = [
  {
    id: "vision",
    l: "Vision Coverage",
    cost: 25,
    note: "Eye exams, glasses or contacts",
  },
  {
    id: "dental",
    l: "Dental Coverage",
    cost: 30,
    note: "Cleanings, x-rays, basic procedures",
  },
];
const LEISURE = [
  {
    id: "gaming",
    l: "Gaming",
    cost: 50,
    note: "Console + games + online subs",
  },
  {
    id: "gym",
    l: "Gym Membership",
    cost: 40,
    note: "Planet Fitness, LA Fitness, etc.",
  },
  {
    id: "out",
    l: "Movies / Going Out",
    cost: 60,
    note: "Avg monthly entertainment outings",
  },
  {
    id: "outdoor",
    l: "Outdoor / Offroad Activities",
    cost: 80,
    note: "Trails, Glamis, camping, desert runs",
  },
  {
    id: "travel",
    l: "Weekend Getaways",
    cost: 150,
    note: "Gas, hotel, food · avg 1x/month",
  },
  {
    id: "hobbies",
    l: "Hobbies / Sports Leagues",
    cost: 100,
    note: "Equipment, fees, classes",
  },
];
const CLOTH = [
  {
    id: "basics",
    l: "Basics Only",
    cost: 30,
    note: "Thrift + occasional new items",
  },
  {
    id: "casual",
    l: "Casual Style",
    cost: 80,
    note: "Regular shopping, sales rack",
  },
  {
    id: "work",
    l: "Work / Professional",
    cost: 120,
    note: "Business attire + everyday",
  },
  {
    id: "fashion",
    l: "Fashion Forward",
    cost: 250,
    note: "Regular brand shopping",
  },
];
const CARE = [
  { id: "basics", l: "Basics Only", cost: 25, note: "Hygiene essentials only" },
  {
    id: "fitness",
    l: "Health & Fitness Focus",
    cost: 80,
    note: "Supplements, gear, grooming",
  },
  {
    id: "salon",
    l: "Salon / Barber Services",
    cost: 120,
    note: "Regular professional grooming",
  },
  {
    id: "full",
    l: "Full Self-Care Routine",
    cost: 200,
    note: "Skincare, gym, salon, spa",
  },
];
const MISC = [
  {
    id: "pet",
    l: "Pet Care",
    cost: 120,
    note: "Food, vet, supplies · 1 pet avg",
  },
  {
    id: "tech",
    l: "New Tech / Gadgets",
    cost: 80,
    note: "Upgrades and accessories",
  },
  {
    id: "vacation",
    l: "Vacation Savings",
    cost: 150,
    note: "1–2 trips/year saved monthly",
  },
  {
    id: "furniture",
    l: "Furniture / Home Decor",
    cost: 100,
    note: "Building out your space",
  },
  {
    id: "apps",
    l: "Apps & Subscriptions",
    cost: 40,
    note: "Cloud, tools, misc subs",
  },
  {
    id: "giving",
    l: "Giving / Donations",
    cost: 50,
    note: "Community and charitable giving",
  },
];
const HTYPE = [
  {
    id: "solo",
    l: "On my own or with roommates",
    e: "🧍",
    note: "Your costs, plus any dependents you select",
  },
  {
    id: "partner_work",
    l: "Partner who works full-time",
    e: "💑",
    note: "Split shared housing and utilities; income shown is yours",
  },
  {
    id: "partner_home",
    l: "Stay-at-home partner",
    e: "🏡",
    note: "Model no paid daycare and food for two adults",
  },
  {
    id: "single_parent",
    l: "Single parent",
    e: "💪",
    note: "Your costs plus selected childcare and supplies",
  },
];
const KIDS = [
  { id: "none", l: "No children", care: 0, supplies: 0 },
  {
    id: "one",
    l: "1 child",
    care: 900,
    supplies: 300,
    note: "Example childcare + food and supplies",
  },
  {
    id: "two",
    l: "2 children",
    care: 1500,
    supplies: 500,
    note: "Childcare x2 or school-age costs",
  },
  {
    id: "three",
    l: "3+ children",
    care: 2000,
    supplies: 750,
    note: "Significant costs across all categories",
  },
];
const SAVES = [
  {
    id: "none",
    l: "No Savings",
    pct: 0,
    note: "See your costs before adding a savings goal",
  },
  {
    id: "s2",
    l: "Save 2% of take-home",
    pct: 0.02,
    note: "A small, steady start",
  },
  {
    id: "s5",
    l: "Save 5% of take-home",
    pct: 0.05,
    note: "Building an emergency fund",
  },
  {
    id: "s7",
    l: "Save 7% of take-home",
    pct: 0.07,
    note: "Make steady room for future needs",
  },
  {
    id: "s10",
    l: "Save 10% of take-home",
    pct: 0.1,
    note: "A planning target, not a rule for everyone",
  },
];

// Career pay is deliberately presented as a scenario, never a hiring probability.
// A source occupation link is a research starting point, not a citation for these estimates.
const CAREERS = [
  {
    title: "Electrician",
    types: ["R"],
    entry: 42000,
    later: 85000,
    path: "Paid apprenticeship, usually 4–5 years",
    first:
      "Compare application requirements for a local registered electrical apprenticeship.",
    url: "https://www.bls.gov/ooh/construction-and-extraction/electricians.htm",
  },
  {
    title: "Plumber",
    types: ["R"],
    entry: 42000,
    later: 88000,
    path: "Paid apprenticeship, usually 4–5 years",
    first:
      "Look up a registered plumbing apprenticeship and note its application dates.",
    url: "https://www.bls.gov/ooh/construction-and-extraction/plumbers-pipefitters-and-steamfitters.htm",
  },
  {
    title: "HVAC technician",
    types: ["R"],
    entry: 40000,
    later: 65000,
    path: "Certificate or apprenticeship",
    first:
      "Compare a community college HVAC program with a paid apprenticeship.",
    url: "https://www.bls.gov/ooh/installation-maintenance-and-repair/heating-air-conditioning-and-refrigeration-mechanics-and-installers.htm",
  },
  {
    title: "Welder",
    types: ["R"],
    entry: 38000,
    later: 56000,
    path: "Certificate, practice, and employer skill testing",
    first:
      "Find a nearby welding program and ask which certifications employers request.",
    url: "https://www.bls.gov/ooh/production/welders-cutters-solderers-and-brazers.htm",
  },
  {
    title: "Auto technician",
    types: ["R"],
    entry: 36000,
    later: 55000,
    path: "Technical training and on-the-job experience",
    first: "Ask an auto program about tool costs and employer partnerships.",
    url: "https://www.bls.gov/ooh/installation-maintenance-and-repair/automotive-service-technicians-and-mechanics.htm",
  },
  {
    title: "Construction manager",
    types: ["R", "E"],
    entry: 60000,
    later: 108000,
    path: "Degree or substantial construction experience; not usually a first job",
    first:
      "Explore construction pathways and the experience needed before management.",
    url: "https://www.bls.gov/ooh/management/construction-managers.htm",
  },
  {
    title: "Firefighter",
    types: ["R", "S"],
    entry: 50000,
    later: 95000,
    path: "Department-specific academy, testing, and often EMT training",
    first:
      "Read a department's actual recruitment notice and minimum requirements.",
    url: "https://www.bls.gov/ooh/protective-service/firefighters.htm",
  },
  {
    title: "EMT / paramedic",
    types: ["S", "R"],
    entry: 36000,
    later: 52000,
    path: "EMT certification; additional education for paramedic",
    first:
      "Compare EMT and paramedic requirements. They are different credentials.",
    url: "https://www.bls.gov/ooh/healthcare/emts-and-paramedics.htm",
  },
  {
    title: "Software developer",
    types: ["I", "A"],
    entry: 65000,
    later: 138000,
    path: "Often a bachelor's degree, plus projects and technical skills",
    first:
      "Build a small project and compare its skills with a real junior job listing.",
    url: "https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm",
  },
  {
    title: "Data analyst",
    types: ["I"],
    entry: 50000,
    later: 90000,
    path: "Data skills and often a relevant degree; requirements vary",
    first: "Try a spreadsheet project using data you care about.",
    url: "https://www.bls.gov/ooh/math/data-scientists.htm",
  },
  {
    title: "IT support specialist",
    types: ["I", "R"],
    entry: 38000,
    later: 60000,
    path: "Technical skills; certificates or college may help",
    first: "Compare three IT support listings and list the skills they share.",
    url: "https://www.bls.gov/ooh/computer-and-information-technology/computer-support-specialists.htm",
  },
  {
    title: "Registered nurse",
    types: ["S", "I"],
    entry: 75000,
    later: 130000,
    path: "Approved nursing program, NCLEX, and state license",
    first:
      "Check nursing prerequisites and application requirements at a community college.",
    url: "https://www.bls.gov/ooh/healthcare/registered-nurses.htm",
  },
  {
    title: "Dental hygienist",
    types: ["S", "I"],
    entry: 65000,
    later: 100000,
    path: "Accredited program and state licensure",
    first: "Check prerequisites, program costs, and licensure requirements.",
    url: "https://www.bls.gov/ooh/healthcare/dental-hygienists.htm",
  },
  {
    title: "Nursing assistant",
    types: ["S", "R"],
    entry: 33000,
    later: 44000,
    path: "State-approved training and competency requirements",
    first: "Find a state-approved CNA program and compare total costs.",
    url: "https://www.bls.gov/ooh/healthcare/nursing-assistants.htm",
  },
  {
    title: "Social worker",
    types: ["S"],
    entry: 42000,
    later: 62000,
    path: "Usually BSW; clinical roles require graduate study and licensing",
    first: "Compare a BSW role with a licensed clinical social work role.",
    url: "https://www.bls.gov/ooh/community-and-social-service/social-workers.htm",
  },
  {
    title: "Teacher",
    types: ["S"],
    entry: 52000,
    later: 85000,
    path: "Bachelor's degree and California credential pathway",
    first: "Look at a district's salary schedule and credential requirements.",
    url: "https://www.bls.gov/ooh/education-training-and-library/high-school-teachers.htm",
  },
  {
    title: "Graphic designer",
    types: ["A"],
    entry: 38000,
    later: 58000,
    path: "Portfolio, design skills, and often college training",
    first:
      "Build three portfolio pieces for a real audience or school project.",
    url: "https://www.bls.gov/ooh/arts-and-design/graphic-designers.htm",
  },
  {
    title: "UX / UI designer",
    types: ["A", "I"],
    entry: 55000,
    later: 95000,
    path: "Portfolio and research/design skills; hiring requirements vary",
    first: "Redesign one confusing screen and test it with three people.",
    url: "https://www.bls.gov/ooh/computer-and-information-technology/web-developers.htm",
  },
  {
    title: "Photographer / videographer",
    types: ["A"],
    entry: 30000,
    later: 52000,
    path: "Portfolio, production skills, and business skills",
    first:
      "Create a short client-style photo or video brief and build a portfolio piece.",
    url: "https://www.bls.gov/ooh/media-and-communication/photographers.htm",
  },
  {
    title: "Marketing manager",
    types: ["E", "A"],
    entry: 45000,
    later: 98000,
    path: "Start in marketing or sales; management usually requires experience",
    first: "Design a campaign for a school event and measure its results.",
    url: "https://www.bls.gov/ooh/management/advertising-promotions-and-marketing-managers.htm",
  },
  {
    title: "Real estate agent",
    types: ["E", "S"],
    entry: 30000,
    later: 72000,
    path: "California coursework and licensing; income can be irregular",
    first: "Research licensing costs and ask an agent about business expenses.",
    url: "https://www.bls.gov/ooh/sales/real-estate-brokers-and-sales-agents.htm",
  },
  {
    title: "Accountant",
    types: ["I", "E"],
    entry: 50000,
    later: 82000,
    path: "Usually an accounting degree; CPA is a separate license",
    first:
      "Compare an accounting degree path with California CPA requirements.",
    url: "https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm",
  },
  {
    title: "Warehouse / forklift operator",
    types: ["R"],
    entry: 38000,
    later: 48000,
    path: "Employer training and equipment-specific safety qualification",
    first:
      "Compare local postings for shift hours, training, and physical requirements.",
    url: "https://www.bls.gov/ooh/transportation-and-material-moving/material-moving-machine-operators.htm",
  },
  {
    title: "Retail supervisor",
    types: ["E", "S"],
    entry: 36000,
    later: 55000,
    path: "Customer service experience and supervisory skills",
    first: "Ask a supervisor which skills helped them move into leadership.",
    url: "https://www.bls.gov/ooh/sales/retail-sales-workers.htm",
  },
];

const STEPS = [
  [
    "About you",
    "Your next chapter starts here.",
    "Explore a possible future. There are no right answers, and you can change your choices.",
  ],
  [
    "Your interests",
    "What feels like you?",
    "Six quick questions to explore career directions, not a test of your ability.",
  ],
  [
    "Housing",
    "Where will you call home?",
    "Start with a living situation. You can explore the trade-offs later.",
  ],
  [
    "Utilities",
    "The bills behind everyday life.",
    "Choose the bills you expect to cover. Shared bills can be split; personal bills stay yours.",
  ],
  [
    "Food",
    "What's on the menu?",
    "Think about your everyday routine, not just a special night out.",
  ],
  [
    "Transportation",
    "How will you get there?",
    "The payment is only one part of owning a car. Insurance, fuel, registration, and repairs count too.",
  ],
  [
    "Healthcare",
    "Make room for taking care of you.",
    "Premiums are just one part of healthcare. Deductibles and out-of-pocket costs vary.",
  ],
  [
    "Leisure",
    "Life is more than bills.",
    "Choose what you enjoy. Leaving room for fun is a valid part of a budget.",
  ],
  [
    "Clothing",
    "What does your wardrobe look like?",
    "Choose a monthly average, including the months when you buy nothing.",
  ],
  [
    "Personal care",
    "Your everyday essentials.",
    "Think about the products and services you regularly use.",
  ],
  [
    "Miscellaneous",
    "The little things add up.",
    "Choose any extras you want in your plan. You can leave this step empty.",
  ],
  [
    "Household",
    "Who is part of your plan?",
    "Include the people you expect to support and see how that changes the budget.",
  ],
  [
    "Savings",
    "Give your future a little room.",
    "Pick a savings goal. We'll calculate it as a share of the take-home pay your plan needs.",
  ],
];
const EMPTY = {
  name: "",
  grade: "",
  plan: "",
  pers: [],
  housing: null,
  roommate: false,
  homeContribution: 300,
  fireRisk: "std",
  rOut: false,
  hOut: false,
  utils: [],
  food: null,
  trans: null,
  ciOut: false,
  crOut: false,
  health: null,
  hlOut: false,
  hadd: [],
  leisure: [],
  cloth: null,
  care: null,
  misc: [],
  htype: null,
  kids: null,
  savings: null,
  loan: 0,
  hustle: 0,
};
const DEMO = {
  ...EMPTY,
  name: "Alex",
  grade: "11th",
  plan: "trade",
  pers: ["A", "I", "A", "S", "A", "I"],
  housing: "studio",
  utils: ["internet", "mobile", "water_gas", "electric"],
  food: "home",
  trans: "used",
  health: "employer",
  leisure: ["gaming", "gym"],
  cloth: "casual",
  care: "basics",
  htype: "solo",
  kids: "none",
  savings: "s10",
};
const find = (list, id) => list.find((x) => x.id === id);
const rented = (id) => ["studio", "1br", "2br", "house_r"].includes(id);

export function progressiveTax(income, brackets) {
  let previous = 0,
    tax = 0;
  for (const [ceiling, rate] of brackets) {
    const amount = Math.max(0, Math.min(income, ceiling) - previous);
    tax += amount * rate;
    previous = ceiling;
    if (income <= ceiling) break;
  }
  return tax;
}

// Historical 2024 single-filer teaching model, before credits or benefit deductions.
export function taxBreakdown(income) {
  const gross = number(income);
  return {
    federal: progressiveTax(Math.max(0, gross - 14600), [
      [11600, 0.1],
      [47150, 0.12],
      [100525, 0.22],
      [191950, 0.24],
      [243725, 0.32],
      [609350, 0.35],
      [Infinity, 0.37],
    ]),
    california:
      progressiveTax(Math.max(0, gross - 5540), [
        [10756, 0.01],
        [25499, 0.02],
        [40245, 0.04],
        [55866, 0.06],
        [70606, 0.08],
        [360659, 0.093],
        [432787, 0.103],
        [721314, 0.113],
        [Infinity, 0.123],
      ]) +
      Math.max(0, gross - 5540 - 1000000) * 0.01,
    socialSecurity: Math.min(gross, 168600) * 0.062,
    medicare: gross * 0.0145 + Math.max(0, gross - 200000) * 0.009,
    sdi: gross * 0.011,
  };
}
export function takeHome(income) {
  return (
    number(income) -
    Object.values(taxBreakdown(income)).reduce((a, b) => a + b, 0)
  );
}
export function salaryNeeded(monthly) {
  const target = number(monthly) * 12;
  if (target === 0) return 0;
  let lo = 0,
    hi = 10000000;
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2;
    if (takeHome(mid) < target) lo = mid;
    else hi = mid;
  }
  return Math.ceil(hi);
}
export function loanPayment(principal, rate = 0.065, months = 120) {
  if (!number(principal)) return 0;
  const r = rate / 12;
  return r === 0
    ? number(principal) / months
    : (number(principal) * r) / (1 - Math.pow(1 + r, -months));
}

export function budget(a) {
  const lines = [];
  const add = (label, amount, group = "everyday") => {
    if (amount > 0) lines.push({ label, amount, group });
  };
  const h = find(HOUSING, a.housing),
    t = find(TRANS, a.trans),
    fr = find(FIRE, a.fireRisk) || FIRE[0];
  const split =
    (rented(a.housing) && a.roommate) || a.htype === "partner_work" ? 2 : 1;
  if (h) {
    add(
      h.id === "family" ? "Contribution at home" : h.l,
      h.id === "family" ? number(a.homeContribution) : h.cost / split,
      "housing",
    );
    if (h.ins === "renters" && !a.rOut)
      add("Renter's insurance", fr.renters, "housing");
    if (h.ins === "homeowners") {
      if (!a.hOut) add("Homeowner's insurance", fr.homeowners, "housing");
      add("Property tax reserve (example)", 417 / split, "housing");
      add("Home maintenance reserve (example)", 333 / split, "housing");
    }
  }
  for (const id of a.utils) {
    const u = find(UTILS, id);
    if (u)
      add(
        u.l,
        u.cost /
          (["internet", "water_gas", "electric"].includes(id) ? split : 1),
      );
  }
  const food = find(FOOD, a.food);
  if (food) add("Food", food.cost * (a.htype === "partner_home" ? 2 : 1));
  if (t) {
    add(t.l, t.cost, "transport");
    if (t.car) {
      if (!a.ciOut) add("Car insurance", CINS[t.ct].cost, "transport");
      if (!a.crOut) add("Registration reserve", 30, "transport");
      add("Gas", CGAS[t.ct], "transport");
      add(
        "Maintenance & repair reserve",
        t.ct === "beater" ? 125 : 75,
        "transport",
      );
    }
  }
  if (!a.hlOut) {
    const health = find(HEALTH, a.health);
    if (health) add("Health premium (your coverage)", health.cost);
  }
  for (const id of a.hadd) {
    const item = find(HADD, id);
    if (item) add(item.l, item.cost);
  }
  for (const id of a.leisure) {
    const item = find(LEISURE, id);
    if (item) add(item.l, item.cost);
  }
  for (const [list, key, label] of [
    [CLOTH, "cloth", "Clothing"],
    [CARE, "care", "Personal care"],
  ]) {
    const item = find(list, a[key]);
    if (item) add(label, item.cost);
  }
  for (const id of a.misc) {
    const item = find(MISC, id);
    if (item) add(item.l, item.cost);
  }
  const kids = find(KIDS, a.kids);
  if (kids) {
    if (a.htype !== "partner_home") add("Childcare", kids.care);
    add("Children: food & supplies", kids.supplies);
  }
  if (["trade", "cc", "4year"].includes(a.plan))
    add("Student loan payment", loanPayment(a.loan));
  const expenses = lines.reduce((sum, l) => sum + l.amount, 0);
  const rate = find(SAVES, a.savings)?.pct || 0;
  const required = expenses / (1 - rate);
  add(
    `Savings (${Math.round(rate * 100)}% of take-home)`,
    required - expenses,
    "savings",
  );
  const sideNet = number(a.hustle) * 0.75; // scenario reserve, not a tax calculation
  return {
    lines,
    expenses,
    rate,
    savings: required - expenses,
    total: required,
    sideNet,
    mainNet: Math.max(0, required - sideNet),
    salary: salaryNeeded(Math.max(0, required - sideNet)),
    groups: ["housing", "everyday", "transport", "savings"].map((group) =>
      lines
        .filter((l) => l.group === group)
        .reduce((sum, l) => sum + l.amount, 0),
    ),
    split,
  };
}

function matchCareers(answers) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0 };
  answers.forEach((code) => {
    if (code in scores) scores[code]++;
  });
  return CAREERS.map((c, index) => ({
    ...c,
    index,
    score: c.types.reduce((s, t) => s + scores[t], 0),
  }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 6);
}
function valid(step, a) {
  return [
    () => !!a.name.trim() && !!a.grade && !!a.plan,
    () => a.pers.filter(Boolean).length === 6,
    () => !!a.housing,
    () => true,
    () => !!a.food,
    () => !!a.trans,
    () => !!a.health || a.hlOut,
    () => true,
    () => !!a.cloth,
    () => !!a.care,
    () => true,
    () => !!a.htype && !!a.kids,
    () => !!a.savings,
  ][step]();
}

function useSmall() {
  const [small, setSmall] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 960,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 959px)");
    const update = () => setSmall(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return small;
}
function Button({
  children,
  onClick,
  primary = false,
  disabled = false,
  style = {},
  ...props
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        boxSizing: "border-box",
        minHeight: 44,
        padding: "12px 18px",
        borderRadius: 7,
        border: `1px solid ${primary ? C.blue : C.line}`,
        background: disabled ? "#eef1f5" : primary ? C.blue : "#fff",
        color: disabled ? "#697386" : primary ? "#fff" : C.blue,
        fontWeight: 650,
        fontSize: 14,
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
function Note({ children, tone = "blue", style = {} }) {
  const colors = {
    blue: [C.lightBlue, C.blue],
    amber: [C.lightAmber, C.amber],
    green: [C.lightGreen, C.green],
    red: [C.lightRed, C.red],
  };
  const [bg, fg] = colors[tone];
  return (
    <div
      style={{
        boxSizing: "border-box",
        padding: "15px 17px",
        borderRadius: 7,
        background: bg,
        color: fg,
        fontSize: 13,
        lineHeight: 1.65,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
function Field({ label, children, help }) {
  return (
    <label
      style={{ boxSizing: "border-box", display: "block", marginBottom: 20 }}
    >
      <span style={labelStyle}>{label}</span>
      {children}
      {help && (
        <span
          style={{
            boxSizing: "border-box",
            display: "block",
            marginTop: 6,
            fontSize: 12,
            color: C.muted,
            lineHeight: 1.6,
          }}
        >
          {help}
        </span>
      )}
    </label>
  );
}
function Choice({ selected, onClick, title, note, cost, multiple = false }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      style={{
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 13,
        width: "100%",
        padding: "17px 16px",
        textAlign: "left",
        fontFamily: "inherit",
        border: `1px solid ${selected ? C.blue : C.line}`,
        borderRadius: 9,
        background: selected ? C.lightBlue : "#fff",
        color: C.ink,
        cursor: "pointer",
        marginBottom: 10,
        minHeight: 67,
      }}
    >
      <span style={{ boxSizing: "border-box", flex: 1, minWidth: 0 }}>
        <span
          style={{
            boxSizing: "border-box",
            display: "block",
            fontSize: 15,
            fontWeight: 650,
          }}
        >
          {title}
          {selected && (
            <span
              style={{
                boxSizing: "border-box",
                fontSize: 10,
                color: C.blue,
                fontWeight: 700,
                marginLeft: 10,
                letterSpacing: 0.3,
              }}
            >
              {multiple ? "ADDED" : "SELECTED"}
            </span>
          )}
        </span>
        {note && (
          <span
            style={{
              boxSizing: "border-box",
              display: "block",
              fontSize: 12,
              color: C.muted,
              lineHeight: 1.6,
              marginTop: 3,
            }}
          >
            {note}
          </span>
        )}
      </span>
      {cost !== undefined && (
        <span
          style={{
            boxSizing: "border-box",
            fontSize: 15,
            fontWeight: 700,
            whiteSpace: "nowrap",
            color: selected ? C.blue : C.ink,
          }}
        >
          {cost}
        </span>
      )}
    </button>
  );
}
function Header({ small, children }) {
  return (
    <header
      style={{
        boxSizing: "border-box",
        borderBottom: `1px solid ${C.line}`,
        background: "#fff",
      }}
    >
      <div
        style={{
          boxSizing: "border-box",
          maxWidth: 1376,
          margin: "0 auto",
          padding: small ? "18px 20px" : "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <img
            src={LOGO}
            alt=""
            width="38"
            height="38"
            style={{ boxSizing: "border-box", objectFit: "contain" }}
          />
          <div>
            <div
              style={{
                boxSizing: "border-box",
                fontWeight: 750,
                fontSize: small ? 16 : 20,
                letterSpacing: -0.6,
              }}
            >
              What Will Your Life Cost?
            </div>
            <div
              style={{
                boxSizing: "border-box",
                fontSize: 12,
                color: C.muted,
                marginTop: 3,
              }}
            >
              A student guide to your next chapter
            </div>
          </div>
        </div>
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 12,
            color: C.muted,
          }}
        >
          {!small && <span>Riverside County, California</span>}
          {children}
        </div>
      </div>
    </header>
  );
}
function Modal({
  title,
  body,
  onConfirm,
  onClose,
  confirmLabel = "Remove for scenario",
  cancelLabel = "Keep coverage",
}) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      style={{
        boxSizing: "border-box",
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: 28,
        maxWidth: 440,
        width: "calc(100% - 40px)",
        color: C.ink,
        fontFamily: "system-ui,sans-serif",
        boxShadow: "0 20px 80px #101b3230",
      }}
    >
      <div style={{ boxSizing: "border-box", ...eyebrow, color: C.amber }}>
        Know the trade-off
      </div>
      <h2
        id="dialog-title"
        style={{
          boxSizing: "border-box",
          fontSize: 23,
          letterSpacing: -0.6,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          boxSizing: "border-box",
          fontSize: 14,
          lineHeight: 1.8,
          color: C.muted,
        }}
      >
        {body}
      </p>
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          gap: 10,
          marginTop: 24,
        }}
      >
        <Button
          primary
          onClick={onClose}
          style={{ boxSizing: "border-box", flex: 1 }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          style={{ boxSizing: "border-box", flex: 1, color: C.red }}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}

function ChoiceList({
  items,
  value,
  onChange,
  multiple = false,
  price = (x) => (x.cost !== undefined ? `${fmt(x.cost)}/mo` : undefined),
}) {
  return (
    <div>
      {items.map((item) => (
        <Choice
          key={item.id}
          title={item.l}
          note={item.note}
          selected={multiple ? value.includes(item.id) : value === item.id}
          onClick={() => onChange(item.id)}
          cost={price(item)}
          multiple={multiple}
        />
      ))}
    </div>
  );
}
function AboutStep({ a, update }) {
  return (
    <>
      <Field
        label="What should we call you?"
        help="A first name or nickname is enough. Your answers stay in this tab."
      >
        <input
          autoComplete="off"
          maxLength={32}
          value={a.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Your first name or nickname"
          style={inputStyle}
        />
      </Field>
      <Field label="Your grade">
        <select
          value={a.grade}
          onChange={(e) => update({ grade: e.target.value })}
          style={inputStyle}
        >
          <option value="">Choose your grade</option>
          {["9th", "10th", "11th", "12th"].map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </Field>
      <div style={labelStyle}>What might come after high school?</div>
      <ChoiceList
        items={[
          { id: "work", l: "Start working" },
          { id: "trade", l: "Trade school or apprenticeship" },
          { id: "cc", l: "Community college" },
          { id: "4year", l: "Four-year university" },
          { id: "military", l: "Military" },
          { id: "unsure", l: "Still figuring it out" },
        ]}
        value={a.plan}
        onChange={(plan) =>
          update({
            plan,
            loan: ["trade", "cc", "4year"].includes(plan) ? a.loan : 0,
          })
        }
      />
      {["trade", "cc", "4year"].includes(a.plan) && (
        <div style={{ boxSizing: "border-box", marginTop: 24 }}>
          <Field
            label="How much might you borrow in total?"
            help="Planning scenario: 6.5% interest over 10 years. Actual loan types, rates, aid, and repayment plans vary. This is the future repayment budget, not costs while enrolled."
          >
            <select
              value={a.loan}
              onChange={(e) => update({ loan: Number(e.target.value) })}
              style={inputStyle}
            >
              {[0, 5000, 15000, 30000, 60000].map((n) => (
                <option key={n} value={n}>
                  {n
                    ? `${fmt(n)} borrowed, about ${fmt(loanPayment(n))}/month`
                    : "No borrowing in this scenario"}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      {a.plan === "military" && (
        <Note>
          Military compensation depends on rank, time in service, duty location,
          housing, and benefits. This calculator models a civilian lifestyle,
          not a military pay package. Use official military pay tables for that
          comparison.
        </Note>
      )}
    </>
  );
}
function InterestStep({ a, update }) {
  const [q, setQ] = useState(0),
    [locked, setLocked] = useState(false);
  const timer = useRef(null),
    heading = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const pick = (type) => {
    if (locked) return;
    const pers = [...a.pers];
    pers[q] = type;
    update({ pers });
    if (q < 5) {
      setLocked(true);
      timer.current = setTimeout(() => {
        setQ((v) => Math.min(5, v + 1));
        setLocked(false);
        heading.current?.focus();
      }, 180);
    }
  };
  return (
    <>
      <div
        style={{
          boxSizing: "border-box",
          ...eyebrow,
          color: C.blue,
          marginBottom: 15,
        }}
      >
        Question {q + 1} of 6
      </div>
      <h2
        ref={heading}
        tabIndex={-1}
        style={{
          boxSizing: "border-box",
          fontSize: 23,
          lineHeight: 1.4,
          letterSpacing: -0.5,
          outline: "none",
          margin: "0 0 24px",
        }}
      >
        {PQ[q].q}
      </h2>
      <div aria-busy={locked}>
        {PQ[q].o.map((o, i) => (
          <Choice
            key={`${q}-${i}`}
            selected={a.pers[q] === o.t}
            title={o.l}
            onClick={() => pick(o.t)}
          />
        ))}
      </div>
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 20,
        }}
      >
        <Button disabled={q === 0 || locked} onClick={() => setQ((v) => v - 1)}>
          Previous question
        </Button>
        {q < 5 && a.pers[q] && (
          <Button disabled={locked} onClick={() => setQ((v) => v + 1)}>
            Next question
          </Button>
        )}
        <span style={{ boxSizing: "border-box", fontSize: 12, color: C.muted }}>
          {a.pers.filter(Boolean).length} of 6 answered
        </span>
      </div>
      <Note style={{ boxSizing: "border-box", marginTop: 24 }}>
        This short interest activity is inspired by career-interest themes. It
        is not a validated Holland assessment and cannot predict your abilities,
        hiring chances, or future.
      </Note>
    </>
  );
}
const CONSEQUENCES = {
  rOut: [
    "Remove renter's insurance?",
    "A lease may require it, though it is not a general California legal requirement. Without coverage, you could have to replace belongings or pay liability costs yourself. Standard policies generally exclude flood damage. Check the actual policy and lease.",
  ],
  hOut: [
    "Remove homeowner's insurance?",
    "Mortgage lenders usually require coverage. A lender may buy more expensive coverage on your behalf if it lapses. Fire coverage, exclusions, and separate flood insurance depend on the policy.",
  ],
  ciOut: [
    "Remove car insurance?",
    "California requires financial responsibility for driving. Losing required coverage can lead to penalties, registration suspension, and personal liability after an accident. A lender can also require collision and comprehensive coverage.",
  ],
  crOut: [
    "Remove vehicle registration?",
    "California generally requires current registration for vehicles driven on public roads. Driving with expired registration can lead to fees, citations, and, in some circumstances, impoundment.",
  ],
  hlOut: [
    "Remove health coverage?",
    "California has a health coverage requirement, but exemptions and financial assistance may apply. Going without coverage can expose you to large medical bills and a state tax penalty. This model does not calculate penalties or eligibility.",
  ],
};
function Coverage({ label, amount, removed, onToggle, note }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        gap: 16,
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0",
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <div>
        <div style={{ boxSizing: "border-box", fontSize: 14, fontWeight: 650 }}>
          {label}
        </div>
        <div
          style={{
            boxSizing: "border-box",
            fontSize: 12,
            color: C.muted,
            lineHeight: 1.6,
            marginTop: 4,
          }}
        >
          {removed ? "Removed from this scenario" : `${fmt(amount)}/month`}
          {note && ` · ${note}`}
        </div>
      </div>
      <Button
        onClick={onToggle}
        style={{
          boxSizing: "border-box",
          minWidth: 90,
          color: removed ? C.blue : C.muted,
          padding: "8px 12px",
          fontSize: 12,
        }}
      >
        {removed ? "Restore" : "Remove"}
      </Button>
    </div>
  );
}
function HousingStep({ a, update, ask }) {
  const h = find(HOUSING, a.housing),
    fr = find(FIRE, a.fireRisk) || FIRE[0];
  return (
    <>
      <ChoiceList
        items={HOUSING}
        value={a.housing}
        onChange={(housing) =>
          update({
            housing,
            rOut: false,
            hOut: false,
            roommate: rented(housing) ? a.roommate : false,
          })
        }
        price={(h) =>
          h.id === "family" ? "Your contribution" : `${fmt(h.cost)}/mo`
        }
      />
      {a.housing === "family" && (
        <Field
          label="Your monthly contribution at home"
          help="Living with family is not always free. Add a contribution here; choose food and utilities in later steps if you also pay those."
        >
          <input
            type="number"
            min="0"
            max="100000"
            value={a.homeContribution}
            onChange={(e) =>
              update({ homeContribution: number(e.target.value, 100000) })
            }
            style={inputStyle}
          />
        </Field>
      )}
      {rented(a.housing) && (
        <Choice
          title="Share with one roommate"
          note="Split rent and shared utilities in half. Your food, insurance, phone, and personal costs stay yours."
          selected={a.roommate}
          onClick={() => update({ roommate: !a.roommate })}
          multiple
        />
      )}
      {h?.ins && (
        <>
          <div
            style={{
              boxSizing: "border-box",
              ...eyebrow,
              margin: "27px 0 13px",
            }}
          >
            Insurance scenario
          </div>
          <Field label="Location and fire risk">
            <select
              value={a.fireRisk}
              onChange={(e) => update({ fireRisk: e.target.value })}
              style={inputStyle}
            >
              {FIRE.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.l}
                </option>
              ))}
            </select>
          </Field>
          <Coverage
            label={
              h.ins === "renters"
                ? "Renter's insurance"
                : "Homeowner's insurance"
            }
            amount={fr[h.ins]}
            removed={a[h.ins === "renters" ? "rOut" : "hOut"]}
            onToggle={() => ask(h.ins === "renters" ? "rOut" : "hOut")}
            note="Illustrative premium, not a quote"
          />
        </>
      )}
      {a.housing === "house_o" && (
        <Note style={{ boxSizing: "border-box", marginTop: 20 }}>
          Example only: a $400,000 home, $80,000 down, and a 30-year mortgage at
          7.1%. We add $417/month for property tax and $333/month for
          maintenance before any sharing. Closing costs, HOA fees, and the down
          payment are not monthly expenses here.
        </Note>
      )}
      <p
        style={{
          boxSizing: "border-box",
          fontSize: 12,
          color: C.muted,
          lineHeight: 1.7,
          marginTop: 22,
        }}
      >
        Housing prices and insurance premiums are classroom estimates inherited
        from the original activity. Check real listings and quotes before using
        them for a real move.
      </p>
    </>
  );
}
function UtilitiesStep({ a, toggle, update }) {
  return (
    <>
      <ChoiceList
        items={UTILS}
        value={a.utils}
        onChange={(id) => toggle("utils", id)}
        multiple
      />
      <Choice
        title="No separate utility bills in this scenario"
        note="For example, included in rent or paid by someone else."
        selected={a.utils.length === 0}
        onClick={() => update({ utils: [] })}
      />
      <Note style={{ boxSizing: "border-box", marginTop: 22 }}>
        When rent is shared with a roommate or working partner, internet,
        water/gas, and electricity are split between two people. Your phone and
        streaming stay yours. A roommate and partner never split costs twice.
      </Note>
    </>
  );
}
function TransportStep({ a, update, ask }) {
  const t = find(TRANS, a.trans);
  return (
    <>
      <ChoiceList
        items={TRANS}
        value={a.trans}
        onChange={(trans) => update({ trans, ciOut: false, crOut: false })}
      />
      {t?.car && (
        <>
          <div
            style={{
              boxSizing: "border-box",
              ...eyebrow,
              margin: "28px 0 10px",
            }}
          >
            Beyond the car payment
          </div>
          <Coverage
            label="Car insurance"
            amount={CINS[t.ct].cost}
            note={CINS[t.ct].note}
            removed={a.ciOut}
            onToggle={() => ask("ciOut")}
          />
          <Coverage
            label="Registration reserve"
            amount={30}
            removed={a.crOut}
            onToggle={() => ask("crOut")}
          />
          <div
            style={{
              boxSizing: "border-box",
              fontSize: 14,
              lineHeight: 2,
              paddingTop: 15,
              color: C.muted,
            }}
          >
            Fuel estimate:{" "}
            <strong style={{ boxSizing: "border-box", color: C.ink }}>
              {fmt(CGAS[t.ct])}/month
            </strong>
            <br />
            Maintenance reserve:{" "}
            <strong style={{ boxSizing: "border-box", color: C.ink }}>
              {fmt(t.ct === "beater" ? 125 : 75)}/month
            </strong>
          </div>
          <Note style={{ boxSizing: "border-box", marginTop: 20 }}>
            All vehicle amounts are scenarios. Age, driving record, mileage,
            financing, repairs, and insurance quotes can change the total
            substantially. Parking and tolls are not included.
          </Note>
        </>
      )}
    </>
  );
}
function HealthStep({ a, update, toggle, ask }) {
  return (
    <>
      <ChoiceList
        items={HEALTH}
        value={a.hlOut ? null : a.health}
        onChange={(health) => update({ health, hlOut: false })}
      />
      <Choice
        title="No health insurance in this scenario"
        note="Review the potential costs and coverage rules before removing it."
        selected={a.hlOut}
        onClick={() => ask("hlOut")}
      />
      <div
        style={{ boxSizing: "border-box", ...eyebrow, margin: "26px 0 12px" }}
      >
        Optional add-ons
      </div>
      <ChoiceList
        items={HADD}
        value={a.hadd}
        multiple
        onChange={(id) => toggle("hadd", id)}
      />
      <Note style={{ boxSizing: "border-box", marginTop: 20 }}>
        This selection covers you only. Medi-Cal and Covered California
        assistance depend on actual eligibility. This tool does not check
        eligibility or add a partner's premium, deductibles, copays, or a
        medical spending reserve. Add those when building a real household
        budget.
      </Note>
    </>
  );
}
function HouseholdStep({ a, update }) {
  const kids = find(KIDS, a.kids);
  return (
    <>
      <ChoiceList
        items={HTYPE}
        value={a.htype}
        onChange={(htype) => update({ htype })}
      />
      <div
        style={{ boxSizing: "border-box", ...eyebrow, margin: "28px 0 14px" }}
      >
        Children you support
      </div>
      <ChoiceList
        items={KIDS}
        value={a.kids}
        onChange={(kids) => update({ kids })}
        price={(k) =>
          `+${fmt((a.htype === "partner_home" ? 0 : k.care) + k.supplies)}/mo`
        }
      />
      {kids?.care > 0 && a.htype === "partner_home" && (
        <Note tone="green">
          This scenario assumes your partner provides childcare without paid
          daycare. It also adds food for a second adult. Unpaid caregiving has
          value; zero daycare does not mean zero cost or effort.
        </Note>
      )}
      <Note style={{ boxSizing: "border-box", marginTop: 20 }}>
        A working partner shares housing and shared utilities only; their income
        is not added to yours. Child costs are the amounts assigned to your
        plan. We still model your wage taxes as a single filer, so actual family
        tax benefits and filing status can change take-home pay.
      </Note>
    </>
  );
}
function SavingsStep({ a, update }) {
  const base = budget({ ...a, savings: "none" }).expenses;
  return (
    <>
      <ChoiceList
        items={SAVES}
        value={a.savings}
        onChange={(savings) => update({ savings })}
        price={(s) => `${fmt(base / (1 - s.pct) - base)}/mo`}
      />
      <hr style={divider} />
      <Field
        label="Optional side income, before expenses and taxes, per month"
        help="A simple scenario reserves 25% for tax and business costs. It is not a self-employment tax calculation, and actual costs may be higher. Enter 0 to leave it out."
      >
        <input
          type="number"
          min="0"
          max="100000"
          step="50"
          value={a.hustle}
          onChange={(e) => update({ hustle: number(e.target.value, 100000) })}
          style={inputStyle}
        />
      </Field>
      <Note>
        There is no perfect savings rate for everyone. Here, a 10% target means
        expenses use 90% of the take-home pay needed, and the remaining 10% goes
        to savings.
      </Note>
    </>
  );
}
function StepContent({ step, a, update, toggle, ask }) {
  switch (step) {
    case 0:
      return <AboutStep a={a} update={update} />;
    case 1:
      return <InterestStep a={a} update={update} />;
    case 2:
      return <HousingStep a={a} update={update} ask={ask} />;
    case 3:
      return <UtilitiesStep a={a} toggle={toggle} update={update} />;
    case 4:
      return (
        <ChoiceList
          items={FOOD}
          value={a.food}
          onChange={(food) => update({ food })}
        />
      );
    case 5:
      return <TransportStep a={a} update={update} ask={ask} />;
    case 6:
      return <HealthStep a={a} update={update} toggle={toggle} ask={ask} />;
    case 7:
      return (
        <ChoiceList
          items={LEISURE}
          value={a.leisure}
          multiple
          onChange={(id) => toggle("leisure", id)}
        />
      );
    case 8:
      return (
        <ChoiceList
          items={CLOTH}
          value={a.cloth}
          onChange={(cloth) => update({ cloth })}
        />
      );
    case 9:
      return (
        <ChoiceList
          items={CARE}
          value={a.care}
          onChange={(care) => update({ care })}
        />
      );
    case 10:
      return (
        <ChoiceList
          items={MISC}
          value={a.misc}
          multiple
          onChange={(id) => toggle("misc", id)}
        />
      );
    case 11:
      return <HouseholdStep a={a} update={update} />;
    case 12:
      return <SavingsStep a={a} update={update} />;
    default:
      return null;
  }
}
function Wizard({ a, update, step, setStep, onFinish, onHome, small }) {
  const [removal, setRemoval] = useState(null);
  const heading = useRef(null),
    b = budget(a);
  const toggle = (key, id) =>
    update({
      [key]: a[key].includes(id)
        ? a[key].filter((x) => x !== id)
        : [...a[key], id],
    });
  const ask = (key) => (a[key] ? update({ [key]: false }) : setRemoval(key));
  const go = (n) => {
    setStep(n);
    window.scrollTo(0, 0);
    requestAnimationFrame(() => heading.current?.focus());
  };
  return (
    <>
      <Header small={small}>
        <button
          type="button"
          onClick={onHome}
          style={{
            boxSizing: "border-box",
            border: 0,
            background: "none",
            color: C.blue,
            fontSize: 13,
            cursor: "pointer",
            padding: 8,
          }}
        >
          Back to start
        </button>
      </Header>
      <main
        style={{
          boxSizing: "border-box",
          maxWidth: 1180,
          margin: "0 auto",
          padding: small ? "30px 20px 110px" : "44px 40px 100px",
        }}
      >
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            marginBottom: 12,
          }}
        >
          <span style={{ boxSizing: "border-box", ...eyebrow, color: C.blue }}>
            Your life, your choices
          </span>
          <span
            style={{ boxSizing: "border-box", fontSize: 12, color: C.muted }}
          >
            Step {step + 1} of 13
          </span>
        </div>
        <progress
          aria-label="Steps completed"
          max={13}
          value={step}
          style={{
            boxSizing: "border-box",
            width: "100%",
            height: 5,
            accentColor: C.blue,
            display: "block",
            marginBottom: small ? 32 : 46,
          }}
        />
        <div
          style={{
            boxSizing: "border-box",
            display: "grid",
            gridTemplateColumns: small ? "1fr" : "minmax(0, 680px) 260px",
            gap: small ? 28 : 64,
            alignItems: "start",
          }}
        >
          <section>
            <div
              style={{ boxSizing: "border-box", ...eyebrow, marginBottom: 13 }}
            >
              {STEPS[step][0]}
            </div>
            <h1
              ref={heading}
              tabIndex={-1}
              style={{
                boxSizing: "border-box",
                fontSize: small ? 32 : 40,
                fontWeight: 750,
                letterSpacing: -1.5,
                lineHeight: 1.13,
                margin: "0 0 16px",
                outline: "none",
              }}
            >
              {STEPS[step][1]}
            </h1>
            <p
              style={{
                boxSizing: "border-box",
                color: C.muted,
                fontSize: 15,
                lineHeight: 1.8,
                margin: "0 0 30px",
                maxWidth: 560,
              }}
            >
              {STEPS[step][2]}
            </p>
            <StepContent
              key={step}
              step={step}
              a={a}
              update={update}
              toggle={toggle}
              ask={ask}
            />
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 32,
                paddingTop: 24,
                borderTop: `1px solid ${C.line}`,
              }}
            >
              <Button onClick={() => (step ? go(step - 1) : onHome())}>
                Back
              </Button>
              <Button
                primary
                disabled={!valid(step, a)}
                onClick={() => (step === 12 ? onFinish() : go(step + 1))}
                style={{ boxSizing: "border-box", flex: 1 }}
              >
                {step === 12 ? "See my results" : "Continue"}
              </Button>
            </div>
            {!valid(step, a) && (
              <p
                role="status"
                style={{
                  boxSizing: "border-box",
                  fontSize: 12,
                  color: C.muted,
                  textAlign: "right",
                }}
              >
                {step === 0
                  ? "Add a name, grade, and possible next step to continue."
                  : step === 1
                    ? "Answer all six questions to continue."
                    : "Choose an option to continue."}
              </p>
            )}
          </section>
          <aside
            style={{
              boxSizing: "border-box",
              position: small ? "static" : "sticky",
              top: 28,
            }}
          >
            <div
              style={{
                boxSizing: "border-box",
                background: C.soft,
                borderRadius: 10,
                padding: 24,
              }}
            >
              <div style={eyebrow}>Your plan so far</div>
              <div
                aria-live="polite"
                aria-atomic="true"
                style={{
                  boxSizing: "border-box",
                  fontSize: 40,
                  fontWeight: 750,
                  letterSpacing: -1.7,
                  margin: "10px 0 4px",
                  color: C.blue,
                }}
              >
                {fmt(b.total)}
                <span
                  style={{
                    boxSizing: "border-box",
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: 0,
                    color: C.muted,
                  }}
                >
                  {" "}
                  / month
                </span>
              </div>
              <p
                style={{
                  boxSizing: "border-box",
                  fontSize: 12,
                  color: C.muted,
                  lineHeight: 1.7,
                  marginBottom: 0,
                }}
              >
                A running estimate, including your savings goal. You can revisit
                every choice.
              </p>
            </div>
            {!small && (
              <nav
                aria-label="Your completed choices"
                style={{ boxSizing: "border-box", marginTop: 24 }}
              >
                {STEPS.map(([title], i) => (
                  <button
                    key={title}
                    disabled={
                      i > step &&
                      !STEPS.slice(0, i).every((_, j) => valid(j, a))
                    }
                    onClick={() => go(i)}
                    aria-current={i === step ? "step" : undefined}
                    style={{
                      boxSizing: "border-box",
                      display: "flex",
                      gap: 12,
                      padding: "9px 4px",
                      border: 0,
                      background: "none",
                      fontFamily: "inherit",
                      fontSize: 12,
                      color: i === step ? C.blue : i < step ? C.ink : C.muted,
                      fontWeight: i === step ? 750 : 450,
                      cursor: "pointer",
                      opacity:
                        i > step &&
                        !STEPS.slice(0, i).every((_, j) => valid(j, a))
                          ? 0.45
                          : 1,
                    }}
                  >
                    <span
                      style={{
                        boxSizing: "border-box",
                        fontVariantNumeric: "tabular-nums",
                        minWidth: 19,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {title}
                  </button>
                ))}
              </nav>
            )}
          </aside>
        </div>
        <p
          style={{
            boxSizing: "border-box",
            fontSize: 11,
            color: C.muted,
            lineHeight: 1.7,
            marginTop: 40,
          }}
        >
          Classroom planning estimates. Refreshing or closing this tab clears
          your answers. No answers are uploaded or saved.
        </p>
      </main>
      {removal && (
        <Modal
          title={CONSEQUENCES[removal][0]}
          body={CONSEQUENCES[removal][1]}
          onClose={() => setRemoval(null)}
          onConfirm={() => {
            update({ [removal]: true });
            setRemoval(null);
          }}
        />
      )}
    </>
  );
}

const GROUPS = [
  { name: "Housing", color: C.blue },
  { name: "Everyday living", color: "#93c5fd" },
  { name: "Transportation", color: "#273c62" },
  { name: "Savings", color: "#16a34a" },
];
function Spending({ b, small }) {
  return (
    <div>
      <div
        role="img"
        aria-label={GROUPS.map((g, i) => `${g.name}: ${fmt(b.groups[i])}`).join(
          ", ",
        )}
        style={{
          boxSizing: "border-box",
          display: "flex",
          height: 36,
          borderRadius: 7,
          overflow: "hidden",
          background: C.soft,
          margin: "26px 0 19px",
        }}
      >
        {b.groups.map(
          (n, i) =>
            n > 0 && (
              <div
                key={i}
                style={{
                  boxSizing: "border-box",
                  width: `${(n / b.total) * 100}%`,
                  background: GROUPS[i].color,
                  borderRight: i < 3 ? "1px solid #fff" : "none",
                }}
              />
            ),
        )}
      </div>
      {GROUPS.map((g, i) => (
        <div
          key={g.name}
          style={{
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 0",
            borderBottom: i < 3 ? `1px solid ${C.line}` : 0,
            fontSize: small ? 15 : 18,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              boxSizing: "border-box",
              width: 13,
              height: 13,
              borderRadius: 20,
              background: g.color,
              flexShrink: 0,
            }}
          />
          <span style={{ boxSizing: "border-box", flex: 1 }}>
            {g.name}
            {i === 3 && b.rate > 0 ? ` (${Math.round(b.rate * 100)}%)` : ""}
          </span>
          <strong
            style={{
              boxSizing: "border-box",
              fontSize: small ? 15 : 18,
              fontWeight: 550,
            }}
          >
            {fmt(b.groups[i])}
          </strong>
        </div>
      ))}
    </div>
  );
}
function Overview({
  a,
  b,
  small,
  onView,
  onScenario,
  onPrint,
  salary,
  setSalary,
}) {
  const available = takeHome(salary) / 12 + b.sideNet,
    gap = b.total - available;
  return (
    <>
      <div style={{ boxSizing: "border-box", ...eyebrow, marginBottom: 15 }}>
        Your next chapter
      </div>
      <h1
        style={{
          boxSizing: "border-box",
          fontSize: small ? 38 : 64,
          lineHeight: 1.07,
          letterSpacing: small ? -1.8 : -2.8,
          fontWeight: 780,
          margin: "0 0 17px",
        }}
      >
        Your lifestyle, at a glance.
      </h1>
      <p
        style={{
          boxSizing: "border-box",
          color: C.muted,
          fontSize: small ? 15 : 17,
          lineHeight: 1.7,
          margin: "0 0 30px",
          maxWidth: 920,
        }}
      >
        {a.name}, these are choices you can explore. Your budget is a starting
        point for what comes next.
      </p>
      <div
        style={{
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: small ? "1fr" : "1.47fr 1fr",
          gap: small ? 28 : 46,
          alignItems: "start",
        }}
      >
        <section aria-label="Your monthly plan">
          <h2
            style={{
              boxSizing: "border-box",
              fontSize: 24,
              fontWeight: 750,
              letterSpacing: -0.6,
              margin: "0 0 6px",
            }}
          >
            Your monthly plan
          </h2>
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              alignItems: "baseline",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            <strong
              style={{
                boxSizing: "border-box",
                fontSize: small ? 65 : 104,
                lineHeight: 1.15,
                letterSpacing: -4.5,
                color: C.blue,
                fontWeight: 780,
              }}
            >
              {fmt(b.total)}
            </strong>
            <span
              style={{
                boxSizing: "border-box",
                fontSize: small ? 15 : 19,
                color: C.muted,
              }}
            >
              per month
            </span>
          </div>
          <Spending b={b} small={small} />
        </section>
        <section
          style={{
            boxSizing: "border-box",
            background: C.lightBlue,
            borderRadius: 9,
            padding: small ? 24 : 30,
          }}
        >
          <h2
            style={{
              boxSizing: "border-box",
              fontSize: 24,
              letterSpacing: -0.7,
              fontWeight: 750,
              margin: "0 0 18px",
            }}
          >
            A starting-pay reality check
          </h2>
          <div
            style={{ boxSizing: "border-box", fontSize: 18, color: C.muted }}
          >
            Example take-home{b.sideNet > 0 ? " + side income" : ""}
          </div>
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 5,
            }}
          >
            <strong
              style={{
                boxSizing: "border-box",
                fontSize: small ? 53 : 66,
                fontWeight: 780,
                letterSpacing: -2.5,
                lineHeight: 1.15,
              }}
            >
              {fmt(available)}
            </strong>
            <span
              style={{ boxSizing: "border-box", fontSize: 15, color: C.muted }}
            >
              / month
            </span>
          </div>
          <div
            style={{
              boxSizing: "border-box",
              borderTop: "1px solid #d6e3f6",
              marginTop: 22,
              paddingTop: 20,
              marginBottom: 17,
            }}
          >
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                flexWrap: "wrap",
                color: gap > 0 ? C.amber : C.green,
              }}
            >
              <strong
                style={{
                  boxSizing: "border-box",
                  fontSize: small ? 44 : 64,
                  fontWeight: 750,
                  letterSpacing: -2,
                }}
              >
                {fmt(Math.abs(gap))}
              </strong>
              <span
                style={{
                  boxSizing: "border-box",
                  fontSize: 17,
                  fontWeight: 550,
                }}
              >
                {gap > 0 ? "monthly gap" : "left after your plan"}
              </span>
            </div>
            <p
              style={{
                boxSizing: "border-box",
                fontSize: 13,
                color: C.muted,
                lineHeight: 1.7,
                margin: "10px 0 0",
              }}
            >
              {gap > 0
                ? "Try one change and see what moves."
                : "Room to build a cushion or adjust your goals."}
            </p>
          </div>
          <Button
            primary
            onClick={() => onView("careers")}
            style={{ boxSizing: "border-box", width: "100%", fontSize: 15 }}
          >
            Explore career paths
          </Button>
          <div
            style={{
              boxSizing: "border-box",
              fontSize: 11,
              color: C.muted,
              marginTop: 13,
              lineHeight: 1.7,
            }}
          >
            Based on an example {fmt(salary)}/year wage.{" "}
            <button
              onClick={() => onView("paycheck")}
              style={{
                boxSizing: "border-box",
                padding: 0,
                border: 0,
                background: "none",
                color: C.blue,
                fontFamily: "inherit",
                fontSize: 11,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Change the salary
            </button>
          </div>
        </section>
      </div>
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          borderTop: `1px solid ${C.line}`,
          borderBottom: `1px solid ${C.line}`,
          padding: "26px 0",
          marginTop: 32,
        }}
      >
        <div style={{ boxSizing: "border-box", flex: "1 1 330px" }}>
          <h2
            style={{
              boxSizing: "border-box",
              fontSize: 20,
              letterSpacing: -0.5,
              margin: "0 0 7px",
            }}
          >
            A small change. A different possibility.
          </h2>
          <p
            style={{
              boxSizing: "border-box",
              fontSize: 13,
              color: C.muted,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Try a different choice to see how your monthly plan could look.
          </p>
        </div>
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Button onClick={() => onScenario("roommate")}>Try a roommate</Button>
          <Button onClick={() => onScenario("family")}>
            Compare living with family
          </Button>
        </div>
      </div>
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
          padding: "25px 0 0",
        }}
      >
        <div>
          <h2
            style={{
              boxSizing: "border-box",
              fontSize: 20,
              letterSpacing: -0.5,
              margin: "0 0 6px",
            }}
          >
            What would you change first, and why?
          </h2>
          <p
            style={{
              boxSizing: "border-box",
              fontSize: 13,
              color: C.muted,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Think about your priorities, your options, and what matters most to
            you.
          </p>
        </div>
        <Button
          onClick={onPrint}
          style={{
            boxSizing: "border-box",
            border: 0,
            padding: "8px 0",
            fontWeight: 500,
          }}
        >
          Print my summary
        </Button>
      </div>
      <p
        style={{
          boxSizing: "border-box",
          fontSize: 11,
          color: C.muted,
          lineHeight: 1.8,
          margin: "22px 0 0",
        }}
      >
        Classroom estimates, not quotes or guarantees. Single-filer 2024 tax
        model, before credits.{" "}
        <button
          onClick={() => onView("sources")}
          style={{
            boxSizing: "border-box",
            border: 0,
            padding: 0,
            background: "none",
            fontFamily: "inherit",
            fontSize: 11,
            color: C.blue,
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          See assumptions and sources
        </button>
      </p>
    </>
  );
}
function PageTitle({ eyebrowText, title, body }) {
  return (
    <div style={{ boxSizing: "border-box", marginBottom: 32 }}>
      <div style={{ boxSizing: "border-box", ...eyebrow, marginBottom: 12 }}>
        {eyebrowText}
      </div>
      <h1
        style={{
          boxSizing: "border-box",
          fontSize: "clamp(32px, 4.2vw, 48px)",
          lineHeight: 1.13,
          letterSpacing: -1.9,
          margin: "0 0 14px",
          fontWeight: 760,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          boxSizing: "border-box",
          color: C.muted,
          fontSize: 15,
          lineHeight: 1.8,
          maxWidth: 720,
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  );
}
function RiskFlags({ a }) {
  const h = find(HOUSING, a.housing),
    t = find(TRANS, a.trans);
  const active = [
    h?.ins === "renters" && a.rOut && "rOut",
    h?.ins === "homeowners" && a.hOut && "hOut",
    t?.car && a.ciOut && "ciOut",
    t?.car && a.crOut && "crOut",
    a.hlOut && "hlOut",
  ].filter(Boolean);
  if (!active.length) return null;
  return (
    <section style={{ boxSizing: "border-box", marginBottom: 28 }}>
      <h2 style={{ boxSizing: "border-box", fontSize: 19 }}>
        Costs you left out
      </h2>
      <Note tone="amber">
        Removing a payment from a scenario does not remove the financial or
        legal risk. Penalties and uninsured losses are not added to this budget.
      </Note>
      {active.map((key) => (
        <p
          key={key}
          style={{
            boxSizing: "border-box",
            fontSize: 13,
            lineHeight: 1.8,
            color: C.muted,
          }}
        >
          <strong style={{ boxSizing: "border-box", color: C.ink }}>
            {
              {
                rOut: "Renter's insurance",
                hOut: "Homeowner's insurance",
                ciOut: "Car insurance",
                crOut: "Registration",
                hlOut: "Health coverage",
              }[key]
            }
            :{" "}
          </strong>
          {CONSEQUENCES[key][1]}
        </p>
      ))}
    </section>
  );
}
function BudgetPage({ a, b, small }) {
  return (
    <>
      <PageTitle
        eyebrowText="Your monthly plan"
        title="Know where every dollar goes."
        body="One itemized budget powers every comparison. Shared bills reflect your household choices; savings are calculated from the take-home pay needed."
      />
      <RiskFlags a={a} />
      <div
        style={{
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: small ? "1fr" : "1.5fr 1fr",
          gap: 48,
        }}
      >
        <section>
          {b.lines.map((line, i) => (
            <div
              key={i}
              style={{
                boxSizing: "border-box",
                display: "flex",
                justifyContent: "space-between",
                gap: 24,
                padding: "13px 0",
                borderBottom: `1px solid ${C.line}`,
                fontSize: 14,
              }}
            >
              <span
                style={{
                  boxSizing: "border-box",
                  color: line.group === "savings" ? C.green : C.muted,
                }}
              >
                {line.label}
              </span>
              <strong
                style={{
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                }}
              >
                {fmt(line.amount)}
              </strong>
            </div>
          ))}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              justifyContent: "space-between",
              padding: "20px 0",
              fontSize: 20,
              fontWeight: 750,
            }}
          >
            <span>Monthly total</span>
            <span>{fmt(b.total)}</span>
          </div>
          <Note>
            Displayed amounts are rounded; calculations keep full precision, so
            rounded line items may differ from the total by a dollar or two.
          </Note>
        </section>
        <aside>
          <div
            style={{
              boxSizing: "border-box",
              background: C.soft,
              padding: 26,
              borderRadius: 9,
            }}
          >
            <div style={eyebrow}>A wage to explore</div>
            <div
              style={{
                boxSizing: "border-box",
                fontSize: 42,
                color: C.blue,
                fontWeight: 750,
                letterSpacing: -2,
                marginTop: 12,
              }}
            >
              {fmt(b.salary)}
              <span
                style={{
                  boxSizing: "border-box",
                  fontSize: 14,
                  color: C.muted,
                  letterSpacing: 0,
                }}
              >
                {" "}
                / year
              </span>
            </div>
            <p
              style={{
                boxSizing: "border-box",
                fontSize: 13,
                color: C.muted,
                lineHeight: 1.8,
              }}
            >
              About {fmt(b.salary / 2080)}/hour at 40 paid hours per week, 52
              weeks a year. Not every job offers those hours.
            </p>
            <div
              style={{
                boxSizing: "border-box",
                fontSize: 13,
                lineHeight: 2,
                color: C.muted,
              }}
            >
              Living expenses: <strong>{fmt(b.expenses)}/month</strong>
              <br />
              Savings target: <strong>{fmt(b.savings)}/month</strong>
              {b.sideNet > 0 && (
                <>
                  <br />
                  Assumed net side income:{" "}
                  <strong>{fmt(b.sideNet)}/month</strong>
                </>
              )}
            </div>
          </div>
          <p
            style={{
              boxSizing: "border-box",
              fontSize: 12,
              lineHeight: 1.8,
              color: C.muted,
            }}
          >
            Salary needed uses the historical 2024 single-filer model, before
            credits and payroll benefit deductions. Actual withholding and
            take-home pay will differ.
          </p>
        </aside>
      </div>
    </>
  );
}
function CareersPage({ a, b, small, onSalary }) {
  const careers = matchCareers(a.pers);
  return (
    <>
      <PageTitle
        eyebrowText="Possibilities, not predictions"
        title="Find a direction worth exploring."
        body="These six paths connect with your interests. The pay figures are classroom scenarios to test, not verified local starting wages, guaranteed earnings, or predictions about your ability."
      />
      <Note style={{ boxSizing: "border-box", marginBottom: 28 }}>
        Your plan needs about {fmt(b.salary)} in annual wages
        {b.sideNet > 0 ? ", alongside your assumed side income" : ""}. Starting
        pay, experienced pay, and self-employed business revenue are different
        things. Test a real job posting's wage when you have one.
      </Note>
      <div
        style={{
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: small ? "1fr" : "1fr 1fr",
          gap: "0 36px",
        }}
      >
        {careers.map((c, i) => {
          const net = takeHome(c.entry) / 12 + b.sideNet,
            gap = b.total - net;
          return (
            <article
              key={c.title}
              style={{
                boxSizing: "border-box",
                padding: "26px 0",
                borderTop: `1px solid ${C.line}`,
              }}
            >
              <div
                style={{
                  boxSizing: "border-box",
                  ...eyebrow,
                  color: C.blue,
                  marginBottom: 10,
                }}
              >
                Interest connection {String(i + 1).padStart(2, "0")}
              </div>
              <h2
                style={{
                  boxSizing: "border-box",
                  fontSize: 23,
                  letterSpacing: -0.8,
                  margin: "0 0 10px",
                }}
              >
                {c.title}
              </h2>
              <p
                style={{
                  boxSizing: "border-box",
                  fontSize: 13,
                  color: C.muted,
                  lineHeight: 1.7,
                  minHeight: 44,
                }}
              >
                {c.path}
              </p>
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  gap: 30,
                  flexWrap: "wrap",
                  margin: "20px 0",
                }}
              >
                <div>
                  <div
                    style={{
                      boxSizing: "border-box",
                      fontSize: 11,
                      color: C.muted,
                      marginBottom: 5,
                    }}
                  >
                    Example first-job wage
                  </div>
                  <strong
                    style={{
                      boxSizing: "border-box",
                      fontSize: 25,
                      letterSpacing: -0.8,
                    }}
                  >
                    {fmt(c.entry)}
                    <span
                      style={{
                        boxSizing: "border-box",
                        fontSize: 12,
                        color: C.muted,
                        fontWeight: 450,
                      }}
                    >
                      /yr
                    </span>
                  </strong>
                </div>
                <div>
                  <div
                    style={{
                      boxSizing: "border-box",
                      fontSize: 11,
                      color: C.muted,
                      marginBottom: 5,
                    }}
                  >
                    Example with experience
                  </div>
                  <strong
                    style={{
                      boxSizing: "border-box",
                      fontSize: 25,
                      letterSpacing: -0.8,
                    }}
                  >
                    {fmt(c.later)}
                    <span
                      style={{
                        boxSizing: "border-box",
                        fontSize: 12,
                        color: C.muted,
                        fontWeight: 450,
                      }}
                    >
                      /yr
                    </span>
                  </strong>
                </div>
              </div>
              <p
                style={{
                  boxSizing: "border-box",
                  fontSize: 13,
                  color: gap > 0 ? C.amber : C.green,
                  lineHeight: 1.7,
                }}
              >
                {gap > 0
                  ? `${fmt(gap)}/month gap at the example first-job wage.`
                  : `${fmt(-gap)}/month left after your plan at the example first-job wage.`}
              </p>
              <div
                style={{
                  boxSizing: "border-box",
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: C.muted,
                  marginBottom: 18,
                }}
              >
                <strong style={{ boxSizing: "border-box", color: C.ink }}>
                  A first step today:{" "}
                </strong>
                {c.first}
              </div>
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button onClick={() => onSalary(c.entry)}>
                  Test this wage
                </Button>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    boxSizing: "border-box",
                    fontSize: 12,
                    color: C.blue,
                    lineHeight: 1.7,
                  }}
                >
                  Research the occupation at BLS
                </a>
              </div>
            </article>
          );
        })}
      </div>
      <Note tone="amber" style={{ boxSizing: "border-box", marginTop: 28 }}>
        The links describe occupations. They do not verify the example salaries
        above. Some titles cover several occupations, and local pay, training
        requirements, schedules, and hiring conditions vary. There are no
        “likelihood of success” scores in this version.
      </Note>
    </>
  );
}
function PaycheckPage({ a, b, salary, setSalary, small }) {
  const taxes = taxBreakdown(salary),
    net = takeHome(salary) / 12,
    available = net + b.sideNet,
    gap = available - b.total;
  const deductions = [
    ["Federal income tax", taxes.federal],
    ["California income tax", taxes.california],
    ["Social Security", taxes.socialSecurity],
    ["Medicare", taxes.medicare],
    ["California SDI", taxes.sdi],
  ];
  return (
    <>
      <PageTitle
        eyebrowText="From gross to take-home"
        title="What could your paycheck cover?"
        body="Enter an annual wage or convert an hourly offer. See a simplified monthly paystub and compare it with the life you planned."
      />
      <div
        style={{
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: small ? "1fr" : "1fr 1.1fr",
          gap: small ? 30 : 70,
        }}
      >
        <section>
          <Field
            label="Annual gross wages"
            help="Before income taxes and payroll deductions."
          >
            <input
              type="number"
              min="0"
              max="10000000"
              step="1000"
              value={salary}
              onChange={(e) => setSalary(number(e.target.value))}
              style={inputStyle}
            />
          </Field>
          <Field
            label="Or enter an hourly wage"
            help="Assumes 2,080 paid hours a year. Real schedules and unpaid time can change this."
          >
            <input
              type="number"
              min="0"
              max="4807"
              step="0.5"
              value={Math.round((salary / 2080) * 100) / 100}
              onChange={(e) =>
                setSalary(Math.round(number(e.target.value, 4807) * 2080))
              }
              style={inputStyle}
            />
          </Field>
          <Note>
            Health premiums in your plan remain a budget expense here; they are
            not subtracted twice from this paycheck. Actual benefits may be
            deducted before tax, which this simplified model does not calculate.
          </Note>
          {a.health === "medi_cal" && !a.hlOut && (
            <Note
              tone="amber"
              style={{ boxSizing: "border-box", marginTop: 16 }}
            >
              You selected Medi-Cal. Changing wages could change eligibility or
              assistance. This model keeps your selection and does not decide
              eligibility.
            </Note>
          )}
          <div
            style={{
              boxSizing: "border-box",
              marginTop: 28,
              borderTop: `1px solid ${C.line}`,
              paddingTop: 22,
            }}
          >
            <h2
              style={{
                boxSizing: "border-box",
                fontSize: 19,
                letterSpacing: -0.4,
              }}
            >
              Compared with your monthly plan
            </h2>
            <div
              style={{
                boxSizing: "border-box",
                fontSize: 42,
                fontWeight: 750,
                letterSpacing: -1.8,
                color: gap >= 0 ? C.green : C.amber,
              }}
            >
              {fmt(Math.abs(gap))}
            </div>
            <p
              style={{
                boxSizing: "border-box",
                color: C.muted,
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              {gap >= 0
                ? "Left after living expenses and your savings target."
                : "Still needed each month to cover living expenses and your savings target."}
              {b.sideNet > 0 &&
                ` Includes ${fmt(b.sideNet)} in assumed net side income.`}
            </p>
          </div>
        </section>
        <section
          aria-label="Simplified monthly paystub"
          style={{
            boxSizing: "border-box",
            borderTop: `4px solid ${C.ink}`,
            background: C.soft,
            padding: small ? 24 : 32,
          }}
        >
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              marginBottom: 28,
            }}
          >
            <div>
              <div style={eyebrow}>Example paystub</div>
              <div
                style={{
                  boxSizing: "border-box",
                  fontSize: 12,
                  color: C.muted,
                  marginTop: 8,
                }}
              >
                Monthly equivalent · 2024 model
              </div>
            </div>
            <div
              style={{ boxSizing: "border-box", fontSize: 12, fontWeight: 650 }}
            >
              {a.name}
            </div>
          </div>
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 17,
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            <span>Gross wages</span>
            <span>{fmt(salary / 12)}</span>
          </div>
          <div
            style={{ boxSizing: "border-box", ...eyebrow, marginBottom: 10 }}
          >
            Estimated taxes, before credits
          </div>
          {deductions.map(([label, amount]) => (
            <div
              key={label}
              style={{
                boxSizing: "border-box",
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                padding: "12px 0",
                borderBottom: `1px solid ${C.line}`,
                fontSize: 13,
                color: C.muted,
              }}
            >
              <span>{label}</span>
              <span style={{ boxSizing: "border-box", whiteSpace: "nowrap" }}>
                −{fmt(amount / 12)}
              </span>
            </div>
          ))}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 20,
              paddingTop: 24,
            }}
          >
            <strong>Estimated take-home</strong>
            <strong
              style={{
                boxSizing: "border-box",
                fontSize: 30,
                letterSpacing: -1,
                color: C.blue,
              }}
            >
              {fmt(net)}
            </strong>
          </div>
          <p
            style={{
              boxSizing: "border-box",
              fontSize: 11,
              color: C.muted,
              lineHeight: 1.7,
              marginBottom: 0,
            }}
          >
            Not an employer paystub or tax advice. Excludes credits, retirement
            contributions, garnishments, union dues, and benefit deductions.
            This is an annual tax estimate divided by 12, not an exact payroll
            withholding calculation.
          </p>
        </section>
      </div>
    </>
  );
}
export function scenarioBudget(a, scenario, contribution = 300) {
  if (scenario === "family")
    return budget({
      ...a,
      housing: "family",
      roommate: false,
      homeContribution: number(contribution),
      rOut: false,
      hOut: false,
    });
  if (scenario === "roommate")
    return budget({
      ...a,
      housing: "2br",
      roommate: true,
      htype: a.htype === "partner_work" ? "solo" : a.htype,
      rOut: false,
      hOut: false,
    });
  return budget(a);
}
function WhatIfPage({ a, b, scenario, setScenario, small }) {
  const [contribution, setContribution] = useState(300);
  const other = scenarioBudget(a, scenario, contribution),
    saving = b.total - other.total;
  const options = [
    {
      id: "roommate",
      l: "Share a two-bedroom rental",
      note: "Use the $2,100 example rent, split two ways, with shared utilities.",
    },
    {
      id: "family",
      l: "Live with family",
      note: "Replace rent and housing insurance with a contribution at home; other choices stay the same.",
    },
  ];
  return (
    <>
      <PageTitle
        eyebrowText="A different possibility"
        title="Change one choice. See the difference."
        body="Compare an alternative without overwriting your plan. These are possibilities to discuss, not assumptions that every living arrangement is available to everyone."
      />
      <div
        style={{
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: small ? "1fr" : "1fr 1fr",
          gap: small ? 30 : 60,
        }}
      >
        <section>
          <ChoiceList items={options} value={scenario} onChange={setScenario} />
          {scenario === "family" && (
            <Field
              label="Monthly contribution at home"
              help="Food, phone, and your selected utilities stay in the plan. Change those separately if someone else covers them."
            >
              <input
                type="number"
                min="0"
                max="100000"
                value={contribution}
                onChange={(e) =>
                  setContribution(number(e.target.value, 100000))
                }
                style={inputStyle}
              />
            </Field>
          )}
          {scenario === "roommate" && (
            <Note>
              This models one other person sharing rent and shared utilities.
              Food, personal costs, health premiums, and child costs stay yours.
              If you chose a working partner, this scenario replaces that
              housing-sharing arrangement rather than dividing costs twice.
            </Note>
          )}
        </section>
        <section>
          <div
            style={{
              boxSizing: "border-box",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              paddingBottom: 25,
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            <div>
              <div
                style={{
                  boxSizing: "border-box",
                  fontSize: 12,
                  color: C.muted,
                  marginBottom: 8,
                }}
              >
                Your original plan
              </div>
              <strong
                style={{
                  boxSizing: "border-box",
                  fontSize: small ? 30 : 42,
                  letterSpacing: -1.7,
                }}
              >
                {fmt(b.total)}
              </strong>
              <div
                style={{
                  boxSizing: "border-box",
                  fontSize: 12,
                  color: C.muted,
                  marginTop: 5,
                }}
              >
                per month
              </div>
            </div>
            <div>
              <div
                style={{
                  boxSizing: "border-box",
                  fontSize: 12,
                  color: C.muted,
                  marginBottom: 8,
                }}
              >
                The alternative
              </div>
              <strong
                style={{
                  boxSizing: "border-box",
                  fontSize: small ? 30 : 42,
                  letterSpacing: -1.7,
                  color: C.blue,
                }}
              >
                {fmt(other.total)}
              </strong>
              <div
                style={{
                  boxSizing: "border-box",
                  fontSize: 12,
                  color: C.muted,
                  marginTop: 5,
                }}
              >
                per month
              </div>
            </div>
          </div>
          <div
            style={{
              boxSizing: "border-box",
              fontSize: 48,
              fontWeight: 750,
              letterSpacing: -2,
              color: saving >= 0 ? C.green : C.amber,
              marginTop: 26,
            }}
          >
            {fmt(Math.abs(saving))}
          </div>
          <p
            style={{
              boxSizing: "border-box",
              fontSize: 15,
              color: C.muted,
              lineHeight: 1.8,
              marginTop: 5,
            }}
          >
            {saving >= 0 ? "less" : "more"} needed each month, including the
            adjusted savings goal.
          </p>
          <div
            style={{
              boxSizing: "border-box",
              paddingTop: 20,
              borderTop: `1px solid ${C.line}`,
              fontSize: 14,
              lineHeight: 1.8,
              color: C.muted,
            }}
          >
            Example annual wages needed:{" "}
            <strong style={{ boxSizing: "border-box", color: C.ink }}>
              {fmt(other.salary)}
            </strong>
            <br />
            Your selected savings rate:{" "}
            <strong style={{ boxSizing: "border-box", color: C.ink }}>
              {Math.round(other.rate * 100)}%
            </strong>
          </div>
        </section>
      </div>
      <div
        style={{
          boxSizing: "border-box",
          marginTop: 40,
          paddingTop: 24,
          borderTop: `1px solid ${C.line}`,
        }}
      >
        <h2 style={{ boxSizing: "border-box", fontSize: 20 }}>
          What does this choice make possible, and what does it ask of you?
        </h2>
        <p
          style={{
            boxSizing: "border-box",
            fontSize: 14,
            lineHeight: 1.8,
            color: C.muted,
            maxWidth: 740,
          }}
        >
          Consider privacy, safety, location, transportation, responsibilities,
          and the people involved. The cheapest option is not automatically the
          best option for your situation.
        </p>
      </div>
    </>
  );
}
function SourcesPage() {
  const links = [
    [
      "IRS: 2024 federal adjustments",
      "https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024",
    ],
    [
      "California FTB: 2024 tax rate schedules",
      "https://www.ftb.ca.gov/forms/2024/2024-540-tax-rate-schedules.pdf",
    ],
    [
      "California FTB: standard deductions",
      "https://www.ftb.ca.gov/file/personal/deductions/index.html",
    ],
    [
      "SSA: contribution and benefit base",
      "https://www.ssa.gov/oact/cola/cbb.html",
    ],
    [
      "California EDD: payroll taxes",
      "https://edd.ca.gov/en/payroll_taxes/what_are_state_payroll_taxes/",
    ],
    ["BLS Occupational Outlook Handbook", "https://www.bls.gov/ooh/"],
    [
      "California EDD labor market information",
      "https://labormarketinfo.edd.ca.gov/",
    ],
  ];
  return (
    <>
      <PageTitle
        eyebrowText="Read the fine print, in plain language"
        title="Useful estimates. Visible assumptions."
        body="This is a classroom conversation starter, not a current cost-of-living database, a benefits determination, an insurance quote, or tax advice."
      />
      <div style={{ boxSizing: "border-box", maxWidth: 850 }}>
        {[
          [
            "Prices are planning scenarios, not verified current averages.",
            "Rent, food, childcare, insurance, wages, and the other amounts are classroom estimates from the original tool or illustrative additions. They have not been checked against current Perris listings or quotes. Insurance risk-area tiers are examples, not an underwriting model. Check real listings, multiple quotes, and actual job postings before relying on any figure.",
          ],
          [
            "The tax model uses 2024 rules, before credits.",
            "Federal single deduction: $14,600. California single deduction: $5,540. The model uses progressive federal and CA brackets, Social Security at 6.2% up to $168,600, Medicare at 1.45% plus 0.9% above $200,000, and 2024 CA SDI at 1.1% without a wage cap. It includes CA's additional 1% tax on taxable income above $1 million, but excludes personal exemption and other credits, itemized deductions, and benefit deductions. Family choices do not change filing status. These historical rules do not represent a verified 2026 paycheck.",
          ],
          [
            "Roommates and working partners share selected costs.",
            "Rent or mortgage, property tax, home maintenance, internet, water/gas, and electricity are divided between two when a working partner is selected. A roommate only splits rented housing and shared utilities. Personal insurance, phone, food, and child costs stay assigned to you. A stay-at-home partner adds a second adult food budget and assumes no paid daycare. Partner healthcare and many other partner costs are not modeled, so this is not a complete household budget.",
          ],
          [
            "Savings is a share of required take-home.",
            "Required take-home equals living expenses divided by (1 minus the savings rate). A 10% target on $2,970 of expenses requires $3,300 take-home and $330 savings. Loans are modeled at 6.5% over 120 monthly payments when selected. Side income keeps 75% after a simple reserve; actual self-employment taxes and business expenses are not calculated.",
          ],
          [
            "Career matches connect interests, not aptitude or outcomes.",
            "The six-question activity is not a validated assessment. It omits the Conventional category of the full Holland framework. Matching uses your interest answers only, not salary or assumptions about your academic ability. Pay examples are scenarios, not verified entry-level or experienced wages. There are no success probabilities, guaranteed job placements, or guaranteed raises. Combined titles may cover several BLS occupations.",
          ],
          [
            "Some large real-life costs are outside the monthly plan.",
            "Moving deposits, emergency medical bills, benefit eligibility changes, home closing costs, parking, tolls, and unpaid time are not automatically added. Savings set aside for repairs or other goals can overlap if you select multiple reserves. Read the selected line items, then compare the result with the details of your own situation.",
          ],
          [
            "Your answers stay in this tab.",
            "There is no account, tracking, or upload of your answers. Refreshing or closing the tab clears the plan. A first name or nickname is enough. Use the print summary to keep a copy.",
          ],
        ].map(([title, body]) => (
          <section
            key={title}
            style={{
              boxSizing: "border-box",
              padding: "22px 0",
              borderTop: `1px solid ${C.line}`,
            }}
          >
            <h2
              style={{
                boxSizing: "border-box",
                fontSize: 20,
                letterSpacing: -0.4,
                margin: "0 0 10px",
              }}
            >
              {title}
            </h2>
            <p
              style={{
                boxSizing: "border-box",
                fontSize: 14,
                lineHeight: 1.9,
                color: C.muted,
                margin: 0,
              }}
            >
              {body}
            </p>
          </section>
        ))}
        <section
          style={{
            boxSizing: "border-box",
            borderTop: `1px solid ${C.line}`,
            paddingTop: 24,
          }}
        >
          <h2 style={{ boxSizing: "border-box", fontSize: 21 }}>
            Official references for the next fact-check
          </h2>
          <p
            style={{
              boxSizing: "border-box",
              fontSize: 13,
              lineHeight: 1.8,
              color: C.muted,
            }}
          >
            Use these official references to check the assumptions. The figures
            in this activity are teaching scenarios, not verified current local
            prices or wages.
          </p>
          {links.map(([label, url]) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{
                boxSizing: "border-box",
                display: "block",
                padding: "10px 0",
                fontSize: 14,
                color: C.blue,
                lineHeight: 1.7,
              }}
            >
              {label}
            </a>
          ))}
        </section>
      </div>
    </>
  );
}

function PrintSummary({ a, b, salary }) {
  const matches = matchCareers(a.pers),
    gap = takeHome(salary) / 12 + b.sideNet - b.total;
  return (
    <article
      style={{
        boxSizing: "border-box",
        fontFamily: "system-ui,sans-serif",
        color: "#101b32",
        background: "#fff",
        fontSize: 11,
        maxWidth: 710,
        margin: "0 auto",
        padding: 15,
        lineHeight: 1.5,
      }}
    >
      <div style={{ boxSizing: "border-box", ...eyebrow, fontSize: 9 }}>
        What Will Your Life Cost? · A student guide
      </div>
      <h1
        style={{
          boxSizing: "border-box",
          fontSize: 29,
          letterSpacing: -1,
          margin: "12px 0 5px",
        }}
      >
        {a.name}'s next chapter
      </h1>
      <p
        style={{ boxSizing: "border-box", margin: "0 0 20px", color: C.muted }}
      >
        A snapshot of a possible future, not a prediction. Grade {a.grade} ·{" "}
        {new Date().toLocaleDateString("en-US", {
          timeZone: "America/Los_Angeles",
        })}
      </p>
      <div
        style={{
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 20,
          borderTop: `2px solid ${C.ink}`,
          borderBottom: `1px solid ${C.line}`,
          padding: "16px 0",
        }}
      >
        {[
          ["Monthly plan", fmt(b.total)],
          ["Annual wages needed", fmt(b.salary)],
          ["Hourly equivalent", fmt(b.salary / 2080)],
        ].map(([label, value]) => (
          <div key={label}>
            <div
              style={{ boxSizing: "border-box", fontSize: 10, color: C.muted }}
            >
              {label}
            </div>
            <strong
              style={{
                boxSizing: "border-box",
                fontSize: 23,
                letterSpacing: -0.8,
              }}
            >
              {value}
            </strong>
          </div>
        ))}
      </div>
      <div
        style={{
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 35,
          marginTop: 22,
        }}
      >
        <section>
          <h2 style={{ boxSizing: "border-box", fontSize: 15 }}>
            My monthly plan
          </h2>
          {GROUPS.map((g, i) => (
            <div
              key={g.name}
              style={{
                boxSizing: "border-box",
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              <span>{g.name}</span>
              <strong>{fmt(b.groups[i])}</strong>
            </div>
          ))}
          <p>
            Includes a {Math.round(b.rate * 100)}% savings target.
            {b.sideNet > 0 &&
              ` Assumes ${fmt(b.sideNet)}/month net side income.`}
          </p>
        </section>
        <section>
          <h2 style={{ boxSizing: "border-box", fontSize: 15 }}>
            My biggest choices
          </h2>
          <p>
            Housing: {find(HOUSING, a.housing)?.l}
            {a.roommate ? ", with one roommate" : ""}
            <br />
            Food: {find(FOOD, a.food)?.l}
            <br />
            Transport: {find(TRANS, a.trans)?.l}
            <br />
            Household: {find(HTYPE, a.htype)?.l}
            <br />
            Children: {find(KIDS, a.kids)?.l}
            <br />
            Student loans:{" "}
            {fmt(["trade", "cc", "4year"].includes(a.plan) ? a.loan : 0)}{" "}
            borrowed
          </p>
        </section>
      </div>
      <section
        style={{
          boxSizing: "border-box",
          borderTop: `1px solid ${C.line}`,
          padding: "10px 0",
          marginTop: 10,
          breakInside: "avoid",
        }}
      >
        <h2 style={{ boxSizing: "border-box", fontSize: 15 }}>
          My starting-pay reality check
        </h2>
        <p>
          At {fmt(salary)}/year gross wages, estimated monthly take-home is{" "}
          {fmt(takeHome(salary) / 12)}
          {b.sideNet > 0
            ? `, plus ${fmt(b.sideNet)} assumed net side income`
            : ""}
          . That leaves a {fmt(Math.abs(gap))} monthly{" "}
          {gap < 0 ? "gap" : "surplus"} compared with my plan.
        </p>
      </section>
      <section
        style={{
          boxSizing: "border-box",
          borderTop: `1px solid ${C.line}`,
          padding: "10px 0",
          breakInside: "avoid",
        }}
      >
        <h2 style={{ boxSizing: "border-box", fontSize: 15 }}>
          Three directions to explore
        </h2>
        {matches.slice(0, 3).map((c) => (
          <p key={c.title} style={{ boxSizing: "border-box", margin: "7px 0" }}>
            <strong>{c.title}: </strong>
            {c.first}
          </p>
        ))}
      </section>
      <section
        style={{
          boxSizing: "border-box",
          borderTop: `1px solid ${C.line}`,
          paddingTop: 12,
          breakInside: "avoid",
        }}
      >
        <h2 style={{ boxSizing: "border-box", fontSize: 15 }}>
          What would I change first, and why?
        </h2>
        <p
          style={{
            boxSizing: "border-box",
            borderBottom: `1px solid ${C.line}`,
            height: 32,
          }}
        />
        <p
          style={{
            boxSizing: "border-box",
            borderBottom: `1px solid ${C.line}`,
            height: 22,
          }}
        />
      </section>
      <p
        style={{
          boxSizing: "border-box",
          fontSize: 9,
          color: C.muted,
          lineHeight: 1.7,
          marginTop: 22,
        }}
      >
        Classroom estimates, not verified current local prices, quotes, or
        guaranteed wages. Historical 2024 single-filer tax model before credits
        and benefits. Assumes 2,080 paid hours/year. Some household and medical
        costs are excluded. Review the app's assumptions before relying on the
        plan.
      </p>
      {[
        a.rOut && "Renter's insurance",
        a.hOut && "Homeowner's insurance",
        a.ciOut && "Car insurance",
        a.crOut && "Registration",
        a.hlOut && "Health insurance",
      ].filter(Boolean).length > 0 && (
        <p style={{ boxSizing: "border-box", fontSize: 10 }}>
          Removed from scenario:{" "}
          {[
            a.rOut && "renter's insurance",
            a.hOut && "homeowner's insurance",
            a.ciOut && "car insurance",
            a.crOut && "registration",
            a.hlOut && "health insurance",
          ]
            .filter(Boolean)
            .join(", ")}
          . Financial or legal risks remain; see the itemized budget.
        </p>
      )}
    </article>
  );
}
function Results({ a, onEdit, onNew, small, isExample }) {
  const [view, setView] = useState("overview"),
    [scenario, setScenario] = useState("roommate"),
    [salary, setSalary] = useState(50000);
  const b = useMemo(() => budget(a), [a]),
    screen = useRef(null),
    print = useRef(null),
    heading = useRef(null);
  useEffect(() => {
    const before = () => {
      if (screen.current) screen.current.style.display = "none";
      if (print.current) print.current.style.display = "block";
    };
    const after = () => {
      if (screen.current) screen.current.style.display = "block";
      if (print.current) print.current.style.display = "none";
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
  const show = (next) => {
    setView(next);
    window.scrollTo(0, 0);
    requestAnimationFrame(() => heading.current?.focus());
  };
  const printPlan = () => window.print();
  const nav = [
    ["overview", "Overview"],
    ["budget", "Your budget"],
    ["careers", "Careers"],
    ["paycheck", "Paycheck"],
    ["whatif", "What-if"],
    ["sources", "Assumptions"],
  ];
  return (
    <>
      <div ref={screen}>
        <Header small={small}>
          <button
            type="button"
            onClick={onEdit}
            style={{
              boxSizing: "border-box",
              border: 0,
              borderLeft: small ? 0 : `1px solid ${C.line}`,
              padding: small ? "5px 0" : "5px 0 5px 20px",
              background: "none",
              color: C.blue,
              fontFamily: "inherit",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Edit my choices
          </button>
        </Header>
        <main
          ref={heading}
          tabIndex={-1}
          style={{
            boxSizing: "border-box",
            maxWidth: 1376,
            margin: "0 auto",
            padding: small ? "34px 20px 40px" : "43px 40px 42px",
            outline: "none",
          }}
        >
          {isExample && (
            <div
              style={{
                boxSizing: "border-box",
                fontSize: 11,
                color: C.blue,
                marginBottom: 22,
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  boxSizing: "border-box",
                  background: C.lightBlue,
                  padding: "5px 9px",
                  borderRadius: 4,
                  fontWeight: 650,
                }}
              >
                EXAMPLE PLAN
              </span>
              <span>Explore Alex's choices, then make your own.</span>
              <button
                onClick={onNew}
                style={{
                  boxSizing: "border-box",
                  background: "none",
                  border: 0,
                  color: C.blue,
                  textDecoration: "underline",
                  fontFamily: "inherit",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Build my plan
              </button>
            </div>
          )}
          {view !== "overview" && (
            <nav
              aria-label="Results"
              style={{
                boxSizing: "border-box",
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                borderBottom: `1px solid ${C.line}`,
                paddingBottom: 19,
                marginBottom: 34,
              }}
            >
              {nav.map(([id, title]) => (
                <Button
                  key={id}
                  onClick={() => show(id)}
                  aria-current={view === id ? "page" : undefined}
                  style={{
                    boxSizing: "border-box",
                    border: 0,
                    background: view === id ? C.lightBlue : "#fff",
                    color: view === id ? C.blue : C.muted,
                    padding: "8px 13px",
                    fontSize: 13,
                  }}
                >
                  {title}
                </Button>
              ))}
            </nav>
          )}
          {view === "overview" && (
            <Overview
              a={a}
              b={b}
              small={small}
              onView={show}
              onScenario={(s) => {
                setScenario(s);
                show("whatif");
              }}
              onPrint={printPlan}
              salary={salary}
              setSalary={setSalary}
            />
          )}
          {view === "budget" && <BudgetPage a={a} b={b} small={small} />}
          {view === "careers" && (
            <CareersPage
              a={a}
              b={b}
              small={small}
              onSalary={(s) => {
                setSalary(s);
                show("paycheck");
              }}
            />
          )}
          {view === "paycheck" && (
            <PaycheckPage
              a={a}
              b={b}
              salary={salary}
              setSalary={setSalary}
              small={small}
            />
          )}
          {view === "whatif" && (
            <WhatIfPage
              a={a}
              b={b}
              scenario={scenario}
              setScenario={setScenario}
              small={small}
            />
          )}
          {view === "sources" && <SourcesPage />}
          <nav
            aria-label="Explore your results"
            style={{
              boxSizing: "border-box",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
              borderTop: `1px solid ${C.line}`,
              paddingTop: 24,
              marginTop: view === "overview" ? 32 : 46,
            }}
          >
            {view === "overview" ? (
              nav
                .filter(([id]) => id !== "overview")
                .map(([id, title]) => (
                  <Button
                    key={id}
                    onClick={() => show(id)}
                    style={{
                      boxSizing: "border-box",
                      fontSize: 12,
                      padding: "9px 14px",
                    }}
                  >
                    {title}
                  </Button>
                ))
            ) : (
              <Button onClick={() => show("overview")}>Back to overview</Button>
            )}
            <Button
              onClick={onNew}
              style={{
                boxSizing: "border-box",
                marginLeft: small ? 0 : "auto",
                color: C.muted,
                border: 0,
                fontSize: 12,
              }}
            >
              Start a new plan
            </Button>
          </nav>
        </main>
      </div>
      <div ref={print} style={{ boxSizing: "border-box", display: "none" }}>
        <PrintSummary a={a} b={b} salary={salary} />
      </div>
    </>
  );
}
function Welcome({ small, onStart, onExample }) {
  const b = budget(DEMO);
  return (
    <>
      <Header small={small}>
        <span
          style={{
            boxSizing: "border-box",
            fontSize: 11,
            color: C.blue,
            fontWeight: 650,
          }}
        >
          Made for your next chapter
        </span>
      </Header>
      <main
        style={{
          boxSizing: "border-box",
          maxWidth: 1250,
          margin: "0 auto",
          padding: small ? "48px 20px" : "76px 40px 50px",
        }}
      >
        <div
          style={{
            boxSizing: "border-box",
            display: "grid",
            gridTemplateColumns: small ? "1fr" : "1.2fr 1fr",
            gap: small ? 40 : 84,
            alignItems: "center",
          }}
        >
          <section>
            <div
              style={{
                boxSizing: "border-box",
                ...eyebrow,
                color: C.blue,
                marginBottom: 22,
              }}
            >
              Your life. Your choices.
            </div>
            <h1
              style={{
                boxSizing: "border-box",
                fontSize: small ? 49 : 72,
                letterSpacing: small ? -2.7 : -4,
                lineHeight: 1.02,
                margin: "0 0 26px",
                fontWeight: 780,
              }}
            >
              A future you choose.
              <br />
              <span style={{ boxSizing: "border-box", color: C.blue }}>
                A plan you can build.
              </span>
            </h1>
            <p
              style={{
                boxSizing: "border-box",
                fontSize: 17,
                lineHeight: 1.85,
                color: C.muted,
                maxWidth: 490,
                margin: "0 0 30px",
              }}
            >
              Your place. Your ride. Your everyday life. Explore what it could
              cost, what a paycheck could cover, and the paths that interest
              you.
            </p>
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Button
                primary
                onClick={onStart}
                style={{
                  boxSizing: "border-box",
                  padding: "15px 24px",
                  fontSize: 15,
                }}
              >
                Build my plan
              </Button>
              <Button
                onClick={onExample}
                style={{
                  boxSizing: "border-box",
                  padding: "15px 24px",
                  fontSize: 15,
                }}
              >
                Explore an example
              </Button>
            </div>
            <p
              style={{
                boxSizing: "border-box",
                fontSize: 12,
                color: C.muted,
                lineHeight: 1.8,
                marginTop: 20,
              }}
            >
              13 short steps · About 10–15 minutes · No account needed
            </p>
          </section>
          <section
            aria-label="Example student budget"
            style={{
              boxSizing: "border-box",
              background: C.soft,
              padding: small ? 25 : 34,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={eyebrow}>A possible next chapter</span>
              <span
                style={{
                  boxSizing: "border-box",
                  fontSize: 11,
                  color: C.blue,
                  background: C.lightBlue,
                  padding: "5px 8px",
                  borderRadius: 4,
                }}
              >
                EXAMPLE
              </span>
            </div>
            <h2
              style={{
                boxSizing: "border-box",
                fontSize: 21,
                letterSpacing: -0.7,
                margin: "22px 0 8px",
              }}
            >
              Alex's monthly plan
            </h2>
            <strong
              style={{
                boxSizing: "border-box",
                fontSize: small ? 60 : 72,
                letterSpacing: -3.5,
                fontWeight: 760,
                color: C.blue,
              }}
            >
              {fmt(b.total)}
            </strong>
            <span
              style={{ boxSizing: "border-box", fontSize: 14, color: C.muted }}
            >
              {" "}
              / month
            </span>
            <Spending b={b} small={true} />
            <p
              style={{
                boxSizing: "border-box",
                fontSize: 12,
                color: C.muted,
                lineHeight: 1.7,
                margin: "15px 0 0",
              }}
            >
              The same choices can lead to different possibilities. Try a change
              and see what moves.
            </p>
          </section>
        </div>
        <section
          style={{
            boxSizing: "border-box",
            display: "grid",
            gridTemplateColumns: small ? "1fr" : "1fr 1fr 1fr",
            gap: small ? 28 : 50,
            borderTop: `1px solid ${C.line}`,
            paddingTop: 34,
            marginTop: small ? 40 : 70,
          }}
        >
          {[
            [
              "01",
              "Picture your everyday",
              "Choose a place to live, a way to get around, and what matters to you.",
            ],
            [
              "02",
              "Meet the real numbers",
              "See the bills behind each choice and an estimate of the wages needed.",
            ],
            [
              "03",
              "Explore your possibilities",
              "Connect your interests to careers and try a different version of your plan.",
            ],
          ].map(([n, t, d]) => (
            <div key={n}>
              <span
                style={{ boxSizing: "border-box", ...eyebrow, color: C.blue }}
              >
                {n}
              </span>
              <h2
                style={{
                  boxSizing: "border-box",
                  fontSize: 18,
                  letterSpacing: -0.4,
                  margin: "12px 0 8px",
                }}
              >
                {t}
              </h2>
              <p
                style={{
                  boxSizing: "border-box",
                  fontSize: 13,
                  color: C.muted,
                  lineHeight: 1.85,
                  margin: 0,
                  maxWidth: 320,
                }}
              >
                {d}
              </p>
            </div>
          ))}
        </section>
        <p
          style={{
            boxSizing: "border-box",
            fontSize: 11,
            color: C.muted,
            lineHeight: 1.8,
            margin: "36px 0 0",
          }}
        >
          A classroom activity for exploring possibilities. Prices and wages are
          illustrative estimates; tax calculations use a historical 2024 model.
          Your answers stay in this tab and disappear on refresh.
        </p>
      </main>
    </>
  );
}
export default function App() {
  const small = useSmall();
  const [mode, setMode] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("example")
      ? "results"
      : "welcome",
  );
  const [isExample, setExample] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("example"),
  );
  const [a, setA] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("example")
      ? { ...DEMO }
      : { ...EMPTY },
  );
  const [step, setStep] = useState(0);
  const [decision, setDecision] = useState(null);
  useEffect(() => {
    const title = document.querySelector("main h1");
    if (title) {
      title.tabIndex = -1;
      title.style.outline = "none";
      title.focus();
    }
  }, [mode]);
  const update = (patch) => {
    setExample(false);
    setA((previous) => ({ ...previous, ...patch }));
  };
  const enter = (next) => {
    setMode(next);
    window.scrollTo(0, 0);
  };
  const start = () => {
    setExample(false);
    setA({ ...EMPTY });
    setStep(0);
    enter("wizard");
  };
  const newPlan = () => {
    if (isExample) start();
    else
      setDecision({
        title: "Start a new plan?",
        body: "This will clear your current answers. You can print your summary first if you want to keep a copy.",
        proceed: start,
      });
  };
  const example = () => {
    const load = () => {
      setExample(true);
      setA({ ...DEMO });
      enter("results");
    };
    if (a.name && !isExample)
      setDecision({
        title: "Explore the example?",
        body: "Alex's example will replace your current answers. Keep your plan if you want to continue working on it.",
        proceed: load,
      });
    else load();
  };
  return (
    <div
      style={{
        boxSizing: "border-box",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: C.ink,
        background: "#fff",
        minHeight: "100vh",
        lineHeight: 1.5,
      }}
    >
      {mode === "welcome" && (
        <Welcome
          small={small}
          onStart={() => {
            if (isExample) {
              start();
              return;
            }
            setStep(0);
            enter("wizard");
          }}
          onExample={example}
        />
      )}
      {mode === "wizard" && (
        <Wizard
          a={a}
          update={update}
          step={step}
          setStep={setStep}
          onFinish={() => enter("results")}
          onHome={() => enter("welcome")}
          small={small}
        />
      )}
      {mode === "results" && (
        <Results
          a={a}
          onEdit={() => {
            setStep(0);
            enter("wizard");
          }}
          onNew={newPlan}
          small={small}
          isExample={isExample}
        />
      )}
      {decision && (
        <Modal
          title={decision.title}
          body={decision.body}
          cancelLabel="Keep my plan"
          confirmLabel="Continue"
          onClose={() => setDecision(null)}
          onConfirm={() => {
            decision.proceed();
            setDecision(null);
          }}
        />
      )}
    </div>
  );
}
