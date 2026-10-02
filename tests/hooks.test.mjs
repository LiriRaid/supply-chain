// Waymark hooks · scenario tests with synthetic transcripts. Run: node --test tests/*.test.mjs
// Every test uses a temporary WAYMARK_HOME; nothing reads or writes the real ~/.waymark or ~/.claude.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPTS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'waymark', 'scripts');
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'waymark-test-'));
process.env.WAYMARK_HOME = home;
const { taskIds, validId, decisionsIn, projectSlug, readLog, appendRecord, taskLines } = await import(`file://${SCRIPTS}/provenance.mjs`);
const { checkDecision } = await import(`file://${SCRIPTS}/tool-hook.mjs`);
const { checkCierre, cierreGaps, provenanceRecord } = await import(`file://${SCRIPTS}/stop-hook.mjs`);
const { taskLine } = await import(`file://${SCRIPTS}/rule0-hook.mjs`);
const { currentTurn } = await import(`file://${SCRIPTS}/transcript.mjs`);

const NOW = new Date(2026, 9, 2, 12, 0); // 2026-10-02 local
const DAY = '2026-10-02';
const FILE = '/work/proj/src/orders.service.mjs'; // a project file: not exempt, no spec folder on disk
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
});

test('task lines: from the third-last prompt', () => {
  const lines = [prompt('a'), say('x'), prompt('b'), prompt('c'), say('y'), prompt('d')];
  assert.equal(taskLines(lines).length, 4);
});

test('decision gate: denies the first L2 edit of a prompt once, then lets it through', () => {
  const state = path.join(home, `gate-${n++}.json`);
  const lines = [prompt('agrega reintentos', 'u1'), say('Waymark → L2 · dept-backend · skills: …'), call('Read', { file_path: FILE })];
  const deny = checkDecision(FILE, lines, 's1', state);
  assert.match(deny, /decision gate/);
  assert.match(deny, /AskUserQuestion/);
  assert.equal(checkDecision(FILE, lines, 's1', state), null, 'the retry passes');
  assert.match(checkDecision(FILE, [...lines, prompt('otra cosa', 'u2'), say('Waymark → L2 · dept-backend')], 's1', state) || '', /decision gate/, 'a new prompt is gated again');
});

test('decision gate: silent after a choice, at L1, for Q and for memory files', () => {
  const state = path.join(home, `gate-${n++}.json`);
  const asked = [prompt('agrega reintentos'), say('Waymark → L2 · dept-backend'), call('AskUserQuestion', { questions: [] }), answered('Q', ['A', 'B'], 'A')];
  assert.equal(checkDecision(FILE, asked, 's2', state), null);
  assert.equal(checkDecision(FILE, [prompt('typo'), say('Waymark → L1 · dept-frontend')], 's2', state), null);
  assert.equal(checkDecision(FILE, [prompt('¿cómo?'), say('Waymark → Q · dept-qa')], 's2', state), null);
  assert.equal(checkDecision(path.join(os.homedir(), '.waymark', 'projects', 'x.md'), [prompt('x'), say('Waymark → L3 · dept-architecture')], 's2', state), null);
});

// A complete L2 turn: routed, choice asked and answered, file edited, code-review run.
const l2 = (extra = []) => currentTurn([
  prompt('agrega reintentos al servicio de pedidos'), say('Waymark → L2 · dept-backend · skills: code-review'),
  call('AskUserQuestion', { questions: [] }), answered('¿Cómo?', ['Backoff', 'Cola'], 'Backoff'),
  call('Edit', { file_path: FILE }), call('Bash', { command: 'node --check src/orders.service.mjs' }), call('Skill', { skill: 'code-review' }), ...extra,
]);
const cierre = (id, decision = 'elegida Backoff · descartadas Cola', resultado = 'Resultado: hecho · ') =>
  `## Cierre · ${id}\n${resultado}Gates: node --check ✔ · Aprendido: "backoff ← timeouts" · engram: no disponible\nL2+: Decisión: ${decision} · Tests: sin infra (no hay specs en src) · Navegador: no (sin UI; check: ninguno) · Review: code-review orders.service.mjs sin hallazgos`;
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
  assert.match(checkCierre(l2(), cierre(id).replace(/Decisión: [^·]*· descartadas Cola · /, ''), undefined, undefined, ctxFor(cwd)), /Decisión: elegida/);
  const prompts = ['hazlo con backoff exponencial, nada de colas'];
  assert.equal(checkCierre(l2(), cierre(id, 'del usuario ("hazlo con backoff exponencial")'), undefined, prompts, ctxFor(cwd, [])), null);
  assert.match(checkCierre(l2(), cierre(id, 'del usuario ("usa una cola")'), undefined, prompts, ctxFor(cwd, [])), /own words/);
  assert.equal(checkCierre(l2(), cierre(id, 'única (el servicio ya expone retry())'), undefined, prompts, ctxFor(cwd, [])), null);
  assert.match(checkCierre(l2(), cierre(id, 'única'), undefined, prompts, ctxFor(cwd, [])), /única \(<why/);
});

test('Cierre: L1 needs no Decisión; older callers without ctx skip the ID check', () => {
  const turn = currentTurn([prompt('typo en el título'), say('Waymark → L1 · dept-frontend'), call('Edit', { file_path: FILE })]);
  assert.equal(checkCierre(turn, '## Cierre\nResultado: hecho · Gates: node --check ✔ · Aprendido: "x ← y" · engram: no disponible'), null);
});

test('provenance record: what the transcript proves, the hook assigns an ID when the reply has none', () => {
  const { cwd } = fresh();
  const ctx = ctxFor(cwd), turn = l2();
  const rec = provenanceRecord(turn, cierreGaps(turn, '## Cierre\nResultado: hecho', undefined, undefined, ctx), ctx, { session: 's', cwd });
  assert.equal(rec.id, ctx.ids.next);
  assert.equal(rec.idBy, 'hook');
  assert.deepEqual(rec.files, [FILE]);
  assert.deepEqual(rec.skills, ['code-review']);
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
const l2Lines = [prompt('agrega reintentos al servicio de pedidos'), say('Waymark → L2 · dept-backend · skills: code-review'), call('AskUserQuestion', { questions: [] }), answered('¿Cómo?', ['Backoff', 'Cola'], 'Backoff'), call('Edit', { file_path: FILE }), call('Skill', { skill: 'code-review' })];

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
