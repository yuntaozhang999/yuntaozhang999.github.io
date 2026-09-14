---
title: "Engineering Notes from the Open-Source Frontier: PSGD, Levanter, TPU Orchestration, and the Inference Economics of LLMs"
date: 2026-09-13
layout: single
permalink: /ai/engineering/psgd-levanter-tpu-orchestration/
excerpt: ""
categories:
  - AI
  - Engineering
tags:
  - LLM
  - Optimization
  - PSGD
  - JAX
  - Levanter
  - TPU
  - Distributed Systems
  - Linear Attention
---

## 1. Introduction: Systems Challenges in Modern Pre-Training

In large foundation model pre-training, raw parameter counts tell only part of the story. The primary bottlenecks in production clusters emerge at the intersection of non-convex optimization geometry, distributed scheduling on transient hardware, cloud storage I/O latency, and the autoregressive inference memory wall.

Recent engineering discussions in open-source pre-training initiatives (such as the Marin Community) surface four foundational architectural trade-offs:

| Dimension | Default Approach | Critical Failure Mode | Modern Systems Pattern |
| :--- | :--- | :--- | :--- |
| **Optimization** | First-order (AdamW) | Transverse canyon oscillation; brittle hyperparameter tuning | Lie-group curvature preconditioning (PSGD-Kron) |
| **Compute Scheduling** | Reserved On-Demand VMs | Prohibitive cloud infrastructure expenditure | Fault-tolerant spot orchestration (Levanter + JAX) |
| **Storage Architecture** | Ad-hoc network mounts | Random seek latency; unexpected idle billing | Decoupled Read/Write planes (Hyperdisk ML vs. GCS) |
| **Serving Economics** | Softmax attention | $\mathcal{O}(L)$ KV Cache memory footprint | Constant-state linear attention (BASED, MiniMax-01) |


---

## 2. The Curvature Breakthrough: PSGD vs. First-Order Optimizers

### The Canyon Dilemma
Loss surfaces in multi-billion parameter spaces routinely form ill-conditioned ravines: transverse cliff walls exhibit massive curvature and gradient steepness, while the longitudinal floor slopes gently toward the minimum with near-zero curvature.

First-order methods (SGD, AdamW) evaluate only the gradient $\nabla L$. Dominated by the steep transverse walls, the optimizer bounces violently between cliffs while making negligible forward headway. While Adam scales coordinates via moving variance ($\sqrt{v_t}$), it remains fundamentally blind to cross-parameter coupling.

### Warping the Canyon into a Symmetric Bowl
Second-order optimization incorporates the **Hessian matrix** $H_{ij} = \frac{\partial^2 L}{\partial \theta_i \partial \theta_j}$, which tracks gradient curvature. Preconditioned updates take the form:

$$\Delta \theta = - P^{-1} \nabla L(\theta)$$

Mathematically, preconditioning acts as a coordinate **whitening transform**. Dampening high-curvature directions and scaling up flat directions geometrically warps the distorted canyon into an isotropic bowl, directing the gradient straight toward the global minimum.

### The Dimension Catastrophe of Explicit Hessians
For a standard **70B parameter** model ($N = 7 \times 10^{10}$), an explicit Hessian contains $N^2 = 4.9 \times 10^{21}$ elements. In `float32` (4 bytes/element):

$$\text{Memory} = 4.9 \times 10^{21} \times 4 \text{ bytes} \approx 1.96 \times 10^{22} \text{ bytes} \approx 19.6 \text{ Zettabytes}$$

Materializing or inverting a 19.6 ZB matrix is physically impossible.

### The PSGD-Kron Solution
**PSGD (Preconditioned Stochastic Gradient Descent)** eliminates explicit Hessian computation:
1. **Lie Group & Manifold Optimization**: PSGD updates a preconditioning matrix online via stochastic gradient fitting and whitening transforms on matrix Lie groups.
2. **Kronecker Factorization (Kron)**: For 2D linear weight matrices $W \in \mathbb{R}^{d_{out} \times d_{in}}$, PSGD decomposes the curvature matrix into two compact factors:

   $$P \approx P_{left} \otimes P_{right}$$

   where $P_{left} \in \mathbb{R}^{d_{out} \times d_{out}}$ and $P_{right} \in \mathbb{R}^{d_{in} \times d_{in}}$.

This reduces memory and compute overhead from quadratic in total layer weights to quadratic in layer dimensions, delivering second-order curvature acceleration with memory overhead competitive with AdamW.

---

## 3. Distributed Fault-Tolerance: Levanter on Preemptible Compute

### Spot Infrastructure Economics
Cloud providers sell surplus datacenter capacity as **Preemptible / Spot VMs** at **60% to 90% discounts**, but reclaim them with only 30 to 120 seconds of notice. Under standard All-Reduce collectives (FSDP / Tensor Parallelism), if a single worker node is preempted, the entire cluster job crashes.

### The Levanter Stack
To achieve fault-tolerant 70B parameter training on preemptible clusters, modern pipelines deploy **Levanter** over JAX:
- **Functional Purity (JAX + Equinox)**: Model weights and states are encapsulated as immutable Python dataclasses, enabling seamless serialization.
- **Named Tensors (Haliax)**: Replaces error-prone positional slicing (`.view()`, `.transpose()`) with explicit semantic axis labels (`batch`, `seq`, `hidden`).
- **Bitwise Reproducibility**: Explicit PRNG key management (`jax.random.PRNGKey`) guarantees bit-for-bit exact resumption upon restarting failed workers from object storage checkpoints.
- **Asynchronous Checkpointing**: Checkpoints stream to cloud buckets in the background, making high-frequency snapshots cheap.

### Why Home PCs Cannot Train 70B Models
A common misconception is whether fault-tolerant frameworks enable volunteer crowd-sourcing across consumer PCs (like Folding@home):

| Dimension | Volunteer Computing (Folding@home) | Distributed LLM Pre-Training |
| :--- | :--- | :--- |
| **Coupling** | Embarrassingly parallel (isolated tasks) | Synchronous All-Reduce (tightly coupled) |
| **Latency** | Tens to hundreds of milliseconds | Sub-microsecond optical links |
| **Bandwidth** | 100 – 1000 Mbps (Broadband) | **400 Gbps – Multi-Tbps (ICI / InfiniBand)** |
| **Payload per Step** | Kilobytes per job | Tens of Gigabytes per step (~hundreds of ms) |

Consumer broadband latency stalls accelerator matrix units by orders of magnitude. Spot computing succeeds because instances share the **same ultra-high-bandwidth datacenter fabric**; only the reservation is transient.

---

## 4. Cluster Architecture & Topology: Head Nodes, Ray, and TPU v6e

### Coordination Hierarchy
Efficient distributed orchestration enforces strict separation between control and compute:
1. **Worker Nodes (TPUs/GPUs)**: Solely execute compiled XLA compute graphs and collective communications.
2. **Head Node (CPU VM)**: A low-cost VM executing scheduling, logging, and health checks.
3. **Ray Head**: Runs Ray’s **Global Control Store (GCS)**, job submission endpoints, and distributed actor lifecycles across the cluster.

### TPU v6e (Trillium): Pod vs. Rack Architecture
Google's TPU v6e delivers ~4.7x compute FLOPs and 2x HBM capacity/bandwidth over v5e, mapping one functional core per physical chip:
- **Physical Rack**: A standard 42U datacenter cabinet housing server chassis, power units, and Top-of-Rack Ethernet switches.
- **TPU Pod (Slice)**: A logical supercomputer interconnected via Google's proprietary **Inter-Chip Interconnect (ICI)** in a 2D/3D Torus topology. A large Pod spans dozens of physical racks stitched together with thousands of dedicated optical fibers.

### The AlgoPerf Benchmark Standard
To evaluate optimizers without academic bias, practitioners rely on MLCommons' **AlgoPerf**:
- **The Problem**: Papers frequently over-tune novel optimizers via massive grid searches while comparing against poorly tuned AdamW defaults.
- **The Standard**: AlgoPerf enforces a strict **hyperparameter tuning budget** and ranks optimizers on true **Time-to-Target** wall-clock execution across diverse workloads.

---

## 5. Storage Architecture Matrix: GCS FUSE vs. Hyperdisk ML

### The Golden Rule: Decoupling Read and Write Planes
Distributed machine learning requires two conflicting I/O patterns:

| Storage Plane | Primary Objective | Access Pattern | Target Solution | Anti-Pattern |
| :--- | :--- | :--- | :--- | :--- |
| **Data Ingestion (Read)** | Zero accelerator starvation | Thousands of nodes reading immutable data | High-throughput multi-reader block disk | Raw network file shares |
| **Checkpointing (Write)** | Zero compute stall | Burst writes of multi-hundred GB states | Asynchronous object storage (GCS Bucket) | Direct writes to multi-reader disks |

### GCS FUSE vs. Hyperdisk ML Trade-offs

#### Cloud Storage FUSE (`gcsfuse`)
Mounts GCS buckets as local POSIX directories.
- **The Safetensors Bottleneck**: Modern `.safetensors` files rely on `mmap` and non-sequential byte seeking. Under FUSE, unbuffered random seeks trigger cascading HTTP round-trips and I/O timeouts unless heavily cached (`--file-cache`, `--stat-cache-capacity`).

#### Hyperdisk ML
Google Cloud's specialized block storage for AI workloads.
- **Multi-Reader**: Allows up to thousands of TPU/GPU instances to mount the exact same volume in **Read-Only** mode with aggregate throughput in hundreds of GB/s.
- **No Direct Writes**: Hyperdisk ML strictly prohibits direct writes while mounted. Data must be written to an intermediary disk, snapshotted, and instantiated as a read-only volume.
- **Multi-Writer Warning**: While normal Hyperdisk (Balanced/Extreme) supports multi-writer attachments, it requires an external clustered filesystem (e.g., Lustre, GPFS) with distributed locking; mounting with standard `ext4`/`xfs` corrupts disk metadata instantly.

#### The Idle Provisioned Billing Trap
Hyperdisk bills primarily for **Provisioned Throughput (MB/s)**:
- Provisioning 1,200 MB/s ensures ultra-fast model loading.
- However, Google Cloud bills for that 1,200 MB/s pipe **continuously (24/7)**, even if instances sit completely idle. An unmonitored development disk can easily spike daily spend from $5 to over $100.

#### Serving with vLLM TPU
- **Approach A (FUSE)**: Inexpensive, but requires careful tuning to prevent `safetensors` seek latency.
- **Approach B (Hyperdisk ML)**: Instantaneous `mmap` loading across hundreds of nodes, but requires pre-baked disk images and incurs provisioned throughput costs.
- **Approach C (Boot Download)**: Parallel CLI download (`gcloud storage cp`) directly to local VM scratch space. Zero persistent disk costs, but incurs cold-start latency.

---

## 6. The Inference Memory Wall: Linear Attention Economics

### The KV Cache Explosion
During autoregressive generation, storing Key ($K$) and Value ($V$) vectors in accelerator HBM avoids $\mathcal{O}(N^2)$ recomputation:

$$\text{Memory}_{KV} = 2 \times \text{Batch} \times \text{Length} \times N_{\text{layers}} \times D_{\text{head}} \times N_{\text{heads}} \times \text{BytesPerParam}$$

At context lengths of 128k to 1M tokens, the KV Cache consumes hundreds of gigabytes per concurrent request, quickly dwarfing static model weights and hitting an impenetrable **Inference Memory Wall**.

### Linear Attention: The 3-Line Mathematical Derivation
Standard Softmax attention couples queries and keys non-linearly:

$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{Q K^T}{\sqrt{d}}\right) V \quad [\mathcal{O}(N^2) \text{ Compute \& Memory}]$$

Linear attention replaces Softmax with kernel feature maps $\phi(\cdot)$:

$$\text{Attention}(Q, K, V) = (\phi(Q) \phi(K)^T) V$$

By the **associative property of matrix multiplication**, we alter the execution order:

$$(\phi(Q) \phi(K)^T) V = \phi(Q) (\phi(K)^T V)$$

Rather than computing the $N \times N$ matrix $(\phi(Q) \phi(K)^T)$, we evaluate the compact state matrix $S = \phi(K)^T V \in \mathbb{R}^{d_k \times d_v}$ first!

In recurrent decoding, state updates incrementally:

$$S_t = S_{t-1} + \phi(k_t)^T v_t, \quad \text{Output}_t = \phi(q_t) S_t$$

Because $S$ has a fixed dimension $(d_k \times d_v)$, **it never grows with sequence length**. Decoding token 1 and token 1,000,000 consumes the exact same constant memory and execution time ($\mathcal{O}(1)$).

### Frontier Implementations
- **BASED**: Combines Taylor-expansion linear attention with localized 1D convolutions to solve associative recall while maintaining linear throughput.
- **MiniMax-01**: An open-weights foundation model utilizing **Lightning Attention** (linear attention variant) paired with sparse **Mixture-of-Experts (MoE)**, serving multi-million-token contexts at a fraction of standard Transformer serving costs.

---

## 7. Knowledge Check: Interactive Engineering Challenge

Verify your architectural intuition on second-order curvature, spot-compute fault tolerance, storage trade-offs, and linear attention economics. Select your answers below and click **Submit Answers** for an instant diagnostic score and detailed post-mortem.

<link rel="stylesheet" href="{{ base_path }}/assets/css/interactive-quiz.css">
<script src="{{ base_path }}/assets/js/interactive-quiz.js" defer></script>

<div class="quiz-container" markdown="0">
  <div class="quiz-title">⚡ Systems & Optimization Self-Assessment</div>
  <div class="quiz-subtitle">Verify your architectural intuition on second-order curvature, spot-compute fault tolerance, storage trade-offs, and linear attention economics.</div>

  <form id="llm-systems-quiz" class="interactive-quiz-form" data-msg-perfect="🎯 &lt;strong&gt;Score: 4/4 (100%):&lt;/strong&gt; Flawless. You have complete architectural mastery over curvature preconditioning, spot orchestration, and inference economics." onsubmit="return false;">
    
    <!-- Question 1 -->
    <div class="quiz-card" id="card-q1" data-question="q1" data-correct="B">
      <div class="quiz-q-title">Q1. (Optimization Geometry & Curvature Whitening)<br>
      In high-dimensional parameter space, loss landscapes typically form an elongated ravine ("Canyon Problem"). Why do standard first-order optimizers (SGD, AdamW) struggle in such terrains, and how do preconditioned second-order methods like PSGD accelerate convergence?</div>
      
      <div class="quiz-options">
        <label class="quiz-option" id="label-q1-A" data-option="A">
          <input type="radio" name="q1" value="A">
          <span><strong>A.</strong> First-order optimizers evaluate third-order derivatives, causing fatal truncation errors during step calculation.</span>
        </label>
        <label class="quiz-option" id="label-q1-B" data-option="B">
          <input type="radio" name="q1" value="B">
          <span><strong>B.</strong> First-order gradients oscillate violently between steep canyon walls with minimal forward headway; PSGD estimates a curvature preconditioner that whitens coordinates into an isotropic bowl, directing updates straight toward the minimum.</span>
        </label>
        <label class="quiz-option" id="label-q1-C" data-option="C">
          <input type="radio" name="q1" value="C">
          <span><strong>C.</strong> PSGD explicitly materializes and inverts the complete 70B × 70B Hessian matrix directly in accelerator HBM.</span>
        </label>
        <label class="quiz-option" id="label-q1-D" data-option="D">
          <input type="radio" name="q1" value="D">
          <span><strong>D.</strong> Adam is mathematically proven never to converge on convex surfaces, whereas PSGD is the only optimizer with theoretical convergence guarantees.</span>
        </label>
      </div>

      <div class="quiz-explanation" id="expl-q1">
        <strong>Detailed Breakdown:</strong> Transverse slopes dominate the gradient, causing violent lateral oscillations. PSGD uses Kronecker-factored Lie-group preconditioning to whiten coordinates into an isotropic bowl, aligning updates with the true minimum without ever storing an explicit 19.6 ZB Hessian.
      </div>
    </div>

    <!-- Question 2 -->
    <div class="quiz-card" id="card-q2" data-question="q2" data-correct="B">
      <div class="quiz-q-title">Q2. (Distributed Fault-Tolerance & Spot Compute)<br>
      Recent distributed engineering breakthroughs show that frameworks like Levanter can reliably train models up to 70B parameters on preemptible compute. Which statement correctly captures the underlying distributed systems dynamics and engineering constraints?</div>
      
      <div class="quiz-options">
        <label class="quiz-option" id="label-q2-A" data-option="A">
          <input type="radio" name="q2" value="A">
          <span><strong>A.</strong> With modern frameworks, 70B model training can be crowd-sourced across millions of volunteer residential PCs worldwide, identical to Folding@home.</span>
        </label>
        <label class="quiz-option" id="label-q2-B" data-option="B">
          <input type="radio" name="q2" value="B">
          <span><strong>B.</strong> Standard synchronous parallelisms (FSDP, TP) crash upon single-node preemption; modern resilient frameworks overcome this via low-overhead asynchronous checkpointing, graceful signal handling, and bitwise reproducibility across restarts.</span>
        </label>
        <label class="quiz-option" id="label-q2-C" data-option="C">
          <input type="radio" name="q2" value="C">
          <span><strong>C.</strong> Preemptible instances are inexpensive because cloud vendors physically disable their high-speed Inter-Chip Interconnect (ICI) optical fabrics.</span>
        </label>
        <label class="quiz-option" id="label-q2-D" data-option="D">
          <input type="radio" name="q2" value="D">
          <span><strong>D.</strong> Preemptible training is mathematically limited to models smaller than 1B parameters because 70B parameter weights cannot be serialized before power cutoff.</span>
        </label>
      </div>

      <div class="quiz-explanation" id="expl-q2">
        <strong>Detailed Breakdown:</strong> Synchronous distributed pre-training requires real-time All-Reduce exchanges over 400 Gbps+ optical fabrics with microsecond latency. Residential broadband latency completely stalls accelerators. Levanter enables spot training within datacenter fabrics via bitwise reproducibility and asynchronous checkpointing.
      </div>
    </div>

    <!-- Question 3 -->
    <div class="quiz-card" id="card-q3" data-question="q3" data-correct="B">
      <div class="quiz-q-title">Q3. (Accelerator Storage Architectures & Billing Mechanics)<br>
      When deploying large model inference engines (e.g., vLLM TPU) or ingesting petabyte-scale training datasets on TPU v6e (Trillium) pods, which storage design aligns with best engineering practices?</div>
      
      <div class="quiz-options">
        <label class="quiz-option" id="label-q3-A" data-option="A">
          <input type="radio" name="q3" value="A">
          <span><strong>A.</strong> Hyperdisk ML natively supports concurrent multi-node read/write operations and should be used to save frequent training checkpoints.</span>
        </label>
        <label class="quiz-option" id="label-q3-B" data-option="B">
          <input type="radio" name="q3" value="B">
          <span><strong>B.</strong> Checkpoints should stream asynchronously to Cloud Storage (GCS) Buckets; Hyperdisk ML is optimized as an immutable, read-only volume mounted concurrently across hundreds of nodes for dataset ingestion or fast inference weight loading.</span>
        </label>
        <label class="quiz-option" id="label-q3-C" data-option="C">
          <input type="radio" name="q3" value="C">
          <span><strong>C.</strong> Cloud Storage FUSE provides identical nanosecond-level random seek performance to local NVMe SSDs, loading <code>safetensors</code> model weights without latency overhead.</span>
        </label>
        <label class="quiz-option" id="label-q3-D" data-option="D">
          <input type="radio" name="q3" value="D">
          <span><strong>D.</strong> Hyperdisk pricing is metered strictly by processed byte volume; setting provisioned throughput to thousands of MB/s incurs zero cost while instances are idle.</span>
        </label>
      </div>

      <div class="quiz-explanation" id="expl-q3">
        <strong>Detailed Breakdown:</strong> Hyperdisk ML is strictly read-only and disallows multi-node writes. Checkpoints belong on scalable, lock-free object storage (GCS). Furthermore, Hyperdisk bills continuously 24/7 for Provisioned Throughput, creating severe billing spikes on idle instances.
      </div>
    </div>

    <!-- Question 4 -->
    <div class="quiz-card" id="card-q4" data-question="q4" data-correct="B">
      <div class="quiz-q-title">Q4. (Inference Economics & Attention Mechanics)<br>
      Foundation model researchers emphasize that next-generation architectures must design for inference economics, advocating for linear attention architectures (e.g., BASED, MiniMax-01) and KV cache sharing. Why does linear attention transform the economics of long-context serving?</div>
      
      <div class="quiz-options">
        <label class="quiz-option" id="label-q4-A" data-option="A">
          <input type="radio" name="q4" value="A">
          <span><strong>A.</strong> Linear attention strips out all Feed-Forward Network (FFN) blocks, reducing total parameter count by 90%.</span>
        </label>
        <label class="quiz-option" id="label-q4-B" data-option="B">
          <input type="radio" name="q4" value="B">
          <span><strong>B.</strong> Softmax attention incurs <i>O</i>(<i>N</i><sup>2</sup>) complexity and linear KV Cache expansion; linear attention uses feature maps and matrix associativity to eliminate Softmax, compressing history into a fixed-size state matrix (<i>O</i>(1)) that preserves constant decoding memory and latency.</span>
        </label>
        <label class="quiz-option" id="label-q4-C" data-option="C">
          <input type="radio" name="q4" value="C">
          <span><strong>C.</strong> Linear attention can only execute on host CPUs and cannot be compiled to accelerator matrix multiplication units (MXUs/Tensor Cores).</span>
        </label>
        <label class="quiz-option" id="label-q4-D" data-option="D">
          <input type="radio" name="q4" value="D">
          <span><strong>D.</strong> The cost reduction of linear attention is achieved exclusively by abandoning causal autoregressive masking.</span>
        </label>
      </div>

      <div class="quiz-explanation" id="expl-q4">
        <strong>Detailed Breakdown:</strong> Standard Softmax attention enforces <i>O</i>(<i>N</i><sup>2</sup>) complexity and linear KV Cache expansion (<i>O</i>(<i>B</i> · <i>L</i> · <i>D</i>)). Linear attention applies kernel feature maps and matrix associativity \((\phi(Q)\phi(K)^T)V = \phi(Q)(\phi(K)^TV)\), maintaining a fixed-size recurrent state matrix \(S \in \mathbb{R}^{d_k \times d_v}\) with constant <i>O</i>(1) decoding memory and execution time.
      </div>
    </div>

    <!-- Action Buttons and Result Summary -->
    <div class="quiz-action-row">
      <button type="button" class="quiz-btn quiz-btn-primary" id="btn-submit-quiz">Submit Answers</button>
      <button type="button" class="quiz-btn quiz-btn-secondary" id="btn-reset-quiz">Reset Quiz</button>
    </div>

    <div id="quiz-result-banner" class="quiz-result-banner" role="status" aria-live="polite"></div>
  </form>
</div>

---

## 8. Summary & Engineering Takeaways

1. **Curvature Over Gradient Brute Force**: Parameter landscapes are anisotropic ravines. Second-order Lie-group preconditioning (PSGD-Kron) transforms narrow canyons into isotropic bowls, converging faster than AdamW without explicit Hessian storage.
2. **Embrace Hardware Transience**: Spot compute slashes infrastructure bills by 60%–90%. Achieving stability requires pairing purely functional, bitwise-reproducible stacks (JAX, Equinox, Haliax, Levanter) with sub-minute checkpoint streaming.
3. **Decouple Storage Planes**: Never mix read and write paths. Stream dynamic checkpoints asynchronously to object stores (GCS Buckets), and restrict high-throughput block volumes (Hyperdisk ML) to immutable dataset loading and fast inference cold-starts—while strictly monitoring provisioned throughput billing meters.
4. **Architect for Long-Context Inference**: Pre-training costs are paid once; inference costs scale with every generated token. To break the quadratic KV cache barrier at multi-million token contexts, production architectures must shift toward constant-state linear attention mechanisms (BASED, Lightning Attention / MiniMax-01).
