---
title: "Marin 535B Architecture and Hardware Topology"
date: 2026-09-13
excerpt: ""
---

Training Marin, our 535B parameter language model, requires careful orchestration of both architecture dimensions and hardware topology.

### Hardware Topology and Batch Size
The training cluster consists of 11 GB200 NVL72 racks, totaling 704 GPUs. A single NVL72 rack (64 GPUs, 12.3 TB of unified memory) is capable of fitting the entire 535B model along with its optimizer states using Expert Parallelism of 64 (EP64). 

By utilizing 11 racks, we achieve 11-way data parallelism. This massive parallelism compresses a training run that would normally take 2 years down to just 60 days. The batch size is set to 11,264 sequences per step across the 11 racks (1024 sequences per rack). With a sequence length of 4,096, this results in a staggering 46,137,344 tokens processed per step.

### Storage vs Activation
While the 46M tokens take up only about 92MB in storage, the memory footprint balloons during the forward pass. Activations consume roughly 567 GB per layer. For a 48-layer model, this translates to 27 TB of activation memory without checkpointing. Over the total run of 390,251 steps, the model will train on approximately 18 Trillion tokens.

### Training Timeline
The training run (`hero-12d8b6f0-dee637`) commenced on 2026-08-19. At step 81,716 on 2026-09-09, we successfully hot-swapped to ragged All-to-All routing. Processing at a rate of 4,400 steps per day, the projected completion date is 2026-11-18.

### Architecture Dimensions
The model operates with a hidden dimension of 6144. Interestingly, the expert intermediate dimension is divided by 2, resulting in a size of 3072. Why? Because Marin employs a fine-grained MoE architecture.

There are 384 experts in total, with the top-8 active per token. Thus, the active dimension size is $8 \times 3072 = 24,576$. This is mathematically equivalent to a standard dense MLP with an expansion factor of 4 ($4 \times 6144 = 24,576$). This design elegantly achieves 23B active parameters (FLOPs) per forward pass while maintaining a massive 535B total capacity.

### Norm vs Weights
In this architecture, normalization parameters and weight matrices serve fundamentally different roles. The Norm $\gamma$ learns channel sensitivity gains, acting as "volume knobs" for specific features. The dense Weights, on the other hand, learn relational knowledge and perform complex spatial transformations across the feature dimensions.
