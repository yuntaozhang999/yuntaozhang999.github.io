---
title: "Gemini CLI Silent Failure: How an Invalid `package.json` Version Breaks Slash Commands in VS Code"
date: 2026-01-24
excerpt: ""
tags:
  - Gemini CLI
  - VS Code
  - macOS
  - Jekyll 
  - Yuntao
---

**TL;DR:** Gemini CLI's slash commands were failing silently in my VS Code terminal because of an invalid, non-SemVer version number (`"version": "0.8.1.1"`) in my project's `package.json`. The CLI's parser failed during initialization without crashing. Correcting the version to the standard `MAJOR.MINOR.PATCH` format (`"version": "0.8.1"`) immediately resolved the problem.

---

When using `gemini-cli` in my Jekyll website project, I encountered a bizarre bug: the tool's slash commands (`/`) were completely unresponsive within VS Code's integrated terminal. Pressing `Ctrl + C` would only print `✕ Unknown command: /quit`, and typing a slash `/` would not bring up the interactive command menu.

Here is my troubleshooting journey from total confusion to a final, surprising resolution.

## The Problem

After launching `gemini-cli` in the VS Code terminal inside my Jekyll project, any command starting with a slash `/` would fail:
- Typing `/help` resulted in `✕ Unknown command: /help`.
- Nothing happened when typing `/`.
- Even `Ctrl + C` lead to `✕ Unknown command: /quit`.
- The issue persisted across new VS Code terminals and VS Code restarts.

## Stage 1

1.  **Reinstall CLI:** I uninstalled and reinstalled `gemini-cli` via Homebrew, but this did not resolve the issue.
2.  **Restart System:** I rebooted my computer, but this did not resolve the issue.

3.  **Test in Native Terminal:** I ran `gemini-cli` in the native macOS terminal. It worked perfectly, suggesting the issue was specific to the VS Code environment.

With the problem localized to VS Code, I began testing its internal configuration.

## Stage 2

4.  **Edit gemini-cli settings:** I tried adding `"enablePromptCompletion": true` to the `gemini-cli` settings: `~/.gemini/settings.json`, but this did not resolve the issue.

5.  **Disable GPU Acceleration:** In VS Code, I changed `terminal.integrated.gpuAcceleration` from `auto` to `off` and `on` to rule out rendering bugs, but this did not resolve the issue.
6.  **Run in Clean Mode:** I removed all extensions in VS Code to check for conflicts, but this made no difference.
7.  **Check Environment Variables:** I compared the output of `echo $TERM` (both were `xterm-256color`) and `which node` between the native terminal and VS Code's terminal. The environments were identical.
8.  **Check for Aliases:** I ran `alias | grep '/'` to ensure no shell aliases were conflicting with the slash character. None were found.

*Result: The slash commands still refused to work. The problem was clearly related to VS Code, but not related to common settings or extensions.*

## Stage 3: The "Nuke and Pave" Approach (A Misleading Turn)

I decided to reinstall VS Code.

9.  **Delete Extensions & Config:** I removed the `~/.vscode` and `~/Library/Application Support/Code` directories.
10. **Reinstall VS Code:** I reinstalled a fresh copy of VS Code and, did not sync my settings from the cloud.
When `~/Library/Application Support/Code` was removed, VS Code opened in my home directory, where `gemini-cli` worked perfectly. However, if this directory wasn't removed (e.g., due to synced settings), VS Code would open my Jekyll project directly, and the `gemini-cli` issue would persist. This led me to mistakenly believe the problem was with VS Code's global configuration or synced settings. 

*Result: Success! In the new, clean VS Code window, the `gemini-cli` slash commands worked perfectly. I mistakenly concluded that a corrupt cache or a synced setting was the culprit.*

## Stage 4: The Problem Resurfaces (Path Dependency)

The relief was short-lived. As soon as I opened my Jekyll project folder, the bug instantly returned.

11. **Compare Directory Behavior:** I confirmed that in the VS Code integrated terminal, `gemini-cli` worked in my home directory, and any other project, but failed in my jekyll project directory.

*This was the most important discovery: The bug was not global to VS Code or the CLI tool, but was **project-specific**. Something inside my project folder was interfering with the CLI's initialization process.*

## Stage 5: The Hunt for the "Poison" File

Now I began a process of elimination on the files within my project directory.
I considered the `.devcontainer` folder and `package.json` because these are related to Node.js, which powers `gemini-cli`. However, I didn't install the dev container for this project, meaning no Node.js environment was explicitly set up within it.

12. **Check for `.vscode` folder:** I confirmed there was no project-specific `.vscode` folder.
13. **Rename `.devcontainer`:** I renamed the `.devcontainer` folder to `.devcontainer.bak`. *Result: No change.*
14. **Rename `package.json`:** I renamed `package.json` to `package.json.bak`. *Result: Success! The Gemini CLI command system was instantly restored!*

The culprit was unequivocally identified: **`package.json`**.

## Stage 6: Forensic Analysis of `package.json`

Why would a `package.json` file break a command system? I ran a series of micro-tests to find the exact cause.

15. **Empty File Test:** I created a completely empty `package.json`. *Result: Still failed.* 
16. **Minimal Object Test:** I changed the file's content to a simple `{}`. *Result: It worked!*
17. **Line Ending/BOM Test:** I checked the file for a UTF-8 BOM or Windows-style CRLF line endings. There was no BOM, but after converting line endings to LF, the issue remained.
18. **Binary Elimination:** I started with the original `package.json` and deleted keys one by one:
    - Deleted `scripts`: No effect.
    - Deleted `dependencies`: No effect.
    - Deleted everything except the `"name"` field: It worked.
    - Added back **only** `"version": "0.8.1.1"`, the second row: It failed instantly.

## The Final Truth: A SemVer Violation

The final test revealed the precise cause.

19. **Modify Version Number Format:**
    - **Invalid version:** `"version": "0.8.1.1"` (four parts)
    - **Corrected version:** `"version": "0.8.1"` (three parts)

*Result: Changing the version to the standard three-part format permanently fixed the bug.*

### Root Cause Analysis

`gemini-cli`, being a Node.js tool, reads the `package.json` in its working directory to understand the project context. This process relies on a parser that strictly adheres to the **Semantic Versioning (SemVer)** standard, which defines versions as `MAJOR.MINOR.PATCH`.

I built my Jekyll website based on this open-source project: https://github.com/academicpages/academicpages.github.io. My Jekyll website had used a non-standard, four-part version number. When the CLI's internal parser encountered this invalid format, it threw an exception. While this error didn't crash the entire application, it caused a **silent failure**: the program aborted its initialization sequence *after* basic file-watching (`@`) was enabled, but *before* the slash command registry was loaded. This explained the strange symptoms: the CLI was running, but its command module was never activated.