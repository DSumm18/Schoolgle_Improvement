export const STAFF_IMPORT_HEADERS = [
  "salutation",
  "first_name",
  "last_name",
  "email",
  "phone",
  "employee_id",
  "job_title",
  "role_category",
  "is_super_user",
  "is_active",
  "action",
];

export const STAFF_IMPORT_DESCRIPTIONS = [
  "Optional title: Mr, Mrs, Ms, Dr, Prof, Miss.",
  "Required first name.",
  "Required last name.",
  "Work email. Used to match existing staff.",
  "Optional phone number.",
  "Staff/employee ID. Used to match existing staff.",
  "Required job title or position.",
  "Role category, e.g. headteacher, class_teacher, sendco.",
  "yes/no. Elevated permissions across modules.",
  "yes/no. Is this staff member currently active?",
  "new, keep, update or remove.",
];

const STAFF_IMPORT_EXAMPLE_ROWS = [
  [
    "Mr",
    "John",
    "Smith",
    "john.smith@school.co.uk",
    "01234 567890",
    "STF001",
    "Headteacher",
    "headteacher",
    "no",
    "yes",
    "new",
  ],
  [
    "Mrs",
    "Sarah",
    "Jones",
    "sarah.jones@school.co.uk",
    "",
    "STF002",
    "Deputy Headteacher",
    "deputy_headteacher",
    "no",
    "yes",
    "new",
  ],
  [
    "Ms",
    "Emily",
    "Brown",
    "emily.brown@school.co.uk",
    "",
    "STF003",
    "SENCO",
    "sendco",
    "no",
    "yes",
    "new",
  ],
  [
    "",
    "David",
    "Wilson",
    "david.wilson@school.co.uk",
    "",
    "STF004",
    "Class Teacher",
    "class_teacher",
    "no",
    "yes",
    "new",
  ],
  [
    "",
    "Jane",
    "Doe",
    "jane.doe@school.co.uk",
    "",
    "STF005",
    "Former Staff",
    "support_staff",
    "no",
    "no",
    "remove",
  ],
];

export function buildStaffImportTemplateCsv() {
  return [
    STAFF_IMPORT_DESCRIPTIONS,
    STAFF_IMPORT_HEADERS.join(","),
    ...STAFF_IMPORT_EXAMPLE_ROWS.map((row) =>
      row.map((value) => `"${value}"`).join(","),
    ),
  ].join("\n");
}

export function buildEmptyStaffImportCsv() {
  return [STAFF_IMPORT_DESCRIPTIONS, STAFF_IMPORT_HEADERS.join(",")].join("\n");
}

export function buildStaffImportExcelHtml() {
  return buildStyledTemplateExcelHtml({
    title: "Schoolgle Staff Upload Template",
    guidance: "Row 1 explains the columns. Row 2 is the exact import header. Start real staff data on row 3.",
    tip: "Tip: upload staff first, then upload classes to connect teachers and TAs to classes.",
    descriptions: STAFF_IMPORT_DESCRIPTIONS,
    headers: STAFF_IMPORT_HEADERS,
    rows: STAFF_IMPORT_EXAMPLE_ROWS,
  });
}
import { buildStyledTemplateExcelHtml } from "./upload-template-excel";
