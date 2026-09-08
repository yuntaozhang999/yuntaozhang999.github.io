---
title: "MoE 3D Architecture Visualizer: Interactive 3D Visualization of Modern MoE LLM Architectures"
date: 2026-09-07
permalink: /ai/technical/moe-3d-architecture-visualizer/
layout: single
excerpt: ""
categories:
  - AI
  - Technical
tags:
  - MoE
  - Three.js
  - WebGL
  - Transformer
  - Visualization
---

As large language model architectures increasingly transition toward hyperscale sparsity with Mixture-of-Experts (MoE), the computation flows of high-dimensional tensors and hardware communication overhead across distributed clusters are becoming ever more complex. To intuitively deconstruct the inner workings of modern MoE LLMs, I developed and open-sourced the **MoE 3D Architecture Visualizer**.

- 🌐 **Live Interactive Demo**: https://yuntaozhang999.github.io/moe-3d-visualizer/
- 💻 **GitHub Repository**: https://github.com/yuntaozhang999/moe-3d-visualizer

---

# 1. Project Background and Motivation

Most existing Transformer visualization tools focus on early dense monolithic models (such as GPT-2 or GPT-3) and lack interactive 3D representations of modern frontier **500B+ sparse Mixture-of-Experts (MoE) architectures**.

Inspired by modern cutting-edge MoE architectures (such as Marin 535B, LatentMoE, and GQA) as well as interactive explainability tools (such as `transformer-explainer`), this project is built with **React 18 + Three.js / R3F + Tailwind CSS v4 + KaTeX**. It runs entirely within client-side browser WebGL, requiring zero cloud server or GPU dependencies.

```text
┌──────────────┐   ┌──────────────────────┐   ┌──────────────────────────────┐   ┌──────────────────────────────────┐   ┌──────────────────────────────┐
│              │   │                      │   │                              │   │                                  │   │                              │
│ Prompt Input ├──►│ High-Dim Embeddings  ├──►│ GQA / ShortConv / XSA Attn   ├──►│ LatentMoE & 384-Expert Routing   ├──►│ LMHead [Step 19: Untied Head │
│              │   │                      │   │                              │   │                                  │   │                              │
└──────────────┘   └──────────────────────┘   └──────────────────────────────┘   └────────────────┬─────────────────┘   └──────────────────────────────┘
                                                                                                  │
                                                                                                  │
┌──────────────┐   ┌──────────────────────┐                                                       │                     ┌──────────────────────────────┐
│              │   │                      │                                                       │                     │                              │
│    LMHead    ├──►│ Generate Next Token  │                                                       └────────────────────►│       Dynamic Sampling]      │
│              │   │                      │                                                                             │                              │
└──────────────┘   └──────────────────────┘                                                                             └──────────────────────────────┘
```

---

# 2. Core Architecture Features and Visual Presentations

### 1. Multi-Scale 3-Level Observation Perspectives
- **Macro View (48 Layers Tower Array)**: Intuitive 3D matrix overview of the full 48-layer architecture, clearly displaying the periodic alternation between local sliding-window layers and global full-causal layers.
- **Quad-Cycle View (4 Layers)**: Demonstrates the alternating flow between 3 local layers (2048 sliding window) and 1 global layer (4096 full causal) along with residual feedthrough pipelines.
- **Micro-Block Focus (Single Layer Computation Graph)**: Hides surrounding layers to fully unfold a single layer's 5 major computation stages and internal dataflows across 20+ operator nodes.

### 2. Hardware-Software Co-Design and Deep Mechanisms
- **LatentMoE 50% Cross-Node Communication Reduction**: Visually showcases the process of compressing features from 6,144 dimensions down to a 3,072-dimensional latent space prior to cross-node All-to-All dispatch, slashing cluster communication bandwidth consumption by 50%.
- **384-Expert QB Routing and Dispatch**: Visualizes the Quantile-Balanced Router (QB Router) selecting the Top-8 active experts, alongside concurrent execution of 2 resident full-width shared experts.
- **Cutting-Edge Attention Operator Deconstruction**: Covers Grouped-Query Attention (GQA 4:1 / 8:1), 1D causal depthwise convolution on Key channels (ShortConv), Cross-Subspace Attention orthogonal decorrelation (XSA), and input-dependent head gating (Head Gate).

---

# 3. Interactive and Microscopic Perception Highlights

In terms of interaction design, the project deeply adopts interaction paradigms from top-tier visualization systems, focusing on two signature features:

### 1. Step 19 Dynamic Sampling and Temperature Control Pipeline
During the autoregressive output stage, a real-time probability recalculation and sampling control panel is provided:
- **Temperature Slider (0.1 – 2.0)**: Drag the slider to observe real-time smooth expansion and contraction of the probability distribution, shifting from "deterministic and peaked" to "high-entropy and diffuse".
- **Top-k and Top-p (Nucleus) Truncation Control**: Intuitively demonstrates truncation masks on the vocabulary long tail and subsequent probability renormalization.
- **🎲 Monte Carlo Roulette Animation**: Simulates realistic sampling bounce and lock-in dynamics, allowing the selected token to be appended to the sequence end with one click for continuous rollouts.

### 2. 96-Dimensional Micro-Tensor Canvas Microscope
- To tackle visual aliasing when rendering 6,144-dimensional tensors in 3D space, a retina-grade microscopic Canvas is embedded inside the floating HUD.
- The 96 continuous dimensions corresponding to each 3D unit block are deconstructed into **bipolar symmetric amplitude waveforms** and **dense positive/negative color strips**, delivering real-time micro-statistical metrics such as Root Mean Square (RMS) alongside mouse crosshair probe interactions.

---

# 4. Tech Stack and Open Source

- **Frontend & Graphics**: React 18, TypeScript, Three.js, @react-three/fiber, @react-three/drei
- **Styling & Typesetting**: Tailwind CSS v4, KaTeX (rigorous mathematical derivations)
- **Build & Deployment**: Vite 8, GitHub Actions, GitHub Pages
- **Open-Source License**: MIT License

Feel free to visit the live demo to experience it firsthand, and issues or discussions on GitHub are warmly welcomed!
