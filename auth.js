/**
 * SUBSCOPE Authentication Module
 * localStorage + Web Crypto API ベースの認証システム
 */
(function () {
  'use strict';

  const USERS_KEY = 'ss_users';
  const SESSION_KEY = 'ss_session';

  // ── パスワードハッシュ ────────────────────────────────────────────
  async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function genSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function genId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  // ── ストレージ ───────────────────────────────────────────────────
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
  }
  function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }
  function saveSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }

  // ── 公開 API ─────────────────────────────────────────────────────
  const Auth = {
    async register(email, password, name) {
      const e = (email || '').toLowerCase().trim();
      const n = (name || '').trim();
      if (!e || !password || !n) throw new Error('すべての項目を入力してください');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error('メールアドレスの形式が正しくありません');
      if (password.length < 8) throw new Error('パスワードは8文字以上で設定してください');

      const users = getUsers();
      if (users[e]) throw new Error('このメールアドレスはすでに登録されています');

      const salt = genSalt();
      const hash = await hashPassword(password, salt);
      const id = genId();
      users[e] = { email: e, name: n, salt, hash, id, createdAt: new Date().toISOString() };
      saveUsers(users);

      const session = { email: e, name: n, id };
      saveSession(session);
      return session;
    },

    async login(email, password) {
      const e = (email || '').toLowerCase().trim();
      if (!e || !password) throw new Error('メールアドレスとパスワードを入力してください');

      const users = getUsers();
      const user = users[e];
      if (!user) throw new Error('メールアドレスまたはパスワードが正しくありません');

      const hash = await hashPassword(password, user.salt);
      if (hash !== user.hash) throw new Error('メールアドレスまたはパスワードが正しくありません');

      const session = { email: e, name: user.name, id: user.id };
      saveSession(session);
      return session;
    },

    logout() {
      localStorage.removeItem(SESSION_KEY);
      window.location.reload();
    },

    getCurrentUser() { return getSession(); },
    isLoggedIn() { return !!getSession(); }
  };

  window.Auth = Auth;

  // ── HTML エスケープ ──────────────────────────────────────────────
  function escHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── ヘッダーにログインボタン / アバターを注入 ───────────────────
  function injectHeader() {
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    // nav-right を flex に
    navRight.style.display = 'flex';
    navRight.style.alignItems = 'center';
    navRight.style.gap = '8px';

    const user = Auth.getCurrentUser();
    const wrap = document.createElement('div');
    wrap.className = 'auth-header-wrap';

    if (user) {
      const initial = user.name ? user.name[0].toUpperCase() : '?';
      wrap.innerHTML = `
        <button class="auth-avatar-btn" id="authAvatarBtn" aria-label="アカウントメニュー" type="button">
          <span class="auth-avatar-initial">${escHtml(initial)}</span>
        </button>
        <div class="auth-dropdown" id="authDropdown">
          <div class="auth-dropdown-name">${escHtml(user.name)}</div>
          <div class="auth-dropdown-email">${escHtml(user.email)}</div>
          <hr class="auth-dropdown-hr">
          <button class="auth-dropdown-link auth-logout-btn" id="authLogoutBtn" type="button">ログアウト</button>
        </div>`;
    } else {
      wrap.innerHTML = `<a class="auth-login-btn" href="/login.html">ログイン</a>`;
    }

    navRight.insertBefore(wrap, navRight.firstChild);

    if (user) {
      const btn = document.getElementById('authAvatarBtn');
      const dd = document.getElementById('authDropdown');
      if (btn && dd) {
        btn.addEventListener('click', (e) => { e.stopPropagation(); dd.classList.toggle('open'); });
        document.addEventListener('click', () => dd.classList.remove('open'));
      }
      const logoutBtn = document.getElementById('authLogoutBtn');
      if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());
    }
  }

  // ── ナビオーバーレイにログイン / ログアウトを注入 ───────────────
  function injectNavOverlay() {
    const navList = document.querySelector('.nav-overlay .nav-list');
    if (!navList) return;
    const user = Auth.getCurrentUser();

    const li = document.createElement('li');
    li.className = 'auth-nav-item';

    if (user) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-link auth-nav-logout';
      btn.textContent = `ログアウト (${user.name})`;
      btn.addEventListener('click', () => Auth.logout());
      li.appendChild(btn);
    } else {
      li.innerHTML = `<a href="/login.html" class="nav-link">ログイン / 会員登録</a>`;
    }

    navList.appendChild(li);
  }

  // ── グローバル CSS を注入 ────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('auth-global-styles')) return;
    const style = document.createElement('style');
    style.id = 'auth-global-styles';
    style.textContent = `
      .auth-header-wrap { position: relative; flex-shrink: 0; }

      /* ログインボタン（未ログイン） */
      .auth-login-btn {
        display: inline-flex; align-items: center; padding: 9px 20px;
        border-radius: 999px; background: #1d1d1f; color: #fff !important;
        font-size: 0.875rem; font-weight: 600; white-space: nowrap;
        transition: opacity 0.2s; text-decoration: none !important;
      }
      .auth-login-btn:hover { opacity: 0.75; }

      /* アバターボタン（ログイン済み） */
      .auth-avatar-btn {
        width: 36px; height: 36px; border-radius: 50%; border: none;
        background: #1d1d1f; color: #fff; font-size: 0.85rem; font-weight: 700;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; transition: opacity 0.2s; padding: 0;
        -webkit-tap-highlight-color: transparent;
      }
      .auth-avatar-btn:hover { opacity: 0.75; }

      /* ドロップダウン */
      .auth-dropdown {
        position: absolute; top: calc(100% + 8px); right: 0; min-width: 200px;
        background: rgba(255,255,255,0.97); backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(0,0,0,0.08); border-radius: 20px;
        box-shadow: 0 16px 48px rgba(0,0,0,0.14); padding: 16px;
        opacity: 0; visibility: hidden; transform: translateY(-8px);
        transition: all 0.22s cubic-bezier(0.2,0.8,0.2,1); z-index: 9999;
      }
      .auth-dropdown.open { opacity: 1; visibility: visible; transform: translateY(0); }
      .auth-dropdown-name { font-size: 0.9rem; font-weight: 700; margin-bottom: 2px; }
      .auth-dropdown-email { font-size: 0.78rem; color: #86868b; margin-bottom: 12px; word-break: break-all; }
      .auth-dropdown-hr { border: none; border-top: 1px solid rgba(0,0,0,0.08); margin-bottom: 10px; }
      .auth-dropdown-link {
        display: block; width: 100%; padding: 9px 12px; border-radius: 10px;
        font-size: 0.88rem; font-weight: 500; color: #1d1d1f;
        transition: background 0.18s; cursor: pointer; text-align: left;
        background: none; border: none; font-family: inherit;
      }
      .auth-dropdown-link:hover { background: #f5f5f7; }
      .auth-logout-btn { color: #c0392b !important; }

      /* ナビオーバーレイ */
      .auth-nav-item {
        margin-top: 12px; padding-top: 12px;
        border-top: 1px solid rgba(0,0,0,0.06);
      }
      .auth-nav-logout {
        display: block; width: 100%; padding: 10px 16px; border-radius: 12px;
        font-size: 0.95rem; font-weight: 500; color: #c0392b;
        transition: background 0.2s; cursor: pointer; text-align: left;
        background: none; border: none; font-family: inherit;
      }
      .auth-nav-logout:hover { background: #fff5f5; }

      /* モバイルではヘッダーのauth-wrapを非表示（nav-overlayのみ） */
      @media (max-width: 767px) {
        .auth-header-wrap { display: none; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── 初期化 ───────────────────────────────────────────────────────
  function init() {
    injectStyles();
    injectHeader();
    injectNavOverlay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
