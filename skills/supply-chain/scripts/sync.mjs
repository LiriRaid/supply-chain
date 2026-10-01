#!/usr/bin/env node
// Re-indexes installed skills + MCP servers into skill-registry.md, auto-assigns new skills to a
// department, and (re)applies the supply-chain precondition to installed tool skills.
// Usage: node sync.mjs [--dry-run] [--unpatch]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = os.homedir();
const SKILLS_HOME = path.dirname(SKILL_DIR); // the agent's user skills folder (this skill lives inside it)
const CLAUDE = path.join(HOME, '.claude'); // optional extras (plugins, claude.ai skills) when Claude Code is present
const LOCAL = process.env.SUPPLY_CHAIN_HOME || path.join(HOME, '.supply-chain'); // private layer, agent-neutral
const PROJECT_SKILL_DIRS = ['.claude', '.agents', '.codex', '.cursor', '.gemini', '.opencode'].map((d) => [d, 'skills']);
const MAP_FILE = path.join(SKILL_DIR, 'skill-map.json');
const REGISTRY = path.join(SKILL_DIR, 'skill-registry.md');
const dryRun = process.argv.includes('--dry-run');
const unpatch = process.argv.includes('--unpatch');
const OWN = /^(supply-chain|sc-[a-z-]+)$/;
const BEGIN = '<!-- supply-chain:begin -->';
const END = '<!-- supply-chain:end -->';

const DEPT_KEYWORDS = {
  'sc-frontend': /\b(ui|frontend|component|react|vue|angular|svelte|css|tailwind|layout|page|screen|interface|web app)\b/i,
  'sc-ux-ui': /\b(design|ux|accessib|a11y|wcag|animation|motion|typograph|color|palette|visual|brand)\b/i,
  'sc-backend': /\b(api|backend|server|endpoint|rest|graphql|webhook|queue|job|microservice|rails|nest|django|express)\b/i,
  'sc-data': /\b(database|sql|postgres|mysql|mongo|migration|schema|query|cache|redis|etl|data)\b/i,
  'sc-security': /\b(security|auth|oauth|jwt|vulnerab|owasp|secret|pentest|cve)\b/i,
  'sc-qa': /\b(test|testing|qa|playwright|cypress|jest|vitest|pytest|coverage|review|lint|verify)\b/i,
  'sc-devops': /\b(deploy|docker|kubernetes|ci|cd|pipeline|github actions|terraform|cloud|aws|gcp|azure|git|release)\b/i,
  'sc-architecture': /\b(architecture|refactor|pattern|design pattern|clean code|ddd|hexagonal|modular)\b/i,
  'sc-product': /\b(requirement|user story|prd|roadmap|product|spec|planning)\b/i,
  'sc-devex': /\b(claude|skill|mcp|prompt|agent|documentation|docs|readme|tooling|cli)\b/i,
};

const readText = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

function frontmatter(text) {
  const m = text?.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const get = (k) => {
    const line = m[1].match(new RegExp(`^${k}:\\s*(.*)$`, 'm'));
    return line ? line[1].trim().replace(/^["']|["']$/g, '') : '';
  };
  return { name: get('name'), description: get('description') };
}

function scanSkillsDir(dir, origin) {
  const out = [];
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'synced') continue;
    const skillDir = path.join(dir, e.name);
    const file = path.join(skillDir, 'SKILL.md');
    const text = readText(file);
    if (!text) continue;
    const fm = frontmatter(text);
    out.push({ name: fm.name || e.name, description: fm.description, file, origin });
  }
  return out;
}

function discover() {
  const found = [...scanSkillsDir(SKILLS_HOME, 'user')];
  const synced = path.join(CLAUDE, 'skills', 'synced');
  for (const bucket of fs.existsSync(synced) ? fs.readdirSync(synced) : []) {
    found.push(...scanSkillsDir(path.join(synced, bucket), 'claude.ai'));
  }
  const plugins = readJson(path.join(CLAUDE, 'plugins', 'installed_plugins.json'));
  const enabled = readJson(path.join(CLAUDE, 'settings.json'))?.enabledPlugins || {};
  for (const [id, installs] of Object.entries(plugins?.plugins || {})) {
    if (enabled[id] === false) continue;
    for (const inst of [].concat(installs)) {
      if (inst?.installPath) found.push(...scanSkillsDir(path.join(inst.installPath, 'skills'), `plugin:${id}`));
    }
  }
  const projects = [];
  for (const f of fs.existsSync(path.join(LOCAL, 'projects')) ? fs.readdirSync(path.join(LOCAL, 'projects')) : []) {
    const p = readText(path.join(LOCAL, 'projects', f))?.match(/^Path:\s*(.+)$/m)?.[1]?.trim();
    if (p) for (const d of PROJECT_SKILL_DIRS) for (const s of scanSkillsDir(path.join(p, ...d), `project:${path.basename(p)}`)) projects.push(s);
  }
  const seen = new Map();
  for (const s of found) if (!seen.has(s.name)) seen.set(s.name, s);
  return { skills: [...seen.values()].filter((s) => !OWN.test(s.name)), projects };
}

function discoverMcp() {
  const names = new Set();
  const add = (o) => { for (const n of Object.keys(o || {})) names.add(n); };
  const claude = readJson(path.join(HOME, '.claude.json')) || {};
  add(claude.mcpServers);
  for (const p of Object.values(claude.projects || {})) add(p?.mcpServers);
  add(readJson(path.join(HOME, '.cursor', 'mcp.json'))?.mcpServers);
  add(readJson(path.join(HOME, '.gemini', 'settings.json'))?.mcpServers);
  add(readJson(path.join(HOME, '.config', 'opencode', 'opencode.json'))?.mcp);
  const codex = readText(path.join(HOME, '.codex', 'config.toml')) || '';
  for (const m of codex.matchAll(/^\[mcp_servers\.("?)([^"\]]+)\1\]/gm)) names.add(m[2]);
  return names;
}

function autoAssign(skill) {
  if (skill.origin === 'claude.ai') return ['general'];
  const text = `${skill.name.replace(/[-_]/g, ' ')} ${skill.description || ''}`;
  const hits = Object.entries(DEPT_KEYWORDS)
    .map(([d, re]) => [d, (text.match(new RegExp(re.source, 'gi')) || []).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([d]) => d);
  return hits.length ? hits.slice(0, 2) : ['unassigned'];
}

// ---------- precondition patch ----------

function patchSkill(file, dept) {
  let text = readText(file);
  if (!text) return false;
  const original = text;
  const block = `${BEGIN}\n> **Supply chain precondition.** This skill is a tool of the \`${dept}\` department. If \`${dept}\` (or \`supply-chain:${dept}\`) has not been loaded in this conversation, invoke it first and follow its brief (what, why, where, how), then return here. Skip only for trivial L0 edits.\n${END}\n`;
  text = text.replace(new RegExp(`\\r?\\n?${BEGIN}[\\s\\S]*?${END}\\r?\\n?`), '');
  text = text.replace(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)(?:\r?\n){2,}/, '$1\n');
  text = text.replace(/^(description:\s*)(.*)$/m, (all, k, v) => {
    const clean = v.replace(/ ?\(Supply chain[^)]*\)/, '');
    if (unpatch) return k + clean;
    const tag = ` (Supply chain — load ${dept} first.)`;
    const q = clean[0];
    if ((q === '"' || q === "'") && clean.endsWith(q)) return k + clean.slice(0, -1) + tag + q;
    return k + clean + tag;
  });
  if (!unpatch) text = text.replace(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)/, `$1\n${block}`);
  if (text === original) return false;
  if (!dryRun) fs.writeFileSync(file, text);
  return true;
}

// ---------- owned skills: learning sections + provenance ----------

function ensureSection(file, heading, intro) {
  const text = readText(file);
  if (!text || text.includes(`\n${heading}\n`)) return false;
  if (!dryRun) fs.writeFileSync(file, `${text.trimEnd()}\n\n${heading}\n\n${intro}\n`);
  return true;
}

function ensureNotice(dir, name, e) {
  const file = path.join(dir, 'NOTICE.md');
  if (fs.existsSync(file)) return false;
  const body = [
    `# NOTICE — ${name}`,
    '',
    `Vendored into the supply chain on ${e.vendoredAt} from \`${e.vendoredFrom}\`${e.upstreamHash ? ` (upstream folder hash \`${e.upstreamHash}\`)` : ''}.`,
    `Upstream license: ${e.license}. Keep the original LICENSE file when redistributing.`,
    'Modified: supply-chain precondition block, description trigger, and the "Learned notes" section that grows with use.',
    '',
  ].join('\n');
  if (!dryRun) fs.writeFileSync(file, body);
  return true;
}

const LEARNED_TOOL = '_Grows with use (supply-chain `references/learning.md`). Dated, non-obvious notes about using this tool. When there are more than ~10, fold them into the body above and clear this list._';
const LEARNED_DEPT = '_Grows with use (supply-chain `references/learning.md`). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._';

// ---------- registry ----------

function row(name, e, status) {
  return `| \`${name}\` | ${e.type || 'mcp'} | ${e.capability || '-'} | ${e.when || '-'} | ${e.level || '-'} | ${status} | ${e.source || '-'} |`;
}

function render(map, installed, mcpNames, projects) {
  const head = '| Name | Type | Capability | When | Level | Status | Source |\n|---|---|---|---|---|---|---|';
  const status = (name, e) => {
    if (e.type === 'built-in' || e.type === 'agent') return 'built-in';
    return installed.has(name) ? 'installed' : 'missing';
  };
  const mcpStatus = (name) => (mcpNames.has(name) ? 'configured' : 'missing');
  const depts = ['sc-product', 'sc-architecture', 'sc-frontend', 'sc-ux-ui', 'sc-backend', 'sc-data', 'sc-security', 'sc-qa', 'sc-devops', 'sc-devex'];
  const lines = [
    '# Skill Registry',
    '',
    `> Generated by \`scripts/sync.mjs\` on ${new Date().toISOString().slice(0, 10)}. Edit \`skill-map.json\`, not this file.`,
    '> Use: read your department section + **Shared**. Pick rows whose *When* matches and *Level* ≤ the task level.',
    '> Status `missing` → ask the user to install (`npx skills add <source>`), then re-run sync. Never invent names that are not here or in the session listing.',
    '',
  ];
  const shared = Object.entries(map.skills).filter(([, e]) => e.departments.includes('*'));
  const sharedMcp = Object.entries(map.mcp).filter(([, e]) => e.departments.includes('*'));
  lines.push('## Shared', '', head, ...shared.map(([n, e]) => row(n, e, status(n, e))), ...sharedMcp.map(([n, e]) => row(n, { ...e, type: 'mcp' }, mcpStatus(n))), '');
  for (const d of depts) {
    const s = Object.entries(map.skills).filter(([, e]) => e.departments.includes(d));
    const m = Object.entries(map.mcp).filter(([, e]) => e.departments.includes(d));
    lines.push(`## ${d}`, '');
    if (!s.length && !m.length) { lines.push('_No dedicated skills yet. Use Shared, or propose one (supply-chain `references/skills.md`)._', ''); continue; }
    lines.push(head, ...s.map(([n, e]) => row(n, e, status(n, e))), ...m.map(([n, e]) => row(n, { ...e, type: e.stack ? `mcp (${e.stack})` : 'mcp' }, mcpStatus(n))), '');
  }
  const general = Object.entries(map.skills).filter(([, e]) => e.departments.includes('general'));
  if (general.length) lines.push('## General (not development)', '', general.map(([n]) => `\`${n}\``).join(' · '), '');
  const un = Object.entries(map.skills).filter(([, e]) => e.departments.includes('unassigned'));
  if (un.length) lines.push('## Unassigned', '', '_Detected but not mapped. Edit `skill-map.json` to assign a department._', '', head, ...un.map(([n, e]) => row(n, e, status(n, e))), '');
  if (projects.length) {
    lines.push('## Project skills', '', '| Name | Project | Description |', '|---|---|---|');
    for (const p of projects) lines.push(`| \`${p.name}\` | ${p.origin.replace('project:', '')} | ${(p.description || '').slice(0, 160)} |`);
    lines.push('');
  }
  const extraMcp = [...mcpNames].filter((n) => !map.mcp[n]);
  if (extraMcp.length) lines.push('## Other MCP servers configured', '', extraMcp.map((n) => `- \`${n}\` — not mapped; add it to \`skill-map.json\` → mcp`).join('\n'), '');
  return lines.join('\n');
}

const map = readJson(MAP_FILE);

const vi = process.argv.indexOf('--vendor');
if (vi > 0) {
  const name = process.argv[vi + 1];
  const dest = path.join(path.dirname(SKILL_DIR), name);
  if (!name || !fs.existsSync(dest)) { console.error(`--vendor: skill "${name}" not found in ${path.dirname(SKILL_DIR)}`); process.exit(1); }
  if (fs.lstatSync(dest).isSymbolicLink()) {
    const real = fs.realpathSync(dest);
    fs.unlinkSync(dest);
    fs.cpSync(real, dest, { recursive: true, dereference: true });
    console.log(`Vendored ${name}: link to ${real} replaced by a real copy (original left untouched).`);
  }
  const lock = readJson(path.join(HOME, '.agents', '.skill-lock.json'))?.skills?.[name];
  const fm = frontmatter(readText(path.join(dest, 'SKILL.md')));
  const e = map.skills[name] || { type: 'skill', departments: autoAssign({ name, description: fm.description, origin: 'user' }), capability: '-', auto: true, when: (fm.description || '').slice(0, 140), level: 'L1' };
  Object.assign(e, {
    owned: true,
    vendoredFrom: e.vendoredFrom || lock?.source || e.source || 'unknown',
    source: e.source || lock?.source,
    upstreamHash: lock?.skillFolderHash || e.upstreamHash || null,
    vendoredAt: new Date().toISOString().slice(0, 10),
    license: e.license || (fs.readdirSync(dest).find((f) => /licen/i.test(f)) ? 'see LICENSE file' : 'unknown (verify upstream)'),
  });
  if (!e.patch) e.patch = e.departments.find((d) => d.startsWith('sc-')) || 'supply-chain';
  map.skills[name] = e;
}

const { skills, projects } = discover();
const installed = new Set(skills.map((s) => s.name));
const added = [];
for (const s of skills) {
  if (map.skills[s.name]) continue;
  map.skills[s.name] = {
    type: 'skill', departments: autoAssign(s), capability: '-', auto: true,
    when: (s.description || '').replace(/\|/g, '/').slice(0, 140), level: 'L1', origin: s.origin,
  };
  added.push(`${s.name} → ${map.skills[s.name].departments.join(', ')}`);
}

const patched = [];
for (const s of skills) {
  const dept = map.skills[s.name]?.patch;
  if (dept && s.origin === 'user' && patchSkill(s.file, dept)) patched.push(`${s.name} (${unpatch ? 'removed' : dept})`);
}

const evolved = [];
for (const s of skills) {
  const e = map.skills[s.name];
  if (!e?.owned || s.origin !== 'user' || unpatch) continue;
  if (ensureSection(s.file, '## Learned notes', LEARNED_TOOL)) evolved.push(`${s.name} (+Learned notes)`);
  if (e.vendoredFrom && ensureNotice(path.dirname(s.file), s.name, e)) evolved.push(`${s.name} (+NOTICE)`);
}
for (const d of fs.readdirSync(SKILLS_HOME)) {
  if (!/^sc-/.test(d)) continue;
  if (!unpatch && ensureSection(path.join(SKILLS_HOME, d, 'SKILL.md'), '## Learned rules', LEARNED_DEPT)) evolved.push(`${d} (+Learned rules)`);
}

const registry = render(map, installed, discoverMcp(), projects);
if (!dryRun) {
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2) + '\n');
  fs.writeFileSync(REGISTRY, registry + '\n');
  fs.mkdirSync(path.join(LOCAL, 'learnings'), { recursive: true });
  fs.mkdirSync(path.join(LOCAL, 'projects'), { recursive: true });
  const tpl = path.join(SKILL_DIR, 'templates', 'private-layer');
  for (const f of fs.existsSync(tpl) ? fs.readdirSync(tpl).filter((n) => n.endsWith('.md')) : []) {
    if (!fs.existsSync(path.join(LOCAL, f))) { fs.copyFileSync(path.join(tpl, f), path.join(LOCAL, f)); evolved.push(`~/.supply-chain/${f} (created)`); }
  }
}
console.log(`Skills found: ${skills.length} · project skills: ${projects.length}`);
console.log(`New (auto-assigned, review in skill-map.json): ${added.length ? '\n  ' + added.join('\n  ') : 'none'}`);
console.log(`Precondition ${unpatch ? 'removed from' : 'applied to'}: ${patched.length ? patched.join(', ') : 'nothing changed'}`);
console.log(`Learning sections / provenance added: ${evolved.length ? evolved.join(', ') : 'nothing changed'}`);
console.log(`${dryRun ? '[dry-run] ' : ''}Registry: ${REGISTRY}`);
