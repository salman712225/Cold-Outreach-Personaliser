from typing import TypedDict, List, Dict, Any, Optional

class OutreachState(TypedDict):
    # Sender / From Details
    sender_name: str
    sender_role: str
    sender_company: str

    # Recipient / To Details
    recipient_name: str
    recipient_company: str
    recipient_role: str
    prospect_name: str
    prospect_company: str
    prospect_role: str

    # Context, Goal & Settings
    profile_text: str
    tone: str
    goal: str
    value_proposition: str
    custom_instructions: str
    variation_count: int
    enable_web_research: bool
    enable_rag: bool

    # Agent Findings
    research_summary: str
    rag_context: List[str]
    prospect_insights: Dict[str, Any]

    # Generation
    subject_lines: List[str]
    selected_subject: str
    email_body: str
    followup_1: str
    followup_2: str

    # Evaluation
    anti_ai_score: int
    critic_notes: Dict[str, Any]
    iteration_count: int
    is_approved: bool
    error: Optional[str]
