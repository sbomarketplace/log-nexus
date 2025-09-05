# Quick Notes Discovery Map

## Primary UI triggers
- **src/pages/Home.tsx:293** – `Button` component
  - Button text: "Organize Quick Notes"
  - onClick handler: `handleQuickNotesOrganize` (line 41)
  - Navigates/updates: Calls `runOrganize()` → updates state → triggers re-render of `IncidentExplorer`

- **src/pages/Home.tsx:296** – "Log Manually" `Button`
  - Button text: "Log Manually"
  - onClick handler: `Link to="/add"`
  - Navigates/updates: Routes to manual incident creation page

## Parsing/Organizing functions
- **src/lib/invokeOrganizeNotes.ts:3** – `organizeQuickNotes(payload: { title: string; notes: string })`
  - Input: `{ title: string, notes: string }`
  - Output/shape: Returns `data.normalized.incidents` array from Supabase Edge Function
  - Called by: `src/pages/Home.tsx:119` in `runOrganize()` function
  - Notes: Invokes Supabase `organize-incidents` edge function, handles CORS/network errors

- **src/services/organizer.ts:5** – `organizeNotes(rawNotes: string)`
  - Input: Raw notes string
  - Output/shape: Returns `StructuredIncidentResponse[]` from `data.normalized.incidents`
  - Called by: `OrganizeNotesModal.tsx` for the modal workflow
  - Notes: Uses Supabase edge function, includes error handling with function logs links

- **src/lib/notesParser.ts:33** – `parseNotesToStructured(input: { text: string }): ParsedNotes`
  - Input: `{ text: string }`
  - Output/shape: `ParsedNotes` with date, time, where, people, witnesses, quotes, requests, category, summary
  - Called by: `organizeNotes.ts:26` for local parsing
  - Notes: Local parsing with regex patterns, no LLM calls

- **src/services/incidentProcessor.ts:26** – `processIncident(incident, options)`
  - Input: `OrganizedIncident`, processing options including `rawNotes`
  - Output/shape: Processed `OrganizedIncident` with grammar improvements
  - Called by: Various save/export workflows
  - Notes: Handles grammar improvement, date extraction from raw notes

## Stores/Types involved
- **src/utils/organizedIncidentStorage.ts:39** – `organizedIncidentStorage`
  - Fields used by Quick Notes: All `OrganizedIncident` fields (id, title, date, categoryOrIssue, who, what, where, when, witnesses, notes, etc.)
  - Who updates it: `saveMultiple()` called from `Home.tsx:146` after organizing
  - Who reads it: `IncidentExplorer.tsx:41` in `loadIncidents()`, `Home.tsx:48` in `loadIncidents()`

- **localStorage keys:**
  - `quickNotesDraft` – Draft notes content (read/write in `Home.tsx:64,73`)
  - `quickNotesTitleDraft` – Draft title content (read/write in `Home.tsx:65,76`)

- **src/pages/Home.tsx state:**
  - `quickNotes` – Current textarea value (line 25)
  - `quickNotesTitle` – Current title input value (line 26)
  - `quickNotesError` – Error display state (line 27)
  - `isOrganizing` – Loading state for organize button (line 28)

## Render targets
- **src/components/incidents/IncidentExplorer.tsx:199** – `IncidentCard` component
  - How a "draft" or parsed result reaches this component: `Home.tsx:146` saves organized incidents to storage → `IncidentExplorer.tsx:41` loads from storage → renders as `IncidentCard` list

- **src/components/IncidentCard.tsx:67** – Individual incident display
  - Renders organized incident data with view/edit/delete actions
  - Called from `IncidentExplorer.tsx:199` and `Incidents.tsx:194`

## Call graph (bullet list)
- **Home.tsx Button** → `handleQuickNotesOrganize()` → `runOrganize()` → `organizeQuickNotes()` → **Supabase Edge Function** → `organizedIncidentStorage.saveMultiple()` → **IncidentExplorer** → **IncidentCard**
- **Alternative flow**: OrganizeNotesModal → `organizeNotes()` → Supabase Edge Function → Modal results display

## Edit recommendation
- **Single best place to implement/fix parsing is: src/lib/invokeOrganizeNotes.ts:3 function organizeQuickNotes**
- Rationale:
  - This is the primary entry point for the Quick Notes "Organize" button functionality
  - Handles the complete payload (title + notes) that gets sent to the AI service
  - Contains error handling and data transformation logic
  - Minimal dependencies - only calls Supabase edge function
  - Changes here affect the main Quick Notes workflow without disrupting modal-based organizing

## Secondary edit locations (if broader changes needed):
- **src/pages/Home.tsx:96** – `runOrganize()` function for UI integration and state management
- **supabase/functions/organize-incidents/index.ts** – Edge function for AI processing logic
- **src/lib/notesParser.ts:33** – Local parsing fallbacks and data extraction patterns