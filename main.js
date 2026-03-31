// ─── GOALSTUBE THUMB LOADER ───────────────────────────────────────────────────
// https://vlad84000.github.io/Goalstube/main.js

const GITHUB_RAW = 'https://raw.githubusercontent.com/vlad84000/Goalstube/main/thumbs';
const BLOG_URL   = 'https://www.goalstube.online';

// Label (lowercase, no spaces) → folder in thumbs/
const LABEL_MAP = {
  'epl':        'epl',
  'ucl':        'ucl',
  'laliga':     'laliga',
  'seriea':     'seriea',
  'bundesliga': 'bundesliga',
  'ligue1':     'ligue1',
  'uel':        'uel',
};

// Post title is used DIRECTLY as filename — no conversion
// "Arsenal - Manchester City" → "Arsenal - Manchester City.jpg"
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

  // Target your theme's exact thumbnail class: imgThm
  const thumbImgs = document.querySelectorAll('img.imgThm');

  thumbImgs.forEach(img => {
    const card = img.closest('article, .post-outer, .post, [class*="post-item"], [class*="item-post"], section, li');
    if (!card) return;

    const links = card.querySelectorAll('a[href]');
    const isMatch = [...links].some(a =>
      a.href === postUrl || a.href === normalizedUrl
    );
    if (!isMatch) return;

    // Update both src and data-src (theme uses lazy loading)
    img.src = imgUrl;
    img.setAttribute('data-src', imgUrl);
    img.alt = title;

    // Fallback: .jpg → .webp → .png
    img.onerror = () => {
      if (img.src.endsWith('.jpg')) {
        const webp = imgUrl.replace('.jpg', '.webp');
        img.src = webp;
        img.setAttribute('data-src', webp);
      } else if (img.src.endsWith('.webp')) {
        const png = imgUrl.replace('.webp', '.png');
        img.src = png;
        img.setAttribute('data-src', png);
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

      // URL-encode the filename to handle spaces and special chars
      const imgUrl = `${GITHUB_RAW}/${folder}/${encodeURIComponent(filename)}`;

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
