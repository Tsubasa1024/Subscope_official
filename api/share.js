
export default async function handler(req, res) {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).send("Missing id");

    const SERVICE_ID = process.env.MICROCMS_SERVICE_ID;
    const API_KEY = process.env.MICROCMS_API_KEY;

    const apiUrl = `https://${SERVICE_ID}.microcms.io/api/v1/articles/${encodeURIComponent(id)}`;

    const r = await fetch(apiUrl, {
      headers: { "X-MICROCMS-API-KEY": API_KEY },
    });

    if (!r.ok) return res.status(404).send("Not found");
    const data = await r.json();

    const title = (data.title || "SUBSCOPE") + " | SUBSCOPE";
    const desc =
      (data.description || "").trim() || "SUBSCOPEの記事ページ";
    const img =
      data.image?.url || "https://www.subscope.jp/ogp-default-v3.png";

    // 実際に読む記事ページURL（あなたの既存）
    const dest = `https://www.subscope.jp/article.html?id=${encodeURIComponent(id)}`;

    // LINE / SNS クローラーが最初に読むHTML（ここが超重要）
    const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>

  <link rel="canonical" href="${dest}">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="SUBSCOPE">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:url" content="${dest}">
  <meta property="og:image" content="${img}">
  <meta property="og:image:secure_url" content="${img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${img}">

  <meta http-equiv="refresh" content="0;url=${dest}">
</head>
<body></body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(html);
  } catch (e) {
    return res.status(500).send("Server error");
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
