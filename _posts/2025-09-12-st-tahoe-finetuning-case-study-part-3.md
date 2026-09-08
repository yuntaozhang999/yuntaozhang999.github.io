---
title: "ST-Tahoe Finetuning Case Study Part 3: Overcoming Finetuning Pitfalls"
date: 2025-09-12
excerpt: ""
tags:
  - pytorch
  - lightning
  - fine-tuning
  - debugging
---

This is part 3 of a case study on fine-tuning the ST-Tahoe model. 

*   [Part 1: Setting up the Finetuning Environment](/posts/2025/09/st-tahoe-finetuning-case-study-part-1/)
*   [Part 2: Initial Finetuning and Analysis](/posts/2025/09/st-tahoe-finetuning-case-study-part-2/)

In this post, I'll cover three pitfalls I encountered while fine-tuning the ST-Tahoe model and how I fixed them.

**TL;DR.** I ran into three issues when resuming from a checkpoint to continue finetuning:

1.  **The run silently restored the old optimizer state from the checkpoint**, so my new learning rate & optimizer settings were ignored.
2.  **Learning rate wasn’t logged** to either W&B or my local CSV metrics.
3.  **No LR scheduler was actually wired up**, so LR stayed constant.

Below are the root causes, code changes, and how I verified the fixes with logs and metrics.

---

## Context

To clarify the file paths mentioned in this post, here’s a simplified view of my directory structure on the GCP instance:

```text
/home/ustbz/
├── prepare_instance/        # Wrapper scripts and logs
├── state/                   # The 'state' model source code
├── competition_support_set/ # Training data
└── tahoe-finetune-yuntao0912/ # Experiment output directory
```

*   I’m training a “state transition” Lightning model using a CLI like this (Hydra overrides):

    ```bash
    uv run state tx train \
     data.kwargs.toml_config_path=/home/ustbz/prepare_instance/starter.toml \
     ... \
     model=tahoe-finetune-yuntao0909 \
     training.batch_size=6 \
     training.max_steps=40000 \
     +training.precision=bf16-mixed \
     training.lr=3e-5 \
     +training.warmup_ratio=0.1 \
     +training.lr_scheduler=cosine \
     +training.lr_num_cycles=1 \
     +training.min_lr_ratio=0.5 \
     +training.log_lr=true \
     training.gradient_clip_val=1.0 \
     +training.accumulate_grad_batches=8 \
     training.weight_decay=1e-3 \
     use_wandb=true \
     wandb.entity=yuntaozhang999-personal \
     wandb.project=lightning_logs \
     output_dir=/home/ustbz \
     name=tahoe-finetune-yuntao0909
    ```

    (abbrev.; full line used in my run is in [`run_tx_training.sh`](/files/tahoe-fine-tune/run_tx_training.sh)) 

*   I launch the training from within the `state` project directory via a wrapper script, streaming logs to a file (e.g., `nohup ../prepare_instance/run_tx_training.sh > ../prepare_instance/train.log 2>&1 &`). This is important because `uv` needs to find the `pyproject.toml` to use the correct environment and dependencies. Here is a representative snippet from a successful run (after my fixes): it **only loads weights**, then calls `trainer.fit(..., ckpt_path=None)` and starts training. 

    ```log
    Model created. Estimated params size: 1.58 GB
    Building trainer with kwargs: {'accelerator': 'gpu', 'devices': 1, 'max_steps': 40000, 'check_val_every_n_epoch': None, 'val_check_interval': 500, 'logger': [<state.tx.utils.RobustCSVLogger object at 0x7fee705ce550>, <lightning.pytorch.loggers.wandb.WandbLogger object at 0x7fee707864d0>], 'plugins': [], 'callbacks': [<lightning.pytorch.callbacks.model_checkpoint.ModelCheckpoint object at 0x7fee712a0d10>, <lightning.pytorch.callbacks.model_checkpoint.ModelCheckpoint object at 0x7fee64849350>, <state.tx.callbacks.batch_speed_monitor.BatchSpeedMonitorCallback object at 0x7fee705cd610>, <lightning.pytorch.callbacks.lr_monitor.LearningRateMonitor object at 0x7fee707ccb90>, <state._cli._tx._train.run_tx_train.<locals>._LrPerGroupLogger object at 0x7fee70296410>, <state._cli._tx._train.run_tx_train.<locals>._OptParamsOnceLogger object at 0x7fee64849850>], 'gradient_clip_val': 1.0}
    Trainer built successfully
    Loading manual checkpoint from /home/ustbz/19500.ckpt
    [weights-only] loaded 85 tensors; skipped 0 mismatched; 0 missing remain randomly initialized.
    About to call trainer.fit() with checkpoint_path=None
    ``` 

---

## Problem #1 — “Why do my new optimizer settings not taking effect?”

### Symptom

Even though I passed a new `training.lr` and disabled resume, the training still behaved like it was using the **old optimizer state**. The log told the story:

> `Loading manual checkpoint from /home/ustbz/18000.ckpt`
> `About to call trainer.fit() with checkpoint_path=/home/ustbz/18000.ckpt`

That means Lightning was **resuming** from the checkpoint (optimizer included), not merely using its weights. (Earlier run) 

### Root cause

The training entrypoint treated my `init_from` path as a **`ckpt_path`** for `trainer.fit(...)`. Lightning then restored the optimizer & scheduler states from the checkpoint—**overriding any new LR** I set through Hydra overrides.

### Fix: “weights-only” resume

I updated the training script to enable a "weights-only" resume, which loads weights from a checkpoint but resets the training state (like the optimizer). This is ideal for fine-tuning.

The implementation, located in the `run_tx_train(...)` function within [`_train_20250912.py`](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/_train_20250912.py), follows this logic:

1.  **Manual Checkpoint Loading**: If no automatic resumption checkpoint (i.e., `last.ckpt`) is found but a `manual_init` path is provided in the config, the script loads it using `torch.load(..., weights_only=True)`.

2.  **Robust Weight Matching**: It then intelligently filters the checkpoint's `state_dict`, keeping only the weights where the key and shape match the current model. This prevents errors if the model architecture has changed.

3.  **Explicit `fit()` call**: Crucially, it calls the trainer with `ckpt_path=None`. This prevents PyTorch Lightning from automatically resuming the optimizer state, learning rate schedulers, and other training parameters.

The log output confirms this behavior perfectly:

> `[weights-only] loaded ... tensors; skipped ... mismatched; ... missing remain randomly initialized.`
> `About to call trainer.fit() with checkpoint_path=None`

This confirms the script is only using the checkpoint for its weights, not for a full training state resume. The logic for this, including the explicit log message, is in the [`_train_20250912.py`](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/_train_20250912.py) file. 

---

## Problem #2 — “My LR isn’t in W&B or metrics.csv”

### Symptom

Even after I stopped resuming the optimizer, my plots didn’t have LR curves. The training printed model info and ran, but **no `lr` metrics** in W&B or CSV.

### Root cause

Lightning won’t log LR for you unless either:

*   You attach a **`LearningRateMonitor`** callback (to monitor LR from schedulers), or
*   You **manually log** the optimizer’s `param_groups[i]["lr"]` as metrics.

### Fix: Add LR monitor + lightweight custom callbacks

I made it simple and robust by adding three logging callbacks:

1.  **`LearningRateMonitor`**: A standard PyTorch Lightning callback that logs the learning rate from the scheduler at each step. This is essential for plotting the LR curve in W&B.
2.  **`_LrPerGroupLogger`**: A lightweight custom callback that logs the actual learning rate for each parameter group directly from the optimizer. While I'm not using different learning rates for different layers, this provides a direct confirmation of the LR being used at every step.
3.  **`_OptParamsOnceLogger`**: Another custom callback that logs static optimizer hyperparameters (like `weight_decay`, `betas`, and `eps`) just once at the beginning of the run. This is a clean way to record the exact optimizer configuration.

These were grafted into the same [`_train_20250912.py`](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/_train_20250912.py) where I build callbacks; they show up in the “Building trainer with kwargs” list as expected (look for `LearningRateMonitor` etc.).  

Now both W&B and [**`metrics.csv`**](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/tahoe-finetune-yuntao0911_version_0_metrics.csv) include columns like `lr-AdamW`,`lr/group_0`, `opt/weight_decay`, etc.

---

## Problem #3 — “Why is LR always 3e-5 (constant)?”

### Symptom

After logging LR properly, I noticed it never changed: always **0.00003**.

### Root cause

The model’s default `configure_optimizers(...)` returned only an optimizer (no scheduler). Despite passing `+training.lr_scheduler=cosine +training.warmup_ratio=0.1 ...`, nothing used these values—so LR stayed constant. (My CLI overrides, above) 

### Fix: Implement a scheduler in `configure_optimizers`

The fix was to replace the simple `configure_optimizers` method in the model's base class (`PerturbationModel` in [`base.py`](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/base.py)) with a new version that properly configures and returns a learning rate scheduler.

The original method just returned a basic optimizer, ignoring all my scheduler-related CLI flags:

```python
# From the original base.py
def configure_optimizers(self):
    optimizer = torch.optim.Adam(self.parameters(), lr=self.lr)
    return optimizer
```

I replaced it with the new implementation below (from [`base_20250912.py`](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/base_20250912.py)). This version reads the training hyperparameters from the config and sets up the full AdamW optimizer plus a warmup/cosine scheduler.

Key features of the new function:

*   It reads hyper-params like `lr`, `weight_decay`, `lr_scheduler`, `max_steps`, and `warmup_ratio`.
*   It returns a dictionary containing both the `optimizer` and the `lr_scheduler`, configured to update at each `step`.
*   It safely falls back to a constant LR if no scheduler is specified.

Here is the new drop-in function:

```python
def configure_optimizers(self):
    """
    AdamW + optional warmup->cosine scheduler.
    Reads hyperparams from self.hparams or self.hparams.training:
      - lr, weight_decay, betas, eps
      - lr_scheduler ("none" | "cosine"), max_steps, warmup_ratio, min_lr_ratio
    """
    from torch.optim import AdamW
    from torch.optim.lr_scheduler import LinearLR, CosineAnnealingLR, SequentialLR

    # Helper to pull values from self.hparams or self.hparams.training
    def _hp(name, default):
        hp = getattr(self, "hparams", {})
        # direct attribute (Namespace-like)
        if hasattr(hp, name):
            val = getattr(hp, name)
            if val is not None:
                return val
        # dict at top-level
        if isinstance(hp, dict) and name in hp and hp[name] is not None:
            return hp[name]
        # nested "training" (attr or dict)
        tr = getattr(hp, "training", None)
        if tr is not None:
            if hasattr(tr, name):
                val = getattr(tr, name)
                if val is not None:
                    return val
            if isinstance(tr, dict) and name in tr and tr[name] is not None:
                return tr[name]
        if isinstance(hp, dict):
            tr = hp.get("training")
            if isinstance(tr, dict) and name in tr and tr[name] is not None:
                return tr[name]
        return default

    base_lr = float(_hp("lr", 3e-5))
    weight_decay = float(_hp("weight_decay", 0.0))
    betas = tuple(_hp("betas", (0.9, 0.999)))
    eps = float(_hp("eps", 1e-8))

    optimizer = AdamW(self.parameters(), lr=base_lr, weight_decay=weight_decay, betas=betas, eps=eps)

    sched_name = str(_hp("lr_scheduler", "none")).lower()
    total_steps = int(_hp("max_steps", 0))

    # If no scheduler requested or steps unknown, return constant lr
    if sched_name in ("none", "constant", "") or total_steps <= 0:
        return optimizer

    warmup_ratio = float(_hp("warmup_ratio", 0.0))
    warmup_steps = max(0, int(total_steps * warmup_ratio))
    min_lr_ratio = float(_hp("min_lr_ratio", 0.0))
    eta_min = float(base_lr * min_lr_ratio)

    if sched_name.startswith("cosine"):
        if 0 < warmup_steps < total_steps:
            # Linear warmup to base_lr, then cosine decay to eta_min
            warmup = LinearLR(optimizer, start_factor=1e-8, end_factor=1.0, total_iters=warmup_steps)
            cosine = CosineAnnealingLR(optimizer, T_max=total_steps - warmup_steps, eta_min=eta_min)
            scheduler = SequentialLR(optimizer, schedulers=[warmup, cosine], milestones=[warmup_steps])
        else:
            scheduler = CosineAnnealingLR(optimizer, T_max=total_steps, eta_min=eta_min)
    else:
        # Unknown scheduler keyword -> no scheduler
        return optimizer

    return {
        "optimizer": optimizer,
        "lr_scheduler": {
            "scheduler": scheduler,
            "interval": "step",   # update every optimizer step (respects grad accumulation)
            "frequency": 1,
        },
    }
```

---

## Results & Verification

The following snippet from my final [`train.log`](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/train.log) file confirms that all three fixes are working as intended:

```log
Building trainer with kwargs: {...'callbacks': [..., <...LearningRateMonitor...>, <..._LrPerGroupLogger...>, <..._OptParamsOnceLogger...>], ...}
...
Loading manual checkpoint from /home/ustbz/19500.ckpt
[weights-only] loaded 85 tensors; skipped 0 mismatched; 0 missing remain randomly initialized.
About to call trainer.fit() with checkpoint_path=None
```

Here’s how these logs verify each fix:

1.  **Weights-Only Resume:** The last two lines clearly show the script is loading weights from a manual checkpoint and then calling `trainer.fit()` with `ckpt_path=None`, which prevents the optimizer state from being restored.

2.  **LR Logging:** The `Building trainer with kwargs` line confirms that the `LearningRateMonitor`, `_LrPerGroupLogger`, and `_OptParamsOnceLogger` are all present in the trainer's callbacks list, which is why the `metrics.csv` file now contains the detailed LR and optimizer columns.

3.  **Active Scheduler:** With the logging in place and the new `configure_optimizers` method, I can now see the learning rate correctly warming up and then decaying in the W&B plots, confirming the scheduler is active.

**Note on grad accumulation.** With `+training.accumulate_grad_batches=9`, Lightning performs one optimizer step every 9 batches. Because the scheduler uses `interval="step"`, LR updates **per optimizer step** (i.e., after each accumulation cycle), which is typically what you want. 

---

## Appendix A — What I changed in the training entry

I added a **weights-only** branch in my training script (inside `run_tx_train(...)`) that:

*   Loads a checkpoint via `torch.load(..., weights_only=True)`,
*   Filters state dict keys by **existence & exact shape match**,
*   Calls `trainer.fit(..., ckpt_path=None)` so Lightning does **not** restore optimizer/scheduler.
*   Also registers LR/logging callbacks when `training.log_lr=true`.

That full function lives in my `_train.py`. 
You’ll see these strings in logs when it’s working:
`[weights-only] loaded ...` and `checkpoint_path=None`. 

---

## Appendix B — LR/W&B/CSV callbacks I used

Inside the same training script I appended:

*   `LearningRateMonitor(logging_interval="step")`
*   `_LrPerGroupLogger(every_n_steps=1)` — logs `lr/group_i` per param group
*   `_OptParamsOnceLogger()` — logs `opt/weight_decay`, `opt/beta1`, `opt/beta2`, `opt/eps` once at train start

Those are visible in the final “Building trainer with kwargs” log line and are gated behind `+training.log_lr=true`.  

---

## Appendix C — The exact CLI I ran

As noted above, here’s the (abbreviated) command that wires up W&B, LR, scheduler, and logging flags; it’s the same one I validated the fixes with. 

---

## Appendix D — Code and Logs

*   [Updated `_train.py` script](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/_train_20250912.py)
*   [Original `_train.py` script](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/_train.py)
*   [Updated `base.py` script](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/base_20250912.py)
*   [Original `base.py` script](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/base.py)
*   [`train.log`](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/train.log)
*   [`run_tx_training.sh`](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/run_tx_training.sh)
*   [`metrics.csv`](https://github.com/yuntaozhang999/yuntaozhang999.github.io/blob/master/files/tahoe-fine-tune/metrics.csv)

---

### Final Thoughts

*   If you need to **change optimizer/LR when resuming**, do **not** resume the optimizer state. Load **weights-only** and start with a fresh optimizer.
*   Don’t assume LR is logged—**attach a monitor** (and/or custom logging).
*   Don’t assume your Hydra keys are used—**implement the scheduler** in `configure_optimizers` and prove it with logs.

Hope this saves you the hours I spent untangling it.