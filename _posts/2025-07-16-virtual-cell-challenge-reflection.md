---
title: 'Virtual Cell Challenge 2025, Lesson 1'
date: 2025-07-16
excerpt: ""
tags:
  - virtual cell challenge
  - Model Training
---
The original challenge is annouced in Cell as an commentary [Virtual Cell Challenge: Toward a Turing test for the virtual cell](https://www.cell.com/cell/fulltext/S0092-8674(25)00675-0) 


> These models must account for additional complexity—such as the cell type, genetic background, and context of a cell—as well as the cellular phenotype being measured and predicted.

### What does "context of a cell" mean?

- **Cell Type:** Is it a liver cell, a neuron, or an immune cell?
- **Cell State:** Is the cell dormant, dividing, or differentiating?
- **Culture Conditions:** In the lab, the components of the culture medium, temperature, oxygen concentration, etc.
- **Biological Environment:** Is the cell in a living organism (in vivo) or in a petri dish (in vitro)? What other cells are around it?
- **Genetic Background:** The sum of all other genes in a cell or organism, besides the specific gene we are studying.

### What does "cellular phenotype" mean?

- **Morphological features:** Is the cell round or elongated?
- **Functional features:** How fast does the cell divide? Is it secreting a certain protein?
- **Molecular features:** Which genes are actively expressed? (This is particularly important in the text, as gene expression is a key cellular phenotype).
- **Behavioral features:** Is the cell moving? Does it respond to a drug by dying or surviving?

> Perturbation model performance is affected by substantial technical sources of variability in many existing datasets, including experimental noise introduced during the coupling of genetic perturbations with single-cell transcriptomic profiling, as well as the limited reproducibility of perturbation effects across independent experiments.

### What is "experimental noise introduced during the coupling of genetic perturbations with single-cell transcriptomic profiling"?

**Noise from the Genetic Perturbation step:**

*   **Uneven perturbation efficiency:** When using CRISPR to silence a gene, the effect is not exactly the same in every cell. Some cells may have the gene completely silenced, some partially silenced, and some may not be affected at all. This inconsistency is a source of noise.

**Noise from the Single-cell Profiling step:**

*   **Cell capture issues:** In single-cell sequencing, ideally only one cell is captured in each droplet or well. But in reality, "empties" (no cell) or "doublets" (two or more cells mistaken for one) can occur, which seriously contaminates the data.
*   **Low RNA capture efficiency (Dropout):** The amount of RNA in each cell is extremely small. During extraction and reverse transcription, many transcripts of low-expression genes may be lost, causing their expression levels to appear as zero in the data, which is not the biological reality.
*   **Sequencing errors:** The sequencer itself has a certain error rate when reading base sequences.

**Systemic noise throughout the process:**

*   **Batch Effects:** Experiments are usually performed in batches. Different batches of reagents, operators, and even minor environmental differences (like temperature fluctuations) can cause systematic deviations in the data. This is why the text mentions that the new dataset uses the Flex platform to "reduce batch effects through cell fixation."

### Why is there "limited reproducibility of perturbation effects across independent experiments"?

**Technical Variability:**
This stems directly from the **experimental noise** we discussed above. Because the noise patterns (like batch effects, perturbation efficiency) differ between experiments, the final observed "perturbation effect" is naturally difficult to replicate perfectly. This is why the text emphasizes that the dataset generated for the challenge had "optimized experimental parameters to maximize the reproducibility of observed effects."

**Biological Variability & Context Differences:**
This is a more fundamental and harder-to-control reason. Even with flawless technical execution, biological systems are inherently dynamic and complex. A so-called "independent experiment" is almost impossible to be completely identical in a biological sense. The `context of a cell` mentioned in the article is key here.

- **Cell Type/Line Differences:** The effect of perturbing gene X in cell line A might be completely different from that in cell line B because their "genetic backgrounds" and internal regulatory networks are different.
- **Culture Condition Differences:** Minor differences in media components, cell growth density, carbon dioxide concentration, etc., will affect the cell state and thus alter its response to the perturbation.
- **Cell State Differences:** Even within the same batch of cells, they can be in different phases of the cell cycle (e.g., division, quiescence), which greatly affects the experimental results.

> *The Broad Institute’s Cancer Immunotherapy Data Science Grand Challenge, for instance, focused on predicting broad phenotypic shifts in T cells but did not assess responses at the resolution of gene expression.*

Only predict the outcome: the change in phenotype.

> *The 2023 NeurIPS-Kaggle competition advanced the field by evaluating gene expression changes in response to small-molecule perturbations in immune cells.*

The effect of small-molecule perturbations on gene expression levels.

> Building on these efforts, the field is now ready for a benchmarking competition that assesses gene expression response to genetic perturbations—a task that is central to biological understanding of cell function.

This challenge is to predict the changes in gene expression levels caused by genetic perturbations. A precisely defined target is what makes genetic perturbation easy to understand.

> For the inaugural challenge, we have generated a dedicated dataset measuring single-cell responses to perturbations in a human embryonic stem cell line (H1 hESC).

For this challenge, the organizers will provide single-cell perturbation data for H1 hESCs.

> This set of perturbations was carefully curated to span a broad range of phenotypic responses, and experimental parameters were optimized to maximize the reproducibility of observed effects.

These 300 perturbations will cause a wide variety of phenotypic changes. The experimental conditions are fully optimized to maximize the reproducibility of the results.

> Two core dimensions are (1) generalization across biological context (e.g., cell type, cell line, culture conditions, or even in vivo versus in vitro settings) and (2) generalization to novel genetic and/or chemical perturbations, including their combinations.

1.  Generalization across various dimensions of **biological context**. These biological contexts include cell type, cell line, culture conditions, in vivo vs. in vitro, etc.
2.  Generalization in the type and number of **perturbations**. This includes untrained gene perturbations, chemical perturbations, or even multiple perturbations applied simultaneously.

> The first Virtual Cell Challenge, launching in 2025, will focus on context generalization as a highly challenging real-world task: participants will predict the effects of single-gene perturbations in a held-out cell type (the H1 hESC; Figure 1B). The transcriptomic consequences of these genetic perturbations have been previously reported in at least one other cellular context.This reflects a common experimental reality: testing all perturbations in every context is impractical due to cost, yet accurate context-specific predictions are crucial because responses depend on factors like cell type, state, differentiation stage, culture conditions, and genetic background.

This challenge will focus on context generalization. The transcriptomic results selected by the organizers have already been observed and reported in other cellular contexts.
This is also a challenge in experiments. It is impossible for experimenters to test all possible cellular environments: cell type, cell line, cell state, cell division stage, culture conditions, genetic background, etc.

> A more appropriate strategy at this stage is few-shot adaptation, where a subset of perturbations in the new cellular context is provided to guide model generalization. To support this, we provide expression profiles for a subset of perturbations measured directly in H1 hESCs, enabling participants to adapt their models before predicting responses to the remaining unseen perturbations in the same cell type.

The organizers believe that zero-shot generalization is currently unrealistic, so they provide sample data from the same distribution as the evaluation data for participants to train their models, in order to achieve few-shot generalization.

> The main readouts from such an experiment are post-perturbation expression counts and differentially expressed gene sets.

Changes in gene expression caused by genetic perturbation, and showing the correlation of some genes.

> The differential expression score evaluates how accurately a model predicts differential gene expression, a key output of most scFG experiments and an essential input for downstream biological interpretation.

**Differential expression score:** An important output of single-cell functional genomics is the change in gene expression levels under different conditions.

> The perturbation discrimination score measures a model’s ability to distinguish between perturbations by ranking predictions according to their similarity to the true perturbational effect, regardless of their effect size.

**Perturbation discrimination score:** Used to evaluate the model's ability to distinguish between highly similar perturbations.

> For instance, a naive model that consistently predicts the same set of commonly differentially expressed genes from the training data might achieve a reasonable differential expression score. However, its perturbation discrimination score would be random or at the lower bound.

Because some genes are often affected by perturbations, a good prediction of their expression levels can lead to a high differential expression score. However, this can easily lead to a poor ability of the model to distinguish between similar perturbations.

> Conversely, a model that successfully distinguishes perturbation effects based on subtle variation in an embedding space might perform well on perturbation discrimination. However, this is unlikely to produce biologically meaningful differentially expressed gene sets, which limits its practical utility as a replacement for experimental measurements.

However, if a model only excels at distinguishing perturbations, it cannot guarantee that it can effectively predict the differential expression of genes under perturbation.

> While MAE is less biologically interpretable, it captures overall predictive accuracy and provides a global view of model performance across the entire gene expression profile.

This score is used for overall evaluation.

> We will use a combined score that appropriately weighs each component, and we will enforce minimum thresholds on all metrics to promote a balanced performance, discouraging models that perform well on one metric at the expense of the others.

Finally, a weighted average score is chosen to evaluate the model's performance.

> For this challenge, we used scFG to generate approximately 300,000 single-cell RNA-sequencing (scRNA-seq) profiles by silencing 300 carefully selected genes using CRISPR interference (CRISPRi) (Figure 1D).

Three hundred perturbations. Each has one thousand single-cell RNA sequencing results.

> We selected these perturbations to represent a broad range in strength of downstream changes (number of significant differentially expressed genes) and phenotypic diversity of perturbation effects in our initial broad, low-depth screen in H1 hESCs while ensuring adequate representation in existing public datasets.

These perturbations were selected from 2500 perturbations. The selection criteria include: a wide range of downstream effect strengths (measured by the number of genes with significantly changed expression), a wide diversity of phenotypic changes, and have appeared in existing public datasets.

> The evaluation dataset was generated using the Flex scRNA-seq platform with high target cell coverage (median of ∼1,000 cells per perturbation) and depth of sequencing (over 50,000 unique molecular identifiers [UMIs] per cell).

- **Flex scRNA-seq platform:** What are its advantages and disadvantages?
- **High target cell coverage:** An average of one thousand cells per perturbation. (The median number of cells per perturbation condition is about 1,000) to ensure data coverage and representativeness.
- **High sequencing depth:** 50,000 UMIs (very deep) can detect more low-abundance mRNA, which is very important for the quality of data used to evaluate the impact of perturbations on cell state. Ensure that enough transcripts are captured to detect changes in the expression of weakly expressed genes.

> Participants will receive a transcriptomic reference of unperturbed H1 hESCs, a training set consisting of single-cell profiles for 150 gene perturbations (∼150,000 cells), a validation set of 50 genes whose perturbations are used to create a live leaderboard during the competition, and a final test set of 100 held-out perturbations, released a week prior to the submission deadline. Final rankings will be based solely on performance on the held-out test set.

There will be transcriptomic data of unperturbed H1 cells, transcriptomic data of 150 perturbations for training, transcriptomic data of 50 perturbations for validation, and the remaining 100 for the final test and scoring.

> This recently released resource is composed of scBaseCount and Tahoe-100M, the largest collection of publicly available observational and perturbational scRNA-seq datasets, respectively.

This is another training set provided by the organizers. The amount of data is huge.

> We will also provide preprocessed versions of selected publicly available perturbation datasets that overlap with the perturbations that are included in the test set.11,16,17,18 While this selection is not exhaustive, these few large datasets with substantial perturbation overlaps are intended to support model training, since observing the effects of target perturbations in alternate cell contexts may be beneficial during model training.

The organizers will also provide pre-processed datasets. These datasets contain perturbations that appear in the test set, but in other cellular contexts.

> (1) surface best practices and critical data considerations—from training set quality to sequencing depth and platform choice—that will support more reproducible and robust research efforts;

Let us better understand the impact of training set quality, sequencing depth, and platform choice on model performance.
- **Data preprocessing, model architecture, loss function design**
- **Training set quality:** Are there batch effects, noise, label accuracy?
- **Diversity and label accuracy of the training set itself**
- **Single-cell sequencing depth (UMIs/cell)**
- **Sequencing platform used** (e.g., 10x vs Smart-seq vs Flex platform)
- and other key technical choices' impact on the results.

> (2) identify methodological bottlenecks, clarify data and/or model choices, and converge on more reproducible standards for perturbation modeling;

**Bottlenecks:**
- Model cannot generalize
- Lack of adaptability across perturbation types
- Sensitive to training set bias
- Difficulty in predicting genes with extremely low expression

**Standards:**
- Which preprocessing methods are necessary (e.g., SCTransform, Harmony correction)
- Which model structures or loss designs are effective
- Is it necessary to jointly train multiple perturbation conditions
- Input/output format standards
- Baseline benchmark methods
- Common evaluation metrics (e.g., MSE, Pearson r, biological relevance)

> (3) highlight the importance of training data quality, cell coverage, sequencing depth, and technology choice.

- **training data quality:** accurate labels, controllable batch effects, sufficiently diverse perturbation conditions
- **cell coverage:** number of cells per perturbation condition (e.g., the 1,000 cells/perturbation you saw earlier), ensuring statistical validity
- **sequencing depth:** sequencing depth per cell (e.g., 50,000 UMIs/cell), capturing low-abundance transcripts
- **technology choice:** which sequencing platform and library preparation method to use, affecting data structure, bias, and downstream usability