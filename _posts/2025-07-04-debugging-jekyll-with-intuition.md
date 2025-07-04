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

I recently decided to add my two pending U.S. patent applications to my personal website. I created the markdown files in the `_publications` folder, filled in the details, and pushed the changes. But when I checked the live site, they were nowhere to be found. My peer-reviewed journal articles were all there, but the patents were missing.

Even though I'm not a Jekyll expert, my intuition told me the problem was likely related to how the site categorizes publications. I noticed my journal articles had `category: manuscripts` in their front matter, while my new patent files had `category: patents`. It seemed logical that the website was probably configured to only recognize and display a specific list of categories.

To test this theory, I first looked at `_pages/publications.html`, the file that controls the layout of my publications page. I wanted to see how it decided which publications to show. Inside, I found this key piece of Liquid code:

{% raw %}
```html
{% if site.publication_category %}
  {% for category in site.publication_category  %}
    ...
    {% for post in site.publications reversed %}
      {% if post.category != category[0] %}
        {% continue %}
      {% endif %}
    ...
```
{% endraw %}

This was the smoking gun! The code loops through a list called `site.publication_category` and only displays posts whose category matches an item in that list. This confirmed my suspicion: the list of allowed categories was defined somewhere in the site's main configuration.

The next logical step was to find that list. I opened up the main configuration file, `_config.yml`, and scrolled through. Sure enough, I found this block:

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