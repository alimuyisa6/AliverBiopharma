# Sketchy-Inspired Learning Experience Audit

**Audit date:** 11 November 2026  
**Project:** Aliver Biopharma  
**Reference inspected:** the user-provided Sketchy homepage HTML. This is a marketing homepage source file, not the authenticated Sketchy application; it establishes advertised product features and page flow, not the internal implementation of every feature.

## 1. Reference experience to adapt

The reference homepage communicates one clear learning promise, supports it with proof points, offers a primary action, and lets visitors choose a programme. It then explains the learning product through connected capabilities:

- Visual lesson library and interactive symbol exploration.
- End-of-lesson knowledge checks.
- A question bank, custom test creation, and detailed answer explanations linked to lessons.
- Patient-case simulations, virtual-patient conversations, clinical reasoning and differential-building practice.
- Programme discovery, expert-created learning, educator resources, testimonials, and subscription/trial conversion.

Aliver should adopt the **product flow and clarity**, not Sketchy's brand assets, copy, illustrations, colour system, or exact layout.

## 2. Aliver capabilities already present

The current repository and connected production Supabase schema show a substantial learning platform already exists.

| Capability | Verified implementation |
| --- | --- |
| Curriculum-first navigation | Curriculum routes and navigation RPCs; 824 curriculum nodes and 868 curriculum content blocks. |
| Connected learning resources | 2,176 rows in `learning_content_links`, connecting curriculum nodes to existing resources without duplicating the resources. |
| Study notes | 489 active notes; note reader, reading progress, linked practice questions, flashcards, recall and supplementary article relationships. |
| Flashcards | 161 decks and 644 cards; session, progress and spaced-repetition support. |
| Question practice | 365 quiz-question rows; study and exam modes, question navigation, answer feedback, explanations, attempt review and teacher-marked written responses. |
| Recall practice | Recall pages, sessions and spaced-repetition infrastructure; 4 rows currently in the recall question bank. |
| Examination preparation | 8 active past papers and 9 active PDF resources. |
| Glossary | Glossary route and 3 glossary terms currently in the database. |
| Learning analytics | Dashboard, topic progress, weak-concept structures, daily challenges, XP, achievements and spaced-repetition records. |
| Additional learning/community services | AI assistant, classroom, tutor marketplace, subscriptions, donations, newsletter and advertising flows. |

The strongest existing foundation is the curriculum-to-resource relationship. A curriculum node can lead learners to several resource types, and the current database already supports many-to-many relationships. That should remain the backbone of the new experience.

## 3. Gaps that require implementation or content

| Reference capability | Current finding | Required work |
| --- | --- | --- |
| Video lessons | A video player path exists for curriculum blocks, but the `videos` table currently has 0 rows. | Add curated video content and expose it consistently in lesson/resource discovery. |
| Global question bank | Quiz practice exists and is curriculum-linked, but the current learner flow is topic/block oriented. | Add a dedicated question-bank discovery experience with meaningful filters and linked explanations. |
| Custom test builder | No complete learner-facing test-assembly flow was identified. | Build test configuration, question selection, session creation, and result review using the existing quiz integrity model. |
| Interactive symbol/diagram explorer | No dedicated learner-facing explorer route was identified. | Design a reusable, accessible visual explorer tied to curriculum concepts. |
| Patient-case simulations | `lib/lab.js` contains case, pathway, drug, interaction and scoring endpoints, but no learner-facing route/page was found. The case, stage, tool, drug, pathway and interaction tables currently contain no records. | Build the learner experience only after defining and authoring real case content. Add server-side answer validation and scoring; the existing score submission accepts a client-supplied score and must not be treated as authoritative clinical assessment. |
| Virtual patients and differential practice | No complete case conversation or differential-building experience was identified. | Build as part of the clinical simulation module, with authored clinical scenarios and controlled evaluation. |
| Curated content collections | Collection tables exist but currently contain no records. | Populate and expose curated collections only where they improve curriculum navigation. |

Empty tables are not proof that a feature is impossible; they indicate that the production content required to make it useful is not currently present.

## 4. Homepage work started

The homepage work deliberately preserves Aliver's existing hero composition, image treatment, floating learning cards, typography system and stylesheet. The changes refine the learning promise and supporting copy, and connect the primary action to the learner's selected curriculum when one is available. The programme-specific resource cards now preserve their resource intent as the learner enters the curriculum.

The existing programme discovery, learning-process, testimonial, pricing, dashboard and resource components remain the foundation. This is an integration and refinement pass, not a replacement homepage or a transplanted Sketchy page. No new CSS file, backend endpoint, database migration, or external Sketchy asset was introduced.

## 5. Recommended implementation order

1. **Complete the homepage and resource-discovery flow.** Make the curriculum the primary entry point and ensure each visible resource action opens the correct destination. Resource focus is now carried into the lesson's connected-learning sequence and the selected resource stage is prioritised.
2. **Upgrade question practice.** The existing Quizzes entry is now presented as Question Bank, accurately reflecting its curriculum-linked question practice, study/exam modes and answer explanations. Add a dedicated global question-bank discovery flow and a custom test builder while preserving existing quiz session integrity, answer explanations and review behaviour.
3. **Connect lesson media.** Add the video lesson experience after content is available; keep video resources linked to curriculum nodes.
4. **Build clinical application.** Implement case listings, case sessions, virtual-patient interaction and differential practice only with authored cases and server-side grading.
5. **Add interactive visual learning.** Build a reusable symbol/diagram explorer tied to the relevant curriculum topics.
6. **Connect recommendations.** Use existing reading, quiz, recall and progress records to recommend the next useful learning action.

## 6. Guardrails

- Preserve Aliver's existing Supabase schema and backend contracts unless the audit proves a specific extension is required.
- Keep the existing CSS architecture; do not create new CSS files for this work.
- Use Aliver's palette with solid section colours and white cards; do not introduce gradients.
- Cards containing actions must not become whole-card links. Keep links/buttons as explicit interactive areas.
- Do not advertise videos, clinical cases or custom tests as available until the content and complete user journey are functional.
- Verify each new flow from curriculum node → backend/API → resource record → learner action → persisted progress/result.
- Keep the existing external-JavaScript refactor PR chain intact; this feature branch is based on its latest open branch rather than bypassing it.
