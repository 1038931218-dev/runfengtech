// 联系表单 → Supabase 提交
// - 已配置 Supabase：拦截表单提交，POST 到 messages 表；失败时存本地队列稍后重试
// - 未配置：回退到原生提交（本地开发时由 Flask 落盘），或提示电话联系
(function () {
  'use strict';

  var cfg = window.SUPABASE || {};
  var configured = !!cfg.url && /^https:\/\/.+\.supabase\.co$/.test(cfg.url) &&
                   !!cfg.anonKey && cfg.anonKey.indexOf('YOUR_') !== 0;

  var form = document.querySelector('form.contact-form');
  if (!form) return;

  // ---------- 未配置：提示直接联系 ----------
  if (!configured) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      var old = btn.innerHTML;
      btn.innerHTML = '表单暂未开通，请直接致电 177-6047-2101';
      btn.disabled = true;
      setTimeout(function () { btn.innerHTML = old; btn.disabled = false; }, 4000);
    });
    return;
  }

  // ---------- 重试队列（localStorage） ----------
  var QUEUE_KEY = 'rf_pending_messages';
  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function setQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) {}
  }

  // 启动时先补发上次失败的留言
  (function flushQueue() {
    var q = getQueue();
    if (!q.length) return;
    q.forEach(function (item) { send(item).catch(function () {}); });
    setQueue([]);
  })();

  async function send(data) {
    var res = await fetch(cfg.url + '/rest/v1/messages', {
      method: 'POST',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': 'Bearer ' + cfg.anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(data),
    });
    if (res.status === 201 || res.status === 204) {
      return true;
    }
    throw new Error('HTTP ' + res.status);
  }

  // ---------- 提交 ----------
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var data = {
      name: form.name.value.trim(),
      company: form.company ? form.company.value.trim() : '',
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      service: form.service.value,
      message: form.message.value.trim(),
    };

    // 基本校验（与 main.js 一致）
    var errors = [];
    if (!data.name) errors.push('请填写您的称呼');
    if (!data.phone && !data.email) errors.push('请至少填写电话或邮箱');
    if (!data.message) errors.push('请描述您的需求');
    if (errors.length) {
      alert(errors.join('\n'));
      return;
    }

    var btn = form.querySelector('button[type=submit]');
    var old = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '提交中…';

    try {
      await send(data);
      btn.innerHTML = '✓ 已收到，1 个工作日内联系您';
      form.reset();
      setTimeout(function () { btn.innerHTML = old; }, 3000);
    } catch (err) {
      // 失败入队，下次访问自动重试
      var q = getQueue();
      q.push(data);
      setQueue(q);
      btn.disabled = false;
      btn.innerHTML = old;
      alert('网络异常，留言已暂存，我们会在恢复后自动补发。\n如需紧急联系请致电 177-6047-2101');
    }
  });
})();
