import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function readJsonl(filePath) {
  const source = await readFile(filePath, "utf8");
  const entries = [];
  const errors = [];

  source.split(/\r?\n/).forEach((line, index) => {
    if (line.trim() === "") return;

    try {
      const value = JSON.parse(line);
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        errors.push(`line ${index + 1}: expected a JSON object`);
        return;
      }
      entries.push({ line: index + 1, value });
    } catch (error) {
      errors.push(`line ${index + 1}: ${error.message}`);
    }
  });

  return { entries, errors };
}

async function writeAtomic(filePath, content) {
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, content, "utf8");
  await rename(temporaryPath, filePath);
}

export async function writeJson(filePath, value) {
  await writeAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeJsonl(filePath, records) {
  const content = records.map((record) => JSON.stringify(record)).join("\n");
  await writeAtomic(filePath, content === "" ? "" : `${content}\n`);
}
