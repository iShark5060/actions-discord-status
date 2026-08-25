# actions-discord-status

## Org standards

CI/README/validate conventions live in AppBase `docs/org-standards/` with personal-repo overrides (`personal-repos.md`). GitHub-hosted runners, not Blacksmith. Action-publish track: `release` event → build-and-tag. Quality gate: `pnpm run validate`.

## Overview

Posts GitHub Actions job/workflow status to Discord webhooks as embeds. Maintained fork of sarisia/actions-status-discord. Inputs and usage: `README.md` / `action.yml`.

## Delivery

Bundled `dist/index.js` exists only on release tags. Consumers must use `@v1`, not `@main`. Do **not** append `/github` to Discord webhook URLs (that endpoint expects a different payload shape).

When `job_results` is set, it overrides `status`. Worst conclusion uses a fixed priority (`failure` > `timed_out` > `cancelled` > `action_required` > …). Literal `\n` from `join(..., '\n')` is accepted.

`mention_on: failure` and `content_on_failure` apply to failure-like statuses only: `failure`, `timed_out`, `action_required`. Not `cancelled`. Default `nofail: true` so webhook/delivery errors do not fail the step unless explicitly disabled. `payload` is still set even when delivery fails or no webhook is configured (`ack_no_webhook`). Multiple webhooks are newline-separated and sent concurrently; one failure does not cancel the others.

Without `allowed_mentions`, user IDs found in content are allowed with `parse: []` (user mentions work; @everyone / @roles stay off). `job` is a deprecated alias of `title`. `nodetail` implies both `nocontext` and `noprefix`.
