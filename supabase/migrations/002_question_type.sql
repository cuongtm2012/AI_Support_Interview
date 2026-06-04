-- SPEC v2.4: question type on questions table
alter table public.questions
  add column if not exists question_type text;

comment on column public.questions.question_type is
  'behavioral | technical | situational | competency';
