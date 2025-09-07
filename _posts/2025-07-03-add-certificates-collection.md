---
title: 'How to Add a New Collection to a Jekyll Academic Pages Website'
date: 2025-07-03
excerpt: ""
tags:
  - SSG
  - Jekyll
  - Yuntao Zhang
---

I recently decided to add a "Certificates" section to my personal website, which is based on the popular Academic Pages Jekyll template. The process involves a few steps of configuration and file creation. Here’s a detailed guide on how I did it, which you can follow to add any new collection (like projects, awards, etc.) to your own Jekyll site.

### Step 1: Configure the New Collection in `_config.yml`

First, you need to tell Jekyll about your new collection. This involves two edits in the `_config.yml` file.

1.  **Define the collection:** Add your new collection to the `collections` list. This makes Jekyll aware of the `_certificates` folder and tells it how to handle the files within. The `output: true` key ensures that Jekyll generates a separate page for each certificate, and `permalink` defines the URL structure for those pages.

    ```yaml
    # In _config.yml
    collections:
      certificates:
        output: true
        permalink: /certificates/:path/
      # ... other collections
    ```

2.  **Set default values:** In the `defaults` section, specify the default front matter for your new collection type. This is a huge time-saver, as you won't have to repeat this information in every single certificate file. Here, we're setting the layout, enabling the author profile, and allowing sharing.

    ```yaml
    # In _config.yml
    defaults:
      # ... other defaults
      # _certificates
      - scope:
          path: ""
          type: certificates
        values:
          layout: single
          author_profile: true
          share: true
          comments: true
    ```

### Step 2: Add a Link to the Navigation Bar

To make your new collection accessible, add a link to it in your site's main navigation menu. You can do this by editing `_data/navigation.yml`.

```yaml
# In _data/navigation.yml
main:
  # ... other links
  - title: "Certificates"
    url: /certificates/
```

### Step 3: Create the Collection Folder and Content

Jekyll collections are stored in folders that start with an underscore.

1.  Create a new folder in your site's root directory named `_certificates`.

2.  Inside this folder, create a Markdown file for each item in your collection. For example, I created `_certificates/2024-associate-python-developer-datacamp.md`.

The content of this file includes front matter (the settings between the `---` lines) and the main content in Markdown.

```markdown
---
title: "Associate Python Developer"
excerpt: "DataCamp Associate Python Developer Certificate.<br/><a href='/files/2024-associate-python-developer-datacamp.pdf' target='_blank'><img src='/images/2024-associate-python-developer-datacamp.png' width='300' alt='Associate Python Developer Certificate'></a>"
collection: certificates
date: 2024-10-21
---

**Issued by:** DataCamp  
**Instructors:** Hugo Bowne-Anderson, Jason Myers, Filip Schouwenaars, Maria Eugenia Inzaugarat, George Boorman  
**Completed on:** October 21, 2024

This is the main content for the certificate page...
```

### Step 4: Create the Collection Archive Page

This is the summary page that lists all the items in your collection (e.g., `yoursite.com/certificates/`).

1.  Create a new file in the `_pages` folder. I named mine `certificates.html`.

2.  Add the following code to the file. This code sets up the page layout and then loops through all the items in `site.certificates` to display them.

    ```html
    ---
    layout: archive
    title: "Certificates"
    permalink: /certificates/
    author_profile: true
    ---

    {% raw %}{% include base_path %}{% endraw %}

    {% raw %}{% for post in site.certificates reversed %}
      {% include archive-single.html %}
    {% endfor %}{% endraw %}
    ```
    **Key Points:**
    *   `layout: archive` uses the theme's predefined list layout.
    *   The loop `{% raw %}{% for post in site.certificates reversed %}{% endraw %}` is crucial. It iterates through all documents in the `certificates` collection.
    *   We use the variable name `post` because the included file, `archive-single.html`, is hardcoded to expect it. This was the source of my original problem!
    *   The `reversed` filter ensures that the newest certificates (by date) appear first.

### Step 5 (Optional): Customize the Display for Your Collection

The `_includes/archive-single.html` file controls how each item is displayed on the archive page. You can add custom logic to it for your new collection. For example, I wanted to show "Completed on:" instead of the default "Published:".

You can do this by adding an `elseif` block for your collection, checking for `post.collection == 'certificates'`.

```liquid
{% raw %}
...existing code...
{% elsif post.collection == 'certificates' %}
  <p class="page__date"><strong><i class="fa fa-fw fa-calendar" aria-hidden="true"></i> Completed on:</strong>
    <time datetime="{{ post.date | default: '1900-01-01' | date_to_xmlschema }}">
      {{ post.date | default: '1900-01-01' | date: '%B %d, %Y' }}
    </time>
  </p>
...existing code...
{% endraw %}
```

### Step 6: Add Supporting Files

If your collection items reference images or documents (like my certificate PDF and PNG), make sure to upload them to the correct folders. I use:
*   `/images/` for PNGs and JPEGs.
*   `/files/` for PDFs.

The paths in your Markdown files (e.g., `href='/files/...'` and `src='/images/...'`) should be relative to the root of your website.

And that's it! By following these steps, you can cleanly and effectively add any new collection to your Jekyll site. The process is repeatable for portfolios, awards, or any other custom content you want to showcase.