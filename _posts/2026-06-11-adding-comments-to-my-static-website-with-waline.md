---
title: "Adding Comments to My Static Website: Understanding Vercel, Neon Database, and Serverless Functions"
date: 2026-06-11
layout: post
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
---

Recently, I successfully added a comment system to my personal website (hosted on GitHub Pages) using Waline. Following the official [Waline Get Started Guide](https://waline.js.org/guide/get-started/), I set up the client and backend step-by-step. Through this process, I gained a much clearer understanding of how Vercel, databases, and serverless cloud functions work together to bring dynamic features to a static website.

However, the path to a fully working comment box was not without obstacles. We encountered and resolved several tricky frontend and integration issues along the way. Here is the breakdown of what happened and how we fixed them.

---

### Why Vercel Links to GitHub

I learned that Vercel is a platform designed to host web services and serverless functions. During the setup, Vercel required linking to my GitHub repository. I realized this is because Vercel automates the deployment process: whenever new backend code is pushed to GitHub, Vercel automatically pulls the changes, builds the server application, and deploys it to a live production environment. 

### The Role of Neon Database

A comment system needs to store readers' inputs permanently. For this, I used Neon Database. Neon acts as the persistent storage layer. Every time a reader writes a comment on my website, the data flows to the database, ensuring that comments remain visible even after the page is refreshed or closed.

### How Serverless Cloud Functions Enable Static Site Comments

One of the most fascinating aspects of this setup is how a purely static website (which is just a collection of HTML, CSS, and JavaScript files) can support dynamic comments. This is made possible by Cloud Functions (Serverless).

Instead of maintaining a dedicated server running 24/7, Vercel hosts serverless functions for the Waline API. When a reader loads a blog post or submits a comment:
1. The static website sends an HTTP request to the API domain.
2. The serverless cloud function spins up instantly to handle the request.
3. The function queries or writes to the Neon Database, processes the data, and returns the response to the static web page.
4. The cloud function shuts down immediately after execution.

It feels magical to see how Serverless architecture bridges the gap, giving a lightweight static website the capabilities of a fully-fledged dynamic application.

---

### Overcoming Integration and Troubleshooting Challenges

While setting up the client, we ran into three specific problems:

#### 1. The Missing Template Script Inclusion (Jekyll Theme Bug)
Initially, after configuring Waline in my Jekyll theme, only the header title "Leave a Comment" appeared, and the area below it was completely blank. 

Upon diving into the Jekyll template structure, we discovered a bug in the theme’s `_includes/comments.html` logic: the theme only included the javascript loader script (`comments-providers/scripts.html`) inside the `custom` comments branch. Since I set the provider to `waline`, the theme rendered the container element but never actually loaded or executed the Waline JavaScript. 
* **The Fix**: We updated the `comments.html` template to explicitly include `comments-providers/scripts.html` inside the `waline` branch as well, which successfully triggered the JavaScript engine.

#### 2. CDN MIME-Type Warnings and Loading Issues (unpkg to jsDelivr)
Even after fixing the template script, the comment box remained invisible due to a script loading failure. When importing `@waline/client` via ES modules from the `unpkg.com` CDN, modern browsers blocked the execution. This was due to strict browser security policies (strict MIME-type checks) rejecting the script when the CDN returned wrong headers, along with slow CDN connection speeds.
* **The Fix**: We transitioned to the globally distributed and highly reliable `jsDelivr` CDN (`cdn.jsdelivr.net`). We also wrapped the initialization in a `try-catch` block and added console debug messages to gracefully log any errors. The change instantly resolved the browser blocking, rendering the comment box successfully.

#### 3. Contrast Issues with Dark Mode
Once the comment box rendered, another issue surfaced: because my browser and system were in Dark Mode, the default Waline text colors lacked sufficient contrast against the website's dark background, making them unreadable.

We needed a way to sync Waline's built-in dark theme with the website. By inspecting the theme's core scripts, we found that whenever my website is in dark mode, it adds a `data-theme="dark"` attribute to the main `<html>` tag.
* **The Fix**: We configured the `dark` option in the Waline `init()` options to target that attribute:
  ```javascript
  init({
    el: '#waline',
    serverURL: 'https://...',
    path: '{{ page.url }}',
    dark: 'html[data-theme="dark"]',
  });
  ```
  Now, Waline automatically adapts its colors to the dark background and dynamically toggles in real-time when the theme switch button is clicked.
