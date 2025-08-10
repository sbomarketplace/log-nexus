POST body:
{ "notes": "raw notes pasted by the user" }

Response is always HTTP 200 with:
{
  "ok": boolean,
  "normalized": { "incidents": [ { date, category, who[], what, where, when, witnesses[], notes } ] },
  "errors": string[],
  "meta": { "model": string|null, "usage": {...}|null, "rawPreview": string }
}

If the model does not return JSON, the function returns ok:false plus a minimal incident built from the text and an errors array. The route remains /functions/v1/organize-incidents.

Wiring:
- Keep OPENAI_API_KEY in project settings.
- No frontend changes required, but callers should rely on ok and errors rather than HTTP status.

Testing:
- Send prose notes and confirm 200 with ok:false and minimal incident.
- Send valid JSON and confirm ok:true.
- Verify there are no "Unexpected response structure" errors in logs.

SEO clause:
This back end change does not modify any public facing pages or metadata.

Non-Destructive Requirement:
All updates must not break any existing layouts or functionality anywhere in the app.
If a change to layout or behavior is absolutely necessary, it must:
* Be minimal
* Be clearly documented with a note or comment
* Not disrupt other user roles
* The dashboard, navigation, and responsive behavior across roles must remain stable and consistent unless explicitly noted.