import os
import json
import logging
import anthropic
from typing import Dict, Any, List, Tuple
from app.config import settings
from app.agents.tools import scan_for_ai_cliches

logger = logging.getLogger("cold_outreach.copywriter")

SYSTEM_ANTI_AI_PROMPT = """You are an elite, top-1% B2B cold email copywriter. Your core superpower is writing cold emails that DO NOT sound AI-generated, templated, or robotic.

CRITICAL ANTI-AI WRITING RULES:
1. BAN ALL AI FLUFF:
   - NEVER say "I hope this email finds you well"
   - NEVER say "In today's fast-paced digital world / landscape"
   - NEVER say "I came across your profile and was impressed by..."
   - NEVER use buzzwords like: "game-changer", "delve", "supercharge", "unleash", "cutting-edge", "synergy", "seamlessly", "testament"
2. KEEP IT ULTRA CONVERSATIONAL & HUMAN:
   - Use short sentences and simple, everyday language (6th-8th grade reading level).
   - Write like a thoughtful human sending a quick note from their phone or laptop.
   - Total email length: 65 to 110 words MAX.
3. STRUCTURE:
   - Hook (1-2 sentences): A hyper-specific observation about their role, company, or recent activity.
   - Value / Proof (1-2 sentences): A crisp, quantified result or specific insight without sales hype.
   - Call to Action (1 sentence): A low-friction, casual closing question (e.g. "Worth exploring?", "Open to taking a peek?", "Mind if I send a 2-min breakdown?").
4. SUBJECT LINES:
   - 2 to 5 words max.
   - All lowercase or sentence case (e.g., "quick question re: churn", "{{company}} + outbound pipeline").
   - No clickbait, no cheesy emojis.
5. MULTI-STEP SEQUENCE:
   - Include Follow-up 1 (Day 3): A short 2-3 sentence nudge adding a new specific angle.
   - Include Follow-up 2 (Day 7): A polite, low-pressure breakup / permission-to-close email.

You must output STRICT JSON matching this schema:
{
  "subject_lines": ["subject option 1", "subject option 2", "subject option 3"],
  "selected_subject": "subject option 1",
  "email_body": "Hey [Name],\\n\\n[Body text]\\n\\n[Signoff],\\n[Sender]",
  "followup_1": "Hey [Name], quick bump on this — [1-2 sentences]\\n\\nWorth a chat?",
  "followup_2": "Hey [Name], guessing this isn't a priority right now. I'll stop following up. If anything changes down the line, feel free to reach out.\\n\\nBest,"
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
    custom_instructions: str = ""
) -> Dict[str, Any]:
    """Invokes Claude (Anthropic API) to craft hyper-personalized cold outreach."""
    
    user_prompt = f"""Craft an anti-AI cold outreach email and follow-up sequence with these details:

PROSPECT INFO:
- Name: {prospect_name or 'Prospect'}
- Company: {prospect_company or 'their company'}
- Role: {prospect_role or 'Leader'}
- Profile / Notes:
\"\"\"{profile_text}\"\"\"

GOAL & TONE:
- Goal: {goal}
- Tone: {tone}
- Our Value Proposition / Offer: {value_proposition or 'Helping teams scale pipeline efficiently with targeted prospect intelligence'}

PROSPECT WEB & COMPANY INSIGHTS:
{research_summary or 'No extra web notes.'}

RELEVANT CASE STUDIES / KNOWLEDGE BASE:
{chr(10).join(rag_context) if rag_context else 'Default B2B SaaS proven playbooks.'}

ADDITIONAL INSTRUCTIONS:
{custom_instructions or 'Ensure it sounds 100% natural, human, and direct.'}

Remember: Return ONLY valid JSON with subject_lines, selected_subject, email_body, followup_1, and followup_2. No preamble or markdown fences around the JSON.
"""

    api_key = settings.ANTHROPIC_API_KEY
    if api_key and not api_key.startswith("your_"):
        try:
            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=1500,
                temperature=0.7,
                system=SYSTEM_ANTI_AI_PROMPT,
                messages=[{"role": "user", "content": user_prompt}]
            )
            raw_text = response.content[0].text.strip()
            # Clean JSON if wrapped in markdown codeblocks
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            
            data = json.loads(raw_text.strip())
            return data
        except Exception as e:
            logger.error(f"Anthropic API call error: {e}. Falling back to dynamic anti-AI generator.")

    # High quality fallback anti-AI generator if API key is not configured or in offline demo mode
    return generate_dynamic_fallback(
        prospect_name=prospect_name or "there",
        prospect_company=prospect_company or "your team",
        prospect_role=prospect_role,
        profile_text=profile_text,
        tone=tone,
        goal=goal,
        value_proposition=value_proposition
    )

def generate_dynamic_fallback(
    prospect_name: str,
    prospect_company: str,
    prospect_role: str,
    profile_text: str,
    tone: str,
    goal: str,
    value_proposition: str
) -> Dict[str, Any]:
    """Generates clean, human, non-AI sounding cold emails dynamically."""
    name = prospect_name.split()[0] if prospect_name and prospect_name != "there" else "there"
    company = prospect_company if prospect_company and prospect_company != "your team" else "your team"
    
    # Extract a specific hook from the profile
    hook = f"noticed how {company} is scaling outbound initiatives"
    if "ai" in profile_text.lower() or "tech" in profile_text.lower():
        hook = f"saw your focus on automating pipeline workflows at {company}"
    elif "sales" in profile_text.lower() or "growth" in profile_text.lower():
        hook = f"noticed you're driving growth and outbound strategy for {company}"
    elif "product" in profile_text.lower() or "engineering" in profile_text.lower():
        hook = f"spotted your updates on product engineering milestones at {company}"

    offer = value_proposition if value_proposition else "helped similar teams double their qualified meeting rate without adding headcount"

    subjects = [
        f"quick question regarding {company}",
        f"{company} + outbound pipeline",
        f"idea for {name}"
    ]

    body = f"""Hey {name},

{hook.capitalize()} — figured this might be timely.

Most leaders in your position mention that generic outbound is burning domain reputation with sub-1% reply rates. We {offer}.

Open to taking a peek at a 2-minute breakdown of how we did it?

Best,
Alex"""

    followup_1 = f"""Hey {name},

Quick bump on this in case it got buried under your inbox.

We recently put together a teardown of the exact hooks that got 4.8x higher response rates for teams like {company}.

Worth sending over the 2-min loom link?"""

    followup_2 = f"""Hey {name},

Assuming this isn't a priority on your plate right now, so I'll stop following up.

If you ever want to benchmark your outbound reply rates down the road, feel free to reach back out anytime.

All the best with {company},
Alex"""

    return {
        "subject_lines": subjects,
        "selected_subject": subjects[0],
        "email_body": body,
        "followup_1": followup_1,
        "followup_2": followup_2
    }
