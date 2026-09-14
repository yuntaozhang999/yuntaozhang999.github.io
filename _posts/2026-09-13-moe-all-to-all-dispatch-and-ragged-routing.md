---
title: "MoE All-to-All Dispatch and Ragged Routing"
date: 2026-09-13
excerpt: ""
---

Mixture of Experts (MoE) architectures rely on complex communication primitives to function efficiently across large clusters. At the heart of this is the All-to-All dispatch mechanism.

### What is All-to-All?
All-to-All is a collective communication operation where every participating GPU sends data to, and receives data from, every other participating GPU. It's essentially an "All Senders to All Receivers" data exchange.

### Why MoE Token Dispatch is All-to-All
In a large-scale MoE model, we use both Data Parallelism (DP) and Expert Parallelism (EP). Each GPU computes Attention locally on its own independent sentences (Data Parallelism). However, due to memory constraints, each GPU might only hold a fraction of the total experts. For instance, a GPU might hold only 6 out of 384 routed experts (Expert Parallelism). 

When tokens need to be processed by experts, they must be dispatched from the GPU holding the sequence to the specific GPUs holding their assigned experts. This many-to-many communication necessitates an All-to-All operation.

### Returning Tokens to the Original GPU
After the expert computation is complete, the tokens cannot simply remain on the expert's GPU. They must be sent back to the original GPU for two critical reasons:
1. **Residual Connection:** The network must compute the residual addition $x + \Delta x$. The original tensor $x$ resides on the source GPU.
2. **Sequential Context:** The layer immediately following the MoE MLP is typically an Attention layer. Attention requires the full, intact sequence context, which only exists on the original GPU.

### Fixed Capacity vs. Ragged Routing
Traditionally, routing uses a fixed capacity factor (e.g., 1.2). This creates rigid per-sender-expert slots. If a particular expert is highly demanded, these slots fill up, and excess tokens are simply dropped. This dropping occurs even if the total GPU compute is largely idle because other experts on the same GPU have empty slots.

To solve this, we utilize "Ragged" (不规则) All-to-All routing. By leveraging NCCL's variable-length primitives and receiver capacity pooling across all 6 local experts on a GPU, we can dynamically allocate compute based on actual token distribution. This achieves true dropless routing, significantly improving model quality and training efficiency.
