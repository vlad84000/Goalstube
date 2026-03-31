// ─── GOALSTUBE THUMB LOADER ───────────────────────────────────────────────────
// https://vlad84000.github.io/Goalstube/main.js

const GITHUB_RAW = 'https://raw.githubusercontent.com/vlad84000/Goalstube/main/thumbs';
const BLOG_URL   = 'https://www.goalstube.online';

const LABEL_MAP = {
  'epl':        'epl',
  'ucl':        'ucl',
  'laliga':     'laliga',
  'seriea':     'seriea',
  'bundesliga': 'bundesliga',
  'ligue1':     'ligue1',
  'uel':        'uel',
};

function titleToFilename(title) {
  return title.trim() + '.jpg';
}

function getCompFolder(labels) {
  for (const lbl of labels) {
    const key = lbl.toLowerCase().replace(/\s+/g, '');
    if (LABEL_MAP[key]) return LABEL_MAP[key];
  }
  return null;
}

function applyThumb(postUrl, imgUrl, title) {
  const normalizedUrl = postUrl.replace(/^http:/, 'https:');

  // Exact card selector from DOM: article.ntry
  document.querySelectorAll('article.ntry').forEach(card => {

    // Match this card to the post by its link
    const isMatch = [...card.querySelectorAll('a[href]')].some(a =>
      a.href === postUrl ||
      a.href === normalizedUrl ||
      a.href.replace(/^http:/, 'https:') === normalizedUrl
    );
    if (!isMatch) return;

    // Find the thumbnail container div.thmb
    const thmb = card.querySelector('div.thmb');
    if (!thmb) return;

    // Find the span placeholder or existing img
    const span = thmb.querySelector('span.imgThm');
    const existingImg = thmb.querySelector('img.imgThm');

    if (span) {
      // Replace span with real img
      const img = document.createElement('img');
      img.src = imgUrl;
      img.setAttribute('data-src', imgUrl);
      img.alt = title;
      img.className = 'imgThm show-if-js lblr lazyloaded';
      img.style.cssText = 'width:100%;display:block;aspect-ratio:16/9;object-fit:cover;';
      img.onerror = () => {
        if (img.src.endsWith('.jpg')) img.src = imgUrl.replace('.jpg', '.webp');
        else if (img.src.endsWith('.webp')) img.src = imgUrl.replace('.webp', '.png');
      };
      span.replaceWith(img);
    } else if (existingImg) {
      // Update existing img
      existingImg.src = imgUrl;
      existingImg.setAttribute('data-src', imgUrl);
      existingImg.alt = title;
    }

    // Remove "no thumbnail" classes so theme renders it correctly
    card.classList.remove('noThmb');
    const pThmb = card.querySelector('div.pThmb');
    if (pThmb) pThmb.classList.remove('nul');
  });
}

async function loadGameThumbs() {
  try {
    const res  = await fetch(`${BLOG_URL}/feeds/posts/default?alt=json&max-results=50`);
    const data = await res.json();
    const posts = data.feed.entry || [];

    posts.forEach(post => {
      const title   = post.title.$t.trim();
      const labels  = (post.category || []).map(c => c.term);
      const linkObj = (post.link || []).find(l => l.rel === 'alternate');
      if (!linkObj) return;

      const folder = getCompFolder(labels);
      if (!folder) return;

      const postUrl  = linkObj.href;
      const filename = titleToFilename(title);
      const imgUrl   = `${GITHUB_RAW}/${folder}/${encodeURIComponent(filename)}`;

      applyThumb(postUrl, imgUrl, title);
    });

  } catch (err) {
    console.warn('[GoalsTube Thumbs] Error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadGameThumbs);
} else {
  loadGameThumbs();
}
