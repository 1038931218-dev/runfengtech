# 后台管理（/admin）使用说明

官网在 <https://homesmartlab.com/admin> 提供一个轻量后台，用于查看/导出联系表单的留言。

## 架构

- **前端**：静态 HTML/JS（部署在 GitHub Pages，0 成本）
- **数据**：Supabase 免费云数据库（Postgres + Auth + RLS）
- **表单**：`/contact` 的表单直接 POST 到 Supabase REST API，不需要任何服务器

## 一次性配置（约 5 分钟）

1. **注册 Supabase**：<https://supabase.com>（用你的 QQ 邮箱）
   - New project：
     - 起个名字（如 `runfengtech`）
     - Database password：设一个强密码（**记下来，以后重置/连库要用**）
     - Region：选 **Singapore**（对国内访问最快）
     - 等 1–2 分钟项目创建完成

2. **跑初始化脚本**
   - 项目页左侧 **SQL Editor → New query**
   - 把 `supabase-setup.sql` 的内容全部粘贴 → **Run**
   - 看到 `Success` 即可

3. **创建管理员账号**
   - 左侧 **Authentication → Users → Add user → Manual**
   - Email：`262633158@qq.com`（与 RLS 策略一致；想换就同时改 `supabase-setup.sql`）
   - Password：自己设一个（记好，用于登录 /admin）
   - **Auto confirm**：勾上（否则要收邮件确认）
   - **Recovery / Invite email**：都不用勾

4. **获取两个 key**
   - 左侧 **Settings → API**
   - **URL**：`https://xxxx.supabase.co`
   - **anon / public key**：那串长字符串
   - （**不要**把 `service_role` key 发给我，那把是管理员级全权限 key，用不上）

5. **把 URL + anon key 发给我**，我替换 `static/js/supabase-config.js` 里两个占位值并推送
   - 1–2 分钟后 `/contact` 表单和 `/admin` 后台都直接能用

## 日常使用

- **收留言**：访问 <https://homesmartlab.com/admin>，用第 3 步的邮箱 + 密码登录
  - 支持：标记已读 / 删除 / 导出 CSV / 刷新
  - 左侧两个数字卡片 = 总数 / 未读数
- **备份数据**：Supabase 控制台 → Table Editor → 右上角下载，或后台点"导出 CSV"
- **换管理员邮箱**：改 `supabase-setup.sql` 两处 → 重跑 SQL → 在 Authentication 加新用户
- **忘记密码**：Supabase 控制台 → Authentication → Users → 点用户 → Reset password

## 免费额度（够官网用很久）

| 项 | 免费层 | 你现在的消耗 |
|---|---|---|
| 数据库 | 500 MB | 0.001 MB |
| 月请求 | 200 万次 | 几百次 |
| 认证用户 | 10 万 | 1 个 |
| 流量 | 5 GB / 月 | 几乎为 0 |

## 保活机制

Supabase 免费项目 7 天无活动会被**暂停**（数据库停服）。
仓库里有一个定时工作流 `.github/workflows/keepalive-supabase.yml`，
每天 12:00 自动 ping 一次项目，保持它活跃，**你不需要做任何事**。

## 安全说明

- `anon key` 是"公开"的，允许匿名者**插入**留言（由 RLS 控制），不能读/删
- 读/删权限只属于已登录且邮箱 = `262633158@qq.com` 的用户
- `/admin` 页面 URL 本身公开，但没登录看不到数据
- 想藏得更深：把后台路径改成 `/后台` 或加随机路径，改 `app.py` 路由即可

## 故障排查

| 现象 | 原因 / 处理 |
|---|---|
| 表单提交后一直"提交中…" | 浏览器 DevTools 看 Network，多半是网络到 Supabase 不通或 RLS 被改坏，重跑一遍 `supabase-setup.sql` |
| 后台登录提示"邮箱或密码错误" | 邮箱没 Auto confirm → 在 Supabase 控制台手动确认 |
| 后台登录后加载失败 | token 过期，点"退出登录"重登；或 Supabase 被暂停（7 天没跑 keepalive） |
| 国内访问 Supabase 慢 | 正常现象，海外节点；官网表单能提交（偶尔 3–5 秒），后台偶尔慢可接受 |
