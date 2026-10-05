/**
 * index.js —— 首页逻辑
 * 功能：列表渲染、关键词搜索（名称/描述/地点/类别）、
 * 类型筛选（全部/寻物/招领）、类别筛选、空状态。
 */
(function () {
  'use strict';

  // 首次运行写入示例数据
  Storage.initStorage();

  // 当前筛选状态
  var state = {
    keyword: '',
    type: 'all',       // all | lost | found
    category: 'all',   // all | 具体类别
    campus: Storage.getCampus(),  // 校区筛选
    sort: 'desc'       // desc | asc（按发布时间 createdAt 排序，默认最新在前）
  };

  var listEl = UI.$('#itemList');
  var emptyEl = UI.$('#emptyState');
  var searchInput = UI.$('#searchInput');
  var categoryPills = UI.$('#categoryPills');

  /** 动态生成类别胶囊（全部 + 各类别） */
  function initCategoryPills() {
    var names = ['all'].concat(Storage.CATEGORIES);
    names.forEach(function (name) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-pill' + (name === 'all' ? ' active' : '');
      btn.setAttribute('data-category', name);
      btn.setAttribute('role', 'tab');
      btn.textContent = name === 'all' ? '全部' : name;
      categoryPills.appendChild(btn);
    });
  }

  /** 按当前 state 过滤并渲染列表 */
  function render() {
    var keyword = state.keyword.trim().toLowerCase();
    var filtered = Storage.getItems().filter(function (item) {
      // 类型筛选
      if (state.type !== 'all' && item.type !== state.type) return false;

      // 类别筛选
      if (state.category !== 'all' && item.category !== state.category) return false;

      // 校区筛选
      if (Storage.itemCampus(item) !== state.campus) return false;

      // 关键词：匹配物品名称、描述、地点、类别
      if (keyword) {
        var haystack = [item.title, item.description, item.location, item.category]
          .join(' ').toLowerCase();
        if (haystack.indexOf(keyword) === -1) return false;
      }
      return true;
    });

    var emptyText = keyword
      ? '没有找到与“' + state.keyword.trim() + '”相关的信息，换个关键词试试～'
      : state.campus + ' 校区暂无相关信息';

    // 按发布时间排序（精确时间戳 createdAt）：desc 最新在前，asc 最早在前
    filtered.sort(function (a, b) {
      var ta = a.createdAt || 0;
      var tb = b.createdAt || 0;
      return state.sort === 'asc' ? ta - tb : tb - ta;
    });

    UI.renderCardList(listEl, filtered, emptyEl, emptyText);
  }

  /* ---------- 事件绑定 ---------- */

  // 校区切换（原生 select，记录到 Storage 并按校区过滤列表）
  var campusSelect = UI.$('#campusSelect');
  campusSelect.value = state.campus;
  campusSelect.addEventListener('change', function () {
    state.campus = campusSelect.value;
    Storage.setCampus(campusSelect.value);
    render();
    UI.toast('已切换到' + campusSelect.value);
  });

  // 搜索（input 事件实时触发）
  searchInput.addEventListener('input', function () {
    state.keyword = searchInput.value;
    render();
  });

  // 类型 Tab
  UI.$all('.type-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      UI.$all('.type-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      state.type = tab.getAttribute('data-type');
      render();
    });
  });

  // 类别胶囊筛选
  categoryPills.addEventListener('click', function (e) {
    var pill = e.target.closest('.cat-pill');
    if (!pill) return;
    UI.$all('.cat-pill', categoryPills).forEach(function (p) { p.classList.remove('active'); });
    pill.classList.add('active');
    state.category = pill.getAttribute('data-category');
    render();
  });

  // 排序方式切换（默认最新发布 desc，可切最早发布 asc）
  var sortSelect = UI.$('#sortSelect');
  sortSelect.value = state.sort;
  sortSelect.addEventListener('change', function () {
    state.sort = sortSelect.value;
    render();
  });

  initCategoryPills();
  render();
})();
