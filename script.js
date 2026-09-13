 // Generate random twinkling background stars
  const bgStarsContainer = document.getElementById('bg-stars');
  const NUM_BG_STARS = 90;
  for (let i = 0; i < NUM_BG_STARS; i++) {
    const s = document.createElement('div');
    s.classList.add('bg-star');
    const size = Math.random() * 2 + 1; // 1px to 3px
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 85 + '%'; // keep off the tree area
    s.style.animationDelay = (Math.random() * 3) + 's';
    s.style.animationDuration = (2 + Math.random() * 3) + 's';
    bgStarsContainer.appendChild(s);
  }

  const container = document.getElementById('game-container');
  const gameWrapper = document.getElementById('game-wrapper');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const basket = document.getElementById('basket');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const highScoreEl = document.getElementById('high-score');
  const newHighMsgEl = document.getElementById('new-high-msg');
  const gameOverEl = document.getElementById('game-over');
  const startScreenEl = document.getElementById('start-screen');
  const finalScoreEl = document.getElementById('final-score');

  let highScore = parseInt(localStorage.getItem('catchStarsHighScore')) || 0;
  highScoreEl.textContent = highScore;

  // Simple sound effects using Web Audio API (no sound files needed)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playTone(freq, duration, type, volume) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const vol = volume || 0.12;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration + 0.02);
  }

  function playCatchSound() {
    // pleasant two-note chime (C6 then E6)
    playTone(1046, 0.12, 'sine', 0.1);
    setTimeout(() => playTone(1318, 0.15, 'sine', 0.09), 60);
  }

  function playMissSound() {
    playTone(220, 0.18, 'sine', 0.08);
  }

  function playGameOverSound() {
    playTone(392, 0.18, 'sine', 0.1);
    setTimeout(() => playTone(330, 0.18, 'sine', 0.1), 160);
    setTimeout(() => playTone(262, 0.3, 'sine', 0.1), 320);
  }

  const containerWidth = 500;
  const containerHeight = 600;
  const basketWidth = 90;

  let basketX = containerWidth / 2 - basketWidth / 2;
  let score = 0;
  let lives = 6;
  let fallSpeed = 2.5;
  let spawnInterval = 1200;
  let gameRunning = false;
  let spawnTimer = null;
  let animationFrame = null;
  let stars = [];

  const keys = { left: false, right: false };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // Touch controls for mobile
  function pressLeft(e) { e.preventDefault(); keys.left = true; }
  function releaseLeft(e) { e.preventDefault(); keys.left = false; }
  function pressRight(e) { e.preventDefault(); keys.right = true; }
  function releaseRight(e) { e.preventDefault(); keys.right = false; }

 // Mobile + Desktop touch controls
function pressLeft(e) {
  e.preventDefault();
  keys.left = true;
}

function releaseLeft(e) {
  e.preventDefault();
  keys.left = false;
}

function pressRight(e) {
  e.preventDefault();
  keys.right = true;
}

function releaseRight(e) {
  e.preventDefault();
  keys.right = false;
}

// LEFT button
btnLeft.addEventListener('pointerdown', pressLeft);
btnLeft.addEventListener('pointerup', releaseLeft);
btnLeft.addEventListener('pointercancel', releaseLeft);
btnLeft.addEventListener('pointerleave', releaseLeft);

// RIGHT button
btnRight.addEventListener('pointerdown', pressRight);
btnRight.addEventListener('pointerup', releaseRight);
btnRight.addEventListener('pointercancel', releaseRight);
btnRight.addEventListener('pointerleave', releaseRight);

  const gameScaler = document.getElementById('game-scaler');

  // Scale the game to fit small mobile screens without changing game logic
  function scaleGame() {
    const availableWidth = window.innerWidth - 20;
    const availableHeight = window.innerHeight - 140; // leave room for touch buttons + margins
    const scale = Math.min(1, availableWidth / containerWidth, availableHeight / containerHeight);
    container.style.transform = 'scale(' + scale + ')';
    gameScaler.style.width = (containerWidth * scale) + 'px';
    gameScaler.style.height = (containerHeight * scale) + 'px';
  }
  window.addEventListener('resize', scaleGame);
  window.addEventListener('orientationchange', scaleGame);
  scaleGame();

  function updateBasketPosition() {
    if (keys.left) basketX -= 6;
    if (keys.right) basketX += 6;
    basketX = Math.max(0, Math.min(containerWidth - basketWidth, basketX));
    basket.style.left = basketX + 'px';
  }

  function spawnStar() {
    const star = document.createElement('div');
    star.classList.add('star');
    star.textContent = '⭐';
    star.style.left = Math.random() * (containerWidth - 30) + 'px';
    container.appendChild(star);
    stars.push({ el: star, y: -40 });
  }

  const starSize = 32;

  function gameLoop() {
    updateBasketPosition();

    const basketTop = basket.offsetTop;
    const basketBottom = basketTop + basket.offsetHeight;
    const basketLeft = basketX;
    const basketRight = basketX + basketWidth;

    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += fallSpeed;
      s.el.style.top = s.y + 'px';

      const starLeft = parseFloat(s.el.style.left);
      const starTop = s.y;
      const starBottom = starTop + starSize;
      const starRight = starLeft + starSize;

      // check catch (simple box overlap, a bit forgiving so it feels responsive)
      const overlaps = starBottom >= basketTop && starTop <= basketBottom &&
                        starRight >= basketLeft && starLeft <= basketRight;

      if (overlaps) {
        score++;
        scoreEl.textContent = score;
        playCatchSound();
        container.removeChild(s.el);
        stars.splice(i, 1);

        // increase difficulty every 5 points
        if (score % 5 === 0) {
          fallSpeed += 0.5;
        }
        continue;
      }

      // check missed
      if (s.y > containerHeight) {
        container.removeChild(s.el);
        stars.splice(i, 1);
        lives--;
        livesEl.textContent = lives;
        playMissSound();
        if (lives <= 0) {
          endGame();
          return;
        }
      }
    }

    animationFrame = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // reset state
    stars.forEach(s => container.removeChild(s.el));
    stars = [];
    score = 0;
    lives = 6;
    fallSpeed = 2.5;
    spawnInterval = 1200;
    basketX = containerWidth / 2 - basketWidth / 2;
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    newHighMsgEl.style.display = 'none';

    startScreenEl.style.display = 'none';
    gameOverEl.style.display = 'none';
    gameRunning = true;

    clearInterval(spawnTimer);
    cancelAnimationFrame(animationFrame);

    spawnTimer = setInterval(spawnStar, spawnInterval);
    animationFrame = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    gameRunning = false;
    clearInterval(spawnTimer);
    cancelAnimationFrame(animationFrame);
    playGameOverSound();
    finalScoreEl.textContent = score;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('catchStarsHighScore', highScore);
      highScoreEl.textContent = highScore;
      newHighMsgEl.style.display = 'block';
    } else {
      newHighMsgEl.style.display = 'none';
    }

    gameOverEl.style.display = 'flex';
  }