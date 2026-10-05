/**
 * report.js —— 举报页逻辑（新功能一）
 * 五种举报原因单选（对应 Figma 原型「15. 举报」），补充说明选填；
 * 提交后写入 localStorage（lost_found_reports_v1）；
 * 同一用户（本机浏览器）对同一帖子只能举报一次，重复进入显示已举报态。
 */
(function () {
  'use strict';

  Storage.initStorage();

  var id = UI.getQuery('id');
  var item = id ? Storage.getItem(id) : null;
  var form = UI.$('#reportForm');
  var doneEl = UI.$('#reportDone');
  var notFound = UI.$('#notFound');

  // 链接异常或信息已删除
  if (!item) {
    form.hidden = true;
    notFound.hidden = false;
    return;
  }

  UI.$('#rTarget').textContent = item.title;

  // 已举报过：显示已举报态，不再允许重复提交
  if (Storage.hasReported(item.id)) {
    form.hidden = true;
    doneEl.hidden = false;
    return;
  }

  /* ---------- 原因单选 ---------- */

  var selectedReason = '';
  var optionBtns = UI.$all('.report-option');
  optionBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      optionBtns.forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedReason = btn.getAttribute('data-reason');
    });
  });

  /* ---------- 提交 ---------- */

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!selectedReason) {
      UI.toast('请先选择一个举报原因', 'error');
      return;
    }

    // 补充说明选填；填了则要求不少于 10 个字（与原型占位提示一致）
    var detail = UI.$('#rDetail').value.trim();
    if (detail && detail.length < 10) {
      UI.toast('补充说明不足 10 个字，可留空或写满 10 个字', 'error');
      return;
    }

    var ok = Storage.addReport(item.id, selectedReason, detail);
    if (!ok) {
      UI.toast('你已举报过这条信息', 'error');
      return;
    }

    UI.toast('举报成功，感谢你的反馈');
    setTimeout(function () {
      location.href = 'detail.html?id=' + encodeURIComponent(item.id) + '&from=home';
    }, 800);
  });
})();
