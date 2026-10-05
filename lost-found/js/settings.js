/**
 * settings.js —— 设置页
 * 修改昵称/头像、清除全部数据并恢复示例。
 */
(function () {
  'use strict';

  Storage.initStorage();

  var profile = Storage.getProfile();
  var nicknameInput = UI.$('#nickname');
  var studentIdInput = UI.$('#studentId');
  var collegeInput = UI.$('#college');
  var avatarOptions = UI.$all('.avatar-opt');
  var selectedAvatar = profile.avatar || '🐱';

  nicknameInput.value = profile.nickname || '';
  studentIdInput.value = profile.studentId || '';
  collegeInput.value = profile.college || '';

  // 选中当前头像
  avatarOptions.forEach(function (opt) {
    if (opt.getAttribute('data-avatar') === selectedAvatar) {
      opt.classList.add('active');
    }
    opt.addEventListener('click', function () {
      avatarOptions.forEach(function (o) { o.classList.remove('active'); });
      opt.classList.add('active');
      selectedAvatar = opt.getAttribute('data-avatar');
    });
  });

  // 保存资料
  UI.$('#saveProfile').addEventListener('click', function () {
    var nickname = nicknameInput.value.trim();
    if (nickname.length === 0 || nickname.length > 20) {
      UI.toast('昵称需在 1-20 个字之间', 'error');
      return;
    }
    Storage.updateProfile({
      nickname: nickname,
      avatar: selectedAvatar,
      studentId: studentIdInput.value.trim(),
      college: collegeInput.value.trim()
    });
    UI.toast('资料已保存');
    setTimeout(function () { location.href = 'profile.html'; }, 600);
  });

  // 清除全部数据并恢复示例
  UI.$('#resetData').addEventListener('click', function () {
    if (!window.confirm('确定要清除全部数据吗？清除后将恢复为初始示例数据。')) return;
    Storage.clearAll();
    if (window.Auth) Auth.logout(); // 同步清除登录态，下次打开首页会重新演示启动页/登录页
    Storage.initStorage();
    UI.toast('已恢复初始数据');
    setTimeout(function () { location.href = 'profile.html'; }, 600);
  });
})();
