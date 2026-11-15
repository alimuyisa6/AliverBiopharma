# Sketchy-reference database audit and implementation

**Audit date:** 15 November 2026  
**Reference:** user-provided `www_sketchy_com.html` (247,505-byte Sketchy marketing homepage HTML).  
**Database:** Supabase project `bhhndmcqjibodbfmbrpj`.  
**Repository baseline:** `main` at `d1020e8777920d309d333212b9e09c03bf519fd2`.

This audit treats the uploaded Sketchy HTML as the functional requirements source. It does not treat the public marketing page as evidence of Sketchy's private implementation. Aliver's own curriculum and resource model remains authoritative.

## 1. Feature extraction from the reference

The reference groups the product into two connected learning modes:

### Learn & Recall
- Lesson library and visual lessons.
- Interactive symbol explorer with clickable lesson symbols.
- End-of-lesson targeted quizzes.
- Global QBank with a large question pool.
- Custom tests assembled for targeted practice.
- Detailed answer explanations and links back to lessons.

### Apply
- Patient-case simulations.
- Clinician-authored and AI-assisted case interactions.
- Conversations with virtual patients and attending clinicians.
- Full patient encounters.
- Imaging and laboratory result interpretation.
- Differential-building drills.
- Board-style clinical vignettes.

The reference also communicates programme discovery, expert-created content, testimonials/proof, pricing/access tiers and mobile study. Those are primarily catalogue, editorial, subscription and frontend integration concerns rather than reasons to duplicate the learning database.

## 2. Existing Aliver schema and live data

Live counts verified against Supabase on 15 November 2026:

| Existing structure | Live count / state | Use against Sketchy requirement |
|---|---:|---|
| `curriculum_units` | 824 active nodes | Curriculum and lesson hierarchy |
| `curriculum_unit_blocks` | 868 blocks | Lesson content; now includes `interactive_config` |
| `learning_content_links` | 2,176 links | Many-to-many curriculum-to-resource connections |
| `notes` | 489 active | Lesson library / reading |
| `flashcard_decks` / `flashcard_cards` | 161 / 644 | Learn and recall |
| `quiz_questions` | 365 published; 255 active formal pool rows | Single formal QBank source |
| `note_quiz_questions` | Existing relation | Note-specific comprehension practice |
| `quiz_attempts` / `quiz_attempt_answers` | Existing, populated | Authoritative quiz attempt and answer history |
| `reading_progress` | Existing, populated | Reading progress |
| `recall_questions_bank` | 4 rows | Recall content is currently sparse |
| `pdf_resources` / `past_papers` | 9 / 8 | Supplementary learning and exam practice |
| `videos` | Table exists; 0 rows | Video catalogue is structurally available but unpopulated |
| `lab_cases` / `lab_case_stages` | 0 / 0 | Clinical simulation schema exists but has no authored cases |
| `lab_tools`, `lab_drugs`, `lab_interactions`, `lab_pathways` | 0 records each | No current clinical tool/pathway content |
| `content_collections` / `collection_items` | 0 / 0 | Collection framework exists but is empty |
| `learning_test_blueprints` / items | Tables exist; no learner records | Saved custom-test definitions added in PR #108 |

Question rows have explanations and curriculum unit references. The existing backend's quiz session service selects published formal questions, creates protected sessions and attempts, and persists answer records. A separate question bank table would be duplicative.

## 3. Feature-to-database mapping

| Sketchy feature | Existing Aliver support | Gap / work required |
|---|---|---|
| Lesson library | Curriculum units, blocks, notes, PDFs, flashcards, linked content | Frontend discovery and resource quality/content coverage |
| Visual lesson media | Curriculum blocks; video table | No video rows; populate curated media and transcripts |
| Interactive symbol explorer | `curriculum_unit_blocks.interactive_config` added in PR #108 | Define validated config format and author real diagrams/symbol data; no new symbol table justified yet |
| End-of-lesson quizzes | `quiz_questions`, curriculum links, note links, quiz sessions and attempts | Frontend must surface the lesson-scoped quiz and reuse existing session API |
| Global QBank | `quiz_questions` with explanations, type, difficulty, concepts, learning objectives and unit IDs | Search/filter endpoint and UI; no duplicate bank |
| Custom test builder | `learning_test_blueprints` and items from PR #108 | Need backend run creation and persisted run-to-attempt/question snapshot mapping; implemented in this database extension |
| Explanation-to-lesson links | Question explanation and curriculum unit/concept metadata; curriculum content link graph | Backend must resolve unit/concept to canonical lesson route |
| Patient cases | `lab_cases`, `lab_case_stages`, `lab_case_scores`, lab drug/tool/pathway structures | Tables are empty; author, clinically review and publish content before learner launch |
| Virtual patient / attending dialogue | `clinical_simulation_sessions`, `clinical_simulation_turns` from PR #108 | Backend-controlled model/patient/attending turns and authored conversation states |
| Imaging/lab interpretation | Clinical case stage JSON and lab case domain | Author structured images, values, reference ranges and evaluation rubrics |
| Differential building | Clinical case stages and case type | Author case stages, expected responses and rubric |
| Board-style vignettes | Existing formal QBank question types and clinical cases | Curate content and route into existing quiz/simulation systems |
| Testimonials / expert content | Existing testimonials, success stories and contributor-related structures | Editorial workflow and published content, not a new learning data model |
| Subscription/access | Existing subscription plans, entitlements and premium flags | Map feature entitlements to Aliver's own plans; do not copy Sketchy prices |

## 4. Database changes implemented

### Migration `20261115102545_sketchy_learning_experience_integrity`
- Adds a stored full-text search vector and GIN/filter indexes to the existing `quiz_questions` table for a global formal QBank.
- Adds `learning_test_runs`, linked to existing `quiz_attempts`, with a question snapshot, filters, time limit and lifecycle state. It does not create another answer or question table.
- Enforces that a saved test can only contain active, published, formal (non-note-practice) questions.
- Keeps `learning_test_blueprints.question_count` synchronized with its item relation.
- Adds clinical-case authoring, learning-objective, type, duration and editorial review metadata to the existing `lab_cases` table.
- Requires a case to be published before it can be active.
- Makes case stages ordered and adds a separate service-only evaluation/rubric table so expected answers are not exposed through learner-facing stage data.
- Enforces that a simulation's selected stage belongs to the same case as the session.
- Enforces that each persisted turn's stage belongs to the case attached to its session.
- Requires a reviewer identity and review timestamp before a case can be published.
- Freezes custom-test question snapshots, filters, owner, attempt link and timing after run creation.
- Adds authoritative score and feedback fields to clinical simulation sessions.
- Removes learner direct write access to clinical session lifecycle and scores; session creation, lifecycle transitions and score writes must be performed by the trusted backend. Learners can read their own sessions and append learner turns.

### Migration `20261115102755_restrict_clinical_case_stage_visibility`
- Restricts learner-visible stage reads to stages belonging to active, published cases.
- Prevents drafts and in-review case stages from being read through the public Data API.
- Adds a case/order index.

## 5. Security model

- `learning_test_runs`: authenticated users can read only their own rows. Writes are service-role/backend-only.
- Saved blueprint ownership remains enforced by existing owner-scoped RLS.
- Blueprint items are checked against active, published formal QBank questions.
- Clinical case stage evaluation rubrics are not granted to anon/authenticated; only the trusted service role can access them.
- Clinical sessions are owner-readable; learners cannot insert/update/delete session lifecycle rows directly.
- Learners may append only turns where `speaker='learner'` and the session belongs to them.
- Patient, attending and system turns must be created by the backend.
- Learners cannot insert/update/delete case scores directly.
- Published case stages are the only stages exposed to learners.

## 6. Explicitly unresolved (not safe to fake)

1. **No video content:** `videos` has zero records. The schema exists; actual licensed/approved video assets, transcripts and curriculum assignments are required.
2. **No interactive symbol content:** the config column exists, but no curriculum blocks currently have configured interactive data. Author diagrams/symbol hotspots and validate a versioned config contract.
3. **No clinical cases:** case and stage tables are empty. Do not seed invented patient cases. Clinician-authored cases, review and evaluation rubrics are prerequisites.
4. **Sparse recall:** only four recall bank records exist. Build content before promoting this as a comprehensive recall bank.
5. **Collections empty:** tables exist but no curated collections have been authored.
6. **Backend work remains:** QBank discovery, custom test execution, interactive rendering and clinical simulation endpoints/pages still need to consume the database contract. This database migration does not itself create those user-facing features.

## 7. Verification performed

- Confirmed both migrations are recorded in Supabase migration history.
- Confirmed full-text search returns matches from the active published formal question pool.
- Confirmed authenticated role cannot INSERT/UPDATE clinical simulation sessions.
- Confirmed authenticated role cannot INSERT scores.
- Confirmed authenticated role cannot INSERT test-run records, but can SELECT its own run records through RLS.
- Re-ran Supabase security advisors. Existing project-wide warnings remain, including 15 RLS-enabled tables with no policies, two authenticated-callable SECURITY DEFINER advertising functions, and disabled leaked-password protection. These are pre-existing broader platform findings and need a separate targeted remediation review; this feature work does not silently modify unrelated advertising/authentication policies.

- Migration `20261115102914_freeze_test_run_provenance_and_validate_case_stages` adds immutable custom-test provenance, requires reviewer metadata for published clinical cases, and verifies simulation turn stages belong to the session's case.

## 8. Integration contract for backend

- QBank source: `quiz_questions`, filtered to `status='published'`, `is_active=true`, `is_note_practice=false`.
- QBank search: `search_vector` with the new GIN index; filter by `difficulty`, `question_type`, `unit_id`, `concept_id` and curriculum links.
- Question attempts: continue using existing quiz session/attempt APIs and `quiz_attempt_answers`; never expose answer keys in QBank listing responses.
- Custom tests: persist reusable definitions in `learning_test_blueprints` and `learning_test_blueprint_items`; create each actual run in `learning_test_runs` tied to a real `quiz_attempts` row and immutable question snapshot.
- Lesson links: use `learning_content_links` and curriculum node relationships; don't infer a lesson from free-text labels if a canonical relation exists.
- Interactive blocks: use `curriculum_unit_blocks.interactive_config`; validate a versioned JSON shape in backend and UI before rendering.
- Clinical cases: list only active published cases. Fetch stages only through authorized case/session API. Never return `lab_case_stage_evaluations` to the browser.
- Clinical simulation: backend creates sessions, advances stages, persists patient/attending/system turns, computes score and feedback, and writes final `lab_case_scores`. Client submits learner responses only.
- Media: use the existing `videos` table and `learning_content_links`; only expose active, access-authorized video resources.

This is a database foundation and audit, not a claim that every Sketchy feature is now live on the Aliver website.
