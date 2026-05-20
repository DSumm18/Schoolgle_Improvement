import {
  CONNECTOR_BRAND,
  CONNECTOR_GOOGLE_SCOPE,
  CONNECTOR_SECURITY_COPY,
  SCHOOLGLE_CONNECTOR_FOLDERS,
  POLICY_GENERATED_DRAFTS_FOLDER,
  getConnectorFoldersForAppKeys,
  getAppConnectionScope,
  getConnectorFolderLabels,
  getConnectorFolderStructureText,
  resolveConnectorAppKeysFromEntitlements,
  isConnectorArchivePath,
  isConnectorGeneratedDraftPath,
  getSafeConnectorFolderTarget,
} from "./schoolgle-connector";

describe("schoolgle connector product model", () => {
  it("brands the school-wide storage bridge as Schoolgle Connector", () => {
    expect(CONNECTOR_BRAND.name).toBe("Schoolgle Connector");
    expect(CONNECTOR_BRAND.homeFolderName).toBe("Schoolgle");
    expect(CONNECTOR_BRAND.supportIdentity).toBe("connector@schoolgle.co.uk");
  });

  it("defines app-specific folders under one Schoolgle home folder", () => {
    expect(getConnectorFolderLabels()).toEqual([
      "Ofsted Readiness",
      "SIAMS Readiness",
      "Trust Assessor",
      "MIS Exports",
      "Policies",
      "Compliance",
      "Finance",
      "Estates",
    ]);

    expect(SCHOOLGLE_CONNECTOR_FOLDERS).toContainEqual(
      expect.objectContaining({
        name: "Ofsted Readiness",
        appKey: "ofsted-readiness",
      }),
    );
  });

  it("filters connector folders to the apps the school is entitled to", () => {
    expect(
      getConnectorFoldersForAppKeys(["ofsted-readiness", "estates", "unknown"])
        .map((folder) => folder.name),
    ).toEqual(["Ofsted Readiness", "Estates"]);

    expect(getConnectorFoldersForAppKeys([])).toEqual([]);
  });

  it("resolves app and module entitlements to connector app keys", () => {
    expect(
      resolveConnectorAppKeysFromEntitlements([
        "toolbox",
        "ofsted-readiness",
        "finance",
        "ofsted-readiness",
      ]),
    ).toEqual(["ofsted-readiness", "finance"]);

    expect(resolveConnectorAppKeysFromEntitlements(["improvement"])).toEqual([
      "ofsted-readiness",
      "siams-readiness",
      "trust-assessor",
    ]);
    expect(resolveConnectorAppKeysFromEntitlements(["estates-compliance"])).toEqual([
      "estates",
    ]);
    expect(resolveConnectorAppKeysFromEntitlements(["compliance"])).toEqual([
      "policy-manager",
      "compliance",
    ]);
  });

  it("builds folder structure text for only selected app keys", () => {
    const structure = getConnectorFolderStructureText("Grove House", [
      "ofsted-readiness",
    ]);

    expect(structure).toContain("Grove House");
    expect(structure).toContain("Ofsted Readiness");
    expect(structure).toContain("Website and Statutory Info");
    expect(structure).not.toContain("SIAMS Readiness");
    expect(structure).not.toContain("Estates");
  });

  it("defines focused app connection scopes without making Schoolgle the document source", () => {
    const policyScope = getAppConnectionScope("policy-manager");
    const ofstedScope = getAppConnectionScope("ofsted-readiness");

    expect(policyScope?.primaryFolder).toBe("Policies");
    expect(policyScope?.includedFolders).toContain("Policies/Current Policies");
    expect(policyScope?.includedFolders).toContain(
      `Policies/${POLICY_GENERATED_DRAFTS_FOLDER}`,
    );
    expect(policyScope?.sourceOfTruth).toContain("canonical policy documents");
    expect(policyScope?.databaseStores).toContain("Policy register metadata");
    expect(ofstedScope?.consumesFrom).toContain("Policy Manager summaries");
    expect(getAppConnectionScope("unknown")).toBeNull();
  });

  it("marks archive folders as excluded from normal scans", () => {
    expect(isConnectorArchivePath("Policies/_Archive - Do Not Scan")).toBe(true);
    expect(isConnectorArchivePath("Policies/Archived or Superseded")).toBe(true);
    expect(isConnectorArchivePath("Policies/Current Policies")).toBe(false);
  });

  it("marks generated policy drafts separately from current source policies", () => {
    expect(
      isConnectorGeneratedDraftPath(`Policies/${POLICY_GENERATED_DRAFTS_FOLDER}`),
    ).toBe(true);
    expect(isConnectorGeneratedDraftPath("Policies/Current Policies")).toBe(false);
  });

  it("uses OAuth-first security wording instead of public link sharing", () => {
    const combinedCopy = CONNECTOR_SECURITY_COPY.join(" ");

    expect(combinedCopy).toContain("dedicated Schoolgle folder");
    expect(combinedCopy).toContain("OAuth");
    expect(combinedCopy).not.toContain("Anyone with the link");
  });

  it("requests folder creation and enhanced scanning scopes", () => {
    expect(CONNECTOR_GOOGLE_SCOPE).toContain(
      "https://www.googleapis.com/auth/drive.file",
    );
    expect(CONNECTOR_GOOGLE_SCOPE).toContain(
      "https://www.googleapis.com/auth/drive.readonly",
    );
  });

  it("does not allow OAuth fallback to whole Drive root when no Schoolgle folder is found", () => {
    expect(getSafeConnectorFolderTarget(null)).toBeNull();
    expect(
      getSafeConnectorFolderTarget({
        id: "root",
        name: "Entire Google Drive",
      }),
    ).toBeNull();
    expect(
      getSafeConnectorFolderTarget({
        id: "folder-123",
        name: "Schoolgle",
      }),
    ).toEqual({ id: "folder-123", name: "Schoolgle" });
  });
});
