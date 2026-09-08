# Agent Guidelines for Academic Pages (yuntaozhang999.github.io)

## Scope & Applicable Agents

This document serves as the authoritative operational standard, architectural reference, and behavioral protocol for all AI coding agents, automated developer assistants, and human developers contributing to or maintaining this repository.

Applicable agents include, but are not limited to:
- **OpenAI Codex / Codex CLI**
- **Google Antigravity (AGY)**
- **Anthropic Claude Code**
- **Google Gemini CLI**
- **Cursor**
- **GitHub Copilot**
- Other autonomous, semi-autonomous, or terminal-based LLM developer tools.

Every AI agent or automated tool operating within this workspace must thoroughly parse, respect, and strictly comply with the policies, workflows, and defense perimeters detailed below.

---

## 1. Repository Topology & Upstream Synchronization SOP

### 1.1 Repository Architecture & Upstream Relationship
* **Repository Origin**: This repository is a customized downstream deployment derived from the official [academicpages/academicpages.github.io](https://github.com/academicpages/academicpages.github.io) template. It serves as the personal academic portfolio, scholarly publications archive, and academic blog for **Yuntao Zhang (张云涛)**.
* **Remote Topology**:
  * **Upstream Canonical Template (`upstream`)**: `https://github.com/academicpages/academicpages.github.io.git`
  * **Personal Production Remote (`origin`)**: `https://github.com/yuntaozhang999/yuntaozhang999.github.io.git`
  * **Local Production Branch (`master`)**: Directly tracks `origin/master`.
* **Zero Upstream PR Declaration (No Pull Requests to Upstream)**:
  All personal customizations, profile metadata, publications, patents, blog posts, and site assets **MUST NEVER** be submitted as a Pull Request to `academicpages/academicpages.github.io`. All commits must target the personal remote (`origin/master`).

### 1.2 Five-Step Upstream Synchronization SOP (Standard Operating Procedure)
When incorporating upstream template enhancements, security patches, or style bug fixes, agents and developers must strictly execute this isolated five-step synchronization workflow. **Never perform direct merges into `master` without isolation.**

```
[Fetch Upstream] ➔ [Create sync-upstream] ➔ [Merge upstream/master] ➔ [Resolve & Purge] ➔ [Fast-forward & Push]
```

1. **Step 1: Workspace Hygiene & Fetch Upstream**
   * Verify that the local working tree is clean: `git status`.
   * Fetch the latest upstream state: `git fetch upstream` *(if `upstream` remote is not configured, run `git remote add upstream https://github.com/academicpages/academicpages.github.io.git` first)*.
2. **Step 2: Create an Isolated Temporary Branch**
   * Never conduct merge conflict resolution directly on `master`.
   ```bash
   git checkout master
   git pull origin master
   git checkout -b sync-upstream
   ```
3. **Step 3: Merge Upstream & Detect Conflicts**
   ```bash
   git merge upstream/master
   ```
   * If git reports `CONFLICT`, run `git status` immediately to identify conflicting files.
4. **Step 4: Enforce Asset Protection & Purge Upstream Sample Files**
   * **Personal Core Data**: Strictly retain local versions (prefer `git checkout --ours <file>` or manual semantic resolution).
   * **Framework & Layouts**: Selectively absorb upstream improvements while preserving locally injected hooks, scripts, and layout customizations.
   * **Thoroughly Purge Upstream Sample Files**: Upstream merges frequently reintroduce default sample blog posts, placeholder talks, demo slides, and dummy images (e.g., inside `_posts/`, `_talks/`, `_publications/`, `images/`). Every sample artifact must be identified and permanently removed using `git rm <sample-file>`.
   * Commit the resolved merge: `git commit -m "chore: sync with upstream/master and resolve conflicts"`.
5. **Step 5: Diff Audit, Fast-Forward Merge, & Push**
   * Audit branch differences: `git diff master..sync-upstream`.
   * Fast-forward merge back into `master` and push to production:
     ```bash
     git checkout master
     git merge sync-upstream
     git push origin master
     git branch -d sync-upstream
     ```

#### Emergency & Rollback Protocols
* **Abort an In-Flight Merge**: `git merge --abort`.
* **Restore Accidentally Overwritten Configuration**: `git checkout master -- _config.yml _data/navigation.yml`.
* **Purge Untracked Artifacts**: `git clean -fd`.

---

## 2. Protected Assets Registry

During merges, automated refactoring, batch operations, or routine updates, the following assets are classified as **Strictly Protected Assets**. They must **NEVER** be overwritten or replaced by upstream defaults or blind automated scripts:

| Asset Path | Nature & Classification | Merge / Modification Strategy | Description & Scope |
| :--- | :--- | :--- | :--- |
| `_config.yml` | **Strictly Protected** | **Preserve Local (`--ours`)** | Site title, base URL, bio, social links, Waline server configuration, GA4 measurement ID, and math/syntax settings. |
| `_data/navigation.yml` | **Strictly Protected** | **Preserve Local (`--ours`)** | Custom top navigation menu structure, order, and page routing. |
| `_data/` (others) | **Strictly Protected** | **Preserve Local (`--ours`)** | UI text strings (`ui-text.yml`), authors (`authors.yml`), comments configuration, etc. |
| `_pages/` | **Strictly Protected** | **Preserve Local (`--ours`)** | Standalone pages including `about.md` (biography), `cv.md` (curriculum vitae), `404.md`, `year-archive.md`, and talkmap container pages. |
| `_posts/` | **Strictly Protected** | **Preserve Local (`--ours`)** | Personal academic blog posts and technical essays. Upstream demo posts must be deleted. |
| `_publications/` | **Strictly Protected** | **Preserve Local (`--ours`)** | Academic publications, peer-reviewed papers, patents, and publication metadata. |
| `_certificates/` | **Strictly Protected** | **Preserve Local (`--ours`)** | Professional certificates, honors, awards, and credentials metadata. |
| `_notes/` | **Strictly Protected** | **Preserve Local (`--ours`)** | Academic notes, study summaries, and reading notes. |
| `_portfolio/` | **Strictly Protected** | **Preserve Local (`--ours`)** | Research projects, engineering systems, and portfolio showcases. |
| `_talks/` | **Strictly Protected** | **Preserve Local (`--ours`)** | Invited talks, keynote presentations, conference sessions, and seminar records. |
| `_teaching/` | **Strictly Protected** | **Preserve Local (`--ours`)** | Teaching assistantships, courses, mentoring, and academic pedagogical records. |
| `images/` | **Strictly Protected** | **Preserve Local (`--ours`)** | Profile avatar (`images/profile.png`), publication figures, blog illustrations, certificate scans. |
| `files/` | **Strictly Protected** | **Preserve Local (`--ours`)** | Personal CV PDF (`files/cv.pdf`), research paper preprints, patent attachments, and supplementary materials. |
| Third-party Integrations | **Strictly Protected** | **Preserve Local (`--ours`)** | Waline comment system configuration (`_config.yml` `comments.waline`), Google Analytics 4 (`analytics.google.tracking_id: G-M2W60KHV04`). |
| `_layouts/` & `_includes/` | Core Framework | Prudent Merge (`Theirs` + Local Customization) | Jekyll liquid rendering templates. Preserve custom injected scripts (e.g., Waline comment injection, custom footer, MathJax/KaTeX). |
| `_sass/` & `assets/css/` | Styling | Lean towards Upstream (`Theirs`) | Style sheets and SCSS partials. Absorb upstream fixes while ensuring local custom CSS overrides are retained. |
| `Gemfile` & `Gemfile.lock` | Runtime Dependencies | Prudent Merge | Ruby dependencies; keep aligned with upstream environment while maintaining Jekyll 3.x/4.x compatibility. |

---

## 3. Sensitive Files & Confidential Draft Defense Line

To safeguard personal privacy, prevent credential leakage, and avoid premature disclosure of unreleased research, this repository enforces a strict multi-layer defense perimeter:

1. **Confidential Draft Isolation Pattern (`21*.md`)**:
   * All files matching the `21*.md` glob pattern (e.g., `_posts/21*.md`, `_portfolio/21*.md`, `_publications/21*.md`) represent unreleased drafts, unpublished research, or future year placeholders.
   * This pattern is registered in `.gitignore`.
   * **Agent Iron Rule**: Agents must **NEVER** use `git add -f` to force-track `21*.md` files. Never leak draft titles, abstracts, or content into public commit messages, issue discussions, or external services.
2. **Local Automation Tools & Secret Isolation (`bot.py`, `.env`)**:
   * `bot.py` is a proprietary local automation, notification, and web scraping script containing or depending on private credentials. It is strictly excluded by `.gitignore`.
   * `.env`, `logs/`, `*.log`, and runtime cache files contain sensitive execution parameters and diagnostic traces. They are strictly forbidden from being staged or committed to GitHub.
3. **Development Environment & Agent Cache Isolation**:
   * Virtual environments: `.venv/`, `venv/`, `env/`, `node_modules/`, `__pycache__/`.
   * AI agent runtime cache and persistent memory: `.gemini/`, `.claude/`, `.copilot/`.
   * All above directories must remain untracked and strictly confined to the local filesystem.

---

## 4. Talkmap Mechanism & Python 3.11 Environment Requirement

### 4.1 Architecture & Functionality
* `talkmap.py` parses the `location` frontmatter field across all talk entries in `_talks/*.md`.
* It utilizes `geopy` to query the OpenStreetMap Nominatim geocoding engine, converting geographic strings into latitude and longitude coordinates.
* Through `getorg`, it clusters location data, generates Leaflet-compatible interactive map artifacts in `talkmap/`, and updates `_pages/talkmap.html`.

### 4.2 Python 3.11 Strict Runtime Requirement
* **Hard Runtime Constraint**: The Talkmap generation pipeline **MUST** be executed within a dedicated **Python 3.11** virtual environment.
* **Deprecation Notice**: Python 3.12 and newer releases removed legacy modules required by `getorg`, resulting in fatal execution errors (`ModuleNotFoundError` / import incompatibilities).
* **Execution Workflow**:
  ```bash
  # 1. Create and activate a dedicated Python 3.11 virtual environment
  python3.11 -m venv .venv
  source .venv/bin/activate

  # 2. Install required dependencies
  pip install python-frontmatter geopy getorg

  # 3. Execute the generator script
  python talkmap.py
  ```
* **Politeness & Rate-Limiting Policy**: `talkmap.py` must configure an explicit `user_agent` and maintain request throttling to strictly comply with Nominatim's usage policy and prevent IP blocks.

---

## 5. Iron Rules for Agent Commit & Execution

All AI coding agents (Antigravity, OpenAI Codex, Claude Code, Gemini CLI, Cursor, Copilot, etc.) operating in this repository must strictly adhere to the following execution protocols:

1. **Absolute Ban on Indiscriminate Staging (`git add .` / `git add -A` prohibited)**:
   * Commits must always specify concrete, explicit file paths (e.g., `git add AGENTS.md`).
   * Indiscriminate staging risks packaging accidental temporary files, untracked build artifacts, or confidential drafts.
2. **Mandatory Pre-Commit Diff Inspection**:
   * Before running `git commit`, agents must audit their staged changes via `git diff --staged` or `git diff <file>`.
   * Verify that every modification strictly corresponds to the user's intent with no stray edits, unexpected whitespace changes, or file truncations.
3. **Conventional Commits Standard**:
   * Commit messages must follow the Conventional Commits specification: `<type>: <short summary>`.
   * Accepted types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
4. **Prohibition of Destructive Git Actions**:
   * Running `git push --force` or `git push -f` against `origin/master` is **strictly forbidden**.
   * Running `git reset --hard` is **strictly forbidden** unless explicitly requested and confirmed by the user in writing.
5. **Content Authenticity & Academic Integrity**:
   * When creating or updating publications, patents, certificates, talks, blog posts, or CV details, **only incorporate facts and text explicitly provided or confirmed by the user**.
   * **Never hallucinate, extrapolate, or assemble unverified academic credentials, publication venues, co-author lists, or citation metrics.**

---

## 6. Targeted Guidelines for OpenAI Codex / Codex CLI

Due to OpenAI Codex's high-speed code completion, automated inline rewriting, and bash generation capabilities, Codex agents must observe the following specific constraints:

1. **Pre-Edit Asset Registry Verification**:
   * Before generating or applying code patches, Codex must cross-reference the target path against the **Protected Assets Registry (Section 2)**.
   * When modifying `_config.yml` or layout components, Codex must preserve custom configurations (Waline comment server, Google Analytics 4 tracking ID `G-M2W60KHV04`, author metadata) and never overwrite them with boilerplate values.
2. **Strict Remote Verification & Upstream PR Prohibition**:
   * When generating shell commands or git automation scripts, Codex must verify remotes.
   * Codex must ensure all push and PR commands target `origin` (`yuntaozhang999/yuntaozhang999.github.io`). **Codex must never generate Pull Requests or push commands targeting `upstream` (`academicpages/academicpages.github.io`)**.
3. **Environment & Tooling Compatibility Guardrails**:
   * When assisting with Python scripts (especially `talkmap.py`), Codex must never recommend or execute Python version upgrades beyond Python 3.11.
   * Always verify and enforce the Python 3.11 environment constraint (`python3.11 -m venv .venv`).
4. **Confidential Draft & Secret Fence Enforcement**:
   * When scanning or auto-completing content in `_posts/`, `_portfolio/`, or `_publications/`, Codex must check filenames against the `21*.md` pattern.
   * If a file matches `21*.md`, Codex must treat it as strictly confidential, never suggest force-adding it to git, and never reference its contents in public commit messages.
5. **Atomic & Explicit Staging Protocols**:
   * Codex must never generate or execute `git add .` or `git add -A`.
   * Codex must always output explicit, single-file staging commands with accompanying diff inspection steps (`git diff --staged`) prior to committing.
