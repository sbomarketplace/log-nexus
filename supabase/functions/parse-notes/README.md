POST to this function with:
{
  "notes": "raw notes pasted by the user"
}

Success example response:
{
  "ok": true,
  "normalized": {
    "incidents": [
      {
        "date": "2025-07-22",
        "category": "Substance Abuse Allegation",
        "who": ["Manager Arthur Samora", "Manager Vincent Jessie", "Manager Seth Bentley"],
        "what": "Security accused employees of smoking in the tool room",
        "where": "Tool room",
        "when": "09:00",
        "witnesses": ["Union Steward Troy Denney", "Union Steward Jon Taylor"],
        "notes": "Andrew noted there was no smell of weed"
      }
    ]
  },
  "errors": [],
  "meta": { "model": "gpt-4o-mini", "usage": { ... }, "rawPreview": "{...original content...}" }
}

If model returns non JSON, you still get ok:false with a minimal incident plus errors, never a thrown exception.

Wiring:
- Keep the existing function name and route. Replace index.ts content only if file already exists.
- Ensure OPENAI_API_KEY is set in Supabase project settings for Edge Functions.
- No changes to callers are required. They can rely on ok flag and errors array.

Testing:
- Send perfectly formatted JSON in notes and verify ok:true.
- Send prose notes without JSON and verify ok:false with minimal incident and errors.
- Send content with code fences and keys capitalized and verify normalization.

Acceptance criteria:
- No more "Unexpected response structure" throws
- Function never exits with error due to parsing issues
- Logs are informative but not noisy
- Normalized output always follows the Incident schema
- Backward compatible response envelope

SEO clause:
This change does not affect any SEO elements. If the project includes public documentation pages, do not change titles, meta tags, or sitemap.

⚠️ Non-Destructive Requirement:
All updates must not break any existing layouts or functionality anywhere in the app.
If a change to layout or behavior is absolutely necessary, it must:
* Be minimal
* Be clearly documented with a note or comment
* Not disrupt other user roles (vendor, admin, guest)
* The dashboard, navigation, and responsive behavior across roles must remain stable and consistent unless explicitly noted.