  const container = document.getElementById('game-container');
  const basket = document.getElementById('basket');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const gameOverEl = document.getElementById('game-over');
  const startScreenEl = document.getElementById('start-screen');
  const finalScoreEl = document.getElementById('final-score');

  const containerWidth = 500;
  const containerHeight = 600;
  const basketWidth = 90;

  let basketX = containerWidth / 2 - basketWidth / 2;
  let score = 0;
  let lives = 10;
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

  function gameLoop() {
    updateBasketPosition();

    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += fallSpeed;
      s.el.style.top = s.y + 'px';

      const starLeft = parseFloat(s.el.style.left);

      // check catch
      if (s.y + 28 >= containerHeight - 60 && s.y + 28 <= containerHeight - 20 &&
          starLeft + 28 >= basketX && starLeft <= basketX + basketWidth) {
        score++;
        scoreEl.textContent = score;
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
        if (lives <= 0) {
          endGame();
          return;
        }
      }
    }

    animationFrame = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    // reset state
    stars.forEach(s => container.removeChild(s.el));
    stars = [];
    score = 0;
    lives = 10;
    fallSpeed = 2.5;
    spawnInterval = 1200;
    basketX = containerWidth / 2 - basketWidth / 2;
    scoreEl.textContent = score;
    livesEl.textContent = lives;

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
    finalScoreEl.textContent = score;
    gameOverEl.style.display = 'flex';
  }