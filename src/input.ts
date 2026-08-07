import * as core from '@actions/core';

import { logWarning, stob } from './utils';

export type MentionOn = 'always' | 'failure' | 'never';

export interface Inputs {
  webhooks: string[];
  status: string;
  content: string;
  content_on_failure: string;
  mention_on: MentionOn;
  description: string;
  title: string;
  image: string;
  color?: number;
  url: string;
  username: string;
  avatar_url: string;
  nocontext: boolean;
  noprefix: boolean;
  notimestamp: boolean;
  ack_no_webhook: boolean;
  allowed_mentions?: object;
  job_results: string[];
}

interface StatusOption {
  status: string;
  color: number;
}

export const statusOpts: Record<string, StatusOption> = {
  success: {
    status: 'Success',
    color: 0x28a745,
  },
  failure: {
    status: 'Failure',
    color: 0xcb2431,
  },
  skipped: {
    status: 'Skipped',
    color: 0x95999c,
  },
  cancelled: {
    status: 'Cancelled',
    color: 0xdbab09,
  },
  timed_out: {
    status: 'Timed Out',
    color: 0xcb2431,
  },
  action_required: {
    status: 'Action Required',
    color: 0xdbab09,
  },
  neutral: {
    status: 'Neutral',
    color: 0x6c757d,
  },
  stale: {
    status: 'Stale',
    color: 0x6c757d,
  },
};

/** Statuses that should trigger failure-only mentions / content_on_failure. */
export const failureLikeStatuses = new Set(['failure', 'timed_out', 'action_required']);

/**
 * Priority used when aggregating multiple job conclusions (worst first).
 * Matches common workflow_run / needs.*.result aggregation patterns.
 */
export const jobResultPriority = [
  'failure',
  'timed_out',
  'cancelled',
  'action_required',
  'neutral',
  'success',
  'skipped',
  'stale',
] as const;

export function resolveStatusFromJobResults(results: string[]): string | undefined {
  const normalized = results.map((r) => r.trim().toLowerCase()).filter(Boolean);
  if (!normalized.length) {
    return undefined;
  }
  return jobResultPriority.find((p) => normalized.includes(p)) ?? normalized[0];
}

function parseJobResults(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
}

function parseMentionOn(raw: string): MentionOn {
  const value = raw.trim().toLowerCase() || 'always';
  if (value === 'always' || value === 'failure' || value === 'never') {
    return value;
  }
  throw new Error(`invalid mention_on value: ${raw} (expected always, failure, or never)`);
}

function parseAllowedMentions(raw: string): object | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('allowed_mentions must be a JSON object');
    }
    return parsed;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`invalid allowed_mentions JSON: ${message}`);
  }
}

/** Extract Discord user IDs from <@id> / <@!id> mention markup. */
export function extractMentionedUserIds(content: string): string[] {
  const ids = new Set<string>();
  const re = /<@!?(\d+)>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    ids.add(match[1]);
  }
  return [...ids];
}

export function shouldIncludeContent(status: string, mentionOn: MentionOn): boolean {
  if (mentionOn === 'never') {
    return false;
  }
  if (mentionOn === 'failure') {
    return failureLikeStatuses.has(status);
  }
  return true;
}

export function resolveContent(inputs: {
  status: string;
  content: string;
  content_on_failure: string;
  mention_on: MentionOn;
}): string {
  if (!shouldIncludeContent(inputs.status, inputs.mention_on)) {
    return '';
  }
  if (failureLikeStatuses.has(inputs.status) && inputs.content_on_failure) {
    return inputs.content_on_failure;
  }
  return inputs.content;
}

export function getInputs(): Inputs {
  // webhook
  const webhook: string = core.getInput('webhook').trim() || process.env.DISCORD_WEBHOOK || '';
  const webhooks: string[] = webhook.split('\n').filter((x) => x || false);
  // prevent webhooks from leak
  webhooks.forEach((w, i) => {
    core.setSecret(w);
    // if webhook has `/github` suffix, warn them (do not auto-fix)
    if (w.endsWith('/github')) {
      logWarning(
        `webhook ${i + 1}/${webhooks.length} has \`/github\` suffix! This may cause errors.`,
      );
    }
  });

  // nodetail -> nocontext, noprefix
  const nodetail = stob(core.getInput('nodetail'));
  const nocontext = nodetail || stob(core.getInput('nocontext'));
  const noprefix = nodetail || stob(core.getInput('noprefix'));

  const colorParsed = parseInt(core.getInput('color'));
  const job_results = parseJobResults(core.getInput('job_results'));
  const statusFromJobs = resolveStatusFromJobResults(job_results);
  const status = (statusFromJobs || core.getInput('status').trim().toLowerCase()).toLowerCase();

  const inputs: Inputs = {
    webhooks: webhooks,
    status,
    content: core.getInput('content').trim(),
    content_on_failure: core.getInput('content_on_failure').trim(),
    mention_on: parseMentionOn(core.getInput('mention_on')),
    description: core.getInput('description').trim(),
    title: (core.getInput('job') || core.getInput('title')).trim(),
    image: core.getInput('image').trim(),
    color: isNaN(colorParsed) ? undefined : colorParsed,
    url: core.getInput('url').trim(),
    username: core.getInput('username').trim(),
    avatar_url: core.getInput('avatar_url').trim(),
    nocontext: nocontext,
    noprefix: noprefix,
    notimestamp: stob(core.getInput('notimestamp')),
    ack_no_webhook: stob(core.getInput('ack_no_webhook')),
    allowed_mentions: parseAllowedMentions(core.getInput('allowed_mentions')),
    job_results,
  };

  // validate
  if (!inputs.webhooks.length && !inputs.ack_no_webhook) {
    throw new Error(
      'No webhook is given. If this is intended, you can suppress this error by setting `ack_no_webhook` to `true`.',
    );
  }
  if (!(inputs.status in statusOpts)) {
    throw new Error(`invalid status value: ${inputs.status}`);
  }

  return inputs;
}
