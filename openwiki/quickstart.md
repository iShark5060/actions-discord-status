# Actions Status Discord - Quickstart

## Overview

**Actions Status Discord** is a GitHub Action that posts GitHub Actions CI/CD status updates to Discord webhooks as beautiful, customizable embeds. This is a maintained fork of the original `sarisia/actions-status-discord` project.

### Key Features

- **Easy Integration**: Works out of the box with minimal configuration
- **JavaScript Action**: No Docker container required, fast execution
- **Cross-Platform**: Tested on all GitHub-hosted runners (Ubuntu ARM, macOS Apple Silicon)
- **Customizable**: Extensive input options for tailoring Discord messages
- **Multiple Webhooks**: Support for triggering multiple webhooks simultaneously
- **Error Resilient**: Configurable failure handling (`nofail` option)

## Quick Usage Examples

### Minimum Configuration

```yaml
- uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

### Full Configuration

```yaml
- uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    content: 'Hey <@USER_ID>'
    title: 'deploy'
    description: 'Build and deploy to GitHub Pages'
    color: 0x0000ff
    url: 'https://github.com/iShark5060/actions-status-discord'
```

## Project Structure

```
/
├── src/                    # TypeScript source code
│   ├── index.ts           # Main action entry point
│   ├── input.ts           # Input parsing and validation
│   ├── context.ts         # GitHub context handling
│   ├── format.ts          # GitHub event formatting
│   ├── validate.ts        # Discord payload validation
│   ├── constants.ts       # Discord API constants
│   └── utils.ts           # Logging utilities
├── lib/                   # Compiled/bundled JavaScript (ES modules)
├── tests/                 # Test suites and payloads
├── .github/workflows/     # CI/CD workflows
├── action.yml            # GitHub Action metadata
└── package.json          # Node.js package configuration
```

## Getting Started

### 1. Prerequisites

- GitHub repository with Actions enabled
- Discord webhook URL (create via Discord Server Settings → Integrations → Webhooks)

### 2. Basic Setup

1. Add Discord webhook to GitHub Secrets as `DISCORD_WEBHOOK`
2. Add the action to your workflow:
   ```yaml
   - name: Notify Discord
     uses: iShark5060/actions-status-discord@v1
     if: always()
     with:
       webhook: ${{ secrets.DISCORD_WEBHOOK }}
   ```

### 3. Verify Installation

After running your workflow, check your Discord channel for the status embed.

## Documentation Sections

### [Architecture](architecture/)

- [Action Structure](architecture/action-structure.md) - How the GitHub Action works
- [Source Code Organization](architecture/source-code-organization.md) - Purpose of each source file
- [Build and Bundle Process](architecture/build-and-bundle.md) - Compilation with ncc

### [Workflows](workflows/)

- [Basic Usage](workflows/basic-usage.md) - Common configurations and examples
- [Advanced Configuration](workflows/advanced-configuration.md) - All input options
- [Webhook Management](workflows/webhook-management.md) - Multiple webhooks, error handling

### [Development](development/)

- [Setup and Building](development/setup-and-building.md) - Local development environment
- [Testing Strategy](development/testing-strategy.md) - Test approach and payloads
- [Release Process](development/release-process.md) - Versioning and deployment

### [Integrations](integrations/)

- [Discord Webhook Format](integrations/discord-webhook-format.md) - Discord API integration
- [GitHub Context](integrations/github-context.md) - GitHub Actions context usage

## Key Concepts

### Status Mapping

The action maps GitHub job statuses to Discord embed colors:

- `Success` → Green (0x28A745)
- `Failure` / `Timed Out` → Red
- `Cancelled` / `Action Required` → Yellow
- `Skipped` / `Neutral` / `Stale` → Gray

Use `job_results` with `join(needs.*.result, ',')` to aggregate workflow-level conclusions. Use `mention_on: failure` to ping only on failure-like statuses.

### Event Formatting

Special formatting for GitHub events:

- **Push events**: Show commit hash and message
- **Pull requests**: Show PR number and title
- **Releases**: Show release name and body

### Payload Validation

Automatic truncation of content exceeding Discord limits:

- Embed title: 256 characters
- Embed description: 4096 characters
- Webhook content: 2000 characters

## Important Notes

### Versioning

- **Always reference a published version tag** (e.g., `@v1`)
- The bundled action code (`dist/index.js`) is only committed to release tags
- Referencing `@main` will not work

### Webhook URLs

- **Do NOT append `/github` suffix** to Discord webhook URLs
- The action uses the standard Discord webhook endpoint

### Fork Notice

This repository is a maintained fork of [sarisia/actions-status-discord](https://github.com/sarisia/actions-status-discord) by [Sarisia](https://github.com/sarisia). The original project is no longer maintained.

## Need Help?

- Check the [GitHub Issues](https://github.com/iShark5060/actions-status-discord/issues) for existing problems
- Review the comprehensive [README](../README.md) for detailed examples
- Refer to the Discord Developer Docs for webhook formatting options
