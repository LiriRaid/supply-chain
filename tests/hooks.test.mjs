// Waymark hooks · scenario tests with synthetic transcripts. Run: node --test tests/*.test.mjs
// Every test uses a temporary WAYMARK_HOME; nothing reads or writes the real ~/.waymark or ~/.claude.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPTS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'waymark', 'scripts');
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'waymark-test-'));
process.env.WAYMARK_HOME = home;
const temps = [home];
after(() => { for (const d of temps) fs.rmSync(d, { recursive: true, force: true }); });
const { taskIds, validId, decisionsIn, projectSlug, readLog, appendRecord, taskLines, verifyChain, turnInputs, commitsFor, gitSnapshot, snapshotDiff, mutatesFiles, changesProject } = await import(`file://${SCRIPTS}/provenance.mjs`);
const { checkDecision } = await import(`file://${SCRIPTS}/tool-hook.mjs`);
const { checkCierre, cierreGaps, provenanceRecord } = await import(`file://${SCRIPTS}/stop-hook.mjs`);
const { taskLine } = await import(`file://${SCRIPTS}/rule0-hook.mjs`);
const { currentTurn, routedLevel, routedDept } = await import(`file://${SCRIPTS}/transcript.mjs`);

const NOW = new Date(2026, 9, 2, 12, 0); // 2026-10-02 local
const DAY = '2026-10-02';
const FILE = '/work/proj/src/orders.service.mjs'; // a project file: not exempt, no spec folder on disk
const PROC = (dept) => call('Read', { file_path: `/skills/${dept}/procedures.md` }); // the owner's procedure, read
let n = 0;
const fresh = () => { const cwd = `/work/proj-${++n}`; return { cwd, log: path.join(home, 'provenance', `proj-${n}.jsonl`) }; };

// Synthetic transcript lines (Claude Code .jsonl shapes).
const prompt = (text, uuid = `p${Math.random()}`) => ({ type: 'user', uuid, message: { role: 'user', content: text } });
const say = (text) => ({ type: 'assistant', message: { content: [{ type: 'text', text }] } });
const call = (name, input = {}) => ({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
const answered = (question, labels, chosen) => ({ type: 'user', message: { content: [{ type: 'tool_result', content: 'answered' }] }, toolUseResult: { questions: [{ question, options: labels.map((label) => ({ label })) }], answers: { [question]: chosen } } });
const record = (cwd, id) => appendRecord(cwd, { id });

test('task IDs: first of the day, next number, follow-up letters', () => {
  const { cwd } = fresh();
  assert.deepEqual([taskIds(cwd, NOW).next, taskIds(cwd, NOW).followUp], [`${DAY} · T1`, null]);
  record(cwd, `${DAY} · T1`); record(cwd, `${DAY} · T2`); record(cwd, `${DAY} · T2b`);
  const ids = taskIds(cwd, NOW);
  assert.equal(ids.next, `${DAY} · T3`);
  assert.equal(ids.last, `${DAY} · T2`);
  assert.equal(ids.followUp, `${DAY} · T2c`);
  assert.equal(taskIds(cwd, new Date(2026, 9, 3, 9)).next, '2026-10-03 · T1', 'the counter restarts each day');
  assert.ok(validId(`${DAY} · T3`, ids));
  assert.ok(validId(`${DAY} · T1b`, ids), 'a follow-up of an older recorded task');
  assert.ok(!validId(`${DAY} · T2b`, ids), 'already recorded');
  assert.ok(!validId(`${DAY} · T9`, ids), 'never offered');
  assert.ok(!validId(`${DAY} · T7b`, ids), 'follow-up of a task that does not exist');
});

test('project slug: the project memory whose Path holds the folder, else the folder name', () => {
  fs.mkdirSync(path.join(home, 'projects'), { recursive: true });
  fs.writeFileSync(path.join(home, 'projects', 'shop-api.md'), '# Project: shop-api\n\nPath: C:/Work/Shop API\n');
  assert.equal(projectSlug('c:\\work\\shop api\\src'), 'shop-api');
  assert.equal(projectSlug('/home/me/My App'), 'my-app');
});

test('decisions: chosen and discarded options from the choice window', () => {
  const d = decisionsIn([answered('¿Dónde?', ['Hook (Recomendado)', 'Respuesta', 'Agente'], 'Hook (Recomendado)')]);
  assert.deepEqual(d, [{ question: '¿Dónde?', chosen: 'Hook (Recomendado)', discarded: ['Respuesta', 'Agente'] }]);
  // Multi-select: Claude Code joins the labels with "," and no space (observed in this repo's own session).
  const m = decisionsIn([answered('¿Qué piezas?', ['Manifiesto (Recomendado)', 'Trailer (Recomendado)', 'Cadena', 'Verify'], 'Manifiesto (Recomendado),Trailer (Recomendado),Cadena')]);
  assert.deepEqual(m[0].discarded, ['Verify']);
  const s = decisionsIn([answered('¿Cómo?', ['Cola', 'Cola con reintentos'], 'Cola con reintentos')]);
  assert.deepEqual(s[0].discarded, ['Cola'], 'a label inside another label is still discarded');
});

test('chained log: each record links the previous one; an edited record breaks the chain', () => {
  const { cwd, log } = fresh();
  record(cwd, `${DAY} · T1`); record(cwd, `${DAY} · T2`); record(cwd, `${DAY} · T3`);
  const recs = readLog(cwd);
  assert.equal(recs[0].prev, null);
  assert.equal(recs[1].prev, recs[0].hash);
  assert.deepEqual(verifyChain(recs), { ok: true });
  const tampered = fs.readFileSync(log, 'utf8').replace(`${DAY} · T2"`, `${DAY} · T9"`);
  fs.writeFileSync(log, tampered);
  assert.deepEqual(verifyChain(readLog(cwd)), { ok: false, at: 1 });
  assert.deepEqual(verifyChain(readLog(cwd).filter((_, i) => i !== 1)), { ok: false, at: 1 }, 'a deleted record breaks it too');
});

test('inputs manifest: Waymark and agent version, model, MCP servers used', () => {
  const lines = [{ ...prompt('x'), version: '2.1.300' }, { type: 'assistant', message: { model: 'claude-opus-5-5', content: [{ type: 'tool_use', name: 'mcp__engram__mem_search', input: {} }, { type: 'tool_use', name: 'Read', input: {} }] } }];
  const inputs = turnInputs(lines, home);
  assert.equal(inputs.waymark, fs.readFileSync(path.join(SCRIPTS, '..', 'VERSION'), 'utf8').trim());
  assert.equal(inputs.agent, '2.1.300');
  assert.equal(inputs.model, 'claude-opus-5-5');
  assert.deepEqual(inputs.mcp, ['engram']);
  assert.equal(inputs.instructions.project, null);
});

test('commits: found by their Waymark-Task trailer', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'waymark-git-'));
  temps.push(repo);
  const git = (...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: repo, encoding: 'utf8' });
  git('init', '-q');
  git('commit', '-q', '--allow-empty', '-m', `feat: x\n\nWaymark-Task: ${DAY} · T4`);
  git('commit', '-q', '--allow-empty', '-m', 'chore: no trailer');
  const hits = commitsFor(repo, `${DAY} · T4`);
  assert.equal(hits.length, 1);
  assert.match(hits[0], /^[0-9a-f]{40}$/);
  assert.deepEqual(commitsFor(repo, `${DAY} · T5`), []);
  assert.deepEqual(commitsFor(path.join(home, 'no-repo'), `${DAY} · T4`), []);
});

test('task lines: from the third-last prompt', () => {
  const lines = [prompt('a'), say('x'), prompt('b'), prompt('c'), say('y'), prompt('d')];
  assert.equal(taskLines(lines).length, 4);
});

test('decision gate (strict): denies every change until the user was asked in the choice window', () => {
  const state = path.join(home, `gate-${n++}.json`);
  const lines = [prompt('agrega reintentos', 'u1'), say('Waymark → L2 · dept-backend · skills: …'), call('Read', { file_path: FILE })];
  const deny = checkDecision(FILE, lines, 's1', state);
  assert.match(deny, /decision gate/);
  assert.match(deny, /AskUserQuestion/);
  assert.match(checkDecision(FILE, lines, 's1', state) || '', /decision gate/, 'the retry is denied too');
  assert.match(checkDecision(FILE, [...lines, prompt('otra cosa', 'u2'), say('Waymark → L2 · dept-backend')], 's1', state) || '', /decision gate/, 'a new prompt is gated again');
});

test('decision gate: L1 too (the user decides every real decision); silent after a choice, for Q and for memory files', () => {
  const state = path.join(home, `gate-${n++}.json`);
  const asked = [prompt('agrega reintentos'), say('Waymark → L2 · dept-backend'), PROC('dept-backend'), call('AskUserQuestion', { questions: [] }), answered('Q', ['A', 'B'], 'A')];
  assert.equal(checkDecision(FILE, asked, 's2', state), null);
  assert.match(checkDecision(FILE, [prompt('typo'), say('Waymark → L1 · dept-frontend')], 's2', state) || '', /L1 decision gate/);
  assert.equal(checkDecision(FILE, [prompt('¿cómo?'), say('Waymark → Q · dept-qa')], 's2', path.join(home, `gate-${n++}.json`)) === null, false, 'a Q turn that edits is stopped');
  assert.equal(checkDecision(path.join(os.homedir(), '.waymark', 'projects', 'x.md'), [prompt('x'), say('Waymark → L3 · dept-architecture')], 's2', state), null);
});

test('decision gate: a turn routed Q that edits must re-route (once), then the normal gate applies', () => {
  const state = path.join(home, `gate-${n++}.json`);
  const q = [prompt('¿se puede mover el modal?', 'uq'), say('Waymark → Q · dept-frontend · skills: dept-frontend')];
  assert.match(checkDecision(FILE, q, 's3', state), /routed as a question/);
  assert.match(checkDecision(FILE, q, 's3', state) || '', /L2 decision gate|decision gate/, 'after the re-route notice the strict gate still applies');
  assert.match(checkDecision(FILE, [...q, say('Waymark → L2 · dept-frontend · skills: ui-build')], 's3', state) || '', /L2 decision gate/, 'the last routing line wins');
  assert.match(checkDecision(FILE, [...q, call('Skill', { skill: 'dept-frontend', args: 'L2' })], 's3', state) || '', /L2 decision gate/, 'a re-route by tool call wins (mid-turn text is not persisted)');
});

test('decision gate: the owner department procedure is read before the first change (once per prompt)', () => {
  const state = path.join(home, `gate-${n++}.json`);
  const asked = [prompt('agrega reintentos', 'up'), say('Waymark → L2 · dept-backend'), call('AskUserQuestion'), answered('Q', ['A', 'B'], 'A')];
  assert.match(checkDecision(FILE, asked, 's4', state), /dept-backend\/procedures\.md/);
  assert.equal(checkDecision(FILE, asked, 's4', state), null, 'once');
  assert.equal(checkDecision(FILE, [...asked, PROC('dept-backend')], 's4', path.join(home, `gate-${n++}.json`)), null);
});

test('decision gate: shell commands that change project files are gated like edits', () => {
  const state = path.join(home, `gate-${n++}.json`);
  const lines = [prompt('quita el toggle', 'ub'), say('Waymark → L1 · dept-frontend')];
  assert.match(checkDecision({ command: 'git checkout HEAD -- src/app/modal.html src/app/modal.ts' }, lines, 's5', state) || '', /decision gate/);
  assert.equal(checkDecision({ command: 'npx vitest run src/app 2>&1 | tail -5' }, lines, 's5', state), null, 'read-only commands pass');
  assert.equal(checkDecision({ command: 'rm -rf "$T"; mktemp -d' }, lines, 's5', state), null, 'temp work passes');
});

test('shell mutations: what counts as changing files', () => {
  for (const c of ['git checkout HEAD -- a.ts', 'git restore a.ts', "sed -i 's/a/b/' x.ts", 'rm src/a.ts', 'echo x > src/a.ts', 'Set-Content src/a.ts x', 'git reset --hard']) assert.ok(mutatesFiles(c), c);
  for (const c of ['git status --short', 'npx tsc --noEmit 2>&1 | tail', 'grep -n x a.ts > /dev/null', 'git checkout develop', 'cat a.ts', 'node x.mjs 2>$null']) assert.ok(!mutatesFiles(c), c);
  assert.ok(!changesProject('rm -rf "$TMP/wm-1"'), 'temp folders are not the project');
  assert.ok(!changesProject('rm -rf /tmp/wm-1 C:/Users/u/AppData/Local/Temp/x'), 'system temp paths');
  assert.ok(changesProject('rm src/app/templates/old.html'), 'src/templates is the project, not temp');
  assert.ok(mutatesFiles('echo x > src/templates/a.html'), 'a redirect into src/templates changes the project');
});

test('git snapshot: files changed between the prompt and the end of the turn, by any tool', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'waymark-git-'));
  temps.push(repo);
  const git = (...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: repo, encoding: 'utf8' });
  git('init', '-q');
  for (const f of ['a.ts', 'b.ts', 'c.ts']) fs.writeFileSync(path.join(repo, f), f);
  git('add', '.'); git('commit', '-q', '-m', 'init');
  fs.writeFileSync(path.join(repo, 'a.ts'), 'dirty before the prompt');
  fs.writeFileSync(path.join(repo, 'b.ts'), 'dirty before, untouched by the turn');
  const before = gitSnapshot(repo);
  git('checkout', '-q', 'HEAD', '--', 'a.ts'); // reverted by the shell: back to clean
  fs.writeFileSync(path.join(repo, 'c.ts'), 'changed by the turn');
  fs.writeFileSync(path.join(repo, 'new.spec.ts'), 'untracked, new');
  const changed = snapshotDiff(before, gitSnapshot(repo)).map((p) => path.basename(p)).sort();
  assert.deepEqual(changed, ['a.ts', 'c.ts', 'new.spec.ts']);
  assert.equal(gitSnapshot(path.join(home, 'no-repo')), null);
});

// A complete L2 turn: routed, department invoked, choice asked and answered, file edited, code-review run.
const l2 = (extra = []) => currentTurn([
  prompt('agrega reintentos al servicio de pedidos'), say('Waymark → L2 · dept-backend · skills: code-review'), call('Skill', { skill: 'dept-backend' }), PROC('dept-backend'),
  call('AskUserQuestion', { questions: [] }), answered('¿Cómo?', ['Backoff', 'Cola'], 'Backoff'),
  call('Edit', { file_path: FILE }), call('Bash', { command: 'node --check src/orders.service.mjs' }), call('Skill', { skill: 'code-review' }), ...extra,
]);
const cierre = (id, decision = 'elegida Backoff · descartadas Cola', resultado = 'Resultado: hecho · ', sub = 'ninguna') =>
  `## Cierre · ${id}\n${resultado}Decisión: ${decision}\nSub-decisiones: ${sub}\nMemoria: digest · Procedimiento: Retries (procedures.md:12)\nGates: node --check ✔ · Aprendido: "backoff ← timeouts" · engram: no disponible\nL2+: Tests: sin infra (no hay specs en src) · Navegador: no (sin UI; check: ninguno) · Review: code-review orders.service.mjs sin hallazgos`;
const ctxFor = (cwd, decisions = [{ question: '¿Cómo?', chosen: 'Backoff', discarded: ['Cola'] }]) => ({ ids: taskIds(cwd), decisions });

test('Cierre: a complete L2 record passes', () => {
  const { cwd } = fresh();
  const ids = taskIds(cwd);
  assert.equal(checkCierre(l2(), cierre(ids.next), undefined, undefined, ctxFor(cwd)), null);
});

test('Cierre: task ID missing or reused, Resultado missing', () => {
  const { cwd } = fresh();
  record(cwd, `${taskIds(cwd).next}`);
  const ids = taskIds(cwd);
  const noId = checkCierre(l2(), cierre('').replace('## Cierre · ', '## Cierre'), undefined, undefined, ctxFor(cwd));
  assert.match(noId, /task ID in the heading/);
  assert.ok(noId.includes(ids.next) && noId.includes(ids.followUp), 'it offers both IDs');
  assert.match(checkCierre(l2(), cierre(ids.last), undefined, undefined, ctxFor(cwd)), /already recorded/);
  assert.match(checkCierre(l2(), cierre(ids.followUp, undefined, ''), undefined, undefined, ctxFor(cwd)), /Resultado:/);
});

test('Cierre: Decisión must be backed', () => {
  const { cwd } = fresh();
  const id = taskIds(cwd).next;
  assert.match(checkCierre(l2(), cierre(id), undefined, undefined, ctxFor(cwd, [])), /no choice-window answer/);
  assert.match(checkCierre(l2(), cierre(id).replace(/Decisión: [^\n]*\n/, ''), undefined, undefined, ctxFor(cwd)), /Decisión: elegida/);
  const prompts = ['hazlo con backoff exponencial, nada de colas'];
  assert.equal(checkCierre(l2(), cierre(id, 'del usuario ("hazlo con backoff exponencial")'), undefined, prompts, ctxFor(cwd, [])), null);
  assert.match(checkCierre(l2(), cierre(id, 'del usuario ("usa una cola")'), undefined, prompts, ctxFor(cwd, [])), /own words/);
  assert.equal(checkCierre(l2(), cierre(id, 'única (el servicio ya expone retry())'), undefined, prompts, ctxFor(cwd, [])), null);
  assert.match(checkCierre(l2(), cierre(id, 'única'), undefined, prompts, ctxFor(cwd, [])), /única \(<why/);
});

test('Cierre: L1 needs Decisión too; older callers without ctx skip the ID check', () => {
  const turn = currentTurn([prompt('typo en el título'), say('Waymark → L1 · dept-frontend'), call('Skill', { skill: 'dept-frontend' }), PROC('dept-frontend'), call('Edit', { file_path: FILE }), call('Bash', { command: 'npx eslint src/orders.service.mjs' })]);
  const base = '## Cierre\nResultado: hecho · Gates: eslint ✔ · Aprendido: "x ← y" · engram: no disponible\nSub-decisiones: ninguna\nMemoria: digest · Procedimiento: Styling (procedures.md:30)';
  assert.match(checkCierre(turn, base), /Decisión:/);
  assert.equal(checkCierre(turn, `${base}\nDecisión: única (un solo texto que corregir)`), null);
});

test('Cierre: a turn routed Q that changed files is checked as L2 and must re-route', () => {
  const close = '## Cierre\nResultado: hecho · Decisión: única (x y z) · Sub-decisiones: ninguna · Memoria: digest · Procedimiento: Styling (procedures.md:30) · Gates: ✔ · Aprendido: "a ← b" · engram: no disponible';
  const head = [prompt('¿se puede mover el modal?'), say('Waymark → Q · dept-frontend · skills: dept-frontend'), call('Skill', { skill: 'dept-frontend' }), PROC('dept-frontend')];
  const tail = [call('Edit', { file_path: FILE }), call('Bash', { command: 'npx eslint src' })];
  const r = checkCierre(currentTurn([...head, ...tail]), close);
  assert.match(r, /this L2 turn/);
  assert.match(r, /routed as a question/);
  assert.match(r, /Review:/, 'L2 fields are required');
  assert.equal(checkCierre(currentTurn([...head, say('Waymark → L1 · dept-frontend · skills: dept-frontend'), ...tail]), close), null, 're-routed to L1 mid-turn (text)');
  assert.equal(checkCierre(currentTurn([...head, call('Skill', { skill: 'dept-frontend', args: 'L1' }), ...tail]), close), null, 're-routed to L1 by tool call');
});

test('routing: a routing line quoted mid-sentence does not override the real one', () => {
  const texts = ['Waymark → L2 · dept-devex · skills: dept-devex', 'Evidencia: la única línea de ruta fue `Waymark → Q · dept-frontend`, ver transcript'];
  assert.equal(routedLevel(texts), 2);
  assert.equal(routedDept(texts), 'dept-devex');
  assert.equal(routedLevel([...texts, 'Waymark → L1 · dept-qa · skills: …']), 1, 'a real re-route still wins');
});

test('Cierre: Sub-decisiones listed, none taken alone, as many asked as answered', () => {
  const { cwd } = fresh();
  const id = taskIds(cwd).next, ctx = ctxFor(cwd);
  assert.match(checkCierre(l2(), cierre(id).replace(/Sub-decisiones: ninguna\n/, ''), undefined, undefined, ctx), /Sub-decisiones:/);
  assert.match(checkCierre(l2(), cierre(id, undefined, undefined, 'íconos en modales angostos → no preguntada'), undefined, undefined, ctx), /taken without asking/);
  assert.match(checkCierre(l2(), cierre(id, undefined, undefined, 'textos de botones → preguntada'), undefined, undefined, ctx), /claim 2 decisions asked but the choice window answered 1/);
  assert.equal(checkCierre(l2(), cierre(id, undefined, undefined, 'textos de botones → del usuario ("que diga Izquierda, Centro, Derecha")'), undefined, ['ok'], ctx), null);
  assert.match(checkCierre(l2(), cierre(id, undefined, undefined, 'íconos'), undefined, undefined, ctx), /each item needs/);
});

test('Cierre: the routing line\'s department must have been invoked; the record keeps it', () => {
  const { cwd } = fresh();
  const id = taskIds(cwd).next, ctx = ctxFor(cwd);
  const noDept = currentTurn([prompt('x'), say('Waymark → L2 · dept-frontend · skills: ui-build'), call('AskUserQuestion'), answered('¿Cómo?', ['Backoff', 'Cola'], 'Backoff'), call('Edit', { file_path: FILE }), call('Skill', { skill: 'code-review' })]);
  assert.match(checkCierre(noDept, cierre(id), undefined, undefined, ctx), /names dept-frontend but it was never invoked/);
  const gaps = cierreGaps(l2(), cierre(id), undefined, undefined, ctx);
  assert.deepEqual(provenanceRecord(l2(), gaps, ctx, {}).department, { declared: 'dept-backend', invoked: ['dept-backend'] });
});

test('Cierre: Memoria and Procedimiento are backed by real reads', () => {
  const { cwd } = fresh();
  const id = taskIds(cwd).next, ctx = ctxFor(cwd);
  assert.match(checkCierre(l2(), cierre(id).replace(/Memoria: digest · Procedimiento: [^\n]*\n/, ''), undefined, undefined, ctx), /Procedimiento: <section>[\s\S]*Memoria: digest/);
  assert.match(checkCierre(l2(), cierre(id).replace('procedures.md:12', 'procedures.md'), undefined, undefined, ctx), /needs the file and line/);
  const leida = cierre(id).replace('Memoria: digest', 'Memoria: leída');
  assert.match(checkCierre(l2(), leida, undefined, undefined, ctx), /not opened before the first change/);
  const opened = currentTurn([prompt('x'), say('Waymark → L2 · dept-backend'), call('Skill', { skill: 'dept-backend' }), PROC('dept-backend'), call('Read', { file_path: path.join(os.homedir(), '.waymark', 'projects', 'shop.md') }), call('AskUserQuestion'), answered('¿Cómo?', ['Backoff', 'Cola'], 'Backoff'), call('Edit', { file_path: FILE }), call('Bash', { command: 'node --check src/orders.service.mjs' }), call('Skill', { skill: 'code-review' })]);
  assert.equal(checkCierre(opened, leida, undefined, undefined, ctx), null);
  const noProc = currentTurn([prompt('x'), say('Waymark → L2 · dept-backend'), call('Skill', { skill: 'dept-backend' }), call('AskUserQuestion'), answered('¿Cómo?', ['Backoff', 'Cola'], 'Backoff'), call('Edit', { file_path: FILE }), call('Bash', { command: 'node --check x' }), call('Skill', { skill: 'code-review' })]);
  assert.match(checkCierre(noProc, cierre(id), undefined, undefined, ctx), /never read in this session \(dept-backend\/procedures\.md\)/);
});

test('Cierre: gates run after the last change (typecheck after code, tests after a spec)', () => {
  const { cwd } = fresh();
  const id = taskIds(cwd).next, ctx = ctxFor(cwd);
  assert.match(checkCierre(l2([call('Edit', { file_path: '/work/proj/src/late.ts' })]), cierre(id), undefined, undefined, ctx), /no typecheck, lint or build ran after the last code change/);
  assert.match(checkCierre(l2([call('Bash', { command: 'npx vitest run src' }), call('Write', { file_path: '/work/proj/src/a.spec.ts' }), call('Bash', { command: 'npx tsc --noEmit' })]), cierre(id).replace('Tests: sin infra (no hay specs en src)', 'Tests: verde'), undefined, undefined, ctx), /spec changed after the last test run/);
  assert.match(checkCierre(l2([call('Bash', { command: 'git checkout HEAD -- src/a.ts' })]), cierre(id), undefined, undefined, { ...ctx, gitChanged: ['/work/proj/src/a.ts'] }), /after the last code change/, 'a shell change counts as a change');
});

test('Cierre: files changed through the shell are checked and recorded', () => {
  const { cwd } = fresh();
  const ctx = { ...ctxFor(cwd), gitChanged: ['/work/proj/src/modal.html', '/work/proj/src/modal.ts'] };
  const turn = currentTurn([prompt('x'), say('Waymark → L2 · dept-frontend'), call('Skill', { skill: 'dept-frontend' }), call('Bash', { command: 'git checkout HEAD -- src/modal.html src/modal.ts' })]);
  const gaps = cierreGaps(turn, '## Cierre\nResultado: hecho', undefined, undefined, ctx);
  assert.deepEqual(gaps.changed, ['/work/proj/src/modal.html', '/work/proj/src/modal.ts']);
  assert.ok(gaps.missing.some((m) => /code-review/.test(m)), 'shell-changed code still needs review');
});

test('Cierre: a commit made in the turn needs the Waymark-Task trailer', () => {
  const { cwd } = fresh();
  const id = taskIds(cwd).next, withCommit = l2([call('Bash', { command: 'git add -A && git commit -F msg.txt' })]);
  assert.match(checkCierre(withCommit, cierre(id), undefined, undefined, { ...ctxFor(cwd), commits: [] }), /Waymark-Task/);
  assert.equal(checkCierre(withCommit, cierre(id), undefined, undefined, { ...ctxFor(cwd), commits: ['abc'] }), null);
  assert.equal(checkCierre(l2(), cierre(id), undefined, undefined, { ...ctxFor(cwd), commits: [] }), null, 'no commit, no trailer needed');
});

test('provenance record: what the transcript proves, the hook assigns an ID when the reply has none', () => {
  const { cwd } = fresh();
  const ctx = ctxFor(cwd), turn = l2();
  const rec = provenanceRecord(turn, cierreGaps(turn, '## Cierre\nResultado: hecho', undefined, undefined, ctx), ctx, { session: 's', cwd });
  assert.equal(rec.id, ctx.ids.next);
  assert.equal(rec.idBy, 'hook');
  assert.deepEqual(rec.files, [FILE]);
  assert.deepEqual(rec.skills, ['dept-backend', 'code-review']);
  assert.equal(rec.decisions[0].chosen, 'Backoff');
  assert.ok(rec.unresolved.length > 0);
});

test('per-prompt line: new task and follow-up IDs', () => {
  const { cwd } = fresh();
  assert.match(taskLine(cwd, NOW), new RegExp(`new task → ${DAY} · T1\\.$`));
  record(cwd, `${DAY} · T1`);
  assert.match(taskLine(cwd, NOW), new RegExp(`new task → ${DAY} · T2 · follow-up of ${DAY} · T1 → ${DAY} · T1b`));
});

// End to end: the Stop hook as Claude Code runs it (stdin JSON, transcript file).
function runStop(lines, last, extra = {}) {
  const { cwd, log } = fresh();
  const transcript = path.join(home, `t-${n}.jsonl`);
  fs.writeFileSync(transcript, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  const r = spawnSync(process.execPath, [path.join(SCRIPTS, 'stop-hook.mjs')], { input: JSON.stringify({ transcript_path: transcript, cwd, session_id: 's9', last_assistant_message: last, ...extra }), env: { ...process.env, WAYMARK_HOME: home }, encoding: 'utf8' });
  return { out: r.stdout, records: fs.existsSync(log) ? readLog(cwd) : [], ids: taskIds(cwd) };
}
const l2Lines = [prompt('agrega reintentos al servicio de pedidos'), say('Waymark → L2 · dept-backend · skills: code-review'), call('Skill', { skill: 'dept-backend' }), PROC('dept-backend'), call('AskUserQuestion', { questions: [] }), answered('¿Cómo?', ['Backoff', 'Cola'], 'Backoff'), call('Edit', { file_path: FILE }), call('Bash', { command: 'node --check src/orders.service.mjs' }), call('Skill', { skill: 'code-review' })];

test('stop hook: a backed Cierre is recorded and not blocked', () => {
  const id = `${new Date().toLocaleDateString('sv')} · T1`;
  const { out, records } = runStop(l2Lines, cierre(id));
  assert.equal(out, '');
  assert.equal(records.length, 1);
  assert.equal(records[0].id, id);
  assert.deepEqual(records[0].unresolved, []);
  assert.match(records[0].cierre, /^## Cierre · /);
});

test('stop hook: an unbacked Cierre is blocked once, then recorded with what stayed unbacked', () => {
  const first = runStop(l2Lines, '## Cierre\nGates: ✔');
  assert.equal(JSON.parse(first.out).decision, 'block');
  assert.equal(first.records.length, 0);
  const second = runStop(l2Lines, '## Cierre\nGates: ✔', { stop_hook_active: true });
  assert.equal(second.out, '');
  assert.equal(second.records.length, 1);
  assert.equal(second.records[0].idBy, 'hook');
  assert.ok(second.records[0].unresolved.some((m) => /Resultado/.test(m)));
});

test('stop hook: the block reason fed back as a user line does not split the turn', () => {
  const fed = { type: 'user', message: { role: 'user', content: 'Stop hook feedback:\nWaymark: this L2 turn changed files but its Cierre is not backed…' } };
  const second = runStop([...l2Lines, say('## Cierre'), fed], '## Cierre\nGates: ✔', { stop_hook_active: true });
  assert.equal(second.records.length, 1);
  assert.deepEqual(second.records[0].files, [FILE]);
});

test('stop hook: Q turns and turns without project edits leave no record', () => {
  assert.equal(runStop([prompt('¿qué hace esto?'), say('Waymark → Q · dept-qa'), call('Read', { file_path: FILE })], 'Respuesta').records.length, 0);
});
