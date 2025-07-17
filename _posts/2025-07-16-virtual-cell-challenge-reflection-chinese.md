---
title: 'Virtual Cell Challenge 2025, Lesson 1'
date: 2025-07-16
excerpt: ""
tags:
  - virtual cell challenge
  - Model Training
---

> These models must account for additional complexity—such as the cell type, genetic background, and context of a cell—as well as the cellular phenotype being measured and predicted.

#### "context of a cell" 是啥意思？

- **细胞类型 (Cell Type):** 是肝细胞、神经细胞还是免疫细胞？
- **细胞状态 (Cell State):** 细胞是处于休眠、分裂还是分化阶段？
- **培养条件 (Culture Conditions):** 在实验室里，培养基的成分、温度、氧气浓度等。
- **生物环境 (Biological Environment):** 细胞是在生物体内 (in vivo) 还是在培养皿里 (in vitro)？它周围有哪些其他细胞？
- **遗传背景 (Genetic Background):** 一个细胞或生物体中，除了我们正在研究的特定基因之外的所有其他基因的总和。

#### "cellular phenotype" 是啥意思？

- **形态特征：** 细胞是圆的还是长的？
- **功能特征：** 细胞分裂的速度快不快？它是否在分泌某种蛋白质？
- **分子特征：** 哪些基因正在活跃表达？(这在文中尤其重要，因为基因表达就是一种关键的细胞表型)。
- **行为特征：** 细胞是否在移动？它对药物的反应是死亡还是存活？

> Perturbation model performance is affected by substantial technical sources of variability in many existing datasets, including experimental noise introduced during the coupling of genetic perturbations with single-cell transcriptomic profiling, as well as the limited reproducibility of perturbation effects across independent experiments.

#### "experimental noise introduced during the coupling of genetic perturbations with single-cell transcriptomic profiling" 是啥？

**基因干扰 (Genetic Perturbation) 环节的噪音：**

*   **干扰效率不均：** 使用CRISPR技术沉默一个基因时，并非每个细胞中的效果都完全一样。有些细胞可能基因被完全沉默了，有些可能只被部分沉默，还有些可能完全没受影响。这种不一致性就是一种噪音。

**单细胞测序 (Single-cell Profiling) 环节的噪音：**

*   **细胞捕获问题：** 在单细胞测序时，理想情况是每个微滴或孔中只捕获一个细胞。但实际上可能会出现“空包”（没有细胞）或“双包”（两个或多个细胞被误认为一个），这会严重污染数据。
*   **RNA捕获效率低下 (Dropout):** 每个细胞内的RNA含量极少。在提取和逆转录过程中，很多低表达的基因转录本可能会丢失，导致在数据中这些基因的表达量显示为零，但这并非生物学上的真实情况。
*   **测序错误：** 测序仪在读取碱基序列时本身也存在一定的错误率。

**整个流程中的系统性噪音：**

*   **批次效应 (Batch Effects):** 实验通常分批次进行。不同批次的试剂、操作人员、甚至环境的微小差异（如温度波动）都会导致数据产生系统性的偏差。这就是为什么文中提到，新数据集使用的Flex平台能“通过细胞固定来减少批次效应”。

#### "limited reproducibility of perturbation effects across independent experiments" 这是为什么？

**技术层面的不可重现性 (Technical Variability)：**
这直接源于我们上面讨论的**实验噪音**。由于不同实验中的噪音模式（如批次效应、干扰效率）各不相同，最终观察到的“干扰效应”自然也难以完全一致。这就是为什么文中强调，他们为挑战赛生成的数据集“优化了实验参数，以最大化观测效应的可重复性”。

**生物学层面的不可重现性 (Biological Variability & Context Differences)：**
这是更根本、也更难控制的原因。 即使技术操作完美无瑕，生物系统本身也是动态和复杂的。所谓的“独立实验”在生物学意义上几乎不可能做到完全相同。文章中提到的 `context of a cell`（细胞环境）就是这里的关键。

- **细胞类型/细胞系差异 (Cell Type/Line):** 在A细胞系中干扰基因X的效果，可能与在B细胞系中完全不同，因为它们的“遗传背景”和内部调控网络不一样。
- **培养条件差异 (Culture Conditions):** 培养基的微小成分差异、细胞生长的密度、二氧化碳浓度等，都会影响细胞状态，从而改变其对干扰的反应。
- **细胞状态差异 (Cell State):** 即便是同一批细胞，它们也可能处于细胞周期的不同阶段（如分裂期、静止期），这会极大地影响实验结果。

> *The Broad Institute’s Cancer Immunotherapy Data Science Grand Challenge, for instance, focused on predicting broad phenotypic shifts in T cells but did not assess responses at the resolution of gene expression.*

只预测结果：表型的变化。

> *The 2023 NeurIPS-Kaggle competition advanced the field by evaluating gene expression changes in response to small-molecule perturbations in immune cells.*

小分子perturbation对基因表达量的影响。

> Building on these efforts, the field is now ready for a benchmarking competition that assesses gene expression response to genetic perturbations—a task that is central to biological understanding of cell function.

这个challenge是预测genetic perturbation导致的基因表达量的变化。Precisely defined target是genetic perturbation容易理解的地方。

> For the inaugural challenge, we have generated a dedicated dataset measuring single-cell responses to perturbations in a human embryonic stem cell line (H1 hESC).

这个challenge，主办方会提供H1 hESC的single-cell的perturbation数据。

> This set of perturbations was carefully curated to span a broad range of phenotypic responses, and experimental parameters were optimized to maximize the reproducibility of observed effects.

这300个perturbation会导致高低各不相同的表型变化。实验条件充分优化，以最大化结果的可重复性。

> Two core dimensions are (1) generalization across biological context (e.g., cell type, cell line, culture conditions, or even in vivo versus in vitro settings) and (2) generalization to novel genetic and/or chemical perturbations, including their combinations.

1.  在 **biological context** 各个维度上的泛化。这些 biological context 包括细胞类型，细胞系，培养条件，体内还是体外等等。
2.  在 **perturbation** 类型和数量上的泛化。包括未训练过的基因 perturbation，或者化学干扰，甚至是多个干扰同时进行。

> The first Virtual Cell Challenge, launching in 2025, will focus on context generalization as a highly challenging real-world task: participants will predict the effects of single-gene perturbations in a held-out cell type (the H1 hESC; Figure 1B). The transcriptomic consequences of these genetic perturbations have been previously reported in at least one other cellular context.This reflects a common experimental reality: testing all perturbations in every context is impractical due to cost, yet accurate context-specific predictions are crucial because responses depend on factors like cell type, state, differentiation stage, culture conditions, and genetic background.

本次challenge会聚焦在context generalization上。主办方选择的转录组学的结果已经在别的细胞环境条件下被观测和报道过了。
这也是实验中的一个挑战。实验人员不可能尝试完所有可能的细胞环境：细胞类型，细胞系，细胞的state，细胞的分裂状态，培养条件，genetic background等。

> A more appropriate strategy at this stage is few-shot adaptation, where a subset of perturbations in the new cellular context is provided to guide model generalization. To support this, we provide expression profiles for a subset of perturbations measured directly in H1 hESCs, enabling participants to adapt their models before predicting responses to the remaining unseen perturbations in the same cell type.

主办方认为未知泛化目前并不现实，所以主办方提供了和评判数据处于同一个 distribution 的样本数据供参与者训练自己的模型，以实现少量样本泛化。

> The main readouts from such an experiment are post-perturbation expression counts and differentially expressed gene sets.

基因干扰导致的基因表达的变化，并展现一些基因的相关性。

> The differential expression score evaluates how accurately a model predicts differential gene expression, a key output of most scFG experiments and an essential input for downstream biological interpretation.

**差异表达分数：** 单细胞功能基因组学的重要输出就是基因在不同条件下的表达量的变化。

> The perturbation discrimination score measures a model’s ability to distinguish between perturbations by ranking predictions according to their similarity to the true perturbational effect, regardless of their effect size.

**干扰区分评分:** 用来评判模型对于极度相似的干扰的辨别能力。

> For instance, a naive model that consistently predicts the same set of commonly differentially expressed genes from the training data might achieve a reasonable differential expression score. However, its perturbation discrimination score would be random or at the lower bound.

因为有些基因经常受到干扰的影响，所以只要在这些基因的表达量上预测的好，就能得到高的差异表达分数。但是这容易导致模型区分类似干扰的能力差。

> Conversely, a model that successfully distinguishes perturbation effects based on subtle variation in an embedding space might perform well on perturbation discrimination. However, this is unlikely to produce biologically meaningful differentially expressed gene sets, which limits its practical utility as a replacement for experimental measurements.

但是如果模型如果只在区分干扰的能力上见长，这不能保证它能有效预测基因在干扰状态下的表达的差异。

> While MAE is less biologically interpretable, it captures overall predictive accuracy and provides a global view of model performance across the entire gene expression profile.

这个分数用于整体评估。

> We will use a combined score that appropriately weighs each component, and we will enforce minimum thresholds on all metrics to promote a balanced performance, discouraging models that perform well on one metric at the expense of the others.

最终选择一个加权平均分来评估模型的能力。

> For this challenge, we used scFG to generate approximately 300,000 single-cell RNA-sequencing (scRNA-seq) profiles by silencing 300 carefully selected genes using CRISPR interference (CRISPRi) (Figure 1D).

三百个干扰项。每一项有一千个单细胞RNA测序结果。

> We selected these perturbations to represent a broad range in strength of downstream changes (number of significant differentially expressed genes) and phenotypic diversity of perturbation effects in our initial broad, low-depth screen in H1 hESCs while ensuring adequate representation in existing public datasets.

这些干扰项是从2500个干扰项中筛选出来的。筛选的criteria包括：广泛的下游受影响的强度（指标为表达量明显变化的基因的个数），广泛的表型变化的多样性，并且在已知数据集中出现过。

> The evaluation dataset was generated using the Flex scRNA-seq platform with high target cell coverage (median of ∼1,000 cells per perturbation) and depth of sequencing (over 50,000 unique molecular identifiers [UMIs] per cell).

- **Flex scRNA-seq平台：** 有什么优点，有什么不足？
- **高目标细胞覆盖率:** 平均每个干扰有一千个细胞。（每个扰动条件下的细胞数量中位数约为 1,000）用于保证数据的覆盖度和代表性。
- **高测序深度：** 50000五万个UMI（非常深）能检测到更多低丰度 mRNA，对用于评估扰动对细胞状态影响的数据质量非常重要。保证捕捉到足够多的转录本，检测弱表达基因的表达变化。

> Participants will receive a transcriptomic reference of unperturbed H1 hESCs, a training set consisting of single-cell profiles for 150 gene perturbations (∼150,000 cells), a validation set of 50 genes whose perturbations are used to create a live leaderboard during the competition, and a final test set of 100 held-out perturbations, released a week prior to the submission deadline. Final rankings will be based solely on performance on the held-out test set.

会有未被干扰的H1细胞的转录组数据，150个干扰的转录组数据用于训练，50个干扰的转录组数据用于验证，剩下的100个用于最终的test和评分。

> This recently released resource is composed of scBaseCount and Tahoe-100M, the largest collection of publicly available observational and perturbational scRNA-seq datasets, respectively.

这是主办方提供的其他训练集。数据量很庞大。

> We will also provide preprocessed versions of selected publicly available perturbation datasets that overlap with the perturbations that are included in the test set.11,16,17,18 While this selection is not exhaustive, these few large datasets with substantial perturbation overlaps are intended to support model training, since observing the effects of target perturbations in alternate cell contexts may be beneficial during model training.

主办方也会提供与处理过的数据集。这些数据集中包含在测试集中出现的感染，但是是在别的细胞环境下。

> (1) surface best practices and critical data considerations—from training set quality to sequencing depth and platform choice—that will support more reproducible and robust research efforts;

让我们更好的理解训练集质量，测序深度，平台选择对模型能力的影响。
- **数据预处理、模型架构、损失函数设计**
- **训练集质量:** 是否有 batch effect、噪声、标签准确性
- **训练集本身的多样性与标签准确性**
- **单细胞测序深度 (UMIs/cell)**
- **使用的测序平台**（如 10x vs Smart-seq vs Flex 平台）
- 等关键技术选择对结果的影响。

> (2) identify methodological bottlenecks, clarify data and/or model choices, and converge on more reproducible standards for perturbation modeling;

**瓶颈:**
- 模型无法泛化
- 缺乏跨扰动类型适应性
- 对训练集偏差敏感
- 表达量极低基因预测困难

**标准:**
- 哪些预处理方法是必要的（如 SCTransform、Harmony 校正）
- 哪些模型结构或损失设计有效
- 是否需要联合训练多个 perturbation 条件
- 输入/输出格式标准
- baseline benchmark 方法
- 常用评价指标（如 MSE、Pearson r、biological relevance）

> (3) highlight the importance of training data quality, cell coverage, sequencing depth, and technology choice.

- **training data quality:** 标签准确、batch effect 可控、足够多样的扰动条件
- **cell coverage:** 每个扰动条件下的细胞数（如你之前看到的 1,000 cells/perturbation），保证统计有效
- **sequencing depth:** 每个细胞的测序深度（如 50,000 UMIs/cell），捕捉低丰度转录本
- **technology choice:** 使用哪种测序平台和建库方案，影响数据结构、偏差和下游可用性
