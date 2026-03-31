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

function makeImg(imgUrl, title) {
  const img = document.createElement('img');
  img.src = imgUrl;
  img.setAttribute('data-src', imgUrl);
  img.alt = title;
  img.style.cssText = 'width:100%;display:block;aspect-ratio:16/9;object-fit:cover;';
  img.onerror = () => {
    if (img.src.endsWith('.jpg')) img.src = imgUrl.replace('.jpg', '.webp');
    else if (img.src.endsWith('.webp')) img.src = imgUrl.replace('.webp', '.png');
  };
  return img;
}

function applyThumb(postUrl, imgUrl, title) {
  const normalizedUrl = postUrl.replace(/^http:/, 'https:');

  // Find all .imgThm elements — could be <span> (placeholder) or <img>
  document.querySelectorAll('.imgThm').forEach(el => {
    // Walk up to the post card
    const card = el.closest('article, .post-outer, .post, [class*="post-item"], li');
    if (!card) return;

    // Check this card links to our post
    const isMatch = [...card.querySelectorAll('a[href]')].some(a =>
      a.href === postUrl ||
      a.href === normalizedUrl ||
      a.href.replace(/^http:/, 'https:') === normalizedUrl
    );
    if (!isMatch) return;

    if (el.tagName === 'SPAN') {
      // Replace the placeholder span with a real img
      const img = makeImg(imgUrl, title);
      img.className = 'imgThm';
      el.replaceWith(img);
    } else if (el.tagName === 'IMG') {
      // Just update the existing img
      el.src = imgUrl;
      el.setAttribute('data-src', imgUrl);
      el.alt = title;
    }
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
