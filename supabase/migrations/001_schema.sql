-- ============================================================
-- KotlinEval — Schema completo Supabase
-- Esegui questo file nell'SQL Editor di Supabase
-- ============================================================

-- ── 1. ENUM TYPES ────────────────────────────────────────────
create type user_role    as enum ('admin', 'student');
create type difficulty   as enum ('easy', 'medium', 'hard');
create type sub_status   as enum ('pending', 'graded');

-- ── 2. PROFILES ──────────────────────────────────────────────
-- Estende auth.users con ruolo e nome
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        user_role not null default 'student',
  created_at  timestamptz not null default now()
);

-- Trigger: crea automaticamente il profilo quando si registra un utente
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'student'  -- tutti i nuovi utenti sono student di default
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 3. EXERCISES ─────────────────────────────────────────────
create table public.exercises (
  id             uuid primary key default gen_random_uuid(),
  created_by     uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  description    text not null default '',
  test_file_url  text,
  difficulty     difficulty not null default 'easy',
  is_published   boolean not null default false,
  deadline       timestamptz,
  created_at     timestamptz not null default now()
);

-- ── 4. CRITERIA ──────────────────────────────────────────────
-- Criteri di valutazione per ogni esercizio
create table public.criteria (
  id           uuid primary key default gen_random_uuid(),
  exercise_id  uuid not null references public.exercises(id) on delete cascade,
  label        text not null,          -- es. "Correttezza logica"
  max_points   integer not null check (max_points > 0),
  "order"      integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ── 5. SUBMISSIONS ───────────────────────────────────────────
create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  exercise_id   uuid not null references public.exercises(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  main_code     text not null default '',
  test_code     text not null default '',
  status        sub_status not null default 'pending',
  submitted_at  timestamptz not null default now(),
  unique(exercise_id, student_id)  -- uno studente può inviare una sola volta per esercizio
);

-- ── 6. GRADES ────────────────────────────────────────────────
create table public.grades (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references public.submissions(id) on delete cascade unique,
  graded_by      uuid not null references public.profiles(id),
  total_score    integer not null default 0 check (total_score >= 0),
  comment        text not null default '',
  graded_at      timestamptz not null default now()
);

-- ── 7. CRITERION GRADES ──────────────────────────────────────
-- Punteggio per ogni singolo criterio
create table public.criterion_grades (
  id            uuid primary key default gen_random_uuid(),
  grade_id      uuid not null references public.grades(id) on delete cascade,
  criterion_id  uuid not null references public.criteria(id) on delete cascade,
  points        integer not null default 0 check (points >= 0),
  unique(grade_id, criterion_id)
);

-- ── 8. ROW LEVEL SECURITY ────────────────────────────────────

-- Abilita RLS su tutte le tabelle
alter table public.profiles         enable row level security;
alter table public.exercises        enable row level security;
alter table public.criteria         enable row level security;
alter table public.submissions      enable row level security;
alter table public.grades           enable row level security;
alter table public.criterion_grades enable row level security;

-- Helper: verifica se l'utente corrente è admin
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── PROFILES policies ─────────────────────────────────────────
create policy "Profilo visibile a se stesso"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "Aggiornamento profilo proprio"
  on public.profiles for update
  using (id = auth.uid());

create policy "Admin vede tutti i profili"
  on public.profiles for select
  using (public.is_admin());

-- ── EXERCISES policies ────────────────────────────────────────
create policy "Student vede esercizi pubblicati"
  on public.exercises for select
  using (is_published = true or public.is_admin());

create policy "Admin CRUD esercizi"
  on public.exercises for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── CRITERIA policies ─────────────────────────────────────────
create policy "Chiunque autenticato vede i criteri"
  on public.criteria for select
  using (auth.uid() is not null);

create policy "Admin CRUD criteri"
  on public.criteria for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── SUBMISSIONS policies ──────────────────────────────────────
create policy "Student vede solo i propri invii"
  on public.submissions for select
  using (student_id = auth.uid() or public.is_admin());

create policy "Student può inserire invii propri"
  on public.submissions for insert
  with check (student_id = auth.uid());

create policy "Student può aggiornare invii propri non ancora valutati"
  on public.submissions for update
  using (student_id = auth.uid() and status = 'pending');

create policy "Admin aggiorna status invii"
  on public.submissions for update
  using (public.is_admin());

create policy "Admin vede tutti gli invii"
  on public.submissions for select
  using (public.is_admin());

-- ── GRADES policies ───────────────────────────────────────────
create policy "Student vede il proprio voto"
  on public.grades for select
  using (
    public.is_admin() or
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.student_id = auth.uid()
    )
  );

create policy "Admin CRUD voti"
  on public.grades for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── CRITERION GRADES policies ─────────────────────────────────
create policy "Student vede i propri punteggi per criterio"
  on public.criterion_grades for select
  using (
    public.is_admin() or
    exists (
      select 1 from public.grades g
      join public.submissions s on s.id = g.submission_id
      where g.id = grade_id and s.student_id = auth.uid()
    )
  );

create policy "Admin CRUD punteggi per criterio"
  on public.criterion_grades for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 9. INDICI per performance ────────────────────────────────
create index on public.exercises(is_published);
create index on public.submissions(student_id);
create index on public.submissions(exercise_id);
create index on public.submissions(status);
create index on public.criteria(exercise_id, "order");
create index on public.criterion_grades(grade_id);

-- ── 10. PROMUOVI UN UTENTE AD ADMIN ──────────────────────────
-- Esegui questo dopo aver creato il primo account:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'uuid-del-tuo-utente';
