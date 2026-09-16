# 🏗️ ColdReach.ai — Architecture Documentation

> **Comprehensive architectural specification of the Cold Outreach Personaliser system, covering multi-agent orchestration, entity disambiguation, unified serving, data models, and cloud persistence.**

---

## 📑 Table of Contents
1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Component Breakdown](#2-component-breakdown)
3. [Unified Zero-Delay Serving Architecture](#3-unified-zero-delay-serving-architecture)
4. [Multi-Agent LangGraph Node System](#4-multi-agent-langgraph-node-system)
5. [Entity Disambiguation Architecture (From vs. To)](#5-entity-disambiguation-architecture-from-vs-to)
6. [Anti-AI Deliverability Scoring Engine](#6-anti-ai-deliverability-scoring-engine)
7. [Database Schema & Persistence (MongoDB Atlas)](#7-database-schema--persistence-mongodb-atlas)
8. [Security & Authentication Model](#8-security--authentication-model)
9. [Deployment Architecture](#9-deployment-architecture)

---

## 1. High-Level System Architecture

ColdReach.ai employs an asynchronous, unified full-stack architecture combining a reactive single-page application (SPA) with a multi-agent Python backend powered by **FastAPI**, **Mistral AI**, **LangGraph**, and **MongoDB Atlas**.

```mermaid
graph TD
    Client([User Browser / Web Client]) -->|HTTP / REST API| Server["Unified FastAPI Web Server"]

    subgraph Presentation & Client Layer
        Server -->|Serves Static Dist / SPA| ViteReact["Vite + React 18 UI<br/>Glassmorphic Dark Theme"]
        ViteReact -->|State & API Dispatch| ClientStore["Client Service Layer<br/>api.js"]
    end

    subgraph API & Routing Layer
        Server --> AuthRouter["/api/auth<br/>JWT Register/Login"]
        Server --> OutreachRouter["/api/outreach<br/>Single Generation"]
        Server --> BatchRouter["/api/batch<br/>CSV Processing"]
        Server --> RAGRouter["/api/rag<br/>Knowledge Base"]
        Server --> EvalRouter["/api/evaluation<br/>LangSmith Metrics"]
        Server --> HistoryRouter["/api/history<br/>Persisted Logs"]
    end

    subgraph Multi-Agent LangGraph Core
        OutreachRouter & BatchRouter --> Supervisor["Supervisor Router Node"]
        Supervisor --> WebEnricher["DuckDuckGo Web Enrichment Tool"]
        Supervisor --> RAGEngine["RAG Vector Knowledge Base"]
        Supervisor --> Copywriter["Anti-AI Copywriter Node<br/>Mistral mistral-small-latest"]
        
        Copywriter --> VariationEngine["Deterministic 4-Angle Variation Engine"]
        VariationEngine --> CriticNode["Anti-AI Deliverability Critic"]
        CriticNode --> FollowupSequencer["Day 3 & Day 7 Bump Generator"]
    end

    subgraph Data & Observability Layer
        Server --> MongoDB[("MongoDB Atlas Cloud<br/>Users, Outreaches, Batches, Docs")]
        Copywriter -.->|Optional Telemetry| LangSmith["LangSmith Tracing V2 API"]
    end
```

---

## 2. Component Breakdown

| Layer | Technology | Primary Responsibilities |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Lucide Icons | Responsive glassmorphic interface, From/To dual card inputs, clickable subject line selection, live human score meters, CSV drag-and-drop table preview. |
| **API Server** | FastAPI (Python 3.10+), Uvicorn, Pydantic V2 | Async route handling, request validation, static SPA mounting, background task worker management, JWT auth. |
| **LLM Reasoning** | Mistral AI (`mistral-small-latest`) | High-speed, nuanced natural language generation with strict anti-sycophancy negative constraints. |
| **Agent Graph** | LangGraph & Multi-Agent State Graph | State propagation across Supervisor, Web Enrichment, Copywriter, and Critic nodes. |
| **Data Layer** | MongoDB Atlas, Motor (Async Driver) | Persistent storage for users, generation history, batch job states, and RAG company knowledge docs. |
| **Telemetry** | LangSmith (Optional) | End-to-end trace collection, latency profiling, token metrics, and evaluation scoring. |

---

## 3. Unified Zero-Delay Serving Architecture

In conventional multi-tier architectures, the frontend is hosted on a static CDN while the backend runs as a separate web service that spins down during periods of inactivity (incurring 50–90 second cold-start delays).

ColdReach.ai eliminates this cold-start penalty using a **Unified Static Serving Architecture**:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant FastAPI as FastAPI Server (:8000 / $PORT)
    participant Dist as Static Dist (/frontend/dist)
    participant Agent as LangGraph Agent Engine

    User->>FastAPI: GET / (Loads Web Application)
    FastAPI->>Dist: Reads index.html & static assets
    FastAPI-->>User: 200 OK (HTML/CSS/JS delivered)
    Note over FastAPI,User: Backend is ALREADY ACTIVE and warm in memory!
    
    User->>FastAPI: POST /api/outreach/generate
    FastAPI->>Agent: Invokes Copywriter & Critic Nodes
    Agent-->>FastAPI: Returns Generated Outreach + Anti-AI Score
    FastAPI-->>User: 200 OK (Instant response with 0s backend spin-up delay)
```

### Key Technical Advantages:
1. **Zero Cold-Start Lag**: Visiting the website triggers the backend container immediately.
2. **Zero CORS Overhead**: Frontend and API share the exact same origin (`window.location.origin`).
3. **Single Container Footprint**: Deploys as 1 unified web service on Render, Docker, or AWS.

---

## 4. Multi-Agent LangGraph Node System

The core generation pipeline operates as a directed acyclic graph (DAG) managed via `OutreachState`:

```mermaid
stateDiagram-v2
    [*] --> SupervisorNode: Raw Input State
    
    SupervisorNode --> WebEnrichmentNode: If Web Search Enabled
    SupervisorNode --> RAGKnowledgeNode: If Knowledge Base Active
    SupervisorNode --> CopywriterNode: Direct Path
    
    WebEnrichmentNode --> CopywriterNode: Ingest Live Signals
    RAGKnowledgeNode --> CopywriterNode: Ingest Case Studies & Proof Points
    
    CopywriterNode --> DeterministicVariationNode: Apply Rotation Seed ((seed-1)%4)+1
    DeterministicVariationNode --> CriticNode: Scan Draft for Clichés
    
    CriticNode --> FollowupNode: Anti-AI Score >= 80%
    CriticNode --> CopywriterNode: Clichés Detected (Auto-Refine)
    
    FollowupNode --> [*]: Return JSON (Subject, Body, Followups, Score)
```

### State Schema (`OutreachState`)
```python
class OutreachState(TypedDict):
    # Sender (From) Entity
    sender_name: str
    sender_role: str
    sender_company: str
    
    # Recipient (To) Entity
    recipient_name: str
    recipient_role: str
    recipient_company: str
    
    # Context & Configuration
    profile_text: str
    tone: str
    goal: str
    value_proposition: str
    variation_count: int
    
    # Intermediate Artifacts
    enriched_signals: list[str]
    retrieved_case_studies: list[str]
    
    # Final Outputs
    subject_options: list[str]
    selected_subject: str
    email_body: str
    followup_1: str
    followup_2: str
    anti_ai_score: float
    detected_cliches: list[str]
```

---

## 5. Entity Disambiguation Architecture (From vs. To)

To eliminate common LLM naming hallucinations (e.g., calling the recipient by the user's name), ColdReach.ai enforces explicit separation throughout the data lifecycle:

```
[ USER INPUT FORM ]
  ├── 1. FROM (Sender):
  │      ├── Name    : "Mohammed Salman"
  │      ├── Role    : "B.Tech CSE Student"
  │      └── College : "Crescent Institute"
  │
  └── 2. TO (Recipient):
         ├── Name    : "Dr. Sharma"
         ├── Role    : "HOD & Professor"
         └── Company : "Crescent Institute"
              │
              ▼
[ ENTITY DISAMBIGUATION MAPPER ]
  ├── Greeting / Salutation  ➔ Strictly maps to Recipient ("Respected Dr. Sharma,")
  ├── Hook / Context Context ➔ Contextualized around Recipient's domain
  ├── Proof Point / Value    ➔ Self-introduction of Sender's credentials
  └── Sign-Off & Signature   ➔ Strictly maps to Sender ("Sincerely, Mohammed Salman \n B.Tech CSE Student")
```

---

## 6. Anti-AI Deliverability Scoring Engine

The Critic node computes a composite score (0–100%) based on 3 primary vectors:

$$ \text{Anti-AI Score} = 100 - (\text{Cliché Penalty}) - (\text{Length Penalty}) + (\text{Conversational Bonus}) $$

### Scoring Penalties:
- **Cliché Penalty**: $-12\%$ per detected token (e.g., *"delve"*, *"supercharge"*, *"testament"*, *"in today's fast-paced world"*).
- **Robotic Opener Penalty**: $-20\%$ if starting with *"I hope this email finds you well"*.
- **Length Penalty**: $-10\%$ if word count exceeds 160 words (penalizing bloated text).
- **Conversational Readability Bonus**: $+10\%$ for 6th–8th grade Flesch-Kincaid reading levels.

---

## 7. Database Schema & Persistence (MongoDB Atlas)

```mermaid
erDiagram
    USERS ||--o{ OUTREACH_HISTORY : creates
    USERS ||--o{ BATCH_JOBS : runs
    USERS ||--o{ KNOWLEDGE_DOCS : manages

    USERS {
        string id PK
        string email UK
        string hashed_password
        string full_name
        datetime created_at
    }

    OUTREACH_HISTORY {
        string id PK
        string user_id FK
        string sender_name
        string recipient_name
        string subject
        string email_body
        string followup_1
        string followup_2
        float anti_ai_score
        int variation_index
        datetime created_at
    }

    BATCH_JOBS {
        string id PK
        string user_id FK
        string filename
        int total_rows
        int processed_rows
        string status
        json enriched_rows
        datetime created_at
    }

    KNOWLEDGE_DOCS {
        string id PK
        string user_id FK
        string title
        string content
        string category
        datetime updated_at
    }
```

---

## 8. Security & Authentication Model

- **JWT Bearer Token Authentication**: HS256 algorithm with 24-hour expiration tokens stored in `localStorage`.
- **Password Security**: Passlib with bcrypt hashing.
- **Guest Fallback**: Single generation and batch jobs remain accessible in guest mode with graceful in-memory storage.
- **Data Isolation**: Multi-tenant database queries filter documents strictly by `user_id`.

---

## 9. Deployment Architecture

```mermaid
graph LR
    GitHub[GitHub Repository\nsalman712225/Cold-Outreach-Personaliser] -->|Git Push Hook| RenderCloud[Render Cloud Platform]
    
    subgraph Render Unified Web Service
        RenderCloud --> BuildStep[Build: npm run build & pip install]
        BuildStep --> RunStep[Start: uvicorn main:app --port $PORT]
    end

    RunStep --> MistralCloud[Mistral AI API]
    RunStep --> AtlasCloud[MongoDB Atlas Cluster]
    RunStep --> LangSmithCloud[LangSmith Telemetry]
```
