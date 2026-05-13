import { matchPolicyFilesToRequirements } from "./policy-matcher";

describe("policy matcher", () => {
  it("matches differently named Drive files to maintained primary requirements", () => {
    const result = matchPolicyFilesToRequirements({
      context: "maintained_primary",
      files: [
        {
          id: "file-1",
          name: "RSP Child Protection Policy 2025.pdf",
          folderPath: "Policies/Current Policies",
        },
        {
          id: "file-2",
          name: "UK GDPR and Data Protection - Rawdon St Peter.docx",
          folderPath: "Policies/Current Policies",
        },
      ],
    });

    const safeguarding = result.requirements.find(
      (match) => match.requirement.id === "child-protection-safeguarding",
    );
    const dataProtection = result.requirements.find(
      (match) => match.requirement.id === "data-protection-policy",
    );

    expect(safeguarding?.status).toBe("matched");
    expect(safeguarding?.matchedFile?.id).toBe("file-1");
    expect(dataProtection?.status).toBe("matched");
    expect(dataProtection?.matchedFile?.id).toBe("file-2");
    expect(result.summary.matched).toBe(2);
    expect(result.summary.missing).toBeGreaterThan(0);
  });

  it("leaves unrelated files as custom school policies", () => {
    const result = matchPolicyFilesToRequirements({
      context: "maintained_primary",
      files: [
        {
          id: "file-custom",
          name: "Bicycle Storage Policy.pdf",
          folderPath: "Policies/Current Policies",
        },
      ],
    });

    expect(result.unmatchedFiles).toEqual([
      expect.objectContaining({
        id: "file-custom",
        suggestedCategory: "school_custom",
      }),
    ]);
  });
});
