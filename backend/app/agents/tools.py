import re
from typing import Dict, Any, List
import logging
import httpx
from app.config import settings

logger = logging.getLogger("cold_outreach.tools")

AI_CLICHE_PATTERNS = [
    r"i hope this (email|message) finds you well",
    r"in today\'s (fast-paced|digital|ever-changing|dynamic)",
    r"game-changer",
    r"revolutionary",
    r"cutting-edge",
    r"delve into",
    r"testament to",
    r"unleash",
    r"supercharge",
    r"synergy",
    r"spearhead",
    r"beacon of",
    r"tapestry",
    r"realm of",
    r"i came across your profile and was (really )?impressed",
    r"touch base",
    r"reach out",
    r"at your earliest convenience",
    r"seamless(ly)?",
    r"transformative"
]

SPAM_WORDS = [
    "guaranteed", "100% free", "risk-free", "act now", "limited time",
    "miracle", "no catch", "make money", "winner", "earn cash", "urgent"
]

def search_company_or_prospect(query: str, max_results: int = 3) -> str:
    """Pure-Python Tool: Searches for recent company news, hiring updates, or tech stack."""
    if not query.strip():
        return ""
    
    # 1. If Tavily API Key is provided, use Tavily
    if settings.TAVILY_API_KEY:
        try:
            with httpx.Client(timeout=6.0) as client:
                res = client.post(
                    "https://api.tavily.com/search",
                    json={"api_key": settings.TAVILY_API_KEY, "query": query, "max_results": max_results}
                )
                if res.status_code == 200:
                    data = res.json()
                    results = [f"- {r.get('title')}: {r.get('content')}" for r in data.get("results", [])]
                    return "\n".join(results)
        except Exception as e:
            logger.warning(f"Tavily search error: {e}")

    # 2. Pure-Python DuckDuckGo HTML / Instant search fallback with httpx
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        with httpx.Client(headers=headers, timeout=5.0, follow_redirects=True) as client:
            res = client.get(f"https://html.duckduckgo.com/html/?q={query}")
            if res.status_code == 200:
                html = res.text
                snippets = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', html, re.DOTALL)
                clean_snippets = [re.sub(r'<.*?>', '', s).strip() for s in snippets[:max_results]]
                if clean_snippets:
                    return "\n".join([f"- {s}" for s in clean_snippets if s])
    except Exception as e:
        logger.warning(f"Web search fallback notice ({e})")

    return f"- Public company profile and industry growth updates for {query}"

def scan_for_ai_cliches(text: str) -> List[str]:
    """Scans text for typical AI dead giveaways."""
    lower_text = text.lower()
    found = []
    for pattern in AI_CLICHE_PATTERNS:
        match = re.search(pattern, lower_text)
        if match:
            found.append(match.group(0))
    return found

def scan_for_spam_triggers(text: str) -> List[str]:
    """Scans text for common spam trigger words."""
    lower_text = text.lower()
    found = []
    for word in SPAM_WORDS:
        if word in lower_text:
            found.append(word)
    return found

def extract_profile_details(profile_text: str) -> Dict[str, str]:
    """Heuristic extraction of name, role, company from unstructured bio or LinkedIn dump."""
    details = {"name": "", "role": "", "company": "", "topics": []}
    lines = [l.strip() for l in profile_text.splitlines() if l.strip()]
    
    if not lines:
        return details

    first_line = lines[0]
    if " - " in first_line:
        parts = first_line.split(" - ")
        details["name"] = parts[0].strip()
        if len(parts) > 1:
            details["role"] = parts[1].strip()
    elif " | " in first_line:
        parts = first_line.split(" | ")
        details["name"] = parts[0].strip()
        if len(parts) > 1:
            details["role"] = parts[1].strip()
    elif " at " in first_line.lower():
        parts = re.split(r'\s+at\s+', first_line, flags=re.IGNORECASE)
        details["role"] = parts[0].strip()
        if len(parts) > 1:
            details["company"] = parts[1].strip()
    
    return details
