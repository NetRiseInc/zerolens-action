# NetRise ZeroLens Scan GitHub Action

[![CI Status](https://github.com/netriseinc/zerolens-action/workflows/CI/badge.svg)](https://github.com/netriseinc/zerolens-action/actions)
[![Marketplace](https://img.shields.io/badge/GitHub%20Actions-Marketplace-blue?logo=github-actions&logoColor=white)](https://github.com/marketplace/actions/netrise-zerolens-scan)
[![License](https://img.shields.io/github/license/netriseinc/zerolens-action)](LICENSE)

> **Security scanning for compiled binaries, with one-line setup, Markdown and SARIF reporting, and PR integration.**

---

## Overview

The **NetRise ZeroLens Scan** GitHub Action scans your compiled binaries for Common Weakness Enumeration (CWE) risks using [NetRise ZeroLens](https://www.netrise.io/products/zerolens).  
It uploads binaries, waits for analysis (optionally including AI-generated findings), outputs rich Markdown and SARIF reports, and fails/warns your build based on your policy—**all via a single YAML line**.

### Highlights

- Zero-config install; sensible, safe defaults
- Supports all runner OSes (Linux, macOS, Windows)
- Multi-layer reporting (console, Step Summary, Markdown artefact, SARIF)
- Customizable fail/warn policies per CWE, total finding count, or scanning timeout
- Optional AI-generated analysis sections
- PR comment automation
- Proven in CI: full test suite and E2E workflows

---

## Getting Started

### 🚀 Quick Usage Example

Add just **three steps** to your workflow:

```yaml
on: [push]

jobs:
  security_scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build binary
        run: make build
      - name: ZeroLens Scan
        id: zerolens
        uses: netriseinc/zerolens-action@v1
        with:
          token: ${{ secrets.ZEROLENS_TOKEN }}
          binary: build/myapp # Update path to your binary
      - name: Upload report artifact
        uses: actions/upload-artifact@v4
        with:
          name: ZeroLens-Report
          path: ${{ steps.zerolens.outputs.report }}
```

That's it! :rocket:

- Find your scan report in workflow artefacts.
- Output summary appears in your job logs.
- Adjust policies or enable advanced features as needed.

---

## Configuration

### Inputs

| Name                | Required | Default              | Description                                                                                                           |
| ------------------- | -------- | -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `token`             | yes      | -                    | **ZeroLens API token** for authentication (`X-Authorization` header).                                                 |
| `binary`            | yes      | -                    | Path or [glob pattern](https://github.com/mrmlnc/fast-glob#pattern-syntax) to binary file(s).                         |
| `wait`              | no       | `true`               | Wait for analysis to finish before proceeding (`false` = fire-and-forget).                                            |
| `poll_interval`     | no       | `5s`                 | Polling interval (e.g. `5s`, `10s`) while waiting.                                                                    |
| `timeout`           | no       | `10m`                | Max time to wait for scan per binary (e.g. `10m`).                                                                    |
| `ai_analysis`       | no       | `false`              | Request AI-generated analysis section in the report.                                                                  |
| `fail_on_cwe`       | no       | _(empty)_            | Comma-separated or JSON array of CWE IDs (e.g. `CWE-119,CWE-242`) that **fail** the build if found.                   |
| `warn_on_cwe`       | no       | _(empty)_            | CWEs that cause warnings but do not fail the build.                                                                   |
| `max_findings`      | no       | `0`                  | Fail if total findings exceed this number (`0` disables limit).                                                       |
| `report_path`       | no       | `zerolens-report.md` | Where to write the Markdown report artefact.                                                                          |
| `upload_artifact`   | no       | `true`               | Uploads the Markdown report using [`upload-artifact`](https://github.com/actions/upload-artifact).                    |
| `continue_on_error` | no       | `false`              | Do not fail job even if policy is violated (useful for experimentation).                                              |
| `comment_pr`        | no       | `false`              | Post a summary PR comment (on `pull_request` event).                                                                  |
| `create_report_pr`  | no       | `false`              | Create a draft PR with the full Markdown report.                                                                      |
| `sarif_path`        | no       | _(empty)_            | Emit findings in [SARIF v2.1.0](https://sarifweb.azurewebsites.net/) to this file, suitable for GitHub code scanning. |
| `github_token`      | no       | GITHUB_TOKEN env     | Token for PR comments; typically `${{ github.token }}`.                                                               |

---

### Outputs

| Name            | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| `hashes`        | JSON array of SHA-256 hashes of uploaded binaries.              |
| `findings_json` | Raw JSON of `/binaries/{hash}/findings` responses (per binary). |
| `ai_json`       | Raw AI analysis JSON (if `ai_analysis=true`).                   |
| `report`        | Path to the generated Markdown report file.                     |
| `sarif`         | Path to generated SARIF file (if `sarif_path` provided).        |
| `violations`    | JSON array of policy violations (failures/warnings triggered).  |

Access any output like `${{ steps.<id>.outputs.report }}`.

---

## Advanced Usage

### PR Gate Example with Policy

```yaml
on: pull_request

jobs:
  security_scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: make build
      - name: ZeroLens Scan (PR Gate)
        id: zerolens
        uses: netriseinc/zerolens-action@v1
        with:
          token: ${{ secrets.ZEROLENS_TOKEN }}
          binary: build/myapp
          fail_on_cwe: CWE-119,CWE-242
          warn_on_cwe: CWE-20,CWE-78
          max_findings: 20
          comment_pr: true
          github_token: ${{ github.token }}
```

- **Fails** build if configured CWEs are detected or finding count is exceeded.
- Posts a summary comment into the PR showing blocking/warning CWEs.
- Full report is available as an artefact.

---

## Reports and Presentation

The Action reports results through **four layers**:

1. **Console Log Summary** – status and counts, emoji, grouped for easy review.
2. **Step Summary (`GITHUB_STEP_SUMMARY`)** – Markdown summary table appears in the Actions UI.
3. **Markdown Artefact** (`report_path`) – full, detailed, audit-friendly report with collapsible details.
4. **Optional SARIF (`sarif_path`)** – enables code scanning alerts and security tab integration.

You always get at-a-glance, readable results, plus artefacts for audits or security programs.

---

## How It Works

1. **Uploads** one or more binaries to ZeroLens API.
2. **Waits** for processing (unless `wait: false`).
3. **Fetches findings** (CWE summary, detailed instances).
4. **Optionally runs AI analysis** for natural-language recommendations (if enabled).
5. **Generates reports** in Markdown and SARIF as required.
6. **Sets outputs** for downstream workflow steps.
7. **Applies your policy**: blocks/alerts on CWEs, finding counts, or timeouts.
8. **Optionally comments** on PRs or opens a draft PR with the full report.

---

## Policy and Exit Codes

- Fails the workflow (`exit 1`) on blocking violations unless `continue_on_error` is set.
- Warnings do **not** fail the workflow, but are surfaced in all report layers.
- All policy violations are included as structured data in the `violations` output.

**Policy triggers:**

- Any CWE matching `fail_on_cwe`
- Any CWE matching `warn_on_cwe`
- Too many total findings (`max_findings`)
- Scan timeout

---

## Code Scanning Integration (SARIF)

To enable GitHub's [Security tab](https://docs.github.com/en/code-security/code-scanning) alerts:

```yaml
- name: ZeroLens Scan
  id: zerolens
  uses: netriseinc/zerolens-action@v1
  with:
    token: ${{ secrets.ZEROLENS_TOKEN }}
    binary: build/myapp
    sarif_path: out/scan.sarif
- name: Upload SARIF to GitHub
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: out/scan.sarif
```

---

## Collaboration Features

- **PR Comment (`comment_pr: true`):**
  - Posts (or updates) a top-level PR comment with the scan summary and policy status.

---

## Security & Compliance

- **100MB** max per binary; checked locally _before_ uploading.
- **No build tools required** – runs as bundled JavaScript.
- **Tokens are always redacted in logs.**
- **Minimum dep surface:** Node 20+. No TypeScript compile, Docker or system deps needed.

---

## Examples

See [`examples/`](./examples/) for more scenarios:

- [Quick scan workflow](./examples/quick-scan.yml)
- [PR gate with policy & PR comment](./examples/pr-gate.yml)
- [Code scanning integration (SARIF)](./examples/code-scanning.yml)

---

## Developer & Contribution

- [Architectural ADR](./docs/adr/0001-initial-architecture.md)
- Test with `npm test` or run full E2E locally with [`act`](https://github.com/nektos/act).

---

## Support

Contact [NetRise](https://www.netrise.io) or email support (see API docs) for help or API token requests.
