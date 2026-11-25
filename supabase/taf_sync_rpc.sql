-- ============================================================================
-- QG da PRF • TAF (App Android) — RPCs seguras de sincronização no Supabase
-- ----------------------------------------------------------------------------
-- Execute este script UMA VEZ no SQL Editor do seu projeto Supabase:
--   Dashboard -> SQL Editor -> New query -> Colar e clicar em Run.
--
-- O que ele faz:
--   1. get_taf_sync_payload(): lê apenas tafHistory, tafTrainingStatus e
--      tafAppData do usuário autenticado (auth.uid()).
--   2. sync_taf_payload(...): atualiza atomicamente APENAS essas 3 chaves
--      dentro de profiles.full_data, preservando 100% dos seus dados de
--      estudo (subjects, reviews, cycle, simulados, lifeRoutine, etc.).
-- ============================================================================

create or replace function public.get_taf_sync_payload()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  select *
    into v_row
    from public.profiles
   where id = v_user_id
   limit 1;

  if not found then
    return jsonb_build_object(
      'tafHistory', '[]'::jsonb,
      'tafTrainingStatus', '{}'::jsonb,
      'tafAppData', '{}'::jsonb,
      'updatedAt', null
    );
  end if;

  return jsonb_build_object(
    'tafHistory', coalesce(v_row.full_data->'tafHistory', '[]'::jsonb),
    'tafTrainingStatus', coalesce(v_row.full_data->'tafTrainingStatus', '{}'::jsonb),
    'tafAppData', coalesce(v_row.full_data->'tafAppData', '{}'::jsonb),
    'updatedAt', v_row.updated_at
  );
end;
$$;

create or replace function public.sync_taf_payload(
  p_taf_history jsonb default '[]'::jsonb,
  p_taf_training_status jsonb default '{}'::jsonb,
  p_taf_app_data jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_updated_at timestamptz;
  v_patch jsonb;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  v_patch := jsonb_build_object(
    'tafHistory', coalesce(p_taf_history, '[]'::jsonb),
    'tafTrainingStatus', coalesce(p_taf_training_status, '{}'::jsonb),
    'tafAppData', coalesce(p_taf_app_data, '{}'::jsonb)
  );

  insert into public.profiles (id, full_data, updated_at)
  values (v_user_id, v_patch, now())
  on conflict (id) do update
  set
    full_data = coalesce(public.profiles.full_data, '{}'::jsonb) || v_patch,
    updated_at = now()
  returning updated_at into v_updated_at;

  return jsonb_build_object(
    'ok', true,
    'updatedAt', v_updated_at
  );
end;
$$;

revoke all on function public.get_taf_sync_payload() from public;
grant execute on function public.get_taf_sync_payload() to authenticated;

revoke all on function public.sync_taf_payload(jsonb, jsonb, jsonb) from public;
grant execute on function public.sync_taf_payload(jsonb, jsonb, jsonb) to authenticated;
