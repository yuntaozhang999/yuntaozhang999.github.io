---
title: "Beyond Raw Data: Automating Intact Mass Analysis with Domino and Multi-modal LLMs"
date: 2026-05-06
tags:
  - Mass Spectrometry
  - Automation
  - Domino Data Lab
  - LLM
  - GPT-5
  - BioPharma
---

In the world of BioPharma R&D, data is abundant, but insights are often buried under layers of complex outputs. One of the most common bottlenecks in our lab was the post-processing of **Intact Mass** data from Byos. While Byos does an excellent job with the initial analysis, the raw Excel exports often require significant manual intervention before they are ready for cross-functional stakeholders.

To solve this, I’ve developed an automation pipeline and published it as a **Domino Model Product**, allowing my colleagues to transform raw mass spec data into comprehensive, AI-annotated reports with a single click.

### The Problem: The "Data Fog"
A typical plate-based intact mass analysis generates hundreds of protein species and impurities. For an end-user—who might be focusing on process development or formulation—digesting a list of every detected peak is overwhelming. They need to know the "big picture" of their samples, not just the raw intensity of every minor variant.

### Step 1: Intelligent Summarization & Classification
The first layer of the automation script focuses on **data reduction**. Instead of presenting a raw list of peaks, the script categorizes detected species into logical groups:
- **Main Protein Species:** Highlighting the primary product.
- **Specific Impurities:** Grouping known variants (e.g., glycosylation patterns, truncations).
- **Unknowns:** Flagging unexpected peaks for further review.

This classification allows end-users to understand the sample composition instantly without needing to be mass spec experts themselves.

### Step 2: Spatial & Statistical Visualization
Visualizing data across a plate is critical because sample distribution is rarely random; patterns often emerge based on plate layout (e.g., edge effects, gradient shifts). My tool generates three primary visualizations:

1.  **Plate Heatmaps:** These provide an immediate "at-a-glance" view of the entire plate. By mapping attributes like purity or concentration to the physical layout, we can quickly identify spatial trends or systematic errors.
2.  **Violin Plots:** These help us understand the distribution and density of specific attributes across different groups or conditions.
3.  **Native Excel Stacked Bar Charts:** I integrated these directly into the output Excel file. They provide a clear view of the relative composition of each sample, showing the ratio of main products to various impurities.

### Step 3: "Giving the AI Eyes" (LLM Annotation)
The most innovative part of this workflow is the integration of **GPT-5.1** for multi-modal annotation. Traditionally, automated reports are limited to processing text and numbers. However, by sending the actual **mass spectra images** along with metadata to the LLM, we effectively give the AI "eyes."

- **Multi-modal Analysis:** GPT-5.1 doesn't just look at intensity values; it evaluates the quality of the spectrum itself—checking for signal-to-noise ratios, peak shape, and baseline stability.
- **Contextual Annotation:** The AI follows specific biological and analytical rules to write structured annotations for each sample, providing a human-like summary of the data's reliability and significance.

### Step 4: Cost Efficiency via Azure OpenAI Caching
Deploying LLMs at scale can be expensive. To keep costs down, I utilized **Azure OpenAI API's cache discount** features. By structuring the prompt endpoints and metadata consistently, we maximize the cache hit ratio. This strategy significantly reduces the cost per sample, making it feasible to run large-scale plate analyses through the LLM without breaking the budget.

### Step 5: Democratizing the Tool via Streamlit & Domino
By leveraging **Streamlit** for the frontend and publishing it as a **Domino Model Product**, I've transformed a complex script into a user-friendly web application. The UI is designed to be intuitive while offering deep flexibility:

- **Optional Features:** Users have full control over the workflow. Whether it's generating **Plate Heatmaps** (which requires uploading a platemap CSV from our LIMS), performing **AI Annotations**, or using **Spectrum Visual Analysis**, everything is optional based on the specific needs of the experiment.
- **Parallelized Processing:** For large datasets, the AI annotation step can be parallelized. Users can specify the number of concurrent processes to significantly speed up the reporting phase.
- **Flexible Data Export:** Once processing is complete, a clear success notification informs the user. They can then choose to download the entire package or select specific components, such as high-resolution plots, images, the processed Excel report, or the detailed processing logs.

This integration of traditional automation, spatial visualization, and cutting-edge multi-modal AI is a glimpse into the future of data-driven bioprocessing.

---
*Generated by Gemini CLI - Empowering Biopharma Workflows.*
