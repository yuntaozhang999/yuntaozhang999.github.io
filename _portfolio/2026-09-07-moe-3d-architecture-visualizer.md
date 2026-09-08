---
title: "MoE 3D Architecture Visualizer: Interactive 3D Visualization of Modern MoE LLM Architectures"
excerpt: "Interactive WebGL/Three.js 3D visualizer for modern 500B+ sparse MoE architectures, featuring LatentMoE communication compression, Quantile-Balanced routing, and real-time dynamic sampling pipelines."
header:
  teaser: "moe-3d-visualizer.png"
category: "interactive-demos"
featured: true
collection: portfolio
date: 2026-09-07
link: "https://yuntaozhang999.github.io/moe-3d-visualizer/"
github: "https://github.com/yuntaozhang999/moe-3d-visualizer"
blog_post: "/ai/technical/moe-3d-architecture-visualizer/"
tags:
  - Three.js
  - WebGL
  - React 18
  - Sparse MoE
  - LatentMoE
  - Tailwind CSS
---

**Project Links:**
- 🌐 **Live Interactive Demo:** [https://yuntaozhang999.github.io/moe-3d-visualizer/](https://yuntaozhang999.github.io/moe-3d-visualizer/)
- 💻 **GitHub Repository:** [https://github.com/yuntaozhang999/moe-3d-visualizer](https://github.com/yuntaozhang999/moe-3d-visualizer)
- 📝 **Technical Blog Post:** [Read the full post](/ai/technical/moe-3d-architecture-visualizer/)

![MoE 3D Architecture Visualizer](/images/moe-3d-visualizer.png)

**The Challenge & Motivation:**  
Most existing Transformer visualization tools focus on early dense models (such as GPT-2 or GPT-3) and lack interactive 3D exploration of modern 500B+ sparse Mixture-of-Experts (MoE) architectures. To understand the internal mechanics, tensor flows, and distributed hardware communication costs of modern MoE architectures (such as Marin 535B, LatentMoE, and GQA), I developed and open-sourced **MoE 3D Architecture Visualizer**.

**Key Features:**
- **Client-Side WebGL Rendering:** Runs entirely in the client browser with zero cloud server or GPU dependencies, built with React 18, Three.js / R3F, Tailwind CSS v4, and KaTeX.
- **Multi-Scale 3-Level Observation:**
  - **Macro View (48 Layers):** 3D matrix overview displaying alternating local sliding-window and global causal layers.
  - **Quad-Cycle View (4 Layers):** Flow of 3 local layers (2048 sliding window) and 1 global layer (4096 full causal) with residual pipelines.
  - **Micro-Block Focus (Single Layer):** Deconstructs a single layer into 5 computation stages and 20+ operator nodes.
- **Deep Mechanism & Hardware-Software Co-Design:**
  - **LatentMoE Communication Compression:** Compresses features from 6144-dim to 3072 latent space before cross-node All-to-All routing, reducing communication bandwidth by 50%.
  - **384-Expert QB Routing:** Visualizes Quantile-Balanced routing selecting Top-8 active experts alongside 2 shared full-width experts.
  - **Cutting-Edge Attention Operators:** Grouped-Query Attention (GQA 4:1 / 8:1), ShortConv causal depthwise convolution, XSA orthogonal decorrelation, and input-dependent head gating.
- **Interactive Perception Highlights:**
  - **Step 19 Dynamic Sampling Pipeline:** Real-time probability recalculation, temperature slider (0.1–2.0), Top-k/Top-p truncation, and Monte Carlo roulette animation with token append.
  - **96-Dimensional Tensor Canvas Microscope:** Bipolar amplitude waveforms, dense sign strips, RMS statistics, and crosshair probe HUD.

**Technologies Used:**  
React 18, TypeScript, Three.js, @react-three/fiber, @react-three/drei, Tailwind CSS v4, KaTeX, Vite 8, GitHub Actions, GitHub Pages, MIT License
