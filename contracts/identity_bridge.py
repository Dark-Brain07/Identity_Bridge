# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

class IdentityBridge(gl.Contract):
    # Mapping of user addresses (or GitHub URLs) to their Soulbound Token (SBT) status
    badges: TreeMap[str, str]
    total_badges: u256

    def __init__(self):
        self.total_badges = u256(0)

    @gl.public.write
    def mint_developer_badge(self, github_url: str) -> str:
        # Check if already minted for this URL
        existing = self.badges.get(github_url)
        if existing is not None:
            return json.dumps({"status": "ALREADY_MINTED", "details": "A developer badge has already been minted for this GitHub profile."})

        # Fetch the GitHub profile data
        def _fetch_profile() -> str:
            try:
                # In a real scenario, this would fetch the raw HTML or an API endpoint.
                # GenLayer's web.get can scrape standard web pages.
                response = gl.nondet.web.get(github_url)
                text = response.body.decode("utf-8")
                # Grab a chunk of the HTML/Text to prove activity (e.g. contribution graph area)
                return text[:1500] 
            except Exception:
                return "ERROR_FETCHING"
                
        try:
            profile_data = gl.eq_principle.strict_eq(_fetch_profile)
        except Exception:
            profile_data = "ERROR_FETCHING"
            
        if profile_data == "ERROR_FETCHING":
            result = {"status": "FAILED", "details": "GenLayer could not access the provided URL. Ensure it is a valid public GitHub URL."}
            return json.dumps(result)

        # We use a highly constrained, binary prompt to ensure rapid consensus and zero timeouts.
        prompt = f"""
        Profile Data Snippet:
        {profile_data[:500]}
        
        Task: Does this text appear to be from a developer profile or code repository (look for keywords like 'repository', 'commit', 'pull request', 'code', 'developer')?
        You must answer with EXACTLY ONE WORD: YES if it is, NO if it is not.
        """
        
        def _evaluate_skills() -> str:
            return gl.nondet.exec_prompt(prompt)
            
        try:
            evaluation = gl.eq_principle.strict_eq(_evaluate_skills)
        except Exception:
            # If the LLM validators timeout or fail, fail gracefully
            evaluation = "NO"
            
        prefix = evaluation.upper()
        if "YES" in prefix:
            status = "MINTED"
            details = "Verification Successful! The GenLayer AI Oracle has verified your developer activity and minted your Soulbound Proof-of-Skill Token."
            self.total_badges += u256(1)
        else:
            status = "REJECTED"
            details = "Verification Failed. The AI Oracle did not detect sufficient developer activity on the provided URL."
            
        badge_data = {
            "url": github_url,
            "status": status,
            "details": details,
            "badge_type": "Master Developer SBT",
            "timestamp": "auto-generated"
        }
        
        badge_json = json.dumps(badge_data)
        
        # Only store it if it was successfully minted
        if status == "MINTED":
            self.badges[github_url] = badge_json
            
        return badge_json

    @gl.public.view
    def get_badge(self, github_url: str) -> str:
        data = self.badges.get(github_url)
        if data is None:
            return "NOT_FOUND"
        return data

    @gl.public.view
    def get_total_badges(self) -> str:
        return str(self.total_badges)
