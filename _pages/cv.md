---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

Education
======
* Ph.D. in Bioanalytical and Physical Chemistry
  * University of the Pacific, Stockton, CA, USA
  * Aug. 2016 – May 2021
* M.S. in Environmental Engineering
  * University of the Pacific, Stockton, CA, USA
  * Sep. 2012 – May 2014
* B.S. in Ecology
  * University of Science and Technology Beijing, Beijing, China
  * Sep. 2008 – Jun. 2012

Work Experience
======
* **Scientist – Senior Scientist**, Bristol Myers Squibb, CA, USA, Oct. 2021 – Present
  * Leading mass spectrometry characterization and high-resolution Carbene Footprinting for epitope/paratope mapping to support biologics, ADCs, and cell therapy pipelines.
  * Co-inventor of anti-LRRC15 antibodies and antibody-drug conjugates (ADCs) (granted US patent / WIPO international patent applications).
  * Spearheaded deep learning workflows and foundation model fine-tuning (e.g. ST-Tahoe single-cell perturbation) and automated LC-MS data analysis pipelines.
  * Mentored data science and bioinformatics interns (Recipient of the CABS Mentor Impact Award).
* **Research Assistant**, University of the Pacific, CA, USA, Aug. 2016 – Aug. 2021
  * Investigated structural and energetic properties of peptoids/peptides using advanced MS and computational modeling.
  * Developed computational workflows for peptide/peptoid characterization; contributed to 3 peer-reviewed publications.
  * Mentored 25+ students in peptide synthesis, MS, and molecular modeling; several mentees pursued advanced degrees.

Skills
======
* Analytical Techniques
  * Carbene footprinting for epitope/paratope mapping, Peptide Mapping, Glycan Profiling, Native MS, Intact/Subunit Mass Analysis
* Instrumentation
  * Orbitrap Fusion Lumos, Exactive Plus EMR, ZenoTOF 7600, TripleQuad 7500, timsTOF Pro2, 6530B QTOF, 6230B TOF
  * Acquity M Class, 1260/1290 Infinity II, Ultimate 3000, NanoElute2
  * Maurice System
* Computational & Data Analysis
  * **Analytical Software:** Skyline, Xcalibur, Sciex OS, Compass
  * **Molecular Modeling:** Gaussian, Orca, GaussView, VMD, Maestro, PyMOL
  * **Programming & Data Science:** Python, Bash, PyTorch, PyTorch Lightning, Pandas, Scikit-learn
  * **ML Models & Techniques:** Deep Learning, Foundation Models (ST-Tahoe, Boltz-2, AlphaGenome), Fine-Tuning, Representation Learning
  * **Platforms & MLOps:** Google Cloud Platform (GCP), AWS Bedrock, Domino Data Lab, Docker, `uv`, `pip`, Git, Weights & Biases (W&B)


Awards and Fellowships
======
* **Mentor Impact Award**, *Chinese American Biopharmaceutical Society (CABS)*, Sep. 2026
  * Recognized for mentoring interns in machine learning and bioinformatics pipelines within the CABS Summer Internship Program.
* **Poster Award at Science Festival**, *Bristol Myers Squibb*, Oct. 2023
  * Selected for best poster presentation.
* **PCSP Graduate Seminarian of the Year**, *University of the Pacific*, Nov. 2020
  * Selected for outstanding research seminar presentation.
* **John H. Shinkai Endowed Graduate Student Scholarship**, *University of the Pacific*, Jun. 2017 & Jun. 2020
  * Awarded for excellence in research and academic accomplishment.
* **PCSP College of the Pacific Dean's Travel Award**, *University of the Pacific*, Jun. 2019
  * Competitive travel grant for conference presentation.

Publications
======

## Patents
  <ul>{% for post in site.publications reversed %}
    {% if post.category == 'patents' %}
      {% include archive-single-cv.html %}
    {% endif %}
  {% endfor %}</ul>

## Journal Articles
  <ul>{% for post in site.publications reversed %}
    {% if post.category == 'manuscripts' %}
      {% include archive-single-cv.html %}
    {% endif %}
  {% endfor %}</ul>
  
Talks
======
  <ul>{% for post in site.talks reversed %}
    {% include archive-single-talk-cv.html  %}
  {% endfor %}</ul>
  
Teaching
======
  <ul>{% for post in site.teaching reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
Service and Leadership
======
* Mentor, CABS 2026 Data Science Summer Internship Program, *Chinese American Biopharmaceutical Society (CABS)*, Sep. 2026
* Peer Reviewer for:
  * ACS Biomaterials Science & Engineering
  * ACS Omega
  * Inorganica Chimica Acta
  * RSC Advances
* Active member of the American Society for Mass Spectrometry (ASMS) since 2017
