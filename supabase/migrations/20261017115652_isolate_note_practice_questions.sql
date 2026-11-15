-- Isolate note-comprehension checks within the existing question bank.
-- Identify the curated rows by stable question text, not generated row IDs or timestamps.
begin;

alter table public.quiz_questions
  add column if not exists is_note_practice boolean not null default false;

comment on column public.quiz_questions.is_note_practice is
  'True for no-XP comprehension checks shown inside note learning. Formal quizzes, challenges and review exclude these rows.';

update public.quiz_questions
set is_note_practice = true
where status = 'published'
  and question_text in (
    'During the light-dependent reactions of photosynthesis, which substance is split and releases oxygen?',
    'What is the main role of ATP and NADPH produced in the light-dependent reactions?',
    'A student increases light intensity but the rate of photosynthesis no longer rises. What is the best explanation?',
    'Which statement best describes negative feedback in homeostasis?',
    'After a meal, which hormone is released by pancreatic beta cells to help lower blood glucose?',
    'When the body needs to conserve water, increased ADH action causes the kidneys to:',
    'In a simple complete-dominance cross Tt × Tt, what genotype ratio is expected?',
    'What is the difference between genotype and phenotype?',
    'Which process exchanges DNA between non-sister chromatids of homologous chromosomes during meiosis?',
    'How do enzymes increase the rate of a chemical reaction?',
    'Why may enzyme activity fall sharply above its temperature optimum?',
    'In the simple reversible competitive-inhibition model, what happens when substrate concentration is increased sufficiently?',
    'A test cross yields 180 recombinant offspring among 1,000 total offspring. What is the recombination frequency?',
    'Why can observed recombination frequency underestimate the distance between genes that are far apart on a chromosome?',
    'Which offspring classes are generally expected to be most frequent in a simple linked-gene test cross?',
    'Which statement correctly distinguishes potency from efficacy?',
    'A partial agonist differs from a full agonist because it:',
    'Which factor is most appropriate when selecting a medicine for an individual patient?',
    'A solution contains 250 mg in 5 mL. What is its concentration?',
    'A verified educational example requires 100 mg and the supplied concentration is 50 mg/mL. What volume gives that mass?',
    'Which conversion is correct?'
  );

create index if not exists idx_quiz_questions_note_practice_pool
  on public.quiz_questions (unit_id, id)
  where is_note_practice = true and is_active = true and status = 'published';

commit;
