const url = '继程70.pdf';
const audioPlayer = document.getElementById('audio-player');
const container = document.getElementById('flipbook');

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs/pdf.worker.js';

let pages = [];
let currentIndex = 0;

async function renderPDF() {
  const pdf = await pdfjsLib.getDocument(url).promise;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;

    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    img.className = 'page-image';

    pages.push({
      image: img,
      audio: `audio/page${i}.mp3`
    });
  }

  renderCurrentPage();
}

let flipping = false;

function renderCurrentPage(direction = 'none') {
  if (flipping) return;
  flipping = true;

  const wrapper = document.createElement('div');
  wrapper.className = 'page-wrapper';

  const page = pages[currentIndex];
  const img = page.image.cloneNode();
  const soundBtn = document.createElement('button');
  soundBtn.className = 'sound-button';
  soundBtn.innerText = '🎵';
  soundBtn.onclick = () => {
    audioPlayer.src = page.audio;
    audioPlayer.play();
  };

  wrapper.appendChild(img);
  wrapper.appendChild(soundBtn);

  // clear previous and add new
  container.innerHTML = '';
  container.appendChild(wrapper);

  if (direction === 'left') {
    wrapper.style.transform = 'rotateY(-90deg)';
    requestAnimationFrame(() => {
      wrapper.style.transform = 'rotateY(0deg)';
    });
  } else if (direction === 'right') {
    wrapper.style.transform = 'rotateY(90deg)';
    requestAnimationFrame(() => {
      wrapper.style.transform = 'rotateY(0deg)';
    });
  }

  setTimeout(() => {
    flipping = false;
  }, 600); // match your transition duration
}

function nextPage() {
  if (currentIndex < pages.length - 1) {
    currentIndex++;
    renderCurrentPage();
  }
}

function prevPage() {
  if (currentIndex > 0) {
    currentIndex--;
    renderCurrentPage();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' && currentIndex < pages.length - 1) {
    currentIndex++;
    renderCurrentPage('left');
  }
  if (e.key === 'ArrowLeft' && currentIndex > 0) {
    currentIndex--;
    renderCurrentPage('right');
  }
});

let touchStartX = 0;
let touchEndX = 0;

container.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

container.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

container.addEventListener('click', (e) => {
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < rect.width / 2 && currentIndex > 0) {
    currentIndex--;
    renderCurrentPage('right');
  } else if (x >= rect.width / 2 && currentIndex < pages.length - 1) {
    currentIndex++;
    renderCurrentPage('left');
  }
});

function handleSwipe() {
  const diff = touchEndX - touchStartX;
  if (Math.abs(diff) < 50) return; // ignore tiny swipes

  if (diff < 0 && currentIndex < pages.length - 1) {
    currentIndex++;
    renderCurrentPage('left');
  } else if (diff > 0 && currentIndex > 0) {
    currentIndex--;
    renderCurrentPage('right');
  }
}


// renderPDF();

function setupClickZones() {
  const leftZone = document.createElement('div');
  const rightZone = document.createElement('div');

  leftZone.className = 'click-zone left-zone';
  rightZone.className = 'click-zone right-zone';

  leftZone.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderCurrentPage('right'); // flipping backward
    }
  });

  rightZone.addEventListener('click', () => {
    if (currentIndex < pages.length - 1) {
      currentIndex++;
      renderCurrentPage('left'); // flipping forward
    }
  });

  container.appendChild(leftZone);
  container.appendChild(rightZone);
}

renderPDF().then(setupClickZones);
