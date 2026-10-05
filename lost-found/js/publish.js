/**
 * publish.js —— 发布页逻辑
 * 功能：寻物/招领类型切换、校区选择、类别选项填充（“其他”可自定义）、
 * 物品图片上传（本地压缩，最多 3 张）、地点快捷选择弹层、
 * 表单校验（逐项提示）、保存到 localStorage 并跳转成功页。
 */
(function () {
  'use strict';

  var MAX_IMAGES = 3;

  Storage.initStorage();

  var form = UI.$('#publishForm');
  var typeInput = UI.$('#type');
  var typeOptions = UI.$all('.type-option');
  var campusSelect = UI.$('#campus');
  var categorySelect = UI.$('#category');
  var categoryCustom = UI.$('#categoryCustom');
  var categoryError = UI.$('#categoryError');
  var timeInput = UI.$('#time');
  var locationInput = UI.$('#location');
  var imgInput = UI.$('#imgInput');
  var imgPreviewList = UI.$('#imgPreviewList');
  var imgAddBtn = UI.$('#imgAddBtn');

  // 已选图片（压缩后的 dataURL）
  var images = [];
  // 上一次已处理的文件框值，用于 change 事件去重
  var lastProcessedFileValue = '';

  /* ---------- 校区：由首页选择，发布页直接读取，不再提供切换 ---------- */

  campusSelect.value = Storage.getCampus();

  /* ---------- 类别 ---------- */

  Storage.CATEGORIES.forEach(function (name) {
    var opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    categorySelect.appendChild(opt);
  });

  // 选择“其他”时显示自定义输入框
  function syncCategoryCustom() {
    var isOther = categorySelect.value === '其他';
    categoryCustom.hidden = !isOther;
    if (isOther) {
      categoryCustom.focus();
    } else {
      categoryCustom.value = '';
      categoryCustom.closest('.form-group').classList.remove('has-error');
    }
  }
  categorySelect.addEventListener('change', function () {
    syncCategoryCustom();
    categorySelect.closest('.form-group').classList.remove('has-error');
  });
  categoryCustom.addEventListener('input', function () {
    categoryCustom.closest('.form-group').classList.remove('has-error');
  });

  /** 取最终类别：其他 → 自定义文本 */
  function getFinalCategory() {
    if (categorySelect.value === '其他') return categoryCustom.value.trim();
    return categorySelect.value;
  }

  /* ---------- 图片上传（压缩 + 预览） ---------- */

  /** 将图片文件读取并压缩为 JPEG dataURL，避免超出 localStorage 容量 */
  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var MAX_EDGE = 720;
          var scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          try {
            resolve(canvas.toDataURL('image/jpeg', 0.72));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /** 统一通过 hidden 属性控制预览显隐，避免与内联 display 互相覆盖 */
  function renderImagePreview() {
    imgPreviewList.innerHTML = '';
    images.forEach(function (src, index) {
      var item = document.createElement('div');
      item.className = 'img-preview-item';

      var img = document.createElement('img');
      img.src = src;
      img.alt = '物品图片 ' + (index + 1);
      img.addEventListener('click', function () { openImageViewer(src); });
      item.appendChild(img);

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'img-remove';
      removeBtn.setAttribute('aria-label', '删除第 ' + (index + 1) + ' 张图片');
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function () {
        images.splice(index, 1);
        renderImagePreview();
      });
      item.appendChild(removeBtn);

      imgPreviewList.appendChild(item);
    });

    // 达到上限时隐藏添加入口
    imgAddBtn.hidden = images.length >= MAX_IMAGES;
  }

  imgInput.addEventListener('change', function () {
    var files = Array.prototype.slice.call(imgInput.files || []);
    if (files.length === 0) return;

    // 去重守卫：个别自动化环境/浏览器会对同一次选择连续派发两次 change，
    // input.value 相同则直接忽略，避免同一张图被加入两次
    if (imgInput.value === lastProcessedFileValue) return;
    lastProcessedFileValue = imgInput.value;

    var remain = MAX_IMAGES - images.length;
    if (files.length > remain) {
      UI.toast('最多上传 ' + MAX_IMAGES + ' 张，已自动截取前 ' + remain + ' 张', 'error');
      files = files.slice(0, remain);
    }

    files.reduce(function (p, file) {
      return p.then(function () {
        if (!/^image\//.test(file.type)) {
          UI.toast('仅支持图片文件', 'error');
          return;
        }
        return compressImage(file).then(function (dataUrl) {
          images.push(dataUrl);
        });
      });
    }, Promise.resolve()).then(function () {
      renderImagePreview();
      imgInput.value = ''; // 允许再次选择同一文件
      lastProcessedFileValue = '';
    }).catch(function () {
      UI.toast('图片读取失败，请换一张试试', 'error');
      imgInput.value = '';
      lastProcessedFileValue = '';
    });
  });

  /* ---------- 地点快捷选择（原生 select） ---------- */

  var locationQuickSelect = UI.$('#locationQuickSelect');

  function renderLocationOptions() {
    var campus = Storage.getCampus();
    var locations = Storage.getCampusLocations(campus);
    locationQuickSelect.innerHTML = '<option value="">快速选择</option>';
    locations.forEach(function (name) {
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      locationQuickSelect.appendChild(opt);
    });
  }

  renderLocationOptions();

  locationQuickSelect.addEventListener('change', function () {
    if (locationQuickSelect.value) {
      locationInput.value = locationQuickSelect.value;
      locationInput.closest('.form-group').classList.remove('has-error');
    }
    locationQuickSelect.value = '';
  });

  /* ---------- 全屏看图弹层（发布页预览用） ---------- */

  function openImageViewer(src) {
    var viewer = document.createElement('div');
    viewer.className = 'img-viewer';
    var img = document.createElement('img');
    img.src = src;
    img.alt = '物品图片大图';
    viewer.appendChild(img);
    viewer.addEventListener('click', function () {
      document.body.removeChild(viewer);
    });
    document.body.appendChild(viewer);
  }

  /* ---------- 类型切换 ---------- */

  typeOptions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.getAttribute('data-type');
      typeInput.value = type;
      typeOptions.forEach(function (b) {
        b.classList.remove('selected-lost', 'selected-found');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add(type === 'lost' ? 'selected-lost' : 'selected-found');
      btn.setAttribute('aria-checked', 'true');
    });
  });

  /* ---------- 默认时间 & 昵称 ---------- */

  function toLocalInputValue(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + 'T' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0');
  }
  timeInput.value = toLocalInputValue(new Date());

  // 预填个人中心里设置过的昵称
  var publisherInput = UI.$('#publisher');
  var savedNickname = Storage.getProfile().nickname;
  if (savedNickname && savedNickname !== '福大同学') publisherInput.value = savedNickname;

  /* ---------- 编辑模式（新功能三）：URL 带 id 时预填原数据并改为更新提交 ---------- */

  var editId = UI.getQuery('id');
  var editItem = editId ? Storage.getItem(editId) : null;

  function applyEditMode() {
    UI.$('.page-header h2').textContent = '修改信息';
    document.title = '修改信息 - 福大失物招领';
    UI.$('#submitBtn').textContent = '保存修改';

    // 校区沿用原帖所属校区
    campusSelect.value = Storage.itemCampus(editItem);

    // 类型回显
    typeInput.value = editItem.type;
    typeOptions.forEach(function (b) {
      var t = b.getAttribute('data-type');
      b.classList.remove('selected-lost', 'selected-found');
      b.setAttribute('aria-checked', 'false');
      if (t === editItem.type) {
        b.classList.add(editItem.type === 'lost' ? 'selected-lost' : 'selected-found');
        b.setAttribute('aria-checked', 'true');
      }
    });

    // 类别回显：内置类别直接选中；自定义类别走“其他”+输入框
    if (Storage.CATEGORIES.indexOf(editItem.category) !== -1) {
      categorySelect.value = editItem.category;
      categoryCustom.hidden = true;
    } else {
      categorySelect.value = '其他';
      categoryCustom.hidden = false;
      categoryCustom.value = editItem.category;
    }

    UI.$('#title').value = editItem.title;
    locationInput.value = editItem.location;
    timeInput.value = toLocalInputValue(new Date(editItem.time));
    UI.$('#description').value = editItem.description;
    UI.$('#contact').value = editItem.contact;
    publisherInput.value = editItem.publisher;

    // 图片回显
    images = Array.isArray(editItem.images) ? editItem.images.slice() : [];
    renderImagePreview();
  }

  if (editId && !editItem) {
    UI.toast('原信息不存在或已被删除，已切换为发布模式', 'error');
  } else if (editItem) {
    applyEditMode();
  }

  // 输入时清除该字段的错误态
  UI.$all('.form-control', form).forEach(function (control) {
    control.addEventListener('input', function () {
      var group = control.closest('.form-group');
      if (group) group.classList.remove('has-error');
    });
    control.addEventListener('change', function () {
      var group = control.closest('.form-group');
      if (group) group.classList.remove('has-error');
    });
  });

  /* ---------- 校验 ---------- */

  function setError(fieldName, focus) {
    var group = form.querySelector('.form-group[data-field="' + fieldName + '"]');
    if (group) {
      group.classList.add('has-error');
      if (focus) {
        var control = categorySelect.value === '其他' && fieldName === 'category'
          ? categoryCustom
          : UI.$('.form-control:not([hidden])', group);
        if (control) control.focus();
      }
    }
  }

  function validate(values) {
    var ok = true;
    var firstError = null;

    function check(field, cond, errorMsg) {
      if (!cond) {
        setError(field, firstError === null);
        if (errorMsg && field === 'category') categoryError.textContent = errorMsg;
        if (firstError === null) firstError = field;
        ok = false;
      }
    }

    check('title', values.title.length >= 1 && values.title.length <= 30);

    // 类别：必选；选了“其他”时自定义类别需 1-10 个字
    if (!values.category) {
      check('category', false, '请选择物品类别');
    } else if (values.category === '其他') {
      check('category', false, '请选择物品类别');
    } else if (categorySelect.value === '其他') {
      var customLen = getFinalCategory().length;
      check('category', customLen >= 1 && customLen <= 10, '请输入自定义类别（1-10 个字）');
    }

    check('location', values.location.length >= 1 && values.location.length <= 50);

    var timeOk = false;
    if (values.time) {
      var t = new Date(values.time);
      timeOk = !isNaN(t.getTime()) && t.getTime() <= Date.now();
    }
    check('time', timeOk);

    check('description', values.description.length >= 5 && values.description.length <= 300);
    check('contact', values.contact.length >= 4 && values.contact.length <= 50);
    check('publisher', values.publisher.length >= 1 && values.publisher.length <= 20);

    return { ok: ok };
  }

  /* ---------- 提交 ---------- */

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    UI.$all('.form-group.has-error', form).forEach(function (g) {
      g.classList.remove('has-error');
    });

    var values = {
      type: typeInput.value,
      campus: campusSelect.value || Storage.getCampus(),
      title: UI.$('#title').value.trim(),
      category: getFinalCategory(),
      location: locationInput.value.trim(),
      time: timeInput.value,
      description: UI.$('#description').value.trim(),
      contact: UI.$('#contact').value.trim(),
      publisher: publisherInput.value.trim(),
      images: images.slice()
    };

    var result = validate(values);
    if (!result.ok) {
      UI.toast('请检查表单中标红的项', 'error');
      return;
    }

    try {
      // 编辑模式：更新原帖并跳详情页（新功能三）
      if (editItem) {
        Storage.updateItem(editItem.id, values);
        UI.toast('✏️ 修改成功');
        setTimeout(function () {
          location.href = 'detail.html?id=' + encodeURIComponent(editItem.id) + '&from=home';
        }, 600);
        return;
      }

      var record = Storage.addItem(values);
      UI.toast('🎉 发布成功');
      setTimeout(function () {
        location.href = 'success.html?id=' + encodeURIComponent(record.id);
      }, 600);
    } catch (err) {
      // 大概率是图片过多导致 localStorage 溢出
      console.error(err);
      UI.toast('本地存储空间不足，请减少图片数量后重试', 'error');
    }
  });

  renderImagePreview();
})();
