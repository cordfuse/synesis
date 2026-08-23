/**
 * Vault hygiene checks — the mechanical half of skills/lint.md.
 *
 *   bun tools/lint.ts          # or: npx tsx tools/lint.ts
 *   bun tools/lint.ts --quiet  # findings only, no "clean" lines
 *
 * Exits 1 if anything was found, 0 if clean. Reports; never fixes.
 * Node built-ins only, no dependencies.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const VAULT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const QUIET = process.argv.includes("--quiet");

type Doc = {
  path: string; // vault-relative, e.g. "conventions/git-workflow.md"
  id: string; // link target form, e.g. "conventions/git-workflow"
  dir: string;
  raw: string;
  body: string; // body with frontmatter, fenced blocks and inline code stripped
  fm: Record<string, string>;
  related: string[]; // link targets inside the weave block
};

const findings: string[] = [];
const clean: string[] = [];

function report(label: string, hits: string[]) {
  if (hits.length) findings.push(`${label}:\n` + hits.map((h) => `  ${h}`).join("\n"));
  else clean.push(`No ${label.toLowerCase()}.`);
}

// --- loading ---------------------------------------------------------------

/** Flat key: value scrape. Enough for this protocol's frontmatter; not a YAML parser. */
function parseFrontmatter(raw: string): Record<string, string> {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z-]+):\s*(.*)$/i);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

/** Strip frontmatter, fenced blocks and inline code so examples never read as live links. */
function stripToBody(raw: string): string {
  return raw
    .replace(/^---\n[\s\S]*?\n---/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]*`/g, "");
}

function linksIn(text: string): string[] {
  return [...text.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim());
}

function load(dir: string): Doc[] {
  const full = join(VAULT, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(".md") && f !== "_template.md" && f !== "README.md")
    .map((f) => {
      const path = `${dir}/${f}`;
      const raw = readFileSync(join(VAULT, path), "utf8");
      const body = stripToBody(raw);
      const weave = body.match(/<!--\s*weave:start\s*-->([\s\S]*?)<!--\s*weave:end\s*-->/);
      return {
        path,
        id: path.replace(/\.md$/, ""),
        dir,
        raw,
        body,
        fm: parseFrontmatter(raw),
        related: weave ? linksIn(weave[1]) : [],
      };
    });
}

const records = load("records");
const conventions = load("conventions");
const people = load("people");
const skills = load("skills");
const all = [...records, ...conventions, ...people, ...skills];
const active = all.filter((d) => d.fm.archived !== "true");

const staleDays = Number(parseFrontmatter(readFileSync(join(VAULT, "PROTOCOL.md"), "utf8"))["stale-days"] ?? 90);
const today = new Date();
const daysSince = (iso: string) =>
  Math.floor((today.getTime() - new Date(iso + "T00:00:00Z").getTime()) / 86_400_000);

// --- 1. stale knowledge ----------------------------------------------------

report(
  "Stale knowledge",
  [...records, ...conventions]
    .filter((d) => d.fm.archived !== "true" && d.fm["last-verified"])
    .map((d) => ({ d, age: daysSince(d.fm["last-verified"]) }))
    .filter(({ age }) => age > staleDays)
    .sort((a, b) => b.age - a.age)
    .map(({ d, age }) => `${d.path} — last verified ${d.fm["last-verified"]} (${age} days ago)`),
);

// --- 2. broken links -------------------------------------------------------

const exists = (target: string) => existsSync(join(VAULT, `${target}.md`)) || existsSync(join(VAULT, target));

report(
  "Broken links",
  all.flatMap((d) => {
    const targets = [...linksIn(d.body)];
    const sup = d.fm["superseded-by"];
    if (sup) targets.push(sup.replace(/\.md$/, ""));
    return targets.filter((t) => !exists(t)).map((t) => `${d.path} — [[${t}]] not found`);
  }),
);

// --- 3. missing attribution ------------------------------------------------

report(
  "Missing attribution",
  records
    .filter((d) => !d.fm["decided-by"] || d.fm["decided-by"] === "[]")
    .map((d) => `${d.path} — no decided-by`),
);

// --- 4. orphaned profiles --------------------------------------------------

let recentAuthors: string[] = [];
try {
  recentAuthors = execFileSync("git", ["log", "--format=%ae", "--since=6 months ago"], {
    cwd: VAULT,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
} catch {
  clean.push("Orphaned profiles: skipped (git unavailable).");
}

if (recentAuthors.length) {
  report(
    "Orphaned profiles",
    people
      .filter((d) => d.fm.email && !recentAuthors.includes(d.fm.email))
      .map((d) => `${d.path} — ${d.fm.email} absent from the last 6 months of git history`),
  );
}

// --- 5. unfilled templates -------------------------------------------------

report(
  "Unfilled templates",
  ["records", "conventions", "people"].flatMap((dir) => {
    const tpl = join(VAULT, dir, "_template.md");
    if (!existsSync(tpl)) return [];
    const shape = readFileSync(tpl, "utf8").replace(/\s+/g, "");
    return all
      .filter((d) => d.dir === dir && d.raw.replace(/\s+/g, "") === shape)
      .map((d) => `${d.path} — unchanged from _template.md`);
  }),
);

// --- 6. weave integrity ----------------------------------------------------
// The Related block is derived (PROTOCOL.md → Record linking). These checks are
// what makes it regenerable: links must be reciprocal, and markers must pair up.

// Scope matches skills/weave.md: records and conventions only. Markers are counted
// on the stripped body, so documented examples in code fences are not live blocks.
const woven = active.filter((d) => d.dir === "records" || d.dir === "conventions");
const byId = new Map(woven.map((d) => [d.id, d]));

report(
  "One-way weave links",
  woven.flatMap((d) =>
    d.related
      .filter((t) => byId.has(t) && !byId.get(t)!.related.includes(d.id))
      .map((t) => `${d.path} — links [[${t}]], not reciprocated`),
  ),
);

report(
  "Malformed weave blocks",
  woven.flatMap((d) => {
    const starts = (d.body.match(/<!--\s*weave:start\s*-->/g) ?? []).length;
    const ends = (d.body.match(/<!--\s*weave:end\s*-->/g) ?? []).length;
    const hits: string[] = [];
    if (starts !== ends) hits.push(`${d.path} — ${starts} start marker(s), ${ends} end marker(s)`);
    if (starts > 1) hits.push(`${d.path} — ${starts} weave blocks, expected 1`);
    if (starts === 1 && ends === 1 && d.related.length === 0)
      hits.push(`${d.path} — empty weave block; omit the section instead`);
    if (/^##\s+Related\s*$/m.test(d.body) && starts === 0)
      hits.push(`${d.path} — ## Related without weave markers; hand-written links belong in the body`);
    return hits;
  }),
);

// --- output ----------------------------------------------------------------

if (findings.length) console.log(findings.join("\n\n"));
if (!QUIET && clean.length) console.log((findings.length ? "\n" : "") + clean.join("\n"));

const counted = `\n${all.length} files scanned — ${records.length} records, ${conventions.length} conventions, ${people.length} people, ${skills.length} skills.`;
if (!QUIET) console.log(counted);

process.exit(findings.length ? 1 : 0);
