-- 润锋科技官网 — CMS 数据表（网站设置/页面内容）
-- 使用方法：Supabase 控制台 → SQL Editor → New query → 粘贴全部 → Run
-- 注意：与 supabase-setup.sql 分开跑，两次都要 Success

-- 1. 网站全局设置（KV 表，value 为 JSON）
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- 访客（匿名）可读取网站设置（标题/联系方式等本来就要展示）
create policy "settings_public_read"
  on public.site_settings for select
  to anon, authenticated
  using (true);

-- 仅管理员可写入/修改
create policy "settings_admin_insert"
  on public.site_settings for insert
  to authenticated
  with check (auth.jwt() ->> 'email' = '262633158@qq.com');

create policy "settings_admin_update"
  on public.site_settings for update
  to authenticated
  using (auth.jwt() ->> 'email' = '262633158@qq.com');
