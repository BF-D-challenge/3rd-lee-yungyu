#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  buildCreativeLayers,
  createPlacementContactSheet,
  renderStackedCreative,
  validateStackGeometry,
} from "./lib/render-stacked-creative.mjs";

function parseArgs(argv) {
  const options = {
    manifest: "config/ad-image/manifest.v3.json",
    placements: "config/ad-image/placement-profiles.v3.json",
    ids: [],
    profiles: [],
    dryRun: false,
    debugSafeArea: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--manifest") options.manifest = argv[++index];
    else if (argument === "--placements") options.placements = argv[++index];
    else if (argument === "--id") options.ids.push(argv[++index]);
    else if (argument === "--profile") options.profiles.push(argv[++index]);
    else if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--debug-safe-area") options.debugSafeArea = true;
    else if (argument === "--help" || argument === "-h") {
      console.log(`Usage:
  node scripts/ad-image/render-v3.mjs [options]

Options:
  --manifest <path>      v3 creative manifest
  --placements <path>    Instagram placement profiles
  --id <creative-id>     Render one creative; repeatable
  --profile <profile-id> Render one placement profile; repeatable
  --dry-run              Validate manifests, assets, assignments, and stack overlap
  --debug-safe-area      Draw the configured safe boundary
  --help                 Show this help`);
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

async function loadJson(cwd, source, label) {
  const target = path.resolve(cwd, source);
  assertWithinWorkspace(cwd, target, label);
  return {
    target,
    value: JSON.parse(await fs.readFile(target, "utf8")),
  };
}

async function validate({
  manifest,
  placements,
  cwd,
  selectedIds,
  selectedProfiles,
}) {
  if (manifest.version !== 3) throw new Error("v3 manifest version must be 3");
  if (placements.version !== 3) throw new Error("placement profile version must be 3");
  if (!Array.isArray(manifest.creatives) || manifest.creatives.length !== 15) {
    throw new Error("v3 manifest must contain exactly 15 creatives");
  }

  const creativeIds = new Set();
  for (const creative of manifest.creatives) {
    if (!creative.id || creativeIds.has(creative.id)) {
      throw new Error(`creative id missing or duplicated: ${creative.id}`);
    }
    creativeIds.add(creative.id);
    if (!creative.route?.startsWith("/")) {
      throw new Error(`${creative.id}: route must be an absolute app path`);
    }
    if (!creative.evidenceSource) {
      throw new Error(`${creative.id}: evidenceSource is required`);
    }
    for (const source of [
      creative.evidenceSource,
      creative.evidenceSecondary,
      creative.aiAsset,
    ].filter(Boolean)) {
      const assetPath = path.resolve(cwd, source);
      assertWithinWorkspace(cwd, assetPath, `${creative.id} asset`);
      await fs.access(assetPath);
    }
    const layers = buildCreativeLayers(creative);
    const stackWarnings = validateStackGeometry(layers, placements.composition);
    if (stackWarnings.length) {
      console.warn(`△ ${creative.id}: ${stackWarnings.join("; ")}`);
    }
  }

  const profileIds = new Set(Object.keys(placements.profiles));
  for (const [creativeId, assignments] of Object.entries(placements.assignments)) {
    if (!creativeIds.has(creativeId)) {
      throw new Error(`assignment references unknown creative: ${creativeId}`);
    }
    for (const profileId of assignments) {
      if (!profileIds.has(profileId)) {
        throw new Error(`${creativeId}: unknown placement profile ${profileId}`);
      }
    }
  }
  for (const creativeId of creativeIds) {
    if (!placements.assignments[creativeId]) {
      throw new Error(`${creativeId}: placement assignment is missing`);
    }
  }

  if (selectedIds.some((id) => !creativeIds.has(id))) {
    throw new Error(
      `unknown creative id(s): ${selectedIds.filter((id) => !creativeIds.has(id)).join(", ")}`,
    );
  }
  if (selectedProfiles.some((id) => !profileIds.has(id))) {
    throw new Error(
      `unknown placement profile(s): ${selectedProfiles.filter((id) => !profileIds.has(id)).join(", ")}`,
    );
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const [{ target: manifestPath, value: manifest }, { target: placementsPath, value: placements }] =
    await Promise.all([
      loadJson(cwd, options.manifest, "manifest"),
      loadJson(cwd, options.placements, "placements"),
    ]);

  await validate({
    manifest,
    placements,
    cwd,
    selectedIds: options.ids,
    selectedProfiles: options.profiles,
  });

  const selectedCreatives = options.ids.length
    ? manifest.creatives.filter((creative) => options.ids.includes(creative.id))
    : manifest.creatives;
  const selectedProfileIds = options.profiles.length
    ? options.profiles
    : Object.keys(placements.profiles);
  const outputDir = path.resolve(cwd, manifest.outputDir);
  assertWithinWorkspace(cwd, outputDir, "outputDir");

  const jobs = [];
  for (const creative of selectedCreatives) {
    const assigned = new Set(placements.assignments[creative.id]);
    for (const profileId of selectedProfileIds) {
      if (!assigned.has(profileId)) continue;
      jobs.push({ creative, profileId, profile: placements.profiles[profileId] });
    }
  }

  if (options.dryRun) {
    console.log(`✓ manifest: ${path.relative(cwd, manifestPath)}`);
    console.log(`✓ placements: ${path.relative(cwd, placementsPath)}`);
    console.log(`✓ creatives: ${selectedCreatives.length}`);
    console.log(`✓ render jobs: ${jobs.length}`);
    console.log(`✓ output: ${path.relative(cwd, outputDir)}`);
    return;
  }

  const results = [];
  for (const job of jobs) {
    const result = await renderStackedCreative({
      ...job,
      composition: placements.composition,
      cwd,
      outputDir,
      debugSafeArea: options.debugSafeArea,
    });
    results.push(result);
    const marker = result.warnings.length ? "△" : "✓";
    console.log(`${marker} ${result.id} · ${result.profile} (${result.durationMs}ms)`);
  }

  const contactSheets = {};
  for (const profileId of selectedProfileIds) {
    const profileResults = results.filter((result) => result.profile === profileId);
    if (!profileResults.length) continue;
    contactSheets[profileId] = await createPlacementContactSheet({
      results: profileResults,
      profile: placements.profiles[profileId],
      profileId,
      cwd,
      outputDir,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    manifest: path.relative(cwd, manifestPath),
    placements: path.relative(cwd, placementsPath),
    publishable:
      results.length > 0 &&
      results.every(
        (result) =>
          result.approval === "approved" &&
          !result.shootingPending &&
          !result.motionPending &&
          !result.warnings.length,
      ),
    results,
    contactSheets,
  };
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "render-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  console.log(`\nRendered ${results.length} placement asset(s)`);
  console.log(
    report.publishable
      ? "Publish gate: PASS"
      : "Publish gate: BLOCKED (draft approval, shooting, motion, or warnings remain)",
  );
}

main().catch((error) => {
  console.error(`ad-image v3 renderer failed: ${error.message}`);
  process.exitCode = 1;
});
