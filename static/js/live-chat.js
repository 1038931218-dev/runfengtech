// 在线客服悬浮按钮
// - 右下角 "💬" 圆按钮，点击展开电话/邮件/表单三选一面板
// - 面板内 "✕" 关闭；点击面板外区域自动关闭
// - 非后台页渲染（base.html 条件注入）
(function () {
  'use strict';
  var fab = document.getElementById('cs-fab');
  var panel = document.getElementById('cs-panel');
  if (!fab || !panel) return;

  function toggle(open) {
    if (open === undefined) open = panel.hidden;
    panel.hidden = !open;
    fab.classList.toggle('active', open);
  }

  fab.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
  var closeBtn = document.getElementById('cs-close');
  if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); toggle(false); });

  // 点击面板外区域关闭
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== fab) toggle(false);
  });
})();
