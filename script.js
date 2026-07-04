// ---------- Photo data ----------
const PHOTOS = [
  { id: 'm1', src: 'https://picsum.photos/seed/wl-mountain1/700/900', title: 'Ridge at first light', category: 'mountains' },
  { id: 'm2', src: 'https://picsum.photos/seed/wl-mountain2/700/500', title: 'Above the treeline', category: 'mountains' },
  { id: 'm3', src: 'https://picsum.photos/seed/wl-mountain3/700/860', title: 'Switchback trail', category: 'mountains' },
  { id: 'o1', src: 'https://picsum.photos/seed/wl-ocean1/700/500', title: 'Low tide, blue hour', category: 'ocean' },
  { id: 'o2', src: 'https://picsum.photos/seed/wl-ocean2/700/900', title: 'Cliffside break', category: 'ocean' },
  { id: 'o3', src: 'https://picsum.photos/seed/wl-ocean3/700/560', title: 'Salt air, calm water', category: 'ocean' },
  { id: 'f1', src: 'https://picsum.photos/seed/wl-forest1/700/900', title: 'Fog between the pines', category: 'forest' },
  { id: 'f2', src: 'https://picsum.photos/seed/wl-forest2/700/500', title: 'Undergrowth, morning', category: 'forest' },
  { id: 'f3', src: 'https://picsum.photos/seed/wl-forest3/700/840', title: 'Old growth canopy', category: 'forest' },
  { id: 'd1', src: 'https://picsum.photos/seed/wl-desert1/700/500', title: 'Dunes at dusk', category: 'desert' },
  { id: 'd2', src: 'https://picsum.photos/seed/wl-desert2/700/900', title: 'Heat shimmer', category: 'desert' },
  { id: 'd3', src: 'https://picsum.photos/seed/wl-desert3/700/560', title: 'Last light on rock', category: 'desert' },
];

// ---------- Persisted state ----------
const FAV_KEY = 'wanderlens:favorites';
const UPLOADS_KEY = 'wanderlens:uploads';

let favorites = new Set(safeParse(localStorage.getItem(FAV_KEY), []));
let uploadedPhotos = safeParse(localStorage.getItem(UPLOADS_KEY), []);

function safeParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}

function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
}

function saveUploads() {
  try {
    localStorage.setItem(UPLOADS_KEY, JSON.stringify(uploadedPhotos));
  } catch (err) {
    showToast("Storage is full — try smaller or fewer images.");
  }
}

function getAllPhotos() {
  return [...PHOTOS, ...uploadedPhotos];
}

// ---------- App state ----------
let currentView = 'gallery';
let activeFilter = 'all';
let gallerySearchTerm = '';

// ---------- Elements ----------
const gallery = document.getElementById('gallery');
const dialButtons = document.querySelectorAll('.dial-btn');
const navTabs = document.querySelectorAll('.nav-tab');
const navSearchInput = document.getElementById('navSearchInput');
const navSearchBtn = document.getElementById('navSearchBtn');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const toast = document.getElementById('toast');

// ---------- Toast ----------
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ---------- View switching ----------
navTabs.forEach(tab => {
  tab.addEventListener('click', () => switchView(tab.dataset.view));
});

function switchView(view) {
  currentView = view;
  navTabs.forEach(t => t.classList.toggle('active', t.dataset.view === view));
  document.getElementById('view-gallery').classList.toggle('active', view === 'gallery');
  document.getElementById('view-discover').classList.toggle('active', view === 'discover');

  navSearchInput.value = '';
  if (view === 'gallery') {
    navSearchInput.placeholder = 'Search your gallery…';
    navSearchBtn.hidden = true;
    gallerySearchTerm = '';
    renderGallery();
  } else {
    navSearchInput.placeholder = 'Search Pexels (e.g. "waterfall")…';
    navSearchBtn.hidden = false;
    checkPexelsKey();
  }
}

// ---------- Gallery filtering ----------
function photoMatchesFilter(photo) {
  if (activeFilter === 'favorites') return favorites.has(photo.id);
  if (activeFilter === 'uploads') return photo.category === 'uploads';
  if (activeFilter === 'all') return true;
  return photo.category === activeFilter;
}

function photoMatchesSearch(photo) {
  if (!gallerySearchTerm) return true;
  return photo.title.toLowerCase().includes(gallerySearchTerm.toLowerCase());
}

function visiblePhotos() {
  return getAllPhotos().filter(p => photoMatchesFilter(p) && photoMatchesSearch(p));
}

function emptyStateMessage() {
  if (activeFilter === 'uploads' && uploadedPhotos.length === 0) {
    return 'No uploads yet — drag some photos into the box above, or add some from Discover.';
  }
  if (activeFilter === 'favorites') {
    return 'Nothing favorited yet — hover a photo and click the heart.';
  }
  if (gallerySearchTerm) {
    return `No photos match "${gallerySearchTerm}".`;
  }
  return 'No photos here yet.';
}

// ---------- Render gallery ----------
function renderGallery() {
  gallery.innerHTML = '';
  const photos = visiblePhotos();

  if (photos.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = emptyStateMessage();
    gallery.appendChild(empty);
    return;
  }

  photos.forEach((photo, index) => {
    const isFav = favorites.has(photo.id);
    const frame = document.createElement('figure');
    frame.className = 'frame';
    frame.dataset.id = photo.id;
    frame.style.setProperty('--delay', `${(index % 6) * 0.06}s`);
    frame.tabIndex = 0;
    frame.setAttribute('role', 'button');
    frame.setAttribute('aria-label', `Open photo: ${photo.title}`);

    const creditHtml = photo.credit
      ? `<span class="frame-credit">Photo by <a href="${photo.credit.url}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${photo.credit.name}</a> on Pexels</span>`
      : '';

    frame.innerHTML = `
      <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${photo.id}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
        ${isFav ? '&#9829;' : '&#9825;'}
      </button>
      <img src="${photo.src}" alt="${photo.title}" loading="lazy">
      <figcaption class="frame-caption">
        <span>${photo.title}</span>
        <span class="tag">${photo.category}</span>
      </figcaption>
      ${creditHtml}
    `;

    frame.addEventListener('click', () => openLightbox(photo.id));
    frame.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(photo.id);
      }
    });

    frame.querySelector('.fav-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(photo.id);
    });

    gallery.appendChild(frame);
  });
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  saveFavorites();
  renderGallery();
  if (lightbox.classList.contains('open')) updateLightboxImage();
}

// ---------- Dial filter ----------
dialButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    dialButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderGallery();
  });
});

// ---------- Nav search (contextual to view) ----------
navSearchInput.addEventListener('input', () => {
  if (currentView === 'gallery') {
    gallerySearchTerm = navSearchInput.value.trim();
    renderGallery();
  }
});

navSearchInput.addEventListener('keydown', (e) => {
  if (currentView === 'discover' && e.key === 'Enter') {
    e.preventDefault();
    runDiscoverSearch();
  }
});

navSearchBtn.addEventListener('click', runDiscoverSearch);

// ---------- Upload: drag & drop + browse ----------
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

['dragenter', 'dragover'].forEach(evt => {
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
});
['dragleave', 'drop'].forEach(evt => {
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('drag-over'); });
});
dropzone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));

function handleFiles(fileList) {
  const files = [...fileList].filter(f => f.type.startsWith('image/'));
  if (files.length === 0) { showToast('Please drop image files only.'); return; }

  Promise.all(files.map(readFileAsPhoto)).then(newPhotos => {
    uploadedPhotos = uploadedPhotos.concat(newPhotos);
    saveUploads();
    showToast(`Added ${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} to Your Photos.`);
    dialButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === 'uploads'));
    activeFilter = 'uploads';
    renderGallery();
  });
}

function readFileAsPhoto(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        src: reader.result,
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: 'uploads',
      });
    };
    reader.readAsDataURL(file);
  });
}

// ---------- Discover (Pexels API) ----------
const discoverResults = document.getElementById('discoverResults');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const discoverKeyNotice = document.getElementById('discoverKeyNotice');

let currentQuery = '';
let currentPage = 1;
let hasNextPage = false;

function hasValidKey() {
  return typeof PEXELS_API_KEY === 'string' &&
    PEXELS_API_KEY.trim() !== '' &&
    PEXELS_API_KEY !== 'YOUR_PEXELS_API_KEY_HERE';
}

function checkPexelsKey() {
  discoverKeyNotice.hidden = hasValidKey();
}

function runDiscoverSearch() {
  const query = navSearchInput.value.trim();
  if (!hasValidKey()) { checkPexelsKey(); return; }
  if (!query) { showToast('Type something to search for.'); return; }

  currentQuery = query;
  currentPage = 1;
  discoverResults.innerHTML = '<p class="empty-state">Searching…</p>';
  loadMoreBtn.hidden = true;
  fetchPexels(query, 1, false);
}

function fetchPexels(query, page, append) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}`;

  fetch(url, { headers: { Authorization: PEXELS_API_KEY } })
    .then(res => {
      if (!res.ok) throw new Error(`Pexels responded with ${res.status}`);
      return res.json();
    })
    .then(data => {
      hasNextPage = Boolean(data.next_page);
      loadMoreBtn.hidden = !hasNextPage;
      renderDiscoverResults(data.photos || [], append);
    })
    .catch(err => {
      showToast('Search failed — check your API key and connection.');
      if (!append) discoverResults.innerHTML = '<p class="empty-state">Something went wrong. Try again.</p>';
      console.error(err);
    });
}

loadMoreBtn.addEventListener('click', () => {
  currentPage += 1;
  fetchPexels(currentQuery, currentPage, true);
});

function renderDiscoverResults(photos, append) {
  if (!append) discoverResults.innerHTML = '';

  if (photos.length === 0 && !append) {
    discoverResults.innerHTML = '<p class="empty-state">No results. Try a different search.</p>';
    return;
  }

  photos.forEach(photo => {
    const alreadyAdded = uploadedPhotos.some(p => p.id === `pexels-${photo.id}`);
    const card = document.createElement('div');
    card.className = 'discover-card';
    card.innerHTML = `
      <button class="add-btn ${alreadyAdded ? 'added' : ''}" aria-label="Add to gallery">${alreadyAdded ? '&#10003;' : '+'}</button>
      <img src="${photo.src.medium}" alt="${photo.alt || 'Stock photo'}" loading="lazy">
      <div class="discover-card-body">
        <span class="discover-card-title">${photo.alt || 'Untitled'}</span>
        <span class="discover-card-credit">Photo by <a href="${photo.url}" target="_blank" rel="noopener">${photo.photographer}</a></span>
      </div>
    `;

    card.querySelector('.add-btn').addEventListener('click', (e) => {
      addDiscoverPhotoToGallery(photo, e.currentTarget);
    });

    discoverResults.appendChild(card);
  });
}

function addDiscoverPhotoToGallery(photo, btn) {
  const id = `pexels-${photo.id}`;
  if (uploadedPhotos.some(p => p.id === id)) {
    showToast('Already in your gallery.');
    return;
  }

  uploadedPhotos.push({
    id,
    src: photo.src.large,
    title: photo.alt || `Photo by ${photo.photographer}`,
    category: 'uploads',
    credit: { name: photo.photographer, url: photo.url },
  });
  saveUploads();
  btn.classList.add('added');
  btn.innerHTML = '&#10003;';
  showToast('Added to Your Photos.');
}

// ---------- Lightbox ----------
const lightbox = document.getElementById('lightbox');
const lbImage = document.getElementById('lbImage');
const lbTitle = document.getElementById('lbTitle');
const lbIndex = document.getElementById('lbIndex');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');

let currentId = null;

function openLightbox(id) {
  currentId = id;
  updateLightboxImage();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function updateLightboxImage() {
  const order = visiblePhotos();
  const photo = order.find(p => p.id === currentId) || order[0];
  if (!photo) { closeLightbox(); return; }
  currentId = photo.id;

  lbImage.classList.remove('show');
  const img = new Image();
  img.onload = () => {
    lbImage.src = photo.src;
    requestAnimationFrame(() => lbImage.classList.add('show'));
  };
  img.src = photo.src;

  lbTitle.textContent = photo.title;
  const pos = order.findIndex(p => p.id === photo.id) + 1;
  lbIndex.textContent = `${pos} / ${order.length}`;
}

function step(direction) {
  const order = visiblePhotos();
  if (order.length === 0) return;
  const pos = order.findIndex(p => p.id === currentId);
  const nextPos = (pos + direction + order.length) % order.length;
  currentId = order[nextPos].id;
  updateLightboxImage();
}

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', () => step(-1));
lbNext.addEventListener('click', () => step(1));

lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

// ---------- Init ----------
renderGallery();
