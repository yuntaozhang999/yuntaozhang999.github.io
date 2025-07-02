---
title: 'Tutorial: Building a multi-modal researcher with Gemini 2.5'
date: 2025-07-01
permalink: /posts/2025/07/Building a multi-modal researcher with Gemini 2.5/
tags:
  - Tutorial
  - langchain
  - Gemini
  - Multi-Modal  
---
[Full tutorial on YouTube](https://www.youtube.com/watch?v=6Ww5uyS0tXw)

[Code on GitHub](https://github.com/langchain-ai/multi-modal-researcher)

[Note on Notion](https://mirror-feeling-d80.notion.site/Gemini-2-5-21e808527b1780c994fdde9349f448c3)

Tutorial summary:

-
Lance from Langchain demonstrates a simple multi-modal researcher built with Gemini 2.5 models. This tool uses Gemini’s native search, YouTube video understanding, and text-to-speech capabilities to research a topic and a related video, combine the findings into a report, and generate a podcast summarizing the results. The workflow is orchestrated in Langraph Studio, allowing users to input a topic and YouTube URL, then view each step’s inputs and outputs. The Gemini 2.5 models are highlighted for their strong performance, multimodal abilities, and ease of integration. The code is modular, with nodes for search, video analysis, report generation, and podcast creation. Users can easily configure model parameters in the Studio interface. The project is open source and customizable, encouraging experimentation with Gemini’s advanced features.


## Tips & Tricks for Running This App on Windows with PowerShell

### 1. Installing `uvx` with `pipx`

- Open PowerShell and install `pipx` (if not already installed):
  ```powershell
  pip install pipx
  ```
- Install `uv` (which provides `uvx`):
  ```powershell
  pipx install uv
  ```
- If you see a warning about `C:\Users\<your-username>\.local\bin` not being in your `PATH`, run:
  ```powershell
  pipx ensurepath
  ```
  Then **restart PowerShell** to update your `PATH`.

---

### 2. Making Sure `uvx` is Available

- After installation, check if `uvx` is available:
  ```powershell
  uvx --version
  ```
- If you get a `'uvx' is not recognized` error, either:
  - Restart PowerShell (to reload your `PATH`), or
  - Use the full path to run `uvx`:
    ```powershell
    & "$env:USERPROFILE\.local\bin\uvx.exe" --version
    ```

---

### 3. Setting Environment Variables

#### Option A: Use a `.env` File (Recommended)
- Copy `.env.example` to `.env`:
  ```powershell
  cp .env.example .env
  ```
- Edit `.env` and add your API keys:
  ```
  GEMINI_API_KEY=your_gemini_api_key
  LANGSMITH_API_KEY=your_langsmith_api_key
  ```
- The app will automatically load variables from `.env` (as specified in `langgraph.json`).

#### Option B: Set Variables in PowerShell Session
- Set variables for the current session:
  ```powershell
  $env:GEMINI_API_KEY="your_gemini_api_key"
  $env:LANGSMITH_API_KEY="your_langsmith_api_key"
  ```
- **Important:** You must start the app from the same PowerShell window.

#### Option C: Set System Environment Variables
- Add variables via Windows System Properties > Environment Variables.
- **Note:** You must log out and log back in (or restart) for changes to take effect in new terminals.

---

### 4. Running the App

- Use the following command to install dependencies and start the server:
  ```powershell
  uvx --refresh --from "langgraph-cli[inmem]" --with-editable . --python 3.11 langgraph dev --allow-blocking
  ```
- If `uvx` is not recognized, use the full path as shown above.

---

### 5. Accessing the Application

- After starting, the app will print URLs such as:
  - API: [http://127.0.0.1:2024](http://127.0.0.1:2024)
  - Studio UI: [https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024](https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024)
  - API Docs: [http://127.0.0.1:2024/docs](http://127.0.0.1:2024/docs)

---

### 6. Common Issues & Solutions

| Issue/Symptom                                  | Solution                                                                                  |
|------------------------------------------------|-------------------------------------------------------------------------------------------|
| `'uvx' is not recognized`                      | Run `pipx ensurepath` and restart PowerShell, or use the full path to `uvx.exe`           |
| API key not detected by app                    | Make sure you set the variable in `.env` or in the same PowerShell session, then restart  |
| API key set but still not detected             | Log out and log back in, or restart your computer                                         |
| Web UI warns about missing `LANGSMITH_API_KEY` | This is just a prompt; only needed for LangSmith cloud features, not for local operation  |
| `.env` changes not taking effect               | Restart the app after editing `.env`                                                      |

---

### 7. Additional Tips

- Always restart PowerShell after changing environment variables or installing new CLI tools.
- Use the `.env` file for local development to avoid issues with session-based environment variables.
- If you need to debug environment variables, run:
  ```powershell
  Get-ChildItem Env:
  ```
- For persistent system-wide variables, use Windows Environment Variables settings and restart your session.

---

**Summary:**  
Carefully follow the installation and environment setup steps above to ensure a smooth experience running this app on Windows with PowerShell. Most issues are related to environment variables or PATH settings—restart your terminal or computer after making changes!