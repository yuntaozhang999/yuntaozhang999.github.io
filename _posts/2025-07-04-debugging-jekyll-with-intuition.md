---
title: "How I Fixed My Jekyll Site with a Bit of Intuition"
date: 2025-07-04
excerpt: ""
tags:
  - Jekyll
  - Debugging
  - Website
  - Personal
  - Yuntao Zhang
---


A quick story about debugging why my new patents weren't showing up on my Jekyll-based academic website, and how a little bit of intuition led to a simple fix.

I recently decided to add my two pending U.S. patent applications to my personal website. I created the markdown files in the `_publications` folder, filled in the details, and pushed the changes. But when I checked the live site, they were nowhere to be found. My peer-reviewed journal articles were all there, but the patents were missing.

Even though I'm not a Jekyll expert, my intuition told me the problem was likely related to how the site categorizes publications. I noticed my journal articles had `category: manuscripts` in their front matter, while my new patent files had `category: patents`. It seemed logical that the website was probably configured to only recognize and display a specific list of categories.

So, I started digging. The most obvious place to look for site-wide settings is the `_config.yml` file. I opened it up and scrolled through, and sure enough, I found this little block of code:

```yaml
# Publication Category - The following the list of publication categories and their headings
publication_category:
  books:
    title: 'Books'
  manuscripts:
    title: 'Journal Articles'    
  conferences:
    title: 'Conference Papers'
```

Just as I suspected! The list defined the exact categories that were showing up on my site, and `patents` wasn't on it.

The fix was incredibly simple. I just added a new entry for `patents`:

```yaml
# In _config.yml
publication_category:
  books:
    title: 'Books'
  manuscripts:
    title: 'Journal Articles'
  patents:
    title: 'Patents' # <-- I added this section
  conferences:
    title: 'Conference Papers'
```

After adding that, I committed the change, and voilà! A new "Patents" section appeared on my publications page with my two pending applications listed perfectly.

It was a satisfying little win. It's a great reminder that sometimes you don't need to be an expert in a specific framework to solve a problem. A bit of logical thinking and trusting your intuition can often get you 90% of the way there.