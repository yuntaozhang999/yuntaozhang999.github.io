---
title: "Automated Deep Code Review with AI Personas and Scheduled Loops"
date: 2026-05-20
excerpt: ""
---

I recently made two discoveries that, when combined, create an incredibly effective workflow for finding bugs in software projects.

First, I created a custom AI skill that transforms the AI into a highly critical, "genius" software engineer. The goal of this persona is to scrutinize my code and identify logical flaws. By providing it with raw input data to use for validation, the AI acts as a rigorous logical reviewer and is able to find many trivial, yet extremely hard-to-catch bugs.

Second, I started utilizing the loop functionality available in tools like Claude Code, which allows the AI to run tasks automatically at set intervals, such as once every hour.

The real magic happens when combining these two capabilities. I set up the AI to act as this critical code reviewer and configured it to run on a loop every hour. By opening 7 or 8 terminal windows and running this concurrently across multiple projects, the AI executes about 7 to 8 rounds of review a day per project.

The best part is that it requires almost zero manual intervention. The AI simply runs in the background throughout the day, deeply analyzing the code. It consistently uncovers deeply hidden bugs that would otherwise be very difficult to spot. This automated, continuous review process has proven to be an exceptionally powerful and hands-off workflow for improving code quality.
