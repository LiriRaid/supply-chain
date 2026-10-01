#!/usr/bin/env node
// Poll a local URL (or bare port) until it answers over HTTP, then exit.
// No dependencies. Exit codes: 0 ready · 1 timed out · 2 bad arguments / non-local host.
//
//   node wait-for-port.mjs <url|port> [--timeout <seconds>] [--interval <ms>] [--status <code>]
//
// Any HTTP response counts as "ready" unless --status is given (e.g. --status 200).

import http from 'node:http';
import https from 'node:https';

const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|::1|.+\.localhost|.+\.test)$/i;

function usage(message) {
  if (message) console.error(`error: ${message}`);
  console.error('usage: node wait-for-port.mjs <url|port> [--timeout 60] [--interval 500] [--status 200]');
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { target: null, timeout: 60, interval: 500, status: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) usage(`${arg} needs a value`);
      return value;
    };
    if (arg === '--help' || arg === '-h') usage();
    else if (arg === '--timeout') opts.timeout = Number(next());
    else if (arg === '--interval') opts.interval = Number(next());
    else if (arg === '--status') opts.status = Number(next());
    else if (!opts.target) opts.target = arg;
    else usage(`unexpected argument "${arg}"`);
  }
  if (!opts.target) usage('missing <url|port>');
  if (!(opts.timeout > 0) || !(opts.interval > 0)) usage('timeout and interval must be positive numbers');
  return opts;
}

function toUrl(target) {
  const text = /^\d+$/.test(target) ? `http://localhost:${target}/` : target;
  let url;
  try {
    url = new URL(text.includes('://') ? text : `http://${text}`);
  } catch {
    usage(`not a valid url or port: ${target}`);
  }
  if (!LOCAL.test(url.hostname)) usage(`refusing non-local host "${url.hostname}" (local dev hosts only)`);
  return url;
}

function probe(url, wantStatus) {
  const client = url.protocol === 'https:' ? https : http;
  return new Promise((resolve) => {
    const req = client.get(url, { timeout: 3000, rejectUnauthorized: false }, (res) => {
      res.resume();
      resolve(wantStatus === null || res.statusCode === wantStatus ? res.statusCode : false);
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(false));
  });
}

const opts = parseArgs(process.argv.slice(2));
const url = toUrl(opts.target);
const deadline = Date.now() + opts.timeout * 1000;
const started = Date.now();

while (true) {
  const status = await probe(url, opts.status);
  if (status !== false) {
    console.log(`ready ${url.href} (HTTP ${status}) after ${((Date.now() - started) / 1000).toFixed(1)}s`);
    process.exit(0);
  }
  if (Date.now() >= deadline) {
    console.error(`timeout: ${url.href} did not answer within ${opts.timeout}s`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, opts.interval));
}
