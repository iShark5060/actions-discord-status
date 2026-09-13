# Discord Status

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/iShark5060/actions-discord-status/ci.yml?style=flat-square&label=CI)](https://github.com/iShark5060/actions-discord-status/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/Node-%3E%3D24-339933?logo=node.js&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?logo=typescript&logoColor=white&style=flat-square)
[![Cursor](https://img.shields.io/badge/Cursor-IDE-141414?logo=cursor&logoColor=white&style=flat-square)](https://cursor.com)

<<<<<<< Updated upstream
Posts GitHub Actions job status to Discord as embeds. Maintained fork of [sarisia/actions-status-discord](https://github.com/sarisia/actions-status-discord).
=======
Post GitHub Actions job status to Discord as embeds. One step at the end of a workflow, a webhook, and you get a card instead of opening the Actions tab.

This is a maintained fork of [sarisia/actions-status-discord](https://github.com/sarisia/actions-status-discord) by Sarisia (MIT License). I keep it because the DAL apps all ping the same Discord channel this way.

> **Always reference a published version tag** (e.g. `@v1`). The bundled action code (`dist/index.js`) is only committed to release tags, so referencing `@main` will not work.
>>>>>>> Stashed changes

![Discord embed example](https://user-images.githubusercontent.com/33576079/212482263-31456af9-6a9f-4110-82ad-cd3df738bddb.png)

```yaml
discord-status:
  runs-on: ubuntu-latest
  needs: [validate, build-and-deploy]
  if: always()
  steps:
    - uses: iShark5060/actions-discord-status@v1
      with:
        webhook: ${{ secrets.DISCORD_WEBHOOK }}
        job_results: ${{ join(needs.*.result, ',') }}
        mention_on: failure
        content: '<@${{ secrets.DISCORD_USERID }}>'
        title: ${{ github.workflow }}
```

Inputs live in `action.yml`.

## Gotchas

<<<<<<< Updated upstream
- Reference a **published tag** (`@v1`). `dist/index.js` is only on release tags; `@main` will not work.
- Do **not** append `/github` to the webhook URL. That endpoint expects a different payload (`sender` is required) and returns 400.
- `job_results` overrides `status`. Worst result wins (`failure` > `timed_out` > `cancelled` > …). `mention_on: failure` covers `failure`, `timed_out`, and `action_required` — not `cancelled`.
- Default `nofail: true`, so a Discord outage does not fail the step. `payload` is still set. Multiple webhooks are newline-separated; one failure does not cancel the others.
=======
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

| Input                | Required | Default                  | Description                                                                                                              |
| -------------------- | -------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `webhook`            | No       | `env.DISCORD_WEBHOOK`    | Discord webhook URL. **Do not append `/github` suffix.**                                                                 |
| `status`             | No       | `${{ job.status }}`      | Job/workflow conclusion. Ignored when `job_results` is set.                                                              |
| `job_results`        | No       | —                        | Comma- or newline-separated conclusions (literal `\n` from `join(..., '\n')` also works); worst result becomes `status`. |
| `content`            | No       | —                        | Message outside the embed (use for `@mentions`).                                                                         |
| `content_on_failure` | No       | —                        | Alternate content for failure-like statuses (`failure`, `timed_out`, `action_required`).                                 |
| `mention_on`         | No       | `always`                 | When to include content: `always`, `failure`, or `never`.                                                                |
| `title`              | No       | `${{ github.workflow }}` | Embed title.                                                                                                             |
| `description`        | No       | —                        | Embed description.                                                                                                       |
| `image`              | No       | —                        | Embed image URL.                                                                                                         |
| `color`              | No       | status color             | Embed color as hex (e.g. `0xFFFFFF`).                                                                                    |
| `url`                | No       | workflow run URL         | Title link URL.                                                                                                          |
| `username`           | No       | —                        | Webhook username override.                                                                                               |
| `avatar_url`         | No       | —                        | Webhook avatar override.                                                                                                 |
| `allowed_mentions`   | No       | auto from `@user` ids    | Optional Discord `allowed_mentions` JSON object.                                                                         |
| `nofail`             | No       | `true`                   | When `false`, webhook failures fail the step.                                                                            |
| `nocontext`          | No       | `false`                  | Suppress repository/ref/event fields.                                                                                    |
| `noprefix`           | No       | `false`                  | Do not prefix title with status.                                                                                         |
| `nodetail`           | No       | `false`                  | Sets both `nocontext` and `noprefix`.                                                                                    |
| `notimestamp`        | No       | `false`                  | Omit embed timestamp.                                                                                                    |
| `ack_no_webhook`     | No       | `false`                  | Suppress missing-webhook errors.                                                                                         |

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
>>>>>>> Stashed changes

## License

MIT. See [LICENSE](LICENSE).
