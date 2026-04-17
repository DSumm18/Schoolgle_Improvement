const fs = require('fs');

const DATA = {
  "EYFS": {
    "CVPS": { "cohort": 27, "send": 4, "ehcp": 0, "fsm": 2, "gld_all": 0.52, "gld_fsm": 0.50, "gld_notfsm": 0.64 },
    "CHPS": { "cohort": 70, "send": 18, "ehcp": 13, "fsm": null, "gld_all": null, "gld_fsm": null, "gld_notfsm": null },
    "FPS": { "cohort": 45, "send": 6, "ehcp": 1, "fsm": 15, "gld_all": 0.57, "gld_fsm": 0.64, "gld_notfsm": 0.57 },
    "GHPS": { "cohort": null, "send": null, "ehcp": null, "fsm": null, "gld_all": null, "gld_fsm": null, "gld_notfsm": null },
    "HPS": { "cohort": 54, "send": 7, "ehcp": 5, "fsm": 12, "gld_all": 0.63, "gld_fsm": null, "gld_notfsm": null },
    "LPS": { "cohort": 6, "send": 0, "ehcp": 0, "fsm": 1, "gld_all": 1.00, "gld_fsm": 1.00, "gld_notfsm": 1.00 },
    "LGPS": { "cohort": 50, "send": 7, "ehcp": 1, "fsm": 12, "gld_all": 0.53, "gld_fsm": 0.33, "gld_notfsm": 0.45 }
  },
  "Year 1": {
    "CVPS": { "cohort": 27, "send": 9, "ehcp": 4, "fsm": 5, "R_ARE": 0.63, "R_GD": 0, "W_ARE": 0.56, "W_GD": 0, "M_ARE": 0.56, "M_GD": 0, "C_ARE": 0.48, "C_GD": 0, "phonics": 0.59,
      "fsm6": { "R_ARE": 0.20, "W_ARE": 0.20, "M_ARE": 0.40, "C_ARE": 0.20, "phonics": 0.40 },
      "notfsm": { "R_ARE": 0.73, "W_ARE": 0.64, "M_ARE": 0.59, "C_ARE": 0.55, "phonics": 0.64 } },
    "CHPS": { "cohort": 64, "send": 17, "ehcp": 11, "fsm": 19, "R_ARE": 0.46, "R_GD": 0, "W_ARE": 0.46, "W_GD": 0, "M_ARE": 0.48, "M_GD": 0, "C_ARE": 0.43, "C_GD": 0, "phonics": 0.56,
      "fsm6": { "R_ARE": 0.48, "W_ARE": 0.47, "M_ARE": 0.48, "C_ARE": 0.43 },
      "notfsm": { "R_ARE": 0.45, "W_ARE": 0.48, "M_ARE": 0.48, "C_ARE": 0.44 } },
    "FPS": { "cohort": 59, "send": 8, "ehcp": 2, "fsm": 14, "R_ARE": 0.53, "R_GD": 0, "W_ARE": 0.53, "W_GD": 0, "M_ARE": 0.64, "M_GD": 0, "C_ARE": 0.49, "C_GD": 0, "phonics": 0.75,
      "fsm6": { "R_ARE": 0.50, "W_ARE": 0.50, "M_ARE": 0.33, "C_ARE": 0.33, "phonics": 0.67 },
      "notfsm": { "R_ARE": 0.53, "W_ARE": 0.53, "M_ARE": 0.68, "C_ARE": 0.51, "phonics": 0.65 } },
    "GHPS": { "cohort": 56, "send": 18, "ehcp": 8, "fsm": 13, "R_ARE": 0.42, "R_GD": 0.04, "W_ARE": 0.51, "W_GD": 0.04, "M_ARE": 0.58, "M_GD": 0, "C_ARE": 0.40, "C_GD": 0, "phonics": 0.64,
      "fsm6": { "R_ARE": 0.36, "W_ARE": 0.43, "M_ARE": 0.57, "C_ARE": 0.36, "phonics": 0.67 },
      "notfsm": { "R_ARE": 0.39, "W_ARE": 0.54, "M_ARE": 0.59, "C_ARE": 0.44, "phonics": 0.53 } },
    "HPS": { "cohort": 60, "send": 6, "ehcp": 6, "fsm": null, "R_ARE": 0.55, "R_GD": 0, "W_ARE": 0.48, "W_GD": 0, "M_ARE": 0.55, "M_GD": 0, "C_ARE": 0.47, "C_GD": 0, "phonics": null,
      "fsm6": { "R_ARE": 0.36, "W_ARE": 0.36, "M_ARE": 0.36, "C_ARE": 0.36 },
      "notfsm": { "R_ARE": 0.50, "W_ARE": 0.52, "M_ARE": 0.61, "C_ARE": 0.50 } },
    "LPS": { "cohort": 12, "send": 3, "ehcp": 0, "fsm": 7, "R_ARE": 0.66, "R_GD": 0, "W_ARE": 0.50, "W_GD": 0, "M_ARE": 0.58, "M_GD": 0, "C_ARE": 0.50, "C_GD": 0, "phonics": 0.75,
      "fsm6": { "R_ARE": 0.57, "W_ARE": 0.29, "M_ARE": 0.43, "C_ARE": 0.29, "phonics": 0.57 },
      "notfsm": { "R_ARE": 0.80, "W_ARE": 0.60, "M_ARE": 0.80, "C_ARE": 0.60, "phonics": 1.00 } },
    "LGPS": { "cohort": 64, "send": 13, "ehcp": 7, "fsm": 30, "R_ARE": 0.63, "R_GD": 0, "W_ARE": 0.583, "W_GD": 0, "M_ARE": 0.617, "M_GD": 0, "C_ARE": 0.567, "C_GD": 0, "phonics": 0.58,
      "fsm6": { "R_ARE": 0.57, "W_ARE": 0.57, "M_ARE": 0.57, "C_ARE": 0.54, "phonics": 0.54 },
      "notfsm": { "R_ARE": 0.69, "W_ARE": 0.59, "M_ARE": 0.66, "C_ARE": 0.59, "phonics": 0.46 } }
  },
  "Year 2": {
    "CVPS": { "cohort": 27, "send": 6, "ehcp": 3, "fsm": 5, "R_ARE": 0.67, "R_GD": 0.07, "W_ARE": 0.63, "W_GD": 0, "M_ARE": 0.67, "M_GD": 0.07, "C_ARE": 0.63, "C_GD": 0, "phonics": 0.74,
      "fsm6": { "R_ARE": 0.60, "W_ARE": 0.60, "M_ARE": 0.60, "C_ARE": 0.60, "phonics": 0.60 },
      "notfsm": { "R_ARE": 0.68, "W_ARE": 0.64, "M_ARE": 0.68, "C_ARE": 0.64, "phonics": 0.77 } },
    "CHPS": { "cohort": 81, "send": 23, "ehcp": 6, "fsm": 21, "R_ARE": 0.54, "R_GD": 0.16, "W_ARE": 0.46, "W_GD": 0, "M_ARE": 0.57, "M_GD": 0.07, "C_ARE": 0.44, "C_GD": 0, "phonics": null,
      "fsm6": { "R_ARE": 0.44, "W_ARE": 0.21, "M_ARE": 0.35, "C_ARE": 0.21 },
      "notfsm": { "R_ARE": 0.59, "W_ARE": 0.55, "M_ARE": 0.66, "C_ARE": 0.53 } },
    "FPS": { "cohort": 56, "send": 9, "ehcp": 4, "fsm": 14, "R_ARE": 0.57, "R_GD": 0.13, "W_ARE": 0.50, "W_GD": 0.02, "M_ARE": 0.57, "M_GD": 0.18, "C_ARE": 0.43, "C_GD": 0.02, "phonics": 0.95,
      "fsm6": { "R_ARE": 0.70, "W_ARE": 0.40, "M_ARE": 0.30, "C_ARE": 0.20 },
      "notfsm": { "R_ARE": 0.60, "W_ARE": 0.52, "M_ARE": 0.63, "C_ARE": 0.48 } },
    "GHPS": { "cohort": 58, "send": 8, "ehcp": 5, "fsm": 21, "R_ARE": 0.60, "R_GD": 0.13, "W_ARE": 0.64, "W_GD": 0.05, "M_ARE": 0.73, "M_GD": 0.09, "C_ARE": 0.58, "C_GD": 0.05, "phonics": 0.81,
      "fsm6": { "R_ARE": 0.50, "W_ARE": 0.50, "M_ARE": 0.70, "C_ARE": 0.50, "phonics": 0.79 },
      "notfsm": { "R_ARE": 0.66, "W_ARE": 0.69, "M_ARE": 0.74, "C_ARE": 0.62, "phonics": 0.81 } },
    "HPS": { "cohort": 61, "send": 3, "ehcp": 5, "fsm": 15, "R_ARE": 0.67, "R_GD": 0, "W_ARE": 0.61, "W_GD": 0, "M_ARE": 0.66, "M_GD": 0.08, "C_ARE": 0.56, "C_GD": 0, "phonics": null,
      "fsm6": { "R_ARE": 0.73, "W_ARE": 0.53, "M_ARE": 0.60, "C_ARE": 0.47 },
      "notfsm": { "R_ARE": 0.65, "W_ARE": 0.63, "M_ARE": 0.67, "C_ARE": 0.59 } },
    "LPS": { "cohort": 13, "send": 3, "ehcp": 0, "fsm": 5, "R_ARE": 0.62, "R_GD": 0, "W_ARE": 0.54, "W_GD": 0, "M_ARE": 0.62, "M_GD": 0, "C_ARE": 0.54, "C_GD": 0, "phonics": 0.77,
      "fsm6": { "R_ARE": 0.66, "W_ARE": 0.66, "M_ARE": 0.66, "C_ARE": 0.66, "phonics": 1.00 },
      "notfsm": { "R_ARE": 0.58, "W_ARE": 0.58, "M_ARE": 0.58, "C_ARE": 0.58, "phonics": 0.25 } },
    "LGPS": { "cohort": 61, "send": 12, "ehcp": 4, "fsm": 22, "R_ARE": 0.625, "R_GD": 0, "W_ARE": 0.56, "W_GD": 0, "M_ARE": 0.57, "M_GD": 0.02, "C_ARE": 0.52, "C_GD": 0, "phonics": 0.91,
      "fsm6": { "R_ARE": 0.619, "W_ARE": 0.524, "M_ARE": 0.476, "C_ARE": 0.476, "phonics": 0.88 },
      "notfsm": { "R_ARE": 0.629, "W_ARE": 0.571, "M_ARE": 0.629, "C_ARE": 0.543, "phonics": 0.92 } }
  },
  "Year 3": {
    "CVPS": { "cohort": 30, "send": 7, "ehcp": 1, "fsm": 6, "R_ARE": 0.63, "R_GD": 0.07, "W_ARE": 0.63, "W_GD": 0.07, "M_ARE": 0.70, "M_GD": 0.10, "C_ARE": 0.60, "C_GD": 0.03,
      "fsm6": { "R_ARE": 0.33, "W_ARE": 0.33, "M_ARE": 0.50, "C_ARE": 0.33 },
      "notfsm": { "R_ARE": 0.71, "W_ARE": 0.71, "M_ARE": 0.75, "C_ARE": 0.67 } },
    "CHPS": { "cohort": 88, "send": 19, "ehcp": 9, "fsm": 36, "R_ARE": 0.65, "R_GD": 0.21, "W_ARE": 0.60, "W_GD": 0, "M_ARE": 0.66, "M_GD": 0.22, "C_ARE": 0.55, "C_GD": 0,
      "fsm6": { "R_ARE": 0.55, "W_ARE": 0.50, "M_ARE": 0.58, "C_ARE": 0.42 },
      "notfsm": { "R_ARE": 0.73, "W_ARE": 0.69, "M_ARE": 0.73, "C_ARE": 0.67 } },
    "FPS": { "cohort": 57, "send": 7, "ehcp": 3, "fsm": 17, "R_ARE": 0.60, "R_GD": 0.11, "W_ARE": 0.60, "W_GD": 0, "M_ARE": 0.68, "M_GD": 0.11, "C_ARE": 0.56, "C_GD": 0,
      "fsm6": { "R_ARE": 0.56, "W_ARE": 0.56, "M_ARE": 0.64, "C_ARE": 0.56 },
      "notfsm": { "R_ARE": 0.61, "W_ARE": 0.61, "M_ARE": 0.70, "C_ARE": 0.57 } },
    "GHPS": { "cohort": 47, "send": 11, "ehcp": 8, "fsm": 17, "R_ARE": 0.51, "R_GD": 0.04, "W_ARE": 0.53, "W_GD": 0.09, "M_ARE": 0.71, "M_GD": 0.16, "C_ARE": 0.40, "C_GD": 0,
      "fsm6": { "R_ARE": 0.39, "W_ARE": 0.43, "M_ARE": 0.61, "C_ARE": 0.35 },
      "notfsm": { "R_ARE": 0.55, "W_ARE": 0.54, "M_ARE": 0.71, "C_ARE": 0.44 } },
    "HPS": { "cohort": 61, "send": 10, "ehcp": 5, "fsm": 21, "R_ARE": 0.64, "R_GD": 0, "W_ARE": 0.62, "W_GD": 0, "M_ARE": 0.67, "M_GD": 0.12, "C_ARE": 0.54, "C_GD": 0,
      "fsm6": { "R_ARE": 0.52, "W_ARE": 0.48, "M_ARE": 0.52, "C_ARE": 0.38 },
      "notfsm": { "R_ARE": 0.70, "W_ARE": 0.70, "M_ARE": 0.75, "C_ARE": 0.63 } },
    "LPS": { "cohort": 13, "send": 1, "ehcp": 0, "fsm": 4, "R_ARE": 0.77, "R_GD": 0.08, "W_ARE": 0.77, "W_GD": 0, "M_ARE": 0.77, "M_GD": 0.08, "C_ARE": 0.77, "C_GD": 0,
      "fsm6": { "R_ARE": 0.60, "W_ARE": 0.80, "M_ARE": 0.80, "C_ARE": 0.60 },
      "notfsm": { "R_ARE": 0.88, "W_ARE": 0.88, "M_ARE": 0.88, "C_ARE": 0.88 } },
    "LGPS": { "cohort": 61, "send": 11, "ehcp": 3, "fsm": 25, "R_ARE": 0.518, "R_GD": 0.054, "W_ARE": 0.411, "W_GD": 0, "M_ARE": 0.536, "M_GD": 0.036, "C_ARE": 0.393, "C_GD": 0,
      "fsm6": { "R_ARE": 0.409, "W_ARE": 0.273, "M_ARE": 0.559, "C_ARE": 0.227 },
      "notfsm": { "R_ARE": 0.588, "W_ARE": 0.500, "M_ARE": 0.559, "C_ARE": 0.500 } }
  },
  "Year 4": {
    "CVPS": { "cohort": 26, "send": 3, "ehcp": 2, "fsm": 6, "R_ARE": 0.65, "R_GD": 0.27, "W_ARE": 0.62, "W_GD": 0.08, "M_ARE": 0.65, "M_GD": 0.11, "C_ARE": 0.46, "C_GD": 0.04, "mtc": 0.54,
      "fsm6": { "R_ARE": 0, "W_ARE": 0, "M_ARE": 0.33, "C_ARE": 0, "mtc": 0.17 },
      "notfsm": { "R_ARE": 0.85, "W_ARE": 0.80, "M_ARE": 0.75, "C_ARE": 0.60, "mtc": 0.65 } },
    "CHPS": { "cohort": 81, "send": 20, "ehcp": 11, "fsm": 34, "R_ARE": 0.54, "R_GD": 0.18, "W_ARE": 0.41, "W_GD": 0, "M_ARE": 0.56, "M_GD": 0.19, "C_ARE": 0.38, "C_GD": 0, "mtc": null,
      "fsm6": { "R_ARE": 0.50, "W_ARE": 0.34, "M_ARE": 0.44, "C_ARE": 0.31 },
      "notfsm": { "R_ARE": 0.56, "W_ARE": 0.46, "M_ARE": 0.65, "C_ARE": 0.42 } },
    "FPS": { "cohort": 61, "send": 13, "ehcp": 6, "fsm": 24, "R_ARE": 0.59, "R_GD": 0.12, "W_ARE": 0.59, "W_GD": 0.03, "M_ARE": 0.59, "M_GD": 0.12, "C_ARE": 0.51, "C_GD": 0.03, "mtc": 0.61,
      "fsm6": { "R_ARE": 0.58, "W_ARE": 0.63, "M_ARE": 0.58, "C_ARE": 0.42 },
      "notfsm": { "R_ARE": 0.60, "W_ARE": 0.57, "M_ARE": 0.60, "C_ARE": 0.55 } },
    "GHPS": { "cohort": 53, "send": 14, "ehcp": 3, "fsm": 16, "R_ARE": 0.72, "R_GD": 0.06, "W_ARE": 0.62, "W_GD": 0.13, "M_ARE": 0.68, "M_GD": 0.13, "C_ARE": 0.53, "C_GD": 0.04, "mtc": 0.65,
      "fsm6": { "R_ARE": 0.72, "W_ARE": 0.56, "M_ARE": 0.75, "C_ARE": 0.50 },
      "notfsm": { "R_ARE": 0.73, "W_ARE": 0.65, "M_ARE": 0.65, "C_ARE": 0.51 } },
    "HPS": { "cohort": 64, "send": 13, "ehcp": 6, "fsm": 23, "R_ARE": 0.55, "R_GD": 0.19, "W_ARE": 0.53, "W_GD": 0.09, "M_ARE": 0.41, "M_GD": 0.14, "C_ARE": 0.31, "C_GD": 0.03, "mtc": 0.50,
      "fsm6": { "R_ARE": 0.52, "W_ARE": 0.44, "M_ARE": 0.26, "C_ARE": 0.22, "mtc": 0.29 },
      "notfsm": { "R_ARE": 0.56, "W_ARE": 0.59, "M_ARE": 0.49, "C_ARE": 0.37, "mtc": 0.64 } },
    "LPS": { "cohort": 13, "send": 5, "ehcp": 2, "fsm": 11, "R_ARE": 0.62, "R_GD": 0, "W_ARE": 0.54, "W_GD": 0, "M_ARE": 0.54, "M_GD": 0.08, "C_ARE": 0.54, "C_GD": 0, "mtc": 0.40,
      "fsm6": { "R_ARE": 0.50, "W_ARE": 0.40, "M_ARE": 0.45, "C_ARE": 0.40 },
      "notfsm": { "R_ARE": 1.00, "W_ARE": 1.00, "M_ARE": 1.00, "C_ARE": 1.00 } },
    "LGPS": { "cohort": 82, "send": 16, "ehcp": 8, "fsm": 37, "R_ARE": 0.51, "R_GD": 0.05, "W_ARE": 0.39, "W_GD": 0, "M_ARE": 0.48, "M_GD": 0.07, "C_ARE": 0.38, "C_GD": 0, "mtc": 0.50,
      "fsm6": { "R_ARE": 0.38, "W_ARE": 0.32, "M_ARE": 0.41, "C_ARE": 0.30 },
      "notfsm": { "R_ARE": 0.63, "W_ARE": 0.53, "M_ARE": 0.68, "C_ARE": 0.53 } }
  },
  "Year 5": {
    "CVPS": { "cohort": 30, "send": 6, "ehcp": 2, "fsm": 10, "R_ARE": 0.70, "R_GD": 0.03, "W_ARE": 0.67, "W_GD": 0, "M_ARE": 0.67, "M_GD": 0.17, "C_ARE": 0.63, "C_GD": 0,
      "fsm6": { "R_ARE": 0.60, "W_ARE": 0.50, "M_ARE": 0.50, "C_ARE": 0.50 },
      "notfsm": { "R_ARE": 0.75, "W_ARE": 0.75, "M_ARE": 0.75, "C_ARE": 0.70 } },
    "CHPS": { "cohort": 90, "send": 25, "ehcp": 13, "fsm": 37, "R_ARE": 0.64, "R_GD": 0.12, "W_ARE": 0.58, "W_GD": 0, "M_ARE": 0.62, "M_GD": 0.18, "C_ARE": 0.54, "C_GD": 0,
      "fsm6": { "R_ARE": 0.57, "W_ARE": 0.49, "M_ARE": 0.57, "C_ARE": 0.46 },
      "notfsm": { "R_ARE": 0.70, "W_ARE": 0.64, "M_ARE": 0.66, "C_ARE": 0.60 } },
    "FPS": { "cohort": 56, "send": 10, "ehcp": 2, "fsm": 22, "R_ARE": 0.66, "R_GD": 0.07, "W_ARE": 0.60, "W_GD": 0.04, "M_ARE": 0.63, "M_GD": 0.11, "C_ARE": 0.52, "C_GD": 0.02,
      "fsm6": { "R_ARE": 0.71, "W_ARE": 0.65, "M_ARE": 0.65, "C_ARE": 0.59 },
      "notfsm": { "R_ARE": 0.64, "W_ARE": 0.56, "M_ARE": 0.62, "C_ARE": 0.49 } },
    "GHPS": { "cohort": 59, "send": 12, "ehcp": 4, "fsm": 24, "R_ARE": 0.69, "R_GD": 0.12, "W_ARE": 0.68, "W_GD": 0.12, "M_ARE": 0.63, "M_GD": 0.17, "C_ARE": 0.59, "C_GD": 0.03,
      "fsm6": { "R_ARE": 0.67, "W_ARE": 0.50, "M_ARE": 0.50, "C_ARE": 0.46 },
      "notfsm": { "R_ARE": 0.74, "W_ARE": 0.80, "M_ARE": 0.71, "C_ARE": 0.71 } },
    "HPS": { "cohort": 66, "send": 15, "ehcp": 8, "fsm": 22, "R_ARE": 0.59, "R_GD": 0.14, "W_ARE": 0.56, "W_GD": 0.15, "M_ARE": 0.55, "M_GD": 0.12, "C_ARE": 0.38, "C_GD": 0.03,
      "fsm6": { "R_ARE": 0.59, "W_ARE": 0.55, "M_ARE": 0.55, "C_ARE": 0.41 },
      "notfsm": { "R_ARE": 0.59, "W_ARE": 0.57, "M_ARE": 0.55, "C_ARE": 0.36 } },
    "LPS": { "cohort": 10, "send": 3, "ehcp": 1, "fsm": 6, "R_ARE": 0.50, "R_GD": 0.10, "W_ARE": 0.40, "W_GD": 0, "M_ARE": 0.50, "M_GD": 0.10, "C_ARE": 0.40, "C_GD": 0,
      "fsm6": { "R_ARE": 0.66, "W_ARE": 0.50, "M_ARE": 0.66, "C_ARE": 0.50 },
      "notfsm": { "R_ARE": 0.25, "W_ARE": 0.25, "M_ARE": 0.25, "C_ARE": 0.25 } },
    "LGPS": { "cohort": 76, "send": 19, "ehcp": 6, "fsm": 36, "R_ARE": 0.45, "R_GD": 0.04, "W_ARE": 0.33, "W_GD": 0, "M_ARE": 0.40, "M_GD": 0.07, "C_ARE": 0.25, "C_GD": 0,
      "fsm6": { "R_ARE": 0.39, "W_ARE": 0.18, "M_ARE": 0.30, "C_ARE": 0.12 },
      "notfsm": { "R_ARE": 0.55, "W_ARE": 0.50, "M_ARE": 0.53, "C_ARE": 0.39 } }
  },
  "Year 6": {
    "CVPS": { "cohort": 25, "send": 9, "ehcp": 3, "fsm": 9, "R_ARE": 0.68, "R_GD": 0.28, "W_ARE": 0.64, "W_GD": 0.12, "M_ARE": 0.60, "M_GD": 0.20, "C_ARE": 0.60, "C_GD": 0.12,
      "fsm6": { "R_ARE": 0.44, "W_ARE": 0.44, "M_ARE": 0.33, "C_ARE": 0.33 },
      "notfsm": { "R_ARE": 0.81, "W_ARE": 0.75, "M_ARE": 0.75, "C_ARE": 0.75 } },
    "CHPS": { "cohort": 87, "send": 28, "ehcp": 13, "fsm": 41, "R_ARE": 0.64, "R_GD": 0.31, "W_ARE": 0.67, "W_GD": 0, "M_ARE": 0.61, "M_GD": 0.09, "C_ARE": 0.51, "C_GD": 0,
      "fsm6": { "R_ARE": 0.59, "W_ARE": 0.58, "M_ARE": 0.56, "C_ARE": 0.46 },
      "notfsm": { "R_ARE": 0.70, "W_ARE": 0.76, "M_ARE": 0.65, "C_ARE": 0.54 } },
    "FPS": { "cohort": 61, "send": 11, "ehcp": 2, "fsm": 19, "R_ARE": 0.69, "R_GD": 0.12, "W_ARE": 0.67, "W_GD": 0, "M_ARE": 0.72, "M_GD": 0.03, "C_ARE": 0.64, "C_GD": 0,
      "fsm6": { "R_ARE": 0.75, "W_ARE": 0.69, "M_ARE": 0.69, "C_ARE": 0.69 },
      "notfsm": { "R_ARE": 0.68, "W_ARE": 0.68, "M_ARE": 0.73, "C_ARE": 0.62 } },
    "GHPS": { "cohort": 53, "send": 16, "ehcp": 7, "fsm": 18, "R_ARE": 0.65, "R_GD": 0.19, "W_ARE": 0.60, "W_GD": 0.08, "M_ARE": 0.58, "M_GD": 0.08, "C_ARE": 0.48, "C_GD": 0.02,
      "fsm6": { "R_ARE": 0.82, "W_ARE": 0.71, "M_ARE": 0.71, "C_ARE": 0.59 },
      "notfsm": { "R_ARE": 0.57, "W_ARE": 0.54, "M_ARE": 0.51, "C_ARE": 0.43 } },
    "HPS": { "cohort": 65, "send": 19, "ehcp": 9, "fsm": 25, "R_ARE": 0.85, "R_GD": 0.48, "W_ARE": 0.75, "W_GD": 0.11, "M_ARE": 0.85, "M_GD": 0.34, "C_ARE": 0.71, "C_GD": 0.10,
      "fsm6": { "R_ARE": 0.76, "W_ARE": 0.56, "M_ARE": 0.76, "C_ARE": 0.56 },
      "notfsm": { "R_ARE": 0.90, "W_ARE": 0.85, "M_ARE": 0.83, "C_ARE": 0.83 } },
    "LPS": { "cohort": 12, "send": 0, "ehcp": 0, "fsm": 4, "R_ARE": 1.00, "R_GD": 0.25, "W_ARE": 0.59, "W_GD": 0.08, "M_ARE": 0.75, "M_GD": 0.25, "C_ARE": 0.50, "C_GD": 0,
      "fsm6": { "R_ARE": 0.75, "W_ARE": 0.25, "M_ARE": 0.25, "C_ARE": 0.25 },
      "notfsm": { "R_ARE": 1.00, "W_ARE": 0.50, "M_ARE": 1.00, "C_ARE": 0.42 } },
    "LGPS": { "cohort": 83, "send": 21, "ehcp": 10, "fsm": 38, "R_ARE": 0.71, "R_GD": 0.25, "W_ARE": 0.65, "W_GD": 0.04, "M_ARE": 0.65, "M_GD": 0.18, "C_ARE": 0.56, "C_GD": 0.03,
      "fsm6": { "R_ARE": 0.59, "W_ARE": 0.56, "M_ARE": 0.53, "C_ARE": 0.41 },
      "notfsm": { "R_ARE": 0.81, "W_ARE": 0.72, "M_ARE": 0.75, "C_ARE": 0.67 } }
  }
};

const rows = [];
const cols = [
  "School", "YearGroup", "Cohort", "SEND", "EHCP", "FSM",
  "GLD_All", "GLD_FSM", "GLD_NonFSM",
  "R_ARE", "R_GD", "W_ARE", "W_GD", "M_ARE", "M_GD", "C_ARE", "C_GD", 
  "Phonics", "MTC",
  "FSM6_R_ARE", "NotFSM_R_ARE", "FSM6_W_ARE", "NotFSM_W_ARE", 
  "FSM6_M_ARE", "NotFSM_M_ARE", "FSM6_C_ARE", "NotFSM_C_ARE",
  "FSM6_Phonics", "NotFSM_Phonics", "FSM6_MTC", "NotFSM_MTC"
];

rows.push(cols.join(","));

for (const yg of Object.keys(DATA)) {
  for (const school of Object.keys(DATA[yg])) {
    const d = DATA[yg][school];
    // Helper to extract
    const csvRow = cols.map(c => {
      let val = "";
      if (c === "School") val = school;
      else if (c === "YearGroup") val = yg;
      else if (['Cohort','SEND','EHCP','FSM'].includes(c)) val = d[c.toLowerCase()];
      else if (c === "GLD_All") val = d.gld_all;
      else if (c === "GLD_FSM") val = d.gld_fsm;
      else if (c === "GLD_NonFSM") val = d.gld_notfsm;
      else if (c.startsWith("FSM6_")) {
         const k = c.replace("FSM6_", "");
         val = d.fsm6?.[k.toLowerCase()] || d.fsm6?.[k];
      }
      else if (c.startsWith("NotFSM_")) {
         const k = c.replace("NotFSM_", "");
         val = d.notfsm?.[k.toLowerCase()] || d.notfsm?.[k];
      }
      else val = d[c.toLowerCase()] || d[c];

      return val == null ? "" : val;
    });
    rows.push(csvRow.join(","));
  }
}

fs.writeFileSync('/Users/jarvis/Downloads/test_trust_data.csv', rows.join("\n"));
console.log("Written!");
