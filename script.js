// ---------- Photo data ----------
// Swap the `src` values for your own photos any time — everything else
// (filtering, lightbox, keyboard nav) works off this array automatically.
const PHOTOS = [
  { src: 'https://picsum.photos/seed/wl-mountain1/700/900', title: 'Ridge at first light', category: 'mountains' },
  { src: 'https://picsum.photos/seed/wl-mountain2/700/500', title: 'Above the treeline', category: 'mountains' },
  { src: 'https://picsum.photos/seed/wl-mountain3/700/860', title: 'Switchback trail', category: 'mountains' },
  { src: 'https://picsum.photos/seed/wl-ocean1/700/500', title: 'Low tide, blue hour', category: 'ocean' },
  { src: 'https://picsum.photos/seed/wl-ocean2/700/900', title: 'Cliffside break', category: 'ocean' },
  { src: 'https://picsum.photos/seed/wl-ocean3/700/560', title: 'Salt air, calm water', category: 'ocean' },
  { src: 'https://picsum.photos/seed/wl-forest1/700/900', title: 'Fog between the pines', category: 'forest' },
  { src: 'https://picsum.photos/seed/wl-forest2/700/500', title: 'Undergrowth, morning', category: 'forest' },
  { src: 'https://picsum.photos/seed/wl-forest3/700/840', title: 'Old growth canopy', category: 'forest' },
  { src: 'https://picsum.photos/seed/wl-desert1/700/500', title: 'Dunes at dusk', category: 'desert' },
  { src: 'https://picsum.photos/seed/wl-desert2/700/900', title: 'Heat shimmer', category: 'desert' },
  { src: 'https://picsum.photos/seed/wl-desert3/700/560', title: 'Last light on rock', category: 'desert' },
];

const gallery = document.getElementById('gallery');
const dialButtons = document.querySelectorAll('.dial-btn');

// ---------- Render gallery ----------
function renderGallery() {
  gallery.innerHTML = '';
  PHOTOS.forEach((photo, index) => {
    const frame = document.createElement('figure');
    frame.className = 'frame';
    frame.dataset.category = photo.category;
    frame.dataset.index = index;
    frame.style.setProperty('--delay', `${(index % 6) * 0.06}s`);
    frame.tabIndex = 0;
    frame.setAttribute('role', 'button');
    frame.setAttribute('aria-label', `Open photo: ${photo.title}`);

    frame.innerHTML = `
      <img src="${photo.src}" alt="${photo.title}" loading="lazy">
      <figcaption class="frame-caption">
        <span>${photo.title}</span>
        <span class="tag">${photo.category}</span>
      </figcaption>
    `;

    frame.addEventListener('click', () => openLightbox(index));
    frame.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });

    gallery.appendChild(frame);
  });
}

// ---------- Filtering ----------
dialButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    dialButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    document.querySelectorAll('.frame').forEach(frame => {
      const match = filter === 'all' || frame.dataset.category === filter;
      frame.classList.toggle('hidden', !match);
    });
  });
});

// ---------- Lightbox ----------
const lightbox = document.getElementById('lightbox');
const lbImage = document.getElementById('lbImage');
const lbTitle = document.getElementById('lbTitle');
const lbIndex = document.getElementById('lbIndex');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');

let currentIndex = 0;

function visiblePhotoIndices() {
  const activeFilter = document.querySelector('.dial-btn.active').dataset.filter;
  return PHOTOS
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => activeFilter === 'all' || p.category === activeFilter)
    .map(({ i }) => i);
}

function openLightbox(index) {
  currentIndex = index;
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
  const photo = PHOTOS[currentIndex];
  lbImage.classList.remove('show');

  const img = new Image();
  img.onload = () => {
    lbImage.src = photo.src;
    requestAnimationFrame(() => lbImage.classList.add('show'));
  };
  img.src = photo.src;

  lbTitle.textContent = photo.title;
  const order = visiblePhotoIndices();
  const pos = order.indexOf(currentIndex) + 1;
  lbIndex.textContent = `${pos} / ${order.length}`;
}

function step(direction) {
  const order = visiblePhotoIndices();
  const posInOrder = order.indexOf(currentIndex);
  const nextPos = (posInOrder + direction + order.length) % order.length;
  currentIndex = order[nextPos];
  updateLightboxImage();
}

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', () => step(-1));
lbNext.addEventListener('click', () => step(1));

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

renderGallery();
