// Supabase 配置（部署时替换占位符）
// 说明：
//   url     —— Supabase 项目 URL，形如 https://xxxx.supabase.co
//   anonKey —— 公开密钥（anon key），可安全放在前端
//   adminEmail —— 后台登录邮箱（与 supabase-setup.sql 中的 RLS 策略一致）
window.SUPABASE = {
  url: "YOUR_SUPABASE_URL",
  anonKey: "YOUR_ANON_KEY",
  adminEmail: "262633158@qq.com",
};
