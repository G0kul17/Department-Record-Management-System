# DRMS Deployment Control (draft for review)

**Destination:** a PRIVATE deployment-control repository owned by the team
(e.g. `org/drms-deploy`). This directory is stored in the public DRMS repo
only as a reviewable draft - GitHub does not activate workflows under
`deploy-control/.github/workflows/` because they are not at the repo root.

## Why a separate private repo?

The active DRMS repo (`G0kul17/Department-Record-Management-System`) is
**public and third-party-owned**. Deployment machinery (production secrets,
SSH access to lab hosts, self-hosted runners) must not live in a repo whose
content can be influenced by the public. The private control repo is the
trust boundary:

- The public repo only **builds** an immutable artifact (`release-build.yml`).
- The private control repo **verifies** (digest + commit, from a committed
  manifest, never from the untrusted release) then **deploys** on a
  dedicated `drms-lab` self-hosted runner after `environment: production`
  approval.

## Hard rules enforced in `deploy-production.yml`

1. Never `actions/checkout` the public repo on the self-hosted runner.
2. Never run `npm ci` or scripts from the public repo on the runner.
3. The artifact is **data** on the runner: download -> verify -> ship.
4. Trust anchor = committed manifest digest + expected commit, not a digest
   fetched from the release.
5. `dry_run=true` (default) prints the plan only; `dry_run=false` fails
   closed until the deploy steps are implemented.

## To activate (owner/admin, not done here)

1. Create the private repo + `production` environment with required reviewers.
2. Add secrets: `DRMS_DEPLOY_SSH_KEY` (mirror of Jenkins `drms-ssh`).
3. Provision the `drms-lab` self-hosted runner inside the lab.
4. Commit `releases/<tag>.sha256` (and optionally a pinned commit) after
   human review of each release.
5. Implement the deploy job (port of Jenkinsfile stages 6-8) as
   control-repo-owned scripts.

See `artifact-flow-security-assessment` in the epic artifacts for the full
threat model.
