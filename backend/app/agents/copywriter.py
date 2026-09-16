import os
import json
import logging
import random
import time
import httpx
from typing import Dict, Any, List, Tuple
from app.config import settings
from app.agents.tools import scan_for_ai_cliches

logger = logging.getLogger("cold_outreach.copywriter")

SYSTEM_ANTI_AI_PROMPT = """You are an elite, top-1% universal email strategist and human copywriter.
Your superpower is crafting high-converting, natural, authentic emails tailored to ANY context — including job applications, student leave letters, academic requests, business collaboration, B2B sales outreach, and professional networking.

CRITICAL ENTITY SEPARATION (DO NOT CONFUSE):
- **SENDER (From Details)**: The person sending the email (sender_name, sender_role, sender_company). The email must be SIGNED by the sender. If self-introducing, state the sender's background.
- **RECIPIENT (To Details)**: The person receiving the email (recipient_name, recipient_role, recipient_company). The email greeting MUST address the recipient. NEVER address the sender or use the recipient's name in the sign-off!

CORE ANTI-AI & HUMAN WRITING RULES:
1. BAN ALL AI CLICHÉS & ROBOTIC FLUFF:
   - NEVER start with "I hope this email finds you well", "Hope you're having a great week", or "I came across your profile".
   - NEVER use AI buzzwords: "delve", "supercharge", "unleash", "cutting-edge", "game-changer", "synergy", "seamlessly", "testament", "spearhead", "beacon".
2. TONE & INTENT ADAPTATION:
   - If the intent is an Academic / Student Leave Letter or Permission Request: Write a clear, respectful, well-structured formal application addressed to the professor/manager and signed by the student.
   - If the intent is a Job Application / Candidate Note: Highlight practical skills, relevant project achievements, and an interview request without arrogance.
   - If the intent is Business / Outreach: Keep it punchy, conversational (60-110 words), value-first with a low-friction CTA.
3. SUBJECT LINES:
   - Provide 3 distinct, professional subject lines directly tailored to the situation (e.g., "Leave Application: [Sender Name] - [Reason/Dates]", "Application for [Role] - [Sender Name]", "Question regarding [Topic] at [Recipient Company]").
4. SIGN-OFF:
   - Always sign off with the SENDER's name and role/company.

Output STRICT valid JSON with these exact keys:
{
  "subject_lines": ["Subject option A", "Subject option B", "Subject option C"],
  "selected_subject": "Subject option A",
  "email_body": "Dear / Respected / Hey [Recipient Name],\\n\\n[Body text]\\n\\n[Signoff],\\n[Sender Name]",
  "followup_1": "Dear / Respected / Hey [Recipient Name],\\n\\n[Follow-up text]\\n\\n[Signoff],\\n[Sender Name]",
  "followup_2": "Dear / Respected / Hey [Recipient Name],\\n\\n[Closing note]\\n\\n[Signoff],\\n[Sender Name]"
}
"""

def generate_cold_outreach_claude(
    prospect_name: str,
    prospect_company: str,
    prospect_role: str,
    profile_text: str,
    tone: str,
    goal: str,
    value_proposition: str,
    research_summary: str,
    rag_context: List[str],
    custom_instructions: str = "",
    sender_name: str = "",
    sender_role: str = "",
    sender_company: str = "",
    recipient_name: str = "",
    recipient_company: str = "",
    recipient_role: str = "",
    variation_count: int = 1
) -> Dict[str, Any]:
    """Invokes Mistral AI to craft hyper-personalized cold outreach with varied professional hooks."""
    
    # Resolve aliases
    to_name = recipient_name or prospect_name or "there"
    to_company = recipient_company or prospect_company or "your organization"
    to_role = recipient_role or prospect_role or "Team Lead"
    
    from_name = sender_name or "Alex"
    from_role = sender_role or ""
    from_company = sender_company or ""

    v_seed = int(variation_count or 1)
    variation_entropy = (int(time.time() * 1000) + v_seed * 37) % 10000

    user_prompt = f"""Generate a fresh, personalized email and follow-up sequence.

VARIATION DIRECTIVE (VARIATION #{v_seed}):
- You MUST produce a completely distinct variation angle #{v_seed}.
- Provide 3 brand-new creative subject lines, a fresh opening hook, and an alternative conversational structure.

SENDER (FROM DETAILS):
- Sender Name: {from_name}
- Sender Role: {from_role or 'Specialist'}
- Sender Organization / College: {from_company or 'Independent'}

RECIPIENT (TO DETAILS):
- Recipient Name: {to_name}
- Recipient Organization / College: {to_company}
- Recipient Role: {to_role}
- Recipient Profile / Context:
\"\"\"{profile_text}\"\"\"

EMAIL PARAMETERS:
- Requested Tone: {tone}
- Outreach / Email Goal: {goal}
- Value Proposition / Specific Details: {value_proposition or 'Automating pipeline workflows and improving conversion rates'}
- Variation Seed / Context ID: {variation_entropy}

RESEARCH INSIGHTS:
{research_summary or 'Focus on direct organizational priorities and context.'}

RELEVANT KNOWLEDGE & PROOFS:
{chr(10).join(rag_context) if rag_context else 'Enterprise SaaS playbooks and quantified efficiency gains.'}

SPECIFIC INSTRUCTIONS:
{custom_instructions if custom_instructions else f'Variation #{v_seed}: Ensure distinct, professional subject lines, greet {to_name}, and sign off cleanly as {from_name}.'}

Remember: Return ONLY valid JSON with subject_lines, selected_subject, email_body, followup_1, and followup_2.
"""

    # 1. Mistral API Execution if key is configured
    mistral_key = settings.MISTRAL_API_KEY
    if mistral_key and not mistral_key.startswith("your_"):
        try:
            headers = {
                "Authorization": f"Bearer {mistral_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": settings.MISTRAL_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_ANTI_AI_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.85 + min(0.1, (v_seed * 0.02)),
                "response_format": {"type": "json_object"}
            }
            with httpx.Client(timeout=45.0) as client:
                res = client.post("https://api.mistral.ai/v1/chat/completions", headers=headers, json=payload)
                res.raise_for_status()
                res_data = res.json()
                raw_text = res_data["choices"][0]["message"]["content"].strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                data = json.loads(raw_text.strip())
                if data.get("subject_lines") and not data.get("selected_subject"):
                    data["selected_subject"] = data["subject_lines"][0]
                return data
        except Exception as e:
            logger.error(f"Mistral API call error: {e}. Falling back to dynamic anti-AI generator.")

    # 2. Rich Multi-Variant Dynamic Generator
    return generate_dynamic_fallback(
        prospect_name=to_name,
        prospect_company=to_company,
        prospect_role=to_role,
        profile_text=profile_text,
        tone=tone,
        goal=goal,
        value_proposition=value_proposition,
        custom_instructions=custom_instructions,
        sender_name=from_name,
        sender_role=from_role,
        sender_company=from_company,
        recipient_name=to_name,
        recipient_company=to_company,
        recipient_role=to_role,
        variation_count=v_seed
    )

def extract_smart_name(raw_name: str) -> str:
    """Extracts a natural first name, honorific + last name, or clean team title."""
    if not raw_name or raw_name.strip().lower() in ["there", "prospect", ""]:
        return "there"
    cleaned = raw_name.strip()
    if cleaned.lower() in ["hiring manager", "hiring team", "recruiting team", "hr team", "engineering lead", "admissions team"]:
        return cleaned.title()
    tokens = cleaned.split()
    honorifics = ["dr.", "dr", "prof.", "prof", "mr.", "mr", "ms.", "ms", "mrs.", "mrs", "dean"]
    if len(tokens) > 1 and tokens[0].lower().rstrip('.') in ["dr", "prof", "mr", "ms", "mrs", "dean"]:
        return f"{tokens[0]} {tokens[1]}"
    return tokens[0]

def generate_dynamic_fallback(
    prospect_name: str,
    prospect_company: str,
    prospect_role: str,
    profile_text: str,
    tone: str,
    goal: str,
    value_proposition: str,
    custom_instructions: str = "",
    sender_name: str = "",
    sender_role: str = "",
    sender_company: str = "",
    recipient_name: str = "",
    recipient_company: str = "",
    recipient_role: str = "",
    variation_count: int = 1
) -> Dict[str, Any]:
    """Generates varied, professional, tone-aware emails dynamically without confusing Sender and Recipient."""
    
    to_name = extract_smart_name(recipient_name or prospect_name)
    to_company = (recipient_company or prospect_company or "your team").strip()
    to_role = (recipient_role or prospect_role or "").strip()
    
    from_name = (sender_name or "").strip() or "Alex"
    from_role = (sender_role or "").strip()
    from_company = (sender_company or "").strip()
    
    sender_signature = from_name
    if from_role and from_company:
        sender_signature = f"{from_name}\n{from_role}, {from_company}"
    elif from_role:
        sender_signature = f"{from_name}\n{from_role}"
    elif from_company:
        sender_signature = f"{from_name}\n{from_company}"
    
    # Check specific intent types
    p_lower = profile_text.lower()
    g_lower = goal.lower()
    t_lower = tone.lower()
    
    is_leave_letter = any(k in g_lower or k in p_lower for k in ["leave", "permission", "sick", "absence", "time off", "vacation"])
    is_recommendation = any(k in g_lower or k in p_lower for k in ["recommendation", "reference letter", "lor"])
    is_job_seeker = any(k in p_lower or k in g_lower for k in ["interview", "applying", "candidate", "internship", "hiring", "job", "applicant", "resume", "cv"]) or any(k in from_role.lower() for k in ["student", "intern", "candidate", "graduate", "fresher"])
    
    # Determine topic
    topic = "growth initiatives"
    if "aiml" in p_lower or "ai/ml" in p_lower or "machine learning" in p_lower:
        topic = "AIML development"
    elif "data" in p_lower or "cache" in p_lower or "cloud" in p_lower or "infrastructure" in p_lower:
        topic = "infrastructure efficiency"
    elif "sales" in p_lower or "sdr" in p_lower or "pipeline" in p_lower or "outbound" in p_lower:
        topic = "outbound pipeline generation"
    elif "product" in p_lower or "api" in p_lower or "developer" in p_lower:
        topic = "product integration and scaling"
    elif "security" in p_lower or "compliance" in p_lower or "fraud" in p_lower:
        topic = "compliance & security automation"
    elif "ai" in p_lower or "llm" in p_lower or "model" in p_lower:
        topic = "AI workflow automation"

    # Naturalize offer / details
    raw_offer = value_proposition.strip() if value_proposition else ""
    clean_offer = (raw_offer[0].lower() + raw_offer[1:]) if raw_offer else "cut cloud vector database compute costs by 52%"

    # Naturalize role phrasing
    role_mention = to_role if to_role and not is_job_seeker else "engineering leaders"
    if any(k in to_role.lower() for k in ["student", "intern", "graduate"]):
        peer_group = "builders in the field"
    else:
        peer_group = f"{to_role}s" if to_role else "teams"

    # Dynamic CTA based on Goal
    if "partnership" in g_lower or "collaboration" in g_lower:
        cta_question = "Open to exploring potential collaboration on this?"
    elif "demo" in g_lower:
        cta_question = "Mind if I share a quick 2-minute interactive demo?"
    elif "feedback" in g_lower:
        cta_question = "Would love to get your candid thoughts if you have 2 minutes to take a peek?"
    elif is_job_seeker:
        cta_question = "Would you be open to a brief 5-minute conversation regarding the opportunity?"
    else:
        cta_question = "Open to a brief 5-minute chat to compare benchmarks with similar teams?"

    # Extract seed (1, 2, 3, 4 rotation guaranteed)
    seed = int(variation_count or 1)
    if custom_instructions and "Variation Request #" in custom_instructions:
        try:
            parsed_seed = int(custom_instructions.split("Variation Request #")[1].split(":")[0].strip())
            seed = parsed_seed
        except Exception:
            pass

    variant_seed = ((seed - 1) % 4) + 1

    # 1. Dedicated Student / Employee Leave Letter (4 Distinct Variations)
    if is_leave_letter:
        salutation = f"Respected {to_name}" if any(k in to_name.lower() for k in ["dr", "prof", "dean", "sharma"]) else f"Dear {to_name}"
        reason_text = raw_offer if raw_offer else "unforeseen medical commitments"
        
        if variant_seed == 1:
            # Angle 1: Standard Academic Coursework Guarantee
            subjects = [
                f"Leave Application - {from_name} ({to_company})",
                f"Request for Leave of Absence - {from_name}",
                f"Formal Leave Request ({from_role or 'Student'})"
            ]
            body = f"""{salutation},

I am writing to formally request a leave of absence from {to_company} due to {reason_text}.

I will ensure that all my pending coursework, lab sessions, and assignments are fully caught up upon my return, and I remain reachable via email for any urgent updates.

Kindly consider my request and grant permission for the indicated dates.

Thank you for your understanding and support.

Sincerely,
{sender_signature}"""

            followup_1 = f"""{salutation},

Following up on my leave application submitted earlier. Please let me know if any medical certificate or supporting document is required.

Thank you,
{sender_signature}"""

            followup_2 = f"""{salutation},

Kindly checking in regarding the approval status of my leave request.

Warm regards,
{sender_signature}"""

        elif variant_seed == 2:
            # Angle 2: Medical Rest & Health Documentation Focus
            subjects = [
                f"Medical Leave Notice - {from_name} ({to_company})",
                f"Application for Medical Leave - {from_name}",
                f"Absence & Health Recovery Request - {from_name}"
            ]
            body = f"""{salutation},

I am writing to notify you that I am currently unwell with {reason_text}, and have been advised by medical professionals to take complete rest.

I have arranged with my classmates to share lecture notes during this period so that my academic progress is uninterrupted. I will submit the official medical certificate immediately upon resuming classes.

I respectfully request you to grant me leave for these days.

Thank you for your consideration.

Respectfully,
{sender_signature}"""

            followup_1 = f"""{salutation},

Following up on the medical leave notification sent earlier. Happy to email a scanned copy of my doctor's note in advance if needed.

Thank you,
{sender_signature}"""

            followup_2 = f"""{salutation},

Kindly checking if my medical leave application has been noted in the department records.

Best regards,
{sender_signature}"""

        elif variant_seed == 3:
            # Angle 3: Polite Academic Absence & Advance Assignment Preparation
            subjects = [
                f"Permission Request: Leave of Absence - {from_name}",
                f"Academic Leave Application ({from_role or 'Student'}) - {from_name}",
                f"Absence Notification for {from_name} - {to_company}"
            ]
            body = f"""{salutation},

I am writing to request your permission to remain absent from scheduled classes and department activities at {to_company} on account of {reason_text}.

Prior to my absence, I have ensured that all current module deliverables are submitted. Furthermore, I will coordinate with my professors to complete any lab makeup requirements promptly.

I would be most grateful if you could approve my leave of absence.

Thank you for your guidance and time.

Sincerely,
{sender_signature}"""

            followup_1 = f"""{salutation},

Polite reminder regarding my leave permission request submitted earlier.

Thank you,
{sender_signature}"""

            followup_2 = f"""{salutation},

Respectfully checking in regarding the approval status before the scheduled absence dates.

Warm regards,
{sender_signature}"""

        else:
            # Angle 4: Urgent Personal Circumstance & Confirmed Return
            subjects = [
                f"Urgent Leave Application - {from_name} ({to_company})",
                f"Leave Request: {from_name} ({from_role or 'Student'})",
                f"Formal Absence Notification - {from_name}"
            ]
            body = f"""{salutation},

Please accept this email as a formal request for leave of absence from {to_company} due to {reason_text}.

I expect to resume my regular academic duties and class attendance without delay once this duration concludes. In the meantime, I will stay updated on course announcements via our student portal.

Kindly grant approval for my absence during this timeframe.

Thank you very much for your understanding.

Sincerely,
{sender_signature}"""

            followup_1 = f"""{salutation},

Quick follow-up on my urgent leave application. Please let me know if any further formalities are needed from my side.

Thank you,
{sender_signature}"""

            followup_2 = f"""{salutation},

Kindly confirming the receipt and approval of my leave request.

Respectfully,
{sender_signature}"""

        return {
            "subject_lines": subjects,
            "selected_subject": subjects[0],
            "email_body": body,
            "followup_1": followup_1,
            "followup_2": followup_2
        }

    # 2. Recommendation Request (4 Distinct Variations)
    if is_recommendation:
        salutation = f"Respected {to_name}" if any(k in to_name.lower() for k in ["dr", "prof", "dean"]) else f"Dear {to_name}"
        if variant_seed == 1:
            subjects = [
                f"Recommendation Letter Request - {from_name}",
                f"Request for Letter of Recommendation - {from_name}",
                f"Reference Request for {from_name} ({to_company})"
            ]
            body = f"""{salutation},

I hope you are having a productive week.

I am currently preparing applications for {clean_offer or 'upcoming career opportunities and academic programs'}, and having worked under your guidance at {to_company}, your endorsement would mean a great deal.

Would you be open to providing a brief letter of recommendation? I would be glad to share my updated CV and a summary of key milestones to make it as easy as possible for you.

Thank you very much for your time and mentorship.

Best regards,
{sender_signature}"""
        elif variant_seed == 2:
            subjects = [
                f"Endorsement & Recommendation Request: {from_name}",
                f"Academic Reference Request - {from_name}",
                f"{from_name} - Seeking Letter of Recommendation"
            ]
            body = f"""{salutation},

Reflecting on the projects and coursework completed under your mentorship at {to_company}, your insights were foundational to my technical growth.

As I take the next step in applying for {clean_offer or 'prospective graduate programs and engineering positions'}, I would be deeply honored if you would consider writing a letter of recommendation on my behalf.

I have assembled a 1-page summary of our project deliverables alongside my current resume to minimize any effort on your end.

Thank you for your ongoing support and encouragement.

Respectfully,
{sender_signature}"""
        elif variant_seed == 3:
            subjects = [
                f"Letter of Recommendation Inquiry - {from_name}",
                f"Reference for {from_name} ({to_company})",
                f"Quick question re: LOR endorsement ({from_name})"
            ]
            body = f"""{salutation},

Reaching out to check if your schedule would permit providing a recommendation letter for my upcoming applications regarding {clean_offer or 'graduate research and industry roles'}.

Having benefited from your academic leadership at {to_company}, your perspective on my problem-solving and work ethic would add tremendous weight to my candidature.

Please let me know if this is feasible, and I will promptly forward all necessary submission links and materials.

Thank you for your consideration.

Best wishes,
{sender_signature}"""
        else:
            subjects = [
                f"Recommendation Support Request - {from_name}",
                f"Endorsement Request ({from_role or 'Student'}) - {from_name}",
                f"{from_name} ({to_company}) - Recommendation Letter"
            ]
            body = f"""{salutation},

I am writing to respectfully request your endorsement as I finalize submissions for {clean_offer or 'upcoming specialized career roles'}.

Your mentorship at {to_company} gave me the confidence and rigorous foundation to tackle complex technical challenges, and having your recommendation would be invaluable.

I can provide draft bullet points, submission deadlines, and my portfolio at your convenience.

Thank you again for your time and mentorship.

Sincerely,
{sender_signature}"""

        followup_1 = f"""{salutation},

Quick follow-up regarding the recommendation letter request. Happy to adjust to whatever timeline works best for your schedule.

Thank you again,
{sender_signature}"""

        followup_2 = f"""{salutation},

Kindly checking in on this. If your schedule is too tight right now, I completely understand.

Best wishes,
{sender_signature}"""

        return {
            "subject_lines": subjects,
            "selected_subject": subjects[0],
            "email_body": body,
            "followup_1": followup_1,
            "followup_2": followup_2
        }

    # 3. Job Seeker / Candidate Outreach (4 Distinct Variations)
    if is_job_seeker:
        article = "an" if from_role and from_role[0].lower() in "aeiou" else "a"
        intro_line = f"I'm {from_name}{f', {article} {from_role}' if from_role else ''}{f' at {from_company}' if from_company else ''}."
        
        if variant_seed == 1:
            # Angle 1: Direct Technical Proof-of-Concept & ROI
            subjects = [
                f"Application / Note re: {topic} at {to_company}",
                f"{from_name} - {topic} background & projects",
                f"Discussion re: {topic} ({to_company})"
            ]
            body = f"""Dear {to_name},

Saw your focus on {topic} at {to_company}.

{intro_line} I've been working on practical optimizations in this space, specifically around how we {clean_offer}.

{cta_question}

Best regards,
{sender_signature}"""

        elif variant_seed == 2:
            # Angle 2: Technical Prototype & Live Teardown
            subjects = [
                f"Prototype for {to_company}'s {topic} stack ({from_name})",
                f"{to_company} + practical {topic} efficiency",
                f"Quick technical note for {to_name} - {from_name}"
            ]
            body = f"""Dear {to_name},

Reaching out regarding {to_company}'s ongoing work in {topic}.

{intro_line} Recently built a technical proof-of-concept that {clean_offer}, and thought it might be directly relevant to what your team is building.

{cta_question}

Best,
{sender_signature}"""

        elif variant_seed == 3:
            # Angle 3: Architecture Observation & Benchmark Data
            subjects = [
                f"Question re: {topic} architecture at {to_company}",
                f"{from_name} - {topic} benchmark findings",
                f"Note on {topic} latency & compute ({to_company})"
            ]
            body = f"""Dear {to_name},

Following {to_company}'s technical roadmap in {topic} with great interest.

{intro_line} Over the past few months, I've focused on how teams can {clean_offer}.

{cta_question}

All the best,
{sender_signature}"""

        else:
            # Angle 4: Hands-on Builder & Direct Code Contribution
            subjects = [
                f"{from_name} - Candidate Introduction ({topic})",
                f"Application: {topic} Engineering - {from_name}",
                f"Idea for {to_company}'s {topic} pipelines"
            ]
            body = f"""Dear {to_name},

Impressed by the engineering velocity at {to_company}, especially around {topic}.

{intro_line} I love tackling difficult infrastructure challenges, and recently demonstrated how to {clean_offer}.

Would you be open to a brief 5-minute chat to see if my background aligns with your current technical hiring needs?

Best regards,
{sender_signature}"""

        followup_1 = f"""Dear {to_name},

Quick follow-up on my note - wanted to share a 1-page technical teardown on {topic}.

Happy to pass it along if you're interested.

Best,
{from_name}"""

        followup_2 = f"""Dear {to_name},

Assuming your schedule is packed right now, so I'll pause following up.

If anything opens up down the road, feel free to connect anytime.

Best,
{from_name}"""

        return {
            "subject_lines": subjects,
            "selected_subject": subjects[0],
            "email_body": body,
            "followup_1": followup_1,
            "followup_2": followup_2
        }

    elif tone == "Value-First Exec":
        if variant_seed == 1:
            subjects = [
                f"Quick question re: {topic} at {to_company}",
                f"{to_company} + pipeline efficiency",
                f"Idea for {to_name} ({role_mention})"
            ]
            body = f"""Hey {to_name},

Saw your recent focus on {topic} at {to_company}.

Most {peer_group} we speak with are looking to cut operational friction without bloating tech stack overhead. We {clean_offer}.

{cta_question}

Best,
{sender_signature}"""

        elif variant_seed == 2:
            subjects = [
                f"{to_company} - {topic} benchmark comparison",
                f"Metrics re: {topic} for {to_name}",
                f"Practical efficiency lift for {to_company}"
            ]
            body = f"""Hey {to_name},

Following {to_company}'s expansion in {topic} - congrats on the momentum.

We recently helped a peer engineering team solve bottlenecks around this by {clean_offer}.

{cta_question}

Best regards,
{sender_signature}"""

        elif variant_seed == 3:
            subjects = [
                f"Solving {topic} bottlenecks at {to_company}",
                f"Note for {to_name} re: {topic} infrastructure",
                f"{to_company} <> {topic} speedup"
            ]
            body = f"""Hey {to_name},

Reaching out because {to_company}'s roadmap around {topic} caught my eye.

We specialize in helping teams achieve {clean_offer}, keeping implementation under 2 weeks with minimal friction.

{cta_question}

Best,
{sender_signature}"""

        else:
            subjects = [
                f"2-minute teardown: {topic} at {to_company}",
                f"Question on {to_company}'s {topic} latency",
                f"{to_name} - {topic} architecture observation"
            ]
            body = f"""Hey {to_name},

Studying high-performing architectures across the industry, and {to_company}'s execution in {topic} stands out.

We recently developed a clean framework that {clean_offer}, freeing up substantial engineering bandwidth.

{cta_question}

All the best,
{sender_signature}"""

        followup_1 = f"""Hey {to_name},

Quick bump on this - wanted to share that teams tackling {topic} saw an immediate lift after adjusting their workflow.

Worth sending over the summary note?

Best,
{from_name}"""

        followup_2 = f"""Hey {to_name},

Assuming this isn't a current priority for {to_company}'s roadmap. I'll pause follow-ups here.

If you ever want to compare notes on {topic} in the future, feel free to reach back out anytime.

Best,
{from_name}"""

    elif tone == "Founder-to-Founder":
        if variant_seed == 1:
            subjects = [
                f"Fellow founder note for {to_name}",
                f"{to_company} + quick collaboration idea",
                f"Note on {topic} for {to_company}"
            ]
            body = f"""Hey {to_name},

Running a team in the same ecosystem, so I know how noisy inboxes get. Love what you're building with {to_company}.

We built a lightweight approach that {clean_offer}, which solved a major bottleneck for our own team.

{cta_question}

Cheers,
{sender_signature}"""

        elif variant_seed == 2:
            subjects = [
                f"Founder check-in: {topic} scaling at {to_company}",
                f"Observation for {to_name} ({to_company})",
                f"Quick founder sync re: {topic}"
            ]
            body = f"""Hey {to_name},

Saw {to_company}'s progress in {topic} - very impressive trajectory.

We recently figured out a way to {clean_offer}, and thought it might save your team a ton of ramp time and compute spend.

{cta_question}

Best,
{sender_signature}"""

        elif variant_seed == 3:
            subjects = [
                f"{to_name} - peer founder question re: {topic}",
                f"Startup architecture teardown: {to_company}",
                f"Idea for {to_company} on {topic}"
            ]
            body = f"""Hey {to_name},

Fellow founder reaching out - noticed your recent milestones with {to_company}.

We went through similar bottlenecks around {topic} and solved it by {clean_offer}.

{cta_question}

All the best,
{sender_signature}"""

        else:
            subjects = [
                f"Founder perspective on {topic} ({to_company})",
                f"Connecting: {from_name} <> {to_name}",
                f"{to_company} + lean scaling"
            ]
            body = f"""Hey {to_name},

Really respect the pace at which {to_company} is moving in {topic}.

We recently open-sourced and stress-tested a workflow that {clean_offer}, keeping operating costs lean.

Would love to swap quick notes if you're open to a brief 5-minute founder chat?

Warmly,
{sender_signature}"""

        followup_1 = f"""Hey {to_name},

Quick bump from one founder to another. Put together a short 90-second teardown showing how we streamlined {topic}.

Mind if I send the link?

Best,
{from_name}"""

        followup_2 = f"""Hey {to_name},

Guessing you're heads-down scaling {to_company} right now. I'll stop bugging you.

Wishing you and the team huge success!

Best,
{from_name}"""

    elif tone == "Curious Problem-Solver":
        if variant_seed == 1:
            subjects = [
                f"Question on how {to_company} handles {topic}",
                f"Quick observation for {to_name} ({to_company})",
                f"{topic} strategy at {to_company}"
            ]
            body = f"""Hey {to_name},

Came across {to_company}'s initiatives around {topic} and had a quick question regarding your current workflow.

We've observed that teams scaling this typically run into bandwidth hurdles. We {clean_offer}.

{cta_question}

Best,
{sender_signature}"""

        elif variant_seed == 2:
            subjects = [
                f"Curious re: {topic} bottlenecks at {to_company}",
                f"Observation for {to_name} - {topic}",
                f"How {to_company} is tackling {topic}"
            ]
            body = f"""Hey {to_name},

Looking into {to_company}'s tech stack and focus on {topic}.

Many {peer_group} tell us that legacy approaches end up draining engineering hours. We {clean_offer}.

{cta_question}

Best regards,
{sender_signature}"""

        elif variant_seed == 3:
            subjects = [
                f"Quick technical hypothesis re: {to_company}",
                f"Note on {topic} friction for {to_name}",
                f"{to_company} + {topic} observations"
            ]
            body = f"""Hey {to_name},

Quick question for you regarding {to_company}'s approach to {topic}.

We found that addressing the core bottleneck by {clean_offer} unlocked major efficiency gains for similar teams.

{cta_question}

Best,
{sender_signature}"""

        else:
            subjects = [
                f"Exploring {topic} improvements at {to_company}",
                f"Idea regarding {to_company}'s {topic} pipeline",
                f"{to_name} - {topic} architecture"
            ]
            body = f"""Hey {to_name},

Was reviewing common operational hurdles in {topic}, and noticed how {to_company} is positioning in this space.

We engineered a practical approach to {clean_offer} without creating new technical debt.

{cta_question}

All the best,
{sender_signature}"""

        followup_1 = f"""Hey {to_name},

Following up on my previous note. We put together an interactive teardown on solving {topic} challenges.

Open to taking a peek?

Best,
{from_name}"""

        followup_2 = f"""Hey {to_name},

I'll assume you have this fully covered internally. Closing the loop on my end.

Best of luck with {to_company}!

{from_name}"""

    elif tone == "Ultra-Concise":
        if variant_seed == 1:
            subjects = [
                f"{to_company} <> {topic}",
                f"Quick question for {to_name}",
                f"{to_company} + {to_name}"
            ]
            body = f"""Hey {to_name},

Noticed your work with {topic} at {to_company}.

We {clean_offer}.

{cta_question}

{sender_signature}"""

        elif variant_seed == 2:
            subjects = [
                f"Note re: {topic} ({to_company})",
                f"{to_company} - quick thought",
                f"Question for {to_name}"
            ]
            body = f"""Hey {to_name},

Quick note re: {topic} at {to_company}.

We help teams {clean_offer} with zero setup overhead.

{cta_question}

{sender_signature}"""

        elif variant_seed == 3:
            subjects = [
                f"{to_name} / {topic}",
                f"{to_company} + pipeline speed",
                f"Idea for {to_company}"
            ]
            body = f"""Hey {to_name},

{to_company} + {topic} caught my eye.

We {clean_offer}.

{cta_question}

{sender_signature}"""

        else:
            subjects = [
                f"{topic} efficiency ({to_company})",
                f"Quick ping for {to_name}",
                f"{to_company} <> {from_name}"
            ]
            body = f"""Hey {to_name},

Reaching out re: {to_company}'s {topic} setup.

We {clean_offer}.

{cta_question}

{sender_signature}"""

        followup_1 = f"""Hey {to_name},

Quick bump - open to taking a peek at a 2-minute overview?

{from_name}"""

        followup_2 = f"""Hey {to_name},

I'll step back. If anything changes down the line, feel free to ping me.

Best,
{from_name}"""

    else:
        # Default: Casual & Direct / Polite & Professional
        if variant_seed == 1:
            subjects = [
                f"Quick idea for {to_name} re: {topic}",
                f"{to_company} + {topic}",
                f"Question for {to_name} ({to_company})"
            ]
            body = f"""Hey {to_name},

Noticed how {to_company} is tackling {topic} - figured this might be timely.

A lot of {peer_group} mention that traditional solutions create more friction than value. We {clean_offer}.

{cta_question}

Best,
{sender_signature}"""

        elif variant_seed == 2:
            subjects = [
                f"Observation re: {topic} at {to_company}",
                f"{to_company} - {topic} workflow note",
                f"{to_name} <> {topic} discussion"
            ]
            body = f"""Hey {to_name},

Saw your updates around {to_company}'s {topic} initiatives.

We developed a targeted method to {clean_offer} without requiring extensive team overhaul.

{cta_question}

Best,
{sender_signature}"""

        elif variant_seed == 3:
            subjects = [
                f"Streamlining {topic} at {to_company}",
                f"Quick note for {to_name} ({to_company})",
                f"{to_company} + efficiency"
            ]
            body = f"""Hey {to_name},

Quick note on {topic} for {to_company}.

We recently helped similar teams achieve {clean_offer}, slashing execution time significantly.

{cta_question}

Best,
{sender_signature}"""

        else:
            subjects = [
                f"Practical approach for {to_company}'s {topic}",
                f"{to_name} - quick benchmark compare",
                f"{to_company} {topic} exploration"
            ]
            body = f"""Hey {to_name},

Following {to_company}'s work in {topic}.

We found that addressing the core compute and workflow bottlenecks enabled teams to {clean_offer}.

{cta_question}

Best regards,
{sender_signature}"""

        followup_1 = f"""Hey {to_name},

Quick bump on this in case it got buried.

We put together a short breakdown of the exact playbook that drove results for teams like {to_company}.

Worth sending over?

Best,
{from_name}"""

        followup_2 = f"""Hey {to_name},

Assuming this isn't top of mind for you right now, so I'll stop following up.

If you ever want to benchmark your {topic} performance in the future, feel free to reach back out anytime.

All the best with {to_company},
{from_name}"""

    return {
        "subject_lines": subjects,
        "selected_subject": subjects[0],
        "email_body": body,
        "followup_1": followup_1,
        "followup_2": followup_2
    }

