import { describe, expect, it } from "vitest";
import {
  buildPassIdentity,
  createPupilAccessToken,
  decryptPupilAccessToken,
  encryptPupilAccessToken,
  hashPupilAccessToken,
  parsePupilUploadCsv,
} from "./pupil-pass";

describe("pupil pass utilities", () => {
  it("parses pupil upload rows with pass preferences", () => {
    const parsed = parsePupilUploadCsv(
      [
        "pupil_id,first_name,last_name,year_group,current_class,send_status,ehcp,pass_colour,pass_animal",
        "P1,Ava,Adams,Year 4,4A,K,false,Purple,Panda",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.pupils[0]).toMatchObject({
      pupil_id: "P1",
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
        "Unique ID,First name,Last name,Year group,Current class,Pass colour,Pass animal",
        "pupil_id,first_name,last_name,year_group,current_class,pass_colour,pass_animal",
        "P1,Ava,Adams,Year 4,4A,Purple,Panda",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.pupils[0]).toMatchObject({
      pupil_id: "P1",
      first_name: "Ava",
      pass_colour: "Purple",
      pass_animal: "Panda",
    });
  });

  it("normalises messy pupil import fields", () => {
    const parsed = parsePupilUploadCsv(
      [
        "pupil_id,first_name,last_name,year_group,current_class,gender,send_status",
        "P1,  lola ,O'NEILL, year 4 , 4 b , female, sen support",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.pupils[0]).toMatchObject({
      first_name: "Lola",
      last_name: "O'Neill",
      year_group: "4",
      current_class: "4B",
      gender: "F",
      send_status: "K",
    });
  });

  it("requires the core named-roll columns", () => {
    const parsed = parsePupilUploadCsv("first_name,last_name\nAva,Adams");
    expect(parsed.errors[0]).toContain("pupil_id");
    expect(parsed.errors[0]).toContain("current_class");
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
