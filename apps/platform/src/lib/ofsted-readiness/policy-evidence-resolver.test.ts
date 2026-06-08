import { describe, expect, it } from "vitest";
import {
  resolveOfstedDocumentEvidence,
  type ExpectedOfstedDocument,
} from "./policy-evidence-resolver";

const safeguardingOnly: ExpectedOfstedDocument[] = [
  {
    area: "SAFEGUARDING",
    name: "Safeguarding Policy",
    priority: "critical",
    websiteRequirementKeys: ["safeguarding_policy"],
    websiteExpected: true,
  },
];

describe("resolveOfstedDocumentEvidence", () => {
  it("uses compliant website policy evidence without requiring a Drive upload", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: safeguardingOnly,
      websiteAssessments: [
        {
          requirement_key: "safeguarding_policy",
          requirement_name: "Safeguarding / Child Protection Policy",
          status: "compliant",
          compliance_score: 95,
          evidence_urls: ["https://school.example/policies/safeguarding.pdf"],
          gaps: [],
          recommendations: [],
        },
      ],
    });

    expect(result.documents_missing).toHaveLength(0);
    expect(result.documents_found).toMatchObject([
      {
        matched_to: "Safeguarding Policy",
        source: "website",
        readiness_status: "ready",
        evidence_url: "https://school.example/policies/safeguarding.pdf",
        action_required: false,
      },
    ]);
    expect(result.overall_coverage).toBe(100);
  });

  it("treats outdated website policies as found evidence with an action, not missing documents", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: safeguardingOnly,
      websiteAssessments: [
        {
          requirement_key: "safeguarding_policy",
          requirement_name: "Safeguarding / Child Protection Policy",
          status: "outdated",
          compliance_score: 55,
          evidence_urls: ["https://school.example/safeguarding"],
          gaps: ["Policy references outdated KCSIE edition"],
          recommendations: ["Review and republish the policy"],
        },
      ],
    });

    expect(result.documents_missing).toHaveLength(0);
    expect(result.documents_found[0]).toMatchObject({
      source: "website",
      readiness_status: "needs_review",
      action_required: true,
      website_status: "outdated",
    });
    expect(result.action_required_count).toBe(1);
  });

  it("assesses a safeguarding website policy and extracts the next review schedule", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: safeguardingOnly,
      websiteDocuments: [
        {
          url: "https://drive.google.com/file/d/pay-safeguarding/view",
          filename: "PAY Safeguarding Policy.pdf",
          title: "Safeguarding and Child Protection Policy",
          link_text: "Safeguarding and Child Protection Policy",
          found_on_page_url: "https://school.example/policies-and-documents/",
          file_type: "pdf",
          source: "trust",
          dates_found: ["March 2026", "September 2027"],
          extracted_text: [
            "Pennine Academies Yorkshire Safeguarding and Child Protection Policy.",
            "Date written: 20 March 2026. Date issued: March 2026. Date to be reviewed: September 2027.",
            "This policy is aligned with Keeping Children Safe in Education 2025 and Working Together to Safeguard Children 2026.",
            "The Designated Safeguarding Lead (DSL), Deputy DSLs and safeguarding governor are named with contact routes.",
            "Staff must report concerns immediately to the DSL. The policy explains referrals to Children's Social Care, MASH, the LSCP and LADO allegations procedures.",
            "Record keeping, confidentiality, information sharing, whistleblowing, staff induction and annual safeguarding training are covered.",
            "Online safety includes filtering and monitoring. Child-on-child abuse, sexual violence and sexual harassment are covered.",
            "Prevent, FGM, forced marriage, honour-based abuse, county lines, criminal exploitation, children missing from education and children with SEND are covered.",
            "Safer recruitment, behaviour, attendance, RSE, photography, mobile phones and reasonable force are cross-referenced.",
          ].join(" "),
        },
      ],
    });

    expect(result.documents_missing).toHaveLength(0);
    expect(result.documents_found[0]).toMatchObject({
      matched_to: "Safeguarding Policy",
      source: "website_document",
      evidence_url: "https://drive.google.com/file/d/pay-safeguarding/view",
      readiness_status: "ready",
      currency_status: "current",
      action_required: false,
      policy_review: {
        date_found: "September 2027",
        review_due_at: "2027-09-01",
        reminder_due_at: "2027-06-01",
        reminder_lead_months: 3,
      },
    });
    expect(result.documents_found[0].notes).toContain(
      "Next review reminder should be scheduled for 1 Jun 2027.",
    );
  });

  it("enriches compliant safeguarding website assessments with review dates from the linked policy document", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: safeguardingOnly,
      websiteAssessments: [
        {
          requirement_key: "safeguarding_policy",
          requirement_name: "Safeguarding / Child Protection Policy",
          status: "compliant",
          compliance_score: 93,
          quality_score: 90,
          currency_status: "current",
          evidence_urls: [
            "https://drive.google.com/file/d/pay-safeguarding/view",
          ],
          evidence_quotes: ["Safeguarding policy found on policies page."],
          gaps: [],
          recommendations: [],
          red_flags: [],
          review_date_found: null,
        },
      ],
      websiteDocuments: [
        {
          url: "https://drive.google.com/file/d/pay-safeguarding/view",
          filename: "PAY Safeguarding Policy.pdf",
          title: "Safeguarding and Child Protection Policy",
          link_text: "Safeguarding and Child Protection Policy",
          found_on_page_url: "https://school.example/policies-and-documents/",
          file_type: "pdf",
          source: "trust",
          extracted_text: [
            "Pennine Academies Yorkshire Safeguarding and Child Protection Policy.",
            "Date written: 20 March 2026. Date to be reviewed: September 2027.",
            "This policy references Keeping Children Safe in Education 2025 and Working Together to Safeguard Children 2026.",
            "The designated safeguarding lead, deputy DSL and safeguarding trustee are named.",
            "The policy sets out referrals, LADO allegations, record keeping, confidentiality, information sharing, online safety, filtering and monitoring.",
            "It covers child-on-child abuse, sexual violence, sexual harassment, Prevent, FGM, county lines, children missing from education, SEND vulnerability and early help.",
            "It references staff induction, annual safeguarding training and safer recruitment checks.",
          ].join(" "),
          word_count: 2400,
        },
      ],
    });

    expect(result.documents_found[0]).toMatchObject({
      source: "website",
      evidence_url: "https://drive.google.com/file/d/pay-safeguarding/view",
      policy_review: {
        date_found: "September 2027",
        review_due_at: "2027-09-01",
        reminder_due_at: "2027-06-01",
      },
    });
  });

  it("prefers a current letter-spaced Google Drive safeguarding policy over an older directly linked PDF", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: safeguardingOnly,
      websiteAssessments: [
        {
          requirement_key: "safeguarding_policy",
          requirement_name: "Safeguarding / Child Protection Policy",
          status: "compliant",
          compliance_score: 84,
          quality_score: 80,
          currency_status: "current",
          evidence_urls: [
            "https://grovehouseprimary.co.uk/wp-content/uploads/2021/06/Safeguarding-and-Child-Protection-Policy.pdf",
          ],
          evidence_quotes: ["Legacy safeguarding policy found on policies page."],
          gaps: [],
          recommendations: [],
          red_flags: [],
          review_date_found: null,
        },
      ],
      websiteDocuments: [
        {
          url: "https://grovehouseprimary.co.uk/wp-content/uploads/2021/06/Safeguarding-and-Child-Protection-Policy.pdf",
          filename: "Safeguarding-and-Child-Protection-Policy.pdf",
          title: "Safeguarding and Child Protection Policy",
          link_text: "Safeguarding and Child Protection Policy",
          found_on_page_url: "https://grovehouseprimary.co.uk/policies/",
          file_type: "pdf",
          source: "school",
          dates_found: ["March 2015", "September 2016", "July 2016"],
          extracted_text:
            "Safeguarding and Child Protection Policy. This legacy policy references old local contacts and does not reference KCSIE 2025.",
          word_count: 5800,
        },
        {
          url: "https://drive.google.com/file/d/current-safeguarding/view",
          filename: "view",
          title: "Safeguarding & Child Protection Policy 25-26 GHPS.pdf",
          link_text: "Safeguarding & Child Protection Policy 25-26 GHPS.pdf",
          found_on_page_url:
            "https://grovehouseprimary.co.uk/policies-and-documents/",
          file_type: "pdf",
          source: "school",
          dates_found: ["2025 - 2026"],
          extracted_text: [
            "Pennine Academies Yorkshire Safeguarding & Child Protection Policy 2025 - 2026.",
            "P O L I C Y H I S T O R Y V e r s i o n : 2 0 2 5 D a t e w r i t t e n : S e p t e m b e r 2 0 2 5 R e v i e w d a t e : S e p t e m b e r 2 0 2 6.",
            "K C S I E 2 0 2 5. Working Together to Safeguard Children 2026.",
            "Designated Safeguarding Lead DSL and deputy DSLs. Safeguarding trustee.",
            "Report concerns to the DSL, children's social care, MASH, LADO and LSCP.",
            "Record keeping, confidentiality, information sharing, online safety, filtering and monitoring.",
            "Child-on-child abuse, sexual violence, sexual harassment, Prevent, FGM, county lines.",
            "Children missing from education, SEND, early help, induction, training and safer recruitment.",
          ].join(" "),
          word_count: 119000,
        },
      ],
    });

    expect(result.documents_found[0]).toMatchObject({
      evidence_url: "https://drive.google.com/file/d/current-safeguarding/view",
      currency_status: "current",
      policy_review: {
        date_found: "September 2026",
        review_due_at: "2026-09-01",
        reminder_due_at: "2026-06-01",
      },
    });
  });

  it("falls back to website document inventory when no rubric assessment exists", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: [
        {
          area: "ATTENDANCE_BEHAVIOUR",
          name: "Attendance Policy",
          priority: "critical",
        },
      ],
      websiteDocuments: [
        {
          url: "https://school.example/files/attendance-policy-2025.pdf",
          filename: "attendance-policy-2025.pdf",
          title: "Attendance Policy 2025",
          link_text: "Attendance Policy",
          found_on_page_url: "https://school.example/policies",
          file_type: "pdf",
          source: "school",
        },
      ],
    });

    expect(result.documents_missing).toHaveLength(0);
    expect(result.documents_found[0]).toMatchObject({
      matched_to: "Attendance Policy",
      source: "website_document",
      readiness_status: "present_unassessed",
      evidence_url: "https://school.example/files/attendance-policy-2025.pdf",
    });
  });

  it("uses the actual website SEND policy instead of SENCO or SEND report evidence", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: [
        {
          area: "INCLUSION",
          name: "SEND Policy",
          priority: "critical",
          websiteExpected: true,
        },
      ],
      websiteAssessments: [
        {
          requirement_key: "senco_details",
          requirement_name: "SENCO Name & Contact",
          status: "compliant",
          compliance_score: 100,
          evidence_urls: ["https://school.example/send"],
          gaps: [],
          recommendations: [],
        },
        {
          requirement_key: "send_information_report",
          requirement_name: "SEND Information Report",
          status: "compliant",
          compliance_score: 90,
          evidence_urls: ["https://school.example/send-information-report.pdf"],
          gaps: [],
          recommendations: [],
        },
      ],
      websiteDocuments: [
        {
          url: "https://school.example/grove-house-send-policy.pdf",
          filename: "Grove-House-SEND-Policy.pdf",
          title: "Grove House SEND Policy",
          link_text: "Grove House SEND Policy",
          found_on_page_url: "https://school.example/send",
          file_type: "pdf",
          source: "school",
          extracted_text: [
            "Date to be reviewed: December 2099",
            "Legal framework: Children and Families Act 2014, statutory Special Educational Needs and Disability (SEND) Code of Practice and Equality Act 2010.",
            "The SENCO responsibilities are defined.",
            "Our graduated approach follows Assess Plan Do Review.",
            "The 4 areas of need are Communication and Interaction, Cognition and Learning, Social, Emotional and Mental Health, and Sensory and/or Physical.",
            "We explain identifying pupils with SEND and assessing their needs.",
            "Parents and pupils are consulted.",
            "Education, Health and Care Plan arrangements are described.",
            "Admission and accessibility arrangements are included.",
            "Complaints about SEND provision are explained.",
          ].join(" "),
        },
      ],
    });

    expect(result.documents_missing).toHaveLength(0);
    expect(result.documents_found[0]).toMatchObject({
      matched_to: "SEND Policy",
      source: "website_document",
      evidence_url: "https://school.example/grove-house-send-policy.pdf",
      readiness_status: "ready",
      compliance_score: 100,
      quality_score: 100,
      action_required: false,
    });
  });

  it("flags a website SEND policy for review when the policy review date has passed", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: [
        {
          area: "INCLUSION",
          name: "SEND Policy",
          priority: "critical",
          websiteExpected: true,
        },
      ],
      websiteDocuments: [
        {
          url: "https://school.example/send-policy.pdf",
          filename: "SEND-Policy.pdf",
          title: "SEND Policy",
          link_text: "SEND Policy",
          found_on_page_url: "https://school.example/send",
          file_type: "pdf",
          source: "school",
          extracted_text: [
            "Date to be reviewed: March 2025",
            "Legal framework: Children and Families Act 2014, statutory Special Educational Needs and Disability (SEND) Code of Practice and Equality Act 2010.",
            "The SENCO responsibilities are defined.",
            "The graduated approach follows Assess Plan Do Review.",
            "Communication and Interaction, Cognition and Learning, Social, Emotional and Mental Health, and Sensory needs are covered.",
            "Identifying pupils with SEND and assessing their needs is explained.",
            "Parents and pupils are involved.",
            "Education, Health and Care Plan arrangements are included.",
            "Admission and accessibility arrangements are included.",
            "Complaints about SEND provision are explained.",
          ].join(" "),
        },
      ],
    });

    expect(result.documents_found[0]).toMatchObject({
      source: "website_document",
      readiness_status: "needs_review",
      compliance_score: 78,
      quality_score: 100,
      currency_status: "outdated",
      action_required: true,
    });
    expect(result.documents_found[0].gaps).toContain(
      "Review date appears to be March 2025, which has passed.",
    );
  });

  it("prefers a current website SEND policy over an older directly linked copy", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: [
        {
          area: "INCLUSION",
          name: "SEND Policy",
          priority: "critical",
          websiteExpected: true,
        },
      ],
      websiteDocuments: [
        {
          url: "https://school.example/send/old-send-policy.pdf",
          filename: "Grove-House-SEND-Policy.pdf",
          title: "Grove House SEND Policy",
          link_text: "Grove House SEND Policy",
          found_on_page_url: "https://school.example/send",
          file_type: "pdf",
          source: "school",
          extracted_text: [
            "Date to be reviewed: March 2025",
            "Children and Families Act 2014. Special Educational Needs and Disability Code of Practice. Equality Act 2010.",
            "SENCO responsibilities. Graduated approach Assess Plan Do Review.",
            "Communication and Interaction, Cognition and Learning, Social, Emotional and Mental Health, Sensory.",
            "Identifying pupils with SEND and assessing their needs.",
            "Parents and pupils. Education, Health and Care Plan. Admission and accessibility. Complaints about SEND provision.",
          ].join(" "),
        },
        {
          url: "https://drive.google.com/file/d/pay-send/view?usp=drive_web",
          filename: "view",
          title: "PAY SEND Policy.pdf",
          link_text: "PAY SEND Policy.pdf",
          found_on_page_url: "https://school.example/policies-and-documents",
          file_type: "pdf",
          source: "school",
          extracted_text: [
            "Date to be reviewed: September 2027",
            "Children and Families Act 2014. Special Educational Needs and Disability Code of Practice. Equality Act 2010.",
            "SENCO responsibilities. Graduated approach Assess Plan Do Review.",
            "Communication and Interaction, Cognition and Learning, Social, Emotional and Mental Health, Sensory.",
            "Identifying pupils with SEND and assessing their needs.",
            "Parents and pupils. Education, Health and Care Plan. Admission and accessibility. Complaints about SEND provision.",
          ].join(" "),
        },
      ],
    });

    expect(result.documents_found[0]).toMatchObject({
      name: "PAY SEND Policy.pdf",
      evidence_url: "https://drive.google.com/file/d/pay-send/view?usp=drive_web",
      readiness_status: "ready",
      currency_status: "current",
      action_required: false,
    });
  });

  it("uses Drive evidence only when website evidence is not available", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: safeguardingOnly,
      driveFiles: [
        {
          name: "Safeguarding Policy 2025.docx",
          folderPath: "Schoolgle > Ofsted Readiness > Safeguarding",
          webViewLink: "https://drive.example/safeguarding",
        },
      ],
    });

    expect(result.documents_missing).toHaveLength(0);
    expect(result.documents_found[0]).toMatchObject({
      source: "drive",
      readiness_status: "needs_publication",
      action_required: true,
      evidence_url: "https://drive.example/safeguarding",
    });
  });

  it("reports true gaps only when neither website nor Drive evidence exists", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: safeguardingOnly,
    });

    expect(result.documents_found).toHaveLength(0);
    expect(result.documents_missing).toMatchObject([
      {
        expected_name: "Safeguarding Policy",
        website_expected: true,
      },
    ]);
    expect(result.overall_coverage).toBe(0);
  });

  it("uses curriculum HTML pages as website evidence when the school publishes curriculum in pages not PDFs", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: [
        {
          area: "CURRICULUM_TEACHING",
          name: "Curriculum Overview",
          priority: "critical",
          websiteRequirementKeys: ["curriculum_content"],
          websiteExpected: true,
        },
        {
          area: "CURRICULUM_TEACHING",
          name: "Subject Policies",
          priority: "important",
        },
        {
          area: "CURRICULUM_TEACHING",
          name: "Phonics Programme",
          priority: "important",
          websiteRequirementKeys: ["phonics_reading"],
          websiteExpected: true,
        },
      ],
      websiteDocuments: [
        {
          url: "https://grovehouseprimary.co.uk/the-grove-house-curriculum/",
          filename: null,
          title:
            "The Grove House Curriculum - Grovehouse Primary School : Grovehouse Primary School",
          link_text: "The Grove House Curriculum",
          found_on_page_url:
            "https://grovehouseprimary.co.uk/the-grove-house-curriculum/",
          file_type: "html_page",
          source: "school",
          extracted_text:
            "The Grove House Curriculum Curriculum Content We have used the national curriculum to plan our curriculum from nursery through to year six to ensure that skills and knowledge are taught progressively.",
          word_count: 811,
        },
        {
          url: "https://grovehouseprimary.co.uk/reading/",
          filename: null,
          title: "Reading - Grovehouse Primary School : Grovehouse Primary School",
          link_text: "Reading",
          found_on_page_url: "https://grovehouseprimary.co.uk/reading/",
          file_type: "html_page",
          source: "school",
          extracted_text:
            "Reading Ensuring all children are able to read and enjoy reading is one of the key drivers of our curriculum. Children in Early Years and KS1 have early reading sessions.",
          word_count: 1200,
        },
        {
          url: "https://grovehouseprimary.co.uk/wp-content/uploads/safeguarding-policy.pdf",
          filename: "safeguarding-policy.pdf",
          title: "Safeguarding and Child Protection Policy",
          link_text: "Safeguarding and Child Protection Policy",
          found_on_page_url: "https://grovehouseprimary.co.uk/safeguarding/",
          file_type: "pdf",
          source: "school",
          extracted_text:
            "Safeguarding policy. This policy mentions curriculum access and skills in the context of keeping pupils safe, but it is not a subject curriculum page.",
          word_count: 4000,
        },
        {
          url: "https://grovehouseprimary.co.uk/wp-content/uploads/pupil-premium.pdf",
          filename: "pupil-premium.pdf",
          title: "This is our current Pupil Premium Information",
          link_text: "This is our current Pupil Premium Information",
          found_on_page_url: "https://grovehouseprimary.co.uk/pupil-premium/",
          file_type: "pdf",
          source: "school",
          extracted_text:
            "Pupil premium strategy mentions early reading support and phonics intervention as barriers for disadvantaged pupils, but it is not the phonics programme.",
          word_count: 3000,
        },
        {
          url: "https://paymat.org/wp-content/uploads/articles-of-association.pdf",
          filename: "articles-of-association.pdf",
          title: "Articles of Association and Memorandum of Association",
          link_text: "Articles of Association and Memorandum of Association",
          found_on_page_url: "https://paymat.org/governance/policies-and-statements",
          file_type: "pdf",
          source: "trust",
          extracted_text:
            "Trust governance document. The word Articles must not be treated as the Art curriculum subject.",
          word_count: 3000,
        },
        {
          url: "https://paymat.org/wp-content/uploads/data-protection-policy.pdf",
          filename: "data-protection-policy.pdf",
          title: "Data Protection Policy 2024-25 MATs (with policy history).pdf",
          link_text: "Data Protection Policy 2024-25 MATs (with policy history).pdf",
          found_on_page_url: "https://paymat.org/governance/policies-and-statements",
          file_type: "pdf",
          source: "trust",
          extracted_text:
            "Trust data protection policy with policy history. The word history is not evidence of the History curriculum.",
          word_count: 3000,
        },
        {
          url: "https://grovehouseprimary.co.uk/learning/phonics/",
          filename: null,
          title: "Phonics - Grovehouse Primary School : Grovehouse Primary School",
          link_text: "Phonics",
          found_on_page_url: "https://grovehouseprimary.co.uk/learning/phonics/",
          file_type: "html_page",
          source: "school",
          extracted_text:
            "Phonics Read Write Inc is a systematic synthetic phonics program used to teach children to be fluent readers. Assessment is used to identify where children need support.",
          word_count: 900,
        },
      ],
    });

    expect(result.documents_missing).toHaveLength(0);
    expect(result.documents_found).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          matched_to: "Curriculum Overview",
          source: "website_document",
          evidence_url:
            "https://grovehouseprimary.co.uk/the-grove-house-curriculum/",
        }),
        expect.objectContaining({
          matched_to: "Subject Policies",
          source: "website_document",
          evidence_url: "https://grovehouseprimary.co.uk/reading/",
        }),
        expect.objectContaining({
          matched_to: "Phonics Programme",
          source: "website_document",
          evidence_url: "https://grovehouseprimary.co.uk/learning/phonics/",
        }),
      ]),
    );
    expect(result.coverage_by_area["Curriculum and Teaching"]).toMatchObject({
      found: 3,
      expected: 3,
      percentage: 100,
    });
    expect(
      result.documents_found.map((document) => document.name),
    ).not.toContain("Safeguarding and Child Protection Policy");
    expect(
      result.documents_found.map((document) => document.name),
    ).not.toContain("This is our current Pupil Premium Information");
    expect(
      result.documents_found.map((document) => document.name),
    ).not.toContain("Articles of Association and Memorandum of Association");
    expect(
      result.documents_found.map((document) => document.name),
    ).not.toContain("Data Protection Policy 2024-25 MATs (with policy history).pdf");
  });

  it("does not treat generic trust policy PDFs as subject curriculum evidence", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: [
        {
          area: "CURRICULUM_TEACHING",
          name: "Subject Policies",
          priority: "important",
          websiteExpected: true,
        },
      ],
      websiteDocuments: [
        {
          url: "https://paymat.org/wp-content/uploads/data-protection-policy.pdf",
          filename: "data-protection-policy.pdf",
          title: "Data Protection Policy 2024-25 MATs (with policy history).pdf",
          link_text: "Data Protection Policy 2024-25 MATs (with policy history).pdf",
          found_on_page_url: "https://paymat.org/governance/policies-and-statements",
          file_type: "pdf",
          source: "trust",
          extracted_text:
            "Trust data protection policy with policy history. It mentions curriculum only in the context of data protection responsibilities.",
          word_count: 3000,
        },
      ],
    });

    expect(result.documents_found).toHaveLength(0);
    expect(result.documents_missing).toEqual([
      expect.objectContaining({
        expected_name: "Subject Policies",
        website_expected: true,
      }),
    ]);
  });

  it("does not treat a general reading curriculum page as the phonics programme", () => {
    const result = resolveOfstedDocumentEvidence({
      expectedDocuments: [
        {
          area: "CURRICULUM_TEACHING",
          name: "Phonics Programme",
          priority: "important",
          websiteRequirementKeys: ["phonics_reading"],
          websiteExpected: true,
        },
      ],
      websiteDocuments: [
        {
          url: "https://grovehouseprimary.co.uk/reading/",
          filename: null,
          title: "Reading - Grovehouse Primary School : Grovehouse Primary School",
          link_text: "Reading",
          found_on_page_url: "https://grovehouseprimary.co.uk/reading/",
          file_type: "html_page",
          source: "school",
          extracted_text:
            "Reading is a key driver of our curriculum. Children read widely across all year groups and staff promote a love of books.",
          word_count: 900,
        },
      ],
    });

    expect(result.documents_found).toHaveLength(0);
    expect(result.documents_missing).toEqual([
      expect.objectContaining({
        expected_name: "Phonics Programme",
        website_expected: true,
      }),
    ]);
  });
});
