import { createHash } from "node:crypto";

export const MATERIAL_ORIGIN = "https://m3.material.io";

const PAGE_TYPES = new Map([
  ["blog", "blog"],
  ["components", "component_tab"],
  ["develop", "develop"],
  ["foundations", "foundation"],
  ["styles", "style"],
]);

const UTILITY_PATHS = new Set(["/search.html", "/sitemap.xml"]);

function compareStrings(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function canonicalizeMaterialUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.trim() === "") {
    throw new TypeError("URL must be a non-empty string");
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new TypeError(`Invalid URL: ${rawUrl}`);
  }

  const isAllowedOrigin =
    parsed.protocol === "https:" &&
    parsed.hostname === "m3.material.io" &&
    parsed.port === "" &&
    parsed.username === "" &&
    parsed.password === "";

  if (!isAllowedOrigin) {
    throw new TypeError(`URL is outside ${MATERIAL_ORIGIN}: ${rawUrl}`);
  }

  parsed.search = "";
  parsed.hash = "";
  parsed.pathname =
    parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/+$/, "");

  return `${MATERIAL_ORIGIN}${parsed.pathname}`;
}

export function classifyMaterialUrl(canonicalUrl) {
  const parsed = new URL(canonicalUrl);
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return {
      category: "home",
      page_type: "index",
      component: null,
      tab: null,
    };
  }

  if (UTILITY_PATHS.has(parsed.pathname)) {
    return {
      category: "utility",
      page_type: "utility",
      component: null,
      tab: null,
    };
  }

  const category = segments[0];
  if (segments.length === 1) {
    return {
      category,
      page_type: "index",
      component: null,
      tab: null,
    };
  }

  const pageType = PAGE_TYPES.get(category);
  if (!pageType) {
    return {
      category,
      page_type: "utility",
      component: null,
      tab: null,
    };
  }

  if (pageType === "component_tab") {
    return {
      category,
      page_type: pageType,
      component: segments[1],
      tab: segments.length > 2 ? segments.slice(2).join("/") : null,
    };
  }

  return {
    category,
    page_type: pageType,
    component: null,
    tab: null,
  };
}

function selectMetadata(candidates) {
  return candidates
    .map((candidate) => ({
      title: cleanText(candidate.title),
      description: cleanText(candidate.description),
    }))
    .sort((left, right) => {
      const leftPresent = Number(Boolean(left.title)) + Number(Boolean(left.description));
      const rightPresent = Number(Boolean(right.title)) + Number(Boolean(right.description));
      if (leftPresent !== rightPresent) return rightPresent - leftPresent;

      const lengthDifference =
        right.title.length +
        right.description.length -
        (left.title.length + left.description.length);
      if (lengthDifference !== 0) return lengthDifference;

      return (
        compareStrings(left.title, right.title) ||
        compareStrings(left.description, right.description)
      );
    })[0];
}

function createRecordId(canonicalUrl) {
  const digest = createHash("sha256").update(canonicalUrl).digest("hex").slice(0, 16);
  return `m3-url-${digest}`;
}

export function buildUrlCatalog(links) {
  if (!Array.isArray(links)) {
    throw new TypeError("Source data.links must be an array");
  }

  const grouped = new Map();

  links.forEach((link, index) => {
    if (!link || typeof link !== "object" || Array.isArray(link)) {
      throw new TypeError(`Source link ${index + 1} must be an object`);
    }

    let canonicalUrl;
    try {
      canonicalUrl = canonicalizeMaterialUrl(link.url);
    } catch (error) {
      throw new TypeError(`Source link ${index + 1}: ${error.message}`);
    }

    const candidates = grouped.get(canonicalUrl) ?? [];
    candidates.push(link);
    grouped.set(canonicalUrl, candidates);
  });

  const records = [...grouped.entries()]
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([url, candidates]) => {
      const metadata = selectMetadata(candidates);
      return {
        id: createRecordId(url),
        url,
        title: metadata.title,
        description: metadata.description,
        ...classifyMaterialUrl(url),
        status: "pending",
      };
    });

  const ids = new Set(records.map(({ id }) => id));
  if (ids.size !== records.length) {
    throw new Error("Stable URL id collision detected");
  }

  return records;
}

function countBy(records, field) {
  const counts = new Map();
  for (const record of records) {
    counts.set(record[field], (counts.get(record[field]) ?? 0) + 1);
  }

  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => compareStrings(left, right)),
  );
}

export function summarizeUrlCatalog(inputCount, records) {
  return {
    input_links: inputCount,
    canonical_records: records.length,
    duplicates_removed: inputCount - records.length,
    by_category: countBy(records, "category"),
    by_page_type: countBy(records, "page_type"),
  };
}
