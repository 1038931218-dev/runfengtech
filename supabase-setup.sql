# 润锋科技官网 — Supabase 一次性初始化脚本
# 使用方法：
#   1. 登录 supabase.com → 进入你的项目
#   2. 左侧 SQL Editor → New query → 把本文件全部内容粘贴进去 → Run
#   3. 完成后关闭并删除本次查询即可
#
# 注意：管理员邮箱固定为 262633158@qq.com。
#       如果想用别的邮箱做管理员，把下面两处的邮箱都替换掉再运行。

-- 0. 确保扩展存在（免费层内置，保险起见）
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

-- 2. 匿名访问者可提交表单（官网访客无需登录）
create policy "messages_anon_insert"
  on public.messages for insert
  to anon, authenticated
  with check (true);

-- 3. 仅管理员邮箱（已登录）可读取
create policy "messages_admin_read"
  on public.messages for select
  to authenticated
  using (auth.jwt() ->> 'email' = '262633158@qq.com');

-- 4. 仅管理员可标记已读
create policy "messages_admin_update"
  on public.messages for update
  to authenticated
  using (auth.jwt() ->> 'email' = '262633158@qq.com');

-- 5. 仅管理员可删除
create policy "messages_admin_delete"
  on public.messages for delete
  to authenticated
  using (auth.jwt() ->> 'email' = '262633158@qq.com');
