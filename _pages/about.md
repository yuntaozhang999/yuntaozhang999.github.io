---
permalink: /
title: "Academic Pages is a ready-to-fork GitHub Pages template for academic personal websites"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

This is the front page of a website that is powered by the [Academic Pages template](https://github.com/academicpages/academicpages.github.io) and hosted on GitHub pages. [GitHub pages](https://pages.github.com) is a free service in which websites are built and hosted from code and data stored in a GitHub repository, automatically updating when a new commit is made to the repository. This template was forked from the [Minimal Mistakes Jekyll Theme](https://mmistakes.github.io/minimal-mistakes/) created by Michael Rose, and then extended to support the kinds of content that academics have: publications, talks, teaching, a portfolio, blog posts, and a dynamically-generated CV. You can fork [this template](https://github.com/academicpages/academicpages.github.io) right now, modify the configuration and markdown files, add your own PDFs and other content, and have your own site for free, with no ads!

A data-driven personal website
======
Like many other Jekyll-based GitHub Pages templates, Academic Pages makes you separate the website's content from its form. The content & metadata of your website are in structured markdown files, while various other files constitute the theme, specifying how to transform that content & metadata into HTML pages. You keep these various markdown (.md), YAML (.yml), HTML, and CSS files in a public GitHub repository. Each time you commit and push an update to the repository, the [GitHub pages](https://pages.github.com/) service creates static HTML pages based on these files, which are hosted on GitHub's servers free of charge.

Many of the features of dynamic content management systems (like Wordpress) can be achieved in this fashion, using a fraction of the computational resources and with far less vulnerability to hacking and DDoSing. You can also modify the theme to your heart's content without touching the content of your site. If you get to a point where you've broken something in Jekyll/HTML/CSS beyond repair, your markdown files describing your talks, publications, etc. are safe. You can rollback the changes or even delete the repository and start over - just be sure to save the markdown files! Finally, you can also write scripts that process the structured data on the site, such as [this one](https://github.com/academicpages/academicpages.github.io/blob/master/talkmap.ipynb) that analyzes metadata in pages about talks to display [a map of every location you've given a talk](https://academicpages.github.io/talkmap.html).

Getting started
======
1. Register a GitHub account if you don't have one and confirm your e-mail (required!)
1. Fork [this template](https://github.com/academicpages/academicpages.github.io) by clicking the "Use this template" button in the top right. 
1. Go to the repository's settings (rightmost item in the tabs that start with "Code", should be below "Unwatch"). Rename the repository "[your GitHub username].github.io", which will also be your website's URL.
1. Set site-wide configuration and create content & metadata (see below -- also see [this set of diffs](http://archive.is/3TPas) showing what files were changed to set up [an example site](https://getorg-testacct.github.io) for a user with the username "getorg-testacct")
1. Upload any files (like PDFs, .zip files, etc.) to the files/ directory. They will appear at https://[your GitHub username].github.io/files/example.pdf.  
1. Check status by going to the repository settings, in the "GitHub pages" section

Site-wide configuration
------
The main configuration file for the site is in the base directory in [_config.yml](https://github.com/academicpages/academicpages.github.io/blob/master/_config.yml), which defines the content in the sidebars and other site-wide features. You will need to replace the default variables with ones about yourself and your site's github repository. The configuration file for the top menu is in [_data/navigation.yml](https://github.com/academicpages/academicpages.github.io/blob/master/_data/navigation.yml). For example, if you don't have a portfolio or blog posts, you can remove those items from that navigation.yml file to remove them from the header. 

Create content & metadata
------
For site content, there is one markdown file for each type of content, which are stored in directories like _publications, _talks, _posts, _teaching, or _pages. For example, each talk is a markdown file in the [_talks directory](https://github.com/academicpages/academicpages.github.io/tree/master/_talks). At the top of each markdown file is structured data in YAML about the talk, which the theme will parse to do lots of cool stuff. The same structured data about a talk is used to generate the list of talks on the [Talks page](https://academicpages.github.io/talks), each [individual page](https://academicpages.github.io/talks/2012-03-01-talk-1) for specific talks, the talks section for the [CV page](https://academicpages.github.io/cv), and the [map of places you've given a talk](https://academicpages.github.io/talkmap.html) (if you run this [python file](https://github.com/academicpages/academicpages.github.io/blob/master/talkmap.py) or [Jupyter notebook](https://github.com/academicpages/academicpages.github.io/blob/master/talkmap.ipynb), which creates the HTML for the map based on the contents of the _talks directory).

**Markdown generator**

The repository includes [a set of Jupyter notebooks](https://github.com/academicpages/academicpages.github.io/tree/master/markdown_generator
) that converts a CSV containing structured data about talks or presentations into individual markdown files that will be properly formatted for the Academic Pages template. The sample CSVs in that directory are the ones I used to create my own personal website at stuartgeiger.com. My usual workflow is that I keep a spreadsheet of my publications and talks, then run the code in these notebooks to generate the markdown files, then commit and push them to the GitHub repository.

How to edit your site's GitHub repository
------
Many people use a git client to create files on their local computer and then push them to GitHub's servers. If you are not familiar with git, you can directly edit these configuration and markdown files directly in the github.com interface. Navigate to a file (like [this one](https://github.com/academicpages/academicpages.github.io/blob/master/_talks/2012-03-01-talk-1.md) and click the pencil icon in the top right of the content preview (to the right of the "Raw | Blame | History" buttons). You can delete a file by clicking the trashcan icon to the right of the pencil icon. You can also create new files or upload files by navigating to a directory and clicking the "Create new file" or "Upload files" buttons. 

Example: editing a markdown file for a talk
![Editing a markdown file for a talk](/images/editing-talk.png)

For more info
------
More info about configuring Academic Pages can be found in [the guide](https://academicpages.github.io/markdown/), the [growing wiki](https://github.com/academicpages/academicpages.github.io/wiki), and you can always [ask a question on GitHub](https://github.com/academicpages/academicpages.github.io/discussions). The [guides for the Minimal Mistakes theme](https://mmistakes.github.io/minimal-mistakes/docs/configuration/) (which this theme was forked from) might also be helpful.

---
permalink: /
title: "Academic Pages 是一个可直接复刻的 GitHub Pages 学术个人主页模板"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

这是一个由 [Academic Pages 模板](https://github.com/academicpages/academicpages.github.io) 驱动并托管在 GitHub Pages 上的网站首页。[GitHub Pages](https://pages.github.com) 是一项免费服务，网站通过存储在 GitHub 仓库中的代码和数据构建和托管，每当仓库有新提交时会自动更新。本模板基于 Michael Rose 创建的 [Minimal Mistakes Jekyll 主题](https://mmistakes.github.io/minimal-mistakes/) 进行复刻，并扩展以支持学术内容：出版物、报告、教学、作品集、博客文章和动态生成的简历。你可以立即复刻[本模板](https://github.com/academicpages/academicpages.github.io)，修改配置和 markdown 文件，添加自己的 PDF 和其他内容，免费拥有自己的网站，无广告！

数据驱动的个人网站
======
与许多其他基于 Jekyll 的 GitHub Pages 模板一样，Academic Pages 让你将网站内容与形式分离。你网站的内容和元数据存储在结构化的 markdown 文件中，而其他文件则构成主题，指定如何将内容和元数据转换为 HTML 页面。你将这些 markdown（.md）、YAML（.yml）、HTML 和 CSS 文件保存在公共 GitHub 仓库中。每次提交并推送更新到仓库时，[GitHub Pages](https://pages.github.com/) 服务会基于这些文件生成静态 HTML 页面，并免费托管在 GitHub 服务器上。

许多动态内容管理系统（如 Wordpress）的功能都可以通过这种方式实现，所需计算资源极少，且更不易受到黑客攻击和 DDoS 攻击。你还可以随意修改主题，而无需更改网站内容。如果你在 Jekyll/HTML/CSS 上出现了无法修复的问题，你的 markdown 文件（如讲座、出版物等）依然安全。你可以回滚更改，甚至删除仓库重新开始——只需确保保存好 markdown 文件！你还可以编写脚本处理网站上的结构化数据，比如[这个](https://github.com/academicpages/academicpages.github.io/blob/master/talkmap.ipynb)，它分析讲座页面的元数据并展示[你做过报告的所有地点地图](https://academicpages.github.io/talkmap.html)。

入门指南
======
1. 注册 GitHub 账号（如果还没有），并确认你的邮箱（必需！）
1. 点击右上角的“Use this template”按钮，复刻[本模板](https://github.com/academicpages/academicpages.github.io)。
1. 进入仓库设置（在“Code”等标签最右侧），将仓库重命名为“[你的 GitHub 用户名].github.io”，这也将成为你网站的 URL。
1. 设置全站配置并创建内容和元数据（见下文——也可参考[这个差异集](http://archive.is/3TPas)，展示了为用户名“getorg-testacct”设置[示例网站](https://getorg-testacct.github.io)时更改的文件）
1. 上传任何文件（如 PDF、.zip 等）到 files/ 目录。它们将显示在 https://[你的 GitHub 用户名].github.io/files/example.pdf。
1. 在仓库设置的“GitHub Pages”部分检查状态

全站配置
------
网站的主配置文件位于根目录下的 [_config.yml](https://github.com/academicpages/academicpages.github.io/blob/master/_config.yml)，定义侧边栏和其他全站功能。你需要将默认变量替换为你自己和你网站仓库的信息。顶部菜单的配置文件在 [_data/navigation.yml](https://github.com/academicpages/academicpages.github.io/blob/master/_data/navigation.yml)。例如，如果你没有作品集或博客，可以从 navigation.yml 文件中移除这些项目，从而在头部导航中去除它们。

创建内容和元数据
------
对于网站内容，每种类型都有一个 markdown 文件，存储在 _publications、_talks、_posts、_teaching 或 _pages 等目录下。例如，每个讲座是 [_talks 目录](https://github.com/academicpages/academicpages.github.io/tree/master/_talks) 下的一个 markdown 文件。每个 markdown 文件顶部都有 YAML 格式的结构化数据，主题会解析这些数据以实现多种功能。关于讲座的同样结构化数据会用于生成 [讲座页面](https://academicpages.github.io/talks)的列表、每个[具体讲座页面](https://academicpages.github.io/talks/2012-03-01-talk-1)、[简历页面](https://academicpages.github.io/cv)的讲座部分，以及[讲座地点地图](https://academicpages.github.io/talkmap.html)（如果你运行[这个 python 文件](https://github.com/academicpages/academicpages.github.io/blob/master/talkmap.py)或[Jupyter notebook](https://github.com/academicpages/academicpages.github.io/blob/master/talkmap.ipynb)，它会根据 _talks 目录内容生成地图的 HTML）。

**Markdown 生成器**

本仓库包含[一组 Jupyter notebook](https://github.com/academicpages/academicpages.github.io/tree/master/markdown_generator
)，可将包含讲座或报告结构化数据的 CSV 转换为适合 Academic Pages 模板的 markdown 文件。该目录下的示例 CSV 就是我用来创建个人网站 stuartgeiger.com 的。我的常规流程是：维护一个包含出版物和讲座的表格，然后运行 notebook 代码生成 markdown 文件，最后提交并推送到 GitHub 仓库。

如何编辑你网站的 GitHub 仓库
------
许多人使用 git 客户端在本地电脑创建文件，然后推送到 GitHub 服务器。如果你不熟悉 git，也可以直接在 github.com 界面编辑这些配置和 markdown 文件。导航到某个文件（比如[这个](https://github.com/academicpages/academicpages.github.io/blob/master/_talks/2012-03-01-talk-1.md)），点击内容预览右上角的铅笔图标（在“Raw | Blame | History”按钮右侧）。点击铅笔图标右侧的垃圾桶图标可以删除文件。你还可以通过导航到目录并点击“Create new file”或“Upload files”按钮来创建或上传文件。

示例：编辑讲座的 markdown 文件
![编辑讲座的 markdown 文件](/images/editing-talk.png)

更多信息
------
关于 Academic Pages 配置的更多信息见[指南](https://academicpages.github.io/markdown/)、[不断完善的 wiki](https://github.com/academicpages/academicpages.github.io/wiki)，也可以随时在 [GitHub 上提问](https://github.com/academicpages/academicpages.github.io/discussions)。本主题基于的 [Minimal Mistakes 主题指南](https://mmistakes.github.io/minimal-mistakes/docs/configuration/) 也可能对你有帮助。