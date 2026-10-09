// 润锋科技 主脚本
document.addEventListener('DOMContentLoaded', function () {
  // 表单校验增强：邮箱/手机号
  const form = document.querySelector('form.contact-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();

    // 至少填一个联系方式
    if (!phone && !email) {
      e.preventDefault();
      alert('请至少填写电话或邮箱其中一项。');
      return;
    }
    // 手机号格式
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      e.preventDefault();
      alert('手机号格式不正确，请检查（11 位，1 开头）。');
      return;
    }
    // 邮箱格式
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.preventDefault();
      alert('邮箱格式不正确。');
      return;
    }
  });

  // 返回顶部
  const backToTop = document.createElement('a');
  backToTop.href = '#top';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', '返回顶部');
  backToTop.innerHTML = '↑';
  document.body.appendChild(backToTop);
  document.body.setAttribute('id', 'top');

  let ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        backToTop.classList.toggle('show', window.scrollY > 500);
        ticking = false;
      });
      ticking = true;
    }
  });
});
