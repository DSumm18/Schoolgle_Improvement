import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { pupilUploadTemplate } from "@/lib/pupil-pass";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Local template saving is only available in local development." },
      { status: 403 },
    );
  }

  const filename = "schoolgle-pupil-upload-template.csv";
  const downloadsDir = join(homedir(), "Downloads");
  const filePath = join(downloadsDir, filename);

  await mkdir(downloadsDir, { recursive: true });
  await writeFile(filePath, pupilUploadTemplate(), "utf8");

  return NextResponse.json({ filename, path: filePath });
}
