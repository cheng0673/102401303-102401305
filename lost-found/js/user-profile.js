/**
 * user-profile.js —— 发布者主页逻辑（新功能二，对应 Figma 原型 16.发布者主页）
 * 根据 URL 中的 name 参数展示该发布者的头像、统计与全部帖子列表。
 * 若该发布者是本机用户（昵称与个人资料一致），补充显示学号 / 学院；
 * 联系方式从该发布者各条信息中收集去重，分行展示并支持逐行复制。
 */
(function () {
  'use strict';

  Storage.initStorage();

  var name = UI.getQuery('name') || '';
  var listEl = UI.$('#uList');
  var emptyEl = UI.$('#uEmpty');

  // 该发布者的全部信息（getItems 已按发布时间倒序）
  var items = name
    ? Storage.getItems().filter(function (it) { return it.publisher === name; })
    : [];

  document.title = (name || '发布者') + '的个人主页 - 福大失物招领';
  UI.$('#uAvatar').textContent = UI.hashAvatar(name);
  UI.$('#uName').textContent = name || '未知发布者';

  // 学号 / 学院：数据模型挂在本机个人资料上，只有浏览自己的主页时能展示
  var profile = Storage.getProfile();
  if (profile.nickname === name && (profile.studentId || profile.college)) {
    var meta = [];
    if (profile.studentId) meta.push('学号 ' + profile.studentId);
    if (profile.college) meta.push(profile.college);
    var metaEl = UI.$('#uMeta');
    metaEl.textContent = meta.join(' · ');
    metaEl.hidden = false;
  }

  // 统计：累计发布条数、找回率（已找到/已归还占比）
  var doneCount = items.filter(function (it) { return it.status === 'done'; }).length;
  var rate = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  UI.$('#uStats').textContent = '累计发布 ' + items.length + ' 条 · 找回率 ' + rate + '%';
  UI.$('#uCount').textContent = items.length;

  /* ---------- 联系方式：从该发布者各条信息中收集去重，分行展示 ---------- */

  /** 按内容前缀识别联系方式类型，返回对应图标 */
  function contactIcon(contact) {
    if (/(@|邮箱|mail)/i.test(contact)) return '📧';
    if (/(qq)/i.test(contact)) return '🐧';
    if (/(微信|wechat|vx)/i.test(contact)) return '💬';
    return '📞';
  }

  var contacts = [];
  items.forEach(function (it) {
    if (it.contact && contacts.indexOf(it.contact) === -1) {
      contacts.push(it.contact);
    }
  });

  if (contacts.length) {
    var wrap = UI.$('#uContactWrap');
    wrap.hidden = false;
    contacts.forEach(function (contact) {
      var row = document.createElement('div');
      row.className = 'up-contact-row';

      var icon = document.createElement('span');
      icon.className = 'up-contact-icon';
      icon.textContent = contactIcon(contact);
      row.appendChild(icon);

      var text = document.createElement('span');
      text.className = 'up-contact-text';
      text.textContent = contact;
      row.appendChild(text);

      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'up-contact-copy';
      copyBtn.textContent = '复制';
      copyBtn.addEventListener('click', function () {
        UI.copyText(
          contact,
          function () { UI.toast('联系方式已复制'); },
          function () { UI.toast('复制失败，请手动长按选择复制', 'error'); }
        );
      });
      row.appendChild(copyBtn);

      wrap.appendChild(row);
    });
  }

  // 帖子列表（复用公共卡片渲染，含空状态切换）
  UI.renderCardList(listEl, items, emptyEl, 'TA 还没有发布过信息');
})();
