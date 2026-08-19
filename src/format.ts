import { logDebug } from './utils';

type Formatter = (payload: any) => string;

const formatters: Record<string, Formatter> = {
  push: pushFormatter,
  pull_request: pullRequestFormatter,
  release: releaseFormatter,
  workflow_dispatch: workflowDispatchFormatter,
  schedule: scheduleFormatter,
  workflow_run: workflowRunFormatter,
  issues: issuesFormatter,
};

export function formatEvent(event: string, payload: object): string {
  logDebug(JSON.stringify(payload, null, 2));
  let msg: string = 'No further information';
  if (event in formatters) {
    try {
      return formatters[event](payload) || msg;
    } catch (e: any) {
      logDebug(`Failed to generate eventDetail for ${event}: ${e}\n${e.stack}`);
    }
  }

  return msg;
}

export function formatRef(ref: string): string {
  if (ref.startsWith('refs/heads/')) {
    return ref.slice('refs/heads/'.length);
  }
  if (ref.startsWith('refs/tags/')) {
    return ref.slice('refs/tags/'.length);
  }
  return ref;
}

function pushFormatter(payload: any): string {
  return `[\`${payload.head_commit.id.substring(0, 7)}\`](${payload.head_commit.url}) ${payload.head_commit.message}`;
}

function pullRequestFormatter(payload: any): string {
  return `[\`#${payload.pull_request.number}\`](${payload.pull_request.html_url}) ${payload.pull_request.title}`;
}

function releaseFormatter(payload: any): string {
  const { name, body } = payload.release;
  const nameText = name ? `**${name}**` : '';
  return `${nameText}${nameText && body ? '\n' : ''}${body || ''}`;
}

function workflowDispatchFormatter(payload: any): string {
  const inputs = payload.inputs;
  if (!inputs || typeof inputs !== 'object') {
    return 'Manual workflow dispatch';
  }
  const entries = Object.entries(inputs)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `\`${key}\`: ${String(value)}`);
  return entries.length ? entries.join('\n') : 'Manual workflow dispatch';
}

function scheduleFormatter(payload: any): string {
  const cron = payload.schedule;
  return cron ? `Scheduled run (\`${cron}\`)` : 'Scheduled run';
}

function workflowRunFormatter(payload: any): string {
  const run = payload.workflow_run;
  if (!run) {
    return 'No further information';
  }
  const name = run.name || run.display_title || 'workflow';
  const conclusion = run.conclusion || run.status || '';
  const url = run.html_url;
  const label = conclusion ? `${name} (${conclusion})` : name;
  return url ? `[${label}](${url})` : label;
}

function issuesFormatter(payload: any): string {
  const issue = payload.issue;
  if (!issue) {
    return 'No further information';
  }
  const action = payload.action ? `${payload.action} ` : '';
  return `${action}[\`#${issue.number}\`](${issue.html_url}) ${issue.title}`;
}
