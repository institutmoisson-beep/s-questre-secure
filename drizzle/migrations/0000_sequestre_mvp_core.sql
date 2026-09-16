-- ============ ENUMS ============
create type public.app_role as enum ('admin', 'courier', 'agent');
create type public.order_status as enum (
  'pending_deposit','funds_locked','seller_confirmed','in_transit',
  'delivered','cancelled_pending_refund','refunded','disputed'
);
create type public.escrow_point_type as enum ('mobile_money','push_ci','both');
create type public.escrow_point_status as enum ('pending','approved','suspended');
create type public.wallet_tx_type as enum ('credit','debit','withdrawal','refund','commission');
create type public.withdrawal_method as enum ('mobile_money','push_ci');
create type public.withdrawal_status as enum ('pending','completed','rejected');
create type public.dispute_status as enum ('open','resolved');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  phone text,
  city text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ============ ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "profiles: self or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "profiles: update self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "roles: self or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- new user -> profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end; $$;

-- ============ SETTINGS ============
create table public.platform_settings (
  id boolean primary key default true check (id),
  platform_commission_percentage numeric(5,2) not null default 3.00,
  default_escrow_commission_percentage numeric(5,2) not null default 2.00,
  updated_at timestamptz not null default now()
);
grant select on public.platform_settings to authenticated, anon;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
create policy "settings: readable" on public.platform_settings for select to authenticated, anon using (true);
insert into public.platform_settings (id) values (true);

-- ============ SELLERS ============
create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  full_name text not null,
  city text not null,
  seller_code text not null unique,
  claimed_by_user_id uuid,
  reputation_score numeric(4,2) not null default 5.00,
  completed_orders integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.sellers to authenticated;
grant all on public.sellers to service_role;
alter table public.sellers enable row level security;
create policy "sellers: readable by authenticated" on public.sellers for select to authenticated using (true);

-- ============ ESCROW POINTS ============
create table public.escrow_points (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  business_name text not null,
  type public.escrow_point_type not null default 'both',
  id_document_url text,
  business_registry_url text,
  phone text not null,
  city text not null,
  neighborhood text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  status public.escrow_point_status not null default 'pending',
  commission_percentage numeric(5,2) not null default 2.00,
  created_at timestamptz not null default now()
);
grant select on public.escrow_points to authenticated;
grant all on public.escrow_points to service_role;
alter table public.escrow_points enable row level security;
create policy "escrow_points: approved, own or admin" on public.escrow_points for select to authenticated
  using (status = 'approved' or owner_user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- ============ WALLETS ============
create table public.wallets (
  user_id uuid primary key,
  balance_xof bigint not null default 0 check (balance_xof >= 0),
  updated_at timestamptz not null default now()
);
grant select on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
create policy "wallets: self or admin" on public.wallets for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- ============ ORDERS ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  buyer_id uuid not null,
  seller_id uuid not null references public.sellers(id),
  escrow_point_id uuid not null references public.escrow_points(id),
  courier_id uuid,
  product_title text not null,
  product_description text,
  product_price_xof bigint not null check (product_price_xof > 0),
  delivery_fee_xof bigint not null default 0 check (delivery_fee_xof >= 0),
  product_image_urls text[] not null default '{}',
  source_link text,
  status public.order_status not null default 'pending_deposit',
  seller_otp text,
  buyer_otp text,
  funds_locked_at timestamptz,
  seller_confirmed_at timestamptz,
  picked_up_at timestamptz,
  delivery_confirmed_at timestamptz,
  cancellation_deadline timestamptz,
  refund_amount_xof bigint,
  platform_commission_xof bigint,
  escrow_commission_xof bigint,
  seller_payout_xof bigint,
  created_at timestamptz not null default now()
);
create index orders_buyer_idx on public.orders (buyer_id);
create index orders_seller_idx on public.orders (seller_id);
create index orders_point_idx on public.orders (escrow_point_id);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;

create or replace function public.can_view_order(_order_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.orders o
    left join public.sellers s on s.id = o.seller_id
    left join public.escrow_points e on e.id = o.escrow_point_id
    where o.id = _order_id
      and (
        o.buyer_id = auth.uid()
        or o.courier_id = auth.uid()
        or s.claimed_by_user_id = auth.uid()
        or e.owner_user_id = auth.uid()
        or public.has_role(auth.uid(), 'admin')
        or (public.has_role(auth.uid(), 'courier') and o.status in ('seller_confirmed','in_transit'))
      )
  )
$$;

create policy "orders: participants" on public.orders for select to authenticated
  using (public.can_view_order(id));

-- ============ STATUS HISTORY ============
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  changed_by uuid,
  note text,
  created_at timestamptz not null default now()
);
grant select on public.order_status_history to authenticated;
grant all on public.order_status_history to service_role;
alter table public.order_status_history enable row level security;
create policy "history: order participants" on public.order_status_history for select to authenticated
  using (public.can_view_order(order_id));

-- ============ WALLET TRANSACTIONS ============
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_user_id uuid not null,
  order_id uuid references public.orders(id) on delete set null,
  type public.wallet_tx_type not null,
  amount_xof bigint not null,
  description text not null default '',
  created_at timestamptz not null default now()
);
create index wallet_tx_user_idx on public.wallet_transactions (wallet_user_id);
grant select on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;
alter table public.wallet_transactions enable row level security;
create policy "wallet_tx: self or admin" on public.wallet_transactions for select to authenticated
  using (wallet_user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- ============ WITHDRAWALS ============
create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount_xof bigint not null check (amount_xof > 0),
  method public.withdrawal_method not null,
  destination_phone text,
  pickup_code text,
  status public.withdrawal_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
grant select on public.withdrawal_requests to authenticated;
grant all on public.withdrawal_requests to service_role;
alter table public.withdrawal_requests enable row level security;
create policy "withdrawals: self or admin" on public.withdrawal_requests for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- ============ DISPUTES ============
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  raised_by uuid not null,
  reason text not null,
  status public.dispute_status not null default 'open',
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
grant select on public.disputes to authenticated;
grant all on public.disputes to service_role;
alter table public.disputes enable row level security;
create policy "disputes: participants or admin" on public.disputes for select to authenticated
  using (public.can_view_order(order_id));

-- ============ HELPERS ============
create or replace function public.gen_code(_prefix text, _len integer)
returns text language plpgsql volatile security definer set search_path = public as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
  i integer;
begin
  for i in 1.._len loop
    out := out || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return _prefix || out;
end; $$;

create or replace function public.gen_otp()
returns text language sql volatile security definer set search_path = public as $$
  select lpad(floor(random() * 1000000)::text, 6, '0')
$$;

create or replace function public.log_status(_order_id uuid, _status public.order_status, _note text)
returns void language sql volatile security definer set search_path = public as $$
  insert into public.order_status_history (order_id, status, changed_by, note)
  values (_order_id, _status, auth.uid(), _note)
$$;

create or replace function public.credit_wallet(_user_id uuid, _amount bigint, _order_id uuid, _type public.wallet_tx_type, _desc text)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  insert into public.wallets (user_id, balance_xof) values (_user_id, 0) on conflict (user_id) do nothing;
  update public.wallets set balance_xof = balance_xof + _amount, updated_at = now() where user_id = _user_id;
  insert into public.wallet_transactions (wallet_user_id, order_id, type, amount_xof, description)
  values (_user_id, _order_id, _type, _amount, _desc);
end; $$;

-- ============ RPC: CREATE ORDER ============
create or replace function public.create_escrow_order(
  _product_title text,
  _product_description text,
  _product_price_xof bigint,
  _delivery_fee_xof bigint,
  _product_image_urls text[],
  _source_link text,
  _seller_name text,
  _seller_phone text,
  _seller_city text,
  _escrow_point_id uuid
) returns public.orders
language plpgsql volatile security definer set search_path = public as $$
declare
  v_seller public.sellers;
  v_order public.orders;
  v_code text;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  if coalesce(trim(_product_title),'') = '' then raise exception 'Titre du produit requis'; end if;
  if _product_price_xof is null or _product_price_xof <= 0 then raise exception 'Prix invalide'; end if;
  if coalesce(trim(_seller_phone),'') = '' then raise exception 'Téléphone du vendeur requis'; end if;
  if coalesce(array_length(_product_image_urls,1),0) > 5 then raise exception 'Maximum 5 photos'; end if;
  if not exists (select 1 from public.escrow_points where id = _escrow_point_id and status = 'approved') then
    raise exception 'Point d''escrow invalide ou non approuvé';
  end if;

  select * into v_seller from public.sellers where phone = trim(_seller_phone);
  if v_seller.id is null then
    loop
      v_code := public.gen_code('VND-', 6);
      exit when not exists (select 1 from public.sellers where seller_code = v_code);
    end loop;
    insert into public.sellers (phone, full_name, city, seller_code)
    values (trim(_seller_phone), coalesce(nullif(trim(_seller_name),''),'Vendeur'), coalesce(nullif(trim(_seller_city),''),'Abidjan'), v_code)
    returning * into v_seller;
  end if;

  loop
    v_code := public.gen_code('SEQ-', 6);
    exit when not exists (select 1 from public.orders where order_code = v_code);
  end loop;

  insert into public.orders (
    order_code, buyer_id, seller_id, escrow_point_id, product_title, product_description,
    product_price_xof, delivery_fee_xof, product_image_urls, source_link, status
  ) values (
    v_code, auth.uid(), v_seller.id, _escrow_point_id, trim(_product_title), nullif(trim(coalesce(_product_description,'')),''),
    _product_price_xof, coalesce(_delivery_fee_xof,0), coalesce(_product_image_urls,'{}'), nullif(trim(coalesce(_source_link,'')),''),
    'pending_deposit'
  ) returning * into v_order;

  perform public.log_status(v_order.id, 'pending_deposit', 'Commande créée par l''acheteur');
  return v_order;
end; $$;

-- ============ RPC: AGENT LOCKS FUNDS ============
create or replace function public.agent_confirm_deposit(_order_code text)
returns public.orders
language plpgsql volatile security definer set search_path = public as $$
declare v_order public.orders; v_point public.escrow_points;
begin
  select * into v_order from public.orders where order_code = upper(trim(_order_code));
  if v_order.id is null then raise exception 'Commande introuvable'; end if;
  select * into v_point from public.escrow_points where id = v_order.escrow_point_id;
  if v_point.owner_user_id <> auth.uid() or v_point.status <> 'approved' then
    raise exception 'Vous n''êtes pas le point d''escrow de cette commande';
  end if;
  if v_order.status <> 'pending_deposit' then raise exception 'Cette commande n''attend pas de dépôt'; end if;

  update public.orders set
    status = 'funds_locked',
    funds_locked_at = now(),
    buyer_otp = public.gen_otp(),
    cancellation_deadline = now() + interval '7 days'
  where id = v_order.id returning * into v_order;

  perform public.log_status(v_order.id, 'funds_locked', 'Dépôt cash reçu, fonds verrouillés');
  return v_order;
end; $$;

-- ============ RPC: SELLER CLAIM ============
create or replace function public.claim_seller_account(_phone text, _seller_code text)
returns public.sellers
language plpgsql volatile security definer set search_path = public as $$
declare v_seller public.sellers;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select * into v_seller from public.sellers
   where phone = trim(_phone) and seller_code = upper(trim(_seller_code));
  if v_seller.id is null then raise exception 'Téléphone ou code vendeur incorrect'; end if;
  if v_seller.claimed_by_user_id is not null and v_seller.claimed_by_user_id <> auth.uid() then
    raise exception 'Cette fiche vendeur est déjà rattachée à un autre compte';
  end if;
  update public.sellers set claimed_by_user_id = auth.uid() where id = v_seller.id returning * into v_seller;
  return v_seller;
end; $$;

-- ============ RPC: SELLER CONFIRMS HANDOVER ============
create or replace function public.seller_confirm_handover(_order_id uuid)
returns public.orders
language plpgsql volatile security definer set search_path = public as $$
declare v_order public.orders;
begin
  select o.* into v_order from public.orders o
    join public.sellers s on s.id = o.seller_id
   where o.id = _order_id and s.claimed_by_user_id = auth.uid();
  if v_order.id is null then raise exception 'Commande introuvable pour ce vendeur'; end if;
  if v_order.status <> 'funds_locked' then raise exception 'Les fonds ne sont pas encore verrouillés'; end if;

  update public.orders set status = 'seller_confirmed', seller_confirmed_at = now(), seller_otp = public.gen_otp()
   where id = v_order.id returning * into v_order;
  perform public.log_status(v_order.id, 'seller_confirmed', 'Vendeur prêt à remettre le produit au livreur');
  return v_order;
end; $$;

-- ============ RPC: COURIER PICKUP ============
create or replace function public.courier_pickup(_order_code text, _otp text)
returns public.orders
language plpgsql volatile security definer set search_path = public as $$
declare v_order public.orders;
begin
  if not public.has_role(auth.uid(), 'courier') then raise exception 'Compte livreur requis'; end if;
  select * into v_order from public.orders where order_code = upper(trim(_order_code));
  if v_order.id is null then raise exception 'Commande introuvable'; end if;
  if v_order.status <> 'seller_confirmed' then raise exception 'Cette commande n''est pas prête pour la prise en charge'; end if;
  if v_order.seller_otp is null or v_order.seller_otp <> trim(_otp) then raise exception 'Code vendeur incorrect'; end if;

  update public.orders set status = 'in_transit', courier_id = auth.uid(), picked_up_at = now(), seller_otp = null
   where id = v_order.id returning * into v_order;
  perform public.log_status(v_order.id, 'in_transit', 'Produit pris en charge par le livreur');
  return v_order;
end; $$;

-- ============ RPC: COURIER DELIVERS (RELEASES FUNDS) ============
create or replace function public.courier_confirm_delivery(_order_code text, _otp text)
returns public.orders
language plpgsql volatile security definer set search_path = public as $$
declare
  v_order public.orders; v_point public.escrow_points; v_seller public.sellers;
  v_settings public.platform_settings; v_total bigint;
  v_platform bigint; v_escrow bigint; v_payout bigint;
begin
  if not public.has_role(auth.uid(), 'courier') then raise exception 'Compte livreur requis'; end if;
  select * into v_order from public.orders where order_code = upper(trim(_order_code));
  if v_order.id is null then raise exception 'Commande introuvable'; end if;
  if v_order.courier_id <> auth.uid() then raise exception 'Cette course ne vous est pas attribuée'; end if;
  if v_order.status <> 'in_transit' then raise exception 'Cette commande n''est pas en livraison'; end if;
  if v_order.buyer_otp is null or v_order.buyer_otp <> trim(_otp) then raise exception 'Code acheteur incorrect'; end if;

  select * into v_settings from public.platform_settings where id = true;
  select * into v_point from public.escrow_points where id = v_order.escrow_point_id;
  select * into v_seller from public.sellers where id = v_order.seller_id;

  v_total := v_order.product_price_xof;
  v_platform := floor(v_total * v_settings.platform_commission_percentage / 100)::bigint;
  v_escrow := floor(v_total * v_point.commission_percentage / 100)::bigint;
  v_payout := v_total - v_platform - v_escrow;

  update public.orders set
    status = 'delivered', delivery_confirmed_at = now(), buyer_otp = null,
    platform_commission_xof = v_platform, escrow_commission_xof = v_escrow, seller_payout_xof = v_payout
   where id = v_order.id returning * into v_order;

  if v_seller.claimed_by_user_id is not null then
    perform public.credit_wallet(v_seller.claimed_by_user_id, v_payout, v_order.id, 'credit',
      'Vente livrée ' || v_order.order_code);
  end if;
  perform public.credit_wallet(v_point.owner_user_id, v_escrow, v_order.id, 'commission',
    'Commission point d''escrow ' || v_order.order_code);

  update public.sellers set completed_orders = completed_orders + 1 where id = v_seller.id;
  perform public.log_status(v_order.id, 'delivered', 'Livraison confirmée par l''acheteur (double OTP)');
  return v_order;
end; $$;

-- ============ RPC: CANCEL / REFUND ============
create or replace function public.cancel_order(_order_id uuid, _reason text)
returns public.orders
language plpgsql volatile security definer set search_path = public as $$
declare v_order public.orders; v_is_admin boolean;
begin
  v_is_admin := public.has_role(auth.uid(), 'admin');
  select * into v_order from public.orders where id = _order_id;
  if v_order.id is null then raise exception 'Commande introuvable'; end if;
  if not v_is_admin and v_order.buyer_id <> auth.uid() then raise exception 'Non autorisé'; end if;
  if v_order.status in ('delivered','refunded','cancelled_pending_refund') then
    raise exception 'Cette commande ne peut plus être annulée';
  end if;

  if v_order.status = 'pending_deposit' then
    update public.orders set status = 'refunded', refund_amount_xof = 0 where id = v_order.id returning * into v_order;
    perform public.log_status(v_order.id, 'refunded', coalesce(_reason,'Annulée avant dépôt'));
  else
    update public.orders set status = 'refunded', refund_amount_xof = v_order.product_price_xof, buyer_otp = null, seller_otp = null
     where id = v_order.id returning * into v_order;
    perform public.credit_wallet(v_order.buyer_id, v_order.product_price_xof, v_order.id, 'refund',
      'Remboursement ' || v_order.order_code);
    perform public.log_status(v_order.id, 'refunded', coalesce(_reason,'Annulée, fonds remboursés à l''acheteur'));
  end if;
  return v_order;
end; $$;

-- ============ RPC: ESCROW POINT REGISTRATION ============
create or replace function public.register_escrow_point(
  _business_name text, _type public.escrow_point_type, _phone text, _city text,
  _neighborhood text, _id_document_url text, _business_registry_url text
) returns public.escrow_points
language plpgsql volatile security definer set search_path = public as $$
declare v_point public.escrow_points; v_default numeric;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  if exists (select 1 from public.escrow_points where owner_user_id = auth.uid()) then
    raise exception 'Vous avez déjà un point d''escrow enregistré';
  end if;
  if coalesce(trim(_business_name),'') = '' or coalesce(trim(_phone),'') = '' then
    raise exception 'Nom commercial et téléphone requis';
  end if;
  if coalesce(trim(_id_document_url),'') = '' and coalesce(trim(_business_registry_url),'') = '' then
    raise exception 'Une pièce d''identité ou un registre de commerce est requis';
  end if;
  select default_escrow_commission_percentage into v_default from public.platform_settings where id = true;

  insert into public.escrow_points (owner_user_id, business_name, type, phone, city, neighborhood,
    id_document_url, business_registry_url, commission_percentage)
  values (auth.uid(), trim(_business_name), _type, trim(_phone), trim(_city), trim(_neighborhood),
    nullif(trim(coalesce(_id_document_url,'')),''), nullif(trim(coalesce(_business_registry_url,'')),''), v_default)
  returning * into v_point;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'agent') on conflict do nothing;
  return v_point;
end; $$;

-- ============ RPC: WITHDRAWALS ============
create or replace function public.request_withdrawal(_amount_xof bigint, _method public.withdrawal_method, _destination_phone text)
returns public.withdrawal_requests
language plpgsql volatile security definer set search_path = public as $$
declare v_balance bigint; v_req public.withdrawal_requests; v_code text;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  if _amount_xof is null or _amount_xof <= 0 then raise exception 'Montant invalide'; end if;
  select balance_xof into v_balance from public.wallets where user_id = auth.uid();
  if coalesce(v_balance,0) < _amount_xof then raise exception 'Solde insuffisant'; end if;
  if _method = 'mobile_money' and coalesce(trim(_destination_phone),'') = '' then
    raise exception 'Numéro Mobile Money requis';
  end if;
  if _method = 'push_ci' then v_code := public.gen_code('RET-', 6); end if;

  update public.wallets set balance_xof = balance_xof - _amount_xof, updated_at = now() where user_id = auth.uid();
  insert into public.wallet_transactions (wallet_user_id, type, amount_xof, description)
  values (auth.uid(), 'withdrawal', -_amount_xof, 'Demande de retrait');

  insert into public.withdrawal_requests (user_id, amount_xof, method, destination_phone, pickup_code)
  values (auth.uid(), _amount_xof, _method, nullif(trim(coalesce(_destination_phone,'')),''), v_code)
  returning * into v_req;
  return v_req;
end; $$;

-- ============ RPC: ADMIN ============
create or replace function public.admin_set_escrow_point_status(_point_id uuid, _status public.escrow_point_status)
returns public.escrow_points
language plpgsql volatile security definer set search_path = public as $$
declare v_point public.escrow_points;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Accès administrateur requis'; end if;
  update public.escrow_points set status = _status where id = _point_id returning * into v_point;
  if v_point.id is null then raise exception 'Point introuvable'; end if;
  return v_point;
end; $$;

create or replace function public.admin_update_settings(_platform numeric, _escrow numeric)
returns public.platform_settings
language plpgsql volatile security definer set search_path = public as $$
declare v public.platform_settings;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Accès administrateur requis'; end if;
  update public.platform_settings set platform_commission_percentage = _platform,
    default_escrow_commission_percentage = _escrow, updated_at = now()
   where id = true returning * into v;
  return v;
end; $$;

create or replace function public.raise_dispute(_order_id uuid, _reason text)
returns public.disputes
language plpgsql volatile security definer set search_path = public as $$
declare v_d public.disputes;
begin
  if not public.can_view_order(_order_id) then raise exception 'Non autorisé'; end if;
  if coalesce(trim(_reason),'') = '' then raise exception 'Motif requis'; end if;
  insert into public.disputes (order_id, raised_by, reason) values (_order_id, auth.uid(), trim(_reason))
  returning * into v_d;
  update public.orders set status = 'disputed' where id = _order_id and status not in ('delivered','refunded');
  perform public.log_status(_order_id, 'disputed', trim(_reason));
  return v_d;
end; $$;

create or replace function public.admin_resolve_dispute(_dispute_id uuid, _admin_note text)
returns public.disputes
language plpgsql volatile security definer set search_path = public as $$
declare v_d public.disputes;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Accès administrateur requis'; end if;
  update public.disputes set status = 'resolved', admin_note = _admin_note, resolved_at = now()
   where id = _dispute_id returning * into v_d;
  return v_d;
end; $$;

create or replace function public.admin_set_withdrawal_status(_id uuid, _status public.withdrawal_status)
returns public.withdrawal_requests
language plpgsql volatile security definer set search_path = public as $$
declare v public.withdrawal_requests;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Accès administrateur requis'; end if;
  select * into v from public.withdrawal_requests where id = _id;
  if v.id is null then raise exception 'Demande introuvable'; end if;
  if v.status <> 'pending' then raise exception 'Demande déjà traitée'; end if;
  if _status = 'rejected' then
    perform public.credit_wallet(v.user_id, v.amount_xof, null, 'credit', 'Retrait rejeté, montant restitué');
  end if;
  update public.withdrawal_requests set status = _status, resolved_at = now() where id = _id returning * into v;
  return v;
end; $$;

create or replace function public.admin_list_orders()
returns setof public.orders
language sql stable security definer set search_path = public as $$
  select * from public.orders
   where public.has_role(auth.uid(), 'admin')
   order by created_at desc
$$;

-- ============ COURIER JOB BOARD ============
create or replace function public.courier_jobs()
returns setof public.orders
language sql stable security definer set search_path = public as $$
  select * from public.orders
   where public.has_role(auth.uid(), 'courier')
     and (status = 'seller_confirmed' or (status = 'in_transit' and courier_id = auth.uid()))
   order by created_at desc
$$;

-- ============ SELF-SERVICE ROLE (COURIER SIGNUP) ============
create or replace function public.become_courier()
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'courier') on conflict do nothing;
end; $$;

-- ============ EXECUTE GRANTS ============
revoke all on function public.gen_code(text,integer) from public, anon, authenticated;
revoke all on function public.gen_otp() from public, anon, authenticated;
revoke all on function public.log_status(uuid, public.order_status, text) from public, anon, authenticated;
revoke all on function public.credit_wallet(uuid,bigint,uuid,public.wallet_tx_type,text) from public, anon, authenticated;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.can_view_order(uuid) to authenticated;
grant execute on function public.create_escrow_order(text,text,bigint,bigint,text[],text,text,text,text,uuid) to authenticated;
grant execute on function public.agent_confirm_deposit(text) to authenticated;
grant execute on function public.claim_seller_account(text,text) to authenticated;
grant execute on function public.seller_confirm_handover(uuid) to authenticated;
grant execute on function public.courier_pickup(text,text) to authenticated;
grant execute on function public.courier_confirm_delivery(text,text) to authenticated;
grant execute on function public.cancel_order(uuid,text) to authenticated;
grant execute on function public.register_escrow_point(text,public.escrow_point_type,text,text,text,text,text) to authenticated;
grant execute on function public.request_withdrawal(bigint,public.withdrawal_method,text) to authenticated;
grant execute on function public.admin_set_escrow_point_status(uuid,public.escrow_point_status) to authenticated;
grant execute on function public.admin_update_settings(numeric,numeric) to authenticated;
grant execute on function public.raise_dispute(uuid,text) to authenticated;
grant execute on function public.admin_resolve_dispute(uuid,text) to authenticated;
grant execute on function public.admin_set_withdrawal_status(uuid,public.withdrawal_status) to authenticated;
grant execute on function public.admin_list_orders() to authenticated;
grant execute on function public.courier_jobs() to authenticated;
grant execute on function public.become_courier() to authenticated;