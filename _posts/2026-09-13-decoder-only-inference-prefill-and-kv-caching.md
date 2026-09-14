---
title: "Decoder-Only Inference: Prefill and KV Caching"
date: 2026-09-13
excerpt: ""
---

When deploying modern LLMs, understanding the mechanics of inference is crucial for optimizing latency and throughput. A fundamental point to realize is that modern LLMs are strictly Decoder-only; there is no left-side Encoder block as seen in older architectures like T5 or original Transformers.

Inference in a decoder-only model is split into two distinct stages: Prefill and Decode.

### The Prefill Stage
The prefill stage is the heavy lifting at the beginning of a generation. The model processes all the prompt tokens in parallel in a single massive forward pass. During this pass, it calculates the Key and Value (KV) vectors for every token in the prompt, stores them in the KV cache, and outputs the very first generated token.

### The Decode Stage
Once the prefill is complete, the model enters the decode stage. This is an autoregressive step. In each decode iteration, the model takes exactly 1 new token (the one just generated), utilizes the previously computed and cached KV vectors to attend to the past context, and outputs the logits for the next token (typically a tensor of shape `[1, 128256]` for standard vocabularies).

### Time-to-First-Token and Tool Outputs
Why do long system messages or sudden tool outputs cause a noticeable pause before generation? Every newly incoming chunk of tokens must have its KV cache calculated before the decode stage can begin. When a tool returns a massive block of JSON, the model is forced back into the prefill stage to process these new tokens, causing Time-to-First-Token (TTFT) latency.

### Prompt Caching
To mitigate prefill latency, inference engines utilize Prompt Caching. By reusing the precomputed KV cache for the unchanged portions of a conversational history (like the system prompt or earlier turns), the model only needs to run the prefill stage on the new delta tokens. This drastically reduces compute overhead and drops TTFT to near zero for subsequent turns.
