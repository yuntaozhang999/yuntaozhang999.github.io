---
title: 'Fine-Tuning the ST-Tahoe STATE Model’
date: 2025-09-01
excerpt: ""
tags:
  - Fine-Tuning
  - State
  - STATE Transition
  - ST-Tahoe
  - Single Cell
  - Virtual Cell


---

## Introduction: A Learning Log from Confusion to Clarity

## My Goal

I started this project with a clear goal: to fine-tune the pre-trained ST-Tahoe model, released by the Arc Institute, on the competion dataset of several million CRISPRi-perturbed cancer and stem cells. ST-Tahoe was pre-trained on a dataset of nearly 100 million cancer cells perturbed by small molecules, and I hoped to transfer its capabilities to my gene perturbation task.

I had already completed the first step: freezing the model's Transformer backbone and training only the input and output layers. Now, I was ready for the next phase—unfreezing the backbone for a more thorough fine-tuning. However, this brought a series of new questions. This blog post documents the main problems I encountered, the answers I found, and the thought process behind them.

This entire document is a "learning log," so it's not just about the final, perfect method, but also about the journey, the experiments, and the questions I had along the way. Capturing my doubts about whether a certain phase was the best approach is a key part of that story.

## Phase 1: After Freezing the Backbone, What's Next?

**My Question:** Should I unfreeze all layers at once and start training, or should I proceed in stages?

**The Answer:** Given the domain shift between my data (CRISPRi gene perturbations) and the pre-training data (small molecule perturbations), the **strong recommendation was to adopt a "progressive unfreezing" strategy.**

The benefits of this approach are:
1.  **Avoiding Catastrophic Forgetting**: Unfreezing all layers at once with a high learning rate could destroy the general features learned during pre-training.
2.  **Stable Alignment with the New Task**: Starting the unfreezing process from the top layers (closest to the output) allows the model to first adapt to the high-level semantics of the new task, then gradually adjust the lower layers, making the entire process more stable.

**The specific strategy for staged unfreezing:**

The fine-tuning process is broken down into two main stages: first, tuning the model with a frozen backbone, and second, progressively unfreezing the backbone for end-to-end fine-tuning.

***Stage 1: Frozen Backbone Tuning***

*   **Phase A (Completed):** The Transformer backbone was kept frozen, and only the head and tail modules were trained with a relatively high learning rate (e.g., `3e-4`). The `gene_decoder` weight, which balances the loss between the 2058-dimensional embedding space and the 18080-dimensional gene expression space, was set to `0.5`. This was to avoid over-concentrating on the decoder head, encouraging the model to first learn a robust representation in the embedding space.

*   **Phase B (Current Recommendation):** The backbone will remain frozen. The primary change in this phase is to increase the `gene_decoder` weight to `1.0`. The goal is to "polish" the model's ability to predict the final 18080-dimensional gene expression profile, which is crucial for the final evaluation.

***Stage 2: Progressive Unfreezing***

*   **Phase C:** Begin to unfreeze the backbone, starting with the top 2-3 Transformer blocks.
*   **Phase D:** Gradually unfreeze the middle layers of the backbone.
*   **Phase E:** Unfreeze all layers to enter full fine-tuning, which will require a lower overall learning rate.

This should be paired with **Layer-wise Learning Rate Decay (LLRD):**
*   **Head/Tail Modules**: Maintain a higher learning rate, such as `2e-4` to `3e-4`.
*   **Unfrozen Top Layers**: Use a medium learning rate, like `1e-4`.
*   **Lower/Middle Layers**: Use a lower learning rate, such as `3e-5`.
*   **Full Fine-Tuning**: The base learning rate for the backbone should be further reduced to `1e-5` to `3e-5`.

## The First "Health Check": Why Is My Validation Loss Flatlining?

**My Question:** During the first phase of training, I noticed that my `train_loss` was decreasing significantly, but the `val_loss` remained almost a flat line. This indicated that the model was overfitting to the training set and failing to generalize. What went wrong?

**The Answer:** By examining my configuration files, training logs, and `starter.toml`, we identified several key issues, starting with a misinterpretation of the logged loss values.

1.  **Misinterpretation of Loss Metrics:** A key source of confusion was the different loss values reported in the logs. A deep dive into `state_transition.py` revealed their true meaning:
    *   `train_loss`: This is the loss for the **primary objective**, calculated **only** on the 2058-dim embedding head during training.
    *   `val_loss`: This is the loss for the primary objective, calculated **only** on the 2058-dim embedding head during validation.
    *   `decoder_loss`: This is the loss for the **auxiliary objective**, calculated **only** on the 18080-dim gene decoder head during training.
    *   `val/decoder_loss`: This is the loss for the auxiliary objective, calculated **only** on the gene decoder head during validation.
    Crucially, the value used by the optimizer for backpropagation is a **total loss**, which is a weighted sum of `train_loss` and `decoder_loss`. However, what gets logged as `train_loss` is *not* this total value, but only the component from the embedding head. This distinction is vital. The flat `val_loss` was a direct signal that the primary objective was not improving on the validation set, indicating poor generalization, which was compounded by the other issues below.

2.  **Overly Permissive Hyperparameter Settings**:
    *   `gradient_clip_val: 10`: This value was too high and could allow gradient explosion in certain batches, leading to training instability. **The recommendation is to set it to `1.0`**.
    *   `weight_decay: 5e-4`: For the AdamW optimizer and large head/tail networks, this value was too low, providing insufficient regularization. **The recommendation is to increase it to `1e-3` ~ `5e-3`** and apply no-decay to LayerNorm, Bias, and Embedding layers. (Note: The current codebase doesn't allow for selective application, so the chosen `weight_decay` will affect all parameters). It aligns with the lower end of the recommended range, which should help minimize any potential negative impact on the LayerNorm, bias, and embedding layers while still providing more regularization than the previous value.

## The Core Confusion: Unraveling the Mystery of the Three Loss Configurations

**My Question:** I was completely confused by the three loss-related settings in the `config.yaml` file that was generated at the start of the training run. This file consolidates all the final parameters for the run, and the conflicting loss settings were a major source of confusion.. What was their relationship?
```yaml
# In the model configuration
model:
  loss: energy
  distributional_loss: energy

# In the training configuration
training:
  loss_fn: mse
```

**The Answer:** By inspecting the training logs and the source code of the `state` model (`state/tx/models/state_transition.py`), we found the definitive answer.

First, the training log itself reveals that the model is using `SamplesLoss`, which is the implementation for the energy distance, not MSE.

**Evidence 1: The Training Log**
A look at the model summary printed at the start of training shows:
```
StateTransitionPerturbationModel(
  (loss_fn): SamplesLoss()
  ...
)
```
This confirms that the `loss_fn` attribute of the model instance is `SamplesLoss`, which corresponds to the `energy` or `sinkhorn` distributional losses.

**Evidence 2: The Source Code (`state_transition.py`)**
The model's `__init__` method contains logic that explicitly overrides any incoming `loss_fn` parameter from the training configuration. The choice of loss function is determined entirely by the `model.loss` parameter.

```python
# In src/state/tx/models/state_transition.py

class StateTransitionPerturbationModel(PerturbationModel):
    def __init__(..., **kwargs):
        super().__init__(..., **kwargs)

        # This block determines the loss function, ignoring 'training.loss_fn'
        loss_name = kwargs.get("loss", "energy")
        if loss_name == "energy":
            self.loss_fn = SamplesLoss(loss=self.distributional_loss, blur=blur)
        elif loss_name == "mse":
            self.loss_fn = nn.MSELoss()
        # ... other loss types
        else:
            raise ValueError(...)
```
This code snippet is the ultimate proof. It shows that the value of `model.loss` from the config is used to instantiate the `self.loss_fn`, and the `training.loss_fn` value passed in via `**kwargs` is never read for this purpose.

With this evidence, the roles of the three parameters become clear:

1.  **`training.loss_fn` has no effect in this model!** As shown in the source code, this parameter is ignored. Its presence in the config file is a remnant of a generic training setup but is not used by the `StateTransitionPerturbationModel`.
2.  **`model.loss` is the true master switch**. It determines the type of loss function used for the *entire model* (including the 2058-dim embedding head and the 18080-dim gene decoder head). Possible values include `"mse"`, `"energy"`, `"sinkhorn"`, etc.
3.  **`model.distributional_loss` is just a sub-option**. It is only used when `model.loss` is set to `"energy"` to specify the particular variant of the distributional loss (e.g., `"energy"` or `"sinkhorn"`).
4.  **Both output heads share the same loss function**. The model's forward pass uses the same `self.loss_fn` for both the embedding head and the gene decoder head. The total loss is `loss_embedding_head + decoder_weight * loss_gene_decoder_head`. If `model.loss` is `energy`, then both heads use the energy distance for their loss calculations.

This discovery cleared up the biggest confusion: `training.loss_fn: mse` was never active, and my model was using the `energy` loss all along.

***

### A Deeper Look: Energy Loss vs. MSE Loss

To make informed decisions, it's crucial to understand the fundamental difference between these two types of losses.

*   **MSE (Mean Squared Error) Loss:**
    *   **What it does:** MSE calculates the average squared difference between the predicted and actual values for each individual data point. You can think of it as a "point-to-point" comparison.
    *   **Analogy:** Imagine you have a target point on a map, and your model makes a prediction. MSE measures the direct, straight-line distance (squared) between your prediction and that single target. It doesn't care about any other possible target points.
    *   **When to use it:** It's best for deterministic, one-to-one tasks where you want to predict a single, precise output vector for a given input. It's excellent for ensuring single-gene accuracy.

*   **Energy Distance (a type of Distributional Loss):**
    *   **What it does:** Instead of comparing individual points, energy distance compares the overall distribution of a *set* of predictions against a *set* of target data points. It measures the difference between entire "clouds" of points.
    *   **Analogy:** Imagine your target is not a single point, but a whole cluster of points on a map representing a population of cells. Your model also predicts a cluster of points. Energy distance measures how much "work" is required to make the two clouds of points identical. It's sensitive to the shape, spread, and density of the entire population, not just the average location.
    *   **When to use it:**
        1.  When your target is inherently stochastic or heterogeneous (e.g., the same gene perturbation results in a varied population of cells).
        2.  When you care more about capturing the overall structure, diversity, and multi-modal nature of the cell population rather than just the average outcome.
        3.  When using set-level representations (like `cell_set_len`), where the goal is to align the distribution of a predicted cell set with a real one.

In summary, MSE is about **point-wise accuracy**, while Energy Loss is about **distributional similarity**. For a project like this, where the goal is to predict the heterogeneous effects of perturbations on cell populations, using a distributional loss like `energy` for the primary objective in the embedding space is a very sound and powerful choice, as highlighted in the `state` model's paper.

## Theory vs. Practice: The Paper's Dual Objectives and My Model Configuration

**My Question:** The `state` model paper mentions using a weighted MMD loss in both the "embedding space" and the "gene expression space." How does this relate to my model's configuration? How should I set up the loss function to balance the goals of "predicting cell population distributions" and "ensuring single-gene accuracy"?

**The Answer:** The core idea of the paper corresponds perfectly with the model's architecture:

*   **Primary Objective in the Embedding Space**: The model's main task is to learn in a smoother embedding space (2058-dim) that better captures the biological effects of perturbations. The loss in this space corresponds to `model.loss`, and using a distributional distance (like MMD in the paper or Energy/Sinkhorn in the code) is appropriate.
*   **Auxiliary Objective in the Gene Space**: An additional decoder (`gene_decoder`) maps the predictions from the embedding space back to the full gene expression profile (18080-dim). The loss in this space is auxiliary, and its contribution is controlled by `decoder_weight`.

**How to configure for this dual objective?**
The paper mentions using a weight factor of `0.1` for the gene expression loss to prevent it from overpowering the primary objective in the embedding space. My configuration, however, had `decoder_weight` set to `0.5`.

**My Strategy and Rationale:**
My approach differed from the paper's recommendation. Based on my understanding at the time, I chose the following path:
1.  **Initial Fine-tuning (Completed):** I set `decoder_weight` to `0.5` during the first phase of fine-tuning (with the backbone frozen). My initial plan was to set this to `1.0` immediately. However, I was concerned that the very large output dimension of the decoder head (18080) compared to the embedding head (2058) might cause the model to over-concentrate on the gene expression task. As a result, I chose `0.5` as a more balanced starting point, based on my intuition at the time, to encourage the model to also learn a strong representation in the embedding space.
2.  **Next Step (In Progress):** I am now extending this initial phase by increasing the `decoder_weight` to `1.0`, while still keeping the backbone frozen. My goal is to maximize the model's performance on the final gene expression prediction task before starting to unfreeze the backbone.

## A Guide to Hyperparameter Selection

**My Question:** I was unclear about concepts like Learning Rate (LR), Weight Decay, and Gradient Clipping, and how to choose their values.

**The Answer:**
*   **Learning Rate (LR)**: This is the step size for parameter updates. The choice of LR is critical, and for this project, I used different learning rates and schedules for the different phases of fine-tuning.
    *   **Phase A (`decoder_weight=0.5`)**: In the initial phase, I used a higher learning rate of `3e-4` to quickly adapt the model's head and tail to the new data.
    *   **Phase B (`decoder_weight=1.0`)**: For the second phase, the goal was to polish the gene predictions. To do this, I used a more conservative learning rate with a detailed schedule. It's worth noting that I'm not entirely sure if this phase is the most effective strategy, or even if it's helpful, but it reflects my thinking at the time. The learning rate was applied as follows:
        *   **Target Learning Rate**: `5e-5`.
        *   **Warmup**: First, a linear warmup was applied for the first 5% of training steps (`warmup_ratio=0.05`), gradually increasing the learning rate from near-zero to the target of `5e-5`.
        *   **Cosine Annealing**: After the warmup, a `cosine` scheduler took over. This decays the learning rate following a cosine curve, which starts faster and slows down as it approaches the minimum.
        *   **Minimum Learning Rate**: The learning rate doesn't decay to zero. Instead, it ends at 10% of the target LR (`min_lr_ratio=0.1`), or `5e-6`. This ensures the model can continue making small, fine-tuning adjustments at the end of training.

*   **Weight Decay (WD)**: A regularization technique that prevents overfitting by penalizing large model weights.
    *   **Rule of Thumb**: For the AdamW optimizer, a value between `1e-3` and `5e-3` is a good starting point.

*   **Gradient Clipping**: This technique prevents unstable training (a phenomenon known as gradient explosion) by re-scaling gradients if their overall magnitude exceeds a certain threshold. The process is as follows: first, the L2 norm (the square root of the sum of the squares) of the gradients across all model parameters is calculated. If this norm is greater than the `gradient_clip_val`, all gradients are proportionally shrunk so that their L2 norm equals the clipping value.
    *   **Rule of Thumb**: The default value in the configuration was `10`, which was too high. A value of `1.0` is a very common and robust choice that works well for a wide range of models, regardless of their size or number of parameters. Because clipping is applied to the total L2 norm of all gradients combined, it provides a scale-invariant way to prevent gradients from exploding.

*   **Memory Management: `pin_memory` and `swap`**:
    *   **`pin_memory`**: This setting, when set to `true`, allocates page-locked (or "pinned") memory on the CPU for data that will be transferred to the GPU. This significantly speeds up the data transfer from host to device. It uses CPU RAM, not GPU VRAM. For a machine with sufficient RAM (like the g2-standard-8 with ~54GB), keeping `pin_memory=true` is recommended for better performance. Turning it off would slow down training but would not directly prevent a GPU OOM error.
    *   **`swap` space**: Swap is a space on a hard disk that is used when the amount of physical RAM is full. If the system needs more memory resources and the RAM is full, inactive pages in memory are moved to the swap space. While using swap can prevent the system from crashing due to a lack of CPU RAM (e.g., from a large number of data loader workers), it does **not** help with GPU Out-of-Memory (OOM) errors. Furthermore, relying on swap will dramatically slow down any process that needs it, as disk access is orders of magnitude slower than RAM access. It can be configured as a safety net for CPU memory, but it's not a solution for GPU memory issues.

## Conclusion and Reflections

This deep dive was incredibly insightful. The most important takeaways are:
1.  **Never Take Things for Granted**: A seemingly simple issue like a flat `val_loss` can be caused by a combination of problems across data loading, validation strategy, and hyperparameter settings.
2.  **The Source Code is the Ultimate Truth**: When confused by complex configurations, reading the source code is the fastest way to find the answer. It was by analyzing the code that we confirmed the critical fact that `training.loss_fn` was inactive.
3.  **Combine Theory with Practice**: Connecting the design ideas from the paper with the code implementation is essential to truly understand the model's internal logic and make informed configuration changes.
4.  **Fine-Tune Systematically**: A successful fine-tuning process relies on a systematic approach that combines progressive unfreezing, layer-wise learning rates, and a sound set of hyperparameters.

This log documents my learning journey. I hope it can serve as a valuable reference for my future self (and for you) when encountering similar challenges.
