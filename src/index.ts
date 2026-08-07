import { endGroup, startGroup, setOutput } from '@actions/core';

import { getContext } from './context';
import { formatEvent, formatRef } from './format';
import { extractMentionedUserIds, getInputs, Inputs, resolveContent, statusOpts } from './input';
import { logDebug, logError, logInfo } from './utils';
import { fitContent, fitEmbed } from './validate';

async function run() {
  let payloadStr = '';
  try {
    logInfo('Getting inputs...');
    const inputs = getInputs();

    logInfo('Generating payload...');
    const payload = getPayload(inputs);
    payloadStr = JSON.stringify(payload, null, 2);
    startGroup(
      'Dump payload (You can access the payload as `${{ steps.<step_id>.outputs.payload }}` in latter steps)',
    );
    logInfo(payloadStr);
    endGroup();

    // Always expose payload so later steps can recover / re-POST even if delivery fails.
    setOutput('payload', payloadStr);

    if (!inputs.webhooks.length) {
      logInfo('No webhooks configured; skipping delivery.');
      return;
    }

    logInfo(
      `Triggering ${inputs.webhooks.length} webhook${inputs.webhooks.length > 1 ? 's' : ''}...`,
    );
    const results = await Promise.allSettled(
      inputs.webhooks.map((w) => wrapWebhook(w.trim(), payload)),
    );
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length > 0) {
      for (const failure of failures) {
        const message =
          failure.reason instanceof Error ? failure.reason.message : String(failure.reason);
        logError(message);
      }
    }
  } catch (e: unknown) {
    if (payloadStr) {
      setOutput('payload', payloadStr);
    }
    const message = e instanceof Error ? e.message : String(e);
    logError(`Unexpected failure: ${message}`);
  }
}

async function wrapWebhook(webhook: string, payload: object): Promise<void> {
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Webhook response: ${res.status}: ${body}`);
  }
}

function buildAllowedMentions(inputs: Readonly<Inputs>, content: string): object | undefined {
  if (inputs.allowed_mentions) {
    return inputs.allowed_mentions;
  }
  const users = extractMentionedUserIds(content);
  if (!users.length) {
    return undefined;
  }
  // Explicitly allow mentioned users so pings are reliable across Discord webhook defaults.
  return { parse: [], users };
}

export function getPayload(inputs: Readonly<Inputs>): object {
  const ctx = getContext();
  const { owner, repo } = ctx.repo;
  const { eventName, ref, sha, workflow, actor, payload, serverUrl, runId, job } = ctx;
  const repoURL = `${serverUrl}/${owner}/${repo}`;
  const workflowURL = `${repoURL}/actions/runs/${runId}`;

  logDebug(JSON.stringify(payload));

  const eventFieldTitle = `Event - ${eventName}`;
  const eventDetail = formatEvent(eventName, payload);
  const content = resolveContent(inputs);

  let embed: { [key: string]: any } = {
    color: inputs.color === undefined ? statusOpts[inputs.status].color : inputs.color,
  };

  if (!inputs.notimestamp) {
    embed.timestamp = new Date().toISOString();
  }

  // title
  if (inputs.title) {
    embed.title = inputs.title;
  }

  // Default title URL to the workflow run when callers omit `url`.
  const titleUrl = inputs.url || workflowURL;
  if (titleUrl) {
    embed.url = titleUrl;
  }

  if (inputs.image) {
    embed.image = {
      url: inputs.image,
    };
  }

  if (!inputs.noprefix) {
    embed.title = statusOpts[inputs.status].status + (embed.title ? `: ${embed.title}` : '');
  }

  if (inputs.description) {
    embed.description = inputs.description;
  }

  if (!inputs.nocontext) {
    const fields: Array<{ name: string; value: string; inline: boolean }> = [
      {
        name: 'Repository',
        value: `[${owner}/${repo}](${repoURL})`,
        inline: true,
      },
      {
        name: 'Ref',
        value: formatRef(ref),
        inline: true,
      },
      {
        name: eventFieldTitle,
        value: eventDetail,
        inline: false,
      },
      {
        name: 'Triggered by',
        value: actor,
        inline: true,
      },
      {
        name: 'Workflow',
        value: `[${workflow}](${workflowURL})`,
        inline: true,
      },
    ];

    if (sha) {
      const short = sha.substring(0, 7);
      fields.push({
        name: 'Commit',
        value: `[\`${short}\`](${repoURL}/commit/${sha})`,
        inline: true,
      });
    }

    if (job) {
      fields.push({
        name: 'Job',
        value: job,
        inline: true,
      });
    }

    embed.fields = fields;
  }

  let discord_payload: any = {
    embeds: [fitEmbed(embed)],
  };
  logDebug(`embed: ${JSON.stringify(embed)}`);

  if (inputs.username) {
    discord_payload.username = inputs.username;
  }
  if (inputs.avatar_url) {
    discord_payload.avatar_url = inputs.avatar_url;
  }
  if (content) {
    discord_payload.content = fitContent(content);
  }

  const allowedMentions = buildAllowedMentions(inputs, content);
  if (allowedMentions) {
    discord_payload.allowed_mentions = allowedMentions;
  }

  return discord_payload;
}

// Skip auto-execution under the test runner so importing this module for unit
// tests does not trigger a real webhook run.
if (!process.env.VITEST) {
  run();
}
