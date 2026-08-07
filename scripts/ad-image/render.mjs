#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  createContactSheet,
  renderCreative,
  resolveTokens,
} from "./lib/render-creative.mjs";

function parseArgs(argv) {
  const options = {
    manifest: "config/ad-image/manifest.json",
    ids: [],
    dryRun: false,
    debugSafeArea: false,
    requireRealBackgrounds: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--manifest") options.manifest = argv[++index];
    else if (argument === "--id") options.ids.push(argv[++index]);
    else if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--debug-safe-area") options.debugSafeArea = true;
    else if (argument === "--require-real-backgrounds") {
      options.requireRealBackgrounds = true;
    } else if (argument === "--help" || argument === "-h") {
      console.log(`Usage:
  node scripts/ad-image/render.mjs [options]

Options:
  --manifest <path>            Manifest JSON (default: config/ad-image/manifest.json)
  --id <creative-id>           Render one creative; repeat to select several
  --dry-run                    Validate templates, variables, and source paths only
  --debug-safe-area            Draw the delivery-safe boundary
  --require-real-backgrounds   Fail instead of creating a local placeholder
  --help                       Show this help`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

function assertWithinWorkspace(cwd, target, label) {
  const relative = path.relative(cwd, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside the workspace: ${target}`);
  }
}

function validateManifest(manifest, cwd) {
  if (![1, 2].includes(manifest.version)) {
    throw new Error("Manifest version must be 1 or 2");
  }
  if (!Number.isInteger(manifest.canvas?.width) || !Number.isInteger(manifest.canvas?.height)) {
    throw new Error("canvas.width and canvas.height must be integers");
  }
  if (!manifest.templates || !Object.keys(manifest.templates).length) {
    throw new Error("At least one template is required");
  }
  if (!Array.isArray(manifest.creatives) || !manifest.creatives.length) {
    throw new Error("At least one creative is required");
  }

  const ids = new Set();
  for (const creative of manifest.creatives) {
    if (!creative.id || ids.has(creative.id)) {
      throw new Error(`Creative id is missing or duplicated: ${creative.id}`);
    }
    ids.add(creative.id);
    if (!manifest.templates[creative.template]) {
      throw new Error(`${creative.id}: unknown template ${creative.template}`);
    }
    if (!creative.background?.source && !creative.background?.fill) {
      throw new Error(`${creative.id}: background.source or background.fill is required`);
    }
    const layers = resolveTokens(
      manifest.templates[creative.template].layers,
      creative.variables ?? {},
    );
    if (creative.background.source) {
      assertWithinWorkspace(
        cwd,
        path.resolve(cwd, creative.background.source),
        "background.source",
      );
    }
    for (const layer of layers) {
      if (layer.type !== "image") continue;
      if (!layer.source) throw new Error(`${creative.id}: image layer source is required`);
      assertWithinWorkspace(
        cwd,
        path.resolve(cwd, layer.source),
        `${creative.id} image source`,
      );
    }
  }

  const outputDir = path.resolve(cwd, manifest.outputDir);
  assertWithinWorkspace(cwd, outputDir, "outputDir");
  return outputDir;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const manifestPath = path.resolve(cwd, options.manifest);
  assertWithinWorkspace(cwd, manifestPath, "manifest");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const outputDir = validateManifest(manifest, cwd);
  const selected = options.ids.length
    ? manifest.creatives.filter((creative) => options.ids.includes(creative.id))
    : manifest.creatives;

  if (options.ids.length && selected.length !== options.ids.length) {
    const found = new Set(selected.map((creative) => creative.id));
    const missing = options.ids.filter((id) => !found.has(id));
    throw new Error(`Unknown creative id(s): ${missing.join(", ")}`);
  }

  if (options.dryRun) {
    console.log(`✓ manifest: ${path.relative(cwd, manifestPath)}`);
    console.log(`✓ canvas: ${manifest.canvas.width}×${manifest.canvas.height}`);
    console.log(`✓ creatives: ${selected.length}`);
    console.log(`✓ output: ${path.relative(cwd, outputDir)}`);
    return;
  }

  const results = [];
  for (const creative of selected) {
    const result = await renderCreative({
      creative,
      template: manifest.templates[creative.template],
      canvas: manifest.canvas,
      safeArea: manifest.safeArea,
      cwd,
      outputDir,
      debugSafeArea: options.debugSafeArea,
      requireRealBackgrounds: options.requireRealBackgrounds,
    });
    results.push(result);
    const marker = result.placeholder ? "△" : "✓";
    console.log(`${marker} ${result.id} (${result.durationMs}ms)`);
  }

  const contactSheet = await createContactSheet({
    results,
    canvas: manifest.canvas,
    cwd,
    outputDir,
  });
  const report = {
    generatedAt: new Date().toISOString(),
    manifest: path.relative(cwd, manifestPath),
    publishable:
      selected.every((creative) => creative.approval?.status === "approved") &&
      results.every((result) => !result.placeholder && !result.warnings.length),
    approval: selected.map((creative) => ({
      id: creative.id,
      status: creative.approval?.status ?? "draft",
    })),
    results,
    contactSheet,
  };
  await fs.writeFile(
    path.join(outputDir, "render-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  console.log(`\nRendered ${results.length} creative(s)`);
  console.log(`Contact sheet: ${contactSheet}`);
  console.log(
    report.publishable
      ? "Publish gate: PASS"
      : "Publish gate: BLOCKED (creative approval, placeholders, or warnings remain)",
  );
}

main().catch((error) => {
  console.error(`ad-image renderer failed: ${error.message}`);
  process.exitCode = 1;
});
