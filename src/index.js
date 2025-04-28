const { getInputs } = require('./utils/input.js');
const { hashFiles } = require('./utils/hash');
const { uploadBinary, pollUntilCompleted } = require('./api/client');
const { parseDuration } = require('./utils/parse-duration');

const inputs = getInputs();
// Avoid printing sensitive token value
const { token: _token, ...inputsSafe } = inputs;
void _token; // prevent eslint no-unused-vars
console.log('Inputs parsed', inputsSafe);

// Mask the token so if any library logs headers inadvertently it is redacted
const core = require('@actions/core');
core.setSecret(inputs.token);

let aiResults = {};

(async () => {
  const hashes = await hashFiles(inputs.paths);
  console.log('Hashes', hashes);

  for (const p of inputs.paths) {
    console.log(`Uploading ${p}...`);
    const status = await uploadBinary(p, inputs.token);
    console.log('Upload response', status);
    if (inputs.wait) {
      const intervalMs = parseDuration(inputs.pollInterval);
      const timeoutMs = parseDuration(inputs.timeout);
      const final = await pollUntilCompleted(status.hash, inputs.token, intervalMs, timeoutMs);
      console.log('Completed', final.status);
    }
  }

  // CF-05: fetch findings once all binaries processed (or skip if wait=false)
  if (inputs.wait) {
    const hashList = Object.values(hashes);
    const { getFindingsForHashes } = require('./api/client');
    const findingsAgg = await getFindingsForHashes(hashList, inputs.token);
    console.log('Findings summary', findingsAgg.summary);

    // Evaluate policy
    const { evaluatePolicy } = require('./policy/evaluate');
    let timeoutOccurred = false;
    // Future: capture polling timeout flag; for now always false as errors would have thrown
    const policyOutcome = evaluatePolicy(findingsAgg.findings, {
      failCWE: inputs.failOnCwe,
      warnCWE: inputs.warnOnCwe,
      maxFindings: inputs.maxFindings,
      timeout: timeoutOccurred,
    });

    // RP-01 console summary
    const { printConsoleSummary } = require('./report/console-summary');
    printConsoleSummary(policyOutcome.counts, findingsAgg.summary);

    const { writeStepSummary } = require('./report/step-summary');
    writeStepSummary(policyOutcome.counts, findingsAgg.summary, inputs.ai);

    if (inputs.ai) {
      const { getAIForHashes } = require('./api/client');
      aiResults = await getAIForHashes(hashList, inputs.token);
      console.log('AI analysis retrieved for', Object.keys(aiResults).length, 'binaries');
    }

    // Always build full report (AI section may be placeholder)
    const { buildReport, writeFullReport } = require('./report/full-report');
    const fullMd = buildReport(findingsAgg, aiResults, hashList, policyOutcome.counts, inputs.ai);
    writeFullReport(inputs.reportPath, fullMd);
    console.log('Report written to', inputs.reportPath);

    // RP-04: SARIF emitter
    if (inputs.sarifPath) {
      const { buildSarif, writeSarif } = require('./report/sarif');
      const sarif = buildSarif(findingsAgg);
      writeSarif(inputs.sarifPath, sarif);
      console.log('SARIF written to', inputs.sarifPath);
    }

    // RP-05: set action outputs
    const ghToken = inputs.ghToken || inputs.token; // fallback
    const outputs = {
      hashes: JSON.stringify(hashList),
      findings_json: JSON.stringify(findingsAgg.binaries),
      ai_json: inputs.ai ? JSON.stringify(aiResults || {}) : '',
      report: inputs.reportPath || '',
      sarif: inputs.sarifPath || '',
      violations: JSON.stringify(policyOutcome.violations),
    };
    Object.entries(outputs).forEach(([k, v]) => core.setOutput(k, v));
    console.log('[ZeroLens] Outputs set:', Object.keys(outputs).join(', '));

    // PE-02: decide exit code and act accordingly
    const { decideExitCode } = require('./policy/exit-code');
    const exitCode = decideExitCode(policyOutcome.status, inputs.continueOnError);
    if (exitCode === 1) {
      core.setFailed('Policy violations triggered failure');
    } else if (exitCode === 78) {
      console.log('[ZeroLens] Policy warnings – neutral exit (78)');
    }

    // CO-01: optional PR comment
    if (inputs.commentPr) {
      const github = require('@actions/github');
      try {
        const octokit = github.getOctokit(ghToken);
        const { owner, repo } = github.context.repo;
        let issue_number;

        if (github.context.payload.pull_request) {
          issue_number = github.context.payload.pull_request.number;
        } else {
          // Fallback: find PRs associated with current commit (for push events)
          const sha = github.context.sha;
          const prs = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({ owner, repo, commit_sha: sha });
          if (prs.data && prs.data.length) {
            issue_number = prs.data[0].number;
          }
        }

        if (!issue_number) {
          console.log('[ZeroLens] No pull request found for commit; skipping comment.');
        } else {
          const body = fullMd;
          // find existing comment by bot
          const { data: comments } = await octokit.rest.issues.listComments({ owner, repo, issue_number });
          const prev = comments.find((c) => c.user.type === 'Bot' && c.body.includes('ZeroLens Scan Summary'));
          if (prev) {
            await octokit.rest.issues.updateComment({ owner, repo, comment_id: prev.id, body });
          } else {
            await octokit.rest.issues.createComment({ owner, repo, issue_number, body });
          }
          console.log('[ZeroLens] PR comment posted/updated');
        }
      } catch (err) {
        console.warn('[ZeroLens] Failed to post PR comment:', err.message);
      }
    }

    // Exit with explicit code so act/github interprets correctly
    process.exit(exitCode);
  }
})(); 