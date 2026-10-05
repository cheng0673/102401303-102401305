/**
 * matches.js —— 匹配提醒列表页
 * 将"我发布的"与"其他人发布的"按 类型互补 + 类别一致 进行匹配，
 * 以我的帖子分组展示相关帖子概况，点击卡片进入帖子详情。
 * 支持 ?mine=<我的帖子id> 参数：将该组置顶（从消息通知跳转而来）。
 */
(function () {
  'use strict';

  Storage.initStorage();

  var listEl = UI.$('#matchList');
  var emptyEl = UI.$('#matchEmpty');
  var focusId = UI.getQuery('mine');

  /** 单条匹配帖子的概况卡片（整体可点击，跳转详情页） */
  function matchCardHTML(item) {
    var statusClass = item.status === 'done' ? 'status-done' : 'status-active';
    var typeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found';
    return '' +
      '<a class="card match-card" href="detail.html?id=' + encodeURIComponent(item.id) + '">' +
        '<div class="mine-card-icon">' + UI.escapeHtml(UI.categoryIcon(item.category)) + '</div>' +
        '<div class="mine-card-main">' +
          '<span class="status ' + statusClass + '">' + UI.statusText(item) + '</span>' +
          '<h3 class="card-title"><span class="badge ' + typeClass + '">' + UI.TYPE_TEXT[item.type] + '</span>' + UI.escapeHtml(item.title) + '</h3>' +
          '<div class="card-meta">' +
            '<span class="meta-item">📍 ' + UI.escapeHtml(item.location) + '</span>' +
            '<span class="meta-item">🕐 ' + UI.escapeHtml(UI.formatDateTime(item.time)) + '</span>' +
            '<span class="meta-item">👤 ' + UI.escapeHtml(item.publisher) + '</span>' +
          '</div>' +
        '</div>' +
        '<span class="match-arrow">›</span>' +
      '</a>';
  }

  function render() {
    var mineItems = Storage.getMineItems();

    // 从消息通知跳转而来：把对应我的帖子所在组置顶
    if (focusId) {
      for (var i = 0; i < mineItems.length; i++) {
        if (mineItems[i].id === focusId) {
          if (i > 0) {
            var focus = mineItems.splice(i, 1)[0];
            mineItems.unshift(focus);
          }
          break;
        }
      }
    }

    // 分组并过滤掉没有匹配的
    var groups = mineItems.map(function (item) {
      return { item: item, matches: Storage.findMatches(item) };
    }).filter(function (g) { return g.matches.length > 0; });

    if (groups.length === 0) {
      listEl.innerHTML = '';
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    listEl.innerHTML = groups.map(function (g) {
      return '' +
        '<section class="match-group">' +
          '<div class="match-mine">' +
            '<span class="badge ' + (g.item.type === 'lost' ? 'badge-lost' : 'badge-found') + '">我的' + UI.TYPE_TEXT[g.item.type] + '</span>' +
            '<span class="match-mine-title">' + UI.escapeHtml(g.item.title) + '</span>' +
            '<span class="match-count">' + g.matches.length + ' 条相关</span>' +
          '</div>' +
          g.matches.map(matchCardHTML).join('') +
        '</section>';
    }).join('');
  }

  render();
})();
