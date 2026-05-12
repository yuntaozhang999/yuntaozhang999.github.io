---
title: "Voice Programming: Why I Built My Own STT Tool for AI Interaction"
date: 2026-05-07
excerpt: ""
tags:
  - Voice Programming
  - STT
  - AI Interaction
  - Productivity
  - MacBook
---

We often talk about the efficiency of AI models, but we rarely talk about the bottleneck on the human side: **typing speed**. 

I've found that when I'm deep in a problem-solving flow, the physical act of typing prompts for Codex or Claude often lags behind my actual thinking process. To bridge this gap, I’ve been experimenting with a "voice-first" workflow, and I eventually reached a point where I had to build my own tool to make it viable.

### The Problem with Native Solutions

While macOS has built-in dictation and Microsoft Copilot offers voice input, they both fall short in a few critical areas for a developer's workflow:

1.  **Poor Bilingual Support:** My thinking process often alternates between Chinese and English (especially when discussing technical concepts). Most native STT (Speech-to-Text) engines struggle to switch contexts seamlessly.
2.  **The "Filler Word" Problem:** When we think out loud, we use "um," "ah," and repetitive phrases. Standard dictation captures these literally, resulting in messy prompts that require manual editing—defeating the purpose of using voice in the first place.
3.  **Lack of Contextual Refinement:** Existing tools just give you a transcript. What I actually need is a *coherent thought*.

### The Solution: A Custom STT Refinement App

I developed a lightweight application for my MacBook designed to capture raw, "rough" thoughts and transform them into polished, actionable text. 

**The Workflow:**
1.  **Think Aloud:** I face my computer and simply describe what I'm thinking, however disorganized it may be.
2.  **Intelligent Processing:** The app takes the raw audio, transcribes it, and then uses an LLM to "de-noise" the input—removing filler words, correcting bilingual transitions, and restructuring the sentences for clarity.
3.  **Instant Delivery:** The refined text is automatically copied to my clipboard. 
4.  **Action:** I simply `Cmd+V` into the Codex or Claude chat box.

### Why Voice Programming is the Future

This isn't just about convenience; it’s about **fidelity**. By removing the friction of typing and spelling, I can convey my mental models and intent much faster and more accurately. 

I firmly believe that **voice programming**—or rather, natural language orchestration through voice—is where the industry is heading. We shouldn't be spending our cognitive energy on "writing" prompts; we should be focused on communicating the logic and architecture of our ideas.

While I expect native support for this kind of high-fidelity, intelligent STT to eventually arrive, this custom tool is currently my primary bridge for staying in the "flow state." 

---
*Generated with the help of Gemini CLI.*
