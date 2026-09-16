drop function if exists public.handle_new_user();

create or replace function public.ensure_profile(_full_name text, _phone text, _city text)
returns public.profiles
language plpgsql volatile security definer set search_path = public as $$
declare v public.profiles;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  insert into public.profiles (id, full_name, phone, city)
  values (auth.uid(), coalesce(nullif(trim(coalesce(_full_name,'')),''),''), nullif(trim(coalesce(_phone,'')),''), nullif(trim(coalesce(_city,'')),''))
  on conflict (id) do update set
    full_name = case when coalesce(nullif(trim(coalesce(_full_name,'')),'') , '') <> '' then trim(_full_name) else public.profiles.full_name end,
    phone = coalesce(nullif(trim(coalesce(_phone,'')),''), public.profiles.phone),
    city = coalesce(nullif(trim(coalesce(_city,'')),''), public.profiles.city)
  returning * into v;
  insert into public.wallets (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  return v;
end; $$;

grant execute on function public.ensure_profile(text,text,text) to authenticated;