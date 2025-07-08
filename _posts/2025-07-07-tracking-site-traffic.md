---
title: 'How to Add Google Analytics to a Jekyll Academic Pages Website'
date: 2025-07-07
excerpt: ""
tags:
  - Jekyll
  - Google Analytics
  - Website
  - Tutorial
  - Academic Pages
---

If you have a personal website, you'll probably want to know if anyone is visiting it. Google Analytics is a powerful and popular tool for tracking website traffic. I recently set it up for my own site, which is built with the [Academic Pages](https://academicpages.github.io/) Jekyll template, and the process was much simpler than I initially thought.

### The Obvious (But Not Ideal) Way

My first instinct was to take the Google Analytics script snippet and paste it directly into one of the theme's HTML files. The script looks something like this:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
</script>
```

While this works, it's not the best practice for a theme-based site. Modifying the theme's core files directly can make it difficult to update the theme later without losing your changes. Luckily, the Academic Pages template provides a much cleaner, built-in solution.

### The Right Way: Using `_config.yml`

The best way to add Google Analytics is through the site's main configuration file, `_config.yml`. This keeps your personal tracking ID separate from the theme's code.

When I first looked at my `_config.yml`, I found this section:

```yaml
# Analytics
analytics:
  provider               : "false" # false (default), "google", "google-universal", "google-analytics-4", "custom"
  google:
    tracking_id          : "G-XXXXXXXXXX"
```

I had correctly added my `tracking_id`, but I had missed a crucial step: the `provider` was set to `"false"`. This setting explicitly tells the site *not* to use any analytics service.

### Why the Provider Matters: GA4 vs. Universal Analytics

The key was to choose the correct provider. The comment in the config file lists a few options: `"google"`, `"google-universal"`, and `"google-analytics-4"`.

The choice depends on the format of your tracking ID:
*   **`google-analytics-4`**: This is for the current version of Google Analytics (GA4). All new tracking IDs start with `G-`, like mine (`G-XXXXXXXXXX`). This is the correct option for any new setup.
*   **`google-universal`**: This was for the older, now-deprecated Universal Analytics. Its tracking IDs started with `UA-`.

Since my ID starts with `G-`, the fix was simple. I just had to change the provider.

Here is the final, correct configuration:
```yaml
analytics:
  provider               : "google-analytics-4"
  google:
    tracking_id          : "G-XXXXXXXXXX"
```

After making this change and pushing it to my GitHub repository, Google Analytics was successfully enabled. It's worth noting that it can take 24-48 hours for new data to start appearing in your Google Analytics dashboard.
