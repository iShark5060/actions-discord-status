# Discord Status

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/iShark5060/actions-discord-status/actions/workflows/ci.yml/badge.svg)](https://github.com/iShark5060/actions-discord-status/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/Node-%3E%3D24-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?logo=typescript&logoColor=white)
[![Cursor](https://img.shields.io/badge/Cursor-IDE-141414?logo=cursor&logoColor=white)](https://cursor.com)

Post GitHub Actions CI status to Discord as embeds.

> **Fork notice:** Maintained fork of [sarisia/actions-status-discord](https://github.com/sarisia/actions-status-discord) by Sarisia (MIT License).

> **Always reference a published version tag** (e.g. `@v1`). The bundled action code (`dist/index.js`) is only committed to release tags, so referencing `@main` will not work.

![Discord embed example](https://user-images.githubusercontent.com/33576079/212482263-31456af9-6a9f-4110-82ad-cd3df738bddb.png)

## Usage

### Minimum

```yaml
- uses: iShark5060/actions-discord-status@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

### Workflow-level status (recommended)

Replace long `contains(needs.*.result, …)` ternaries by passing job results:

```yaml
discord-status:
  runs-on: ubuntu-latest
  needs: [validate, build-and-deploy]
  if: always()
  steps:
    - uses: iShark5060/actions-discord-status@v1
      with:
        webhook: ${{ secrets.DISCORD_WEBHOOK }}
        job_results: ${{ join(needs.*.result, '\n') }}
        mention_on: failure
        content: '<@${{ secrets.DISCORD_USERID }}>'
        title: ${{ github.workflow }}
```

### Failure-only mentions

```yaml
- uses: iShark5060/actions-discord-status@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    mention_on: failure
    content: '<@USER_ID> CI failed'
```

### Full options

```yaml
- uses: iShark5060/actions-discord-status@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    content: 'Hey <@USER_ID>'
    title: deploy
    description: Build and deploy to GitHub Pages
    image: ${{ secrets.EMBED_IMAGE }}
    color: 0x0000ff
    url: https://github.com/iShark5060/actions-discord-status
    username: GitHub Actions
    avatar_url: ${{ secrets.AVATAR_URL }}
```

### No detail

```yaml
- uses: iShark5060/actions-discord-status@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    nodetail: true
    title: 'New version of `software` is ready!'
    description: |
      Version `${{ github.event.release.tag_name }}`
      Click [here](${{ github.event.release.html_url }}) to download!
    color: 0xff91a4
```

## Inputs

| Input                | Required | Default                  | Description                                                                              |
| -------------------- | -------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `webhook`            | No       | `env.DISCORD_WEBHOOK`    | Discord webhook URL. **Do not append `/github` suffix.**                                 |
| `status`             | No       | `${{ job.status }}`      | Job/workflow conclusion. Ignored when `job_results` is set.                              |
| `job_results`        | No       | —                        | Newline/comma-separated conclusions; worst result becomes `status`.                      |
| `content`            | No       | —                        | Message outside the embed (use for `@mentions`).                                         |
| `content_on_failure` | No       | —                        | Alternate content for failure-like statuses (`failure`, `timed_out`, `action_required`). |
| `mention_on`         | No       | `always`                 | When to include content: `always`, `failure`, or `never`.                                |
| `title`              | No       | `${{ github.workflow }}` | Embed title.                                                                             |
| `description`        | No       | —                        | Embed description.                                                                       |
| `image`              | No       | —                        | Embed image URL.                                                                         |
| `color`              | No       | status color             | Embed color as hex (e.g. `0xFFFFFF`).                                                    |
| `url`                | No       | workflow run URL         | Title link URL.                                                                          |
| `username`           | No       | —                        | Webhook username override.                                                               |
| `avatar_url`         | No       | —                        | Webhook avatar override.                                                                 |
| `allowed_mentions`   | No       | auto from `@user` ids    | Optional Discord `allowed_mentions` JSON object.                                         |
| `nofail`             | No       | `true`                   | When `false`, webhook failures fail the step.                                            |
| `nocontext`          | No       | `false`                  | Suppress repository/ref/event fields.                                                    |
| `noprefix`           | No       | `false`                  | Do not prefix title with status.                                                         |
| `nodetail`           | No       | `false`                  | Sets both `nocontext` and `noprefix`.                                                    |
| `notimestamp`        | No       | `false`                  | Omit embed timestamp.                                                                    |
| `ack_no_webhook`     | No       | `false`                  | Suppress missing-webhook errors.                                                         |

Accepted `status` / `job_results` values: `success`, `failure`, `cancelled`, `skipped`, `timed_out`, `action_required`, `neutral`, `stale`.

## Outputs

| Output    | Description                                                                             |
| --------- | --------------------------------------------------------------------------------------- |
| `payload` | JSON Discord webhook payload. Always set (including when delivery fails or no webhook). |

## Tips

### Multiple webhooks

Separate webhook URLs with newlines in the secret value. Failed deliveries do not cancel other webhooks.

### Full payload control

Set a step `id`, read `${{ steps.<id>.outputs.payload }}`, modify the JSON, and POST it yourself (e.g. with `actions/github-script`). The payload output is available even when Discord delivery fails.

### Markdown

`title` and `description` support Discord markdown.

## FAQ

**`Error: Webhook response: 400: {"sender":["This field is required"]}`**

Do not append `/github` to your webhook URL.

## Requirements

- Node.js 24+
- pnpm 11+

## Scripts

| Script              | Description                               |
| ------------------- | ----------------------------------------- |
| `pnpm run validate` | Format check, lint, typecheck, and tests. |
| `pnpm run build`    | Bundle `src/` into `dist/index.js`.       |

## Development

Agent-oriented docs: [openwiki/quickstart.md](openwiki/quickstart.md).

Engineering standards: AppBase `docs/org-standards/` with [personal-repos.md](https://github.com/Dark-Avian-Labs/AppBase/blob/main/docs/org-standards/personal-repos.md) (GitHub-hosted runners).

## License

MIT. See [LICENSE](LICENSE).
