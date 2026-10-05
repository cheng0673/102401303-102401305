/**
 * favorites.js —— 我的收藏
 * 列出所有收藏的信息，可查看详情或取消收藏。
 */
(function () {
  'use strict';

  Storage.initStorage();

  var listEl = UI.$('#favList');
  var emptyEl = UI.$('#favEmpty');

  function favCardHTML(item) {
    var typeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found';
    var statusClass = item.status === 'done' ? 'status-done' : 'status-active';
    return '' +
      '<div class="card">' +
        '<a class="mine-card-icon" href="detail.html?id=' + encodeURIComponent(item.id) + '">' +
          UI.escapeHtml(UI.categoryIcon(item.category)) +
        '</a>' +
        '<a class="mine-card-main" href="detail.html?id=' + encodeURIComponent(item.id) + '">' +
          '<span class="status ' + statusClass + '">' + UI.statusText(item) + '</span>' +
          '<h3 class="card-title"><span class="badge ' + typeClass + '">' + UI.TYPE_TEXT[item.type] + '</span>' + UI.escapeHtml(item.title) + '</h3>' +
          '<div class="card-meta">' +
            '<span class="meta-item">📍 ' + UI.escapeHtml(item.location) + '</span>' +
            '<span class="meta-item">🕐 ' + UI.escapeHtml(UI.formatDateTime(item.time)) + '</span>' +
          '</div>' +
        '</a>' +
        '<div class="mine-actions">' +
          '<a class="btn btn-gray" href="detail.html?id=' + encodeURIComponent(item.id) + '">👀 查看详情</a>' +
          '<button type="button" class="btn btn-outline" data-action="unfav" data-id="' +
            UI.escapeHtml(item.id) + '">⭐ 取消收藏</button>' +
        '</div>' +
      '</div>';
  }

  function render() {
    var items = Storage.getFavoriteItems();
    if (items.length === 0) {
      listEl.innerHTML = '';
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    listEl.innerHTML = items.map(favCardHTML).join('');
  }

  listEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action="unfav"]');
    if (!btn) return;
    e.preventDefault();
    var id = btn.getAttribute('data-id');
    if (window.confirm('确定取消收藏这条信息吗？')) {
      Storage.toggleFavorite(id);
      render();
      UI.toast('已取消收藏');
    }
  });

  render();
})();
