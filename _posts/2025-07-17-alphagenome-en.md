---
title: 'AlphaGenome Quick Start Colab Notebook, Lesson 1'
date: 2025-07-17
excerpt: ""
tags:
  - AlphaGenome
  - Quick Start
  - Jupyter Notebook
  - Google Colab
---

Google DeepMind's **AlphaGenome** predicts multimodal epigenomic, transcriptional, and 3D architectural profiles directly from raw DNA sequence windows. Running the official `quick_start.ipynb` locally and interpreting its outputs requires bridging high-throughput deep learning engineering with fundamental molecular biology.

This guide reorganizes the essential operational insights, source code mechanics, and genomic workflows into four focused, high-density technical modules.

---

## Module 1: Local Environment & Authentication Gotchas

### 1.1 Virtual Environment Kernel Selection in VS Code
When deploying AlphaGenome locally, dependencies must reside within an isolated virtual environment (e.g., `.venv/` or conda). However, VS Code notebooks frequently default to the global base interpreter or system Python, resulting in immediate `ModuleNotFoundError: No module named 'alphagenome'`.
* **Diagnostic & Fix**: Click the kernel picker in the top-right corner of the notebook interface (`Select Kernel` → `Python Environments...`), and explicitly select `./.venv/bin/python`.
* **Kernel Verification**: Execute `!which python` or `import sys; print(sys.executable)` in the first cell to confirm execution within the intended virtual environment.

### 1.2 API Key Configuration: Local Shell vs. Google Colab
AlphaGenome uses remote inference endpoints requiring an authorized API key.
* **Colab Workflow**: The original notebook relies on `colab_utils.get_api_key()`, which interfaces with Google Colab's native secret storage (`google.colab.userdata`).
* **Local Development Workflow**: In a standalone workstation or server environment, `colab_utils` fails immediately. The API key must be exported directly into the operating system environment:
  ```bash
  export ALPHAGENOME_API_KEY="your_alphagenome_api_key_here"
  ```
* **Persistent Configuration**: Place this export into your `~/.zshrc` or `~/.bashrc`, or maintain it within a local `.env` file loaded via `python-dotenv`.

### 1.3 Resolving `PERMISSION_DENIED` Errors
A common failure when executing `dna_client.create()` is a gRPC/HTTP `PERMISSION_DENIED` response:
1. **Unexported Environment Variable**: Setting `ALPHAGENOME_API_KEY=...` in a child shell does not propagate to VS Code unless launched from that terminal (`code .`). If launched via GUI, restart VS Code or set the variable globally.
2. **Stale Kernel Process**: Jupyter kernels cache environment variables at spawn time. If you export the key after opening the notebook, restart the Jupyter kernel.
3. **Invalid or Unregistered Credentials**: AlphaGenome requires explicit API whitelist access. Verify that your Google Cloud / DeepMind project credentials are active.

---

## Module 2: Input/Output Specifications & Modality Filtering

### 2.1 Strict Sequence Length Constraints (Powers of Two)
AlphaGenome's deep convolutional-transformer architecture enforces strict receptive field dimensions. As defined in `src/alphagenome/models/dna_client.py` via `SUPPORTED_SEQUENCE_LENGTHS`, input sequences must match exact powers of 2 ranging from $2^{11}$ to $2^{20}$ base pairs:
```
2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576 (1MB)
```

#### Sequence Normalization & 'N' Padding
Arbitrary test fragments (such as `'GATTACA'`) cannot be submitted directly. They must be expanded to the minimum valid window (2,048 bp) using Python's `.center()` method:
```python
sequence = "GATTACA"
padded_sequence = sequence.center(2048, "N")
```
* **The Biological Role of 'N'**: In IUPAC nucleotide nomenclature, `N` denotes an unknown or unspecified base. AlphaGenome embeds `'N'` as a neutral/background distribution, ensuring the centered target motif is evaluated without edge-effect distortion or invalid tensor dimensions.

#### Intuitive Foundation: Why a 1MB (1,048,576 bp) Regulatory Window?
> **ELI5 Concept**: A gene is not an isolated workshop operating in a vacuum. A 1MB receptive field captures the entire industrial park's power grid, supply chains, and transportation corridors. In the nucleus, distant enhancers, silencers, and insulator complexes located hundreds of kilobases away fold through 3D chromatin loops to physically contact the gene's core promoter. Truncating the context to just the gene body blinds the model to these long-range regulatory drivers.

### 2.2 The 11 Supported Functional Modalities
AlphaGenome predicts 11 distinct genomic assay readouts grouped across five fundamental biological layers:

| Layer | Output Modality | Biological Phenomenon Measured |
| :--- | :--- | :--- |
| **Chromatin Accessibility** | `ATAC` | Open chromatin regions accessible to Tn5 transposase |
| | `DNASE` | DNase I hypersensitive regulatory sites |
| **Transcription & Expression** | `RNA_SEQ` | Steady-state mature transcript abundance |
| | `CAGE` | 5'-capped transcript ends and Transcription Start Sites (TSS) |
| | `PROCAP` | Nascent, transcriptionally engaged RNA polymerase activity |
| **Epigenomic Modifications** | `CHIP_HISTONE` | Post-translational histone marks (e.g., H3K4me3, H3K27ac) |
| | `CHIP_TF` | Sequence-specific Transcription Factor (TF) binding profiles |
| **RNA Splicing Dynamics** | `SPLICE_SITES` | Precise donor (5') and acceptor (3') splice site recognition |
| | `SPLICE_SITE_USAGE` | Quantitative splice site selection probability |
| | `SPLICE_JUNCTIONS` | Exon-exon junction spanning read densities |
| **3D Genome Architecture** | `CONTACT_MAPS` | Hi-C / Micro-C pairwise chromatin interaction frequencies |

### 2.3 Multi-Track Tissue Specificity & UBERON Ontology
A single inference call outputs a `TrackData` object containing:
* `TrackData.values`: Array of shape `(sequence_length, num_tracks)`.
* `TrackData.metadata`: Detailed descriptors of each prediction column.

Because regulatory elements activate in tissue-specific contexts (e.g., a liver-specific enhancer remains dormant in brain tissue), individual tracks correspond to distinct biosamples. Rather than relying on ambiguous free-text labels, AlphaGenome indexes tissue tracks using standardized **UBERON** anatomical ontology terms (e.g., `UBERON:0002107` for liver, `UBERON:0000955` for brain) and stranded assay configurations (`+` vs. `-` strands).

---

## Module 3: In Silico Mutagenesis (ISM) & Source Code Mechanics

### 3.1 Systematic Single-Base Substitution ($L \times 4$ Matrix)
In Silico Mutagenesis (ISM) is the computational equivalent of high-throughput deep mutational scanning. To probe regulatory grammar within a target window of length $L$ (such as a 256 bp promoter):
1. Every position $i \in \{1 \dots L\}$ is systematically mutated to the other three possible nucleotides ($L \times 3$ variant sequences).
2. The model predicts functional output shifts for all variants relative to the reference sequence.
3. The resulting predictions populate an $L \times 4$ attribution matrix, where rows denote nucleotide positions and columns denote $\{A, C, G, T\}$.

### 3.2 Reference Position Value Calculation from AlphaGenome Source Code
A critical algorithmic question is how the baseline reference sequence value is populated in the ISM matrix. Inspection of the AlphaGenome source code (`/src/alphagenome/interpretation/ism.py`, line 142) reveals the exact centering formula:
```python
scores = scores - np.mean(scores, axis=-1, where=filled, keepdims=True)
```

#### Why Does the Reference Value Equal the Negative Mean of Alternative Alleles?
Consider a single position $i$. Prior to centering, let the reference sequence score be set to zero ($s_{\text{ref}} = 0$, representing no deviation from baseline), while the three alternative substitutions have effect scores $s_a, s_b, s_c$.

When computing the mean across all four alleles:
$$\mu = \frac{s_{\text{ref}} + s_a + s_b + s_c}{4} = \frac{0 + s_a + s_b + s_c}{4} = \frac{1}{4}\sum_{k \in \{a, b, c\}} s_k$$

Centering subtracts $\mu$ from every allele. Therefore, the calibrated reference position score evaluates to:
$$\text{Score}_{\text{ref}} = s_{\text{ref}} - \mu = 0 - \mu = -\frac{1}{4}\sum_{k \in \{a, b, c\}} s_k$$

* **Biological Implication**: If a wild-type nucleotide forms a critical transcription factor binding motif, mutating it to alternative bases causes destructive loss of function ($s_a, s_b, s_c < 0$). Consequently, their mean $\mu$ is strongly negative, making $\text{Score}_{\text{ref}} = -\mu > 0$ strongly positive. In sequence logos, this manifests as a prominent wild-type letter stack, cleanly visualizing the necessity of the reference base.

### 3.3 AnnData Integration
For scalable downstream bioinformatics, AlphaGenome formats high-dimensional ISM attribution outputs into `AnnData` objects:
* `.X`: Primary mutation delta or effect score matrix.
* `.obs`: Variant observation metadata (chromosomal coordinate, reference allele, alternate allele, variant ID).
* `.var`: Target variables (tissue tracks, UBERON terms, assay types, gene symbols).
* `.uns`: Unstructured run metadata (model checkpoint, normalization parameters, receptive field window).

---

## Module 4: Gene Structure Case Study: CYP2B6 & GTF Interval Merging

### 4.1 Real-World 1MB Chromosome 19 Analysis
To demonstrate gene structure modeling in a realistic genomic context, the notebook examines **CYP2B6** (Cytochrome P450 Family 2 Subfamily B Member 6), a liver-expressed enzyme central to drug metabolism (e.g., antiretrovirals and anesthetics).

Analyzing the 27,014 bp CYP2B6 locus against GENCODE v46 annotations yields the following architecture:
* **Total Gene Span**: 27,014 bp (100.0%)
* **Introns**: 23,288 bp (**86.2%**)
* **Exons**: 3,726 bp (**13.8%**)
* **Untranslated Regions (UTRs)**: 2,527 bp (**9.4%**)
* **Coding Sequence (CDS)**: 1,199 bp (**4.4%**)
* **Intron-to-Exon Ratio**: ~6.2 : 1

```
Total Gene Body: 27,014 bp (100%)
├── Introns: 23,288 bp (86.2%)
└── Exons: 3,726 bp (13.8%)
    ├── UTR (Regulatory non-coding): 2,527 bp (9.4%)
    └── CDS (Protein-coding): 1,199 bp (4.4%)
```

#### Intuitive Foundation: Exons vs. Introns
> **ELI5 Concept**: If a gene is a published instructional textbook, **exons** are the actual printed sentences that provide step-by-step instructions for assembling the protein machine. **Introns** are not useless "junk"—they are the blank margins, chapter breaks, and evolutionary buffer zones. They allow alternative splicing (mixing and matching chapters to produce different manuals from one gene) and absorb random mutational strikes so that vital coding sentences remain undamaged.

### 4.2 GTF Interval Merging & Feature Filtering Implementation
In standard GENCODE GTF files, alternative splicing results in multiple overlapping exon and transcript records. Simply summing exon coordinates creates massive double counting. An interval merging algorithm is required to calculate non-redundant genomic coverage.

The complete Python implementation for parsing and interval aggregation:
```python
import pandas as pd


def merge_intervals(intervals: list[tuple[int, int]]) -> list[tuple[int, int]]:
  """Merge overlapping or contiguous 1-based genomic coordinate intervals.

  Args:
      intervals: List of (start, end) coordinate tuples.

  Returns:
      List of merged (start, end) tuples without overlaps.
  """
  if not intervals:
    return []

  # Sort intervals primarily by start position, secondarily by end position
  sorted_intervals = sorted(intervals, key=lambda x: (x[0], x[1]))
  merged = [sorted_intervals[0]]

  for current_start, current_end in sorted_intervals[1:]:
    last_start, last_end = merged[-1]
    if current_start <= last_end + 1:
      # Overlap or contiguous detected; extend the existing interval boundary
      merged[-1] = (last_start, max(last_end, current_end))
    else:
      # Non-overlapping; start a new interval
      merged.append((current_start, current_end))

  return merged


def calculate_gene_metrics(
    gtf_df: pd.DataFrame, gene_name: str
) -> dict[str, int]:
  """Filter GTF annotations by gene and compute non-redundant feature lengths.

  Args:
      gtf_df: DataFrame containing parsed GTF records (columns: 'feature',
        'start', 'end', 'gene_name').
      gene_name: Target gene symbol (e.g., 'CYP2B6').

  Returns:
      Dictionary mapping feature types to non-redundant base pair lengths.
  """
  gene_records = gtf_df[gtf_df['gene_name'] == gene_name]

  metrics = {}
  for feature_type in ['exon', 'CDS', 'UTR']:
    subset = gene_records[gene_records['feature'] == feature_type]
    raw_intervals = list(zip(subset['start'], subset['end']))
    merged = merge_intervals(raw_intervals)
    total_bp = sum(end - start + 1 for start, end in merged)
    metrics[feature_type] = total_bp

  # Mathematical consistency check: Exon length must equal CDS + UTR length
  assert metrics['exon'] == metrics['CDS'] + metrics['UTR'], (
      f"Discrepancy detected: Exons ({metrics['exon']} bp) != "
      f"CDS ({metrics['CDS']} bp) + UTR ({metrics['UTR']} bp)"
  )

  return metrics
```

### Summary of Engineering Takeaways
By combining explicit sequence padding (`.center(2048, 'N')`), robust virtual environment isolation, UBERON-guided track selection, and rigorous coordinate merging algorithms, AlphaGenome empowers researchers to dissect gene regulation and variant impact with atomic biological precision.
