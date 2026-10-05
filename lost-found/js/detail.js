/**
 * detail.js —— 详情页逻辑
 * 功能：根据 URL 中的 id 渲染详情、状态标签、复制联系方式、
 * 标记为已找到 / 已归还。
 */
(function () {
  'use strict';

  Storage.initStorage();

  var wrap = UI.$('#detailWrap');
  var notFound = UI.$('#notFound');

  var id = UI.getQuery('id');
  var item = id ? Storage.getItem(id) : null;

  // 举报/修改成功跳来时带 from=home，返回键直接回首页
  if (UI.getQuery('from') === 'home') {
    UI.$('.back-btn').href = 'index.html';
  }

  // 链接异常或信息已删除
  if (!item) {
    notFound.hidden = false;
    document.title = '信息不存在 - 福大失物招领';
    return;
  }

  /* ---------- 渲染 ---------- */

  var typeBadge = UI.$('#dTypeBadge');
  var statusEl = UI.$('#dStatus');
  var markBtn = UI.$('#markDoneBtn');
  var doneActionWrap = UI.$('#doneActionWrap');

  function render() {
    // 重新从存储读取，保证标记状态后立即刷新
    item = Storage.getItem(id);
    if (!item) {
      wrap.hidden = true;
      notFound.hidden = false;
      return;
    }

    var isLost = item.type === 'lost';

    typeBadge.textContent = UI.TYPE_TEXT[item.type];
    typeBadge.className = 'badge ' + (isLost ? 'badge-lost' : 'badge-found');

    statusEl.textContent = UI.statusText(item);
    statusEl.className = 'status ' + (item.status === 'done' ? 'status-done' : 'status-active');

    UI.$('#dTitle').textContent = item.title;
    UI.$('#dCreatedAt').textContent = UI.formatDateTime(new Date(item.createdAt));
    UI.$('#dCategory').textContent = item.category;
    UI.$('#dCampus').textContent = Storage.itemCampus(item);
    UI.$('#dLocation').textContent = item.location;
    UI.$('#dTime').textContent = UI.formatDateTime(item.time);
    UI.$('#dDescription').textContent = item.description;
    UI.$('#dContact').textContent = item.contact;
    UI.$('#dPublisher').textContent = item.publisher;
    // 发布者头像（昵称哈希生成）+ 跳转发布者主页
    UI.$('#dPublisherAvatar').textContent = UI.hashAvatar(item.publisher);
    UI.$('#publisherRow').href = 'user-profile.html?name=' + encodeURIComponent(item.publisher);

    // 物品图片画廊（无图则隐藏整个面板）
    var galleryPanel = UI.$('#dGalleryPanel');
    var gallery = UI.$('#dGallery');
    var imgs = Array.isArray(item.images) ? item.images : [];
    if (imgs.length > 0) {
      galleryPanel.hidden = false;
      gallery.innerHTML = '';
      imgs.forEach(function (src, index) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = '物品图片 ' + (index + 1);
        img.loading = 'lazy';
        img.addEventListener('click', function () { openViewer(src); });
        gallery.appendChild(img);
      });
    } else {
      galleryPanel.hidden = true;
    }

    // 寻物/招领场景下的字段措辞
    UI.$('#dPlaceLabel').textContent = isLost ? '丢失地点' : '拾取地点';
    UI.$('#dTimeLabel').textContent = isLost ? '丢失时间' : '拾取时间';

    // 已完成：隐藏操作按钮，按钮文案随类型变化
    if (item.status === 'done') {
      doneActionWrap.hidden = true;
    } else {
      doneActionWrap.hidden = false;
      markBtn.textContent = isLost ? '✅ 标记为已找到' : '✅ 标记为已归还';
    }

    // 收藏按钮文案
    var favBtn = UI.$('#favBtn');
    favBtn.textContent = Storage.isFavorite(item.id) ? '⭐ 已收藏' : '☆ 收藏';
  }

  /* ---------- 全屏看图 ---------- */

  var viewer = UI.$('#imgViewer');
  var viewerImg = UI.$('#imgViewerImg');
  function openViewer(src) {
    viewerImg.src = src;
    viewer.hidden = false;
  }
  viewer.addEventListener('click', function () {
    viewer.hidden = true;
    viewerImg.src = '';
  });

  /* ---------- 复制联系方式 ---------- */

  UI.$('#copyBtn').addEventListener('click', function () {
    UI.copyText(
      item.contact,
      function () { UI.toast('联系方式已复制'); },
      function () { UI.toast('复制失败，请手动长按选择复制', 'error'); }
    );
  });

  /* ---------- 标记完成 ---------- */

  markBtn.addEventListener('click', function () {
    var word = item.type === 'lost' ? '已找到' : '已归还';
    var ok = window.confirm('确认将这条信息标记为“' + word + '”吗？');
    if (!ok) return;

    var updated = Storage.updateStatus(item.id, 'done');
    if (updated) {
      render();
      UI.toast('状态已更新为“' + word + '”');
    } else {
      UI.toast('更新失败，请重试', 'error');
    }
  });

  /* ---------- 收藏 / 取消收藏 ---------- */

  UI.$('#favBtn').addEventListener('click', function () {
    var favored = Storage.toggleFavorite(item.id);
    render();
    UI.toast(favored ? '已加入收藏' : '已取消收藏');
  });

  /* ---------- 举报入口（新功能一） ---------- */

  var reportEntry = UI.$('#reportEntry');
  if (Storage.hasReported(item.id)) {
    // 同一用户对同一帖子只能举报一次
    reportEntry.innerHTML = '<span class="reported-text">🚫 已举报，感谢你的反馈</span>';
  } else {
    UI.$('#reportLink').href = 'report.html?id=' + encodeURIComponent(item.id);
  }

  wrap.hidden = false;
  render();
})();
