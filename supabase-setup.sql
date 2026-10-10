-- 润锋科技官网 — Supabase 一次性初始化脚本
-- 使用方法：SQL Editor -> New query -> 粘贴全部 -> Run
-- 注意：管理员邮箱固定为 262633158@qq.com，想换就替换下面两处邮箱

-- 0. 确保扩展存在
create extension if not exists pgcrypto;

-- 1. 表单留言表
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 100),
  company    text,
  phone      text,
  email      text,
  service    text,
  message    text not null check (char_length(message) between 1 and 2000),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- 2. 匿名可插入（官网访客）
create policy "messages_anon_insert"
  on public.messages for insert
  to anon, authenticated
  with check (true);

-- 3. 仅管理员可读
create policy "messages_admin_read"
  on public.messages for select
  to authenticated
  using (auth.jwt() ->> 'email' = '262633158@qq.com');

-- 4. 仅管理员可改（标记已读）
create policy "messages_admin_update"
  on public.messages for update
  to authenticated
  using (auth.jwt() ->> 'email' = '262633158@qq.com');

-- 5. 仅管理员可删
create policy "messages_admin_delete"
  on public.messages for delete
  to authenticated
  using (auth.jwt() ->> 'email' = '262633158@qq.com');
