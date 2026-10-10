// 润锋科技 主脚本
// 注：script 放在 body 末尾，DOM 已就绪，直接执行即可
(function () {
  // 表单校验增强：邮箱/手机号
  var form = document.querySelector('form.contact-form');

  if (form) {
    // 如果 Supabase 已配置，表单由 contact-api.js 接管，跳过这里的原生校验拦截
    var supa = window.SUPABASE || {};
    var supaConfigured = !!supa.url && /^https:\/\/.+\.supabase\.co$/.test(supa.url);
    form.addEventListener('submit', function (e) {
      if (supaConfigured) return; // 交给 contact-api.js 处理
      var phone = (form.querySelector('input[name=phone]') || {}).value || '';
      var email = (form.querySelector('input[name=email]') || {}).value || '';

      if (!phone.trim() && !email.trim()) {
        e.preventDefault();
        alert('请至少填写电话或邮箱其中一项。');
        return;
      }
      if (phone.trim() && !/^1[3-9]\d{9}$/.test(phone.trim())) {
        e.preventDefault();
        alert('手机号格式不正确，请检查（11 位，1 开头）。');
        return;
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        e.preventDefault();
        alert('邮箱格式不正确。');
        return;
      }
    });
  }

  // 返回顶部
  var backToTop = document.createElement('a');
  backToTop.href = '#top';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', '返回顶部');
  backToTop.innerHTML = '↑';
  document.body.appendChild(backToTop);
  document.body.setAttribute('id', 'top');

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        backToTop.classList.toggle('show', window.scrollY > 500);
        ticking = false;
      });
      ticking = true;
    }
  });
})();
