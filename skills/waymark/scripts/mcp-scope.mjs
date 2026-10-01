#!/usr/bin/env node
// Waymark · stack MCP servers only where the stack is used (Claude Code). A framework's MCP server (Angular CLI,
// PrimeNG, React, Vue, Tailwind, NestJS, Prisma…) registered at user scope loads in every project and costs
// context even where it is never used. This moves each one to the local scope of the projects whose manifests
// use that framework, and removes it from user scope; generic servers (docs, memory) stay global.
// It only plans by default; --apply runs the official CLI (`claude mcp add-json --scope local`, `claude mcp remove
// --scope user`) after the user said yes. Removed configs are kept in ~/.waymark/mcp-catalog.json so a project
// detected later can get its server back (--project <path>). Takes effect in the next session.
// Usage: node mcp-scope.mjs [--apply] [--project <path>] [--json]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOME = os.homedir();
const LOCAL = process.env.WAYMARK_HOME || path.join(HOME, '.waymark');
const CLAUDE_JSON = process.env.WAYMARK_CLAUDE_JSON || path.join(HOME, '.claude.json');
const MAP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'skill-map.json');
const CATALOG = path.join(LOCAL, 'mcp-catalog.json');
const args = process.argv.slice(2);
const apply = args.includes('--apply'), asJson = args.includes('--json');
const onlyProject = args.includes('--project') ? path.resolve(args[args.indexOf('--project') + 1]) : null;
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const readText = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const norm = (p) => path.resolve(p).replace(/\\/g, '/').toLowerCase();

// Framework → manifest signals (dependency names). A server belongs to a framework by its skill-map `stack`
// field or, when unmapped, by its name.
export const FRAMEWORKS = {
  angular: ['@angular/core'], primeng: ['primeng'], react: ['react'], next: ['next'], vue: ['vue'], nuxt: ['nuxt'],
  svelte: ['svelte', '@sveltejs/kit'], tailwind: ['tailwindcss'], nest: ['@nestjs/core'], prisma: ['prisma', '@prisma/client'],
  supabase: ['@supabase/supabase-js'], expo: ['expo'], 'react-native': ['react-native'], astro: ['astro'],
  rails: ['rails'], django: ['django'], fastapi: ['fastapi'], flask: ['flask'], laravel: ['laravel/framework'],
  spring: ['spring-boot', 'spring-boot-starter'], dotnet: ['Microsoft.AspNetCore'], flutter: ['flutter'],
};

// The server's own name wins (primeng → primeng even if mapped to the Angular stack), then its skill-map stack.
export function frameworkOf(name, entry) {
  const n = name.toLowerCase();
  const byName = Object.keys(FRAMEWORKS).sort((a, b) => b.length - a.length).find((f) => new RegExp(`(^|[^a-z])${f.replace('-', '[-_]?')}([^a-z]|$)`).test(n));
  if (byName) return byName;
  const s = String(entry?.stack || '').toLowerCase();
  return Object.keys(FRAMEWORKS).find((f) => s === f || s.includes(f)) || null;
}

// Dependency names declared in the project's manifests.
export function projectDeps(dir) {
  const deps = new Set();
  const pkg = readJson(path.join(dir, 'package.json'));
  for (const k of ['dependencies', 'devDependencies', 'peerDependencies']) for (const d of Object.keys(pkg?.[k] || {})) deps.add(d);
  for (const m of readText(path.join(dir, 'Gemfile')).matchAll(/^\s*gem\s+['"]([^'"]+)/gm)) deps.add(m[1]);
  for (const f of ['requirements.txt', 'pyproject.toml', 'Pipfile']) for (const m of readText(path.join(dir, f)).matchAll(/^\s*["']?([A-Za-z0-9_.-]+)/gm)) deps.add(m[1].toLowerCase());
  for (const d of Object.keys(readJson(path.join(dir, 'composer.json'))?.require || {})) deps.add(d);
  for (const m of readText(path.join(dir, 'pom.xml')).matchAll(/<artifactId>([^<]+)<\/artifactId>/g)) deps.add(m[1]);
  for (const m of readText(path.join(dir, 'build.gradle')).matchAll(/['"][^:'"]+:([^:'"]+):/g)) deps.add(m[1]);
  if (fs.existsSync(path.join(dir, 'pubspec.yaml'))) deps.add('flutter');
  try { for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.csproj'))) for (const m of readText(path.join(dir, f)).matchAll(/Include="([^"]+)"/g)) deps.add(m[1]); } catch {}
  return deps;
}
export const uses = (deps, fw) => FRAMEWORKS[fw].some((sig) => [...deps].some((d) => d === sig || d.startsWith(sig + '.') || (sig === 'spring-boot' && d.startsWith('spring-boot'))));

function knownProjects() {
  const dir = path.join(LOCAL, 'projects');
  const list = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => readText(path.join(dir, f)).match(/^Path:\s*([^·\n]+)/m)?.[1]?.trim()).filter(Boolean) : [];
  return [...new Set(list.map((p) => path.resolve(p)))].filter((p) => fs.existsSync(p));
}

function plan() {
  const cj = readJson(CLAUDE_JSON) || {};
  const map = readJson(MAP)?.mcp || {};
  const catalog = readJson(CATALOG) || {};
  const userServers = cj.mcpServers || {};
  const projects = onlyProject ? [onlyProject] : knownProjects();
  const steps = [];
  const stackServers = Object.entries({ ...catalog, ...userServers }).map(([name, cfg]) => ({ name, cfg, fw: frameworkOf(name, map[name]), atUser: !!userServers[name] })).filter((s) => s.fw);
  for (const s of stackServers) {
    const needing = projects.filter((p) => uses(projectDeps(p), s.fw));
    for (const p of needing) {
      const local = cj.projects?.[Object.keys(cj.projects || {}).find((k) => norm(k) === norm(p))]?.mcpServers || {};
      if (!local[s.name]) steps.push({ op: 'add-local', server: s.name, framework: s.fw, project: p, cfg: s.cfg });
    }
    if (s.atUser && !onlyProject) steps.push({ op: 'remove-user', server: s.name, framework: s.fw, keptFor: needing });
  }
  return { steps, stackServers: stackServers.map(({ name, fw, atUser }) => ({ name, framework: fw, scope: atUser ? 'user' : 'catalog' })), projects, catalog, userServers };
}

// Run the claude CLI without a shell when it is an executable, so the JSON argument reaches it intact; a .cmd
// shim (Windows npm install) needs cmd, and then every argument is quoted.
function claudeBin() {
  const forced = process.env.WAYMARK_CLAUDE_BIN; // tests point this at a fake CLI
  if (forced) return /\.m?js$/i.test(forced) ? { file: process.execPath, pre: [forced], shell: false } : { file: forced, shell: /\.(cmd|bat)$/i.test(forced) };
  if (process.platform !== 'win32') return { file: 'claude', shell: false };
  let found = [];
  try { found = execFileSync('where', ['claude'], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean); } catch {}
  const exe = found.find((f) => /\.exe$/i.test(f));
  return exe ? { file: exe, shell: false } : { file: found.find((f) => /\.(cmd|bat)$/i.test(f)) || 'claude', shell: true };
}
const BIN = claudeBin();
const run = (a, cwd) => BIN.shell
  ? execFileSync(`"${BIN.file}" ${a.map((x) => `"${String(x).replace(/"/g, '\\"')}"`).join(' ')}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: true })
  : execFileSync(BIN.file, [...(BIN.pre || []), ...a], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const p = plan();
  if (asJson) { console.log(JSON.stringify({ steps: p.steps.map(({ cfg, ...s }) => s), stackServers: p.stackServers, projects: p.projects }, null, 2)); process.exit(0); }
  if (!p.stackServers.length) { console.log('No framework-specific MCP servers found (generic servers such as docs or memory stay global).'); process.exit(0); }
  console.log(`Framework MCP servers: ${p.stackServers.map((s) => `${s.name} (${s.framework}, ${s.scope})`).join(' · ')}`);
  console.log(`Projects checked: ${p.projects.length ? p.projects.join(' · ') : 'none in ~/.waymark/projects'}`);
  if (!p.steps.length) { console.log('Nothing to change: each framework server is only where its framework is used.'); process.exit(0); }
  for (const s of p.steps) console.log(s.op === 'add-local' ? `  + ${s.server} → local scope of ${s.project} (uses ${s.framework})` : `  - ${s.server} from user scope (kept in ${s.keptFor.length ? s.keptFor.length + ' project(s)' : 'no project yet'}; config saved in ~/.waymark/mcp-catalog.json)`);
  if (!apply) { console.log('\nPlan only. Ask the user, then re-run with --apply. Takes effect in the next session.'); process.exit(0); }
  // A plan built from another claude.json (tests) must never run against the real CLI.
  if (process.env.WAYMARK_CLAUDE_JSON && !process.env.WAYMARK_CLAUDE_BIN) { console.error('Refusing --apply: WAYMARK_CLAUDE_JSON is set without WAYMARK_CLAUDE_BIN.'); process.exit(1); }
  const catalog = p.catalog, failed = new Set();
  const step = (a, cwd, ok) => { try { run(a, cwd); console.log(ok); return true; } catch (e) { console.error(`failed: claude ${a.slice(0, 3).join(' ')} — ${String(e.stderr || e.message).trim().split('\n')[0]}`); return false; } };
  for (const s of p.steps) {
    if (s.op === 'add-local' && !step(['mcp', 'add-json', s.server, JSON.stringify(s.cfg), '--scope', 'local'], s.project, `added ${s.server} to ${s.project}`)) failed.add(s.server);
  }
  for (const s of p.steps) {
    if (s.op !== 'remove-user') continue;
    if (failed.has(s.server)) { console.error(`kept ${s.server} at user scope: adding it to a project failed`); continue; }
    catalog[s.server] = p.userServers[s.server];
    fs.mkdirSync(LOCAL, { recursive: true });
    fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2)); // saved before removing, so the config is never lost
    step(['mcp', 'remove', s.server, '--scope', 'user'], undefined, `removed ${s.server} from user scope`);
  }
  console.log('Done. Restart the agent (new session) to load the new MCP configuration.');
}
