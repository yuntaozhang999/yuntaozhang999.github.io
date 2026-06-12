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

Recently, I successfully added a comment system to my personal website (hosted on GitHub Pages) using Waline. Following the official [Waline Get Started Guide](https://waline.js.org/guide/get-started/), I set up the client and backend step-by-step. 

Through this process, I gained a much clearer understanding of how Vercel, databases, and serverless cloud functions work together to bring dynamic features to a static website. It was an eye-opening journey into modern web architecture, CI/CD pipelines, and serverless event-driven design.

However, the path to a fully working comment box was not without obstacles. We encountered and resolved several tricky server-side deployment issues and frontend client-side quirks along the way. Below is a detailed record of the troubleshooting challenges we faced and how we solved them.

---

### Vercel as a Serverless Backend: The "On-Demand Temporary Worker"

In the Waline comment system, Vercel plays the role of a **Serverless Backend**. 

In traditional web hosting, you must rent a dedicated virtual server that runs 24/7 (like hiring a full-time security guard). You have to pay a fixed fee, configure Node.js environment, manage firewall rules, and ensure the server automatically restarts if it crashes.

With Vercel's Serverless architecture, this complexity is completely abstract away:
* **On-Demand Running**: When no one is browsing or commenting on my blog, the Waline backend code sits quietly in storage without consuming any CPU or memory resources (and it costs nothing).
* **Cold Starts**: The moment a reader opens a post or submits a comment, Vercel instantly spins up a lightweight sandboxed environment (a **Cloud Function**), loads the Waline backend logic, processes the request, and immediately shuts down afterward. 

### How Cloud Functions Get "Automatically Woken Up"

How does this automatic activation happen? It relies on an **event-driven signal mechanism**, similar to a voice-activated lightbulb in a hallway:

1. **The Signal**: When a reader opens my blog or clicks "Submit", the frontend JavaScript in their browser sends an HTTP network request (e.g., `POST https://your-blog.vercel.app/api/comment`).
2. **The Gateway "Gatekeeper"**: Vercel operates globally distributed routing gateways that run 24/7. When a gateway detects a request coming in for my project, it recognizes that the associated Cloud Function is sleeping and needs to be woken up.
3. **Instant Setup (Cold Start)**: The system instantly allocates CPU/Memory resources, initializes a micro-container, injects the Waline Node.js backend code, and runs it. This setup process happens in milliseconds (usually 0.1 to 1 second).
4. **Dissolution**: The Cloud Function processes the comment, writes it to the **Neon (PostgreSQL) Database**, returns a success response to the blog, and then terminates, releasing all computing resources back to the pool.

### The Role of Neon Database

A comment system needs a permanent memory. Because Serverless Cloud Functions exist only for a split second, they cannot store data. That is where **Neon Database** comes in. It acts as our persistent data layer. Vercel acts as a secure bridge, validating and formatting comment data before storing it in Neon, ensuring database credentials are never exposed to the frontend.

### Why Vercel Links to GitHub (My First Encounter with CI/CD)

Vercel is a runtime environment, not a place to write or store code. By linking Vercel to my GitHub repository, I created an automated pipeline that implements **Continuous Integration and Continuous Deployment (CI/CD)**:

* **The Base Camp**: The GitHub repository holds the backend codebase. If I need to upgrade Waline or tweak configurations, I make changes to my repository.
* **Auto-Build**: Whenever code is pushed to GitHub, it notifies Vercel. Vercel automatically fetches the new code, rebuilds the project, and updates the Cloud Functions in production without any manual server administration.

Interestingly, this was my first time explicitly learning the term "CI/CD". However, I realized I had already been working with a very similar concept at my job using **Domino Data Lab**. On Domino, when we launch a Domino App (model product) linked to our GitHub repository, the app always starts by pulling the latest code from GitHub. Recognizing this parallel made me realize that CI/CD is a universal best practice, whether for personal blogs or enterprise data science products.

---

### Overcoming Integration and Troubleshooting Challenges

Our setup challenges were divided into server-side backend deployment issues and client-side frontend rendering quirks.

#### Part 1: Server-Side Backend Issues (Vercel & Neon Setup)

##### 1. The "Ghost" Redeploy Button and Missing Project
During the initial database configuration, I was instructed to "redeploy" my Vercel project. However, my Vercel Deployments page consistently returned "No Results," even after toggling the status filters (0/7 or 7/7 status checked).
* **The Root Cause**: I had not actually created a Vercel project yet. I was configuring the Neon database integration inside Vercel, but no Waline template had been cloned or associated with my account. Because there was no codebase or deployment history to display, Vercel showed empty search results.
* **The Fix**: I initiated the project setup by clicking the Waline Deploy template, connecting my GitHub account to create a private repository (`my-waline`), and setting up the first official project deployment.

##### 2. The 500 Internal Server Error (Function Invocation Failed)
Immediately after successfully deploying the Waline template, visiting the Vercel app domain resulted in a generic `500: INTERNAL_SERVER_ERROR`.
* **The Root Cause**: The Waline backend crashed during startup because it couldn't connect to a database. Since the database connection credentials were not yet configured in the environment variables, the serverless cloud function threw an unhandled exception.
* **The Fix**: I went to Vercel's **Storage** tab, connected the new Waline project to my previously created Neon database (`neon-teal-ocean`), which automatically injected the required database environment variables. Once connected, I triggered a **Redeploy**, and the cloud function successfully booted up.

*(Note: Trying to run Neon's setup SQL script again returned `relation "wl_comment_seq" already exists`, which confirmed the database schema had actually succeeded on the first run; only Vercel's connection config was missing).*

#### Part 2: Client-Side Frontend Issues (Jekyll Integration)

##### 3. The Missing Template Script Inclusion (Jekyll Theme Bug)
On my blog post pages, the header title "Leave a Comment" rendered, but the comment area beneath it remained blank.
* **The Root Cause**: The Jekyll theme had a logical bug in `_includes/comments.html`. The loader script (`comments-providers/scripts.html`) was only included within the `custom` provider case block. When I activated `waline`, the theme rendered the HTML container but skipped loading the JavaScript script entirely.
* **The Fix**: We updated the `comments.html` template to explicitly include `comments-providers/scripts.html` inside the `waline` case block, allowing the browser to pull the Waline script loader.

##### 4. CDN MIME-Type Warnings and Loading Issues (unpkg to jsDelivr)
Even after fixing the template inclusion, the comment box was blocked. Modern browsers blocked the client script from the `unpkg.com` CDN because of strict MIME-type checking (throwing `text/plain` errors) or network timeout.
* **The Fix**: We migrated the script source from `unpkg.com` to the highly stable `jsDelivr` CDN (`cdn.jsdelivr.net`). We also wrapped the initialization in a `try-catch` block and added console debug messages to gracefully log any errors. The change instantly resolved the browser blocking, rendering the comment box successfully.

##### 5. Contrast Issues with Dark Mode
When my browser and OS were in dark mode, the default Waline input fields and text lacked contrast against the website's dark layout, rendering them unreadable.
* **The Root Cause**: Waline needed to be actively notified of the theme state. Checking the Jekyll theme script showed that whenever my site is in dark mode, it adds a `data-theme="dark"` attribute to the main `<html>` tag.
* **The Fix**: We configured the `dark` option in the Waline `init()` options to target that attribute:
  ```javascript
  init({
    el: '#waline',
    serverURL: 'https://...',
    path: '{{ page.url }}',
    dark: 'html[data-theme="dark"]',
  });
  ```
  Waline now seamlessly syncs with the site's dark mode and toggles in real-time when the theme switch button is clicked.

---

### Reflections: Hindsight is 20/20

Looking back, the entire architecture and setup process make perfect sense. However, during the actual implementation, I was largely stumbling in the dark. 

I still don't quite know how I managed to skip the crucial Vercel project creation step initially—leaving me without a Vercel project or the cloned repository under my account. When you are in the middle of configuring multiple platforms (Vercel, GitHub, and Neon) for the first time, it is easy to get lost in the configurations and lose track of the big picture, rendering the process highly confusing.

Yet, that is the beauty of hands-on learning. Once the final piece of the puzzle clicked and the comment system came alive, returning to review the architecture made everything fall into place. Understanding a concept in hindsight after troubleshooting it is far more rewarding and long-lasting than just following a flawless tutorial step-by-step.

### Conclusion

Integrating a comment system onto a static website turned out to be an incredibly rewarding experience. By leveraging Vercel's serverless Cloud Functions and Neon's database, a lightweight, static GitHub Pages site can enjoy all the dynamic features of a traditional website—with zero maintenance overhead and zero hosting costs.
