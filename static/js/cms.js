// CMS 内容注入：从 Supabase 拉取 site_settings，覆盖页面上标记了 data-cms 的元素
// - 构建时页面保留默认文案（回退），拉取失败/无数据时页面仍完整可用
// - data-cms="a.b.c"        → 文本覆盖（textContent）
// - data-cms-html="a.b.c"   → 富文本覆盖（innerHTML，白名单过滤）
// - data-cms-content="k"    → meta 的 content 属性
(function () {
  'use strict';

  var cfg = window.SUPABASE || {};
  var configured = !!cfg.url && /^https:\/\/.+\.supabase\.co$/.test(cfg.url) &&
                   !!cfg.anonKey && cfg.anonKey.indexOf('YOUR_') !== 0;
  if (!configured) return;
  // 后台页自身不注入
  if (location.pathname.indexOf('/admin') === 0) return;

  // 富文本白名单：只保留基本排版标签，防 XSS
  var ALLOWED = {
    B: 1, STRONG: 1, I: 1, EM: 1, BR: 1, P: 1, UL: 1, OL: 1, LI: 1,
    SPAN: 1, A: 1, DIV: 1, SMALL: 1, H1: 1, H2: 1, H3: 1, H4: 1
  };
  function sanitize(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    (function walk(el) {
      var child;
      while ((child = el.firstChild)) {
        walk(child);
        var tag = child.tagName;
        if (child.nodeType === 1 && !(ALLOWED[tag] || tag === 'BODY' || tag === 'HTML')) {
          // 保留文本内容，去掉标签
          el.replaceChild(document.createTextNode(child.textContent), child);
          continue;
        }
        if (child.nodeType === 1) {
          // 去掉所有属性（A 只保留 href 且必须是 http/https/#/相对路径）
          for (var i = child.attributes.length - 1; i >= 0; i--) {
            var attr = child.attributes[i].name;
            if (child.tagName === 'A' && attr === 'href') {
              var v = child.getAttribute('href') || '';
              if (!/^(https?:|#|\/|\.\/|\.\.\/)/i.test(v)) {
                child.removeAttribute('href');
              }
            } else {
              child.removeAttribute(attr);
            }
          }
        }
      }
    })(doc.body);
    return doc.body.innerHTML;
  }

  function lookup(obj, path) {
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  fetch(cfg.url + '/rest/v1/site_settings?select=key,value', {
    headers: {
      'apikey': cfg.anonKey,
      'Authorization': 'Bearer ' + cfg.anonKey,
    },
  })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (rows) {
      if (!rows.length) return;
      var data = {};
      rows.forEach(function (row) { data[row.key] = row.value; });

      // 文本 / 富文本 / meta content 覆盖
      document.querySelectorAll('[data-cms]').forEach(function (el) {
        var v = lookup(data, el.getAttribute('data-cms'));
        if (v == null || (typeof v === 'string' && v === '')) return;
        el.textContent = String(v);
      });
      document.querySelectorAll('[data-cms-html]').forEach(function (el) {
        var v = lookup(data, el.getAttribute('data-cms-html'));
        if (v == null || (typeof v === 'string' && v === '')) return;
        el.innerHTML = sanitize(String(v));
      });
      document.querySelectorAll('[data-cms-content]').forEach(function (el) {
        var v = lookup(data, el.getAttribute('data-cms-content'));
        if (v == null || (typeof v === 'string' && v === '')) return;
        el.setAttribute('content', String(v));
      });
      // 站点标题（影响浏览器标签）
      var t = lookup(data, 'general.site_title');
      if (t) document.title = String(t);
    })
    .catch(function () { /* 拉取失败：保持默认文案，不影响站点 */ });
})();
