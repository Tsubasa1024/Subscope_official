/**
 * SUBSCOPE Firebase Likes Module
 * いいね数をFirebase Realtime Databaseで全ユーザー間共有する
 *
 * 【セットアップ手順】
 * 1. https://console.firebase.google.com でプロジェクト作成
 * 2. 「Realtime Database」を有効化（テストモードで開始 → 後でルール設定）
 * 3. プロジェクト設定 > マイアプリ > ウェブアプリ追加 > SDK設定から設定値をコピー
 * 4. 下記 firebaseConfig の各値を書き換える
 *
 * 【Realtime Database セキュリティルール】
 * {
 *   "rules": {
 *     "likes": {
 *       "$articleId": {
 *         "count": { ".read": true, ".write": true }
 *       }
 *     }
 *   }
 * }
 */

(function () {
  'use strict';

  // ▼ Firebase Console > プロジェクト設定 > マイアプリ からコピーして書き換えてください
  var firebaseConfig = {
    apiKey:            "AIzaSyC1lUuoJbdmS7mOR5HJXtwHDvc2H2d_CQI",
    authDomain:        "subscope-official.firebaseapp.com",
    databaseURL:       "https://subscope-official-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "subscope-official",
    storageBucket:     "subscope-official.firebasestorage.app",
    messagingSenderId: "23013449946",
    appId:             "1:23013449946:web:61638133bee9a203cac5e3"
  };

  // Firebase がロードされているか確認
  if (typeof firebase === 'undefined') {
    console.warn('[FirebaseLikes] Firebase SDK が読み込まれていません。firebase-likes.js より前に Firebase CDN を追加してください。');
    window.FirebaseLikes = null;
    return;
  }

  // 設定が未記入の場合はスキップ（localStorage フォールバックに任せる）
  if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
    console.info('[FirebaseLikes] Firebase の設定が未記入です。firebase-likes.js を設定してください。');
    window.FirebaseLikes = null;
    return;
  }

  // 重複初期化を防ぐ
  var app;
  try {
    app = firebase.app();
  } catch (e) {
    app = firebase.initializeApp(firebaseConfig);
  }

  var db = firebase.database(app);

  // ── 共通ユーティリティ ────────────────────────────────────────────
  function makeCountRef(path) { return db.ref(path + '/count'); }

  function onCount(path, callback) {
    var ref = makeCountRef(path);
    var handler = function (snap) { callback(snap.exists() ? (snap.val() || 0) : 0); };
    ref.on('value', handler);
    return function () { ref.off('value', handler); };
  }

  function atomicIncrement(path) {
    var ref = makeCountRef(path);
    return ref.transaction(function (c) { return (c || 0) + 1; }).then(function (r) { return r.snapshot.val() || 0; });
  }

  function atomicDecrement(path) {
    var ref = makeCountRef(path);
    return ref.transaction(function (c) { return Math.max(0, (c || 0) - 1); }).then(function (r) { return r.snapshot.val() || 0; });
  }

  function genId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  window.FirebaseLikes = {
    onCount:   function (articleId, cb) { return onCount('likes/' + articleId, cb); },
    increment: function (articleId) { return atomicIncrement('likes/' + articleId); },
    decrement: function (articleId) { return atomicDecrement('likes/' + articleId); }
  };

  // ── 保存数 ────────────────────────────────────────────────────────
  window.FirebaseSaves = {
    onCount:   function (articleId, cb) { return onCount('saves/' + articleId, cb); },
    increment: function (articleId) { return atomicIncrement('saves/' + articleId); },
    decrement: function (articleId) { return atomicDecrement('saves/' + articleId); }
  };

  // ── コメント ──────────────────────────────────────────────────────
  window.FirebaseComments = {
    /**
     * コメント一覧をリアルタイムで購読する
     * @param {string} articleId
     * @param {function(Array): void} callback
     * @returns {function} 購読解除関数
     */
    onComments: function (articleId, callback) {
      var ref = db.ref('comments/' + articleId);
      var handler = function (snap) {
        var list = [];
        snap.forEach(function (child) { list.push(child.val()); });
        callback(list);
      };
      ref.on('value', handler);
      return function () { ref.off('value', handler); };
    },

    /** コメントを追加する */
    addComment: function (articleId, comment) {
      var id   = genId();
      var data = { id: id, userId: comment.userId, userName: comment.userName,
                   text: comment.text, createdAt: comment.createdAt, likes: 0 };
      return db.ref('comments/' + articleId + '/' + id).set(data).then(function () { return data; });
    },

    /** コメントを削除する */
    deleteComment: function (articleId, commentId) {
      return db.ref('comments/' + articleId + '/' + commentId).remove();
    },

    /** コメントのいいねを +1（アトミック） */
    likeComment: function (articleId, commentId) {
      return db.ref('comments/' + articleId + '/' + commentId + '/likes')
        .transaction(function (c) { return (c || 0) + 1; })
        .then(function (r) { return r.snapshot.val() || 0; });
    },

    /** コメントのいいねを -1（アトミック・0未満にならない） */
    unlikeComment: function (articleId, commentId) {
      return db.ref('comments/' + articleId + '/' + commentId + '/likes')
        .transaction(function (c) { return Math.max(0, (c || 0) - 1); })
        .then(function (r) { return r.snapshot.val() || 0; });
    }
  };

})();
