---
title: "Automated Sequence Generation and Data Prep Toolkit for LC-MS Intact Mass Analysis of Antibody Biologics"
excerpt: "Toolkit to automate LC-MS sequence generation and data prep for antibody biologics. <br/><img src='/images/plate-map-multiconverter.png' width='500'>"
collection: portfolio
date: 2025-05-01
---

**Organization:** Bristol Myers Squibb  
**Date:** May 2025

**The Challenge**
High-throughput LC-MS intact mass analysis is essential for biologics screening, but its efficiency is hindered by tedious manual sequence setup and data prep steps, which slow workflows, increase errors, and limit throughput.

**My Solution**
I developed a toolkit to significantly streamline this process, initially targeting our group's specific LC-MS workflow. The toolkit is also designed to be adaptable for other similar assays with some modifications:

- **Automated Sequence Generation:**  
  Utilizes plate map information provided by users and automatically generates a CSV file for ThermoFisher Xcalibur to generate LC-MS run sequence and another for Byos (Protein Metrics) for data processing.
- **User-Friendly Design:**  
  GUI for non-programmers, auto-installs Python packages, customizable settings for naming and storage.

**Impact**
- Reduced a manual task from ~15 min to ~15 sec for a single sequence.
- Minimized human errors.
- Improved user experience.

**Technologies Used**  
Python, Tkinter (GUI), CSV Processing
