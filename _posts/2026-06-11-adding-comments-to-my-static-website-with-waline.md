---
title: "Adding Comments to My Static Website: Understanding Vercel, Neon Database, and Serverless Functions"
date: 2026-06-11
layout: single
excerpt: ""
categories:
  - Web Development
  - Productivity
tags:
  - Waline
  - Vercel
  - Database
  - Serverless
  - Troubleshooting
  - CI-CD
---

Recently, I added a comment system to my personal website (hosted on GitHub Pages) using Waline. Connecting a dynamic comment box to a purely static site can feel counterintuitive, but the mental model boils down to three simple roles:

* **Static GitHub Pages**: A read-only printed sheet posted on a wall—fast, secure, and completely incapable of handling form submissions or state changes on its own.
* **Vercel Serverless Functions**: An invisible courier that materializes the split second a reader leaves a note, validates and processes the request, and instantly vanishes to avoid running a 24/7 idle meter.
* **Neon PostgreSQL**: The permanent vault. Because ephemeral couriers vanish after delivering a message and retain zero memory, all comments must be committed to a dedicated serverless database.

Below is the field-tested troubleshooting post-mortem and architecture runbook covering the five concrete hurdles encountered while integrating the backend and frontend.

---

### Integration & Troubleshooting Gotchas

Wiring Vercel, Neon PostgreSQL, and a customized Jekyll theme surfaced several subtle pitfalls across backend provisioning and frontend rendering.

#### Part 1: Server-Side Backend Issues (Vercel & Neon Setup)

##### 1. The "Ghost" Redeploy & Missing Project
During the initial database configuration, the workflow prompted a project redeploy. However, the Vercel Deployments dashboard returned "No Results" regardless of filter states (0/7 or 7/7 status checked).
* **Root Cause**: The Neon database integration was configured in Vercel before the Waline project itself was created. With no cloned Waline repository linked to the account, there was no codebase or deployment history to display.
* **Fix**: Initiated setup using the official Waline Deploy template, connected GitHub to create a private repository (`my-waline`), and launched the first official deployment before linking storage.

##### 2. The 500 Internal Server Error (Function Invocation Failed)
Immediately after deploying the Waline template to Vercel, navigating to the deployment domain threw a generic `500: INTERNAL_SERVER_ERROR`.
* **Root Cause**: The serverless function crashed during cold start because it couldn't connect to a database. Since database connection credentials were not yet configured in Vercel's environment variables, the runtime threw an unhandled exception.
* **Fix**: Navigated to Vercel's **Storage** tab, connected the Waline project to the previously created Neon PostgreSQL database (`neon-teal-ocean`) to automatically inject connection variables, and triggered a **Redeploy**. *(Note: Re-running the Neon setup SQL script returned `relation "wl_comment_seq" already exists`, confirming the schema was intact on the database side and only the Vercel environment variables were missing).*

#### Part 2: Client-Side Frontend Issues (Jekyll Integration)

##### 3. The Missing Template Script Inclusion (Jekyll Theme Bug)
On blog post pages, the header title "Leave a Comment" rendered, but the comment area beneath it remained blank.
* **Root Cause**: A logical bug in `_includes/comments.html`. The theme loader script (`comments-providers/scripts.html`) was only included within the `custom` provider case block. When `waline` was activated, the theme rendered the HTML container but skipped loading the JavaScript script entirely.
* **Fix**: Updated `_includes/comments.html` to explicitly include `comments-providers/scripts.html` inside the `waline` case block, allowing the browser to pull the Waline script loader.

##### 4. CDN MIME-Type Warnings & Loading Blocks (unpkg to jsDelivr)
Even after fixing template inclusion, the comment box was blocked. Modern browsers blocked the client script from `unpkg.com` due to strict MIME-type checking (`text/plain` mismatch) and transient network timeouts.
* **Fix**: Migrated the asset source from `unpkg.com` to `cdn.jsdelivr.net`. Wrapped the initialization in a `try...catch` block and added console debug logging to catch and report runtime exceptions cleanly.

##### 5. Dark Mode Contrast Sync
When browser or OS dark mode was enabled, default Waline input fields and text lacked contrast against the website's dark layout, rendering comment text illegible.
* **Root Cause**: Waline defaults to OS-level detection unless tied directly to the host page's DOM state. The Jekyll theme sets a `data-theme="dark"` attribute on the `<html>` root tag when toggled.
* **Fix**: Configured the `dark` option in the Waline `init()` options to target that attribute:
  ```javascript
  init({
    el: '#waline',
    serverURL: 'https://...',
    path: '{{ page.url }}',
    dark: 'html[data-theme="dark"]',
  });
  ```
  This synchronizes the comment box styling with the site's theme toggle in real time.

---

### Production Deployment Checklist

Use this 30-second checklist when wiring Waline into a static site:

- [ ] **Repository First**: Fork/clone the Waline template to GitHub and import it into Vercel *before* attaching storage integrations.
- [ ] **Environment Variables Injected**: Verify that Neon PostgreSQL credentials (`DATABASE_URL` / connection strings) are bound to the Vercel project prior to deployment.
- [ ] **Theme Script Inclusion**: Audit `_includes/comments.html` to ensure the Waline provider block loads `comments-providers/scripts.html`, not just the container element.
- [ ] **Reliable CDN Source**: Pull client assets (`@waline/client`) from `cdn.jsdelivr.net` rather than `unpkg.com` to avoid strict MIME-type rejection.
- [ ] **Theme Selector Binding**: Pass `dark: 'html[data-theme="dark"]'` into `Waline.init()` so styles update dynamically with your site's theme toggle.
