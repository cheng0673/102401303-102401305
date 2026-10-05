/**
 * messages.js —— 消息通知
 * 模拟博客中的“匹配提醒 / 浏览动态 / 归还提醒 / 系统通知”四类消息。
 * 为 MVP 演示版：基于本机数据生成动态消息 + 固定的系统消息，
 * 已读状态保存在 localStorage（lost_found_read_msgs_v1）。
 */
(function () {
  'use strict';

  Storage.initStorage();

  var READ_KEY = 'lost_found_read_msgs_v1';
  var listEl = UI.$('#msgList');
  var emptyEl = UI.$('#msgEmpty');

  function getReadIds() {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY) || '[]');
    } catch (e) { return []; }
  }
  function setReadIds(ids) {
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  }

  /** 生成消息列表：优先用本机真实数据生成，再补充系统消息 */
  function buildMessages() {
    var msgs = [];
    var now = Date.now();

    // 1) 归还提醒：本机发布且已完成的信息
    var mineDone = Storage.getMineItems().filter(function (i) { return i.status === 'done'; });
    mineDone.forEach(function (item) {
      msgs.push({
        id: 'done-' + item.id,
        type: item.type === 'lost' ? '归还提醒' : '归还提醒',
        icon: '✅',
        title: '《' + item.title + '》已' + (item.type === 'lost' ? '找到' : '归还'),
        content: '你发布的这条信息已更新为“' +
          (item.type === 'lost' ? '已找到' : '已归还') + '”状态，感谢使用福大失物招领～',
        time: item.createdAt + 60000
      });
    });

    // 2) 匹配提醒：与我发布的信息类型互补、类别一致的其他人帖子，
    //    点击可进入匹配列表页查看相关帖子概况
    Storage.getMineItems().forEach(function (item) {
      var matches = Storage.findMatches(item);
      if (matches.length === 0) return;
      msgs.push({
        id: 'match-' + item.id,
        type: '匹配提醒',
        icon: '🔔',
        title: '你的' + UI.TYPE_TEXT[item.type] + '《' + item.title + '》有 ' + matches.length + ' 条匹配信息',
        content: '发现 ' + matches.length + ' 条类别相同的' +
          (item.type === 'lost' ? '招领' : '寻物') + '信息，点击查看相关帖子。',
        time: item.createdAt + 45000,
        matchId: item.id
      });
    });

    // 3) 收藏动态：收藏中仍在进行中的信息
    var favActive = Storage.getFavoriteItems().filter(function (i) { return i.status === 'active'; });
    favActive.forEach(function (item) {
      msgs.push({
        id: 'fav-' + item.id,
        type: '收藏动态',
        icon: '⭐',
        title: '收藏的《' + item.title + '》仍在寻找中',
        content: '这条' + UI.TYPE_TEXT[item.type] + '信息尚未完成，继续关注或许有新进展。',
        time: item.createdAt
      });
    });

    // 4) 浏览动态：本机发布的进行中信息
    var mineActive = Storage.getMineItems().filter(function (i) { return i.status === 'active'; });
    mineActive.forEach(function (item) {
      msgs.push({
        id: 'active-' + item.id,
        type: '浏览动态',
        icon: '👀',
        title: '《' + item.title + '》正在展示中',
        content: '你发布的这条' + UI.TYPE_TEXT[item.type] + '信息已被多位同学浏览，请保持联系方式畅通。',
        time: item.createdAt
      });
    });

    // 5) 系统通知（固定）
    msgs.push({
      id: 'sys-welcome',
      type: '系统通知',
      icon: '📢',
      title: '欢迎使用福大失物招领',
      content: '本应用为结对作业演示版，所有数据保存在本机浏览器，请勿填写敏感隐私信息。',
      time: now - 86400000
    });

    // 按时间倒序
    return msgs.sort(function (a, b) { return b.time - a.time; });
  }

  function render() {
    var readIds = getReadIds();
    var msgs = buildMessages();

    if (msgs.length === 0) {
      listEl.innerHTML = '';
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    listEl.innerHTML = msgs.map(function (m) {
      var unread = readIds.indexOf(m.id) === -1;
      return '' +
        '<div class="msg-item' + (unread ? ' msg-unread' : '') + '" data-id="' + UI.escapeHtml(m.id) + '">' +
          '<div class="msg-icon">' + m.icon + '</div>' +
          '<div class="msg-body">' +
            '<div class="msg-head">' +
              '<span class="msg-type">' + UI.escapeHtml(m.type) + '</span>' +
              (unread ? '<span class="msg-dot"></span>' : '') +
              '<span class="msg-time">' + UI.escapeHtml(UI.formatDateTime(m.time)) + '</span>' +
            '</div>' +
            '<div class="msg-title">' + UI.escapeHtml(m.title) + '</div>' +
            '<div class="msg-content">' + UI.escapeHtml(m.content) + '</div>' +
          '</div>' +
          (m.matchId ? '<span class="msg-arrow">›</span>' : '') +
        '</div>';
    }).join('');
  }

  // 点击单条消息：匹配提醒跳转匹配列表页，其余仅标记已读
  listEl.addEventListener('click', function (e) {
    var item = e.target.closest('.msg-item');
    if (!item) return;
    var id = item.getAttribute('data-id');

    // 标记已读
    var readIds = getReadIds();
    if (readIds.indexOf(id) === -1) {
      readIds.push(id);
      setReadIds(readIds);
      item.classList.remove('msg-unread');
      var dot = UI.$('.msg-dot', item);
      if (dot) dot.remove();
    }

    // 匹配提醒：进入匹配列表页并置顶对应分组
    if (id.indexOf('match-') === 0) {
      location.href = 'matches.html?mine=' + encodeURIComponent(id.slice(6));
    }
  });

  // 全部已读
  UI.$('#markRead').addEventListener('click', function () {
    var allIds = buildMessages().map(function (m) { return m.id; });
    setReadIds(allIds);
    render();
    UI.toast('已全部标记为已读');
  });

  render();
})();
