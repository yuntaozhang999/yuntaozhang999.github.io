---
title: "Tracking Grad Norm Surge and Unbounded Final Norm"
date: 2026-09-13
excerpt: ""
---

Recently, we observed a significant surge in `grad/norm/total` immediately following the step 81k swap to a near-dropless Expert Parallelism (EP) routing strategy. As seen in the red line of our metrics dashboard, the total gradient norm suddenly spiked:

![Total Gradient Norm Surge at Step 81k](/images/moe_grad_norm_surge_step81k.png)

However, an important correction must be made regarding the root cause. The norm of `final_norm.weight` had already reached approximately 340 well before step 81k (as shown by the blue line). The switch to near-dropless EP at step 81k did not initiate this growth from 78; rather, it caused the slope to steepen further, driving the norm past 360+:

![Unbounded Final Norm Weight Growth Across Scaling Ladder](/images/final_norm_weight_scaling_ladder.png)

A zoomed-in perspective at the step 81k transition boundary highlights this slope steepening clearly:

![Zoomed Perspective of Step 81k Slope Steepening](/images/final_norm_weight_step81k_zoom.png)

### Domination by `lm_head`
The total gradient norm is heavily dominated by the `lm_head`, which contains around 800M parameters. Since the `lm_head` is directly facing the cross-entropy loss, any changes to the incoming activations directly impact its gradients. The term "incoming activation" refers exactly to the features being fed into the `lm_head` from the final layer of the transformer block.

### RMSNorm Learnable Parameter
To understand the amplification, we need to look at RMSNorm. The learnable parameter, gamma, is a 6144-dimensional vector, not a single scalar. When initialized to ones, its L2 norm is approximately $\sqrt{6144} \approx 78.4$. 

### Excluded Weight Decay
Why did the norm of `final_norm.weight` grow unbounded to 340+? In the Marin model, weight decay is applied to gates and routers, but it is explicitly excluded on `final_norm` (norm weights have `wd=0`). 

### Gradient Amplification
Because the final norm's weight has grown to ~340, it amplifies the gradient significantly. The incoming feature $z$ to the `lm_head` is computed as $z = (x / \text{rms}(x)) \times \gamma$. With the norm of $\gamma$ increasing from ~78 to ~340+, the feature magnitude is amplified by roughly 4.6x. This directly scales the gradient with respect to the `lm_head` weights ($dL/dW_{lm}$).

### Safeguards and Contingency
We currently employ a Logit z-loss of 0.0001 as a safeguard. However, as a contingency plan, if the gradient norm reaches a dangerous threshold of 5+, we may need to introduce weight decay to the `final_norm` parameter to constrain its unbounded growth.
