POST body:
{ "notes": "raw notes pasted by the user" }

CORS:
- OPTIONS preflight is handled.
- Every response includes Access-Control-Allow-Origin, Access-Control-Allow-Headers, and Access-Control-Allow-Methods.
- Allowed origins are preview and production Lovable domains and localhost. Set env CORS_ALLOW_ALL=true to force wildcard during development.

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
- Preflight check via OPTIONS returns 200 and CORS headers.
- Browser POST from preview and production succeeds without CORS errors.
- Notes with prose return ok:false with minimal incident and errors.
- Valid JSON returns ok:true.

SEO clause:
No public pages changed.

Non-Destructive Requirement:
All updates must not break any existing layouts or functionality anywhere in the app. If a change is necessary it must be minimal, documented, and not disrupt other roles or navigation.