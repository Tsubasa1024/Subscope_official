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
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL:       "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID"
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

  window.FirebaseLikes = {
    /**
     * いいね数をリアルタイムで購読する
     * @param {string} articleId
     * @param {function(number): void} callback - 最新カウントを受け取るコールバック
     * @returns {function} 購読解除関数
     */
    onCount: function (articleId, callback) {
      var ref = db.ref('likes/' + articleId + '/count');
      var handler = function (snap) {
        callback(snap.exists() ? (snap.val() || 0) : 0);
      };
      ref.on('value', handler);
      return function () { ref.off('value', handler); };
    },

    /**
     * いいね数を1増やす（アトミックトランザクション）
     * @param {string} articleId
     * @returns {Promise<number>} 更新後のカウント
     */
    increment: function (articleId) {
      var ref = db.ref('likes/' + articleId + '/count');
      return ref.transaction(function (current) {
        return (current || 0) + 1;
      }).then(function (result) {
        return result.snapshot.val() || 0;
      });
    },

    /**
     * いいね数を1減らす（アトミックトランザクション・0未満にはならない）
     * @param {string} articleId
     * @returns {Promise<number>} 更新後のカウント
     */
    decrement: function (articleId) {
      var ref = db.ref('likes/' + articleId + '/count');
      return ref.transaction(function (current) {
        return Math.max(0, (current || 0) - 1);
      }).then(function (result) {
        return result.snapshot.val() || 0;
      });
    }
  };

})();
