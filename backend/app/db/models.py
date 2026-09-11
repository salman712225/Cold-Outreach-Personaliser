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
    profile_text: str = Field(..., description="LinkedIn bio, prospect bio, job description, or company notes")
    prospect_name: Optional[str] = ""
    prospect_company: Optional[str] = ""
    prospect_role: Optional[str] = ""
    tone: str = Field(default="Casual & Direct", description="Casual & Direct, Value-First Exec, Founder-to-Founder, Curious Problem-Solver, Ultra-Concise")
    goal: str = Field(default="Book a 15-min discovery call", description="Call, partnership, demo, feedback, etc.")
    value_proposition: Optional[str] = ""
    custom_instructions: Optional[str] = ""
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
