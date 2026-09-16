# 🔄 ColdReach.ai — Workflow Documentation

> **Complete operational workflows, data lifecycles, state machine diagrams, and step-by-step generation sequences for ColdReach.ai.**

---

## 📑 Table of Contents
1. [End-to-End System Workflow](#1-end-to-end-system-workflow)
2. [Single Outreach Execution Lifecycle](#2-single-outreach-execution-lifecycle)
3. [Batch CSV Processing Workflow](#3-batch-csv-processing-workflow)
4. [4-Angle Deterministic Variation State Machine](#4-4-angle-deterministic-variation-state-machine)
5. [Anti-AI Deliverability Critic & Refinement Loop](#5-anti-ai-deliverability-critic--refinement-loop)
6. [RAG Knowledge Base & Proof Point Ingestion](#6-rag-knowledge-base--proof-point-ingestion)
7. [LangSmith Telemetry & Evaluation Flow](#7-langsmith-telemetry--evaluation-flow)
8. [Error Handling & Fallback State Machine](#8-error-handling--fallback-state-machine)

---

## 1. End-to-End System Workflow

```mermaid
flowchart TD
    Start([User Initiates Request]) --> ModeSelect{Choose Mode}

    %% Single Mode
    ModeSelect -->|Single Profile / Context| SingleFlow[Single Outreach Mode]
    SingleFlow --> InputForm[Enter Sender & Recipient Details\nSelect Tone, Goal & Value Prop]
    InputForm --> GenerateBtn[Click 'Generate Email']
    
    %% Batch Mode
    ModeSelect -->|Batch CSV Upload| BatchFlow[Batch CSV Studio Mode]
    BatchFlow --> UploadCSV[Upload CSV with Prospect Rows]
    UploadCSV --> ProcessJob[Trigger Async Background Batch Processor]
    
    %% Backend Processing
    GenerateBtn & ProcessJob --> SupervisorNode[LangGraph Supervisor Router]
    
    subgraph Multi-Agent Processing Pipeline
        SupervisorNode --> ToolsCheck{Tools Enabled?}
        ToolsCheck -->|Web Search ON| WebEnrich[DuckDuckGo Scraper Node]
        ToolsCheck -->|RAG Knowledge ON| RAGSearch[RAG Vector Retriever Node]
        ToolsCheck -->|Direct| Copywriter[Mistral Copywriter Node]
        
        WebEnrich --> Copywriter
        RAGSearch --> Copywriter
        
        Copywriter --> VariationSeed[Apply 4-Angle Rotation Seed]
        VariationSeed --> Critic[Anti-AI Deliverability Critic Node]
        
        Critic --> ScoreCheck{Score >= 80%?}
        ScoreCheck -->|Yes| Followups[Generate Day 3 & Day 7 Follow-ups]
        ScoreCheck -->|No / Clichés Found| AutoRefine[Auto-Refine Draft Token Strip]
        AutoRefine --> Followups
    end

    Followups --> DBStore[(MongoDB Atlas Persistence)]
    DBStore --> DisplaySingle[Render Interactive UI Cards\nA/B/C Subjects, Body, Score, Follow-ups]
    DBStore --> StreamBatch[Update Live Batch Row Table & CSV Download]
```

---

## 2. Single Outreach Execution Lifecycle

### Step 1: Input Ingestion & Form Validation
The user specifies two distinct sets of parameters:
1. **FROM (Sender / Your Details)**: Name (e.g., `Mohammed Salman`), Role (`B.Tech CSE Student`), Organization (`Crescent Institute`).
2. **TO (Recipient / Prospect Details)**: Name (e.g., `Dr. Sharma`), Role (`HOD & Professor`), Organization (`Crescent Institute`).
3. **Context Parameters**:
   - **Tone**: Formal Academic, Casual Peer, Value-First Exec, Friendly Colleague.
   - **Goal**: Leave Application, Job Application, Partnership, Advisory Request.
   - **Value Proposition / Core Reason**: Specific medical leave reason, quantified project metric, or business proposition.

### Step 2: Supervisor & Entity Routing
The backend validates request payloads against Pydantic V2 models and dispatches the data to the LangGraph supervisor.

### Step 3: Anti-AI Copywriting & Negative Constraints
Mistral AI (`mistral-small-latest`) generates the draft under strict negative constraints:
- 🚫 Zero robot openers (*"I hope this email finds you well"*).
- 🚫 Zero buzzwords (*"delve"*, *"supercharge"*, *"unleash"*, *"cutting-edge"*).
- 🚫 Maximum 120–140 words for business outreach; formal structured paragraphs for academic applications.

### Step 4: Output Assembly
The engine returns:
- **3 Dynamic Subject Lines (A / B / C)** (e.g., Option A: Formal, Option B: Short Hook, Option C: Direct Action).
- **Primary Body Content** with verified recipient greeting and sender sign-off.
- **Day 3 & Day 7 Follow-up Messages**.
- **Live Anti-AI Deliverability Human Score (0–100%)**.

---

## 3. Batch CSV Processing Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Sales Rep
    participant UI as Vite React Client
    participant API as FastAPI /api/batch
    participant Engine as Copywriter & Critic Engine
    participant DB as MongoDB Atlas

    User->>UI: Uploads prospects.csv (e.g. 50 rows)
    UI->>API: POST /api/batch/upload (multipart/form-data)
    API->>DB: Initializes Batch Job (status: 'processing')
    API-->>UI: Returns jobId + totalRows
    
    loop For each prospect row in CSV
        API->>Engine: Generate Outreach for row
        Engine-->>API: Returns Generated_Subject, Email, Followups, Score
        API->>DB: Updates job progress (processedRows += 1)
        UI->>API: GET /api/batch/status/{jobId} (Live Polling)
        API-->>UI: Returns updated row list + progress %
    end

    API->>DB: Marks job status: 'completed'
    User->>UI: Clicks 'Download Enriched CSV'
    UI->>API: GET /api/batch/download/{jobId}
    API-->>User: Delivers enriched CSV with all original columns + AI columns
```

---

## 4. 4-Angle Deterministic Variation State Machine

Clicking **"Generate New Variation (#2, #3, #4)"** cycles deterministically through four distinct structural angles to ensure genuine variety:

```mermaid
stateDiagram-v2
    [*] --> Variation_1: Initial Click (Seed = 1)
    
    Variation_1 --> Variation_2: Click 'New Variation (#2)'
    note right of Variation_1: Angle 1: Direct Core Action\nClear, immediate upfront request or claim.
    
    Variation_2 --> Variation_3: Click 'New Variation (#3)'
    note right of Variation_2: Angle 2: Evidence & Proof Point Focus\nLead with quantified metrics or medical facts.
    
    Variation_3 --> Variation_4: Click 'New Variation (#4)'
    note right of Variation_3: Angle 3: Peer & Collaborative Angle\nFocus on smooth handover, notes, or team sync.
    
    Variation_4 --> Variation_1: Click 'New Variation (#5)'
    note right of Variation_4: Angle 4: Time-Bound & Concise Summary\nUltra-brief, 3-sentence high-efficiency draft.
```

### Mathematical Seed Rotation Formula:
```python
variant_seed = ((variation_count - 1) % 4) + 1
```

---

## 5. Anti-AI Deliverability Critic & Refinement Loop

```mermaid
flowchart TD
    RawDraft[Raw Copywriter Draft] --> TokenScanner[Token Scanner Node]
    
    TokenScanner --> ClichéCheck{Banned Clichés Found?}
    ClichéCheck -->|Yes| ClichéPenalty[Deduct 12% per cliché & Strip Token]
    ClichéCheck -->|No| NoCliché[0% Penalty]
    
    TokenScanner --> LengthCheck{Word Count > 150?}
    LengthCheck -->|Yes| LengthPenalty[Deduct 10% & Flag Bloat]
    LengthCheck -->|No| NoLength[0% Penalty]
    
    TokenScanner --> ReadabilityCheck{Flesch-Kincaid Grade 6-8?}
    ReadabilityCheck -->|Yes| BonusScore[+10% Conversational Bonus]
    ReadabilityCheck -->|No| NoBonus[0% Bonus]

    ClichéPenalty & NoCliché & LengthPenalty & NoLength & BonusScore & NoBonus --> FinalScore[Compute Final Anti-AI Human Score]
    
    FinalScore --> Threshold{Score >= 80%?}
    Threshold -->|Pass| OutputApproved[Approve Output for User Delivery]
    Threshold -->|Fail| AutoClean[Auto-Rewrite Flagged Sentences]
    AutoClean --> OutputApproved
```

---

## 6. RAG Knowledge Base & Proof Point Ingestion

```mermaid
graph LR
    DocInput[Upload Case Study / Company Deck] --> Chunking[Semantic Text Splitter]
    Chunking --> Embedding[Vector Representation]
    Embedding --> MongoVector[(MongoDB Atlas Vector Store)]
    
    Query[Prospect Profile Query] --> SimilaritySearch[Cosine Similarity Retriever]
    MongoVector --> SimilaritySearch
    SimilaritySearch --> InjectedContext[Top 2 Relevant Proof Points]
    InjectedContext --> CopywriterNode[Mistral AI Copywriter]
```

---

## 7. LangSmith Telemetry & Evaluation Flow

```mermaid
sequenceDiagram
    autonumber
    participant UI as Frontend Settings Modal
    participant API as FastAPI Backend
    participant LS as LangSmith Tracing V2 API

    User->>UI: Toggles 'LangSmith Tracing' ON & Enters API Key
    UI->>API: Stores settings in session
    
    User->>API: Triggers Outreach Generation
    API->>LS: Opens Trace Run (Project: cold-outreach-personaliser)
    API->>LS: Logs Supervisor Node Latency & Inputs
    API->>LS: Logs Mistral AI Token Usage & Cost
    API->>LS: Logs Anti-AI Critic Score & Output
    API->>LS: Closes Trace Run (Status: Success)
    
    User->>UI: Clicks 'Run Evaluation Suite'
    UI->>API: POST /api/evaluation/run-suite
    API->>LS: Evaluates 5 Benchmark Test Cases
    API-->>UI: Displays Average Human Score (94%) and Benchmark Metrics
```

---

## 8. Error Handling & Fallback State Machine

```mermaid
stateDiagram-v2
    [*] --> MistralAPICall
    
    MistralAPICall --> SuccessResponse: HTTP 200 (LLM Output Generated)
    MistralAPICall --> NetworkTimeout: Connection Error / Timeout
    MistralAPICall --> QuotaExceeded: 429 Rate Limit / Invalid Key
    
    NetworkTimeout --> DynamicFallbackEngine: Trigger Fallback
    QuotaExceeded --> DynamicFallbackEngine: Trigger Fallback
    
    DynamicFallbackEngine --> EntityDisambiguatedOutput: Generate Pure-Python Deterministic Draft
    EntityDisambiguatedOutput --> SuccessResponse
    
    SuccessResponse --> [*]: Return JSON Payload to Client (Zero Crash Guarantee)
```
