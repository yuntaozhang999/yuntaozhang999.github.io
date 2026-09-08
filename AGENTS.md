# Agent Guidelines for Academic Pages (yuntaozhang999.github.io)

**本文档是面向在此仓库中作业的 AI Coding Agent（如 Antigravity, Claude Code 等）及开发者的权威行为准则与操作规范。**

---

## 1. 仓库定位与 Upstream 关系

### 1.1 仓库背景
* 本仓库由官方模板 [academicpages/academicpages.github.io](https://github.com/academicpages/academicpages.github.io) 衍生，作为 **张云涛（Yuntao Zhang）** 的个人学术主页、科研成果与博客展示系统。
* **远端拓扑架构**：
  * **上游模板主干 (`upstream`)**：`https://github.com/academicpages/academicpages.github.io.git`
  * **个人生产远端 (`origin`)**：`https://github.com/yuntaozhang999/yuntaozhang999.github.io.git`
  * **本地生产分支 (`master`)**：直接跟踪 `origin/master`。
* **免 PR 声明**：个人主页的定制化内容与更新**严禁且无需**向 `academicpages.github.io` 提交 Pull Request。

### 1.2 五步上游同步 SOP (Standard Operating Procedure)
当需要吸收上游模板的功能更新、样式优化或安全修复时，必须严格执行以下五步隔离同步流程，严禁直接在 `master` 上执行覆盖操作：

```
[Fetch Upstream] ➔ [Create sync-upstream] ➔ [Merge upstream/master] ➔ [Resolve & Purge] ➔ [Fast-forward & Push]
```

1. **Step 1: 检查工作区并拉取上游最新提交**
   * 确保本地工作区干净：`git status`。
   * 拉取上游最新状态：`git fetch upstream`（若未配置 upstream，需先执行 `git remote add upstream https://github.com/academicpages/academicpages.github.io.git`）。
2. **Step 2: 新建临时隔离分支**
   * 切勿直接在 `master` 分支进行合并测试。
   ```bash
   git checkout master
   git pull origin master
   git checkout -b sync-upstream
   ```
3. **Step 3: 合并上游代码并捕获冲突**
   ```bash
   git merge upstream/master
   ```
   * 若提示 `CONFLICT`，立即运行 `git status` 列出所有冲突文件。
4. **Step 4: 遵循资产保护原则与清理样例**
   * **个人核心数据**：保留本地版本（优先采用 `git checkout --ours <file>` 或手工微调合并）。
   * **框架与样式**：谨慎吸收上游更新，保留本地针对排版与布局的定制修改。
   * **彻底清理样例文件**：上游更新常会带入默认测试博文、报告或样例图片（如 `_posts/`、`_talks/` 下的示例文件），必须逐一识别并执行 `git rm <sample-file>` 予以清除。
   * 完成冲突合并提交：`git commit -m "chore: sync with upstream/master and resolve conflicts"`。
5. **Step 5: 差异核验、快进合并与推送**
   * 审查分支差异：`git diff master..sync-upstream`。
   * 快进合并回主分支：
     ```bash
     git checkout master
     git merge sync-upstream
     git push origin master
     git branch -d sync-upstream
     ```

#### 应急与回滚指南
* 中途放弃合并：`git merge --abort`。
* 关键配置文件误损恢复：`git checkout master -- _config.yml _data/navigation.yml`。
* 清理未跟踪杂质文件：`git clean -fd`。

---

## 2. 核心受保护资产清单 (Protected Assets Registry)

在执行合并、重构或日常维护时，以下文件与目录属于**核心受保护资产**，绝对禁止被上游模板或自动化脚本盲目覆盖：

| 资产路径 | 性质与分类 | 合并与修改策略 | 详细说明 |
| :--- | :--- | :--- | :--- |
| `_config.yml` | **核心保护** | **保留本地 (Ours)** | 包含网站标题、域名 URL、作者社交链接、分析工具配置等，严禁覆盖。 |
| `_data/navigation.yml` | **核心保护** | **保留本地 (Ours)** | 导航栏结构配置及专属页面链接，完全个人定制。 |
| `_pages/` | **核心保护** | **保留本地 (Ours)** | 个人简介 (`about.md`)、简历 (`cv.md`)、404、talkmap 容器等独立页面。 |
| `_posts/` | **核心保护** | **保留本地 (Ours)** | 个人撰写的博客文章；若上游引入演示博文须立即删除。 |
| `_publications/` | **核心保护** | **保留本地 (Ours)** | 个人学术论文、专著及发表元数据。 |
| `_talks/` | **核心保护** | **保留本地 (Ours)** | 个人学术报告、会议演讲与研讨会记录。 |
| `_teaching/` | **核心保护** | **保留本地 (Ours)** | 课程教学与助教履历。 |
| `_portfolio/` | **核心保护** | **保留本地 (Ours)** | 科研项目展示与个人成果集。 |
| `images/` | **核心保护** | **保留本地 (Ours)** | 个人头像、学术插图、博文配图等静态资源。 |
| `files/` | **核心保护** | **保留本地 (Ours)** | 个人简历 PDF、论文预印本及科研附件。 |
| `_layouts/` / `_includes/` | 框架核心 | 谨慎合并 (Theirs + 本地定制) | Jekyll 渲染模板与部件，合并时务必保留本地插入的脚本或 hook。 |
| `_sass/` / `assets/css/` | 样式文件 | 倾向采用上游 (Theirs) | 吸收官方样式修复与新特性，但需检查本地样式微调是否被冲掉。 |
| `Gemfile` / `Gemfile.lock` | 运行依赖 | 谨慎合并 | Ruby 依赖版本，跟随上游维护环境兼容性。 |

---

## 3. 敏感文件与私密草稿管控防线

为了防止个人隐私泄露与未成型研究外溢，本仓库实施严密的隔离与防线控制：

1. **私密草稿命名隔离规则 (`21*.md`)**：
   * 所有以 `21*.md` 命名的文件（例如 `_posts/21*.md`、`_portfolio/21*.md`）均被设计为未来年份占位符或未就绪的私密学术草稿。
   * 该模式已写入 `.gitignore`。
   * **Agent 铁律**：严禁使用 `git add -f` 强制添加此类草稿；严禁在公开发表渠道中泄露草稿内容。
2. **本地运维工具与密钥隔离 (`bot.py`, `.env`)**：
   * `bot.py` 为本地专用自动化/爬虫/通知机器人脚本，包含或依赖本地环境变量，严格被 `.gitignore` 忽略。
   * `.env`、`logs/`、`*.log` 包含运行时敏感配置和日志，绝对禁止推送到 GitHub 远端。
3. **开发环境与代理缓存隔离**：
   * `.venv/`、`venv/`、`env/`、`node_modules/`、`__pycache__/`。
   * AI 辅助开发配置与记忆：`.gemini/`、`.claude/`。
   * 上述目录一律严格本地忽略，严禁进入代码仓库。

---

## 4. Talkmap 与 Python 3.11 规范

### 4.1 功能与工作原理
* `talkmap.py` 负责抓取 `_talks/*.md` 中的 `location` 字段，通过 `geopy`（使用 OpenStreetMap 的 Nominatim 引擎）进行地理编码解析，并利用 `getorg` 输出地图数据与 JS/HTML，最终呈现在 `_pages/talkmap.html`（交互式 Leaflet 报告地图）。

### 4.2 Python 3.11 运行环境要求
* **强环境约束**：生成 Talkmap 必须使用 **Python 3.11** 独立虚拟环境。高版本 Python（如 Python 3.12+）存在对 `getorg` 废弃模块不兼容的问题。
* **执行步骤**：
  ```bash
  # 1. 创建并激活 Python 3.11 虚拟环境
  python3.11 -m venv .venv
  source .venv/bin/activate

  # 2. 安装必要依赖
  pip install python-frontmatter geopy getorg

  # 3. 运行地图生成脚本
  python talkmap.py
  ```
* **限速与礼貌策略**：`talkmap.py` 中必须设置明确的 `user_agent` 与合理的超时重试阈值，切勿高频并发请求，以免被 Nominatim 封禁 IP。

---

## 5. Agent 代码与文档提交铁律

所有接入本仓库作业的 Agent 必须严格遵守以下 Git 提交规范：

1. **绝对禁止全量暂存 (`git add .` / `git add -A`)**：
   * 提交时必须**显式指定具体修改的文件路径**（例如：`git add AGENTS.md`）。
   * 杜绝将偶发的临时文件、构建缓存或被忽略草稿误打包提交。
2. **提交前必须进行 Diff 自检**：
   * 在执行 `git commit` 前，必须通过 `git diff --staged` 或 `git diff <file>` 仔细逐行比对变更内容，确保改动完全符合用户指示与预期。
3. **标准化提交信息 (Conventional Commits)**：
   * 提交消息格式须清晰规范：`<type>: <short summary>`（如 `docs: ...`, `feat: ...`, `fix: ...`, `chore: ...`）。
4. **禁止危险的 Force Push 与 Hard Reset**：
   * 严禁对 `origin/master` 执行 `git push --force`。
   * 严禁在未经用户明确书面授权的情况下执行 `git reset --hard`。
5. **内容真实性原则 (Content Integrity)**：
   * 更新或创建学术博文、出版物或履历时，**仅包含用户明确提供或指示的内容**；严禁从外部搜索中擅自臆造、拼凑未经核实的学术信息。
