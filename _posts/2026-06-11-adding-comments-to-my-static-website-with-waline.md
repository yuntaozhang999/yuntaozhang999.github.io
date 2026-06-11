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
---

Recently, I successfully added a comment system to my personal website (hosted on GitHub Pages) using Waline. Following the official [Waline Get Started Guide](https://waline.js.org/guide/get-started/), I set up the client and backend step-by-step. Through this process, I gained a much clearer understanding of how Vercel, databases, and serverless cloud functions work together to bring dynamic features to a static website.

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
