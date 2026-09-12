---
title: "Deconstructing the Model Context Protocol (MCP): From stdio Pipes to Streamable HTTP"
date: 2026-09-12
layout: single
excerpt: "A hands-on deep dive into building an MCP server from scratch: understanding JSON-RPC 2.0 over process pipes, why Streamable HTTP replaces SSE for the cloud, and handling large data without blowing up the context window."
categories:
  - AI
  - Architecture
tags:
  - MCP
  - Model Context Protocol
  - Python
  - Systems Design
  - AI Agents
---

The **Model Context Protocol (MCP)** is widely introduced as the "USB-C for AI applications"—an open standard designed to connect LLM hosts (such as Claude Code, AGY, or Codex) with external tools and resources. 

However, looking past high-level abstractions, what actually happens under the hood when an MCP server executes? 

To understand MCP from the ground up, I built a minimal Python calculator MCP server (`calculator-mcp`) from scratch, inspected raw JSON-RPC wire protocols, tested local IPC pipes against cloud HTTP transports, and analyzed how large-scale payloads should be designed.

---

### 1. The Anatomy of an MCP Server: The 10-Line Mental Model

At its simplest, an MCP server is just a process exposing typed callable functions to an LLM. In Python (using the `mcp>=2.0` SDK), defining a server requires surprisingly little code:

```python
from mcp.server.mcpserver import MCPServer

mcp = MCPServer("Calculator")

@mcp.tool()
def add(a: float, b: float) -> float:
    """Add two numbers together."""
    return a + b

@mcp.tool()
def subtract(a: float, b: float) -> float:
    """Subtract b from a."""
    return a - b

@mcp.tool()
def multiply(a: float, b: float) -> float:
    """Multiply a and b."""
    return a * b

@mcp.tool()
def divide(a: float, b: float) -> float:
    """Divide a by b."""
    if b == 0:
        raise ValueError("Cannot divide by zero!")
    return a / b

if __name__ == "__main__":
    mcp.run()
```

Every piece of standard Python syntax here serves a dual purpose for the LLM:
- **Function Name (`add`)** becomes the tool identifier.
- **Type Annotations (`a: float, b: float`)** are automatically compiled into a JSON Schema definition (`{"type": "number"}`).
- **Docstring (`"""Add two numbers together."""`)** acts as the prompt instruction that tells the model *when* and *why* to pick this tool.

---

### 2. Under the Hood: stdio IPC and the Handshake Protocol

When running an MCP server locally (via `stdio` transport), **there are no network sockets, no HTTP ports, and no web servers.**

The host application (such as AGY or Claude Code) launches the server as a child process (`spawn`) and takes ownership of its `stdin` (input) and `stdout` (output) pipes. The protocol communicates strictly over JSON-RPC 2.0.

#### The Protocol Lifecycle:
1. **Initialize & Handshake**: The host verifies protocol capabilities:
   ```json
   --> {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"HostAgent","version":"1.0"}}}
   <-- {"jsonrpc":"2.0","id":1,"result":{"capabilities":{"tools":{"listChanged":false}},"protocolVersion":"2024-11-05","serverInfo":{"name":"Calculator"}}}
   --> {"jsonrpc":"2.0","method":"notifications/initialized"}
   ```
2. **Capability Discovery (`tools/list`)**: The host requests the tool definitions:
   ```json
   --> {"jsonrpc":"2.0","id":2,"method":"tools/list"}
   <-- {"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"add","description":"Add two numbers together.","inputSchema":{"properties":{"a":{"type":"number"},"b":{"type":"number"}},"required":["a","b"],"type":"object"}}]}}
   ```
3. **Execution Loop (`tools/call`)**: When the LLM decides to perform a calculation, it sends a call request and waits on the pipe:
   ```json
   --> {"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"add","arguments":{"a":10,"b":25}}}
   <-- {"jsonrpc":"2.0","id":3,"result":{"content":[{"text":"35.0","type":"text"}],"isError":false,"structuredContent":{"result":35.0}}}
   ```

---

### 3. Development vs. Production: Inspector vs. Headless

There is a distinct difference between development and runtime invocation:
- **`mcp dev server.py`**: Intended for human developers. It spins up a local Node.js web server (the MCP Inspector) listening on `localhost:6274`, manages the Python child process via pipes, and provides a web UI to visually inspect schemas and execute test calls.
- **`mcp run server.py`**: Intended for AI hosts. It runs completely headless, reading JSON-RPC directly from `stdin` and writing to `stdout`.

---

### 4. Moving to the Cloud: Why Streamable HTTP Replaces SSE

While local `stdio` works seamlessly on a developer's workstation, cloud-hosted MCP servers require network transports.

Earlier MCP iterations relied on **SSE (Server-Sent Events) paired with HTTP POST**. However, SSE proves brittle in cloud-native architectures:
- It requires persistent long-lived connections, making it hostile to serverless runtimes (AWS Lambda, Cloudflare Workers).
- It complicates load balancing and pod scaling.
- Corporate firewalls and reverse proxies often terminate idle SSE connections.

The modern standard is **Streamable HTTP**:
```python
if __name__ == "__main__":
    mcp.run(transport="streamable-http", host="0.0.0.0", port=8000)
```

In Streamable HTTP, each client receives a stateful session key via the HTTP header (`Mcp-Session-Id`). Subsequent requests pass this header:

```bash
# 1. Initialize session and obtain Mcp-Session-Id header
curl -i -X POST http://127.0.0.1:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize",...}'

# 2. Invoke tools using the session identity
curl -X POST http://127.0.0.1:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: <SESSION_ID>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"add","arguments":{"a":100,"b":250}}}'
```

---

### 5. Architectural Edge Cases: The 500MB File Dilemma

A common design pitfall is attempting to stream large binary files (e.g., 500MB datasets or video files) directly through MCP tool payloads. Doing so causes two critical failures:
1. **Network & Memory Collapse**: Serializing 500MB into JSON-RPC messages triggers process memory spikes (OOM) and connection timeouts.
2. **Context Window Exhaustion**: Even models with multi-million token context windows cannot effectively handle raw bulk data without losing reasoning fidelity and incurring massive latency/costs.

#### The Industrial Pattern: Storage Bypass (Sidecar Architecture)

Instead of passing the file through the LLM, the model should only act as the control plane:

```
[AI Agent] --- (1) get_upload_url() ---> [MCP Server]
     |                                          |
     | <--- (2) Pre-signed S3 URL --------------|
     |
     +--- (3) Upload 500MB directly to S3 -----> [Cloud Object Storage]
                                                        |
[AI Agent] --- (4) process_data(file_id) ----> [MCP Server]
                                                        |
                                            (5) Internal query & aggregation
                                                        |
[AI Agent] <--- (6) 2KB Summary Result -----------------+
```

1. **Pre-signed Upload**: The MCP server issues a temporary pre-signed S3 upload URL.
2. **Direct Ingestion**: The client streams the 500MB file directly to cloud object storage.
3. **Out-of-Band Compute**: The MCP server runs compute (e.g., DuckDB, Pandas, or streaming line transformations) against the storage bucket directly in the cloud.
4. **Summary Return**: Only refined analytical conclusions or metadata (a few kilobytes) return to the LLM.

---

### 6. The Blueprint: Building a Full Agentic System for 500MB SQL Workloads

Having validated the core protocol and edge-case architectures, the next milestone is building a complete, production-grade **Agentic System** specifically designed for editing and refactoring massive SQL dump files (e.g., 500MB database backups) without crashing LLM contexts.

#### System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Web UI (Client Application)                                  │
│    - Conversational chat interface for natural-language prompts │
│    - Direct S3 drag-and-drop file uploader with progress        │
│    - One-click processed file download                          │
└─────────┬───────────────────────────────┬───────────────────────┘
          │ (A) 1. Request presigned URL  │ (B) 2. Direct upload (500MB)
          │     3. User prompt instructions│        (Bypasses server)
          ▼                               ▼
┌──────────────────┐             ┌────────────────────────────────┐
│ 2. AI Agent Core │             │ 3. AWS S3 Bucket               │
│    Orchestrates  │             │    - input/large_dump.sql      │
│    reasoning &   │             │    - output/modified_dump.sql  │
│    tool calls    │             └────────▲───────────────┬───────┘
└─────────┬────────┘                      │               │
          │                               │ (D) 5. Stream │
          │ (C) 4. Streamable HTTP        │     line-by-line
          │     JSON-RPC 2.0              │     transform │
          ▼                               │     & write   │
┌─────────────────────────────────────────┴───────────────▼───────┐
│ 4. Containerized MCP Server (Slim Docker Instance)              │
│    - Footprint: 0.5 vCPU, 512MB RAM                             │
│    - Exposes stream transformation tools to the Agent           │
│    - Operates via chunked, zero-copy line streams               │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Architecture Highlights:
1. **Separation of Storage and Compute**:
   - The 500MB SQL file **never enters the AI Agent's prompt context** and **never passes through the application server body**.
   - The client uploads directly to S3 via pre-signed URLs.
2. **Slim Containerized MCP Execution**:
   - The MCP Server remains an ultra-lightweight container (0.5 vCPU / 512MB RAM).
   - When the Agent calls a transformation tool (e.g., table renaming, charset conversion, or constraint patching), the server executes streaming line-by-line transformations (`for line in s3_stream`) directly between S3 input and output objects. Memory footprint stays under 50MB regardless of file size.
3. **Decoupled Streamable HTTP Transport**:
   - Communication between the Agent Brain and the MCP Server is handled entirely over modern **Streamable HTTP** with dedicated `Mcp-Session-Id` management, enabling cloud-native scaling and serverless deployment.

---

### 7. The Fundamental Question: Why an MCP Server at All?

A frequent, intuitive question arises: *"If it's an SQL file, why can't the AI simply use SQL to edit it? Why introduce an MCP server at all? Does the MCP server just run SQL commands?"*

This exposes a fundamental misconception about files versus databases:

#### 1. Static Text Files vs. Running Database Engines
A `.sql` file on disk or S3 is **not** an active database. It is a lifeless, 500MB plain-text document containing millions of characters of `CREATE TABLE` and `INSERT` statements. 
- You cannot issue an `ALTER TABLE` statement against a `.sql` text file—neither operating systems nor SQL engines support executing SQL commands against raw text files.
- To modify a text file, something must literally open the byte stream, cut the characters, replace strings, and write them back.

#### 2. The Brain (AI) vs. Hands (MCP Server) Paradigm
- **The AI Agent is a "Brain Without Hands"**: It excels at understanding human intent (e.g., *"mask all customer phone numbers and rename table X to Y"*). However, it possesses no physical file handles, no disk I/O, and cannot stream 500MB without regurgitating all 500MB token by token (which would crash or cost a fortune).
- **The MCP Server is the "Motor Cortex & Power Tools"**: The MCP server doesn't execute SQL queries. Instead, it is a high-speed Python streaming engine. It takes high-level parameterized tool calls from the AI (e.g., `regex_replace(pattern, replacement)` or `parse_ast_and_patch()`) and runs deterministic, low-memory, zero-copy line streams across the cloud storage.

In short: **The AI decides *what* rules to apply; the MCP server executes the physical surgery.**

---

### 8. Red-Teaming the Architecture: 4 Production Pitfalls

Before writing code, stress-testing this design reveals four critical architectural traps that must be mitigated:

1. **The Gateway Timeout Trap (Synchronous HTTP)**:
   - *Problem*: Streaming a 500MB file can take 30–60 seconds. Cloud gateways (Nginx, AWS API Gateway) terminate HTTP connections exceeding 30 seconds with 504 Timeouts.
   - *Mitigation*: The MCP tools must follow an **Asynchronous Job Pattern**: `start_sql_job()` immediately returns a `job_id`, while the Agent polls `get_job_progress(job_id)` for non-blocking execution.
2. **The Multi-Line SQL Statement Pitfall**:
   - *Problem*: Naive `for line in file` string replacement breaks when an `INSERT INTO ... VALUES` clause spans across 5,000 lines, or within multi-line stored procedures.
   - *Mitigation*: The streaming worker must implement a lightweight semicolon-delimited (`(;)`) state machine chunk reader rather than blind single-line regex.
3. **Concurrency Collisions & Missing Undo**:
   - *Problem*: Successive user prompts editing the same S3 file can overwrite in-flight streams.
   - *Mitigation*: Enforce **Immutability and Version Chains** (`dump_v1.sql` -> `dump_v2.sql` -> `dump_v3.sql`), allowing atomic commits and instant rollbacks.
4. **S3 Presigned URL Security Exfiltration**:
   - *Problem*: Unrestricted presigned upload URLs allow malicious actors to upload 500GB files, triggering unexpected cloud costs.
   - *Mitigation*: Enforce strict `content-length-range` policies on S3 presigned signatures, hard-capping uploads at 500MB.

---

### Summary

Building MCP servers demystifies how AI agents actually interact with the external world. Whether communicating through local child process pipes (`stdio`) or scalable web services (`streamable-http`), MCP standardizes the glue between reasoning engines and deterministic code. 

The complete reference codebase for the calculator example is available at [calculator-mcp](https://github.com/yuntaozhang999/calculator-mcp). Up next: implementing the full Web UI + S3 + Streamable HTTP SQL agentic system!
