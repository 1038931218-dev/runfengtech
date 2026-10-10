// 后台管理 — Supabase 版
(function () {
  'use strict';

  var cfg = window.SUPABASE || {};
  var configured = !!cfg.url && /^https:\/\/.+\.supabase\.co$/.test(cfg.url) &&
                   !!cfg.anonKey && cfg.anonKey.indexOf('YOUR_') !== 0;

  var $login = document.getElementById('login-view');
  var $dash = document.getElementById('dash-view');
  var $status = document.getElementById('admin-status');

  var token = null;      // access token
  var refresh = null;    // refresh token

  function setStatus(text, cls) {
    $status.textContent = text;
    $status.className = 'admin-status' + (cls ? ' ' + cls : '');
  }

  async function authFetch(path, opts) {
    var res = await fetch(cfg.url + '/auth/v1/' + path, Object.assign({
      headers: {
        'apikey': cfg.anonKey,
        'Content-Type': 'application/json',
      },
    }, opts));
    var body = null;
    try { body = await res.json(); } catch (e) {}
    if (!res.ok) {
      var msg = body && (body.msg || body.error_description || body.message) || ('HTTP ' + res.status);
      var err = new Error(msg); err.status = res.status; throw err;
    }
    return body;
  }

  async function restFetch(path, opts) {
    var res = await fetch(cfg.url + '/rest/v1/' + path, Object.assign({
      headers: Object.assign({
        'apikey': cfg.anonKey,
        'Authorization': 'Bearer ' + (token || cfg.anonKey),
        'Content-Type': 'application/json',
      }, opts && opts.headers || {}),
      method: (opts && opts.method) || 'GET',
    }));
    var body = null;
    try { body = await res.json(); } catch (e) {}
    if (!res.ok) {
      var msg = body && (body.message || body.msg) || ('HTTP ' + res.status);
      var err = new Error(msg); err.status = res.status; throw err;
    }
    return { body: body, headers: res.headers };
  }

  // ---------- 登录 ----------
  async function doLogin(email, password) {
    var body = await authFetch('token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: email, password: password }),
    });
    token = body.access_token;
    refresh = body.refresh_token;
    sessionStorage.setItem('rf_admin_token', token);
    sessionStorage.setItem('rf_admin_refresh', refresh);
    setStatus('已登录：' + email, 'ok');
    await enterDash();
  }

  function doLogout() {
    token = null; refresh = null;
    sessionStorage.removeItem('rf_admin_token');
    sessionStorage.removeItem('rf_admin_refresh');
    $dash.style.display = 'none';
    $login.style.display = '';
    setStatus('已退出', 'ok');
  }

  // ---------- 刷新 token ----------
  async function refreshSession() {
    var r = sessionStorage.getItem('rf_admin_refresh');
    if (!r) return false;
    try {
      var body = await authFetch('token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: r }),
      });
      token = body.access_token; refresh = body.refresh_token;
      sessionStorage.setItem('rf_admin_token', token);
      sessionStorage.setItem('rf_admin_refresh', refresh);
      return true;
    } catch (e) { return false; }
  }

  // ---------- 后台主体 ----------
  async function enterDash() {
    $login.style.display = 'none';
    $dash.style.display = '';
    await loadMessages();
  }

  async function loadMessages() {
    try {
      var r = await restFetch('messages?select=*&order=created_at.desc&limit=500');
      var rows = r.body || [];
      renderTable(rows);
      // 统计未读数
      var unread = await restFetch('messages?select=id&is_read=eq.false&limit=0');
      var totalRange = unread.headers.get('Content-Range') || '*/';
      var total = totalRange.split('/')[1];
      var totalNum = total === '*' ? rows.length : (parseInt(total, 10) || 0);
      var unreadNum = rows.filter(function (m) { return !m.is_read; }).length;
      document.getElementById('stat-total').textContent = totalNum;
      document.getElementById('stat-unread').textContent = unreadNum;
    } catch (e) {
      if (e.status === 401 || e.status === 403) { setStatus('登录失效，请重新登录', 'err'); doLogout(); return; }
      setStatus('加载失败：' + e.message, 'err');
    }
  }

  var currentRows = [];
  function renderTable(rows) {
    currentRows = rows;
    var $body = document.getElementById('msg-body');
    if (!rows.length) {
      $body.innerHTML = '<tr><td colspan="6" class="empty">暂无留言</td></tr>';
      return;
    }
    var svcMap = { web: '网站开发', windows: 'Windows 软件', app: '手机 APP', ai: 'AI 部署', other: '其他' };
    $body.innerHTML = rows.map(function (m) {
      var badge = m.is_read ? '' : '<span class="unread-dot"></span>';
      return '<tr data-id="' + m.id + '">' +
        '<td>' + badge + esc(m.name) + (m.company ? '<br><span class="muted small">' + esc(m.company) + '</span>' : '') + '</td>' +
        '<td>' + esc(m.phone || m.email || '-') + '</td>' +
        '<td>' + (svcMap[m.service] || m.service || '-') + '</td>' +
        '<td class="msg-cell" title="' + esc(m.message) + '">' + esc(m.message) + '</td>' +
        '<td class="muted small">' + new Date(m.created_at).toLocaleString('zh-CN') + '</td>' +
        '<td><button class="btn-link" data-act="read" data-id="' + m.id + '">标已读</button>' +
            '<button class="btn-link danger" data-act="del" data-id="' + m.id + '">删除</button></td>' +
      '</tr>';
    }).join('');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  document.getElementById('msg-body').addEventListener('click', async function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    var act = btn.getAttribute('data-act');
    try {
      if (act === 'read') {
        await restFetch('messages?id=eq."' + id + '"', {
          method: 'PATCH',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({ is_read: true }),
        });
      } else if (act === 'del') {
        if (!confirm('确定删除这条留言？不可恢复')) return;
        await restFetch('messages?id=eq."' + id + '"', { method: 'DELETE' });
      }
      await loadMessages();
    } catch (err) {
      setStatus('操作失败：' + err.message, 'err');
    }
  });

  document.getElementById('btn-refresh').addEventListener('click', loadMessages);

  document.getElementById('btn-export').addEventListener('click', function () {
    if (!currentRows.length) { alert('暂无数据'); return; }
    var head = 'id,name,company,phone,email,service,message,is_read,created_at\n';
    var lines = currentRows.map(function (m) {
      return [m.id, m.name, m.company, m.phone, m.email, m.service, m.message, m.is_read, m.created_at]
        .map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; })
        .join(',');
    }).join('\n');
    var blob = new Blob(['\uFEFF' + head + lines], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'messages_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('btn-logout').addEventListener('click', doLogout);

  // ---------- 登录表单 ----------
  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;
    if (!email || !password) { setStatus('请填写邮箱和密码', 'err'); return; }
    setStatus('登录中…');
    try {
      await doLogin(email, password);
    } catch (err) {
      var hints = {
        400: '邮箱或密码错误（或邮箱未验证）',
        401: '邮箱或密码错误',
        403: '无权限',
        404: '服务不可用',
      };
      setStatus('登录失败：' + (hints[err.status] || err.message), 'err');
    }
  });

  // ---------- 启动 ----------
  (function init() {
    if (!configured) {
      $login.style.display = 'none';
      $dash.style.display = 'none';
      document.getElementById('admin-unconfigured').style.display = '';
      return;
    }
    var saved = sessionStorage.getItem('rf_admin_token');
    if (saved) {
      token = saved;
      var ok = refreshSession();
      if (ok) {
        ok.then(function (s) {
          if (s) { setStatus('已登录', 'ok'); enterDash(); }
          else { doLogout(); }
        });
        return;
      }
    }
    // 默认显示登录
  })();
})();
