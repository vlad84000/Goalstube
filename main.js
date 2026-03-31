// ─── GOALSTUBE THUMB LOADER ───────────────────────────────────────────────────
// https://vlad84000.github.io/Goalstube/main.js

const GITHUB_RAW = 'https://raw.githubusercontent.com/vlad84000/Goalstube/main/thumbs';
const BLOG_URL   = 'https://www.goalstube.online';

// Label → folder (case-insensitive matching handled below)
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
    // normalize: lowercase + remove spaces
    const key = lbl.toLowerCase().replace(/\s+/g, '');
    if (LABEL_MAP[key]) return LABEL_MAP[key];
  }
  return null;
}

function applyThumb(postUrl, imgUrl, title) {
  const normalizedUrl = postUrl.replace(/^http:/, 'https:');

  // Find all post card containers
  const cards = document.querySelectorAll('article, .post-outer, .post, [class*="post-item"], [class*="item-post"]');

  cards.forEach(card => {
    // Check if this card belongs to our post
    const links = card.querySelectorAll('a[href]');
    const isMatch = [...links].some(a =>
      a.href === postUrl ||
      a.href === normalizedUrl ||
      a.href.replace(/^http:/, 'https:') === normalizedUrl
    );
    if (!isMatch) return;

    // Try to find existing imgThm thumbnail
    let img = card.querySelector('img.imgThm');

    if (img) {
      // Replace existing thumbnail
      img.src = imgUrl;
      img.setAttribute('data-src', imgUrl);
      img.alt = title;
    } else {
      // No thumbnail exists — create and inject one
      img = document.createElement('img');
      img.alt   = title;
      img.src   = imgUrl;
      img.setAttribute('data-src', imgUrl);
      img.className = 'imgThm';
      img.style.cssText = 'width:100%;display:block;aspect-ratio:16/9;object-fit:cover;';

      // Insert at the top of the card
      card.insertBefore(img, card.firstChild);
    }

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

  // Also handle single post page (isPost = true, no card wrapper)
  // Look for the post title h1/h2/h3 and inject above it
  const postTitles = document.querySelectorAll('h1.post-title, h2.post-title, .entry-title, [class*="post-title"]');
  postTitles.forEach(titleEl => {
    const pageTitle = titleEl.textContent.trim();
    if (pageTitle !== title) return;
    if (titleEl.previousElementSibling && titleEl.previousElementSibling.classList.contains('gt-match-thumb')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'gt-match-thumb';
    wrapper.style.cssText = 'width:100%;margin-bottom:16px;';

    const img = document.createElement('img');
    img.src   = imgUrl;
    img.setAttribute('data-src', imgUrl);
    img.alt   = title;
    img.style.cssText = 'width:100%;display:block;aspect-ratio:16/9;object-fit:cover;border-radius:8px;';

    img.onerror = () => {
      if (img.src.endsWith('.jpg')) img.src = imgUrl.replace('.jpg', '.webp');
      else if (img.src.endsWith('.webp')) img.src = imgUrl.replace('.webp', '.png');
    };

    wrapper.appendChild(img);
    titleEl.parentNode.insertBefore(wrapper, titleEl);
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
