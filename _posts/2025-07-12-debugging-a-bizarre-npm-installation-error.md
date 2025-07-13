---
title: 'The Ghost in the Machine: Debugging a Bizarre npm Installation Error'
date: 2025-07-12
excerpt: ""
tags:
  - npm
  - node.js
  - Debugging
  - Windows
  - Gemini CLI
---

I recently ran into one of the most baffling and frustrating bugs I’ve encountered in a long time. It all started with a simple command that should have just worked:

```powershell
npm install -g @google/generative-ai/cli
```

Instead of installing the Gemini CLI, it failed with a cryptic `ENOENT` error. The logs showed that `npm` was trying to find the package's files in my user directory (`C:\Users\ustbz`) instead of the global npm folder. It was completely ignoring the `-g` (global) flag. This was the start of a deep dive into the rabbit hole of system configuration.

### Round 1: The Obvious Fixes

My first thought was a corrupted Node.js or npm installation. The standard procedure is straightforward:

1.  Uninstall Node.js.
2.  Restart the computer.
3.  Reinstall Node.js.

I did all that. It didn't work. The exact same error persisted. This was the first sign that this wasn't a simple problem.

### Round 2: The Smoking Gun That Wasn't

If it's not a bad installation, it must be a bad configuration. I ran `npm config list --long` to see every single setting npm was using. And there it was, a line that seemed to explain everything:

```
pack-destination = "."
```

This setting tells `npm` to use the current directory (`.`) as the destination for package operations, which would explain why the `-g` flag was being ignored. This was the smoking gun!

The solution seemed obvious: delete the bad setting.

```powershell
npm config delete pack-destination
```

I ran the command, then tried the installation again. It failed. I checked the config again, and to my disbelief, `pack-destination = "."` was still there.

### Round 3: The Hunt for the Ghost

This was where things got truly weird. The setting existed, but it couldn't be deleted. This meant it wasn't coming from the usual user-level `.npmrc` file. My next hypotheses were:

1.  **It's in a system-wide `npmrc` file.** I searched my entire C: drive. The only `npmrc` file I found was the default one in `C:\Program Files\nodejs`, and it was clean.
2.  **It's an environment variable.** `npm` can be configured with variables like `npm_config_<key>`. I checked for `npm_config_pack-destination`. It didn't exist.

At this point, I had ruled out every logical source for the configuration. It was a ghost setting, coming from nowhere and impossible to remove.

### A Glimmer of Hope: `npx`

As a workaround, I tried using `npx`, the Node Package Executor:

```powershell
npx @google/generative-ai/cli
```

It worked instantly. This made sense: `npx` creates a temporary, isolated environment to run a package. It doesn't use the permanent global installation path, so it completely sidestepped my system's broken configuration. This was a great clue, but it wasn't a permanent solution, as the `gemini` command wouldn't be available in a new terminal.

### The Final Twist: The Magic of a Second Restart

After hours of debugging, I was ready to give up and just live with using `npx`. Then, I restarted my computer one more time. I opened a terminal, and on a whim, I tried the original command again.

```powershell
npm install -g @google/generative-ai/cli
```

It worked. Perfectly.

I was stunned. I had already restarted my computer once, and it had done nothing. Why did it work *this* time?

### The Explanation: The Ghost in the Session

The only logical explanation is a combination of two modern Windows features: **in-memory environment variables** and **application session restoration**.

1.  **The "Ghost" Variable:** At some point, a process (most likely a terminal inside VS Code) had the `npm_config_pack-destination` variable set *only in its memory*. It was never saved to disk, which is why none of my searches could find it.
2.  **The First Restart Failed:** When I restarted the first time, Windows helpfully restored my previous session, which included reopening the "infected" terminal. This brought the ghost variable right back with it.
3.  **The Second Restart Succeeded:** During my long debugging session, I must have closed the original infected terminal and started working in new, clean ones. When I restarted the second time, there was no infected session for Windows to restore. The computer started with a truly clean slate, and the ghost was finally gone.

It's a humbling reminder that sometimes the most stubborn bugs aren't in the code or the configuration files, but in the ephemeral state of the system itself. And sometimes, the oldest advice in the book—"turn it off and on again"—works, but only if you make sure you've closed the haunted application first.