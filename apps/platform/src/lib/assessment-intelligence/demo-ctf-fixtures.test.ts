import { describe, expect, it } from "vitest";
import { parseAssessmentXML } from "@/lib/ctf-xml-parser";
import { createSyntheticCtfFixture } from "./demo-ctf-fixtures";

const SAMPLE_CTF = `<?xml version="1.0" encoding="UTF-8"?>
<CTfile version="3">
  <Header>
    <DocumentName>Grove House Primary live export</DocumentName>
    <DateTime>2026-05-01T09:12:00</DateTime>
    <SourceSchool>
      <LEA>380</LEA>
      <Estab>2093</Estab>
      <URN>107258</URN>
      <SchoolName>Grove House Primary School</SchoolName>
    </SourceSchool>
  </Header>
  <CTFpupilData>
    <Pupil>
      <UPN>A123456789001</UPN>
      <FormerUPN>A123456789000</FormerUPN>
      <BasicDetails>
        <LegalSurname>Actualone</LegalSurname>
        <LegalForename>Aisha</LegalForename>
        <PreferredForename>Aisha</PreferredForename>
        <DOB>2014-10-02</DOB>
        <Gender>F</Gender>
        <NCyearActual>6</NCyearActual>
        <Ethnicity>WBRI</Ethnicity>
        <FirstLanguage>ENG</FirstLanguage>
      </BasicDetails>
      <Address>
        <AddressLine1>12 Real Street</AddressLine1>
        <Postcode>BD2 4ED</Postcode>
      </Address>
      <SEN>
        <SENprovision>K</SENprovision>
      </SEN>
      <StageAssessments>
        <KeyStage>
          <Stage>KS2</Stage>
          <StageAssessment>
            <Subject>ENG</Subject>
            <Component>REA</Component>
            <Method>TA</Method>
            <Result>EXS</Result>
            <Year>2025</Year>
          </StageAssessment>
          <StageAssessment>
            <Subject>ENG</Subject>
            <Component>WRI</Component>
            <Method>TA</Method>
            <Result>GDS</Result>
            <Year>2025</Year>
          </StageAssessment>
        </KeyStage>
      </StageAssessments>
    </Pupil>
    <Pupil>
      <UPN>A123456789002</UPN>
      <BasicDetails>
        <LegalSurname>Actualtwo</LegalSurname>
        <LegalForename>Ben</LegalForename>
        <DOB>2014-11-12</DOB>
        <Gender>M</Gender>
        <NCyearActual>6</NCyearActual>
        <Ethnicity>PAKI</Ethnicity>
        <FirstLanguage>URD</FirstLanguage>
      </BasicDetails>
      <StageAssessments>
        <KeyStage>
          <Stage>KS2</Stage>
          <StageAssessment>
            <Subject>MAT</Subject>
            <Component>MAT</Component>
            <Method>TA</Method>
            <Result>WTS</Result>
            <Year>2025</Year>
          </StageAssessment>
        </KeyStage>
      </StageAssessments>
    </Pupil>
  </CTFpupilData>
</CTfile>`;

describe("createSyntheticCtfFixture", () => {
  it("removes real pupil and school identifiers while preserving parseable assessment patterns", () => {
    const originalParsed = parseAssessmentXML(Buffer.from(SAMPLE_CTF), "org-demo");

    const result = createSyntheticCtfFixture(SAMPLE_CTF, {
      fixtureId: "rochdale-demo-primary",
      demoSchoolName: "Rochdale Demo Primary School",
      demoSchoolUrn: "149001",
      demoLea: "354",
      demoEstab: "9001",
      academicYearStart: 2025,
    });

    const sanitisedParsed = parseAssessmentXML(Buffer.from(result.xml), "org-demo");

    expect(sanitisedParsed.records).toHaveLength(originalParsed.records.length);
    expect(sanitisedParsed.records.map((record) => record.subject).sort()).toEqual(
      originalParsed.records.map((record) => record.subject).sort(),
    );
    expect(sanitisedParsed.records.map((record) => record.attainment_level).sort()).toEqual(
      originalParsed.records.map((record) => record.attainment_level).sort(),
    );

    expect(result.xml).toContain("Rochdale Demo Primary School");
    expect(result.xml).toContain("149001");
    expect(result.xml).not.toContain("Grove House");
    expect(result.xml).not.toContain("107258");
    expect(result.xml).not.toContain("Aisha");
    expect(result.xml).not.toContain("Ben");
    expect(result.xml).not.toContain("Actualone");
    expect(result.xml).not.toContain("Actualtwo");
    expect(result.xml).not.toContain("A123456789001");
    expect(result.xml).not.toContain("2014-10-02");
    expect(result.xml).not.toContain("2014-11-12");
    expect(result.xml).not.toContain("BD2 4ED");
    expect(result.xml).not.toContain("12 Real Street");
    expect(result.manifest.isDemo).toBe(true);
    expect(result.manifest.safetyModel).toBe("synthetic_twin");
  });

  it("regenerates sensitive row-level characteristics instead of carrying exact values", () => {
    const result = createSyntheticCtfFixture(SAMPLE_CTF, {
      fixtureId: "rochdale-demo-primary",
      demoSchoolName: "Rochdale Demo Primary School",
      demoSchoolUrn: "149001",
      demoLea: "354",
      demoEstab: "9001",
      academicYearStart: 2025,
    });

    expect(result.xml).not.toContain("<Ethnicity>PAKI</Ethnicity>");
    expect(result.xml).not.toContain("<FirstLanguage>URD</FirstLanguage>");
    expect(result.xml).toContain("Schoolgle synthetic demo data");
    expect(result.manifest.pupilCount).toBe(2);
  });
});
