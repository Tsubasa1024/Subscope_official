/**
 * SUBSCOPE Authentication Module
 * Firebase Authentication ベースの認証システム
 * Google / Apple / メール+パスワード に対応
 * 複数端末から同じアカウントでログイン可能
 */
(function () {
  'use strict';

  var firebaseConfig = {
    apiKey:            "AIzaSyC1lUuoJbdmS7mOR5HJXtwHDvc2H2d_CQI",
    authDomain:        "subscope-official.firebaseapp.com",
    databaseURL:       "https://subscope-official-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "subscope-official",
    storageBucket:     "subscope-official.firebasestorage.app",
    messagingSenderId: "23013449946",
    appId:             "1:23013449946:web:61638133bee9a203cac5e3"
  };

  if (typeof firebase === 'undefined') {
    console.warn('[Auth] Firebase SDK が読み込まれていません。auth.js より前に Firebase CDN を追加してください。');
    window.Auth = {
      register:        function() { return Promise.reject(new Error('Firebase 未設定')); },
      login:           function() { return Promise.reject(new Error('Firebase 未設定')); },
      loginWithGoogle: function() { return Promise.reject(new Error('Firebase 未設定')); },
      loginWithApple:  function() { return Promise.reject(new Error('Firebase 未設定')); },
      logout:          function() {},
      getCurrentUser:  function() { return null; },
      isLoggedIn:      function() { return false; },
      onReady:         function(cb) { cb(null); }
    };
    return;
  }

  // ── Firebase 初期化（重複防止） ───────────────────────────────────
  var app;
  try { app = firebase.app(); } catch (e) { app = firebase.initializeApp(firebaseConfig); }
  var fbAuth = firebase.auth(app);

  // ── 認証状態キャッシュ ────────────────────────────────────────────
  var _currentUser   = null;
  var _ready         = false;
  var _readyCallbacks = [];

  function _makeSession(user) {
    if (!user) return null;
    return {
      email: user.email || '',
      name:  user.displayName || (user.email ? user.email.split('@')[0] : 'ユーザー'),
      id:    user.uid
    };
  }

  fbAuth.onAuthStateChanged(function (user) {
    _currentUser = _makeSession(user);
    if (!_ready) {
      _ready = true;
      _readyCallbacks.forEach(function (cb) { cb(_currentUser); });
      _readyCallbacks = [];
    }
    _reinitHeader();
  });

  // ── 公開 API ─────────────────────────────────────────────────────
  var Auth = {
    /** メール + パスワード 新規登録 */
    register: async function (email, password, name) {
      var e = (email || '').toLowerCase().trim();
      var n = (name  || '').trim();
      if (!e || !password || !n) throw new Error('すべての項目を入力してください');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error('メールアドレスの形式が正しくありません');
      if (password.length < 8) throw new Error('パスワードは8文字以上で設定してください');

      var cred = await fbAuth.createUserWithEmailAndPassword(e, password);
      await cred.user.updateProfile({ displayName: n });
      _currentUser = { email: e, name: n, id: cred.user.uid };
      return _currentUser;
    },

    /** メール + パスワード ログイン */
    login: async function (email, password) {
      var e = (email || '').toLowerCase().trim();
      if (!e || !password) throw new Error('メールアドレスとパスワードを入力してください');
      var cred = await fbAuth.signInWithEmailAndPassword(e, password);
      _currentUser = _makeSession(cred.user);
      return _currentUser;
    },

    /** Google でログイン */
    loginWithGoogle: async function () {
      var provider = new firebase.auth.GoogleAuthProvider();
      var cred = await fbAuth.signInWithPopup(provider);
      _currentUser = _makeSession(cred.user);
      return _currentUser;
    },

    /** Apple でログイン */
    loginWithApple: async function () {
      var provider = new firebase.auth.OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      var cred = await fbAuth.signInWithPopup(provider);
      _currentUser = _makeSession(cred.user);
      return _currentUser;
    },

    logout: function () {
      return fbAuth.signOut().then(function () {
        _currentUser = null;
        window.location.reload();
      });
    },

    getCurrentUser: function () { return _currentUser; },
    isLoggedIn:     function () { return !!_currentUser; },

    /** 認証状態が確定したら呼ばれるコールバックを登録 */
    onReady: function (callback) {
      if (_ready) { callback(_currentUser); } else { _readyCallbacks.push(callback); }
    }
  };

  window.Auth = Auth;

  // ── HTML エスケープ ──────────────────────────────────────────────
  function escHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── ヘッダーにログインボタン / アバターを注入 ───────────────────
  function injectHeader() {
    var navRight = document.querySelector('.nav-right');
    if (!navRight) return;
    if (document.querySelector('.auth-header-wrap')) return; // 二重注入防止

    navRight.style.display    = 'flex';
    navRight.style.alignItems = 'center';
    navRight.style.gap        = '8px';

    var user = Auth.getCurrentUser();
    var wrap = document.createElement('div');
    wrap.className = 'auth-header-wrap';

    if (user) {
      var initial = user.name ? user.name[0].toUpperCase() : '?';
      wrap.innerHTML =
        '<button class="auth-avatar-btn" id="authAvatarBtn" aria-label="アカウントメニュー" type="button">' +
          '<span class="auth-avatar-initial">' + escHtml(initial) + '</span>' +
        '</button>' +
        '<div class="auth-dropdown" id="authDropdown">' +
          '<div class="auth-dropdown-name">'  + escHtml(user.name)  + '</div>' +
          '<div class="auth-dropdown-email">' + escHtml(user.email) + '</div>' +
          '<hr class="auth-dropdown-hr">' +
          '<button class="auth-dropdown-link auth-logout-btn" id="authLogoutBtn" type="button">ログアウト</button>' +
        '</div>';
    } else {
      wrap.innerHTML = '<a class="auth-login-btn" href="/login.html">ログイン</a>';
    }

    navRight.insertBefore(wrap, navRight.firstChild);

    if (user) {
      var btn = document.getElementById('authAvatarBtn');
      var dd  = document.getElementById('authDropdown');
      if (btn && dd) {
        btn.addEventListener('click', function (e) { e.stopPropagation(); dd.classList.toggle('open'); });
        document.addEventListener('click', function () { dd.classList.remove('open'); });
      }
      var logoutBtn = document.getElementById('authLogoutBtn');
      if (logoutBtn) logoutBtn.addEventListener('click', function () { Auth.logout(); });
    }
  }

  // ── ナビオーバーレイにログイン / ログアウトを注入 ───────────────
  function injectNavOverlay() {
    var navList = document.querySelector('.nav-overlay .nav-list');
    if (!navList) return;
    if (document.querySelector('.auth-nav-item')) return; // 二重注入防止

    var user = Auth.getCurrentUser();
    var li = document.createElement('li');
    li.className = 'auth-nav-item';

    if (user) {
      var btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = 'nav-link auth-nav-logout';
      btn.textContent = 'ログアウト (' + user.name + ')';
      btn.addEventListener('click', function () { Auth.logout(); });
      li.appendChild(btn);
    } else {
      li.innerHTML = '<a href="/login.html" class="nav-link">ログイン / 会員登録</a>';
    }

    navList.appendChild(li);
  }

  // ── ヘッダーを再描画（認証状態変化時） ─────────────────────────
  function _reinitHeader() {
    var existingWrap = document.querySelector('.auth-header-wrap');
    var existingNav  = document.querySelector('.auth-nav-item');
    if (existingWrap) existingWrap.remove();
    if (existingNav)  existingNav.remove();
    injectHeader();
    injectNavOverlay();
  }

  // ── グローバル CSS を注入 ────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('auth-global-styles')) return;
    var style = document.createElement('style');
    style.id = 'auth-global-styles';
    style.textContent = [
      '.auth-header-wrap { position: relative; flex-shrink: 0; }',

      /* ログインボタン（未ログイン） */
      '.auth-login-btn {',
      '  display: inline-flex; align-items: center; padding: 9px 20px;',
      '  border-radius: 999px; background: #1d1d1f; color: #fff !important;',
      '  font-size: 0.875rem; font-weight: 600; white-space: nowrap;',
      '  transition: opacity 0.2s; text-decoration: none !important;',
      '}',
      '.auth-login-btn:hover { opacity: 0.75; }',

      /* アバターボタン（ログイン済み） */
      '.auth-avatar-btn {',
      '  width: 36px; height: 36px; border-radius: 50%; border: none;',
      '  background: #1d1d1f; color: #fff; font-size: 0.85rem; font-weight: 700;',
      '  cursor: pointer; display: flex; align-items: center; justify-content: center;',
      '  flex-shrink: 0; transition: opacity 0.2s; padding: 0;',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
      '.auth-avatar-btn:hover { opacity: 0.75; }',

      /* ドロップダウン */
      '.auth-dropdown {',
      '  position: absolute; top: calc(100% + 8px); right: 0; min-width: 200px;',
      '  background: rgba(255,255,255,0.97); backdrop-filter: blur(20px);',
      '  -webkit-backdrop-filter: blur(20px);',
      '  border: 1px solid rgba(0,0,0,0.08); border-radius: 20px;',
      '  box-shadow: 0 16px 48px rgba(0,0,0,0.14); padding: 16px;',
      '  opacity: 0; visibility: hidden; transform: translateY(-8px);',
      '  transition: all 0.22s cubic-bezier(0.2,0.8,0.2,1); z-index: 9999;',
      '}',
      '.auth-dropdown.open { opacity: 1; visibility: visible; transform: translateY(0); }',
      '.auth-dropdown-name  { font-size: 0.9rem; font-weight: 700; margin-bottom: 2px; }',
      '.auth-dropdown-email { font-size: 0.78rem; color: #86868b; margin-bottom: 12px; word-break: break-all; }',
      '.auth-dropdown-hr    { border: none; border-top: 1px solid rgba(0,0,0,0.08); margin-bottom: 10px; }',
      '.auth-dropdown-link {',
      '  display: block; width: 100%; padding: 9px 12px; border-radius: 10px;',
      '  font-size: 0.88rem; font-weight: 500; color: #1d1d1f;',
      '  transition: background 0.18s; cursor: pointer; text-align: left;',
      '  background: none; border: none; font-family: inherit;',
      '}',
      '.auth-dropdown-link:hover { background: #f5f5f7; }',
      '.auth-logout-btn { color: #c0392b !important; }',

      /* ナビオーバーレイ */
      '.auth-nav-item {',
      '  margin-top: 12px; padding-top: 12px;',
      '  border-top: 1px solid rgba(0,0,0,0.06);',
      '}',
      '.auth-nav-logout {',
      '  display: block; width: 100%; padding: 10px 16px; border-radius: 12px;',
      '  font-size: 0.95rem; font-weight: 500; color: #c0392b;',
      '  transition: background 0.2s; cursor: pointer; text-align: left;',
      '  background: none; border: none; font-family: inherit;',
      '}',
      '.auth-nav-logout:hover { background: #fff5f5; }',

      /* モバイルではヘッダーのauth-wrapを非表示（nav-overlayのみ） */
      '@media (max-width: 767px) {',
      '  .auth-header-wrap { display: none; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── 初期化 ───────────────────────────────────────────────────────
  function init() {
    injectStyles();
    Auth.onReady(function () {
      injectHeader();
      injectNavOverlay();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
