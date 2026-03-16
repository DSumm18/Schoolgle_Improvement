#!/usr/bin/env node
/**
 * Aurora Primary School – Test Data Harness Generator
 *
 * Generates realistic, internally-consistent Excel files that mimic
 * Arbor MIS exports, Insight Tracker exports, DfE data and teacher
 * spreadsheets for a 2-form-entry UK primary school.
 *
 * Run:  node apps/platform/scripts/generate-test-harness.mjs
 */

import XLSX from "xlsx";
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, "..", "test-harness", "aurora-primary");

// ──────────────────────────────────────────────
// 0.  SEEDED PRNG
// ──────────────────────────────────────────────
let _seed = 42;
function seededRandom(seed) {
  if (seed !== undefined) _seed = seed;
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function rng() {
  return seededRandom();
}
function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function pickWeighted(arr, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// ──────────────────────────────────────────────
// 1.  NAME POOLS (UK diverse population)
// ──────────────────────────────────────────────
const FIRST_NAMES_MALE = [
  "Oliver",
  "Jack",
  "Harry",
  "George",
  "Noah",
  "Leo",
  "Arthur",
  "Muhammad",
  "Oscar",
  "Charlie",
  "Jacob",
  "Henry",
  "Thomas",
  "Alfie",
  "Theo",
  "William",
  "Freddie",
  "James",
  "Joshua",
  "Edward",
  "Alexander",
  "Ethan",
  "Lucas",
  "Daniel",
  "Archie",
  "Adam",
  "Isaac",
  "Max",
  "Liam",
  "Samuel",
  "Finley",
  "Joseph",
  "Sebastian",
  "Harrison",
  "Mason",
  "Logan",
  "Caleb",
  "Reuben",
  "Dylan",
  "Jayden",
  "Aiden",
  "Kai",
  "Ibrahim",
  "Yusuf",
  "Zain",
  "Arjun",
  "Rohan",
  "Krish",
  "Jakub",
  "Mateusz",
  "Filip",
  "Kacper",
  "Oliwier",
  "Mohammed",
  "Ahmed",
  "Ali",
  "Hamza",
  "Bilal",
  "Umar",
  "Idris",
  "Kwame",
  "Kofi",
  "Emeka",
  "Chidi",
  "Tunde",
  "Ayo",
  "Dexter",
  "Ezra",
  "Otis",
  "Felix",
  "David",
  "Ryan",
  "Luke",
  "Nathan",
  "Callum",
  "Tyler",
  "Reece",
  "Cameron",
  "Ben",
  "Toby",
  "Riley",
  "Aaron",
  "Elijah",
  "Jude",
  "Louie",
  "Hugo",
  "Reggie",
  "Teddy",
  "Stanley",
  "Roman",
  "Arlo",
  "Chester",
  "Rupert",
  "Frankie",
  "Elliot",
  "Jasper",
  "Sonny",
  "Ronnie",
  "Harley",
  "Bobby",
];
const FIRST_NAMES_FEMALE = [
  "Olivia",
  "Amelia",
  "Isla",
  "Ava",
  "Mia",
  "Ivy",
  "Lily",
  "Isabella",
  "Rosie",
  "Sophia",
  "Grace",
  "Freya",
  "Florence",
  "Poppy",
  "Willow",
  "Phoebe",
  "Evie",
  "Sienna",
  "Jessica",
  "Alice",
  "Emily",
  "Ella",
  "Charlotte",
  "Ruby",
  "Harper",
  "Daisy",
  "Maisie",
  "Elsie",
  "Aria",
  "Luna",
  "Emilia",
  "Matilda",
  "Layla",
  "Eva",
  "Chloe",
  "Penelope",
  "Lucy",
  "Millie",
  "Aisha",
  "Fatima",
  "Zara",
  "Yasmin",
  "Aaliyah",
  "Priya",
  "Ananya",
  "Diya",
  "Riya",
  "Maja",
  "Zofia",
  "Hania",
  "Wiktoria",
  "Alicja",
  "Lena",
  "Chioma",
  "Amara",
  "Ngozi",
  "Abigail",
  "Harriet",
  "Martha",
  "Iris",
  "Thea",
  "Eleanor",
  "Violet",
  "Clara",
  "Imogen",
  "Scarlett",
  "Orla",
  "Niamh",
  "Erin",
  "Georgia",
  "Molly",
  "Amber",
  "Summer",
  "Neve",
  "Bethany",
  "Holly",
  "Leah",
  "Paige",
  "Katie",
  "Ellie",
  "Maya",
  "Noor",
  "Sara",
  "Maryam",
  "Khadija",
  "Halima",
  "Safiya",
  "Inaya",
  "Zahra",
  "Ruqayyah",
  "Ada",
  "Esme",
  "Nancy",
  "Margot",
  "Bonnie",
  "Heidi",
  "Darcy",
  "Lacey",
  "Brooke",
  "Skye",
];
const SURNAMES = [
  "Smith",
  "Jones",
  "Williams",
  "Brown",
  "Taylor",
  "Davies",
  "Wilson",
  "Evans",
  "Thomas",
  "Johnson",
  "Roberts",
  "Walker",
  "Wright",
  "Robinson",
  "Thompson",
  "Hall",
  "Clarke",
  "Green",
  "Wood",
  "Harris",
  "Lewis",
  "Martin",
  "Jackson",
  "White",
  "King",
  "Turner",
  "Hill",
  "Scott",
  "Adams",
  "Baker",
  "Khan",
  "Ali",
  "Ahmed",
  "Hussain",
  "Begum",
  "Islam",
  "Chowdhury",
  "Rahman",
  "Malik",
  "Shah",
  "Patel",
  "Singh",
  "Sharma",
  "Kumar",
  "Gupta",
  "Kaur",
  "Desai",
  "Mehta",
  "Joshi",
  "Nair",
  "Kowalski",
  "Nowak",
  "Wiśniewski",
  "Mazur",
  "Krawczyk",
  "Zieliński",
  "Wójcik",
  "Kozłowski",
  "Okonkwo",
  "Adebayo",
  "Osei",
  "Mensah",
  "Afolabi",
  "Okoro",
  "Asante",
  "Boateng",
  "Murphy",
  "O'Brien",
  "Kelly",
  "Ryan",
  "Sullivan",
  "McCarthy",
  "Walsh",
  "Byrne",
  "Campbell",
  "Stewart",
  "Anderson",
  "MacDonald",
  "Fraser",
  "Murray",
  "Ross",
  "Hamilton",
  "Chen",
  "Li",
  "Wang",
  "Zhang",
  "Liu",
  "Yang",
  "Wu",
  "Lin",
  "Zhou",
  "Huang",
  "Edwards",
  "Phillips",
  "Mitchell",
  "Carter",
  "Collins",
  "Morgan",
  "Bennett",
  "Cook",
  "Price",
  "Patterson",
  "Foster",
  "Henderson",
  "Rogers",
  "Gray",
  "Palmer",
  "Marshall",
  "Spencer",
  "Douglas",
  "Gordon",
  "Burns",
  "Crawford",
  "Fleming",
  "Graham",
  "Barker",
];

const ETHNICITIES = [
  { code: "WBRI", label: "White British", weight: 55 },
  { code: "WIRI", label: "White Irish", weight: 2 },
  { code: "WOTH", label: "Any Other White Background", weight: 8 },
  { code: "MWBC", label: "White and Black Caribbean", weight: 2 },
  { code: "MWBA", label: "White and Black African", weight: 1 },
  { code: "MWAS", label: "White and Asian", weight: 2 },
  { code: "MOTH", label: "Any Other Mixed Background", weight: 2 },
  { code: "AIND", label: "Indian", weight: 4 },
  { code: "APKN", label: "Pakistani", weight: 8 },
  { code: "ABAN", label: "Bangladeshi", weight: 3 },
  { code: "AOTH", label: "Any Other Asian Background", weight: 2 },
  { code: "BCRB", label: "Black Caribbean", weight: 2 },
  { code: "BAFR", label: "Black African", weight: 4 },
  { code: "BOTH", label: "Any Other Black Background", weight: 1 },
  { code: "CHNE", label: "Chinese", weight: 1 },
  { code: "OOTH", label: "Any Other Ethnic Group", weight: 3 },
];
const ETHNICITY_CODES = ETHNICITIES.map((e) => e.code);
const ETHNICITY_WEIGHTS = ETHNICITIES.map((e) => e.weight);

const LANGUAGES = [
  { lang: "English", weight: 85 },
  { lang: "Urdu", weight: 4 },
  { lang: "Punjabi", weight: 2 },
  { lang: "Bengali", weight: 2 },
  { lang: "Polish", weight: 3 },
  { lang: "Arabic", weight: 1 },
  { lang: "Gujarati", weight: 1 },
  { lang: "Somali", weight: 1 },
  { lang: "Romanian", weight: 1 },
];
const LANG_VALS = LANGUAGES.map((l) => l.lang);
const LANG_WEIGHTS = LANGUAGES.map((l) => l.weight);

const SEN_NEEDS = [
  "SPLD",
  "MLD",
  "SLD",
  "PMLD",
  "SEMH",
  "SLCN",
  "HI",
  "VI",
  "MSI",
  "PD",
  "ASD",
  "OTH",
];

// ──────────────────────────────────────────────
// 2.  SCHOOL STRUCTURE CONSTANTS
// ──────────────────────────────────────────────
const YEAR_GROUPS = ["R", "1", "2", "3", "4", "5", "6"];
const CLASS_NAMES = {
  R: ["Oak", "Maple"],
  1: ["Birch", "Elm"],
  2: ["Ash", "Willow"],
  3: ["Holly", "Rowan"],
  4: ["Pine", "Cedar"],
  5: ["Chestnut", "Beech"],
  6: ["Sycamore", "Hazel"],
};
const ACADEMIC_YEARS = [
  "2019-20",
  "2020-21",
  "2021-22",
  "2022-23",
  "2023-24",
  "2024-25",
  "2025-26",
];
const CURRENT_YEAR = "2025-26";
const TERMS = ["Autumn", "Spring", "Summer"];
const HALF_TERMS = ["Aut1", "Aut2", "Spr1", "Spr2", "Sum1", "Sum2"];

// ──────────────────────────────────────────────
// 3.  STAFF DATA
// ──────────────────────────────────────────────
const STAFF = [
  {
    id: "STF-001",
    title: "Mrs",
    first: "Sarah",
    last: "Williams",
    role: "Headteacher",
    fte: 1.0,
    teaches: "Y6 Hazel",
    teachFte: 0.4,
    payScale: "L18",
    startDate: "2015-09-01",
    absenceDays: 3,
  },
  {
    id: "STF-002",
    title: "Mr",
    first: "James",
    last: "Thompson",
    role: "Deputy Headteacher",
    fte: 1.0,
    teaches: "",
    teachFte: 0,
    payScale: "L10",
    startDate: "2017-09-01",
    absenceDays: 5,
  },
  {
    id: "STF-003",
    title: "Mrs",
    first: "Rachel",
    last: "Green",
    role: "Assistant Head / SENCO",
    fte: 1.0,
    teaches: "",
    teachFte: 0,
    payScale: "L5",
    startDate: "2016-09-01",
    absenceDays: 2,
  },
  {
    id: "STF-004",
    title: "Miss",
    first: "Lucy",
    last: "Chen",
    role: "Class Teacher (ECT)",
    fte: 1.0,
    teaches: "R Oak",
    teachFte: 1.0,
    payScale: "M1",
    startDate: "2024-09-01",
    absenceDays: 4,
  },
  {
    id: "STF-005",
    title: "Mrs",
    first: "Maria",
    last: "Santos",
    role: "Class Teacher",
    fte: 1.0,
    teaches: "R Maple",
    teachFte: 1.0,
    payScale: "M4",
    startDate: "2020-09-01",
    absenceDays: 1,
  },
  {
    id: "STF-006",
    title: "Mr",
    first: "David",
    last: "Harris",
    role: "Class Teacher",
    fte: 1.0,
    teaches: "Y1 Birch",
    teachFte: 1.0,
    payScale: "M3",
    startDate: "2021-09-01",
    absenceDays: 6,
  },
  {
    id: "STF-007",
    title: "Mrs",
    first: "Emma",
    last: "Clarke",
    role: "Class Teacher",
    fte: 1.0,
    teaches: "Y1 Elm",
    teachFte: 1.0,
    payScale: "M5",
    startDate: "2018-09-01",
    absenceDays: 2,
  },
  {
    id: "STF-008",
    title: "Mrs",
    first: "Karen",
    last: "White",
    role: "Class Teacher (Job Share)",
    fte: 0.6,
    teaches: "Y2 Willow",
    teachFte: 0.6,
    payScale: "M6",
    startDate: "2014-09-01",
    absenceDays: 3,
  },
  {
    id: "STF-009",
    title: "Ms",
    first: "Priya",
    last: "Patel",
    role: "Class Teacher / Maths Lead",
    fte: 1.0,
    teaches: "Y2 Ash",
    teachFte: 1.0,
    payScale: "UPS1",
    startDate: "2019-09-01",
    absenceDays: 1,
  },
  {
    id: "STF-010",
    title: "Mrs",
    first: "Jane",
    last: "Patterson",
    role: "Class Teacher",
    fte: 1.0,
    teaches: "Y3 Holly",
    teachFte: 1.0,
    payScale: "M5",
    startDate: "2016-09-01",
    absenceDays: 67,
  },
  {
    id: "STF-011",
    title: "Mr",
    first: "Robert",
    last: "Taylor",
    role: "Class Teacher",
    fte: 1.0,
    teaches: "Y3 Rowan",
    teachFte: 1.0,
    payScale: "M4",
    startDate: "2019-09-01",
    absenceDays: 4,
  },
  {
    id: "STF-012",
    title: "Mrs",
    first: "Helen",
    last: "Campbell",
    role: "Class Teacher",
    fte: 1.0,
    teaches: "Y4 Cedar",
    teachFte: 1.0,
    payScale: "UPS2",
    startDate: "2013-09-01",
    absenceDays: 2,
  },
  {
    id: "STF-013",
    title: "Mr",
    first: "Simon",
    last: "Lee",
    role: "Class Teacher",
    fte: 1.0,
    teaches: "Y4 Pine",
    teachFte: 1.0,
    payScale: "M6",
    startDate: "2018-09-01",
    absenceDays: 5,
  },
  {
    id: "STF-014",
    title: "Mr",
    first: "Tom",
    last: "Davies",
    role: "Class Teacher",
    fte: 1.0,
    teaches: "Y5 Beech",
    teachFte: 1.0,
    payScale: "M5",
    startDate: "2019-09-01",
    absenceDays: 42,
  },
  {
    id: "STF-015",
    title: "Mrs",
    first: "Laura",
    last: "Mitchell",
    role: "Class Teacher",
    fte: 1.0,
    teaches: "Y5 Chestnut",
    teachFte: 1.0,
    payScale: "UPS1",
    startDate: "2017-09-01",
    absenceDays: 3,
  },
  {
    id: "STF-016",
    title: "Mrs",
    first: "Amanda",
    last: "Foster",
    role: "PPA Cover Teacher",
    fte: 0.6,
    teaches: "Y5 PPA",
    teachFte: 0.6,
    payScale: "M3",
    startDate: "2020-09-01",
    absenceDays: 1,
  },
  {
    id: "STF-017",
    title: "Mr",
    first: "Andrew",
    last: "Brown",
    role: "Class Teacher",
    fte: 1.0,
    teaches: "Y6 Sycamore",
    teachFte: 1.0,
    payScale: "UPS3",
    startDate: "2011-09-01",
    absenceDays: 2,
  },
  {
    id: "STF-018",
    title: "Mrs",
    first: "Claire",
    last: "Robinson",
    role: "Business Manager",
    fte: 1.0,
    teaches: "",
    teachFte: 0,
    payScale: "SO2",
    startDate: "2018-01-08",
    absenceDays: 4,
  },
  {
    id: "STF-019",
    title: "Mr",
    first: "Keith",
    last: "Johnson",
    role: "Site Manager",
    fte: 1.0,
    teaches: "",
    teachFte: 0,
    payScale: "SC5",
    startDate: "2012-04-01",
    absenceDays: 8,
  },
  {
    id: "STF-020",
    title: "Mrs",
    first: "Tracy",
    last: "Morgan",
    role: "School Secretary",
    fte: 1.0,
    teaches: "",
    teachFte: 0,
    payScale: "SC3",
    startDate: "2015-09-01",
    absenceDays: 12,
  },
  {
    id: "STF-021",
    title: "Ms",
    first: "Sarah",
    last: "Wright",
    role: "Teaching Assistant (1:1 EHCP)",
    fte: 1.0,
    teaches: "Y4 Pine",
    teachFte: 0,
    payScale: "SC4",
    startDate: "2022-09-01",
    absenceDays: 3,
  },
  {
    id: "STF-022",
    title: "Mrs",
    first: "Jennifer",
    last: "Hall",
    role: "Class Teacher (Job Share)",
    fte: 0.4,
    teaches: "Y2 Willow",
    teachFte: 0.4,
    payScale: "M5",
    startDate: "2014-09-01",
    absenceDays: 2,
  },
  {
    id: "STF-023",
    title: "Mr",
    first: "Patrick",
    last: "Walsh",
    role: "Supply Teacher",
    fte: 0,
    teaches: "Y5 Beech (Supply Aut 2024)",
    teachFte: 0,
    payScale: "Supply",
    startDate: "2024-09-02",
    absenceDays: 0,
  },
  {
    id: "STF-024",
    title: "Mrs",
    first: "Sandra",
    last: "Blackwell",
    role: "Supply Teacher",
    fte: 0,
    teaches: "Y3 Holly (Supply Spr 2025)",
    teachFte: 0,
    payScale: "Supply",
    startDate: "2025-01-06",
    absenceDays: 0,
  },
  {
    id: "STF-025",
    title: "Mrs",
    first: "Donna",
    last: "Price",
    role: "Teaching Assistant",
    fte: 1.0,
    teaches: "Y1/Y2",
    teachFte: 0,
    payScale: "SC3",
    startDate: "2019-09-01",
    absenceDays: 5,
  },
  {
    id: "STF-026",
    title: "Mr",
    first: "Marcus",
    last: "Edwards",
    role: "Teaching Assistant",
    fte: 1.0,
    teaches: "Y5/Y6",
    teachFte: 0,
    payScale: "SC3",
    startDate: "2021-09-01",
    absenceDays: 3,
  },
];

// Teacher → Class history (year → [{class, staffId}])
// This drives Story 8 (Lee) and Story 9 (Patel)
const TEACHER_CLASS_HISTORY = [
  // Ms Patel: Y2 Ash every year from 2022-23 onwards
  { staffId: "STF-009", year: "2019-20", yearGroup: "1", className: "Birch" },
  { staffId: "STF-009", year: "2020-21", yearGroup: "1", className: "Elm" },
  { staffId: "STF-009", year: "2021-22", yearGroup: "2", className: "Willow" },
  { staffId: "STF-009", year: "2022-23", yearGroup: "2", className: "Ash" },
  { staffId: "STF-009", year: "2023-24", yearGroup: "2", className: "Ash" },
  { staffId: "STF-009", year: "2024-25", yearGroup: "2", className: "Ash" },
  { staffId: "STF-009", year: "2025-26", yearGroup: "2", className: "Ash" },
  // Mr Lee: moves across year groups
  { staffId: "STF-013", year: "2019-20", yearGroup: "2", className: "Ash" },
  { staffId: "STF-013", year: "2020-21", yearGroup: "3", className: "Rowan" },
  { staffId: "STF-013", year: "2021-22", yearGroup: "4", className: "Pine" },
  {
    staffId: "STF-013",
    year: "2022-23",
    yearGroup: "5",
    className: "Chestnut",
  },
  { staffId: "STF-013", year: "2023-24", yearGroup: "4", className: "Cedar" },
  { staffId: "STF-013", year: "2024-25", yearGroup: "4", className: "Pine" },
  { staffId: "STF-013", year: "2025-26", yearGroup: "4", className: "Pine" },
  // Mrs Williams (HT teaching 0.4 Y6 Hazel)
  { staffId: "STF-001", year: "2022-23", yearGroup: "6", className: "Hazel" },
  { staffId: "STF-001", year: "2023-24", yearGroup: "6", className: "Hazel" },
  { staffId: "STF-001", year: "2024-25", yearGroup: "6", className: "Hazel" },
  { staffId: "STF-001", year: "2025-26", yearGroup: "6", className: "Hazel" },
  // Mr Brown (UPS3 Y6 Sycamore)
  {
    staffId: "STF-017",
    year: "2019-20",
    yearGroup: "6",
    className: "Sycamore",
  },
  {
    staffId: "STF-017",
    year: "2020-21",
    yearGroup: "6",
    className: "Sycamore",
  },
  {
    staffId: "STF-017",
    year: "2021-22",
    yearGroup: "6",
    className: "Sycamore",
  },
  {
    staffId: "STF-017",
    year: "2022-23",
    yearGroup: "6",
    className: "Sycamore",
  },
  {
    staffId: "STF-017",
    year: "2023-24",
    yearGroup: "6",
    className: "Sycamore",
  },
  {
    staffId: "STF-017",
    year: "2024-25",
    yearGroup: "6",
    className: "Sycamore",
  },
  {
    staffId: "STF-017",
    year: "2025-26",
    yearGroup: "6",
    className: "Sycamore",
  },
  // Mrs Patterson (Y3 Holly normally; was on sick Spring 2025 i.e. 2024-25)
  { staffId: "STF-010", year: "2019-20", yearGroup: "3", className: "Holly" },
  { staffId: "STF-010", year: "2020-21", yearGroup: "3", className: "Holly" },
  { staffId: "STF-010", year: "2021-22", yearGroup: "3", className: "Holly" },
  { staffId: "STF-010", year: "2022-23", yearGroup: "3", className: "Holly" },
  { staffId: "STF-010", year: "2023-24", yearGroup: "3", className: "Holly" },
  { staffId: "STF-010", year: "2024-25", yearGroup: "3", className: "Holly" },
  { staffId: "STF-010", year: "2025-26", yearGroup: "3", className: "Holly" },
  // Supply cover for Holly Spring 2025 (i.e. 2024-25 Spring term)
  {
    staffId: "STF-024",
    year: "2024-25",
    yearGroup: "3",
    className: "Holly",
    term: "Spring",
    note: "Supply cover for Mrs Patterson sick leave",
  },
  // Mr Davies Y5 Beech
  { staffId: "STF-014", year: "2021-22", yearGroup: "5", className: "Beech" },
  { staffId: "STF-014", year: "2022-23", yearGroup: "5", className: "Beech" },
  { staffId: "STF-014", year: "2023-24", yearGroup: "5", className: "Beech" },
  { staffId: "STF-014", year: "2024-25", yearGroup: "5", className: "Beech" },
  { staffId: "STF-014", year: "2025-26", yearGroup: "5", className: "Beech" },
  // Supply for Beech Autumn 2024 (2024-25 academic year)
  {
    staffId: "STF-023",
    year: "2024-25",
    yearGroup: "5",
    className: "Beech",
    term: "Autumn",
    note: "Supply cover for Mr Davies paternity",
  },
  // Other current teachers
  { staffId: "STF-004", year: "2025-26", yearGroup: "R", className: "Oak" },
  { staffId: "STF-005", year: "2024-25", yearGroup: "R", className: "Maple" },
  { staffId: "STF-005", year: "2025-26", yearGroup: "R", className: "Maple" },
  { staffId: "STF-006", year: "2021-22", yearGroup: "1", className: "Birch" },
  { staffId: "STF-006", year: "2022-23", yearGroup: "1", className: "Birch" },
  { staffId: "STF-006", year: "2023-24", yearGroup: "1", className: "Birch" },
  { staffId: "STF-006", year: "2024-25", yearGroup: "1", className: "Birch" },
  { staffId: "STF-006", year: "2025-26", yearGroup: "1", className: "Birch" },
  { staffId: "STF-007", year: "2019-20", yearGroup: "1", className: "Elm" },
  { staffId: "STF-007", year: "2020-21", yearGroup: "R", className: "Oak" },
  { staffId: "STF-007", year: "2021-22", yearGroup: "1", className: "Elm" },
  { staffId: "STF-007", year: "2022-23", yearGroup: "1", className: "Elm" },
  { staffId: "STF-007", year: "2023-24", yearGroup: "1", className: "Elm" },
  { staffId: "STF-007", year: "2024-25", yearGroup: "1", className: "Elm" },
  { staffId: "STF-007", year: "2025-26", yearGroup: "1", className: "Elm" },
  { staffId: "STF-008", year: "2019-20", yearGroup: "2", className: "Willow" },
  { staffId: "STF-008", year: "2020-21", yearGroup: "2", className: "Willow" },
  { staffId: "STF-008", year: "2021-22", yearGroup: "2", className: "Willow" },
  { staffId: "STF-008", year: "2022-23", yearGroup: "2", className: "Willow" },
  { staffId: "STF-008", year: "2023-24", yearGroup: "2", className: "Willow" },
  { staffId: "STF-008", year: "2024-25", yearGroup: "2", className: "Willow" },
  { staffId: "STF-008", year: "2025-26", yearGroup: "2", className: "Willow" },
  { staffId: "STF-022", year: "2019-20", yearGroup: "2", className: "Willow" },
  { staffId: "STF-022", year: "2020-21", yearGroup: "2", className: "Willow" },
  { staffId: "STF-022", year: "2021-22", yearGroup: "2", className: "Willow" },
  { staffId: "STF-022", year: "2022-23", yearGroup: "2", className: "Willow" },
  { staffId: "STF-022", year: "2023-24", yearGroup: "2", className: "Willow" },
  { staffId: "STF-022", year: "2024-25", yearGroup: "2", className: "Willow" },
  { staffId: "STF-022", year: "2025-26", yearGroup: "2", className: "Willow" },
  { staffId: "STF-011", year: "2019-20", yearGroup: "3", className: "Rowan" },
  { staffId: "STF-011", year: "2020-21", yearGroup: "4", className: "Cedar" },
  { staffId: "STF-011", year: "2021-22", yearGroup: "3", className: "Rowan" },
  { staffId: "STF-011", year: "2022-23", yearGroup: "3", className: "Rowan" },
  { staffId: "STF-011", year: "2023-24", yearGroup: "3", className: "Rowan" },
  { staffId: "STF-011", year: "2024-25", yearGroup: "3", className: "Rowan" },
  { staffId: "STF-011", year: "2025-26", yearGroup: "3", className: "Rowan" },
  { staffId: "STF-012", year: "2019-20", yearGroup: "4", className: "Cedar" },
  { staffId: "STF-012", year: "2020-21", yearGroup: "4", className: "Pine" },
  { staffId: "STF-012", year: "2021-22", yearGroup: "4", className: "Cedar" },
  { staffId: "STF-012", year: "2022-23", yearGroup: "4", className: "Cedar" },
  { staffId: "STF-012", year: "2023-24", yearGroup: "4", className: "Pine" },
  { staffId: "STF-012", year: "2024-25", yearGroup: "4", className: "Cedar" },
  { staffId: "STF-012", year: "2025-26", yearGroup: "4", className: "Cedar" },
  {
    staffId: "STF-015",
    year: "2019-20",
    yearGroup: "5",
    className: "Chestnut",
  },
  {
    staffId: "STF-015",
    year: "2020-21",
    yearGroup: "5",
    className: "Chestnut",
  },
  {
    staffId: "STF-015",
    year: "2021-22",
    yearGroup: "5",
    className: "Chestnut",
  },
  {
    staffId: "STF-015",
    year: "2022-23",
    yearGroup: "5",
    className: "Chestnut",
  },
  {
    staffId: "STF-015",
    year: "2023-24",
    yearGroup: "5",
    className: "Chestnut",
  },
  {
    staffId: "STF-015",
    year: "2024-25",
    yearGroup: "5",
    className: "Chestnut",
  },
  {
    staffId: "STF-015",
    year: "2025-26",
    yearGroup: "5",
    className: "Chestnut",
  },
];

// ──────────────────────────────────────────────
// 4.  PUPIL GENERATION
// ──────────────────────────────────────────────

// DOB range for each current year group (2025-26 academic year)
// Children in Year N were born between Sep 1 (year) and Aug 31 (year+1)
function dobRangeForYearGroup(yg) {
  // Reception in 2025-26: born Sep 2020 - Aug 2021
  const baseYear = 2020 - parseInt(yg === "R" ? "0" : yg);
  return {
    start: new Date(baseYear, 8, 1),
    end: new Date(baseYear + 1, 7, 31),
  };
}

function generateDob(yg) {
  const { start, end } = dobRangeForYearGroup(yg);
  const diff = end.getTime() - start.getTime();
  const d = new Date(start.getTime() + rng() * diff);
  return d.toISOString().split("T")[0];
}

function generateUPN() {
  // UK UPN format: 13 chars starting with letter
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let upn = pick([...letters]);
  for (let i = 0; i < 12; i++) upn += Math.floor(rng() * 10);
  return upn;
}

let studentIdCounter = 100000;
function generateStudentId() {
  return `ARB-${++studentIdCounter}`;
}

function generateAdmissionNumber() {
  return `${2000 + randInt(15, 25)}${String(randInt(1, 999)).padStart(3, "0")}`;
}

// Generate all current pupils (~420, 60 per year group)
const ALL_PUPILS = [];
const PUPILS_BY_CLASS = {};
const PUPILS_BY_YG = {};
let pupilCounter = 0;

// Named story pupils with fixed attributes
const STORY_PUPILS = {
  AIDEN_MURPHY: {
    firstName: "Aiden",
    lastName: "Murphy",
    gender: "M",
    yearGroup: "4",
    className: "Pine",
    senStatus: "E",
    senNeed: "ASD",
    ehcp: true,
    fsm: true,
    pp: true,
    ethnicity: "WBRI",
    language: "English",
  },
  MIA_CLARKE: {
    firstName: "Mia",
    lastName: "Clarke",
    gender: "F",
    yearGroup: "5",
    className: "Chestnut",
    senStatus: "",
    senNeed: "",
    ehcp: false,
    fsm: false,
    pp: false,
    ethnicity: "WBRI",
    language: "English",
  },
};

function createPupil(opts = {}) {
  pupilCounter++;
  const gender = opts.gender || (rng() < 0.5 ? "M" : "F");
  const firstName =
    opts.firstName ||
    pick(gender === "M" ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE);
  const lastName = opts.lastName || pick(SURNAMES);
  const yg = opts.yearGroup || "R";
  const classes = CLASS_NAMES[yg];
  const className =
    opts.className || (pupilCounter % 2 === 0 ? classes[0] : classes[1]);
  const regGroup = `${yg === "R" ? "R" : yg}${className.charAt(0)}`;

  const ethnicity =
    opts.ethnicity || pickWeighted(ETHNICITY_CODES, ETHNICITY_WEIGHTS);
  const language = opts.language || pickWeighted(LANG_VALS, LANG_WEIGHTS);

  const isFSM = opts.fsm !== undefined ? opts.fsm : rng() < 0.26;
  const isPP = opts.pp !== undefined ? opts.pp : isFSM ? true : rng() < 0.08;
  const senStatus =
    opts.senStatus !== undefined
      ? opts.senStatus
      : rng() < 0.13
        ? "K"
        : rng() < 0.046
          ? "E"
          : "";
  const senNeed =
    senStatus === "K" || senStatus === "E"
      ? opts.senNeed || pick(SEN_NEEDS)
      : "";
  const ehcp = opts.ehcp !== undefined ? opts.ehcp : senStatus === "E";
  const inCare = rng() < 0.01;
  const serviceChild = rng() < 0.02;

  const pupil = {
    id: pupilCounter,
    studentId: generateStudentId(),
    upn: generateUPN(),
    admissionNumber: generateAdmissionNumber(),
    firstName,
    lastName,
    dob: generateDob(yg),
    gender,
    yearGroup: yg,
    className,
    regGroup,
    ethnicity,
    language,
    fsm: isFSM,
    pp: isPP,
    inCare,
    serviceChild,
    senStatus,
    senNeed,
    ehcp,
    admissionDate: `${2025 - parseInt(yg === "R" ? "0" : yg)}-09-0${randInt(1, 5)}`,
    enrolmentStatus: "On Roll",
    isEAL: language !== "English",
    // Story flags
    storyTag: opts.storyTag || null,
    // Baseline ability: 0-100 percentile
    baseAbility:
      opts.baseAbility ||
      clamp(
        50 +
          (rng() - 0.5) * 60 +
          (isFSM ? -8 : 0) +
          (senStatus === "E" ? -20 : senStatus === "K" ? -10 : 0),
        5,
        98,
      ),
  };

  ALL_PUPILS.push(pupil);
  const classKey = `${yg}-${className}`;
  if (!PUPILS_BY_CLASS[classKey]) PUPILS_BY_CLASS[classKey] = [];
  PUPILS_BY_CLASS[classKey].push(pupil);
  if (!PUPILS_BY_YG[yg]) PUPILS_BY_YG[yg] = [];
  PUPILS_BY_YG[yg].push(pupil);

  return pupil;
}

// Create story pupils first
console.log("Generating pupils...");
const aidenMurphy = createPupil({
  ...STORY_PUPILS.AIDEN_MURPHY,
  storyTag: "AIDEN_MURPHY",
  baseAbility: 22,
});
const miaClarke = createPupil({
  ...STORY_PUPILS.MIA_CLARKE,
  storyTag: "MIA_CLARKE",
  baseAbility: 55,
});

// Y6 high PP cohort (Story 3): make 40% PP
// Generate remaining pupils for each year group
for (const yg of YEAR_GROUPS) {
  const targetCount = yg === "R" ? 60 : 60;
  const classes = CLASS_NAMES[yg];
  const existing = (PUPILS_BY_YG[yg] || []).length;
  const remaining = targetCount - existing;

  for (let i = 0; i < remaining; i++) {
    const className = classes[i % 2];
    let opts = { yearGroup: yg, className };

    // Story 3: Y6 has 40% PP
    if (yg === "6") {
      opts.pp = rng() < 0.4;
      opts.fsm = opts.pp ? rng() < 0.85 : rng() < 0.1;
    }

    createPupil(opts);
  }
}

console.log(`  Generated ${ALL_PUPILS.length} current pupils`);

// ──────────────────────────────────────────────
// 5.  HISTORICAL LEAVERS (for KS2 data)
// ──────────────────────────────────────────────
const HISTORICAL_LEAVERS = []; // cohorts that left in 2022-23, 2023-24, 2024-25

function generateLeaverCohort(leavingYear, count) {
  const cohort = [];
  for (let i = 0; i < count; i++) {
    const gender = rng() < 0.5 ? "M" : "F";
    const firstName = pick(
      gender === "M" ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE,
    );
    const lastName = pick(SURNAMES);
    const isFSM = rng() < 0.26;
    const isPP = isFSM ? true : rng() < 0.08;
    const senStatus = rng() < 0.13 ? "K" : rng() < 0.046 ? "E" : "";
    cohort.push({
      firstName,
      lastName,
      gender,
      leavingYear,
      fsm: isFSM,
      pp: isPP,
      senStatus,
      baseAbility: clamp(
        50 +
          (rng() - 0.5) * 60 +
          (isFSM ? -8 : 0) +
          (senStatus === "E" ? -20 : senStatus === "K" ? -10 : 0),
        5,
        98,
      ),
    });
  }
  return cohort;
}

const LEAVERS_2023 = generateLeaverCohort("2022-23", 58);
const LEAVERS_2024 = generateLeaverCohort("2023-24", 61);
const LEAVERS_2025 = generateLeaverCohort("2024-25", 59);
HISTORICAL_LEAVERS.push(...LEAVERS_2023, ...LEAVERS_2024, ...LEAVERS_2025);
console.log(`  Generated ${HISTORICAL_LEAVERS.length} historical leavers`);

// ──────────────────────────────────────────────
// 6.  ASSESSMENT HELPER FUNCTIONS
// ──────────────────────────────────────────────

// Convert ability percentile to KS1/KS2 grades
function abilityToGrade(ability, type) {
  // type: 'ks1' | 'ks2' | 'tracker' | 'eyfs' | 'phonics'
  if (type === "eyfs") {
    // GLD = Good Level of Development
    return ability >= 45 ? "GLD" : "Emerging";
  }
  if (type === "phonics") {
    return ability >= 40 ? "Met" : "Not Met";
  }
  if (type === "ks1" || type === "ks2" || type === "tracker") {
    if (ability >= 85) return "GDS"; // Greater Depth
    if (ability >= 40) return "EXS"; // Expected
    if (ability >= 20) return "WTS"; // Working Towards
    if (ability >= 10) return "PKF"; // Pre-Key Stage / Foundations
    return "PKF";
  }
  return "EXS";
}

// KS2 scaled score from ability
function abilityToScaledScore(ability) {
  // 80-120 range, 100 = expected
  if (ability >= 85) return randInt(110, 120);
  if (ability >= 55) return randInt(100, 112);
  if (ability >= 40) return randInt(100, 105);
  if (ability >= 25) return randInt(90, 100);
  return randInt(80, 95);
}

// Tracker half-termly grades (more granular)
function abilityToTrackerGrade(ability, yearGroup) {
  const yg = parseInt(yearGroup === "R" ? "0" : yearGroup);
  // Tracker uses: BLW, WTS, EXS, GDS with + and - modifiers
  if (ability >= 88) return "GDS";
  if (ability >= 78) return "EXS+";
  if (ability >= 45) return "EXS";
  if (ability >= 35) return "WTS+";
  if (ability >= 20) return "WTS";
  if (ability >= 10) return "WTS-";
  return "BLW";
}

// Apply story modifiers to ability
function getEffectiveAbility(
  pupil,
  subject,
  yearGroup,
  term,
  academicYear,
  className,
) {
  let ability = pupil.baseAbility;

  // Story 3: Y6 PP gap
  if (pupil.yearGroup === "6" && pupil.pp) {
    if (subject === "reading") ability -= 12;
    if (subject === "maths") ability -= 10;
    if (subject === "writing") ability -= 8;
    // Gap widened in Y4, started narrowing from Y5 Summer
    const currentYgNum = parseInt(pupil.yearGroup);
    if (
      yearGroup === "5" &&
      (term === "Sum1" || term === "Sum2" || term === "Summer")
    ) {
      ability += 3; // intervention effect
    }
    if (yearGroup === "6") {
      ability += 4; // continued narrowing
    }
  }

  // Story 4: Aiden Murphy trajectory
  if (pupil.storyTag === "AIDEN_MURPHY") {
    const ygNum = parseInt(yearGroup);
    // PKF/PKF/PKF in Y1 → WTS/PKF/WTS Y2 → WTS/WTS/EXS Y3 → WTS/WTS/EXS Y4
    if (ygNum <= 1) ability = 12;
    if (ygNum === 2) {
      ability = subject === "maths" ? 18 : subject === "writing" ? 15 : 25;
    }
    if (ygNum === 3) {
      ability = subject === "writing" ? 28 : subject === "maths" ? 30 : 32;
    }
    if (ygNum === 4) {
      ability = subject === "writing" ? 33 : subject === "maths" ? 35 : 38;
    }
  }

  // Story 6: Mia Clarke declining
  if (pupil.storyTag === "MIA_CLARKE") {
    const ygNum = parseInt(yearGroup);
    if (ygNum <= 3) ability = 55; // solidly Expected
    if (ygNum === 4) ability = 48; // starting to dip
    if (ygNum === 5) {
      ability = subject === "reading" ? 38 : subject === "writing" ? 42 : 45; // borderline WTS reading
    }
  }

  // Story 8: Mr Lee writing underperformance (-8 to -10pp)
  // Check if this pupil was taught by Lee in the given year
  if (subject === "writing") {
    const leeHistory = TEACHER_CLASS_HISTORY.filter(
      (h) => h.staffId === "STF-013" && h.year === academicYear,
    );
    for (const h of leeHistory) {
      if (className && className === h.className && yearGroup === h.yearGroup) {
        ability -= randInt(8, 10);
      }
    }
  }

  // Story 9: Ms Patel maths outperformance (+8 to +12pp)
  if (subject === "maths") {
    const patelHistory = TEACHER_CLASS_HISTORY.filter(
      (h) => h.staffId === "STF-009" && h.year === academicYear,
    );
    for (const h of patelHistory) {
      if (className && className === h.className && yearGroup === h.yearGroup) {
        ability += randInt(8, 12);
      }
    }
  }

  // Story 5: Mrs Williams Y6 Hazel TA inflation (+8-10pp above standardised)
  // This is handled separately in KS2 data (TA vs test score mismatch)

  // Story 1: Holly class dip during Spring 2025 (2024-25)
  // Those children were in Y2 Holly in 2024-25 → now Y3 Holly 2025-26
  // But Story 1 says supply was Spring 2025 when they were Y2
  // Actually: Mrs Patterson was Y3 Holly teacher, sick Spring 2025
  // So the current Y3 Holly pupils experienced supply in their CURRENT year Spring term
  // Wait - re-reading: "Y3 Holly class had supply (Mrs Blackwell) for Spring 2025"
  // Spring 2025 = Spring term of 2024-25 academic year
  // So: pupils who were in Y3 Holly in 2024-25 are now in Y4 in 2025-26
  // But the story says "Y2 Spring data shows -15pp dip" → this refers to when they were Y2
  // Let me re-read: "Mrs Patterson's long-term sick leave" - she teaches Y3 Holly
  // "Y3 Holly class had supply for Spring 2025" - this means the 2024-25 Spring term Y3 Holly
  // "Y2 Spring data shows -15pp dip" - hmm, maybe the story mixes narratives.
  // I'll implement it as: Patterson sick Spring 2024-25, affecting current Y4 pupils who were in Y3 Holly.
  // And also current Y3 Holly pupils who experienced supply in Spring 2025-26? No, current year Spring hasn't happened yet (only Aut+Spr completed for 2025-26).
  // Let me just implement: pupils in Y3 Holly during 2024-25 had a dip in Spring 2024-25.

  // Story 1 implementation - check if pupil was in Holly and it was Spring of 2024-25
  if (
    academicYear === "2024-25" &&
    className === "Holly" &&
    yearGroup === "3"
  ) {
    if (term === "Spring" || term === "Spr1" || term === "Spr2") {
      ability -= 15;
    }
    if (term === "Summer" || term === "Sum1" || term === "Sum2") {
      ability -= 7; // partial recovery
    }
  }
  // Continuing gap into Y4 but narrowing
  if (academicYear === "2025-26" && pupil.yearGroup === "4") {
    // Check if this pupil was in Holly last year - we'll use a simple heuristic:
    // half the Y4 pupils (from old Holly class) still show gap
    if (pupil.id % 3 === 0) {
      // roughly a third, representing the Holly pupils
      ability -= 4;
    }
  }

  // Story 2: Y5 Beech supply disruption Autumn 2024-25
  if (
    academicYear === "2024-25" &&
    className === "Beech" &&
    yearGroup === "5"
  ) {
    if (term === "Autumn" || term === "Aut1" || term === "Aut2") {
      ability -= 8;
    }
    // Recovery after Spring when Davies returned
    if (term === "Spring" || term === "Spr1" || term === "Spr2") {
      ability -= 2; // mostly recovered
    }
  }

  // Add small random noise
  ability += (rng() - 0.5) * 8;

  return clamp(Math.round(ability), 2, 99);
}

// ──────────────────────────────────────────────
// 7.  GENERATE EXCEL FILES
// ──────────────────────────────────────────────

function writeWorkbook(wb, filepath) {
  const fullPath = join(BASE, filepath);
  mkdirSync(dirname(fullPath), { recursive: true });
  XLSX.writeFile(wb, fullPath);
  console.log(`  ✓ ${filepath}`);
}

// ═══════════════════════════════════════════════
// FILE 1: arbor_pupil_roll.xlsx
// ═══════════════════════════════════════════════
function generatePupilRoll() {
  console.log("\nGenerating arbor_pupil_roll.xlsx...");
  const rows = ALL_PUPILS.map((p) => ({
    "Student ID": p.studentId,
    UPN: p.upn,
    "Legal First Name": p.firstName,
    "Legal Last Name": p.lastName,
    "Date of Birth": p.dob,
    Gender: p.gender === "M" ? "Male" : "Female",
    "Year Group": p.yearGroup === "R" ? "Reception" : `Year ${p.yearGroup}`,
    "Registration Group": `${p.yearGroup === "R" ? "R" : "Y" + p.yearGroup} ${p.className}`,
    Ethnicity: p.ethnicity,
    "First Language": p.language,
    "FSM Eligible": p.fsm ? "Yes" : "No",
    "Pupil Premium": p.pp ? "Yes" : "No",
    "In Care (LAC)": p.inCare ? "Yes" : "No",
    "Service Child": p.serviceChild ? "Yes" : "No",
    "SEN Status": p.senStatus || "No SEN",
    "SEN Primary Need": p.senNeed || "",
    EHCP: p.ehcp ? "Yes" : "No",
    "Admission Date": p.admissionDate,
    "Enrolment Status": p.enrolmentStatus,
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Pupil Roll");
  writeWorkbook(wb, "arbor-exports/arbor_pupil_roll.xlsx");
}

// ═══════════════════════════════════════════════
// FILE 2: arbor_attendance_termly.xlsx
// ═══════════════════════════════════════════════
function generateAttendance() {
  console.log("\nGenerating arbor_attendance_termly.xlsx...");
  const rows = [];

  for (const p of ALL_PUPILS) {
    const ygNum = parseInt(p.yearGroup === "R" ? "0" : p.yearGroup);

    // Generate attendance for each year the pupil was at school
    for (let y = 0; y <= ygNum; y++) {
      const ayIndex = ACADEMIC_YEARS.length - 1 - (ygNum - y);
      if (ayIndex < 0) continue;
      const ay = ACADEMIC_YEARS[ayIndex];
      const pastYg = y === 0 ? "R" : String(y);

      // Determine which terms are complete
      let termsToGenerate = ["Autumn", "Spring", "Summer"];
      if (ay === CURRENT_YEAR) {
        termsToGenerate = ["Autumn", "Spring"]; // current year only Aut + Spring done
      }

      for (const term of termsToGenerate) {
        // Base attendance
        let baseAtt = 95 + (rng() - 0.5) * 4;

        // PP pupils: 2-3pp lower
        if (p.pp) baseAtt -= 2.5;
        // SEN E: 2-4pp lower
        if (p.senStatus === "E") baseAtt -= 3;

        // COVID disruption 2020-21
        if (ay === "2020-21") baseAtt -= 8;

        // A few chronic PA pupils (persistent absentees)
        if (p.id % 70 === 0) baseAtt = 82 + rng() * 6; // 82-88%
        if (p.id % 210 === 0) baseAtt = 50 + rng() * 12; // 50-62% severe

        // Story 1: Holly Spring 2024-25 - slightly lower attendance during supply
        if (
          ay === "2024-25" &&
          term === "Spring" &&
          p.className === "Holly" &&
          pastYg === "3"
        ) {
          baseAtt -= 2;
        }

        // Sessions in term (~65 per half term, ~130 per term but varies)
        const possibleSessions =
          term === "Autumn" ? 148 : term === "Spring" ? 120 : 130;
        const attendance = clamp(baseAtt + (rng() - 0.5) * 3, 30, 100);
        const presentSessions = Math.round(
          (possibleSessions * attendance) / 100,
        );
        const absentSessions = possibleSessions - presentSessions;
        const authorised = Math.round(absentSessions * (0.5 + rng() * 0.4));
        const unauthorised = absentSessions - authorised;
        const lates = randInt(0, Math.min(8, Math.floor(absentSessions / 2)));

        rows.push({
          "Student ID": p.studentId,
          UPN: p.upn,
          "Legal First Name": p.firstName,
          "Legal Last Name": p.lastName,
          "Year Group": pastYg === "R" ? "Reception" : `Year ${pastYg}`,
          "Registration Group": `${pastYg === "R" ? "R" : "Y" + pastYg} ${p.className}`,
          "Academic Year": ay,
          Term: term,
          "Possible Sessions": possibleSessions,
          "Present Sessions": presentSessions,
          "Absent Sessions (Authorised)": authorised,
          "Absent Sessions (Unauthorised)": unauthorised,
          "Late (Before Close)": lates,
          "Attendance %": parseFloat(attendance.toFixed(1)),
          "PA Flag": attendance < 90 ? "Yes" : "No",
        });
      }
    }
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Termly Attendance");
  writeWorkbook(wb, "arbor-exports/arbor_attendance_termly.xlsx");
  return rows.length;
}

// ═══════════════════════════════════════════════
// FILE 3: arbor_statutory_results.xlsx
// ═══════════════════════════════════════════════
function generateStatutoryResults() {
  console.log("\nGenerating arbor_statutory_results.xlsx...");
  const wb = XLSX.utils.book_new();

  // --- EYFS sheet ---
  // Current Reception pupils + historical cohorts
  const eyfsRows = [];
  // Current Reception (2025-26): results won't be in yet, skip or mark as pending
  // Historical: children who did EYFS in previous years (now in Y1-Y6)
  for (const p of ALL_PUPILS) {
    if (p.yearGroup === "R") continue; // no results yet
    const ygNum = parseInt(p.yearGroup);
    const eyfsYear = ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1 - ygNum];
    if (!eyfsYear) continue;

    const ability = getEffectiveAbility(
      p,
      "reading",
      "R",
      "Summer",
      eyfsYear,
      p.className,
    );
    eyfsRows.push({
      "Student ID": p.studentId,
      UPN: p.upn,
      "Legal First Name": p.firstName,
      "Legal Last Name": p.lastName,
      "Academic Year": eyfsYear,
      "Communication & Language": ability >= 45 ? "Expected" : "Emerging",
      "Physical Development": ability >= 42 ? "Expected" : "Emerging",
      "Personal, Social & Emotional": ability >= 48 ? "Expected" : "Emerging",
      Literacy: ability >= 44 ? "Expected" : "Emerging",
      Mathematics: ability >= 43 ? "Expected" : "Emerging",
      "Understanding the World": ability >= 46 ? "Expected" : "Emerging",
      "Expressive Arts & Design": ability >= 40 ? "Expected" : "Emerging",
      GLD: ability >= 45 ? "Yes" : "No",
    });
  }
  if (eyfsRows.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(eyfsRows),
      "EYFS",
    );
  }

  // --- Phonics sheet ---
  // Year 1 phonics screening check
  const phonicsRows = [];
  for (const p of ALL_PUPILS) {
    const ygNum = parseInt(p.yearGroup === "R" ? "0" : p.yearGroup);
    if (ygNum < 2) continue; // need to have completed Y1
    const phonicsYear = ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1 - (ygNum - 1)];
    if (!phonicsYear) continue;

    const ability = getEffectiveAbility(
      p,
      "reading",
      "1",
      "Summer",
      phonicsYear,
      p.className,
    );
    const score = clamp(
      Math.round(20 + ability * 0.2 + (rng() - 0.5) * 8),
      10,
      40,
    );
    phonicsRows.push({
      "Student ID": p.studentId,
      UPN: p.upn,
      "Legal First Name": p.firstName,
      "Legal Last Name": p.lastName,
      "Academic Year": phonicsYear,
      Mark: score,
      Threshold: 32,
      Outcome: score >= 32 ? "Met" : "Not Met",
    });
  }
  if (phonicsRows.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(phonicsRows),
      "Phonics",
    );
  }

  // --- KS1 sheet ---
  // End of Y2 teacher assessment
  const ks1Rows = [];
  for (const p of ALL_PUPILS) {
    const ygNum = parseInt(p.yearGroup === "R" ? "0" : p.yearGroup);
    if (ygNum < 3) continue; // need to have completed Y2
    const ks1Year = ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1 - (ygNum - 2)];
    if (!ks1Year) continue;

    // Determine class they were in during Y2
    const y2Class = ygNum % 2 === 0 ? CLASS_NAMES["2"][0] : CLASS_NAMES["2"][1];

    const readAbility = getEffectiveAbility(
      p,
      "reading",
      "2",
      "Summer",
      ks1Year,
      y2Class,
    );
    const writeAbility = getEffectiveAbility(
      p,
      "writing",
      "2",
      "Summer",
      ks1Year,
      y2Class,
    );
    const mathAbility = getEffectiveAbility(
      p,
      "maths",
      "2",
      "Summer",
      ks1Year,
      y2Class,
    );

    ks1Rows.push({
      "Student ID": p.studentId,
      UPN: p.upn,
      "Legal First Name": p.firstName,
      "Legal Last Name": p.lastName,
      "Academic Year": ks1Year,
      Reading: abilityToGrade(readAbility, "ks1"),
      Writing: abilityToGrade(writeAbility, "ks1"),
      Maths: abilityToGrade(mathAbility, "ks1"),
      Science: abilityToGrade((readAbility + mathAbility) / 2, "ks1"),
    });
  }
  if (ks1Rows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ks1Rows), "KS1");
  }

  // --- MTC sheet (Multiplication Tables Check, end of Y4) ---
  const mtcRows = [];
  for (const p of ALL_PUPILS) {
    const ygNum = parseInt(p.yearGroup === "R" ? "0" : p.yearGroup);
    if (ygNum < 5) continue; // need to have completed Y4
    const mtcYear = ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1 - (ygNum - 4)];
    if (!mtcYear) continue;

    const mathAbility = getEffectiveAbility(
      p,
      "maths",
      "4",
      "Summer",
      mtcYear,
      p.className,
    );
    const score = clamp(Math.round(mathAbility * 0.25), 0, 25);
    mtcRows.push({
      "Student ID": p.studentId,
      UPN: p.upn,
      "Legal First Name": p.firstName,
      "Legal Last Name": p.lastName,
      "Academic Year": mtcYear,
      "MTC Score": score,
      "Out of": 25,
    });
  }
  if (mtcRows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mtcRows), "MTC");
  }

  // --- KS2 sheet (historical leavers) ---
  const ks2Rows = [];
  const allLeaverSets = [
    { leavers: LEAVERS_2023, year: "2022-23" },
    { leavers: LEAVERS_2024, year: "2023-24" },
    { leavers: LEAVERS_2025, year: "2024-25" },
  ];

  for (const { leavers, year } of allLeaverSets) {
    for (const l of leavers) {
      const rA = clamp(l.baseAbility + (rng() - 0.5) * 15, 5, 98);
      const wA = clamp(l.baseAbility + (rng() - 0.5) * 15, 5, 98);
      const mA = clamp(l.baseAbility + (rng() - 0.5) * 15, 5, 98);

      const readScore = abilityToScaledScore(rA);
      const mathScore = abilityToScaledScore(mA);

      ks2Rows.push({
        "First Name": l.firstName,
        "Last Name": l.lastName,
        Gender: l.gender === "M" ? "Male" : "Female",
        "Academic Year": year,
        FSM: l.fsm ? "Yes" : "No",
        "Pupil Premium": l.pp ? "Yes" : "No",
        "SEN Status": l.senStatus || "No SEN",
        "Reading TA": abilityToGrade(rA + (rng() < 0.3 ? 5 : 0), "ks2"),
        "Reading Scaled Score": readScore,
        "Reading Outcome": readScore >= 100 ? "AS" : "NS",
        "Writing TA": abilityToGrade(wA, "ks2"),
        "GPS Scaled Score": abilityToScaledScore(
          clamp(rA + (rng() - 0.5) * 10, 5, 98),
        ),
        "Maths TA": abilityToGrade(mA + (rng() < 0.3 ? 5 : 0), "ks2"),
        "Maths Scaled Score": mathScore,
        "Maths Outcome": mathScore >= 100 ? "AS" : "NS",
        "Combined RWM":
          readScore >= 100 && mathScore >= 100 && wA >= 40 ? "AS" : "NS",
      });
    }
  }
  if (ks2Rows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ks2Rows), "KS2");
  }

  writeWorkbook(wb, "arbor-exports/arbor_statutory_results.xlsx");
}

// ═══════════════════════════════════════════════
// FILE 4: insight_tracker_export.xlsx
// ═══════════════════════════════════════════════
function generateTrackerExport() {
  console.log("\nGenerating insight_tracker_export.xlsx...");
  const rows = [];
  const subjects = ["Reading", "Writing", "Maths"];

  // 3 years: 2023-24, 2024-25, 2025-26
  const trackerYears = ["2023-24", "2024-25", "2025-26"];

  for (const p of ALL_PUPILS) {
    const ygNum = parseInt(p.yearGroup === "R" ? "0" : p.yearGroup);

    for (const subject of subjects) {
      const subjectKey = subject.toLowerCase();
      const row = {
        "Pupil Name": `${p.lastName}, ${p.firstName}`,
        "Admission Number": p.admissionNumber,
        "Year Group": p.yearGroup === "R" ? "Reception" : `Year ${p.yearGroup}`,
        Class: p.className,
        Gender: p.gender,
        PP: p.pp ? "Y" : "N",
        FSM: p.fsm ? "Y" : "N",
        SEN: p.senStatus || "N",
        EAL: p.isEAL ? "Y" : "N",
        Subject: subject,
      };

      // Find the teacher for this pupil's class in each year
      for (const ay of trackerYears) {
        const ayIndex = ACADEMIC_YEARS.indexOf(ay);
        const yearOffset = ACADEMIC_YEARS.indexOf(CURRENT_YEAR) - ayIndex;
        const pastYgNum = ygNum - yearOffset;
        if (pastYgNum < 0) continue;
        const pastYg = pastYgNum === 0 ? "R" : String(pastYgNum);

        // Find teacher
        const teacherEntry = TEACHER_CLASS_HISTORY.find(
          (h) =>
            h.year === ay &&
            h.yearGroup === pastYg &&
            h.className === p.className &&
            !h.term,
        );
        const staffId = teacherEntry ? teacherEntry.staffId : "";

        // Which half-terms are available?
        let halfTerms = HALF_TERMS;
        if (ay === CURRENT_YEAR) {
          halfTerms = ["Aut1", "Aut2", "Spr1"]; // current year, 3 data points
        }

        for (const ht of halfTerms) {
          const ability = getEffectiveAbility(
            p,
            subjectKey,
            pastYg,
            ht,
            ay,
            p.className,
          );
          const grade = abilityToTrackerGrade(ability, pastYg);

          // Add slight discrepancy from Arbor in ~10% of cases (realistic)
          let finalGrade = grade;
          if (rng() < 0.08) {
            // Slight variation - teacher might record EXS where system shows EXS+
            if (grade === "EXS+") finalGrade = "EXS";
            if (grade === "WTS+") finalGrade = "WTS";
          }

          row[`${ay} ${ht}`] = finalGrade;
          row[`${ay} ${ht} Staff`] = staffId;
        }
      }

      rows.push(row);
    }
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Assessment Data");
  writeWorkbook(wb, "tracker-exports/insight_tracker_export.xlsx");
  return rows.length;
}

// ═══════════════════════════════════════════════
// FILE 5: arbor_behaviour_export.xlsx
// ═══════════════════════════════════════════════
function generateBehaviour() {
  console.log("\nGenerating arbor_behaviour_export.xlsx...");
  const rows = [];
  const POSITIVE_CATS = [
    "Outstanding Work",
    "Kindness",
    "Achievement",
    "Teamwork",
    "Helpfulness",
    "Resilience",
  ];
  const NEGATIVE_CATS = [
    "Disruption",
    "Defiance",
    "Physical",
    "Bullying",
    "Lateness",
    "Inappropriate Language",
  ];
  const POSITIVE_POINTS = [1, 2, 3, 5];
  const NEGATIVE_POINTS = [-1, -2, -3, -5];

  // Generate ~5000-7000 incidents for 2025-26
  const startDate = new Date("2025-09-03");
  const endDate = new Date("2026-03-07"); // up to current date roughly

  let incidentCount = 0;
  const targetIncidents = 5800;

  // Distribute across pupils
  for (const p of ALL_PUPILS) {
    // Base incident rate: most pupils get positive
    let positiveCount = randInt(8, 18);
    let negativeCount = randInt(0, 3);

    // SEMH pupils: higher negative
    if (p.senNeed === "SEMH") {
      negativeCount = randInt(15, 35);
      positiveCount = randInt(3, 8);
    }

    // Story 2: Y5 Beech spike in Autumn 2024-25 → map to current year Autumn since
    // these are the SAME pupils (now Y5 Beech in 2025-26 too, but wait - they'd be Y6 now)
    // Actually in 2025-26, the Y5 Beech pupils are a NEW cohort.
    // The 2024-25 Y5 Beech are now Y6 in 2025-26.
    // So the behaviour spike was in 2024-25 for the cohort that is now Y6.
    // For the current year behaviour export, let's show Y5 Beech Autumn 2025-26 as normal
    // BUT we should show a historical spike. The export is for 2025-26 though.
    // Let me re-read: "Y5 Beech: clear spike Autumn 2024"
    // This refers to 2024-25 Autumn. The pupils affected are now Y6.
    // Let's include 2024-25 data in the export too for continuity.

    // For FTE exclusions
    const hasFTE = p.senNeed === "SEMH" && rng() < 0.3;

    // Generate positive incidents
    for (let i = 0; i < positiveCount && incidentCount < targetIncidents; i++) {
      const date = new Date(
        startDate.getTime() + rng() * (endDate.getTime() - startDate.getTime()),
      );
      rows.push({
        "Student ID": p.studentId,
        "Legal First Name": p.firstName,
        "Legal Last Name": p.lastName,
        "Year Group": p.yearGroup === "R" ? "Reception" : `Year ${p.yearGroup}`,
        "Registration Group": `${p.yearGroup === "R" ? "R" : "Y" + p.yearGroup} ${p.className}`,
        Date: date.toISOString().split("T")[0],
        Time: `${String(randInt(8, 15)).padStart(2, "0")}:${String(randInt(0, 59)).padStart(2, "0")}`,
        Type: "Positive",
        Category: pick(POSITIVE_CATS),
        Points: pick(POSITIVE_POINTS),
        Location: pick([
          "Classroom",
          "Playground",
          "Hall",
          "Library",
          "Corridor",
        ]),
        "Recorded By": pick(
          STAFF.filter((s) => s.teaches).map((s) => `${s.title} ${s.last}`),
        ),
        Notes: "",
        FTE: "",
      });
      incidentCount++;
    }

    // Generate negative incidents
    for (let i = 0; i < negativeCount && incidentCount < targetIncidents; i++) {
      const date = new Date(
        startDate.getTime() + rng() * (endDate.getTime() - startDate.getTime()),
      );
      const isFTE = hasFTE && i === 0;
      rows.push({
        "Student ID": p.studentId,
        "Legal First Name": p.firstName,
        "Legal Last Name": p.lastName,
        "Year Group": p.yearGroup === "R" ? "Reception" : `Year ${p.yearGroup}`,
        "Registration Group": `${p.yearGroup === "R" ? "R" : "Y" + p.yearGroup} ${p.className}`,
        Date: date.toISOString().split("T")[0],
        Time: `${String(randInt(8, 15)).padStart(2, "0")}:${String(randInt(0, 59)).padStart(2, "0")}`,
        Type: "Negative",
        Category: pick(NEGATIVE_CATS),
        Points: pick(NEGATIVE_POINTS),
        Location: pick([
          "Classroom",
          "Playground",
          "Hall",
          "Dining Hall",
          "Corridor",
          "Toilets",
        ]),
        "Recorded By": pick(
          STAFF.filter((s) => s.teaches).map((s) => `${s.title} ${s.last}`),
        ),
        Notes: isFTE ? "Fixed Term Exclusion - 1 day" : "",
        FTE: isFTE ? "1" : "",
      });
      incidentCount++;
    }
  }

  // Add extra Y5 Beech Autumn incidents (the current Y6 pupils who WERE in Y5 Beech)
  // Actually, for clean storytelling, let's add 2024-25 Autumn Y5 Beech data as a separate sheet
  const beechAutumn2024Rows = [];
  const y6Pupils = PUPILS_BY_YG["6"] || [];
  // Half of Y6 were in Beech last year
  const beechPupils = y6Pupils.filter((_, i) => i % 2 === 1).slice(0, 30);
  for (const p of beechPupils) {
    // 2-3x normal negative incidents during supply cover
    const negCount = randInt(4, 8);
    for (let i = 0; i < negCount; i++) {
      const date = new Date("2024-09-03");
      date.setDate(date.getDate() + randInt(0, 85)); // Autumn term
      beechAutumn2024Rows.push({
        "Student ID": p.studentId,
        "Legal First Name": p.firstName,
        "Legal Last Name": p.lastName,
        "Year Group": "Year 5",
        "Registration Group": "Y5 Beech",
        Date: date.toISOString().split("T")[0],
        Time: `${String(randInt(8, 15)).padStart(2, "0")}:${String(randInt(0, 59)).padStart(2, "0")}`,
        Type: "Negative",
        Category: pick(NEGATIVE_CATS),
        Points: pick(NEGATIVE_POINTS),
        Location: pick(["Classroom", "Playground", "Hall"]),
        "Recorded By": "Mr Walsh",
        Notes: "",
        FTE: "",
      });
    }
  }

  // Sort by date
  rows.sort((a, b) => a.Date.localeCompare(b.Date));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(rows),
    "2025-26 Behaviour",
  );
  if (beechAutumn2024Rows.length > 0) {
    beechAutumn2024Rows.sort((a, b) => a.Date.localeCompare(b.Date));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(beechAutumn2024Rows),
      "2024-25 Behaviour (Y5 Beech)",
    );
  }
  writeWorkbook(wb, "arbor-exports/arbor_behaviour_export.xlsx");
  return rows.length + beechAutumn2024Rows.length;
}

// ═══════════════════════════════════════════════
// FILE 6: arbor_staff_export.xlsx
// ═══════════════════════════════════════════════
function generateStaffExport() {
  console.log("\nGenerating arbor_staff_export.xlsx...");

  const rows = STAFF.map((s) => {
    // Generate absence spells for Tracy Morgan (BF = 108 = 3² × 12)
    let absenceSpells = "";
    if (s.id === "STF-020") {
      absenceSpells =
        "3 spells: 04/11/2025-08/11/2025 (5 days, Cold/Flu); 06/01/2026-09/01/2026 (4 days, Back Pain); 24/02/2026-26/02/2026 (3 days, Migraine)";
    } else if (s.id === "STF-010") {
      absenceSpells =
        "1 spell: 06/01/2025-28/03/2025 (60 working days, Stress/Anxiety); 2 short-term: Nov 2024 (3 days, Cold), Apr 2025 (4 days, Flu)";
    } else if (s.id === "STF-014") {
      absenceSpells =
        "1 spell: 02/09/2024-20/12/2024 (42 working days, Paternity Leave)";
    }

    // Bradford Factor calculation
    let bf = 0;
    if (s.id === "STF-020")
      bf = 108; // 3² × 12
    else if (s.id === "STF-010")
      bf = 603; // 3² × 67
    else if (s.id === "STF-014")
      bf = 42; // 1² × 42
    else if (s.absenceDays > 0) {
      const spells = Math.ceil(s.absenceDays / 3);
      bf = spells * spells * s.absenceDays;
    }

    return {
      "Staff ID": s.id,
      Title: s.title,
      "First Name": s.first,
      "Last Name": s.last,
      Role: s.role,
      FTE: s.fte,
      "Teaching FTE": s.teachFte,
      "Pay Scale": s.payScale,
      "Class Assignment": s.teaches,
      "Start Date": s.startDate,
      "End Date":
        s.id === "STF-023"
          ? "2024-12-20"
          : s.id === "STF-024"
            ? "2025-03-28"
            : "",
      "Contract Type":
        s.fte === 0 ? "Supply" : s.fte < 1 ? "Part-Time" : "Permanent",
      "Total Absence Days (Rolling 12m)": s.absenceDays,
      "Absence Spells (Rolling 12m)":
        s.id === "STF-020"
          ? 3
          : s.id === "STF-010"
            ? 3
            : s.id === "STF-014"
              ? 1
              : Math.ceil(s.absenceDays / 3),
      "Bradford Factor": bf,
      "BF Alert": bf >= 100 ? "ALERT" : bf >= 50 ? "Warning" : "",
      "Absence Details": absenceSpells,
      "DBS Check":
        s.role !== "Supply Teacher" ? "Enhanced" : "Enhanced (Agency)",
      "DBS Date": `${2023 + Math.floor(rng() * 2)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
      "Safeguarding Training":
        s.role === "Site Manager" ? "2025-09-02" : "2025-09-01",
      "Prevent Training": `${2024 + Math.floor(rng() * 2)}-${String(randInt(1, 12)).padStart(2, "0")}-01`,
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Staff");
  writeWorkbook(wb, "arbor-exports/arbor_staff_export.xlsx");
}

// ═══════════════════════════════════════════════
// FILE 7: arbor_teacher_class_history.xlsx
// ═══════════════════════════════════════════════
function generateTeacherClassHistory() {
  console.log("\nGenerating arbor_teacher_class_history.xlsx...");

  const rows = TEACHER_CLASS_HISTORY.map((h) => {
    const staff = STAFF.find((s) => s.id === h.staffId);
    return {
      "Staff ID": h.staffId,
      Title: staff?.title || "",
      "First Name": staff?.first || "",
      "Last Name": staff?.last || "",
      "Academic Year": h.year,
      "Year Group": h.yearGroup === "R" ? "Reception" : `Year ${h.yearGroup}`,
      "Class Name": h.className,
      Term: h.term || "Full Year",
      Role: h.term ? "Supply Cover" : staff?.role || "Class Teacher",
      Notes: h.note || "",
    };
  });

  // Sort by year, then staff
  rows.sort(
    (a, b) =>
      a["Academic Year"].localeCompare(b["Academic Year"]) ||
      a["Staff ID"].localeCompare(b["Staff ID"]),
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(rows),
    "Teacher Class History",
  );
  writeWorkbook(wb, "arbor-exports/arbor_teacher_class_history.xlsx");
}

// ═══════════════════════════════════════════════
// FILE 8: sen_register_arbor.xlsx
// ═══════════════════════════════════════════════
function generateSENRegister() {
  console.log("\nGenerating sen_register_arbor.xlsx...");

  const senPupils = ALL_PUPILS.filter(
    (p) => p.senStatus === "K" || p.senStatus === "E",
  );
  const rows = senPupils.map((p) => {
    const isAiden = p.storyTag === "AIDEN_MURPHY";
    return {
      "Student ID": p.studentId,
      UPN: p.upn,
      "Legal First Name": p.firstName,
      "Legal Last Name": p.lastName,
      "Date of Birth": p.dob,
      "Year Group": p.yearGroup === "R" ? "Reception" : `Year ${p.yearGroup}`,
      Class: p.className,
      "SEN Status": p.senStatus === "K" ? "SEN Support" : "EHCP",
      "Primary Need": p.senNeed,
      "Secondary Need":
        rng() < 0.3 ? pick(SEN_NEEDS.filter((n) => n !== p.senNeed)) : "",
      EHCP: p.ehcp ? "Yes" : "No",
      "EHCP Start Date": p.ehcp
        ? isAiden
          ? "2023-04-15"
          : `${2020 + randInt(0, 5)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`
        : "",
      "Annual Review Date": p.ehcp
        ? isAiden
          ? "2026-04-15"
          : `2026-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`
        : "",
      "Provision Map":
        p.senStatus === "K"
          ? pick([
              "Wave 2 Intervention",
              "Small Group Support",
              "In-class Differentiation",
              "Speech & Language Programme",
            ])
          : "EHCP Provision",
      "Key Worker": isAiden
        ? "Ms Wright (STF-021)"
        : pick([
            "Mrs Price (STF-025)",
            "Mr Edwards (STF-026)",
            "Class Teacher",
          ]),
      "External Agency": isAiden
        ? "CAMHS, Educational Psychologist, Speech & Language"
        : rng() < 0.3
          ? pick([
              "CAMHS",
              "Educational Psychologist",
              "Speech & Language",
              "Occupational Therapy",
              "School Nurse",
              "Sensory Service",
            ])
          : "",
      Funding: p.ehcp
        ? isAiden
          ? "Top-up £12,500"
          : `Top-up £${randInt(5, 18)},${randInt(0, 9)}00`
        : "Notional SEN Budget",
      "IEP Review Date": `2026-${String(randInt(1, 6)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
      "Parental Consent": "Yes",
      Notes: isAiden
        ? "ASD diagnosis age 5. Excellent progress since EHCP provision. 1:1 TA (Ms Wright) supporting transitions and social communication. Mainstream full-time with tailored support."
        : "",
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(rows),
    "SEN Register",
  );
  writeWorkbook(wb, "arbor-exports/sen_register_arbor.xlsx");
  return rows.length;
}

// ═══════════════════════════════════════════════
// FILE 9: historical_ks2_results.xlsx
// ═══════════════════════════════════════════════
function generateHistoricalKS2() {
  console.log("\nGenerating historical_ks2_results.xlsx...");
  const wb = XLSX.utils.book_new();

  const years = ["2022-23", "2023-24", "2024-25"];
  const leaverSets = [LEAVERS_2023, LEAVERS_2024, LEAVERS_2025];

  // School-level aggregated data
  const summaryRows = [];

  for (let yi = 0; yi < years.length; yi++) {
    const year = years[yi];
    const leavers = leaverSets[yi];

    // Calculate school-level stats
    let readEXS = 0,
      writeEXS = 0,
      mathEXS = 0,
      combinedEXS = 0;
    let readGDS = 0,
      writeGDS = 0,
      mathGDS = 0;
    let ppReadEXS = 0,
      ppWriteEXS = 0,
      ppMathEXS = 0,
      ppCount = 0;
    let nonPPReadEXS = 0,
      nonPPWriteEXS = 0,
      nonPPMathEXS = 0,
      nonPPCount = 0;
    let readScoreSum = 0,
      mathScoreSum = 0;

    for (const l of leavers) {
      const rA = clamp(l.baseAbility + (rng() - 0.5) * 12, 5, 98);
      const wA = clamp(l.baseAbility + (rng() - 0.5) * 12, 5, 98);
      const mA = clamp(l.baseAbility + (rng() - 0.5) * 12, 5, 98);

      const rGrade = abilityToGrade(rA, "ks2");
      const wGrade = abilityToGrade(wA, "ks2");
      const mGrade = abilityToGrade(mA, "ks2");

      const rScore = abilityToScaledScore(rA);
      const mScore = abilityToScaledScore(mA);
      readScoreSum += rScore;
      mathScoreSum += mScore;

      if (rGrade === "EXS" || rGrade === "GDS") readEXS++;
      if (wGrade === "EXS" || wGrade === "GDS") writeEXS++;
      if (mGrade === "EXS" || mGrade === "GDS") mathEXS++;
      if (rGrade === "GDS") readGDS++;
      if (wGrade === "GDS") writeGDS++;
      if (mGrade === "GDS") mathGDS++;
      if (
        (rGrade === "EXS" || rGrade === "GDS") &&
        (wGrade === "EXS" || wGrade === "GDS") &&
        (mGrade === "EXS" || mGrade === "GDS")
      )
        combinedEXS++;

      if (l.pp) {
        ppCount++;
        if (rGrade === "EXS" || rGrade === "GDS") ppReadEXS++;
        if (wGrade === "EXS" || wGrade === "GDS") ppWriteEXS++;
        if (mGrade === "EXS" || mGrade === "GDS") ppMathEXS++;
      } else {
        nonPPCount++;
        if (rGrade === "EXS" || rGrade === "GDS") nonPPReadEXS++;
        if (wGrade === "EXS" || wGrade === "GDS") nonPPWriteEXS++;
        if (mGrade === "EXS" || mGrade === "GDS") nonPPMathEXS++;
      }
    }

    const n = leavers.length;
    const pct = (v) => Math.round((v / n) * 100);
    const ppPct = (v) => (ppCount > 0 ? Math.round((v / ppCount) * 100) : 0);
    const nonPPPct = (v) =>
      nonPPCount > 0 ? Math.round((v / nonPPCount) * 100) : 0;

    // National averages (approximate)
    const natRead = year === "2022-23" ? 73 : year === "2023-24" ? 74 : 75;
    const natWrite = year === "2022-23" ? 71 : year === "2023-24" ? 72 : 72;
    const natMath = year === "2022-23" ? 73 : year === "2023-24" ? 73 : 74;
    const natCombined = year === "2022-23" ? 59 : year === "2023-24" ? 61 : 62;

    summaryRows.push({
      "Academic Year": year,
      "Cohort Size": n,
      Metric: "All Pupils",
      "Reading EXS+ %": pct(readEXS),
      "Reading GDS %": pct(readGDS),
      "Reading Avg Scaled Score": Math.round(readScoreSum / n),
      "Writing EXS+ %": pct(writeEXS),
      "Writing GDS %": pct(writeGDS),
      "Maths EXS+ %": pct(mathEXS),
      "Maths GDS %": pct(mathGDS),
      "Maths Avg Scaled Score": Math.round(mathScoreSum / n),
      "Combined RWM %": pct(combinedEXS),
      "National Reading %": natRead,
      "National Writing %": natWrite,
      "National Maths %": natMath,
      "National Combined %": natCombined,
    });

    summaryRows.push({
      "Academic Year": year,
      "Cohort Size": ppCount,
      Metric: "Pupil Premium",
      "Reading EXS+ %": ppPct(ppReadEXS),
      "Reading GDS %": "",
      "Reading Avg Scaled Score": "",
      "Writing EXS+ %": ppPct(ppWriteEXS),
      "Writing GDS %": "",
      "Maths EXS+ %": ppPct(ppMathEXS),
      "Maths GDS %": "",
      "Maths Avg Scaled Score": "",
      "Combined RWM %": "",
      "National Reading %": natRead - 12,
      "National Writing %": natWrite - 14,
      "National Maths %": natMath - 12,
      "National Combined %": natCombined - 17,
    });

    summaryRows.push({
      "Academic Year": year,
      "Cohort Size": nonPPCount,
      Metric: "Non-PP",
      "Reading EXS+ %": nonPPPct(nonPPReadEXS),
      "Reading GDS %": "",
      "Reading Avg Scaled Score": "",
      "Writing EXS+ %": nonPPPct(nonPPWriteEXS),
      "Writing GDS %": "",
      "Maths EXS+ %": nonPPPct(nonPPMathEXS),
      "Maths GDS %": "",
      "Maths Avg Scaled Score": "",
      "Combined RWM %": "",
      "National Reading %": "",
      "National Writing %": "",
      "National Maths %": "",
      "National Combined %": "",
    });
  }

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(summaryRows),
    "School Summary",
  );
  writeWorkbook(wb, "dfe-data/historical_ks2_results.xlsx");
}

// ═══════════════════════════════════════════════
// FILE 10: mr_brown_y6_reading.xlsx
// ═══════════════════════════════════════════════
function generateMrBrownSheet() {
  console.log("\nGenerating mr_brown_y6_reading.xlsx...");

  const y6Sycamore = PUPILS_BY_CLASS["6-Sycamore"] || [];
  const rows = [];

  const bookBands = ["Lime", "Brown", "Grey", "Dark Blue", "Dark Red", "Black"];
  const readingAges = [
    "9:03",
    "9:06",
    "9:11",
    "10:02",
    "10:07",
    "10:11",
    "11:00",
    "11:03",
    "11:06",
    "11:09",
    "12:01",
    "12:05",
    "8:09",
    "8:04",
  ];

  for (const p of y6Sycamore) {
    const ability = getEffectiveAbility(
      p,
      "reading",
      "6",
      "Spr1",
      "2025-26",
      "Sycamore",
    );
    const grade = abilityToGrade(ability, "ks2");

    // Messy teacher format: first names only, sometimes nicknames
    let name = p.firstName;
    if (p.firstName === "Muhammad" || p.firstName === "Mohammed") name = "Mo";
    if (p.firstName === "Alexander") name = "Alex";
    if (p.firstName === "Benjamin") name = "Ben";
    if (p.firstName === "William") name = "Will";
    if (p.firstName === "Elizabeth") name = "Lizzy";
    if (p.firstName === "Katherine" || p.firstName === "Catherine")
      name = "Katie";
    if (p.firstName === "Isabella") name = rng() < 0.5 ? "Izzy" : "Bella";
    if (p.firstName === "Theodore") name = "Teddy";
    if (p.firstName === "Christopher") name = "Chris";

    // NFER standardised score (Mr Brown is accurate, so these match well)
    const nferScore =
      ability >= 85
        ? randInt(110, 120)
        : ability >= 40
          ? randInt(98, 112)
          : randInt(80, 98);

    const row = {
      Name: name,
      "Book Band":
        ability >= 70
          ? pick(bookBands.slice(3))
          : ability >= 40
            ? pick(bookBands.slice(1, 4))
            : pick(bookBands.slice(0, 2)),
      "Reading Age": rng() < 0.1 ? "" : pick(readingAges), // some empty
      "Fluency /4":
        ability >= 60
          ? randInt(3, 4)
          : ability >= 30
            ? randInt(2, 3)
            : randInt(1, 2),
      "Comprehension /4":
        ability >= 60
          ? randInt(3, 4)
          : ability >= 30
            ? randInt(2, 3)
            : randInt(1, 2),
      "My Assessment": grade === "GDS" ? "GD" : grade === "EXS" ? "Ex" : "WT",
      "Last NFER": rng() < 0.05 ? "" : nferScore, // occasionally blank
      Target: ability >= 70 ? "GD" : ability >= 35 ? "Ex" : "Ex", // everyone targets at least Ex
    };

    // Add random teacher comments to some rows
    if (rng() < 0.15) {
      row["Notes"] = pick([
        "needs to read at home more",
        "v strong inference skills",
        "still guessing at longer words",
        "accelerated progress since Jan",
        "check with parents re reading diary",
        "NFER doesn't reflect daily work??",
        "phonics gaps - long vowels",
        "loves David Walliams!",
      ]);
    } else {
      row["Notes"] = "";
    }

    rows.push(row);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  // Make it look like a real teacher spreadsheet: merge header styling would be here
  // but xlsx doesn't support rich formatting easily. The data itself tells the story.
  XLSX.utils.book_append_sheet(wb, ws, "Y6 Sycamore Reading");
  writeWorkbook(wb, "teacher-spreadsheets/mr_brown_y6_reading.xlsx");
}

// ═══════════════════════════════════════════════
// ALSO: Generate Y6 Hazel sheet showing TA inflation (Story 5)
// ═══════════════════════════════════════════════
function generateMrsWilliamsSheet() {
  console.log(
    "\nGenerating mrs_williams_y6_hazel_reading.xlsx (bonus - shows TA inflation)...",
  );

  const y6Hazel = PUPILS_BY_CLASS["6-Hazel"] || [];
  const rows = [];

  for (const p of y6Hazel) {
    const ability = getEffectiveAbility(
      p,
      "reading",
      "6",
      "Spr1",
      "2025-26",
      "Hazel",
    );
    const grade = abilityToGrade(ability, "ks2");

    // Story 5: Mrs Williams' TA is 8-10pp inflated
    // So her assessment is higher than it should be
    const inflatedAbility = clamp(ability + randInt(8, 10), 5, 99);
    const inflatedGrade = abilityToGrade(inflatedAbility, "ks2");

    // NFER score reflects ACTUAL ability (not inflated TA)
    const nferScore =
      ability >= 85
        ? randInt(110, 120)
        : ability >= 40
          ? randInt(98, 112)
          : randInt(80, 98);

    let name = p.firstName;
    if (p.firstName === "Muhammad" || p.firstName === "Mohammed") name = "Mo";
    if (p.firstName === "Alexander") name = "Alex";

    rows.push({
      Name: name,
      "My Assessment":
        inflatedGrade === "GDS" ? "GD" : inflatedGrade === "EXS" ? "Ex" : "WT",
      "NFER Score": rng() < 0.08 ? "" : nferScore,
      Target: inflatedAbility >= 70 ? "GD" : "Ex",
      Notes: "",
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(rows),
    "Y6 Hazel Reading",
  );
  writeWorkbook(wb, "teacher-spreadsheets/mrs_williams_y6_hazel_reading.xlsx");
}

// ══════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ══════════════════════════════════════════════════════════════════
console.log("═══════════════════════════════════════════════════════════");
console.log("  Aurora Primary School - Test Data Harness Generator");
console.log("═══════════════════════════════════════════════════════════");
console.log(`\nOutput directory: ${BASE}`);
console.log(`School: Aurora Primary School (2FE, ~420 pupils)`);
console.log(`Academic year: 2025-26 (Autumn + Spring complete)`);

// Ensure directories exist
[
  "arbor-exports",
  "tracker-exports",
  "dfe-data",
  "teacher-spreadsheets",
].forEach((dir) => {
  mkdirSync(join(BASE, dir), { recursive: true });
});

// Generate all files
generatePupilRoll();
const attRows = generateAttendance();
generateStatutoryResults();
const trackerRows = generateTrackerExport();
const behRows = generateBehaviour();
generateStaffExport();
generateTeacherClassHistory();
const senCount = generateSENRegister();
generateHistoricalKS2();
generateMrBrownSheet();
generateMrsWilliamsSheet();

// Summary
console.log("\n═══════════════════════════════════════════════════════════");
console.log("  Generation Complete!");
console.log("═══════════════════════════════════════════════════════════");
console.log(`\n  Current pupils:         ${ALL_PUPILS.length}`);
console.log(`  Historical leavers:     ${HISTORICAL_LEAVERS.length}`);
console.log(`  Attendance rows:        ${attRows}`);
console.log(`  Tracker data rows:      ${trackerRows}`);
console.log(`  Behaviour incidents:    ${behRows}`);
console.log(`  SEN register entries:   ${senCount}`);
console.log(`\n  Embedded Stories:`);
console.log(`    1. Mrs Patterson sick leave → Y3 Holly supply dip`);
console.log(`    2. Y5 Beech supply disruption → behaviour spike`);
console.log(`    3. Y6 high PP cohort → persistent gap`);
console.log(`    4. Aiden Murphy EHCP → success trajectory`);
console.log(`    5. Y6 Hazel TA inflation vs Sycamore alignment`);
console.log(`    6. Mia Clarke → invisible declining pupil`);
console.log(`    7. Tracy Morgan → Bradford Factor 108`);
console.log(`    8. Mr Lee → hidden writing underperformance`);
console.log(`    9. Ms Patel → consistently excellent maths`);
console.log(`\n  Files:`);
console.log(`    arbor-exports/arbor_pupil_roll.xlsx`);
console.log(`    arbor-exports/arbor_attendance_termly.xlsx`);
console.log(`    arbor-exports/arbor_statutory_results.xlsx`);
console.log(`    arbor-exports/arbor_behaviour_export.xlsx`);
console.log(`    arbor-exports/arbor_staff_export.xlsx`);
console.log(`    arbor-exports/arbor_teacher_class_history.xlsx`);
console.log(`    arbor-exports/sen_register_arbor.xlsx`);
console.log(`    tracker-exports/insight_tracker_export.xlsx`);
console.log(`    dfe-data/historical_ks2_results.xlsx`);
console.log(`    teacher-spreadsheets/mr_brown_y6_reading.xlsx`);
console.log(`    teacher-spreadsheets/mrs_williams_y6_hazel_reading.xlsx`);
console.log("\nDone!");
