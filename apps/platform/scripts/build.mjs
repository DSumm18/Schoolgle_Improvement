import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const suppressedWarnings = [
  "[baseline-browser-mapping] The data in this module is over two months old.",
];

const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const child = spawn(process.execPath, [nextCli, "build", "--webpack"], {
  env: {
    ...process.env,
    BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA: "true",
    BROWSERSLIST_IGNORE_OLD_DATA: "true",
  },
  shell: false,
  stdio: ["inherit", "pipe", "pipe"],
});

function pipeFiltered(stream, target) {
  let buffer = "";

  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!suppressedWarnings.some((warning) => line.includes(warning))) {
        target.write(`${line}\n`);
      }
    }
  });

  stream.on("end", () => {
    if (
      buffer &&
      !suppressedWarnings.some((warning) => buffer.includes(warning))
    ) {
      target.write(buffer);
    }
  });
}

pipeFiltered(child.stdout, process.stdout);
pipeFiltered(child.stderr, process.stderr);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
