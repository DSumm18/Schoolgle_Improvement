import { describe, expect, it } from "vitest";
import {
  buildPassIdentity,
  createPupilAccessToken,
  decryptPupilAccessToken,
  encryptPupilAccessToken,
  hashPupilAccessToken,
  parsePupilUploadCsv,
  pupilUploadTemplate,
} from "./pupil-pass";

describe("pupil pass utilities", () => {
  it("parses pupil upload rows with pass preferences", () => {
    const parsed = parsePupilUploadCsv(
      [
        "pupil_id,source_pupil_ref,first_name,last_name,year_group,current_class,send_status,ehcp,pass_colour,pass_animal",
        "P1,A802200106001,Ava,Adams,Year 4,4A,K,false,Purple,Panda",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.pupils[0]).toMatchObject({
      pupil_id: "P1",
      source_pupil_ref: "A802200106001",
      first_name: "Ava",
      year_group: "4",
      current_class: "4A",
      send_status: "K",
      pass_colour: "Purple",
      pass_animal: "Panda",
    });
  });

  it("parses templates with an explainer row above field names", () => {
    const parsed = parsePupilUploadCsv(
      [
        "Schoolgle ID,Source pupil ref,First name,Last name,Year group,Current class,Pass colour,Pass animal",
        "pupil_id,source_pupil_ref,first_name,last_name,year_group,current_class,pass_colour,pass_animal",
        "P1,A802200106001,Ava,Adams,Year 4,4A,Purple,Panda",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.pupils[0]).toMatchObject({
      pupil_id: "P1",
      source_pupil_ref: "A802200106001",
      first_name: "Ava",
      pass_colour: "Purple",
      pass_animal: "Panda",
    });
  });

  it("parses completed styled Excel template rows with guidance above the header", () => {
    const parsed = parsePupilUploadCsv(
      [
        "Schoolgle Pupil Upload Template",
        "Rows 1-3 are guidance, row 4 explains the columns, row 5 is the exact import header. Start real pupil data on row 6.",
        "Tip: keep source_pupil_ref aligned with MIS/UPN for results linking.",
        "Schoolgle ID,Source pupil ref,First name,Last name,Year group,Current class,Pass colour,Pass animal",
        "pupil_id,source_pupil_ref,first_name,last_name,year_group,current_class,pass_colour,pass_animal",
        "P2,A802200106002,Mia,Bell,Year 4,4A,Pink,Lion",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.pupils[0]).toMatchObject({
      pupil_id: "P2",
      source_pupil_ref: "A802200106002",
      first_name: "Mia",
      last_name: "Bell",
      current_class: "4A",
      pass_colour: "Pink",
      pass_animal: "Lion",
    });
  });

  it("normalises messy pupil import fields", () => {
    const parsed = parsePupilUploadCsv(
      [
        "pupil_id,upn,first_name,last_name,year_group,current_class,gender,send_status",
        "P1, a802200106003 ,  lola ,O'NEILL, year 4 , 4 b , female, sen support",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.pupils[0]).toMatchObject({
      source_pupil_ref: "A802200106003",
      first_name: "Lola",
      last_name: "O'Neill",
      year_group: "4",
      current_class: "4B",
      gender: "F",
      send_status: "K",
    });
  });

  it("normalises optional date of birth and Arbor sex headers", () => {
    const parsed = parsePupilUploadCsv(
      [
        "pupil_id,source_pupil_ref,first_name,last_name,year_group,current_class,Sex,Date of Birth",
        "P1,A802200106003,Lola,O'Neill,year 4,4 b,Female,15/09/2017",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.pupils[0]).toMatchObject({
      gender: "F",
      date_of_birth: "2017-09-15",
    });
  });

  it("parses Arbor pupil exports with year group and courses/classes headers", () => {
    const parsed = parsePupilUploadCsv(
      [
        '"Globally Unique Student ID","Arbor Student ID","Legal First Name","Legal Last Name","Sex","Year group(s) this academic year","Date of Birth","Courses/classes","SEN status"',
        "G001,ARB001,Ava,Adams,Female,Year 4,2017-09-15,4A,SEN Support",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.pupils[0]).toMatchObject({
      pupil_id: "ARB001",
      source_pupil_ref: "G001",
      first_name: "Ava",
      last_name: "Adams",
      year_group: "4",
      current_class: "4A",
      gender: "F",
      date_of_birth: "2017-09-15",
      send_status: "K",
    });
  });

  it("requires the core named-roll columns", () => {
    const parsed = parsePupilUploadCsv("first_name,last_name\nAva,Adams");
    expect(parsed.errors[0]).toContain("pupil_id");
    expect(parsed.errors[0]).toContain("source_pupil_ref");
    expect(parsed.errors[0]).toContain("year_group");
  });

  it("uses year group as the class fallback when Arbor leaves courses/classes blank", () => {
    const parsed = parsePupilUploadCsv(
      [
        "pupil_id,source_pupil_ref,first_name,last_name,year_group,current_class",
        "P1,A001,Ava,Adams,Year 4,",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.pupils[0]).toMatchObject({
      year_group: "4",
      current_class: "4",
    });
  });

  it("selects the registration class from noisy Arbor courses/classes values", () => {
    const parsed = parsePupilUploadCsv(
      [
        "pupil_id,source_pupil_ref,first_name,last_name,year_group,current_class",
        'P1,A001,Ava,Adams,Year 6,"Year 6: 6 Rauf And Year 6"',
        'P2,A002,Ben,Brown,Year N2,"N Butterworth, N Butterworth: Monday Am, N Butterworth: Monday Pm"',
        'P3,A003,Cara,Cole,Year 6,"Year 6 And Year 6: 6 Howe"',
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.pupils.map((pupil) => pupil.current_class)).toEqual(["6 Rauf", "N Butterworth", "6 Howe"]);
  });

  it("publishes a Settings template with an explicit CTF-compatible source reference", () => {
    const template = pupilUploadTemplate();

    expect(template).toContain("source_pupil_ref");
    expect(template).toContain("MIS/UPN");
    expect(template).toContain("A802200106001");
    expect(template).not.toContain("PUP001,Ava");
  });

  it("creates recognisable unique pass identities", () => {
    const used = new Set<string>();
    const first = buildPassIdentity(
      { pupil_id: "P1", pass_colour: "Purple", pass_animal: "Panda", pass_badge: null },
      used,
    );
    const second = buildPassIdentity(
      { pupil_id: "P2", pass_colour: "Purple", pass_animal: "Panda", pass_badge: null },
      used,
    );

    expect(first.codename).toBe("Purple Panda");
    expect(second.codename).not.toBe(first.codename);
  });

  it("hashes and encrypts access tokens", () => {
    const token = createPupilAccessToken();
    const hash = hashPupilAccessToken(token);
    const encrypted = encryptPupilAccessToken(token);

    expect(hash).not.toBe(token);
    expect(encrypted).not.toContain(token);
    expect(decryptPupilAccessToken(encrypted)).toBe(token);
  });
});
