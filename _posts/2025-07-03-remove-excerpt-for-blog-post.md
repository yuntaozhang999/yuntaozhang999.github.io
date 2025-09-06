---
title: 'A Simpler Way to Remove Excerpts from Jekyll Blog Posts'
date: 2025-07-03
excerpt: ""
tags:
  - SSG
  - Jekyll
  - Tips
  - Yuntao Zhang
---
 
I wanted my blog's main listing page to be more concise, showing just the titles and metadata for each post. By default, Jekyll grabs the first paragraph of each post to use as a preview (an "excerpt"), which often makes the list look cluttered and unappealing. I needed a way to turn this off.
 
Initially, I thought I'd have to dig into the theme's layout files (`_includes/archive-single.html`) and create custom versions to remove the code that displays the excerpt. While that works, I discovered a much simpler and cleaner method that doesn't require changing any theme files.
 
### The Simple Solution: Define an Empty Excerpt
 
The easiest way to prevent Jekyll from generating an excerpt is to explicitly tell it that the excerpt is empty. You can do this directly in the front matter of any blog post.
 
Simply add the line `excerpt: ""` to the YAML front matter of your Markdown file.
 
Here’s an example of a post's front matter:
 
```markdown
---
title: "My Awesome Blog Post"
date: 2025-07-03
excerpt: ""
tags:
  - Jekyll
  - Tips
---
 
The rest of your post content goes here. Jekyll will no longer automatically create a preview from this text.
```
 
### Why This Works
 
Jekyll has a specific order of operations for excerpts. When it processes a post, it first checks if an `excerpt` value is defined in the front matter.
 
*   **If `excerpt` is defined:** Jekyll uses that value. By setting it to `""` (an empty string), you are effectively telling Jekyll to display nothing.
*   **If `excerpt` is *not* defined:** Jekyll will automatically take the first paragraph of your post and use that as the excerpt.
 
This method is ideal because:
*   **It's Simple:** No need to edit complex Liquid templates.
*   **It's Not Destructive:** You don't have to modify the theme's core files, which makes updating the theme easier in the future.
*   **It's Flexible:** You can decide on a per-post basis whether to show an excerpt or not. If you want a custom excerpt for a specific post, you can just write it in the `excerpt` field instead of leaving it empty.
 
By adding `excerpt: ""` to my posts, I achieved the clean, title-only look I wanted for my blog archive with minimal effort.
