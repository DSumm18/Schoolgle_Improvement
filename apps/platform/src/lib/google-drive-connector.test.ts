import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureConnectorFolderStructure } from "./google-drive-connector";

describe("google drive connector folder provisioning", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates only folders for the requested connector app keys", async () => {
    const createdFolderNames: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === "POST") {
          const body = JSON.parse(String(init.body));
          createdFolderNames.push(body.name);
          return new Response(
            JSON.stringify({
              id: `${body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-id`,
              name: body.name,
              mimeType: "application/vnd.google-apps.folder",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        expect(String(url)).toContain("drive/v3/files");
        return new Response(JSON.stringify({ files: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    await ensureConnectorFolderStructure("token", "schoolgle-root", {
      appKeys: ["ofsted-readiness"],
    });

    expect(createdFolderNames).toContain("Ofsted Readiness");
    expect(createdFolderNames).toContain("00 Inbox - To Sort");
    expect(createdFolderNames).toContain("Leadership and Governance");
    expect(createdFolderNames).not.toContain("SIAMS Readiness");
    expect(createdFolderNames).not.toContain("Estates");
  });
});
