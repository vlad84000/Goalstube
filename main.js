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
  return title
    .toLowerCase()
    .trim()
    .replace(/\s*-\s*/g, '-vs-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    + '.jpg';
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

  // Target your theme's exact thumbnail class: imgThm
  const thumbImgs = document.querySelectorAll('img.imgThm');

  thumbImgs.forEach(img => {
    // Walk up to the post card container
    const card = img.closest('article, .post-outer, .post, [class*="post-item"], [class*="item-post"], section, li');
    if (!card) return;

    // Check if this card contains a link to our post
    const links = card.querySelectorAll('a[href]');
    const isMatch = [...links].some(a =>
      a.href === postUrl || a.href === normalizedUrl
    );
    if (!isMatch) return;

    // Set both src and data-src (your theme uses lazy loading)
    img.src = imgUrl;
    img.setAttribute('data-src', imgUrl);
    img.alt = title;

    // Fallback: try .webp then .png if .jpg not found
    img.onerror = () => {
      if (img.src.endsWith('.jpg')) {
        img.src = imgUrl.replace('.jpg', '.webp');
        img.setAttribute('data-src', img.src);
      } else if (img.src.endsWith('.webp')) {
        img.src = imgUrl.replace('.webp', '.png');
        img.setAttribute('data-src', img.src);
      }
    };
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
      if (!folder) return; // skip posts without a competition label

      const postUrl  = linkObj.href;
      const filename = titleToFilename(title);
      const imgUrl   = `${GITHUB_RAW}/${folder}/${filename}`;

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
