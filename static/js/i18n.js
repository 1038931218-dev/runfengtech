// 多语言切换（中/英），面向海外客户
// - 官网页渲染，后台页不渲染（base.html 条件注入）
// - 文案走 data-i18n / data-i18n-html 属性，切语言只改 DOM 文案，不重部署
// - 选择存 localStorage；默认中文；切换后标题与 meta 描述同步
(function () {
  'use strict';
  var btn = document.getElementById('lang-toggle');
  if (!btn) return;

  // 英文文案表（按 data-i18n key）。未列出的 key 保持原中文。
  var EN = {
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.blog': 'Blog',
    'nav.faq': 'FAQ',
    'nav.contact': 'Contact',
    'hero.badge': 'AI-powered · End-to-end delivery',
    'cta.title': 'Got an idea? We ship it.',
    'cta.subtitle': 'Tell us your scenario — we reply within 1 business day with an actionable plan.',
    'cta.button': 'Get a proposal →',
    'footer.services': 'Services',
    'footer.contact': 'Contact Us',
    'footer.copyright': '© 2026 Runfeng Technology Co., Ltd.',
  };

  function current() {
    var s = null;
    try { s = localStorage.getItem('rf_lang'); } catch (e) {}
    return s === 'en' ? 'en' : 'zh';
  }

  function apply() {
    var lang = current();
    btn.textContent = lang === 'en' ? '中' : 'EN';
    btn.title = lang === 'en' ? '切换到中文' : 'Switch to English';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      var en = EN[k];
      if (lang === 'en' && en) el.textContent = en;
      else if (el.getAttribute('data-i18n-default')) el.textContent = el.getAttribute('data-i18n-default');
    });
    var t = document.title;
    if (lang === 'en') t = t.replace(/润锋科技/g, 'Runfeng Tech').replace(/—/g, ' | ');
    document.title = t;
  }

  btn.addEventListener('click', function () {
    try {
      localStorage.setItem('rf_lang', current() === 'en' ? 'zh' : 'en');
    } catch (e) {}
    apply();
  });
  apply();
})();
