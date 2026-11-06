import { useState, useMemo, useEffect, useRef, useId } from "react";

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
const hourly = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
    id: "included",
    l: "Meals covered or included",
    cost: 0,
    note: "For example, included in your contribution at home. The cost is paid elsewhere.",
  },
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
    id: "paid",
    l: "Paid-off / Hand-me-down Car",
    cost: 0,
    note: "No loan payment; insurance, fuel, registration, and repairs still count",
    car: true,
    ct: "beater",
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
    note: "Skincare, gym, salon, spa. Gym is counted once if also selected under Leisure.",
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
    note: "Choose your bill share; household mode can include both incomes",
  },
  {
    id: "partner_home",
    l: "Stay-at-home partner",
    e: "🏡",
    note: "Start with no paid daycare and include both adults’ listed costs",
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
  budgetMode: "personal",
  personalHomeShare: null,
  householdHomeShare: null,
  partnerSalary: 0,
  partnerFood: null,
  partnerTransport: null,
  partnerHealth: null,
  partnerPersonal: null,
  childSharePercent: null,
  childcareBudget: null,
  childSuppliesBudget: null,
  medicalReserve: 0,
  hustleMode: "net",
  comparisonSalary: null,
  comparisonCareer: "",
  comparisonHours: 40,
  comparisonWeeks: 52,
  whatIfScenario: "roommate",
  whatIfContribution: null,
  quizIndex: 0,
  quizAutoAdvance: true,
  resultView: "overview",
  predictionSalary: null,
  originalPlan: null,
  jobTitle: "",
  jobSource: "",
  jobUrl: "",
  jobReviewed: "",
  jobPay: null,
  jobPayBasis: "hourly",
  jobHours: 40,
  jobWeeks: 52,
  jobSchedule: "assumed",
  jobTraining: "",
  jobBenefits: "",
  startHousing: null,
  startFurniture: null,
  startMoving: null,
  startVehicle: null,
  startCashSaved: 0,
  challengeHours: null,
  challengeTried: false,
  reflectionSurprise: "",
  reflectionChange: "",
  reflectionNext: "",
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
  comparisonSalary: 50000,
  predictionSalary: 40000,
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
  const gross = number(income, 1000000000000);
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
    number(income, 1000000000000) -
    Object.values(taxBreakdown(income)).reduce((a, b) => a + b, 0)
  );
}
export function salaryNeeded(monthly) {
  const target = number(monthly) * 12;
  if (target === 0) return 0;
  let lo = 0,
    hi = 10000000;
  while (takeHome(hi) < target) hi *= 2;
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

export function vehicleCosts(a) {
  const t = find(TRANS, a.trans);
  if (!t) return 0;
  return (
    t.cost +
    (t.car
      ? (a.ciOut ? 0 : CINS[t.ct].cost) +
        (a.crOut ? 0 : 30) +
        CGAS[t.ct] +
        (t.ct === "beater" ? 125 : 75)
      : 0)
  );
}
function careCost(a) {
  const base = find(CARE, a.care)?.cost || 0;
  return (
    base -
    (a.care === "full" && a.leisure.includes("gym")
      ? find(LEISURE, "gym").cost
      : 0)
  );
}
export function sharedHousingFactor(a) {
  const custom =
    a.budgetMode === "household" ? a.householdHomeShare : a.personalHomeShare;
  if (custom !== null && custom !== undefined) return number(custom, 100) / 100;
  if (a.budgetMode === "household") return 1;
  return a.htype === "partner_work" || (a.roommate && rented(a.housing))
    ? 0.5
    : 1;
}
export function partnerCosts(a) {
  const fallback = {
    food: find(FOOD, a.food)?.cost || 0,
    transport: vehicleCosts({ ...a, ciOut: false, crOut: false }),
    health:
      (a.hlOut ? 0 : find(HEALTH, a.health)?.cost || 0) +
      a.hadd.reduce((s, id) => s + (find(HADD, id)?.cost || 0), 0) +
      number(a.medicalReserve),
    personal:
      (a.utils.includes("mobile") ? find(UTILS, "mobile").cost : 0) +
      (find(CLOTH, a.cloth)?.cost || 0) +
      careCost(a) +
      a.leisure.reduce((s, id) => s + (find(LEISURE, id)?.cost || 0), 0),
  };
  return Object.fromEntries(
    Object.entries(fallback).map(([key, value]) => [
      key,
      a[`partner${key[0].toUpperCase() + key.slice(1)}`] === null ||
      a[`partner${key[0].toUpperCase() + key.slice(1)}`] === undefined
        ? value
        : number(a[`partner${key[0].toUpperCase() + key.slice(1)}`], 100000),
    ]),
  );
}
export function budget(a) {
  const lines = [];
  const add = (label, amount, group = "everyday", zero = false) => {
    if (amount > 0 || zero) lines.push({ label, amount, group });
  };
  const h = find(HOUSING, a.housing),
    t = find(TRANS, a.trans),
    fr = find(FIRE, a.fireRisk) || FIRE[0];
  const household = a.budgetMode === "household",
    factor = sharedHousingFactor(a);
  const hasPartner = ["partner_work", "partner_home"].includes(a.htype);
  if (h) {
    add(
      h.id === "family"
        ? "Contribution at home"
        : `${h.l}${factor < 1 ? " (your share)" : ""}`,
      h.id === "family" ? number(a.homeContribution) : h.cost * factor,
      "housing",
      h.id === "family",
    );
    if (h.ins === "renters" && !a.rOut)
      add("Renter's insurance", fr.renters, "housing");
    if (h.ins === "homeowners") {
      if (!a.hOut)
        add("Homeowner's insurance", fr.homeowners * factor, "housing");
      add("Property tax reserve (example)", 417 * factor, "housing");
      add("Home maintenance reserve (example)", 333 * factor, "housing");
    }
  }
  for (const id of a.utils) {
    const u = find(UTILS, id);
    if (u)
      add(
        u.l,
        u.cost *
          (["internet", "water_gas", "electric"].includes(id) ? factor : 1),
      );
  }
  const food = find(FOOD, a.food);
  if (food)
    add(
      food.id === "included"
        ? "Food (covered or included elsewhere)"
        : "Food (you)",
      food.cost,
      "everyday",
      food.id === "included",
    );
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
    const hc = find(HEALTH, a.health);
    if (hc) add("Health premium (your coverage)", hc.cost);
  }
  for (const id of a.hadd) {
    const item = find(HADD, id);
    if (item) add(item.l, item.cost);
  }
  add("Medical out-of-pocket reserve", number(a.medicalReserve));
  for (const id of a.leisure) {
    const item = find(LEISURE, id);
    if (item) add(item.l, item.cost);
  }
  const clothing = find(CLOTH, a.cloth);
  if (clothing) add("Clothing", clothing.cost);
  const care = find(CARE, a.care);
  if (care)
    add(
      a.care === "full" && a.leisure.includes("gym")
        ? "Personal care (gym counted under leisure)"
        : "Personal care",
      careCost(a),
    );
  for (const id of a.misc) {
    const item = find(MISC, id);
    if (item) add(item.l, item.cost);
  }
  const includesPartner =
    hasPartner && (household || a.htype === "partner_home");
  if (includesPartner) {
    const pc = partnerCosts(a);
    add("Other adult: food", pc.food);
    add("Other adult: transportation", pc.transport, "transport");
    add("Other adult: healthcare", pc.health);
    add("Other adult: personal costs", pc.personal);
  }
  const kids = find(KIDS, a.kids);
  if (kids && kids.id !== "none") {
    const share = household
      ? 1
      : a.childSharePercent === null || a.childSharePercent === undefined
        ? a.htype === "partner_work"
          ? 0.5
          : 1
        : number(a.childSharePercent, 100) / 100;
    const childcare =
      a.childcareBudget === null || a.childcareBudget === undefined
        ? a.htype === "partner_home"
          ? 0
          : kids.care
        : number(a.childcareBudget, 100000);
    const supplies =
      a.childSuppliesBudget === null || a.childSuppliesBudget === undefined
        ? kids.supplies
        : number(a.childSuppliesBudget, 100000);
    add("Childcare (modeled share)", childcare * share);
    add("Children: food & supplies (modeled share)", supplies * share);
  }
  if (["trade", "cc", "4year"].includes(a.plan))
    add("Student loan payment", loanPayment(a.loan));
  const expenses = lines.reduce((s, l) => s + l.amount, 0),
    rate = find(SAVES, a.savings)?.pct || 0,
    required = expenses / (1 - rate);
  add(
    `General savings target (${Math.round(rate * 100)}% at required income)`,
    required - expenses,
    "savings",
  );
  const sideNet =
    number(a.hustle, 100000) * (a.hustleMode === "gross" ? 0.75 : 1);
  const partnerGross =
    household && a.htype === "partner_work" ? number(a.partnerSalary) : 0;
  const partnerNet = takeHome(partnerGross) / 12,
    otherNet = sideNet + partnerNet;
  return {
    lines,
    expenses,
    rate,
    savings: required - expenses,
    total: required,
    sideNet,
    partnerNet,
    partnerGross,
    otherNet,
    mainNet: Math.max(0, required - otherNet),
    salary: salaryNeeded(Math.max(0, required - otherNet)),
    groups: ["housing", "everyday", "transport", "savings"].map((g) =>
      lines.filter((l) => l.group === g).reduce((s, l) => s + l.amount, 0),
    ),
    split: 1 / factor,
    factor,
    household,
    includesPartner,
    scopeLabel: household ? "Household plan" : "Your share",
  };
}

const GUIDE_REVISED = "November 5, 2026";
const LEARNING_FIELDS = [
  "originalPlan",
  "jobTitle",
  "jobSource",
  "jobUrl",
  "jobReviewed",
  "jobPay",
  "jobPayBasis",
  "jobHours",
  "jobWeeks",
  "jobSchedule",
  "jobTraining",
  "jobBenefits",
  "startHousing",
  "startFurniture",
  "startMoving",
  "startVehicle",
  "startCashSaved",
  "challengeHours",
  "challengeTried",
  "reflectionSurprise",
  "reflectionChange",
  "reflectionNext",
];
const TEXT_LIMITS = {
  name: 32,
  comparisonCareer: 100,
  jobTitle: 100,
  jobSource: 160,
  jobUrl: 1000,
  jobReviewed: 10,
  jobTraining: 300,
  jobBenefits: 300,
  reflectionSurprise: 280,
  reflectionChange: 280,
  reflectionNext: 280,
};
const localDate = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function safeSourceUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function captureOriginal(a) {
  return Object.fromEntries(
    Object.keys(EMPTY)
      .filter((key) => !LEARNING_FIELDS.includes(key))
      .map((key) => [
        key,
        Array.isArray(a[key] ?? EMPTY[key])
          ? [...(a[key] ?? EMPTY[key])]
          : (a[key] ?? EMPTY[key]),
      ]),
  );
}
export function startingCash(a) {
  const keys = [
    "startHousing",
    "startFurniture",
    "startMoving",
    "startVehicle",
  ];
  const complete = keys.every((key) => a[key] !== null && a[key] !== undefined);
  const extras = keys.reduce((sum, key) => sum + number(a[key], 1000000), 0);
  const firstMonth = budget(a).total;
  const total = firstMonth + extras;
  return {
    complete,
    extras,
    firstMonth,
    total,
    remaining: Math.max(0, total - number(a.startCashSaved, 1000000)),
  };
}
export function postingEstimate(a) {
  const salary =
    a.jobPay === null || a.jobPay === undefined
      ? null
      : a.jobPayBasis === "annual"
        ? a.jobPay
        : Math.round(a.jobPay * a.jobHours * a.jobWeeks * 100) / 100;
  const valid =
    !!a.jobTitle?.trim() &&
    !!a.jobSource?.trim() &&
    validDate(a.jobReviewed || "") &&
    a.jobReviewed <= localDate() &&
    salary > 0 &&
    salary <= 10000000 &&
    (!a.jobUrl || !!safeSourceUrl(a.jobUrl));
  return { salary, valid };
}
export function hoursChallenge(a) {
  if (a.comparisonSalary === null || a.comparisonSalary === undefined)
    return null;
  const originalHours = a.comparisonHours || 40;
  const hours =
    a.challengeHours ?? Math.round(originalHours * 0.75 * 100) / 100;
  const salary =
    Math.round(((a.comparisonSalary * hours) / originalHours) * 100) / 100;
  const b = budget(a),
    available = takeHome(salary) / 12 + b.otherNet;
  return {
    hours,
    salary,
    available,
    gap: available - b.total,
    change: (takeHome(a.comparisonSalary) - takeHome(salary)) / 12,
  };
}
function reflectionCount(a) {
  return [a.reflectionSurprise, a.reflectionChange, a.reflectionNext].filter(
    (text) => text?.trim(),
  ).length;
}

export function matchCareers(answers, all = false) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0 };
  answers.forEach((code) => {
    if (code in scores) scores[code]++;
  });
  return CAREERS.map((c, index) => ({
    ...c,
    index,
    score: c.types.reduce((s, t) => s + scores[t], 0),
  }))
    .filter((career) => all || career.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, all ? CAREERS.length : 6);
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

const PLAN_ENUMS = {
  grade: ["", "9th", "10th", "11th", "12th"],
  plan: ["", "work", "trade", "cc", "4year", "military", "unsure"],
  housing: [null, ...HOUSING.map((x) => x.id)],
  fireRisk: FIRE.map((x) => x.id),
  food: [null, ...FOOD.map((x) => x.id)],
  trans: [null, ...TRANS.map((x) => x.id)],
  health: [null, ...HEALTH.map((x) => x.id)],
  cloth: [null, ...CLOTH.map((x) => x.id)],
  care: [null, ...CARE.map((x) => x.id)],
  htype: [null, ...HTYPE.map((x) => x.id)],
  kids: [null, ...KIDS.map((x) => x.id)],
  savings: [null, ...SAVES.map((x) => x.id)],
  budgetMode: ["personal", "household"],
  jobPayBasis: ["hourly", "annual"],
  jobSchedule: ["assumed", "stated"],
  hustleMode: ["net", "gross"],
  whatIfScenario: ["roommate", "family"],
  resultView: [
    "overview",
    "budget",
    "careers",
    "paycheck",
    "whatif",
    "sources",
    "reflection",
  ],
};
const PLAN_ARRAYS = {
  pers: ["R", "I", "A", "S", "E"],
  utils: UTILS.map((x) => x.id),
  hadd: HADD.map((x) => x.id),
  leisure: LEISURE.map((x) => x.id),
  misc: MISC.map((x) => x.id),
};
export function parseSavedPlan(text) {
  if (typeof text !== "string" || text.length > 500000)
    throw new Error(
      "Choose a student-guide progress file smaller than 500 KB.",
    );
  let document;
  try {
    document = JSON.parse(text);
  } catch {
    throw new Error(
      "This file is not valid JSON. Choose a progress file downloaded from this guide.",
    );
  }
  if (
    !document ||
    document.format !== "life-student-guide" ||
    document.version !== 1 ||
    !document.plan ||
    typeof document.plan !== "object" ||
    Array.isArray(document.plan)
  )
    throw new Error("This is not a supported student-guide progress file.");
  const raw = document.plan,
    plan = { ...EMPTY };
  for (const key of Object.keys(EMPTY)) {
    if (!Object.hasOwn(raw, key)) continue;
    const value = raw[key];
    if (key === "originalPlan") {
      if (value === null) {
        plan.originalPlan = null;
        continue;
      }
      if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value) ||
        value.originalPlan != null
      )
        throw new Error("The original plan in this file is invalid.");
      const restored = parseSavedPlan(
        JSON.stringify({
          format: "life-student-guide",
          version: 1,
          plan: value,
        }),
      ).plan;
      if (!STEPS.every((_, i) => valid(i, restored)))
        throw new Error("The original plan is incomplete.");
      plan.originalPlan = captureOriginal(restored);
    } else if (PLAN_ENUMS[key]) {
      if (!PLAN_ENUMS[key].includes(value))
        throw new Error("The progress file contains an unknown choice.");
      plan[key] = value;
    } else if (PLAN_ARRAYS[key]) {
      if (
        !Array.isArray(value) ||
        value.length > (key === "pers" ? 6 : PLAN_ARRAYS[key].length) ||
        value.some((x) => !PLAN_ARRAYS[key].includes(x))
      )
        throw new Error("The progress file contains invalid selections.");
      plan[key] = key === "pers" ? [...value] : [...new Set(value)];
    } else if (typeof EMPTY[key] === "boolean") {
      if (typeof value !== "boolean")
        throw new Error("The progress file contains an invalid setting.");
      plan[key] = value;
    } else if (TEXT_LIMITS[key]) {
      if (typeof value !== "string" || value.length > TEXT_LIMITS[key])
        throw new Error("The progress file contains invalid text.");
      if (key === "jobUrl" && value && !safeSourceUrl(value))
        throw new Error("The job link must use http or https.");
      if (key === "jobReviewed" && value && !validDate(value))
        throw new Error("The job review date is invalid.");
      plan[key] = value;
    } else {
      if (value === null && EMPTY[key] === null) {
        plan[key] = null;
        continue;
      }
      const max =
        key === "quizIndex"
          ? 5
          : [
                "childSharePercent",
                "personalHomeShare",
                "householdHomeShare",
              ].includes(key)
            ? 100
            : ["comparisonHours", "jobHours", "challengeHours"].includes(key)
              ? 80
              : ["comparisonWeeks", "jobWeeks"].includes(key)
                ? 52
                : [
                      "comparisonSalary",
                      "partnerSalary",
                      "predictionSalary",
                      "jobPay",
                    ].includes(key)
                  ? 10000000
                  : key.startsWith("start")
                    ? 1000000
                    : 100000;
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > max ||
        ([
          "comparisonHours",
          "comparisonWeeks",
          "jobHours",
          "jobWeeks",
        ].includes(key) &&
          value < 1) ||
        (key === "quizIndex" && !Number.isInteger(value))
      )
        throw new Error(
          "A number in the progress file is outside the supported range.",
        );
      plan[key] = value;
    }
  }
  const firstIncomplete = STEPS.findIndex((_, i) => !valid(i, plan));
  const wantedStep =
    Number.isInteger(document.step) && document.step >= 0 && document.step < 13
      ? document.step
      : 0;
  return {
    plan,
    step:
      firstIncomplete >= 0 ? Math.min(wantedStep, firstIncomplete) : wantedStep,
    screen:
      document.screen === "results" && firstIncomplete < 0
        ? "results"
        : "wizard",
  };
}
export function serializePlan(plan, step = 0, screen = "wizard") {
  const result = {
    format: "life-student-guide",
    version: 1,
    savedAt: new Date().toISOString(),
    plan: Object.fromEntries(
      Object.keys(EMPTY).map((k) => [k, plan[k] ?? EMPTY[k]]),
    ),
    step,
    screen,
  };
  const text = JSON.stringify(result, null, 2);
  parseSavedPlan(text);
  return text;
}
function ProgressControls({ onSave, onLoad }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {onSave && (
        <Button
          onClick={onSave}
          title="Download a file with your name or nickname, choices and comparisons to reopen later."
          style={{ fontSize: 12, padding: "8px 11px" }}
        >
          Save progress
        </Button>
      )}
      {onLoad && (
        <Button onClick={onLoad} style={{ fontSize: 12, padding: "8px 11px" }}>
          Open progress
        </Button>
      )}
    </div>
  );
}
function AmountInput({
  value,
  onChange,
  min = 0,
  max = 100000,
  step = "0.01",
  allowBlank = false,
  ...props
}) {
  const [draft, setDraft] = useState(value === null ? "" : String(value)),
    [error, setError] = useState("");
  const current = useRef(value),
    input = useRef(null);
  const errorId = useId();
  useEffect(() => {
    if (value !== current.current) {
      current.current = value;
      setDraft(value === null ? "" : String(value));
      setError("");
      input.current?.setCustomValidity("");
    }
  }, [value]);
  return (
    <>
      <input
        {...props}
        ref={input}
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => {
          const text = e.target.value;
          setDraft(text);
          const n = Number(text);
          const message =
            text !== "" && (!Number.isFinite(n) || n < min || n > max)
              ? `Enter a number from ${min.toLocaleString()} to ${max.toLocaleString()}.`
              : "";
          e.target.setCustomValidity(message);
          setError(message);
          if (!message) {
            const next =
              text === "" ? (allowBlank ? null : Math.max(min, 0)) : n;
            current.current = next;
            onChange(next);
          }
        }}
        onBlur={() => {
          if (draft === "" && !allowBlank) {
            setDraft(String(Math.max(min, 0)));
            current.current = Math.max(min, 0);
            onChange(Math.max(min, 0));
          }
        }}
        style={inputStyle}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          style={{ display: "block", fontSize: 12, color: C.red, marginTop: 6 }}
        >
          {error}
        </span>
      )}
    </>
  );
}
function visibleFieldsValid() {
  const invalid = [...document.querySelectorAll("input")].find(
    (input) => input.offsetParent !== null && !input.checkValidity(),
  );
  if (invalid) {
    invalid.reportValidity();
    return false;
  }
  return true;
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
function Header({ small, children, onSave, onLoad }) {
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
            gap: small ? 12 : 20,
            flexWrap: "wrap",
            fontSize: 12,
            color: C.muted,
          }}
        >
          {!small && <span>Riverside County, California</span>}
          <ProgressControls onSave={onSave} onLoad={onLoad} />
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
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
      requestAnimationFrame(() => {
        if (opener?.isConnected) opener.focus();
      });
    };
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
      <div
        style={{
          background: C.lightBlue,
          padding: 20,
          borderRadius: 9,
          marginBottom: 24,
        }}
      >
        <Field
          label="Your first guess: annual salary needed"
          help={
            a.originalPlan
              ? "Your first guess is saved with your original plan. Compare it with your results."
              : "Before researching, what yearly salary do you think would support the lifestyle you want? A guess is enough; you can leave it blank."
          }
        >
          <AmountInput
            value={a.predictionSalary}
            allowBlank
            max={10000000}
            disabled={!!a.originalPlan}
            onChange={(predictionSalary) => update({ predictionSalary })}
            placeholder="Your guess, before taxes"
          />
        </Field>
      </div>
      <BudgetScope a={a} update={update} />
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
  const q = a.quizIndex || 0;
  const setQ = (value) =>
    update({ quizIndex: typeof value === "function" ? value(q) : value });
  const [locked, setLocked] = useState(false);
  const timer = useRef(null),
    heading = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    heading.current?.focus();
  }, [q]);
  const pick = (type) => {
    if (locked) return;
    const pers = [...a.pers];
    pers[q] = type;
    update({ pers });
    if (q < 5 && a.quizAutoAdvance !== false) {
      setLocked(true);
      timer.current = setTimeout(() => {
        setQ((v) => Math.min(5, v + 1));
        setLocked(false);
      }, 350);
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
      <label style={{ display: "block", fontSize: 13, marginBottom: 20 }}>
        <input
          type="checkbox"
          checked={a.quizAutoAdvance}
          onChange={(e) => {
            clearTimeout(timer.current);
            setLocked(false);
            update({ quizAutoAdvance: e.target.checked });
          }}
        />{" "}
        Automatically move to the next question
      </label>
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
          <AmountInput
            value={a.homeContribution}
            onChange={(homeContribution) => update({ homeContribution })}
          />
        </Field>
      )}
      {rented(a.housing) && (
        <Choice
          title="Share with one roommate"
          note="A roommate can share rent and utilities. Check the assigned share below; your other personal costs stay yours."
          selected={a.roommate}
          onClick={() => update({ roommate: !a.roommate })}
          multiple
        />
      )}
      {a.housing && a.housing !== "family" && (
        <Field
          label="Housing and shared utilities assigned to this plan (%)"
          help="The preset housing price is for the whole home. Adjust your assigned share if someone else pays part. Personal mode defaults to half with one roommate or a working partner; household mode defaults to the whole bill."
        >
          <AmountInput
            max={100}
            value={sharedHousingFactor(a) * 100}
            onChange={(v) =>
              update({
                [a.budgetMode === "household"
                  ? "householdHomeShare"
                  : "personalHomeShare"]: v,
              })
            }
          />
        </Field>
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
      <Field
        label="Medical out-of-pocket reserve per month"
        help="Set aside money for copays, prescriptions, deductibles or dependent coverage not included above. This is separate from the premium."
      >
        <AmountInput
          value={a.medicalReserve}
          onChange={(medicalReserve) => update({ medicalReserve })}
        />
      </Field>
      <Note>
        This step starts with your coverage. Eligibility for Medi-Cal and
        Covered California assistance depends on your actual situation.
        Household mode adds an editable healthcare amount for the other adult
        later.
      </Note>
    </>
  );
}
function BudgetScope({ a, update }) {
  return (
    <Field
      label="What are you planning for?"
      help="Picture life after your education or training, using today's local planning prices."
    >
      <select
        style={inputStyle}
        value={a.budgetMode}
        onChange={(e) => update({ budgetMode: e.target.value })}
      >
        <option value="personal">My share of the bills</option>
        <option value="household">Our household total</option>
      </select>
    </Field>
  );
}
function HouseholdStep({ a, update }) {
  const kids = find(KIDS, a.kids),
    b = budget(a),
    pc = partnerCosts(a);
  const partner = ["partner_work", "partner_home"].includes(a.htype);
  return (
    <>
      <BudgetScope a={a} update={update} />
      <ChoiceList
        items={HTYPE}
        value={a.htype}
        onChange={(htype) => update({ htype })}
      />
      {a.housing !== "family" && partner && (
        <Field
          label="Housing and shared utilities assigned to this plan (%)"
          help={
            b.household
              ? "100% includes the whole home's bills. Lower this if someone outside your household pays part."
              : "A working partner defaults to half; a partner without earnings defaults to all. Adjust to your agreement. This share also applies to home ownership reserves."
          }
        >
          <AmountInput
            value={b.factor * 100}
            max={100}
            onChange={(v) =>
              update({
                [b.household ? "householdHomeShare" : "personalHomeShare"]: v,
              })
            }
          />
        </Field>
      )}
      {b.household && a.htype === "partner_work" && (
        <Field
          label="Other adult's annual gross wages"
          help="Enter 0 until you have a wage to test. Each adult's take-home is estimated separately with the historical 2024 single-filer model; this does not model a joint tax return."
        >
          <AmountInput
            value={a.partnerSalary}
            max={10000000}
            onChange={(partnerSalary) => update({ partnerSalary })}
          />
        </Field>
      )}
      {b.includesPartner && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20 }}>Include the other adult's expenses</h2>
          <p style={{ fontSize: 13, color: C.muted }}>
            Starting amounts mirror your choices for one adult. Edit them for
            your situation, including 0 for a cost already covered. Housing and
            shared utilities are counted separately. Other adult medical costs
            should include their coverage and dependents if needed.
          </p>
          {[
            ["food", "Food"],
            ["transport", "Transportation"],
            ["health", "Healthcare"],
            ["personal", "Phone, clothing, care and leisure"],
          ].map(([key, label]) => (
            <Field key={key} label={`Other adult: ${label} per month`}>
              <AmountInput
                value={pc[key]}
                onChange={(v) =>
                  update({
                    [`partner${key[0].toUpperCase() + key.slice(1)}`]: v,
                  })
                }
              />
            </Field>
          ))}
        </section>
      )}
      <div style={{ ...eyebrow, margin: "28px 0 14px" }}>
        Children you support
      </div>
      <ChoiceList
        items={KIDS}
        value={a.kids}
        onChange={(kids) =>
          update({ kids, childcareBudget: null, childSuppliesBudget: null })
        }
      />
      {kids && kids.id !== "none" && (
        <>
          <Field
            label="Children's total childcare per month"
            help="Edit the local preset for the children's ages and care schedule. Use 0 if there is no paid care."
          >
            <AmountInput
              value={
                a.childcareBudget ??
                (a.htype === "partner_home" ? 0 : kids.care)
              }
              onChange={(childcareBudget) => update({ childcareBudget })}
            />
          </Field>
          <Field label="Children's total food and supplies per month">
            <AmountInput
              value={a.childSuppliesBudget ?? kids.supplies}
              onChange={(childSuppliesBudget) =>
                update({ childSuppliesBudget })
              }
            />
          </Field>
          {!b.household && (
            <Field
              label="Your share of children's costs (%)"
              help="This divides the two totals above. Enter the share you expect to pay."
            >
              <AmountInput
                value={
                  a.childSharePercent ?? (a.htype === "partner_work" ? 50 : 100)
                }
                max={100}
                onChange={(childSharePercent) => update({ childSharePercent })}
              />
            </Field>
          )}
          <Note>
            {b.household
              ? "This household plan includes 100% of the children's costs entered above."
              : "The budget includes only the share of child costs assigned to you."}{" "}
            Children's health coverage is not added automatically. Include their
            premium and medical costs in your healthcare reserve or the other
            adult's healthcare amount.
          </Note>
        </>
      )}
      <Note style={{ marginTop: 20 }}>
        {b.household
          ? "Household mode includes both adults' listed costs and any partner wage entered. Your required wage covers the remainder."
          : "Personal mode includes your share of the bills. A working partner covers their own personal costs; their income is not added to yours. If your partner has no earnings, their listed expenses are assigned to you."}{" "}
        Unpaid caregiving has value. A zero childcare bill does not mean zero
        work.
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
        label="Optional side income per month"
        help="Use money available after business expenses and taxes when you know it. Enter 0 to leave it out."
      >
        <AmountInput
          value={a.hustle}
          onChange={(hustle) => update({ hustle })}
        />
      </Field>
      <Field label="How should we treat this side income?">
        <select
          style={inputStyle}
          value={a.hustleMode}
          onChange={(e) => update({ hustleMode: e.target.value })}
        >
          <option value="net">Already after expenses and taxes</option>
          <option value="gross">Before expenses and taxes: reserve 25%</option>
        </select>
      </Field>
      {a.hustleMode === "gross" && (
        <Note>
          A 25% reserve is only a classroom shortcut. Actual business costs and
          self-employment taxes vary and can be higher.
        </Note>
      )}
      <Note style={{ marginTop: 16 }}>
        General savings is separate from selected car, home and medical
        reserves. A 10% goal means 10% of the take-home income required for this
        plan. Its dollar target stays fixed when you test a lower or higher
        paycheck.
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
function Wizard({
  a,
  update,
  step,
  setStep,
  onFinish,
  onHome,
  small,
  onSave,
  onLoad,
  editing,
}) {
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
    if (n > step && !visibleFieldsValid()) return;
    setStep(n);
    window.scrollTo(0, 0);
    requestAnimationFrame(() => heading.current?.focus());
  };
  return (
    <>
      <Header small={small} onSave={onSave} onLoad={onLoad}>
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
            style={{
              boxSizing: "border-box",
              fontSize: 12,
              color: C.muted,
              whiteSpace: "nowrap",
            }}
          >
            Step {step + 1} of 13
          </span>
        </div>
        <Field label="Jump to a section">
          <select
            value={step}
            style={inputStyle}
            onChange={(e) => go(Number(e.target.value))}
          >
            {STEPS.map(([title], i) => (
              <option
                key={title}
                value={i}
                disabled={
                  i > step && !STEPS.slice(0, i).every((_, j) => valid(j, a))
                }
              >
                {String(i + 1).padStart(2, "0")} {title}
              </option>
            ))}
          </select>
        </Field>
        {editing && STEPS.every((_, i) => valid(i, a)) && (
          <Button
            primary
            onClick={() => visibleFieldsValid() && onFinish()}
            style={{ marginBottom: 22 }}
          >
            Done editing, see results
          </Button>
        )}
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
                onClick={() =>
                  visibleFieldsValid() &&
                  (step === 12 ? onFinish() : go(step + 1))
                }
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
          Local classroom planning estimates. Save a progress file before
          refreshing or closing this tab. The file keeps your choices on your
          device; nothing is uploaded.
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
function DetailPanel({ title, hint, children, onToggle }) {
  return (
    <details
      onToggle={onToggle}
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 9,
        marginTop: 16,
        minWidth: 0,
        background: "#fff",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          padding: "17px 20px",
          fontSize: 17,
          fontWeight: 700,
          lineHeight: 1.5,
        }}
      >
        {title}
        {hint && (
          <span
            style={{
              display: "block",
              marginTop: 4,
              fontSize: 12,
              fontWeight: 400,
              color: C.muted,
            }}
          >
            {hint}
          </span>
        )}
      </summary>
      <div style={{ padding: "4px 20px 20px" }}>{children}</div>
    </details>
  );
}
function ShortAnswer({ label, value, onChange, help, max = 280 }) {
  return (
    <Field label={label} help={help}>
      <textarea
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
      />
      <span
        style={{ display: "block", fontSize: 11, color: C.muted, marginTop: 4 }}
      >
        {value.length}/{max}
      </span>
    </Field>
  );
}
function PredictionResult({ a, b }) {
  const original = a.originalPlan ? budget(a.originalPlan) : b;
  const guess = a.originalPlan
    ? a.originalPlan.predictionSalary
    : a.predictionSalary;
  if (guess === null || guess === undefined)
    return (
      <p style={{ color: C.muted, fontSize: 13 }}>
        Before discussing: how close was this to the salary you expected?
      </p>
    );
  return (
    <div
      role="group"
      aria-label="Prediction and first result"
      style={{
        display: "flex",
        gap: "12px 28px",
        flexWrap: "wrap",
        padding: "16px 20px",
        margin: "0 0 26px",
        background: C.soft,
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      <span>
        Your first guess: <strong>{fmt(guess)}/year</strong>
      </span>
      <span>
        Your first plan needed: <strong>{fmt(original.salary)}/year</strong>
      </span>
      <span style={{ color: C.muted }}>
        {Math.abs(original.salary - guess) < 1
          ? "Your estimate matched the model."
          : `${fmt(Math.abs(original.salary - guess))} ${original.salary > guess ? "above" : "below"} your guess.`}{" "}
        What explains the difference?
      </span>
    </div>
  );
}
function PlanComparison({ a, b, compactUntilChanged = false }) {
  if (!a.originalPlan) return null;
  const first = budget(a.originalPlan),
    salary = a.comparisonSalary;
  const rows = [
    ["Monthly plan", first.total, b.total],
    ["General savings / month", first.savings, b.savings],
    ["Annual wages needed", first.salary, b.salary],
  ];
  const firstGap =
    salary === null
      ? null
      : takeHome(salary) / 12 + first.otherNet - first.total;
  const currentGap =
    salary === null ? null : takeHome(salary) / 12 + b.otherNet - b.total;
  if (salary !== null)
    rows.push(["Left / short each month", firstGap, currentGap]);
  const changed =
    [
      "housing",
      "roommate",
      "food",
      "trans",
      "health",
      "savings",
      "htype",
      "kids",
      "budgetMode",
      "personalHomeShare",
      "householdHomeShare",
    ].some((key) => a[key] !== a.originalPlan[key]) ||
    Math.abs(first.total - b.total) > 0.005;
  if (compactUntilChanged && !changed)
    return (
      <section
        aria-label="Original and current plan"
        style={{ margin: "18px 0" }}
      >
        <Note>
          Your first plan is saved. Use the edit buttons below to revise two
          choices. Your original and current costs will appear together here.
        </Note>
      </section>
    );
  return (
    <section
      aria-label="Original and current plan"
      style={{ margin: "20px 0" }}
    >
      <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        {changed
          ? "Your first plan is saved. Compare the choices, then explain what changed and why."
          : "Your first plan is saved. Try revising two choices; you can compare the full plans here."}
      </p>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          tableLayout: "fixed",
        }}
      >
        <caption
          style={{
            textAlign: "left",
            fontSize: 15,
            fontWeight: 700,
            paddingBottom: 12,
          }}
        >
          Your original and current plans
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              style={{
                width: "44%",
                textAlign: "left",
                padding: "10px 4px",
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              Compare
            </th>
            <th
              scope="col"
              style={{
                textAlign: "right",
                padding: "10px 4px",
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              Original
            </th>
            <th
              scope="col"
              style={{
                textAlign: "right",
                padding: "10px 4px",
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              Current
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, before, after]) => (
            <tr key={label}>
              <th
                scope="row"
                style={{
                  textAlign: "left",
                  padding: "12px 4px",
                  fontWeight: 500,
                  color: C.muted,
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                {label}
              </th>
              <td
                style={{
                  textAlign: "right",
                  padding: "12px 4px",
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                {fmt(before)}
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "12px 4px",
                  fontWeight: 700,
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                {fmt(after)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {salary !== null && (
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
          Both use your selected {fmt(salary)}/year main wage and each plan's
          own other income. A negative amount means a shortfall. General savings
          is the dollar target set by each plan.
        </p>
      )}
      {first.household !== b.household && (
        <Note tone="amber">
          You changed between your share and a household total. These plans
          cover different people, so the change is not just a saving or an
          increase in your lifestyle cost.
        </Note>
      )}
    </section>
  );
}
function JobPosting({ a, update, small, onSalary, onEdit }) {
  const estimate = postingEstimate(a);
  return (
    <DetailPanel
      title="Use a real job posting"
      hint={
        a.jobTitle
          ? `${a.jobTitle} · ${a.jobReviewed || "add the date checked"}`
          : "Add a local employer posting or a job card from your teacher."
      }
    >
      <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        Copy the pay and schedule from one posting. Record the source and when
        you checked it. Nothing is sent to the employer or uploaded.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: small
            ? "minmax(0, 1fr)"
            : "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "0 20px",
        }}
      >
        <Field label="Job title">
          <input
            value={a.jobTitle}
            maxLength={100}
            onChange={(e) => update({ jobTitle: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="Employer or teacher-provided source">
          <input
            value={a.jobSource}
            maxLength={160}
            onChange={(e) => update({ jobSource: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="Posting link (optional)">
          <input
            type="url"
            value={a.jobUrl}
            maxLength={1000}
            placeholder="https://"
            onChange={(e) => {
              const value = e.target.value;
              e.target.setCustomValidity(
                !value || safeSourceUrl(value)
                  ? ""
                  : "Use an http or https link without login credentials.",
              );
              update({ jobUrl: value });
            }}
            style={inputStyle}
          />
        </Field>
        <Field label="Date you checked the posting">
          <input
            type="date"
            max={localDate()}
            value={a.jobReviewed}
            onChange={(e) => update({ jobReviewed: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="Pay listed in the posting">
          <AmountInput
            value={a.jobPay}
            allowBlank
            max={
              a.jobPayBasis === "hourly"
                ? Math.floor((10000000 / (a.jobHours * a.jobWeeks)) * 100) / 100
                : 10000000
            }
            onChange={(jobPay) => update({ jobPay })}
          />
        </Field>
        <Field label="Pay is listed per">
          <select
            value={a.jobPayBasis}
            onChange={(e) => update({ jobPayBasis: e.target.value })}
            style={inputStyle}
          >
            <option value="hourly">Hour</option>
            <option value="annual">Year</option>
          </select>
        </Field>
        <Field label="Job's paid hours per week">
          <AmountInput
            min={1}
            max={80}
            value={a.jobHours}
            onChange={(jobHours) => update({ jobHours })}
          />
        </Field>
        <Field label="Job's paid weeks per year">
          <AmountInput
            min={1}
            max={52}
            value={a.jobWeeks}
            onChange={(jobWeeks) => update({ jobWeeks })}
          />
        </Field>
      </div>
      <Field label="Where did this schedule come from?">
        <select
          style={inputStyle}
          value={a.jobSchedule}
          onChange={(e) => update({ jobSchedule: e.target.value })}
        >
          <option value="assumed">Assumed schedule</option>
          <option value="stated">Stated in posting</option>
        </select>
      </Field>
      {a.jobSchedule === "assumed" && (
        <Note tone="amber">
          The schedule is an assumption. Ask about reliable paid hours, unpaid
          time and shift availability before relying on this annual income.
        </Note>
      )}
      <div style={{ marginTop: 20 }}>
        <ShortAnswer
          label="Training or credential required (optional)"
          value={a.jobTraining}
          max={300}
          onChange={(jobTraining) => update({ jobTraining })}
          help="Record the requirement, approximate training time or cost, or what you still need to find out."
        />
        <ShortAnswer
          label="Benefits and eligibility (optional)"
          value={a.jobBenefits}
          max={300}
          onChange={(jobBenefits) => update({ jobBenefits })}
          help="Check health coverage, employee premiums, waiting periods and whether your schedule qualifies."
        />
      </div>
      {estimate.salary !== null && (
        <p style={{ fontSize: 15, fontWeight: 700 }}>
          Wage to test: {fmt(estimate.salary)}/year before taxes
        </p>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button
          primary
          disabled={!estimate.valid}
          onClick={() =>
            visibleFieldsValid() &&
            onSalary(estimate.salary, a.jobTitle, {
              comparisonHours: a.jobHours,
              comparisonWeeks: a.jobWeeks,
            })
          }
        >
          Test this posting
        </Button>
        {onEdit && (
          <Button onClick={() => onEdit(6)}>Check my healthcare choice</Button>
        )}
        {safeSourceUrl(a.jobUrl) && (
          <a
            href={safeSourceUrl(a.jobUrl)}
            target="_blank"
            rel="noreferrer"
            style={{ color: C.blue, padding: "12px 0", fontSize: 13 }}
          >
            Open recorded posting
          </a>
        )}
      </div>
      <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7 }}>
        Add a title, source, checked date and positive pay to test this posting.
        Benefits stay as notes until you update your budget. Commission income,
        tips, overtime premiums and self-employment require additional
        assumptions.
      </p>
    </DetailPanel>
  );
}
function StartingCash({ a, b, update, small }) {
  const cash = startingCash(a);
  return (
    <DetailPanel
      title="Cash needed to get started"
      hint={
        cash.complete
          ? `${fmt(cash.total)} for the first month and setup`
          : "Estimate deposits, basic setup and initial transportation costs."
      }
    >
      <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        Start with your first month's {fmt(b.total)} plan, then add costs paid
        at the beginning. Enter 0 where a cost does not apply. Review these
        amounts if your housing or transportation changes.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: small
            ? "minmax(0, 1fr)"
            : "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "0 20px",
        }}
      >
        {[
          [
            "startHousing",
            "Housing deposit or home purchase cash",
            "Use an actual rental deposit, or the down payment and closing costs for a home. First-month housing is already in the monthly plan.",
          ],
          [
            "startFurniture",
            "Basic furnishings and household supplies",
            "Enter the amount you would pay to get set up.",
          ],
          [
            "startMoving",
            "Moving and utility setup fees",
            "Include connection fees or deposits if they apply.",
          ],
          [
            "startVehicle",
            "Transportation purchase or down payment",
            "Include initial cash for a vehicle if needed. Ongoing payments and running costs are already in the monthly plan.",
          ],
        ].map(([key, label, help]) => (
          <Field key={key} label={label} help={help}>
            <AmountInput
              allowBlank
              max={1000000}
              value={a[key]}
              onChange={(value) => update({ [key]: value })}
              placeholder="Enter an estimate or 0"
            />
          </Field>
        ))}
      </div>
      <Field
        label="Money already set aside (optional)"
        help="Use a planning amount. You do not need to share your actual savings."
      >
        <AmountInput
          max={1000000}
          value={a.startCashSaved}
          onChange={(startCashSaved) => update({ startCashSaved })}
        />
      </Field>
      <div
        aria-live="polite"
        style={{
          padding: 20,
          background: C.soft,
          borderRadius: 8,
          lineHeight: 1.9,
          fontSize: 14,
        }}
      >
        <div>
          First month of your plan: <strong>{fmt(cash.firstMonth)}</strong>
        </div>
        <div>
          Setup extras entered: <strong>{fmt(cash.extras)}</strong>
        </div>
        {cash.complete ? (
          <>
            <div>
              First month + setup: <strong>{fmt(cash.total)}</strong>
            </div>
            <div>
              Still to set aside: <strong>{fmt(cash.remaining)}</strong>
            </div>
          </>
        ) : (
          <p style={{ color: C.muted, marginBottom: 0 }}>
            Fill all four setup amounts, including any zeros, to complete the
            estimate.
          </p>
        )}
      </div>
      <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7 }}>
        This is a cash target for the first month and setup. Your first month's
        income may cover part of it. Deposits may be refundable. Setup extras
        are separate from ongoing monthly expenses.
      </p>
    </DetailPanel>
  );
}
function Challenge({ a, b, update, onView, onEdit }) {
  const challenge = hoursChallenge(a);
  return (
    <DetailPanel
      title="Try an hours-change challenge"
      hint="What if your job offers fewer paid hours than you expected?"
      onToggle={(event) => {
        if (event.currentTarget.open && !a.challengeTried)
          update({ challengeTried: true });
      }}
    >
      {!challenge ? (
        <>
          <p style={{ color: C.muted, fontSize: 13 }}>
            Choose a wage and schedule first, then test a change without
            overwriting them.
          </p>
          <Button onClick={() => onView("paycheck")}>Choose a wage</Button>
        </>
      ) : (
        <>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
            Your current comparison uses {a.comparisonHours} paid hours per
            week. Start with 25% fewer hours, or enter a different schedule
            below. This scenario assumes pay changes with hours; weeks and other
            income stay the same.
          </p>
          <Field label="Challenge: paid hours per week">
            <AmountInput
              max={80}
              value={challenge.hours}
              onChange={(challengeHours) =>
                update({ challengeHours, challengeTried: true })
              }
            />
          </Field>
          <div
            aria-live="polite"
            style={{
              padding: 20,
              background: C.soft,
              borderRadius: 8,
              fontSize: 14,
              lineHeight: 1.9,
            }}
          >
            <div>
              Annual wages in this scenario:{" "}
              <strong>{fmt(challenge.salary)}</strong>
            </div>
            <div>
              Available each month: <strong>{fmt(challenge.available)}</strong>
            </div>
            <div>
              {challenge.gap < 0 ? "Monthly shortfall" : "Left after your plan"}
              :{" "}
              <strong style={{ color: challenge.gap < 0 ? C.amber : C.green }}>
                {fmt(Math.abs(challenge.gap))}
              </strong>
            </div>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7 }}>
            Which two choices would you revisit? Could you still get to the
            shift using your selected transportation? If you support children,
            does the care schedule work?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Button onClick={() => onEdit(5)}>Review transportation</Button>
            <Button onClick={() => onEdit(11)}>Review household</Button>
          </div>
          <p style={{ color: C.muted, fontSize: 12 }}>
            Your selected wage stays unchanged. This challenge is a separate
            discussion scenario.
          </p>
        </>
      )}
    </DetailPanel>
  );
}
function ReflectionPage({ a, b, update, small, onPrint, onView, onEdit }) {
  return (
    <>
      <PageTitle
        eyebrowText="Explain your choices"
        title="Turn your numbers into a next step."
        body="A few sentences are enough. Explain what surprised you, a choice you would revise, and something you can do now."
      />
      <PredictionResult a={a} b={b} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: small
            ? "minmax(0, 1fr)"
            : "minmax(0, 1.25fr) minmax(0, 1fr)",
          gap: small ? 28 : 44,
        }}
      >
        <section aria-label="My reflection">
          <ShortAnswer
            label="The expense that surprised me most was…"
            value={a.reflectionSurprise}
            onChange={(reflectionSurprise) => update({ reflectionSurprise })}
          />
          <ShortAnswer
            label="The choice I would change is… because…"
            value={a.reflectionChange}
            onChange={(reflectionChange) => update({ reflectionChange })}
          />
          <ShortAnswer
            label="One step I can take now is…"
            value={a.reflectionNext}
            onChange={(reflectionNext) => update({ reflectionNext })}
            help="For example: research a credential, check a local job's requirements, or set a savings goal."
          />
          <p role="status" style={{ color: C.muted, fontSize: 12 }}>
            {reflectionCount(a)} of 3 reflections written. Your explanation and
            next step matter more than choosing the cheapest lifestyle.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button primary onClick={onPrint}>
              Print my summary
            </Button>
            <Button onClick={() => onView("overview")}>Review my plan</Button>
          </div>
          <p style={{ color: C.muted, fontSize: 12 }}>
            Use Save progress to keep your answers in a file. The print summary
            includes your reflection.
          </p>
        </section>
        <aside>
          <PlanComparison a={a} b={b} />
          <Challenge
            a={a}
            b={b}
            update={update}
            onView={onView}
            onEdit={onEdit}
          />
        </aside>
      </div>
    </>
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
  onEdit,
  update,
}) {
  const available = salary === null ? null : takeHome(salary) / 12 + b.otherNet;
  const gap = available === null ? null : b.total - available;
  const biggest = GROUPS.map((g, i) => ({ ...g, amount: b.groups[i] }))
    .filter((g) => g.name !== "Savings")
    .sort((x, y) => y.amount - x.amount)[0];
  return (
    <>
      <div style={{ ...eyebrow, marginBottom: 15 }}>Your next chapter</div>
      <h1
        style={{
          fontSize: small ? 38 : 64,
          lineHeight: 1.07,
          letterSpacing: small ? -1.8 : -2.8,
          margin: "0 0 17px",
          fontWeight: 780,
        }}
      >
        Your lifestyle, at a glance.
      </h1>
      <p
        style={{
          color: C.muted,
          fontSize: 16,
          lineHeight: 1.8,
          margin: "0 0 30px",
        }}
      >
        {a.name}, these are choices you can explore. This is{" "}
        {b.household ? "your household's plan" : "your share of the bills"},
        using local classroom estimates.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: small
            ? "minmax(0, 1fr)"
            : "minmax(0, 1.35fr) minmax(0, 1fr)",
          gap: small ? 28 : 46,
        }}
      >
        <section aria-label="Your monthly plan" style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 23, margin: "0 0 8px" }}>
            {b.household ? "Household monthly plan" : "Your monthly plan"}
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "baseline",
            }}
          >
            <strong
              style={{
                fontSize: small ? 64 : 94,
                letterSpacing: -4,
                color: C.blue,
                lineHeight: 1.15,
              }}
            >
              {fmt(b.total)}
            </strong>
            <span style={{ color: C.muted }}>per month</span>
          </div>
          {!small && <Spending b={b} small={false} />}
        </section>
        <section
          aria-label="Required wages"
          style={{
            background: C.lightBlue,
            padding: small ? 24 : 30,
            borderRadius: 9,
            minWidth: 0,
          }}
        >
          <h2 style={{ fontSize: 23, margin: "0 0 12px" }}>
            Your annual wages needed
          </h2>
          <strong
            style={{
              fontSize: small ? 48 : 60,
              letterSpacing: -2.5,
              lineHeight: 1.2,
              color: C.blue,
            }}
          >
            {fmt(b.salary)}
          </strong>
          <p style={{ margin: "10px 0 18px", fontSize: 17 }}>
            {hourly(b.salary / 2080)}/hour{" "}
            <span style={{ fontSize: 12, color: C.muted }}>
              before taxes, at 40 paid hours × 52 weeks
            </span>
          </p>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.8 }}>
            This is the main wage needed to cover the plan and its general
            savings target with the historical 2024 tax estimate.
            {b.otherNet > 0
              ? ` It also assumes ${fmt(b.otherNet)}/month from ${b.partnerNet > 0 && b.sideNet > 0 ? "the other adult and side income" : b.partnerNet > 0 ? "the other adult's estimated take-home" : "net side income"}.`
              : ""}
          </p>
          {b.household && a.htype === "partner_work" && !a.partnerSalary && (
            <Note tone="amber">
              No other adult wage has been entered. The required wage currently
              covers the household alone.
            </Note>
          )}
          <Button
            primary
            onClick={() => onView("careers")}
            style={{ width: "100%", marginTop: 12 }}
          >
            Explore career paths
          </Button>
        </section>
      </div>
      <div style={{ marginTop: 24 }}>
        <PredictionResult a={a} b={b} />
      </div>
      {small && (
        <div style={{ marginTop: 24 }}>
          <Spending b={b} small />
        </div>
      )}
      <section
        style={{
          borderTop: `1px solid ${C.line}`,
          marginTop: 30,
          paddingTop: 25,
        }}
      >
        <h2 style={{ fontSize: 23, margin: "0 0 16px" }}>
          Test a paycheck against your plan
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: small
              ? "minmax(0, 1fr)"
              : "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 28,
          }}
        >
          <div>
            <Field
              label="Annual wage to compare"
              help={
                a.comparisonCareer
                  ? `Selected scenario: ${a.comparisonCareer}.`
                  : "Choose a career scenario or enter a wage you want to test. The required wage above is a target, not a job offer."
              }
            >
              <AmountInput
                value={salary}
                allowBlank
                max={10000000}
                placeholder="Enter a yearly wage"
                onChange={setSalary}
              />
            </Field>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Button onClick={() => onView("paycheck")}>
                Explore the paycheck and hourly pay
              </Button>
              <Button onClick={() => onView("careers")}>
                Use a real job posting
              </Button>
            </div>
          </div>
          <div
            aria-live="polite"
            style={{
              padding: 24,
              background: C.soft,
              borderRadius: 9,
              minWidth: 0,
            }}
          >
            {salary === null ? (
              <p style={{ margin: 0, color: C.muted, lineHeight: 1.8 }}>
                A wage has not been selected yet. Try an hourly offer or explore
                career paths to start the comparison.
              </p>
            ) : (
              <>
                <div style={{ color: C.muted, fontSize: 13 }}>
                  Available take-home
                  {b.otherNet > 0 ? " plus other income" : ""}: {fmt(available)}
                  /month
                </div>
                <strong
                  style={{
                    display: "block",
                    fontSize: 43,
                    color: gap > 0 ? C.amber : C.green,
                    letterSpacing: -1.8,
                    marginTop: 10,
                  }}
                >
                  {fmt(Math.abs(gap))}
                </strong>
                <span>{gap > 0 ? "monthly gap" : "left after your plan"}</span>
                <p style={{ fontSize: 12, color: C.muted, marginBottom: 0 }}>
                  At {fmt(salary)}/year before taxes. The plan includes{" "}
                  {fmt(b.savings)}/month in general savings; that target does
                  not change with this test wage.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
      <RiskFlags a={a} compact />
      {a.health === "medi_cal" && !a.hlOut && (
        <Note tone="amber" style={{ marginTop: 20 }}>
          You selected Medi-Cal. Higher earnings could change eligibility or
          assistance. This plan keeps your selection until you change it.
        </Note>
      )}
      <section
        style={{
          borderTop: `1px solid ${C.line}`,
          marginTop: 28,
          paddingTop: 24,
        }}
      >
        <h2 style={{ fontSize: 20 }}>
          Keep your goal. Try a workable first step.
        </h2>
        <PlanComparison a={a} b={b} compactUntilChanged />
        <p style={{ color: C.muted, fontSize: 13 }}>
          {biggest?.name} is your largest spending category at{" "}
          {fmt(biggest?.amount || 0)}/month. Which choices are priorities, and
          which could you change?
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            [2, "Edit housing"],
            [5, "Edit transportation"],
            [11, "Edit household"],
            [12, "Edit savings"],
          ].map(([step, title]) => (
            <Button key={step} onClick={() => onEdit(step)}>
              {title}
            </Button>
          ))}
          <Button onClick={() => onScenario("roommate")}>Try a roommate</Button>
          <Button onClick={() => onScenario("family")}>
            Compare living with family
          </Button>
        </div>
      </section>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: small
            ? "minmax(0, 1fr)"
            : "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "0 20px",
          marginTop: 20,
        }}
      >
        <StartingCash a={a} b={b} update={update} small={small} />
        <Challenge
          a={a}
          b={b}
          update={update}
          onView={onView}
          onEdit={onEdit}
        />
      </div>
      <section
        style={{
          marginTop: 28,
          paddingTop: 24,
          borderTop: `1px solid ${C.line}`,
        }}
      >
        <h2 style={{ fontSize: 20 }}>What would you change first, and why?</h2>
        <p style={{ color: C.muted, fontSize: 13 }}>
          Finish with three short thoughts: what surprised you, a change you
          would make, and your next step.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button primary onClick={() => onView("reflection")}>
            Write my next step
          </Button>
          <Button onClick={onPrint}>Print my summary</Button>
        </div>
      </section>
      <p
        style={{ color: C.muted, fontSize: 12, lineHeight: 1.8, marginTop: 24 }}
      >
        Guide revised {GUIDE_REVISED}. Perris / Inland Empire classroom planning
        estimates; original quote dates were not supplied. Actual prices, wages
        and situations vary. Taxes use a historical 2024 single-filer model
        before credits and benefits.{" "}
        <button
          onClick={() => onView("sources")}
          style={{
            border: 0,
            background: "none",
            color: C.blue,
            fontFamily: "inherit",
            fontSize: "inherit",
            textDecoration: "underline",
            cursor: "pointer",
            padding: 0,
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
function RiskFlags({ a, compact = false }) {
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
    <section
      style={{ boxSizing: "border-box", marginBottom: 28, marginTop: 24 }}
    >
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
          {compact
            ? "Excluded from the total. Review the costs and consequences in Your budget."
            : CONSEQUENCES[key][1]}
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
              About {hourly(b.salary / 2080)}/hour at 40 paid hours per week, 52
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
function CareersPage({ a, b, small, onSalary, update, onEdit }) {
  const [browseAll, setBrowseAll] = useState(false);
  const careers = matchCareers(a.pers, browseAll);
  return (
    <>
      <PageTitle
        eyebrowText="Possibilities, not predictions"
        title="Find a direction worth exploring."
        body="Explore paths connected with your interests, or browse every path. Pay figures are scenarios for comparison; actual job offers, training requirements and earnings vary."
      />
      <JobPosting
        a={a}
        update={update}
        small={small}
        onSalary={onSalary}
        onEdit={onEdit}
      />
      <Note style={{ boxSizing: "border-box", marginBottom: 28 }}>
        Your plan needs about {fmt(b.salary)} in annual wages
        {b.otherNet > 0 ? ", alongside the other income in your plan" : ""}.
        Starting pay, experienced pay, and self-employed business revenue are
        different things. Test a real job posting's wage when you have one.
      </Note>
      <p style={{ fontSize: 13, color: C.muted }}>
        Connections reflect hands-on, investigative, creative, helping and
        enterprising interests. Several paths can tie; their order is not a
        ranking of your potential. Paths with no matching answers are available
        in Browse all.
      </p>
      <Button
        onClick={() => setBrowseAll((v) => !v)}
        style={{ marginBottom: 24 }}
      >
        {browseAll ? "Show my interest connections" : "Browse all career paths"}
      </Button>
      <section aria-label="Hourly wage scenarios" style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20 }}>Try an hourly pay scenario</h2>
        <p style={{ fontSize: 13, color: C.muted }}>
          At 40 paid hours per week and 52 weeks. These are wage scenarios, not
          current employer quotes. Change the rate and schedule in Paycheck.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[20, 25, 30, 40].map((rate) => (
            <Button
              key={rate}
              onClick={() =>
                onSalary(
                  rate * 2080,
                  `${hourly(rate)}/hour, 40 hours × 52 weeks`,
                )
              }
            >
              {hourly(rate)}/hour
            </Button>
          ))}
        </div>
      </section>
      <div
        style={{
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: small ? "1fr" : "1fr 1fr",
          gap: "0 36px",
        }}
      >
        {careers.map((c, i) => {
          const net = takeHome(c.entry) / 12 + b.otherNet,
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
                {c.score > 0
                  ? "Interest connection"
                  : "Another path to explore"}{" "}
                {String(i + 1).padStart(2, "0")}
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
              {/Photograph|Real Estate/i.test(c.title) && (
                <Note tone="amber">
                  This path can involve freelance work or commissions. The
                  paycheck example treats the amount as employee wages; business
                  revenue needs expenses and self-employment taxes deducted
                  separately.
                </Note>
              )}
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
                    Annual pay example
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
                    Higher pay scenario
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
                  ? `${fmt(gap)}/month gap at the annual pay example.`
                  : `${fmt(-gap)}/month left after your plan at the annual pay example.`}
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
                <Button onClick={() => onSalary(c.entry, c.title)}>
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
        guaranteed outcomes. Compare training time and costs, daily work, and
        actual offers alongside the pay.
      </Note>
    </>
  );
}
function PaycheckPage({ a, b, salary, setSalary, update, small }) {
  const taxes = taxBreakdown(salary),
    net = takeHome(salary) / 12,
    available = net + b.otherNet,
    gap = available - b.total;
  const hours = a.comparisonHours,
    weeks = a.comparisonWeeks,
    paidHours = hours * weeks;
  const schedule = (key, value) => {
    const nextHours = key === "comparisonHours" ? value : hours;
    const nextWeeks = key === "comparisonWeeks" ? value : weeks;
    update({
      [key]: value,
      comparisonCareer: "",
      comparisonSalary:
        salary === null
          ? null
          : Math.round((salary / paidHours) * nextHours * nextWeeks * 100) /
            100,
    });
  };
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
        body="Enter an annual wage or convert an hourly offer. See a simplified monthly paystub and compare it with the life you planned. You can record a real posting on the Careers page."
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
            <AmountInput
              value={salary}
              allowBlank
              max={10000000}
              onChange={setSalary}
              placeholder="Enter an annual wage"
            />
          </Field>
          <Field
            label="Or enter an hourly wage"
            help="Regular paid hours only. Overtime premiums, tips and unpaid time need separate consideration."
          >
            <AmountInput
              value={
                salary === null
                  ? null
                  : Math.round((salary / paidHours) * 100) / 100
              }
              allowBlank
              max={Math.floor((10000000 / paidHours) * 100) / 100}
              onChange={(v) =>
                setSalary(
                  v === null ? null : Math.round(v * paidHours * 100) / 100,
                )
              }
            />
          </Field>
          <Field label="Paid hours per week">
            <AmountInput
              value={hours}
              min={1}
              max={80}
              onChange={(v) => schedule("comparisonHours", v)}
            />
          </Field>
          <Field label="Paid weeks per year">
            <AmountInput
              value={weeks}
              min={1}
              max={52}
              onChange={(v) => schedule("comparisonWeeks", v)}
            />
          </Field>
          {a.comparisonCareer && (
            <p style={{ color: C.muted, fontSize: 13 }}>
              Selected scenario: {a.comparisonCareer}
            </p>
          )}
          {a.jobTitle && a.comparisonCareer === a.jobTitle && (
            <Note style={{ marginBottom: 16 }}>
              Recorded posting: <strong>{a.jobTitle}</strong>, {a.jobSource}.
              Checked {a.jobReviewed}. The {a.jobHours}-hour, {a.jobWeeks}-week
              schedule is{" "}
              {a.jobSchedule === "stated"
                ? "stated in the posting"
                : "an assumption to verify"}
              .
              {safeSourceUrl(a.jobUrl) && (
                <>
                  {" "}
                  <a
                    href={safeSourceUrl(a.jobUrl)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: C.blue }}
                  >
                    Open posting
                  </a>
                  .
                </>
              )}
            </Note>
          )}
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
              {salary === null ? "Choose a wage" : fmt(Math.abs(gap))}
            </div>
            <p
              style={{
                boxSizing: "border-box",
                color: C.muted,
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              {salary === null
                ? "Enter a wage or choose a career scenario to compare it with your plan."
                : gap >= 0
                  ? "Left after living expenses and your savings target."
                  : "Still needed each month to cover living expenses and your savings target."}
              {salary !== null &&
                b.otherNet > 0 &&
                ` Includes ${fmt(b.otherNet)} in other available monthly income.`}
            </p>
          </div>
        </section>
        {salary !== null && (
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
                style={{
                  boxSizing: "border-box",
                  fontSize: 12,
                  fontWeight: 650,
                  minWidth: 0,
                  overflowWrap: "anywhere",
                }}
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
              Not an employer paystub or tax advice. Excludes credits,
              retirement contributions, garnishments, union dues, and benefit
              deductions. This is an annual tax estimate divided by 12, not an
              exact payroll withholding calculation.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
export function scenarioPatch(a, scenario, contribution) {
  if (scenario === "family")
    return {
      housing: "family",
      roommate: false,
      homeContribution: number(
        contribution ?? (a.housing === "family" ? a.homeContribution : 300),
        100000,
      ),
    };
  if (scenario === "roommate")
    return {
      housing: "2br",
      roommate: true,
      [a.budgetMode === "household"
        ? "householdHomeShare"
        : "personalHomeShare"]: 50,
    };
  return {};
}
export function scenarioBudget(a, scenario, contribution) {
  return budget({ ...a, ...scenarioPatch(a, scenario, contribution) });
}
function WhatIfPage({ a, b, scenario, setScenario, update, small }) {
  const contribution =
    a.whatIfContribution ?? (a.housing === "family" ? a.homeContribution : 300);
  const setContribution = (whatIfContribution) =>
    update({ whatIfContribution });
  const other = scenarioBudget(a, scenario, contribution),
    saving = b.total - other.total;
  const options = [
    {
      id: "roommate",
      l: "Share a two-bedroom rental",
      note: "Assign 50% of a $2,100 two-bedroom rent and shared utilities to this plan.",
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
              <AmountInput value={contribution} onChange={setContribution} />
            </Field>
          )}
          {scenario === "roommate" && (
            <Note>
              This assigns half of housing and shared utilities to this plan.
              Household type, children, coverage choices and other expenses stay
              the same. Check that a two-bedroom home and this bill share fit
              everyone involved.
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
          <p style={{ color: C.muted, fontSize: 13 }}>
            Living expenses change by{" "}
            {fmt(Math.abs(b.expenses - other.expenses))}/month; the general
            savings target changes by {fmt(Math.abs(b.savings - other.savings))}
            /month.
          </p>
          {Math.abs(saving) < 0.005 && (
            <Note>
              This alternative has the same monthly cost as your current plan.
            </Note>
          )}
          <Button
            primary
            style={{ margin: "18px 0" }}
            onClick={() =>
              visibleFieldsValid() &&
              update({
                ...scenarioPatch(a, scenario, contribution),
                resultView: "overview",
              })
            }
          >
            Use this alternative in my plan
          </Button>
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
        body={`Guide revised ${GUIDE_REVISED}. Local cost presets are classroom estimates; their individual quote dates were not supplied. Real job records include the source and date checked by the student.`}
      />
      <div style={{ boxSizing: "border-box", maxWidth: 850 }}>
        {[
          [
            "Local ballpark prices, with room for your situation.",
            "The cost presets support a Perris / Inland Empire classroom discussion and reflect local ballpark amounts supplied for this activity. They are not a live database or personalized quotes. This release has not independently rechecked each price or career pay example. Insurance risk tiers are teaching examples. Use actual listings, quotes and job offers when building a real plan.",
          ],
          [
            "The tax model uses 2024 rules, before credits.",
            "Federal single deduction: $14,600. California single deduction: $5,540. The model uses progressive federal and CA brackets, Social Security at 6.2% up to $168,600, Medicare at 1.45% plus 0.9% above $200,000, and 2024 CA SDI at 1.1% without a wage cap. It includes CA's additional 1% tax on taxable income above $1 million, but excludes personal exemption and other credits, itemized deductions, and benefit deductions. Family choices do not change filing status. These historical rules do not represent a verified 2026 paycheck.",
          ],
          [
            "Choose your share or a household plan.",
            "Personal mode includes your own costs and your assigned share of housing, shared utilities and child costs. A working partner defaults to a 50% share of shared bills and child costs, while their personal expenses and income stay outside your plan. A partner without earnings adds editable food, transport, healthcare and personal costs. Household mode includes both adults, 100% of entered child costs and any other adult wage. Housing bill shares are editable in either mode. Family contributions are already the amount assigned to the plan and are not divided again. Renters insurance remains a personal policy amount. Shared streaming is counted once. Other adult healthcare can include dependents; child medical costs are not otherwise automatic. The tax model still estimates each wage as a separate single filer.",
          ],
          [
            "Savings is a share of required take-home.",
            "Required take-home equals living expenses divided by (1 minus the savings rate). A 10% target on $2,970 of expenses requires $3,300 take-home and $330 savings. Loans are modeled at 6.5% over 120 monthly payments when selected. Side income defaults to money already after expenses and taxes. An optional gross scenario reserves 25%; actual self-employment taxes and business costs are not calculated. Changing the test paycheck keeps the original dollar savings target rather than recalculating its percentage of that paycheck.",
          ],
          [
            "Career matches connect interests, not aptitude or outcomes.",
            "The six-question activity is not a validated assessment. It omits the Conventional category of the full Holland framework. Matching uses your interest answers only, not salary or assumptions about your academic ability. Pay examples are scenarios, not verified entry-level or experienced wages. There are no success probabilities, guaranteed job placements, or guaranteed raises. Combined titles may cover several BLS occupations.",
          ],
          [
            "Original plans, setup cash and challenges stay separate.",
            "Your first completed plan is retained for comparison when you edit your choices. Both plans use the same current classroom cost and tax model. Starting cash is the first month's plan plus the setup amounts you enter, not another monthly expense. All four setup amounts, including zeros, must be entered to complete that estimate. The hours-change challenge assumes pay changes in proportion to paid hours and does not overwrite your selected wage. Your reflection and full job notes are included in progress files.",
          ],
          [
            "Some large real-life costs are outside the monthly plan.",
            "The setup panel can include deposits, moving fees and home or vehicle purchase cash when you enter them. Emergency medical bills, benefit eligibility changes, parking, tolls, and unpaid time are not automatically added. Savings set aside for repairs or other goals can overlap if you select multiple reserves. Read the selected line items, then compare the result with the details of your own situation.",
          ],
          [
            "Your answers stay in this tab.",
            "There is no account or upload of your answers. Refreshing or closing the tab clears the plan. Save progress downloads a JSON file with your name or nickname, original and current plans, job notes, estimates, comparison inputs and reflection. Open progress restores it later on this or another device. Keep that file somewhere appropriate, especially on a shared school computer. A nickname is enough. You can also print a discussion summary.",
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
  const first = a.originalPlan ? budget(a.originalPlan) : b;
  const guess = a.originalPlan
    ? a.originalPlan.predictionSalary
    : a.predictionSalary;
  const cash = startingCash(a),
    challenge = a.challengeTried ? hoursChallenge(a) : null;
  const gap =
    salary === null ? null : takeHome(salary) / 12 + b.otherNet - b.total;
  const title = { fontSize: 12, margin: "12px 0 6px", fontWeight: 750 };
  const cell = {
    padding: "6px 4px",
    borderBottom: `1px solid ${C.line}`,
    textAlign: "right",
  };
  const removed = [
    rented(a.housing) && a.rOut && "renter's insurance",
    find(HOUSING, a.housing)?.ins === "homeowners" &&
      a.hOut &&
      "homeowner's insurance",
    find(TRANS, a.trans)?.car && a.ciOut && "car insurance",
    find(TRANS, a.trans)?.car && a.crOut && "registration",
    a.hlOut && "health coverage",
  ].filter(Boolean);
  return (
    <article
      style={{
        boxSizing: "border-box",
        fontFamily: "system-ui,sans-serif",
        color: C.ink,
        background: "#fff",
        fontSize: 10,
        lineHeight: 1.45,
        maxWidth: 710,
        margin: "0 auto",
        padding: 15,
        overflowWrap: "anywhere",
      }}
    >
      <div style={{ ...eyebrow, fontSize: 9 }}>
        What Will Your Life Cost? · A student guide
      </div>
      <h1 style={{ fontSize: 26, letterSpacing: -0.8, margin: "9px 0 3px" }}>
        {a.name}'s next chapter
      </h1>
      <p style={{ margin: "0 0 12px", color: C.muted }}>
        Grade {a.grade} ·{" "}
        {new Date().toLocaleDateString("en-US", {
          timeZone: "America/Los_Angeles",
        })}{" "}
        · {b.scopeLabel}. A possible future, not a prediction.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 15,
          borderTop: `2px solid ${C.ink}`,
          borderBottom: `1px solid ${C.line}`,
          padding: "12px 0",
        }}
      >
        {[
          ["Monthly plan", fmt(b.total)],
          ["Your annual wages needed", fmt(b.salary)],
          ["At 40 hours × 52 weeks", `${hourly(b.salary / 2080)}/hour`],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{ color: C.muted, fontSize: 9 }}>{label}</div>
            <strong style={{ fontSize: 21, letterSpacing: -0.6 }}>
              {value}
            </strong>
          </div>
        ))}
      </div>
      <p style={{ margin: "9px 0" }}>
        {guess === null || guess === undefined
          ? "My first salary prediction was not recorded."
          : `I first guessed ${fmt(guess)}/year. My original plan needed ${fmt(first.salary)}/year.`}
      </p>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}
      >
        <caption style={{ textAlign: "left", ...title }}>
          Original and current plans
        </caption>
        <thead>
          <tr>
            <th scope="col" style={{ ...cell, textAlign: "left" }}>
              Compare
            </th>
            <th scope="col" style={cell}>
              Original
            </th>
            <th scope="col" style={cell}>
              Current
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Monthly plan", first.total, b.total],
            ["General savings / month", first.savings, b.savings],
            ["Your annual wages needed", first.salary, b.salary],
          ].map(([label, before, after]) => (
            <tr key={label}>
              <th
                scope="row"
                style={{ ...cell, textAlign: "left", fontWeight: 500 }}
              >
                {label}
              </th>
              <td style={cell}>{fmt(before)}</td>
              <td style={cell}>{fmt(after)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {first.household !== b.household && (
        <p>
          The scope changed between a personal share and a household total. The
          plans cover different people.
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        <section>
          <h2 style={title}>My monthly plan</h2>
          {GROUPS.map((group, i) => (
            <div
              key={group.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "4px 0",
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              <span>{group.name}</span>
              <strong>{fmt(b.groups[i])}</strong>
            </div>
          ))}
          <p style={{ marginBottom: 0 }}>
            General savings target: {Math.round(b.rate * 100)}% at required
            income.
            {b.sideNet > 0 ? ` Net side income: ${fmt(b.sideNet)}/month.` : ""}
            {b.partnerNet > 0
              ? ` Other adult's estimated take-home: ${fmt(b.partnerNet)}/month.`
              : ""}
          </p>
        </section>
        <section>
          <h2 style={title}>My biggest choices</h2>
          <p style={{ marginTop: 0 }}>
            Housing: {find(HOUSING, a.housing)?.l}
            {a.roommate ? ", with a roommate" : ""}
            <br />
            Transportation: {find(TRANS, a.trans)?.l}
            <br />
            Household: {find(HTYPE, a.htype)?.l}; {find(KIDS, a.kids)?.l}
            <br />
            Student loans:{" "}
            {fmt(["trade", "cc", "4year"].includes(a.plan) ? a.loan : 0)}{" "}
            borrowed
            {["trade", "cc", "4year"].includes(a.plan) && a.loan > 0
              ? `; ${fmt(loanPayment(a.loan))}/month`
              : ""}
          </p>
        </section>
      </div>
      <section style={{ borderTop: `1px solid ${C.line}`, marginTop: 12 }}>
        <h2 style={title}>My wage check</h2>
        <p style={{ margin: "0 0 8px" }}>
          {salary === null
            ? "No comparison wage selected yet."
            : `${a.comparisonCareer ? a.comparisonCareer + ": " : ""}${fmt(salary)}/year gross at ${a.comparisonHours} paid hours/week × ${a.comparisonWeeks} weeks. Estimated take-home: ${fmt(takeHome(salary) / 12)}/month${b.otherNet > 0 ? ` plus ${fmt(b.otherNet)} other net income` : ""}. ${fmt(Math.abs(gap))}/month ${gap < 0 ? "shortfall" : "left after the plan"}.`}
        </p>
        {a.jobTitle && (
          <p style={{ margin: "0 0 8px" }}>
            Recorded job: <strong>{a.jobTitle}</strong>,{" "}
            {a.jobSource || "source not recorded"}. Checked:{" "}
            {a.jobReviewed || "date not recorded"}. Schedule:{" "}
            {a.jobSchedule === "stated" ? "stated in posting" : "assumed"}.
            {safeSourceUrl(a.jobUrl) && (
              <>
                {" "}
                <a href={safeSourceUrl(a.jobUrl)} style={{ color: C.blue }}>
                  Recorded posting
                </a>
                .
              </>
            )}
            {a.jobTraining && ` Training: ${a.jobTraining}`}
            {a.jobBenefits && ` Benefits to check: ${a.jobBenefits}`}
          </p>
        )}
        {cash.complete && (
          <p style={{ margin: "0 0 8px" }}>
            Starting cash: <strong>{fmt(cash.total)}</strong> for the first
            month and setup, including {fmt(cash.extras)} in setup extras.{" "}
            {fmt(cash.remaining)} still to set aside after the planning amount
            entered. These extras are separate from the ongoing monthly plan.
          </p>
        )}
        {!cash.complete && (cash.extras > 0 || a.startCashSaved > 0) && (
          <p>
            Starting-cash estimate is incomplete. Setup extras entered so far:{" "}
            {fmt(cash.extras)}.
          </p>
        )}
        {challenge && (
          <p style={{ margin: "0 0 8px" }}>
            Hours-change discussion: {challenge.hours} hours/week,{" "}
            {fmt(challenge.salary)}/year gross. {fmt(Math.abs(challenge.gap))}
            /month {challenge.gap < 0 ? "shortfall" : "left"} against the
            current plan. This is a separate scenario.
          </p>
        )}
      </section>
      <section style={{ borderTop: `1px solid ${C.line}`, paddingTop: 3 }}>
        {[
          ["The expense that surprised me most was…", a.reflectionSurprise],
          ["The choice I would change is… because…", a.reflectionChange],
          ["One step I can take now is…", a.reflectionNext],
        ].map(([label, answer]) => (
          <div key={label} style={{ breakInside: "avoid" }}>
            <h2 style={title}>{label}</h2>
            {answer.trim() ? (
              <p style={{ margin: "0 0 8px", whiteSpace: "pre-wrap" }}>
                {answer}
              </p>
            ) : (
              <div
                style={{ height: 22, borderBottom: `1px solid ${C.line}` }}
              />
            )}
          </div>
        ))}
      </section>
      {removed.length > 0 && (
        <p style={{ fontSize: 9 }}>
          Excluded: {removed.join(", ")}. Financial or legal risks remain;
          review the itemized budget.
        </p>
      )}
      <p
        style={{
          color: C.muted,
          fontSize: 8,
          lineHeight: 1.5,
          borderTop: `1px solid ${C.line}`,
          paddingTop: 10,
          marginTop: 12,
        }}
      >
        Guide revised {GUIDE_REVISED}. Local classroom estimates; individual
        quote dates were not supplied. Actual costs and wages vary. Historical
        2024 single-filer tax model before credits and benefits. Wage estimates
        are not job offers. Review dependent healthcare, bill shares and medical
        reserves. Save a progress file to keep the full editable plan.
      </p>
    </article>
  );
}
function Results({
  a,
  update,
  onEdit,
  onNew,
  small,
  isExample,
  onSave,
  onLoad,
}) {
  const view = a.resultView,
    scenario = a.whatIfScenario,
    salary = a.comparisonSalary;
  const setView = (resultView) => update({ resultView });
  const setScenario = (whatIfScenario) => update({ whatIfScenario });
  const setSalary = (
    comparisonSalary,
    comparisonCareer = "",
    schedule = null,
  ) =>
    update({
      comparisonSalary,
      comparisonCareer,
      challengeHours: null,
      ...(comparisonCareer
        ? schedule || { comparisonHours: 40, comparisonWeeks: 52 }
        : {}),
    });
  const b = useMemo(() => budget(a), [a]),
    screen = useRef(null),
    print = useRef(null),
    heading = useRef(null);
  useEffect(() => {
    if (!a.originalPlan) update({ originalPlan: captureOriginal(a) });
  }, [a.originalPlan]);
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
    if (!visibleFieldsValid()) return;
    setView(next);
    window.scrollTo(0, 0);
    requestAnimationFrame(() => heading.current?.focus());
  };
  const printPlan = () => visibleFieldsValid() && window.print();
  const nav = [
    ["overview", "Overview"],
    ["budget", "Your budget"],
    ["careers", "Careers"],
    ["paycheck", "Paycheck"],
    ["whatif", "What-if"],
    ["reflection", "My next step"],
    ["sources", "Assumptions"],
  ];
  return (
    <>
      <div ref={screen}>
        <Header small={small} onSave={onSave} onLoad={onLoad}>
          <button
            type="button"
            onClick={() => onEdit(0)}
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
              update={update}
              onScenario={(s) => {
                setScenario(s);
                show("whatif");
              }}
              onPrint={printPlan}
              onEdit={onEdit}
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
              update={update}
              onEdit={onEdit}
              onSalary={(s, career, schedule) => {
                setSalary(s, career, schedule);
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
              update={update}
              small={small}
            />
          )}
          {view === "whatif" && (
            <WhatIfPage
              a={a}
              b={b}
              scenario={scenario}
              setScenario={setScenario}
              update={update}
              small={small}
            />
          )}
          {view === "reflection" && (
            <ReflectionPage
              a={a}
              b={b}
              update={update}
              small={small}
              onPrint={printPlan}
              onView={show}
              onEdit={onEdit}
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
function Welcome({ small, onStart, onExample, onLoad }) {
  const b = budget(DEMO);
  return (
    <>
      <Header small={small} onLoad={onLoad}>
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
              13 short steps · Make a guess, build, compare and reflect · No
              account needed
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
          Local planning estimates for a Perris / Inland Empire classroom. Your
          situation and actual prices will differ. Taxes use a historical 2024
          model. No account is needed. Save a progress file before refreshing or
          closing the tab; open it later to continue. A nickname is enough.
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
  const [fileError, setFileError] = useState("");
  const [editing, setEditing] = useState(false);
  const fileInput = useRef(null);
  const clearExampleLink = () => {
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("example")
    ) {
      const url = new URL(window.location.href);
      url.searchParams.delete("example");
      try {
        window.history.replaceState(
          null,
          "",
          url.pathname + url.search + url.hash,
        );
      } catch {
        /* Some embedded previews restrict history access. */
      }
    }
  };
  const save = () => {
    if (!visibleFieldsValid()) return;
    const contents = serializePlan(a, step, mode);
    const url = URL.createObjectURL(
      new Blob([contents], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `life-plan-${a.name.replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "student"}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const open = () => fileInput.current?.click();
  const loadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 500000)
        throw new Error("Choose a progress file smaller than 500 KB.");
      const restored = parseSavedPlan(await file.text());
      setA(restored.plan);
      setStep(restored.step);
      setEditing(false);
      setExample(false);
      clearExampleLink();
      setFileError("");
      enter(restored.screen);
    } catch (error) {
      setFileError(`${error.message} Your current plan has been kept.`);
    }
  };
  useEffect(() => {
    const title = document.querySelector("main h1");
    if (title) {
      title.tabIndex = -1;
      title.style.outline = "none";
      title.focus();
    }
  }, [mode]);
  const update = (patch) => {
    if (
      Object.keys(patch).some(
        (key) =>
          ![
            ...LEARNING_FIELDS,
            "resultView",
            "whatIfScenario",
            "whatIfContribution",
            "comparisonSalary",
            "comparisonCareer",
            "comparisonHours",
            "comparisonWeeks",
          ].includes(key),
      )
    ) {
      setExample(false);
      clearExampleLink();
    }
    setA((previous) => ({ ...previous, ...patch }));
  };
  const enter = (next) => {
    setMode(next);
    window.scrollTo(0, 0);
  };
  const start = () => {
    setExample(false);
    clearExampleLink();
    setEditing(false);
    setFileError("");
    setA({ ...EMPTY });
    setStep(0);
    enter("wizard");
  };
  const newPlan = () => {
    if (isExample) start();
    else
      setDecision({
        title: "Start a new plan?",
        body: "This will clear your current answers. Save a progress file or print your summary first if you want to keep a copy.",
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
        minWidth: 0,
        overflowWrap: "anywhere",
      }}
    >
      <input
        type="file"
        accept=".json,application/json"
        ref={fileInput}
        aria-label="Open a saved progress file"
        onChange={loadFile}
        style={{ display: "none" }}
      />
      {fileError && (
        <div
          role="alert"
          style={{
            padding: "16px 24px",
            background: C.lightAmber,
            color: C.ink,
          }}
        >
          {fileError} <Button onClick={() => setFileError("")}>Dismiss</Button>
        </div>
      )}
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
          onLoad={open}
        />
      )}
      {mode === "wizard" && (
        <Wizard
          a={a}
          update={update}
          step={step}
          setStep={setStep}
          onFinish={() => {
            setA((previous) => ({
              ...previous,
              originalPlan: previous.originalPlan || captureOriginal(previous),
              resultView: "overview",
            }));
            enter("results");
          }}
          onSave={save}
          onLoad={open}
          editing={editing}
          onHome={() => enter("welcome")}
          small={small}
        />
      )}
      {mode === "results" && (
        <Results
          a={a}
          update={update}
          onSave={save}
          onLoad={open}
          onEdit={(nextStep = 0) => {
            if (!visibleFieldsValid()) return;
            setEditing(true);
            setStep(nextStep);
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
