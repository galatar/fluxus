-- Esquemas de Fluxus: una fila por esquema, con el esquema entero en `datos`.
-- Cada persona solo ve, cambia y borra los suyos (RLS).

create table public.esquemas (
  id uuid primary key,
  propietario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  datos jsonb not null,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create index esquemas_propietario_idx on public.esquemas (propietario);

alter table public.esquemas enable row level security;

create policy "Cada persona ve sus esquemas" on public.esquemas
  for select to authenticated using (propietario = (select auth.uid()));
create policy "Cada persona crea sus esquemas" on public.esquemas
  for insert to authenticated with check (propietario = (select auth.uid()));
create policy "Cada persona cambia sus esquemas" on public.esquemas
  for update to authenticated using (propietario = (select auth.uid())) with check (propietario = (select auth.uid()));
create policy "Cada persona borra sus esquemas" on public.esquemas
  for delete to authenticated using (propietario = (select auth.uid()));
