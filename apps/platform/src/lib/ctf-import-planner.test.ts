import { describe, expect, it } from "vitest";
import { parseAssessmentXML } from "@/lib/ctf-xml-parser";
import { buildCtfImportPlan, inferCtfAssessmentType } from "./ctf-import-planner";

const FSP_CTF = `<?xml version="1.0" encoding="UTF-8"?>
<CTfile version="3">
  <Header><DateTime>2026-06-22T15:00:00</DateTime></Header>
  <CTFpupilData>
    <Pupil>
      <UPN>A123456789001</UPN>
      <BasicDetails><NCyearActual>R</NCyearActual></BasicDetails>
      <StageAssessments>
        <KeyStage>
          <Stage>EYF</Stage>
          <StageAssessment>
            <Subject>COM</Subject><Component>E01</Component><Method>FA</Method>
            <Result>2</Result><ResultQualifier>FD</ResultQualifier><Year>2026</Year>
          </StageAssessment>
        </KeyStage>
      </StageAssessments>
    </Pupil>
  </CTFpupilData>
</CTfile>`;

const KS2_CTF = `<?xml version="1.0" encoding="UTF-8"?>
<CTfile version="3">
  <Header><DateTime>2025-07-01T12:00:00</DateTime></Header>
  <CTFpupilData>
    <Pupil>
      <UPN>A123456789002</UPN>
      <BasicDetails><NCyearActual>6</NCyearActual></BasicDetails>
      <StageAssessments>
        <KeyStage>
          <Stage>KS2</Stage>
          <StageAssessment>
            <Subject>ENG</Subject><Component>REA</Component><Method>TA</Method>
            <Result>EXS</Result><Year>2025</Year>
          </StageAssessment>
        </KeyStage>
      </StageAssessments>
    </Pupil>
  </CTFpupilData>
</CTfile>`;

const PHONICS_CTF = `<?xml version="1.0" encoding="UTF-8"?>
<CTfile version="3">
  <Header><DateTime>2024-06-20T09:00:00</DateTime></Header>
  <CTFpupilData>
    <Pupil>
      <UPN>A123456789003</UPN>
      <BasicDetails><NCyearActual>1</NCyearActual></BasicDetails>
      <StageAssessments>
        <KeyStage>
          <Stage>KS1</Stage>
          <StageAssessment>
            <Subject>PHO</Subject><Component>PHO</Component><Method>TA</Method>
            <Result>34</Result><ResultQualifier>NM</ResultQualifier><Year>2024</Year>
          </StageAssessment>
        </KeyStage>
      </StageAssessments>
    </Pupil>
  </CTFpupilData>
</CTfile>`;

describe("ctf import planner", () => {
  it("infers statutory assessment type from CTF content and filename", () => {
    expect(inferCtfAssessmentType("3805204_FSP_380LLLL_001.xml", parseAssessmentXML(Buffer.from(FSP_CTF), "org"))).toBe("foundation");
    expect(inferCtfAssessmentType("unknown.xml", parseAssessmentXML(Buffer.from(KS2_CTF), "org"))).toBe("ks2");
    expect(inferCtfAssessmentType("anything.xml", parseAssessmentXML(Buffer.from(PHONICS_CTF), "org"))).toBe("phonics");
  });

  it("groups duplicate uploaded CTF files while keeping distinct years importable", () => {
    const firstFsp = parseAssessmentXML(Buffer.from(FSP_CTF), "org");
    const duplicateFsp = parseAssessmentXML(Buffer.from(FSP_CTF), "org");
    const ks2 = parseAssessmentXML(Buffer.from(KS2_CTF), "org");

    const plan = buildCtfImportPlan([
      { fileName: "first-fsp.xml", parsed: firstFsp },
      { fileName: "duplicate-fsp.xml", parsed: duplicateFsp },
      { fileName: "ks2.xml", parsed: ks2 },
    ]);

    expect(plan.files).toEqual([
      expect.objectContaining({ fileName: "first-fsp.xml", assessmentType: "foundation", duplicateOf: null, shouldImport: true }),
      expect.objectContaining({ fileName: "duplicate-fsp.xml", assessmentType: "foundation", duplicateOf: "first-fsp.xml", shouldImport: false }),
      expect.objectContaining({ fileName: "ks2.xml", assessmentType: "ks2", duplicateOf: null, shouldImport: true }),
    ]);
    expect(plan.summary.totalFiles).toBe(3);
    expect(plan.summary.importableFiles).toBe(2);
    expect(plan.summary.duplicateFiles).toBe(1);
  });
});
