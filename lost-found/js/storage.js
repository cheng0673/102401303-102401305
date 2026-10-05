/**
 * storage.js —— 数据存储层
 * 职责：
 * 1. 封装 localStorage 的读写，所有页面只通过本模块操作数据；
 * 2. 首次运行时自动写入示例数据；
 * 3. 单独用一个 key 记录“本机发布”的信息 id，避免在数据模型里增加额外字段。
 *
 * 数据模型（每条信息）：
 * { id, type('lost'|'found'), title, category, location, time,
 *   description, contact, publisher, status('active'|'done'), createdAt }
 */
(function (global) {
  'use strict';

  // 信息列表与“本机发布”id 列表各自的存储 key
  var ITEMS_KEY = 'lost_found_items_v2';
  var MINE_KEY = 'lost_found_mine_ids_v2';
  var FAVORITES_KEY = 'lost_found_favorites_v2'; // 收藏的信息 id 列表
  var PROFILE_KEY = 'lost_found_profile_v1';     // 个人资料（昵称等）
  var REPORTS_KEY = 'lost_found_reports_v1';     // 举报记录：{ 帖子id: { reason, detail, time } }
  var CAMPUS_KEY = 'lost_found_campus_v2';       // 当前选中校区

  // 物品类别（与原型设计保持一致，后续新增类别只需改这里）
  var CATEGORIES = ['校园卡', '钥匙', '雨伞', '耳机', '水杯', '书籍', '其他'];

  // 校区列表
  var CAMPUSES = ['旗山校区', '铜盘校区', '晋江校区', '怡山校区', '厦门校区', '泉港校区'];

  // 各校区“丢失/拾取地点”快捷选项
  var CAMPUS_LOCATIONS = {
    '旗山校区': ['晋江楼', '风雨操场', '教学区西', '教学区东', '图书馆'],
    '铜盘校区': ['教学楼A', '教学楼B', '食堂', '操场', '篮球场'],
    '晋江校区': ['教学楼A', '教学楼B', '图书馆', '食堂', '体育馆', '操场'],
    '怡山校区': ['操场', '网球馆', '教学楼东', '教学楼西', '图书馆', '篮球馆', '食堂'],
    '厦门校区': ['1号教学楼', '2号教学楼', '操场', '图书馆', '食堂', '篮球场', '排球场'],
    '泉港校区': ['图书馆', '体育馆', '科学楼', '实验楼A', '实验楼B', '操场', '篮球场', '教学楼1', '教学楼2', '教学楼3']
  };

  /** 生成唯一 id：时间戳 36 进制 + 随机串 */
  function genId() {
    return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /** 安全读取 JSON */
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('读取 localStorage 失败：', key, e);
      return fallback;
    }
  }

  /** 安全写入 JSON */
  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('写入 localStorage 失败：', key, e);
      return false;
    }
  }

  /**
   * 构造示例数据（首次运行写入）
   * 其中 seed-2、seed-5 同时写入“本机发布”，方便演示“我的发布”页。
   */
  function buildSeedItems() {
    var HOUR = 3600 * 1000;
    var now = Date.now();
    return [
      {
        id: 'seed-1',
        type: 'lost',
        title: '黑色卡套校园卡',
        category: '校园卡',
        location: '图书馆二楼自习区',
        time: new Date(now - 2 * HOUR).toISOString(),
        description: '卡套上挂着一个小熊挂件，卡面姓名里有“陈”字。今晚就要用卡进图书馆，捡到的同学麻烦联系我，必谢，请喝奶茶！',
        contact: 'QQ 123456789',
        publisher: '陈同学',
        status: 'active',
        createdAt: now - 2 * HOUR
      },
      {
        id: 'seed-2',
        type: 'found',
        title: '一串蓝色挂绳钥匙（共3把）',
        category: '钥匙',
        location: '旗山校区西三教学楼 301',
        time: new Date(now - 26 * HOUR).toISOString(),
        description: '下课后在第三排座位底下捡到的，蓝色尼龙挂绳，上面有3把钥匙和一个小指甲剪。已在楼管处登记，失主请核对钥匙特征。',
        contact: '微信 xiaoming2026',
        publisher: '明仔',
        status: 'done',
        createdAt: now - 26 * HOUR
      },
      {
        id: 'seed-3',
        type: 'lost',
        title: '黑色长柄雨伞',
        category: '雨伞',
        location: '学生活动中心门口',
        time: new Date(now - 5 * HOUR).toISOString(),
        description: '昨天下午看演出时带去的黑胶长柄伞，伞柄处缠了一圈红色胶带做记号，散场时忘记拿了。',
        contact: '手机 138****6620',
        publisher: '小林',
        status: 'active',
        createdAt: now - 5 * HOUR
      },
      {
        id: 'seed-4',
        type: 'found',
        title: '白色无线耳机一副',
        category: '耳机',
        location: '紫荆园食堂三楼',
        time: new Date(now - 8 * HOUR).toISOString(),
        description: '中午在三楼靠窗的餐桌上捡到白色无线耳机一副，已擦干净收好了。请失主描述品牌和充电盒特征。',
        contact: 'QQ 987654321',
        publisher: '热心肠阿杰',
        status: 'active',
        createdAt: now - 8 * HOUR
      },
      {
        id: 'seed-5',
        type: 'lost',
        title: '银色不锈钢保温杯',
        category: '水杯',
        location: '体育馆室外篮球场',
        time: new Date(now - 30 * HOUR).toISOString(),
        description: '昨晚打完球把杯子落在场边台阶上了，银色保温杯，杯底贴了写着“03”的姓名贴，对我挺有纪念意义的。',
        contact: '微信 baller_1024',
        publisher: '我自己',
        status: 'active',
        createdAt: now - 30 * HOUR
      },
      {
        id: 'seed-6',
        type: 'found',
        title: '《高等数学（上）》教材一本',
        category: '书籍',
        location: '铜盘校区教学楼 A 座 205',
        time: new Date(now - 50 * HOUR).toISOString(),
        description: '在 205 倒数第二排桌斗里发现的，书内有不少笔记和一张明信片，书主应该很好辨认。书已交给 A 座值班室。',
        contact: 'QQ 23333333',
        publisher: '晚自习同桌',
        status: 'done',
        createdAt: now - 50 * HOUR
      },
      {
        id: 'seed-7',
        type: 'lost',
        campus: '晋江校区',
        title: '黑色双肩书包',
        category: '其他',
        location: '晋江校区图书馆三楼',
        time: new Date(now - 3 * HOUR).toISOString(),
        description: '中午在三楼自习区离开时忘记带走，黑色耐克双肩包，里面有课本和一个蓝色笔袋。对我很重要，捡到请联系，谢谢！',
        contact: 'QQ 112233445',
        publisher: '晋江小黄',
        status: 'active',
        createdAt: now - 3 * HOUR
      },
      {
        id: 'seed-8',
        type: 'found',
        campus: '晋江校区',
        title: '一串宿舍钥匙（带小熊挂件）',
        category: '钥匙',
        location: '晋江校区食堂二楼',
        time: new Date(now - 7 * HOUR).toISOString(),
        description: '打饭时在靠窗座位上捡到的，银色钥匙串挂着棕色小熊公仔，还有一个门禁卡。已放在食堂服务台。',
        contact: '微信 jinjiang_lost',
        publisher: '食堂阿姨',
        status: 'active',
        createdAt: now - 7 * HOUR
      },
      {
        id: 'seed-9',
        type: 'lost',
        campus: '怡山校区',
        title: '蓝色折叠雨伞',
        category: '雨伞',
        location: '怡山校区教学楼东 302',
        time: new Date(now - 4 * HOUR).toISOString(),
        description: '上完课把伞落在教室了，蓝色三折伞，伞柄上有姓名贴写着"怡山小李"。最近老下雨，急需用伞。',
        contact: '手机 139****8810',
        publisher: '怡山小李',
        status: 'active',
        createdAt: now - 4 * HOUR
      },
      {
        id: 'seed-10',
        type: 'found',
        campus: '怡山校区',
        title: '红色校园卡一张',
        category: '校园卡',
        location: '怡山校区操场看台下',
        time: new Date(now - 9 * HOUR).toISOString(),
        description: '晨跑时在看台台阶上捡到一张校园卡，卡面有轻微划痕，姓名里有"婷"字。已放至操场值班室。',
        contact: 'QQ 556677889',
        publisher: '晨跑大叔',
        status: 'active',
        createdAt: now - 9 * HOUR
      },
      {
        id: 'seed-11',
        type: 'lost',
        campus: '厦门校区',
        title: '白色 AirPods Pro 充电盒',
        category: '耳机',
        location: '厦门校区 1 号教学楼 101',
        time: new Date(now - 6 * HOUR).toISOString(),
        description: '白色 AirPods Pro 充电盒，盒底刻了名字缩写"X.M."，耳机还在盒子里。上课时掉的，求好心人归还。',
        contact: '微信 xiamen_stu',
        publisher: '厦门小徐',
        status: 'active',
        createdAt: now - 6 * HOUR
      },
      {
        id: 'seed-12',
        type: 'found',
        campus: '厦门校区',
        title: '《线性代数》教材及笔记',
        category: '书籍',
        location: '厦门校区图书馆二楼',
        time: new Date(now - 12 * HOUR).toISOString(),
        description: '在二楼靠窗座位发现一本线代教材，夹了好几页手写笔记，笔记字迹工整。书已交图书馆前台。',
        contact: 'QQ 998877665',
        publisher: '图书馆志愿者',
        status: 'done',
        createdAt: now - 12 * HOUR
      },
      {
        id: 'seed-13',
        type: 'lost',
        campus: '泉港校区',
        title: '绿色运动水壶',
        category: '水杯',
        location: '泉港校区体育馆篮球场',
        time: new Date(now - 2 * HOUR).toISOString(),
        description: '打完球把水壶落在场边了，绿色 1L 运动水壶，壶身贴了"泉港阿强"的标签。天热没水喝太难受了。',
        contact: '手机 137****5566',
        publisher: '泉港阿强',
        status: 'active',
        createdAt: now - 2 * HOUR
      },
      {
        id: 'seed-14',
        type: 'found',
        campus: '泉港校区',
        title: '一串实验室钥匙（5把）',
        category: '钥匙',
        location: '泉港校区实验楼 A 大厅',
        time: new Date(now - 11 * HOUR).toISOString(),
        description: '在实验楼 A 座一楼大厅休息区捡到的，5 把钥匙挂在红色挂绳上，还有一个"实验中心"铭牌。已交实验楼门卫处。',
        contact: 'QQ 445566778',
        publisher: '实验楼保安',
        status: 'active',
        createdAt: now - 11 * HOUR
      }
    ];
  }

  /** 初始化：首次运行写入示例数据、默认收藏与默认个人资料 */
  function initStorage() {
    if (localStorage.getItem(ITEMS_KEY) === null) {
      writeJSON(ITEMS_KEY, buildSeedItems());
      // 示例中 seed-2、seed-5 视为本机发布
      writeJSON(MINE_KEY, ['seed-2', 'seed-5']);
    }
    if (localStorage.getItem(FAVORITES_KEY) === null) {
      // 默认收藏 1 条，方便演示“我的收藏”
      writeJSON(FAVORITES_KEY, ['seed-1']);
    }
    if (localStorage.getItem(PROFILE_KEY) === null) {
      writeJSON(PROFILE_KEY, { nickname: '福大同学', avatar: '🐱', studentId: '', college: '' });
    }
  }

  /** 读取全部信息（按发布时间倒序） */
  function getItems() {
    var items = readJSON(ITEMS_KEY, []);
    return items.slice().sort(function (a, b) {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  /** 根据 id 获取单条信息 */
  function getItem(id) {
    var items = readJSON(ITEMS_KEY, []);
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  /** 新增信息，data 为表单数据；返回保存后的完整记录 */
  function addItem(data) {
    var items = readJSON(ITEMS_KEY, []);
    var record = {
      id: genId(),
      type: data.type,
      title: data.title,
      category: data.category,
      campus: data.campus || getCampus(),
      location: data.location,
      time: data.time,
      description: data.description,
      contact: data.contact,
      publisher: data.publisher,
      images: Array.isArray(data.images) ? data.images : [],
      status: 'active',
      createdAt: Date.now()
    };
    items.push(record);
    writeJSON(ITEMS_KEY, items);

    // 记为“本机发布”
    var mineIds = readJSON(MINE_KEY, []);
    mineIds.push(record.id);
    writeJSON(MINE_KEY, mineIds);

    return record;
  }

  /** 更新状态（active / done） */
  function updateStatus(id, status) {
    var items = readJSON(ITEMS_KEY, []);
    var ok = false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        items[i].status = status;
        ok = true;
        break;
      }
    }
    return ok && writeJSON(ITEMS_KEY, items);
  }

  /** 删除信息（同时从“本机发布”与收藏中移除） */
  function removeItem(id) {
    var items = readJSON(ITEMS_KEY, []);
    var next = items.filter(function (item) { return item.id !== id; });
    var changed = next.length !== items.length;
    if (changed) writeJSON(ITEMS_KEY, next);

    var mineIds = readJSON(MINE_KEY, []);
    var nextMine = mineIds.filter(function (mid) { return mid !== id; });
    if (nextMine.length !== mineIds.length) writeJSON(MINE_KEY, nextMine);

    var favIds = readJSON(FAVORITES_KEY, []);
    var nextFav = favIds.filter(function (fid) { return fid !== id; });
    if (nextFav.length !== favIds.length) writeJSON(FAVORITES_KEY, nextFav);

    return changed;
  }

  /** 是否为“本机发布” */
  function isMine(id) {
    return readJSON(MINE_KEY, []).indexOf(id) !== -1;
  }

  /** 读取本机发布的全部信息（按发布时间倒序） */
  function getMineItems() {
    var mineIds = readJSON(MINE_KEY, []);
    return getItems().filter(function (item) {
      return mineIds.indexOf(item.id) !== -1;
    });
  }

  /* ---------- 收藏 ---------- */

  function getFavoriteIds() {
    return readJSON(FAVORITES_KEY, []);
  }

  function isFavorite(id) {
    return getFavoriteIds().indexOf(id) !== -1;
  }

  /** 切换收藏状态，返回切换后的布尔值 */
  function toggleFavorite(id) {
    var ids = getFavoriteIds();
    var idx = ids.indexOf(id);
    if (idx === -1) {
      ids.push(id);
      writeJSON(FAVORITES_KEY, ids);
      return true;
    } else {
      ids.splice(idx, 1);
      writeJSON(FAVORITES_KEY, ids);
      return false;
    }
  }

  /** 读取收藏的全部信息（按发布时间倒序） */
  function getFavoriteItems() {
    var ids = getFavoriteIds();
    return getItems().filter(function (item) {
      return ids.indexOf(item.id) !== -1;
    });
  }

  /* ---------- 举报 ---------- */

  function getReports() {
    return readJSON(REPORTS_KEY, {});
  }

  /** 同一用户（本机浏览器）对同一帖子只能举报一次 */
  function hasReported(id) {
    return Object.prototype.hasOwnProperty.call(getReports(), id);
  }

  /** 记录举报；重复举报返回 false */
  function addReport(id, reason, detail) {
    if (hasReported(id)) return false;
    var reports = getReports();
    reports[id] = { reason: reason, detail: detail || '', time: Date.now() };
    return writeJSON(REPORTS_KEY, reports);
  }

  /* ---------- 个人资料 ---------- */

  function getProfile() {
    return readJSON(PROFILE_KEY, { nickname: '福大同学', avatar: '🐱', studentId: '', college: '' });
  }

  function updateProfile(patch) {
    var profile = getProfile();
    Object.keys(patch).forEach(function (k) {
      profile[k] = patch[k];
    });
    writeJSON(PROFILE_KEY, profile);
    return profile;
  }

  /* ---------- 校区 ---------- */

  /** 读取当前选中校区（默认旗山校区） */
  function getCampus() {
    var c = localStorage.getItem(CAMPUS_KEY);
    return CAMPUSES.indexOf(c) !== -1 ? c : '旗山校区';
  }

  /** 切换当前校区 */
  function setCampus(campus) {
    if (CAMPUSES.indexOf(campus) === -1) return;
    try { localStorage.setItem(CAMPUS_KEY, campus); } catch (e) { /* 忽略 */ }
  }

  /** 获取某校区的地点快捷选项 */
  function getCampusLocations(campus) {
    return (CAMPUS_LOCATIONS[campus] || []).slice();
  }

  /**
   * 推断一条信息所属校区：
   * 新数据有 campus 字段直接用；旧示例数据按地点文字推断（铜盘 → 铜盘校区，其余默认旗山）。
   */
  function itemCampus(item) {
    if (item.campus) return item.campus;
    return (item.location || '').indexOf('铜盘') !== -1 ? '铜盘校区' : '旗山校区';
  }

  /** 更新信息（编辑模式）：只更新业务字段，保留 id / status / createdAt */
  function updateItem(id, data) {
    var items = readJSON(ITEMS_KEY, []);
    var ok = false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        items[i].type = data.type;
        items[i].title = data.title;
        items[i].category = data.category;
        items[i].location = data.location;
        items[i].time = data.time;
        items[i].description = data.description;
        items[i].contact = data.contact;
        items[i].publisher = data.publisher;
        if (data.campus !== undefined) items[i].campus = data.campus;
        if ('images' in data) items[i].images = data.images;
        ok = true;
        break;
      }
    }
    return ok && writeJSON(ITEMS_KEY, items);
  }

  /** 清空全部本地数据（设置页用） */
  function clearAll() {
    localStorage.removeItem(ITEMS_KEY);
    localStorage.removeItem(MINE_KEY);
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(REPORTS_KEY);
    localStorage.removeItem(CAMPUS_KEY);
  }

  // 暴露到全局，页面脚本通过 Storage.xxx 调用
  global.Storage = {
    CATEGORIES: CATEGORIES,
    CAMPUSES: CAMPUSES,
    CAMPUS_LOCATIONS: CAMPUS_LOCATIONS,
    initStorage: initStorage,
    getItems: getItems,
    getItem: getItem,
    addItem: addItem,
    updateStatus: updateStatus,
    removeItem: removeItem,
    isMine: isMine,
    getMineItems: getMineItems,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    getFavoriteItems: getFavoriteItems,
    getProfile: getProfile,
    updateProfile: updateProfile,
    getCampus: getCampus,
    setCampus: setCampus,
    getCampusLocations: getCampusLocations,
    itemCampus: itemCampus,
    clearAll: clearAll,
    updateItem: updateItem,
    addReport: addReport,
    hasReported: hasReported
  };
})(window);
