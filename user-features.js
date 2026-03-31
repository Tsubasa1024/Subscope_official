/**
 * SUBSCOPE User Features Module
 * いいね・保存・コメント機能（localStorage ベース）
 * auth.js のあとに読み込むこと
 */
(function () {
  'use strict';

  function getUser() {
    return (window.Auth && window.Auth.getCurrentUser()) || null;
  }

  // ── いいね ────────────────────────────────────────────────────────
  function likesKey() { const u = getUser(); return u ? `ss_likes_${u.id}` : null; }

  function getLikesMap() {
    const k = likesKey();
    if (!k) return {};
    try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; }
  }
  function saveLikesMap(d) { const k = likesKey(); if (k) localStorage.setItem(k, JSON.stringify(d)); }

  function getCountsMap() {
    try { return JSON.parse(localStorage.getItem('ss_like_counts') || '{}'); } catch { return {}; }
  }
  function saveCountsMap(d) { localStorage.setItem('ss_like_counts', JSON.stringify(d)); }

  // ── 保存 ──────────────────────────────────────────────────────────
  function savesKey() { const u = getUser(); return u ? `ss_saves_${u.id}` : null; }

  function getSavesMap() {
    const k = savesKey();
    if (!k) return {};
    try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; }
  }
  function saveSavesMap(d) { const k = savesKey(); if (k) localStorage.setItem(k, JSON.stringify(d)); }

  // ── コメント ─────────────────────────────────────────────────────
  function getAllComments() {
    try { return JSON.parse(localStorage.getItem('ss_comments') || '{}'); } catch { return {}; }
  }
  function saveAllComments(d) { localStorage.setItem('ss_comments', JSON.stringify(d)); }

  function genId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  // ── 公開 API ─────────────────────────────────────────────────────
  window.UserFeatures = {
    // --- いいね ---
    isLiked(articleId) {
      return !!getLikesMap()[articleId];
    },

    getLikeCount(articleId) {
      return getCountsMap()[articleId] || 0;
    },

    toggleLike(articleId) {
      if (!getUser()) throw new Error('ログインが必要です');
      const likes = getLikesMap();
      const counts = getCountsMap();
      const wasLiked = !!likes[articleId];

      if (wasLiked) {
        delete likes[articleId];
        counts[articleId] = Math.max(0, (counts[articleId] || 1) - 1);
      } else {
        likes[articleId] = true;
        counts[articleId] = (counts[articleId] || 0) + 1;
      }

      saveLikesMap(likes);
      saveCountsMap(counts);
      return { liked: !wasLiked, count: counts[articleId] };
    },

    // --- 保存 ---
    isSaved(articleId) {
      return !!getSavesMap()[articleId];
    },

    toggleSave(articleId, articleSnapshot) {
      if (!getUser()) throw new Error('ログインが必要です');
      const saves = getSavesMap();
      const wasSaved = !!saves[articleId];

      if (wasSaved) {
        delete saves[articleId];
      } else {
        // 記事の基本情報をスナップショットとして保存
        saves[articleId] = articleSnapshot || { id: articleId, savedAt: new Date().toISOString() };
      }

      saveSavesMap(saves);
      return { saved: !wasSaved };
    },

    getSavedArticles() {
      const saves = getSavesMap();
      return Object.values(saves);
    },

    // --- コメント ---
    getComments(articleId) {
      return getAllComments()[articleId] || [];
    },

    addComment(articleId, text) {
      const user = getUser();
      if (!user) throw new Error('ログインが必要です');
      const t = (text || '').trim();
      if (!t) throw new Error('コメントを入力してください');
      if (t.length > 1000) throw new Error('コメントは1000文字以内で入力してください');

      const comment = {
        id: genId(),
        userId: user.id,
        userName: user.name,
        text: t,
        createdAt: new Date().toISOString()
      };

      const all = getAllComments();
      if (!all[articleId]) all[articleId] = [];
      all[articleId].unshift(comment);
      saveAllComments(all);
      return comment;
    },

    deleteComment(articleId, commentId) {
      const user = getUser();
      if (!user) throw new Error('ログインが必要です');
      const all = getAllComments();
      const list = all[articleId] || [];
      const target = list.find(c => c.id === commentId);
      if (!target) throw new Error('コメントが見つかりません');
      if (target.userId !== user.id) throw new Error('このコメントは削除できません');
      all[articleId] = list.filter(c => c.id !== commentId);
      saveAllComments(all);
    }
  };

})();
