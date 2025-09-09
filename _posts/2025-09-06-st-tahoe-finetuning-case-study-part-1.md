---
title: 'ST-Tahoe Fine-Tuning Case Study, Part 1: Initial Experiments and Setup'
date: 2025-09-06
excerpt: "A learning log documenting the journey of fine-tuning the ST-Tahoe model, from initial confusion to clarity on progressive unfreezing, loss functions, and hyperparameter tuning."
tags:
  - Fine-Tuning
  - State
  - STATE Transition
  - ST-Tahoe
  - Single Cell
  - Virtual Cell
---

## Introduction: A Learning Log from Confusion to Clarity

### My Goal

I started this project with a clear goal: to fine-tune the pre-trained **ST-Tahoe** model, released by the Arc Institute, on the competion dataset of several million CRISPRi-perturbed cancer and stem cells. ST-Tahoe was pre-trained on a dataset of nearly 100 million cancer cells perturbed by small molecules, and I hoped to transfer its capabilities to my gene perturbation task.

The first step was freezing the model's Transformer backbone and training only the input and output layers. This blog post documents the main problems I encountered, the answers I found, and the thought process behind them.

This entire document is a "learning log," so it's not just about the final, perfect method, but also about the journey, the experiments, and the questions I had along the way. Capturing my doubts about whether a certain phase was the best approach is a key part of that story.

---

## Phase 1: After Freezing the Backbone, What's Next?

> **My Question:** Should I unfreeze all layers at once and start training, or should I proceed in stages?

**The Answer:** Given the domain shift between my data (CRISPRi gene perturbations) and the pre-training data (small molecule perturbations), the strong recommendation was to adopt a **"progressive unfreezing"** strategy.

The benefits of this approach are:
1.  **Avoiding Catastrophic Forgetting**: Unfreezing all layers at once with a high learning rate could destroy the general features learned during pre-training.
2.  **Stable Alignment with the New Task**: Starting the unfreezing process from the top layers (closest to the output) allows the model to first adapt to the high-level semantics of the new task, then gradually adjust the lower layers, making the entire process more stable.

### The Specific Strategy for Staged Unfreezing

The fine-tuning process is broken down into two main stages:

#### Stage 1: Frozen Backbone Tuning
The Transformer backbone was kept frozen, and only the head and tail modules were trained with a relatively high learning rate (e.g., `3e-4`). The `gene_decoder` weight, which balances the loss between the 2048-dimensional embedding space and the 18080-dimensional gene expression space, was set to `0.0055`. This was to avoid over-concentrating on the decoder head, encouraging the model to first learn a robust representation in the embedding space.

> #### Comparing Expression Space vs. Embedding Space & Choosing `decoder_weight`
>
> **Why make this comparison?**
>
> When fine-tuning the ST-Tahoe model, I have two reconstruction/supervision branches:
> 1.  **Gene expression matrix (`adata.X`) loss**.
> 2.  **Cell embedding (`adata.obsm[embedding_key]`) reconstruction/alignment loss.**
>
> If you simply sum the two losses with equal weights while their typical vector norms or pairwise distance scales differ greatly, then:
> *   The higher-scale space dominates gradients; the other branch underfits.
> *   A scaling factor (`decoder_weight`) on the expression branch is needed to balance contributions.
>
> **Key Procedure / Code Logic**
> *   Load `competition_train.h5` and auto-detect an embedding key (priority: `X_state`).
> *   Convert sparse matrices to dense, and extract the expression matrix `X` and embedding matrix `E`.
> *   Compute per-cell L2 norms and summarize their statistics.
> *   Subsample cells to estimate distributions of pairwise distances (`||x_i - x_j||` and `||e_i - e_j||`).
> *   Define `suggest_weight = scale_emb / scale_expr` to propose a weight based on the ratio of scales.
> *   Recommend using the weight derived from pairwise distances for `model.kwargs.decoder_weight`.
>
> **How to Read the Outputs**
> *   **L2 Stats:** If the embedding mean norm is `k` times larger, multiply the expression loss by `~k`.
> *   **Pairwise Stats:** Capture the global relational scale, which is less sensitive to vector-level skew.
> *   **Recommendation:** Prefer the pairwise-derived weight for robustness. For example, if the suggested weight is `0.0055`, set `decoder_weight: 0.0055`.
>
> **One-Line Takeaway**
>
> Estimate the ratio of typical embedding to expression scales first and set `decoder_weight` accordingly to avoid manual trial-and-error and achieve more stable, faster convergence.

#### Stage 2: Progressive Unfreezing
Begin to unfreeze the backbone, starting with the top 2-3 Transformer blocks, then gradually unfreeze the middle layers, and finally, unfreeze all layers to enter full fine-tuning, which will require a lower overall learning rate.

This should be paired with **Layer-wise Learning Rate Decay (LLRD):**
*   **Head/Tail Modules**: Maintain a higher learning rate (e.g., `2e-4` to `3e-4`).
*   **Unfrozen Top Layers**: Use a medium learning rate (e.g., `1e-4`).
*   **Lower/Middle Layers**: Use a lower learning rate (e.g., `3e-5`).
*   **Full Fine-Tuning**: The base learning rate for the backbone should be further reduced to `1e-5` to `3e-5`.

---

## The First "Health Check": Why Is My Validation Loss Flatlining?

> **My Question:** During the first stage of training, I noticed that my `train_loss` was decreasing significantly, but the `val_loss` remained almost a flat line. This indicated that the model was overfitting and failing to generalize. What went wrong?

**The Answer:** By examining my configuration files, training logs, and `starter.toml`, we identified several key issues, starting with a misinterpretation of the logged loss values.

1.  **Misinterpretation of Loss Metrics:** A deep dive into `state_transition.py` revealed their true meaning:
    *   `train_loss`: Loss for the **primary objective** (2058-dim embedding head) during training.
    *   `val_loss`: Loss for the primary objective during validation.
    *   `decoder_loss`: Loss for the **auxiliary objective** (18080-dim gene decoder head) during training.
    *   `val/decoder_loss`: Loss for the auxiliary objective during validation.

    Crucially, the optimizer uses a **total loss** (a weighted sum of `train_loss` and `decoder_loss`), but what gets logged as `train_loss` is *only* the embedding head component. The flat `val_loss` was a direct signal that the primary objective was not improving on the validation set.

2.  **Overly Permissive Hyperparameter Settings**:
    *   `gradient_clip_val: 10`: This was too high and could allow gradient explosion. **Recommendation: `1.0`**.
    *   `weight_decay: 5e-4`: This was too low for the AdamW optimizer, providing insufficient regularization. **Recommendation: `1e-3` to `5e-3`**.

---

## The Core Confusion: Unraveling the Mystery of the Three Loss Configurations

> **My Question:** I was completely confused by the three loss-related settings in the `config.yaml` file. What was their relationship?
> ```yaml
> # In the model configuration
> model:
>   loss: energy
>   distributional_loss: energy
>
> # In the training configuration
> training:
>   loss_fn: mse
> ```

**The Answer:** By inspecting the training logs and the source code (`state/tx/models/state_transition.py`), we found the definitive answer.

**Evidence 1: The Training Log**
The model summary printed at the start of training shows it uses `SamplesLoss`, which implements the energy distance, not MSE.
```
StateTransitionPerturbationModel(
  (loss_fn): SamplesLoss()
  ...
)
```

**Evidence 2: The Source Code**
The model's `__init__` method explicitly overrides any incoming `loss_fn` from the training configuration. The choice of loss function is determined entirely by `model.loss`.

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
```

With this evidence, the roles of the three parameters become clear:

1.  **`training.loss_fn` has no effect!** It is ignored by the model.
2.  **`model.loss` is the true master switch.** It determines the loss function for the *entire model*.
3.  **`model.distributional_loss` is a sub-option** used only when `model.loss` is set to `"energy"`.
4.  **Both output heads share the same loss function.**

This discovery cleared up the biggest confusion: `training.loss_fn: mse` was never active, and my model was using the `energy` loss all along.

***

### A Deeper Look: Energy Loss vs. MSE Loss

*   **MSE (Mean Squared Error) Loss:**
    *   **What it does:** A "point-to-point" comparison that calculates the average squared difference between individual predicted and actual values.
    *   **When to use it:** Best for deterministic, one-to-one tasks where you want to predict a single, precise output.

*   **Energy Distance (a type of Distributional Loss):**
    *   **What it does:** Compares the overall distribution of a *set* of predictions against a *set* of targets. It measures the difference between entire "clouds" of points.
    *   **When to use it:**
        1.  When your target is inherently stochastic or heterogeneous.
        2.  When you care more about capturing the overall structure and diversity of a cell population.
        3.  When using set-level representations.

In summary, **MSE is about point-wise accuracy, while Energy Loss is about distributional similarity.** For this project, using a distributional loss like `energy` is a powerful choice.

---

## Theory vs. Practice: The Paper's Dual Objectives and My Model Configuration

> **My Question:** The `state` model paper mentions using a weighted MMD loss in both the "embedding space" and the "gene expression space." How should I configure the loss function to balance predicting cell population distributions and ensuring single-gene accuracy?

**The Answer:** The paper's core idea corresponds perfectly with the model's architecture:

*   **Primary Objective (Embedding Space):** The model's main task is to learn in a smoother embedding space. The loss here corresponds to `model.loss`, and a distributional distance (like Energy/Sinkhorn) is appropriate.
*   **Auxiliary Objective (Gene Space):** An additional decoder maps predictions back to the full gene expression profile. The loss here is auxiliary, and its contribution is controlled by `decoder_weight`.

The paper suggests a `decoder_weight` of `0.1`, while my configuration had it at `0.0055`.

---

## A Guide to Hyperparameter Selection

> **My Question:** I was unclear about concepts like Learning Rate (LR), Weight Decay, and Gradient Clipping, and how to choose their values.

**The Answer:**

*   **Weight Decay (WD):** A regularization technique to prevent overfitting.
    *   **Rule of Thumb:** For the AdamW optimizer, a value between `1e-3` and `5e-3` is a good starting point.

*   **Gradient Clipping:** Prevents unstable training by re-scaling gradients if their L2 norm exceeds a threshold.
    *   **Rule of Thumb:** A value of `1.0` is a robust choice, much safer than the initial default of `10`.

*   **Memory Management (`pin_memory` and `swap`):**
    *   **`pin_memory`:** Setting to `true` speeds up CPU-to-GPU data transfer by using page-locked memory. It uses CPU RAM, not GPU VRAM.
    *   **`swap` space:** Disk space used when CPU RAM is full. It does **not** help with GPU Out-of-Memory (OOM) errors and will dramatically slow down any process that relies on it.

---

## Conclusion and Reflections

This deep dive was incredibly insightful. The most important takeaways are:

1.  **Never Take Things for Granted:** A simple issue like a flat `val_loss` can have complex, interconnected causes.
2.  **The Source Code is the Ultimate Truth:** When confused by configurations, reading the source code provides the definitive answer.
3.  **Combine Theory with Practice:** Connecting the ideas from the paper with the code implementation is essential for true understanding.
4.  **Fine-Tune Systematically:** A successful fine-tuning process relies on a systematic approach combining progressive unfreezing, layer-wise learning rates, and sound hyperparameters.

This log documents my learning journey. I hope it can serve as a valuable reference for my future self (and for you) when encountering similar challenges.