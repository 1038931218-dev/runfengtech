// 专业 CMS 管理后台
// 功能：登录 / 概览 / 网站设置 / 页面编辑 / 业务线 / 留言管理
// 数据：Supabase（messages 表 + site_settings 表）
(function () {
  'use strict';

  var root = document.getElementById('admin-root');
  if (!root) return; // 非后台页（admin.js 在 base.html 全站加载）

  var cfg = window.SUPABASE || {};
  var configured = !!cfg.url && /^https:\/\/.+\.supabase\.co$/.test(cfg.url) &&
                   !!cfg.anonKey && cfg.anonKey.indexOf('YOUR_') !== 0;
  if (!configured) {
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-app').style.display = 'none';
    document.getElementById('view-unconfigured').style.display = '';
    return;
  }

  var $ = function (id) { return document.getElementById(id); };
  var token = null, refreshTok = null;
  var currentMessages = [];

  // ---------------- 鉴权 ----------------
  function authHeaders() {
    return {
      'apikey': cfg.anonKey,
      'Authorization': 'Bearer ' + (token || cfg.anonKey),
      'Content-Type': 'application/json',
    };
  }
  async function rest(path, opts) {
    opts = opts || {};
    var headers = authHeaders();
    if (opts.prefer) headers['Prefer'] = opts.prefer;
    var res = await fetch(cfg.url + '/rest/v1/' + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    var data = null;
    try { data = res.status === 204 ? null : await res.json(); } catch (e) {}
    if (!res.ok) {
      var msg = (data && (data.message || data.msg)) || ('HTTP ' + res.status);
      var err = new Error(msg); err.status = res.status;
      throw err;
    }
    return data;
  }

  async function login(email, password) {
    var res = await fetch(cfg.url + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': cfg.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    });
    var data = await res.json().catch(function () { return null; });
    if (!res.ok) {
      var hints = { 400: '邮箱或密码错误（或邮箱未确认）', 401: '邮箱或密码错误', 403: '无权限' };
      var err = new Error((data && (data.msg || data.error_description)) || hints[res.status] || '登录失败');
      err.status = res.status;
      throw err;
    }
    token = data.access_token;
    refreshTok = data.refresh_token;
    sessionStorage.setItem('rf_admin_token', token);
    sessionStorage.setItem('rf_admin_refresh', refreshTok);
  }

  async function refreshSession() {
    var r = sessionStorage.getItem('rf_admin_refresh');
    if (!r) return false;
    try {
      var res = await fetch(cfg.url + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'apikey': cfg.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: r }),
      });
      if (!res.ok) return false;
      var d = await res.json();
      token = d.access_token; refreshTok = d.refresh_token;
      sessionStorage.setItem('rf_admin_token', token);
      sessionStorage.setItem('rf_admin_refresh', refreshTok);
      return true;
    } catch (e) { return false; }
  }

  function logout() {
    token = null; refreshTok = null;
    sessionStorage.removeItem('rf_admin_token');
    sessionStorage.removeItem('rf_admin_refresh');
    showApp(false);
    setLoginMsg('', '');
  }

  // ---------------- 视图切换 ----------------
  function showApp(on) {
    $('view-login').style.display = on ? 'none' : '';
    $('view-app').style.display = on ? '' : 'none';
    if (on) { switchTab('overview'); loadAllSettings(); }
  }
  function setLoginMsg(text, cls) {
    var el = $('login-msg');
    el.textContent = text;
    el.className = 'save-msg ' + (cls || '');
  }

  document.getElementById('login-btn').addEventListener('click', async function () {
    var email = $('login-email').value.trim();
    var pwd = $('login-password').value;
    if (!email || !pwd) { setLoginMsg('请填写邮箱和密码', 'err'); return; }
    var btn = this; btn.disabled = true; setLoginMsg('登录中…', '');
    try {
      await login(email, pwd);
      setLoginMsg('', '');
      showApp(true);
    } catch (e) {
      setLoginMsg('登录失败：' + e.message, 'err');
    } finally { btn.disabled = false; }
  });
  document.getElementById('logout-link').addEventListener('click', logout);

  // ---------------- Tab ----------------
  function switchTab(name) {
    document.querySelectorAll('#admin-nav a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-tab') === name);
    });
    document.querySelectorAll('.tab-pane').forEach(function (p) { p.style.display = 'none'; });
    var pane = $('pane-' + name);
    if (pane) pane.style.display = '';
    if (name === 'messages') loadMessages();
    if (name === 'overview') loadOverview();
  }
  document.querySelectorAll('#admin-nav a').forEach(function (a) {
    a.addEventListener('click', function () { switchTab(a.getAttribute('data-tab')); });
  });

  // ---------------- CMS 设置（site_settings）----------------
  function lookup(obj, path) {
    var parts = path.split('.'), cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  // 按组收集字段值
  function collectGroup(groupKey) {
    var out = {};
    document.querySelectorAll('[data-cmsf^="' + groupKey + '"]').forEach(function (el) {
      var path = el.getAttribute('data-cmsf');
      var parts = path.split('.');
      if (parts[0] !== groupKey) return;
      var v = el.tagName === 'TEXTAREA' ? el.value.trim() : el.value.trim();
      if (v === '') return; // 空值不写，保留页面默认
      // 构建嵌套
      var cur = out, last = parts.length - 1;
      for (var i = 1; i < parts.length; i++) {
        if (i === last) { cur[parts[i]] = v; }
        else {
          if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
          cur = cur[parts[i]];
        }
      }
    });
    return out;
  }

  // 预填表单：优先 Supabase 已存值，其次当前页面 DOM 默认文案
  async function loadAllSettings() {
    var saved = {};
    try {
      var rows = await rest('site_settings?select=key,value');
      (rows || []).forEach(function (r) { saved[r.key] = r.value; });
    } catch (e) { /* 表未建时静默 */ }

    document.querySelectorAll('[data-cmsf]').forEach(function (el) {
      var path = el.getAttribute('data-cmsf');
      var v = lookup(saved, path);
      if (v != null) { el.value = String(v); return; }
      // 回退：从当前页面 DOM 找同路径的默认元素（页脚/导航等全局字段）
      var dom = document.querySelector('[data-cms="' + path + '"]')
             || document.querySelector('[data-cms-html="' + path + '"]')
             || document.querySelector('[data-cms-content="' + path + '"]');
      if (dom) {
        if (dom.tagName === 'META') el.value = dom.getAttribute('content') || '';
        else if (el.tagName === 'TEXTAREA') el.value = dom.innerHTML.trim();
        else el.value = dom.textContent.trim();
      }
    });
  }

  async function saveGroup(groupKeys, msgEl) {
    msgEl.textContent = '保存中…'; msgEl.className = 'save-msg';
    try {
      var rows = [];
      groupKeys.forEach(function (k) {
        var val = collectGroup(k);
        if (Object.keys(val).length) {
          rows.push({ key: k, value: val, updated_at: new Date().toISOString() });
        }
      });
      if (!rows.length) { msgEl.textContent = '没有需要保存的修改'; return; }
      await rest('site_settings', { method: 'POST', body: rows, prefer: 'resolution=merge-duplicates' });
      msgEl.textContent = '✓ 已保存，对所有访客实时生效';
      msgEl.className = 'save-msg ok';
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        msgEl.textContent = '登录已失效，请重新登录';
        logout();
        return;
      }
      msgEl.textContent = '保存失败：' + e.message + '（请确认已在 Supabase 运行 supabase-cms.sql）';
      msgEl.className = 'save-msg err';
    }
  }

  document.querySelectorAll('[data-save]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var which = btn.getAttribute('data-save');
      var msg = $('msg-' + which);
      var map = {
        general: ['general'],
        pages: ['hero', 'index', 'cta', 'about', 'contact_page', 'services_page'],
        services: ['services'],
      };
      saveGroup(map[which] || [which], msg);
    });
  });

  // ---------------- 留言管理 ----------------
  var SVC = { web: '网站开发', windows: 'Windows 软件', app: '手机 APP', ai: 'AI 部署', other: '其他' };

  async function loadMessages() {
    try {
      var rows = await rest('messages?select=*&order=created_at.desc&limit=500');
      currentMessages = rows || [];
      renderMessages(currentMessages);
    } catch (e) {
      if (e.status === 401 || e.status === 403) { $('msg-body').innerHTML = '<tr><td colspan="6" class="empty">登录已失效，请重新登录</td></tr>'; logout(); return; }
      $('msg-body').innerHTML = '<tr><td colspan="6" class="empty">加载失败：' + esc(e.message) + '</td></tr>';
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderMessages(rows) {
    var body = $('msg-body');
    if (!rows.length) { body.innerHTML = '<tr><td colspan="6" class="empty">暂无留言</td></tr>'; return; }
    body.innerHTML = rows.map(function (m) {
      var dot = m.is_read ? '' : '<span class="unread-dot"></span>';
      return '<tr data-id="' + m.id + '">' +
        '<td>' + dot + esc(m.name) + (m.company ? '<br><span class="muted small">' + esc(m.company) + '</span>' : '') + '</td>' +
        '<td>' + esc(m.phone || m.email || '-') + '</td>' +
        '<td>' + (SVC[m.service] || m.service || '-') + '</td>' +
        '<td class="msg-cell" title="' + esc(m.message) + '">' + esc(m.message) + '</td>' +
        '<td class="muted small">' + new Date(m.created_at).toLocaleString('zh-CN') + '</td>' +
        '<td><button class="btn-link" data-act="read" data-id="' + m.id + '">标已读</button>' +
        '<button class="btn-link danger" data-act="del" data-id="' + m.id + '">删除</button></td></tr>';
    }).join('');
  }

  document.getElementById('msg-body').addEventListener('click', async function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    try {
      if (btn.getAttribute('data-act') === 'read') {
        await rest('messages?id=eq."' + id + '"', { method: 'PATCH', body: { is_read: true } });
      } else {
        if (!confirm('确定删除这条留言？不可恢复')) return;
        await rest('messages?id=eq."' + id + '"', { method: 'DELETE' });
      }
      loadMessages();
      loadOverview();
    } catch (err) { alert('操作失败：' + err.message); }
  });

  document.getElementById('msg-refresh').addEventListener('click', loadMessages);
  document.getElementById('msg-export').addEventListener('click', function () {
    if (!currentMessages.length) { alert('暂无数据'); return; }
    var head = 'id,name,company,phone,email,service,message,is_read,created_at\n';
    var lines = currentMessages.map(function (m) {
      return [m.id, m.name, m.company, m.phone, m.email, m.service, m.message, m.is_read, m.created_at]
        .map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob(['\uFEFF' + head + lines], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'messages_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // ---------------- 概览 ----------------
  async function loadOverview() {
    try {
      var all = await rest('messages?select=*&order=created_at.desc&limit=500');
      var rows = all || [];
      var total = rows.length;
      var unread = rows.filter(function (m) { return !m.is_read; }).length;
      var week = rows.filter(function (m) {
        return (Date.now() - new Date(m.created_at).getTime()) < 7 * 86400000;
      }).length;
      $('ov-total').textContent = total;
      $('ov-unread').textContent = unread;
      $('ov-week').textContent = week;
      $('ov-services').textContent = document.querySelectorAll('#pane-services .svc-edit-block').length;

      var recent = rows.slice(0, 5);
      var body = $('ov-recent');
      if (!recent.length) {
        body.innerHTML = '<tr><td colspan="5" class="empty">暂无留言</td></tr>';
        return;
      }
      body.innerHTML = recent.map(function (m) {
        return '<tr><td>' + (m.is_read ? '' : '<span class="unread-dot"></span>') + esc(m.name) + '</td>' +
          '<td>' + esc(m.phone || m.email || '-') + '</td>' +
          '<td>' + (SVC[m.service] || m.service || '-') + '</td>' +
          '<td class="msg-cell" title="' + esc(m.message) + '">' + esc(m.message) + '</td>' +
          '<td class="muted small">' + new Date(m.created_at).toLocaleString('zh-CN') + '</td></tr>';
      }).join('');
    } catch (e) {
      if (e.status === 401 || e.status === 403) { logout(); return; }
      $('ov-recent').innerHTML = '<tr><td colspan="5" class="empty">加载失败：' + esc(e.message) + '</td></tr>';
    }
  }

  // ---------------- 启动 ----------------
  (function init() {
    var savedTok = sessionStorage.getItem('rf_admin_token');
    if (savedTok) {
      refreshSession().then(function (ok) {
        if (ok) { showApp(true); }
        else { logout(); }
      });
    }
  })();
})();
