from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = "Cold Outreach Pro"

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(UserBase):
    id: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

class ProspectInput(BaseModel):
    # Sender / From Details
    sender_name: Optional[str] = Field(default="", description="Your name (e.g. Mohammed Salman, Alex Rivera)")
    sender_role: Optional[str] = Field(default="", description="Your role or title (e.g. AIML Student, SDR, Founder)")
    sender_company: Optional[str] = Field(default="", description="Your institution or company (e.g. Crescent Institute, Acme Corp)")
    
    # Recipient / To Details
    recipient_name: Optional[str] = Field(default="", description="Recipient / Prospect / Professor / Lead name")
    recipient_role: Optional[str] = Field(default="", description="Recipient title or role (e.g. HOD, VP Engineering)")
    recipient_company: Optional[str] = Field(default="", description="Recipient organization or institution")
    
    # Backward compatibility aliases
    prospect_name: Optional[str] = ""
    prospect_company: Optional[str] = ""
    prospect_role: Optional[str] = ""

    # Context, Goal & Tone
    profile_text: str = Field(..., description="Recipient background, job description, LinkedIn bio, or notes")
    tone: str = Field(default="Casual & Direct", description="Casual & Direct, Value-First Exec, Formal & Respectful, etc.")
    goal: str = Field(default="Book a 15-min discovery call", description="Call, leave letter, interview, partnership, etc.")
    value_proposition: Optional[str] = ""
    custom_instructions: Optional[str] = ""
    variation_count: Optional[int] = Field(default=1, description="Variation sequence index for unique angles")
    enable_web_research: bool = True
    enable_rag: bool = True

class CriticEvaluation(BaseModel):
    anti_ai_score: int = Field(..., description="0 to 100 score indicating how human-like the email is")
    ai_cliches_detected: List[str] = []
    spam_triggers_detected: List[str] = []
    reading_grade_level: str = "6th - 8th grade (optimal conversational)"
    strengths: List[str] = []
    improvements_made: List[str] = []

class SingleEmailResult(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = "guest"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sender_name: str = ""
    sender_role: str = ""
    sender_company: str = ""
    recipient_name: str = ""
    recipient_company: str = ""
    recipient_role: str = ""
    prospect_name: str = ""
    prospect_company: str = ""
    prospect_role: str = ""
    subject_lines: List[str] = []
    selected_subject: str = ""
    email_body: str = ""
    followup_1: str = ""
    followup_2: str = ""
    anti_ai_score: int = 94
    critic_evaluation: Optional[CriticEvaluation] = None
    research_summary: Optional[str] = None
    rag_context_used: Optional[List[str]] = None
    tone: str = ""
    goal: str = ""

class BatchProspectRow(BaseModel):
    row_index: int
    name: str
    company: Optional[str] = ""
    role: Optional[str] = ""
    profile: str
    custom_notes: Optional[str] = ""
    status: str = "pending" # pending, processing, completed, failed
    generated_subject: Optional[str] = None
    generated_email: Optional[str] = None
    generated_followup_1: Optional[str] = None
    generated_followup_2: Optional[str] = None
    anti_ai_score: Optional[int] = None
    error_message: Optional[str] = None

class BatchJob(BaseModel):
    id: str
    user_id: str = "guest"
    filename: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_rows: int
    completed_rows: int = 0
    failed_rows: int = 0
    status: str = "processing" # processing, completed, failed
    tone: str = "Casual & Direct"
    goal: str = "Book a 15-min discovery call"
    value_proposition: str = ""
    rows: List[BatchProspectRow] = []

class KnowledgeDoc(BaseModel):
    id: str
    user_id: str = "default"
    title: str
    category: str # "company_offer", "case_study", "winning_template", "value_prop"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = []
