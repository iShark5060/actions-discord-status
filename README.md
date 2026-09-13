# Discord Status

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/iShark5060/actions-discord-status/ci.yml?style=flat-square&label=CI)](https://github.com/iShark5060/actions-discord-status/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/Node-%3E%3D24-339933?logo=node.js&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?logo=typescript&logoColor=white&style=flat-square)
[![Cursor](https://img.shields.io/badge/Cursor-IDE-141414?logo=cursor&logoColor=white&style=flat-square)](https://cursor.com)

Post GitHub Actions job status to Discord as embeds. One step at the end of a workflow, a webhook, and you get a card instead of opening the Actions tab.

This is a maintained fork of [sarisia/actions-status-discord](https://github.com/sarisia/actions-status-discord) by Sarisia (MIT License). I keep it because the DAL apps all ping the same Discord channel this way.

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

- Reference a **published tag** (`@v1`). `dist/index.js` is only on release tags; `@main` will not work.
- Do **not** append `/github` to the webhook URL. That endpoint expects a different payload (`sender` is required) and returns 400.
- `job_results` overrides `status`. Worst result wins (`failure` > `timed_out` > `cancelled` > …). `mention_on: failure` covers `failure`, `timed_out`, and `action_required` — not `cancelled`.
- Default `nofail: true`, so a Discord outage does not fail the step. `payload` is still set. Multiple webhooks are newline-separated; one failure does not cancel the others.

## License

MIT. See [LICENSE](LICENSE).
