/**
 * profile.js —— 个人中心主页
 * 展示头像、昵称、统计（发布/已找回/收藏），提供我的发布/收藏/消息/设置入口。
 */
(function () {
  'use strict';

  Storage.initStorage();

  var profile = Storage.getProfile();
  UI.$('#pAvatar').textContent = profile.avatar || '🐱';
  UI.$('#pName').textContent = profile.nickname || '福大同学';

  // 学号 · 学院（设置页填写，未填则不显示该行）
  var meta = [];
  if (profile.studentId) meta.push('学号 ' + profile.studentId);
  if (profile.college) meta.push(profile.college);
  UI.$('#pMeta').textContent = meta.join(' · ');
  UI.$('#pMeta').hidden = meta.length === 0;

  // 统计：本机发布数、其中已完成（已找回/已归还）数、收藏数
  var mineItems = Storage.getMineItems();
  var doneCount = mineItems.filter(function (i) { return i.status === 'done'; }).length;

  UI.$('#pTotal').textContent = mineItems.length;
  UI.$('#pDone').textContent = doneCount;
  UI.$('#pFav').textContent = Storage.getFavoriteItems().length;
})();
