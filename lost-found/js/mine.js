/**
 * mine.js —— 我的发布页逻辑
 * 功能：展示本机发布的全部信息、统计数量、查看详情、
 * 标记为已找到/已归还、删除（带二次确认）。
 */
(function () {
  'use strict';

  Storage.initStorage();

  var listEl = UI.$('#mineList');
  var emptyEl = UI.$('#mineEmpty');

  /** 渲染“我的发布”卡片（图二：左右布局，右侧竖排操作按钮） */
  function mineCardHTML(item) {
    var statusClass = item.status === 'done' ? 'status-done' : 'status-active';
    var doneWord = item.type === 'lost' ? '已找到' : '已归还';

    // 进行中才显示“标记完成”按钮
    var markBtn = item.status === 'active'
      ? '<button type="button" class="btn btn-outline" data-action="done" data-id="' +
        UI.escapeHtml(item.id) + '">✅ 标记' + doneWord + '</button>'
      : '';

    return '' +
      '<div class="card mine-card">' +
        '<a class="mine-card-icon" href="detail.html?id=' + encodeURIComponent(item.id) + '">' +
          UI.escapeHtml(UI.hashAvatar(item.title)) +
        '</a>' +
        '<div class="mine-card-body">' +
          '<a class="mine-card-main" href="detail.html?id=' + encodeURIComponent(item.id) + '">' +
            '<h3 class="card-title">' + UI.escapeHtml(item.title) + '</h3>' +
            '<div class="card-meta">' +
              '<span class="meta-item">📍 ' + UI.escapeHtml(item.location) + '</span>' +
            '</div>' +
            '<div class="card-meta">' +
              '<span class="meta-item">🕐 ' + UI.escapeHtml(UI.formatDateTime(item.time)) + '</span>' +
            '</div>' +
          '</a>' +
          '<span class="status ' + statusClass + '">' + UI.statusText(item) + '</span>' +
        '</div>' +
        '<div class="mine-actions">' +
          '<a class="btn btn-outline" href="publish.html?id=' + encodeURIComponent(item.id) + '">✏️ 编辑</a>' +
          markBtn +
          '<button type="button" class="btn btn-danger-outline" data-action="delete" data-id="' +
            UI.escapeHtml(item.id) + '">🗑 删除</button>' +
        '</div>' +
      '</div>';
  }

  /** 更新顶部统计 */
  function renderStats(items) {
    var active = items.filter(function (i) { return i.status === 'active'; }).length;
    UI.$('#statTotal').textContent = items.length;
    UI.$('#statActive').textContent = active;
    UI.$('#statDone').textContent = items.length - active;
  }

  function render() {
    var items = Storage.getMineItems();
    renderStats(items);

    if (items.length === 0) {
      listEl.innerHTML = '';
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    listEl.innerHTML = items.map(mineCardHTML).join('');
  }

  /* ---------- 操作事件（事件委托） ---------- */

  listEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;

    e.preventDefault();
    var action = btn.getAttribute('data-action');
    var id = btn.getAttribute('data-id');
    var item = Storage.getItem(id);
    if (!item) {
      UI.toast('信息不存在或已被删除', 'error');
      render();
      return;
    }

    if (action === 'done') {
      var word = item.type === 'lost' ? '已找到' : '已归还';
      if (!window.confirm('确认将这条信息标记为“' + word + '”吗？')) return;
      if (Storage.updateStatus(id, 'done')) {
        render();
        UI.toast('状态已更新为“' + word + '”');
      } else {
        UI.toast('更新失败，请重试', 'error');
      }
    }

    if (action === 'delete') {
      if (!window.confirm('确定删除这条信息吗？删除后不可恢复。')) return;
      if (Storage.removeItem(id)) {
        render();
        UI.toast('已删除');
      } else {
        UI.toast('删除失败，请重试', 'error');
      }
    }
  });

  render();
})();
