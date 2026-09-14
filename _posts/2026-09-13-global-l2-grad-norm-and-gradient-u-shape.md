---
title: "Global L2 Grad Norm and Gradient U-Shape"
date: 2026-09-13
excerpt: ""
---

Understanding gradient behavior is essential for stabilizing the training of massive language models. Two key phenomena we observe are the mechanics of the global L2 gradient norm and the U-shaped distribution of gradients across layers.

### Computing Global L2 Grad Norm in JAX
In frameworks like JAX, utilizing Optax, the `global_norm` is computed as the square root of the sum of squared gradients across all parameters in the model. For a model with 535B parameters, this is a massive operation. 

We use the global norm rather than per-layer norms because it preserves the overall direction of the gradient update when performing global gradient clipping, ensuring the optimization trajectory remains consistent.

### Fast Computation Without Underflow
How do we compute the sum of squares for 535 billion parameters rapidly and without running into numerical underflow?
1. The local tensor sum-of-squares is computed in parallel across GPUs.
2. A fast All-Reduce operation aggregates these scalar sums across the cluster using 4-byte `float32`.
3. Finally, a single square root is applied. The entire process takes less than 0.1ms.

Underflow is not a concern here. The minimum positive normal value for `float32` is roughly $1e^{-38}$. Even if squared gradients are extremely small, say $1e^{-12}$, they are still 26 orders of magnitude above the underflow threshold, perfectly safe for accumulation.

### Gradient U-Shape Distribution
When analyzing the gradient norms layer by layer, a distinct U-shape emerges. The gradients at the top (`lm_head`) and the bottom (Layer 0 / Embedding) are typically 3 to 10 times larger than those in the middle layers.

### Why Middle Layers Have Lower Gradients
The deep residual highway ($I + \partial F/\partial x$) acts as a direct conduit, transmitting the loss signal unattenuated from the top directly down to the bottom layers. In contrast, the representations in the middle layers are highly smooth and abstract, resulting in smaller relative local updates during backpropagation.

### Does the U-Shape Flatten?
One might wonder if this U-shape flattens out over the course of training. The answer is no. In fact, it naturally steepens. Because the unconstrained parameters at the ends of the network continually accumulate norm, their gradients grow. Training systems must actively employ constraints at the ends of the network—such as z-loss, QK-norm, and targeted weight decay—to keep this U-shape in check and maintain stability.
