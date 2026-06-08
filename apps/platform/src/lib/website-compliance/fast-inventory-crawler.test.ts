import { describe, expect, it } from "vitest";
import {
  __fastInventoryCrawlerTestables,
} from "./fast-inventory-crawler";

describe("fast inventory crawler Google Drive policy folders", () => {
  it("expands an embedded Google Drive folder listing into file documents", () => {
    const folderUrl =
      "https://drive.google.com/embeddedfolderview?id=folder-123#grid";
    const folderHtml = `
      <div class="flip-entry">
        <a href="https://drive.google.com/file/d/file-send/view?usp=drive_web" target="_blank">
          <div class="flip-entry-title">PAY SEND Policy.pdf</div>
        </a>
      </div>
      <div class="flip-entry">
        <a href="https://drive.google.com/file/d/file-safe/view?usp=drive_web" target="_blank">
          <div class="flip-entry-title">Safeguarding &amp; Child Protection Policy.pdf</div>
        </a>
      </div>
    `;

    const documents =
      __fastInventoryCrawlerTestables.extractGoogleDriveFolderDocuments(
        folderHtml,
        folderUrl,
        "https://grovehouseprimary.co.uk/policies-and-documents/",
        "school",
      );

    expect(documents).toEqual([
      {
        url: "https://drive.google.com/file/d/file-send/view?usp=drive_web",
        foundOnPage: "https://grovehouseprimary.co.uk/policies-and-documents/",
        linkText: "PAY SEND Policy.pdf",
        source: "school",
      },
      {
        url: "https://drive.google.com/file/d/file-safe/view?usp=drive_web",
        foundOnPage: "https://grovehouseprimary.co.uk/policies-and-documents/",
        linkText: "Safeguarding & Child Protection Policy.pdf",
        source: "school",
      },
    ]);
  });

  it("recognises both embeddedfolderview and drive folder URLs as expandable folders", () => {
    const { isGoogleDriveFolderUrl, toEmbeddedGoogleDriveFolderUrl } =
      __fastInventoryCrawlerTestables;

    expect(
      isGoogleDriveFolderUrl(
        "https://drive.google.com/embeddedfolderview?id=folder-123#grid",
      ),
    ).toBe(true);
    expect(
      isGoogleDriveFolderUrl(
        "https://drive.google.com/drive/folders/folder-123?usp=sharing",
      ),
    ).toBe(true);
    expect(
      isGoogleDriveFolderUrl(
        "https://drive.google.com/file/d/file-send/view?usp=drive_web",
      ),
    ).toBe(false);
    expect(
      toEmbeddedGoogleDriveFolderUrl(
        "https://drive.google.com/drive/folders/folder-123?usp=sharing",
      ),
    ).toBe(
      "https://drive.google.com/embeddedfolderview?id=folder-123#grid",
    );
  });

  it("detects Google Drive PDFs served as octet-stream downloads", () => {
    expect(
      __fastInventoryCrawlerTestables.detectDownloadedDocumentFileType(
        "https://drive.google.com/file/d/file-send/view?usp=drive_web",
        "application/octet-stream",
        Buffer.from("%PDF-1.7\n"),
        "PAY SEND Policy.pdf",
      ),
    ).toBe("pdf");
  });

  it("prioritises curriculum and subject links discovered from navigation", () => {
    const sorted = __fastInventoryCrawlerTestables.sortPageQueueByPriority([
      "https://grovehouseprimary.co.uk/contact-us/",
      "https://grovehouseprimary.co.uk/reading/",
      "https://grovehouseprimary.co.uk/learning/phonics/",
      "https://grovehouseprimary.co.uk/random-gallery/",
      "https://grovehouseprimary.co.uk/policies-and-documents/",
    ]);

    expect(sorted.slice(0, 3)).toEqual([
      "https://grovehouseprimary.co.uk/policies-and-documents/",
      "https://grovehouseprimary.co.uk/learning/phonics/",
      "https://grovehouseprimary.co.uk/reading/",
    ]);
  });

  it("detects WordPress soft 404 pages so seed guesses do not become evidence", () => {
    expect(
      __fastInventoryCrawlerTestables.isSoftNotFoundPage({
        url: "https://grovehouseprimary.co.uk/curriculum",
        title: "Page not found - Grovehouse Primary School : Grovehouse Primary School",
        content:
          "Page not found Grove House Primary School Staff Login Our School Meet the Team The Grove House Curriculum Reading Phonics",
        status: 200,
      }),
    ).toBe(true);

    expect(
      __fastInventoryCrawlerTestables.isSoftNotFoundPage({
        url: "https://grovehouseprimary.co.uk/learning/phonics/",
        title: "Phonics - Grovehouse Primary School : Grovehouse Primary School",
        content:
          "Phonics Read Write Inc is a systematic synthetic phonics programme used across the school.",
        status: 200,
      }),
    ).toBe(false);
  });
});
