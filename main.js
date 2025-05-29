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
  document.getElementById('loading-screen').style.display = 'none';
}

let flipping = false;

function renderCurrentPage(direction = 'none') {
  if (flipping) return;
  audioPlayer.pause();
  flipping = true;

  const wrapper = document.createElement('div');
  wrapper.className = 'page-wrapper';

  const page = pages[currentIndex];
  const img = page.image.cloneNode();

  wrapper.appendChild(img);

  const soundImg = document.createElement('img');
  soundImg.src = 'images/SoundPlay.png';
  soundImg.className = 'sound-icon';

  if (currentIndex >= 6 && currentIndex <= 21) {
    const soundBtn = document.createElement('button');
    soundBtn.className = 'sound-button';
    soundBtn.appendChild(soundImg);
    soundBtn.onclick = (e) => {
      e.stopPropagation();

      if (!audioPlayer.paused && audioPlayer.src.includes(page.audio)) {
        audioPlayer.pause();
        soundImg.classList.remove('playing');
      } else {
        audioPlayer.src = page.audio;
        audioPlayer.play();
        soundImg.classList.add('playing');
  }
    };
    wrapper.appendChild(soundBtn);
  }

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
    const page = pages[currentIndex];
    if (currentIndex >= 6 && currentIndex <= 21 && page.audio) {
        audioPlayer.src = page.audio;
        audioPlayer.play();
        soundImg.classList.add('playing');
    } else {
        // Stop audio when out of range
        audioPlayer.pause();
        soundImg.classList.remove('playing');
        audioPlayer.src = '';
    }
  }, 600); // match your transition duration
}

audioPlayer.addEventListener('ended', () => {
  if (currentIndex >= 6 && currentIndex <= 20 && currentIndex < pages.length - 1) {
    currentIndex++;
    renderCurrentPage('left');
  } else {
    const icon = document.querySelector('.sound-icon.playing');
    if (icon) icon.classList.remove('playing');
  }
});

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
document.getElementById('fullscreen-prompt').style.display = 'flex';

document.getElementById('enter-fullscreen').addEventListener('click', () => {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen();
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  else if (el.msRequestFullscreen) el.msRequestFullscreen();

  document.getElementById('fullscreen-prompt').style.display = 'none';
});

const toggleBtn = document.getElementById('fullscreen-btn');

toggleBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    enterFullscreen(document.documentElement);
  } else {
    document.exitFullscreen();
  }
});

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    toggleBtn.textContent = '关闭全频模式';
  } else {
    toggleBtn.textContent = '打开全频模式';
  }
});

function enterFullscreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) { // Safari
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) { // IE11
    element.msRequestFullscreen();
  } else if (element.mozRequestFullScreen) { // Firefox
    element.mozRequestFullScreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { // Safari
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { // IE11
    document.msExitFullscreen();
  } else if (document.mozCancelFullScreen) { // Firefox
    document.mozCancelFullScreen();
  }
}