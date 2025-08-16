---
title: 'Domino Data Lab Environment Setup & Docker Container Lessons'
date: 2025-08-06
excerpt: ""
tags:
  - Domino Data Lab
  - Docker Container

---
**Topic:** Setting up Python 3.11 + CUDA environment in Domino Data Lab 

## Table of Contents

1.  Initial Problem 
2.  Understanding Domino Environments 
3.  Environment Creation Process 
4.  Technical Issues & Solutions 
5.  Docker & Container Concepts 
6.  VS Code Integration 
7.  Successful Solution 
8.  Key Lessons Learned 
9.  Next Steps 

-----

## Initial Problem

### User's Requirement: 

  * Need Python 3.10+ with CUDA support for machine learning work 
  * Working in Domino Data Lab platform 
  * Confused about available compute environments 
  * Initially thought Spark was needed (turned out to be unnecessary) 

### Initial Confusion: 

  * What is "Domino 6.0 Spark compute environment"? 
  * Which environment to choose for Python 3.10+ and CUDA? 
  * Difference between various compute environment types 

-----

## Understanding Domino Environments

### Environment Types in Domino 

1.  **Domino Standard Environment (DSE)** - Complete set of libraries and packages 
2.  **Domino Minimal Environment (DME)** - Lighter with fewer packages 
3.  **Custom Environments** - User-built environments for specific needs 

### Available Environment Categories 

  * Standard Data Science environments 
  * GPU/CUDA environments 
  * Spark environments (for distributed computing) 
  * Custom Docker-based environments 

### Key Insight: Spark is NOT needed 

  * **Spark** = Distributed computing across multiple machines 
  * **User's need** = Individual ML work with GPU acceleration 
  * **Solution** = Standard Python + CUDA environment 

-----

## Environment Creation Process

### Initial Approach: Search for Existing 

  * Looked for environments with both Python 3.10+ and CUDA 
  * **Problem**: No pre-built environment matched exact requirements 
  * **Discovery**: Domino allows custom environment creation 

### Solution: Duplicate and Modify Existing Environment 

**Steps Taken:** 

1.  Found base environment: `domino-dse5.3-cuda11.8` (had CUDA 11.8 but Python 3.9) 
2.  Duplicated environment using Domino's interface 
3.  Renamed to: `domino-dse5.3-cuda11.8-py3.11` 
4.  Added custom Dockerfile instruction to upgrade Python 

### Environment Configuration Interface 

**Domino Environment Editor:** 

  * ✓ Environment Base (inherit from existing) 
  * ✓ Supported Cluster Settings (none/Spark/Ray/Dask/MPI) 
  * ✓ Dockerfile Instructions (custom modifications) 
  * ✓ Pluggable Workspace Tools 
  * ✓ Run Setup Scripts 
  * ✓ Environment Variables 
  * ✓ Advanced Settings 

-----

## Technical Issues & Solutions

### Issue 1: SSL Certificate Verification Error 

**Error Message:** 
`CondaSSLError: Encountered an SSL error. Most likely a certificate verification issue.` 
`Exception: HTTPSConnectionPool (host='repo.anaconda.com', port=443): Max retries exceeded with url: /pkgs/main/linux-64/current_repodata.json (Caused by SSLError(SSLCertVerificationError(1, '[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self signed certificate in certificate chain (ssl.c:1129)')))` 

**Root Cause:** 

  * Corporate network with proxy servers/firewalls 
  * Self-signed certificates in certificate chain 
  * Conda refusing "unsafe" connections for security 

**Solution Applied:** 

```shell
RUN conda config --set ssl_verify false && conda install -c conda-forge python=3.11 -y
```

**Why This Works:** 
* Disables SSL verification for conda 
* Uses `conda-forge` channel (community-maintained, often more reliable) 
* Safe in controlled Domino environment 

### Issue 2: Long Build Times 
**Observed Behavior:** 
* Build process took 30+ minutes 
* Multiple dependency resolution attempts 
* "failed with initial frozen solve. Retrying with flexible solve" 

**Explanation:** 
* Python 3.9 -> 3.11: Major version upgrade 
* Complex dependencies in scientific computing stack 
* CUDA compatibility checks required 
* Network latency downloading packages 

**Normal Build Process:** 
1.  Collecting package metadata (current_repodata.json) 
2.  Solving environment (frozen solve) ❌ 
3.  Solving environment (flexible solve) ☑️ 
4.  Collecting package metadata (repodata.json) 
5.  Final dependency resolution... (in progress) 

### Issue 3: Jupyter Notebook Startup Failure 
**Error Message:** 
`ModuleNotFoundError: No module named 'notebook.notebookapp'` 

**Root Cause:** 
* Python 3.11 upgrade changed Jupyter architecture 
* Jupyter Notebook 7.0+ restructured/relocated `notebook.notebookapp` module during architectural changes 
* Default Domino workspace configuration expects classic Notebook interface 

**Solutions Attempted:** 
1.  **Updated Dockerfile** - Added specific Jupyter packages: 
    ```shell
    RUN pip install jupyterlab notebook nbconvert ipykernel
    ``` 
2.  **IDE Selection** - Switched from "Jupyter" to "JupyterLab" in workspace creation 

**Resolution:** 
* JupyterLab works perfectly with Python 3.11 
* Classic Jupyter Notebook fails due to module incompatibility 
* Root issue: Jupyter ecosystem evolution and backward compatibility 

-----

## Docker & Container Concepts

### Key Conceptual Learning 
**Traditional Software Deployment Problems:** 
* "Works on my machine" syndrome 
* Environment configuration complexity 
* Dependency conflicts between applications 

**Docker's Solution:** 
* Standardized containers = Software + Dependencies + Environment 
* Write once, run anywhere philosophy 
* Isolation without full virtualization overhead 

### Docker vs Python Virtual Environment 
| Feature | Python Virtual Env | Docker Container |
| :--- | :--- | :--- |
| **Scope** | Python packages only | Entire OS + applications |
| **Isolation**| Python-level | System-level |
| **Size** | MB-level | GB-level |
| **Includes** | Python libs | OS + Python + CUDA + tools |
| **Use Case** | Development | Development + Production |


### Docker Naming Etymology 
* **Docker** = Dock worker (stevedore) 
* **Analogy**: Shipping containers revolutionized cargo transport 
* Software containers standardize application deployment 
* Docker "workers" manage these "software containers" 

### Domino Environment = Enhanced Docker Container 
**Domino Environment Contains:** 
* ✓ Base Linux OS (Ubuntu/CentOS) 
* ✓ Python Environment (specific version + packages) 
* ✓ GPU Support (CUDA drivers + cuDNN) 
* ✓ Development Tools (Jupyter, VS Code, Git) 
* ✓ Pre-installed ML Libraries (NumPy, Pandas, PyTorch) 
* ✓ Domino-specific integrations 
* ✓ Workspace management tools 

-----

## VS Code Integration

### Installed Extensions Analysis 
**Core Extensions (Essential):** 
* ✔ **Docker** (Microsoft) - Main Docker management tool 
* ✔ **Dev Containers** (Microsoft) - Remote development in containers 

**Optional Extensions:** 
* **Container Tools** (Microsoft) - Azure integration (can uninstall if not using Azure) 
* **Docker DX** (Docker) - Official Docker UI enhancements 

### Development Workflow Options 
**Method 1: SSH Connection (Recommended)** 
* Local VS Code <-> SSH <-> Domino Instance (GPU) 
    * **Local**: editing, personal settings, extensions 
    * **Remote**: execution, GPU computation, large memory 

**Method 2: Web-based VS Code** 
* Runs entirely in browser 
* No local VS Code benefits 
* Good for quick edits 

**Method 3: Dev Containers (Local)** 
* Runs containers locally 
* No access to Domino's GPU resources 
* Good for development/testing 

### Ideal Development Setup 
1.  **Environment Creation**: Domino platform (Python 3.11 + CUDA) 
2.  **Code Editing**: Local VS Code with personal configuration 
3.  **Code Execution**: Remote Domino instance with GPU 
4.  **File Synchronization**: Automatic via SSH 
5.  **Result Analysis**: Local tools with remote data 

-----

## SUCCESSFUL SOLUTION: Official Domino Method

### Discovery of Official Documentation 
After the conda approach failed, we discovered official Domino documentation for installing Python 3.11, which provided a much more efficient solution. 
* **Source**: Installing Python 3.11 in a Domino Compute Environment (Sep 27, 2024) 

### Why the Official Method Works Better 
| Aspect | Conda Approach (Failed) | Official Method (Success) |
| :--- | :--- | :--- |
| **Strategy** | Upgrade existing Python in conda env | Install new Python via system packages |
| **Dependencies**| Must resolve 200+ scientific packages | Bypasses conda dependency resolution |
| **CUDA Handling**| Tries to maintain compatibility | Preserves existing CUDA installation |
| **Build Time** | 1+ hours (failed) | ~3 minutes |
| **Success Rate** | Failed | ✓ Successful |


### Final Working Dockerfile 
```dockerfile
USER root 

# Clean problematic repositories and install Python 3.11
RUN rm -f /etc/apt/sources.list.d/pgdg.list && \
    apt update && \
    apt install software-properties-common -y && \
    add-apt-repository ppa:deadsnakes/ppa && \
    apt update && \
    apt install python3.11 python3.11-distutils -y 

# Set Python 3.11 as default python and python3 commands
RUN update-alternatives --install /opt/conda/bin/python python /usr/bin/python3.11 1 
RUN update-alternatives --install /opt/conda/bin/python3 python3 /usr/bin/python3.11 1 

# Install pip for Python 3.11
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11 

# Install PyTorch with CUDA 11.8 support and scientific packages
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118 && \
    pip install jupyterlab notebook nbconvert ipykernel && \
    pip install numpy pandas matplotlib scikit-learn 

USER ubuntu 
```

### Step-by-Step Command Explanation 

1.  **User Permission Management** 

      * `USER root` 
      * **Purpose**: Switch to root user for system-level package installation. 
      * **Why needed**: Installing system packages requires administrator privileges. 

2.  **Repository Cleanup and Python Installation** 

      * `RUN rm -f /etc/apt/sources.list.d/pgdg.list && \
` 
          * **Purpose**: Remove problematic PostgreSQL repository. 
      * `apt update && \
` 
          * **Purpose**: Refresh package lists after cleaning repositories. 
      * `apt install software-properties-common -y && \
` 
          * **Purpose**: Install repository management tools. 
      * `add-apt-repository ppa:deadsnakes/ppa && \
` 
          * **Purpose**: Add `deadsnakes` Personal Package Archive, which provides the latest Python versions for Ubuntu. 
      * `apt update && \
` 
          * **Purpose**: Refresh package lists to include new repository. 
      * `apt install python3.11 python3.11-distutils -y` 
          * **Result**: Clean Python 3.11 installation alongside existing Python 3.9. 

3.  **Python Command Redirection** 

      * `RUN update-alternatives --install /opt/conda/bin/python python /usr/bin/python3.11 1` 
          * **Purpose**: Make `python` command invoke Python 3.11. 
      * `RUN update-alternatives --install /opt/conda/bin/python3 python3 /usr/bin/python3.11 1` 
          * **Purpose**: Make `python3` command also invoke Python 3.11. 

4.  **Package Manager Installation** 

      * `RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11` 
          * **Purpose**: Download the official pip installer script and execute it with the new Python 3.11. 

5.  **PyTorch and Scientific Packages** 

      * `RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118 && \
` 
          * `--index-url`: Specifies the PyTorch repository with versions compiled for CUDA 11.8. 
      * `pip install jupyterlab notebook nbconvert ipykernel && \
` 
      * `pip install numpy pandas matplotlib scikit-learn` 
          * Installs the essential scientific computing and Jupyter stack. 

6.  **Security Best Practice** 

      * `USER ubuntu` 
      * **Purpose**: Switch back to a non-privileged user. 
      * **Security**: Prevents applications from running with root privileges, which is a standard practice. 

-----

## Build Results: Success! 

  * **Total build time**: ~13 minutes 
  * **Total process time**: 3 minutes coding + 10 minutes Docker build/push 

**Successfully Installed:** 

  * Python 3.11.13 
  * PyTorch 2.7.1+cu118 
  * All NVIDIA CUDA packages (cublas, cudnn, etc.) 
  * Complete scientific computing stack 
  * Jupyter notebook environment 

**Key Success Factors:** 

1.  **System-level approach**: Used `apt` instead of fighting conda dependencies. 
2.  **Repository management**: Properly cleaned and added Python repositories. 
3.  **Preserved CUDA**: Kept existing GPU drivers and toolkit intact. 
4.  **Official methodology**: Followed Domino's recommended approach. 
5.  **Efficient layering**: Each Docker layer had a clear, focused purpose. 

**Final Status:** 

  * ✔ Environment builds successfully 
  * ✔ JupyterLab starts without errors 
  * ✔ Python 3.11 + CUDA + PyTorch working perfectly 
  * ✔ GPU access confirmed (NVIDIA A10G with 23GB VRAM) 
  * ❌ Classic Jupyter Notebook fails (module compatibility issue) 

-----

## Key Lessons Learned

### Technical Lessons 

1.  **Environment Hierarchy**: Choose the CUDA environment first, then upgrade Python. Installing CUDA later is difficult as it requires system-level privileges not available in a running container. 
2.  **Corporate Network Challenges**: SSL certificate issues are common. `conda-forge` is often a more reliable channel, and disabling SSL verification can be safe in controlled environments. 
3.  **Dependency Management**: Major Python version upgrades can take significant time due to complex interdependencies in the scientific computing stack. 
4.  **Container vs. Virtual Environment**: Containers provide full system-level isolation, whereas virtual environments only isolate Python packages. Containers are essential for reproducible ML and GPU computing. 

### Practical Lessons 

1.  **Platform Understanding**: Realize that Domino environments are sophisticated Docker containers and that custom environment creation is a powerful and necessary feature. 
2.  **Development Workflow**: Using local tools for development while connecting to remote resources for execution provides the best experience. SSH is the key to this professional setup. 
3.  **Problem-Solving Approach**: Start with existing solutions and modify them. Understand the root cause before applying a fix, especially in corporate environments. 

### The Ultimate Lesson:

When facing complex technical challenges, **always check if the platform vendor has official guidance** before attempting custom solutions. The official Domino method took ~3 minutes versus over an hour of failed attempts with conda. 

-----

## Next Steps

### Immediate Actions 

1.  **Test Environment**: Run verification scripts for Python version and PyTorch/CUDA availability. 
2.  **Set Up SSH Connection**: Install the Remote-SSH extension in VS Code and configure the connection using credentials from the Domino workspace. 
3.  **Validate GPU Access**: Run code to confirm the GPU device name and memory. 

### Future Learning Opportunities 

  * **Advanced Docker**: Explore multi-stage builds, Docker Compose, and container optimization. 
  * **ML Infrastructure**: Learn about model deployment, MLOps pipelines, and scalable training architectures. 
  * **Development Tools**: Investigate remote debugging, container-based CI/CD, and environment versioning. 
