---
title: "Hiding Unassigned Protein Mass Peaks in Protein Metrics by Modifying Label Scripts"
date: 2026-01-21
excerpt: ""
tags:
  - Javascript
  - Intact Mass Analysis
  - Protein Metrics
  - Yuntao Zhang
---

# Hiding Unassigned Peaks in Protein Metrics

In this guide, I'll show you how I modified the default Javascript Label Script in Protein Metrics to hide annotations for unassigned peaks in deconvoluted mass spectra—a task I managed to do with no prior Javascript knowledge. In Protein Metrics' Intact Workflows, you can customize the annotations on deconvoluted mass plots using **Label Scripts**. These are Javascript snippets that control what information is displayed for each peak.

I wanted to declutter my deconvoluted mass spectrum by hiding annotations for peaks that weren't assigned. The default settings show proposed protein names and delta-mass information for unassigned, low relative-intensity peaks (often deconvolution artifacts/noise), even when the proposed assignment is wrong. I asked the Microsoft Copilot for help, and here's the path that worked.

## What I started with

The original **Label Script** showed both protein and delta mass names whenever either value was present.

-   **Problem:** Unassigned peaks still showed text, cluttering the plot and misleading users.
-   **Original script:**

```html
<script>
  (function () {
    var proteinName = templateFunctionsManager.detectValue('[ProteinAccessionName]').trim();
    var deltaName = templateFunctionsManager.detectValue('[DeltaMassName]').trim();
    if (!proteinName && !deltaName) {
      return '';
    }
    return '[ProteinAccessionName], [DeltaMassName]';
  })();
</script>
```

## Copilot's key nudge

It pointed me to the built-in scripts under the annotation editor (gear icon → Edit annotations → Load): `Intact_MonoMassIfAssigned`, `Intact_MonoMassIfAssignedAndNamed`, and `Intact_MonoMassIfNamed`.

That was the helpful bit: `Intact_MonoMassIfAssigned` adds a filter. Despite my lack of Javascript knowledge, I could see that the change required was simply adding this filter to the beginning of the default annotation script.

## The simple fix

Add the assigned check and return nothing for everything else:

```html
<script>
  (function () {
    var isValidCandidate = templateFunctionsManager.detectValue('[IsValidCandidate]') == 2;
    if (!isValidCandidate) {
      return '';
    }
    var proteinName = templateFunctionsManager.detectValue('[ProteinAccessionName]').trim();
    var deltaName = templateFunctionsManager.detectValue('[DeltaMassName]').trim();
    if (!proteinName && !deltaName) {
      return '';
    }
    return '[ProteinAccessionName], [DeltaMassName]';
  })();
</script>
```

-   **Result:** Only assigned peaks show labels; unassigned peaks are hidden.

## References
- [Protein Metrics Support: Adding Custom Labels to Deconvoluted Mass Plots in the Intact Workflows](https://support.proteinmetrics.com/hc/en-us/articles/19779703773204-Adding-Custom-Labels-to-Deconvoluted-Mass-Plots-in-the-Intact-Workflows)