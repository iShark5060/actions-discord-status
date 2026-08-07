import { existsSync, readFileSync } from 'fs';

interface Context {
  payload: { [key: string]: any };
  eventName: string;
  ref: string;
  sha: string;
  workflow: string;
  actor: string;
  serverUrl: string;
  runId: number;
  job: string;
  repo: {
    owner: string;
    repo: string;
  };
}

function readPayload(): { [key: string]: any } {
  const path = process.env.GITHUB_EVENT_PATH;
  if (path && existsSync(path)) {
    return JSON.parse(readFileSync(path, { encoding: 'utf8' }));
  }
  return {};
}

function readRepo(payload: { [key: string]: any }): { owner: string; repo: string } {
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    return { owner, repo };
  }
  if (payload.repository) {
    return { owner: payload.repository.owner.login, repo: payload.repository.name };
  }
  return { owner: '', repo: '' };
}

// Minimal replacement for `@actions/github`'s `context`, reading only the
// fields this action needs directly from the runner environment. This avoids
// pulling in the whole Octokit dependency tree just to read context.
export function getContext(): Context {
  const payload = readPayload();
  return {
    payload,
    eventName: process.env.GITHUB_EVENT_NAME || '',
    ref: process.env.GITHUB_REF || '',
    sha: process.env.GITHUB_SHA || '',
    workflow: process.env.GITHUB_WORKFLOW || '',
    actor: process.env.GITHUB_ACTOR || '',
    serverUrl: process.env.GITHUB_SERVER_URL || 'https://github.com',
    runId: parseInt(process.env.GITHUB_RUN_ID || '0', 10),
    job: process.env.GITHUB_JOB || '',
    repo: readRepo(payload),
  };
}
