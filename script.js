const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 縦横比を固定（スマホ向けの9:16）
const ASPECT_RATIO = 9 / 16;

// ゲーム内の基本設定
const BASE_WIDTH = 360; // 基準幅
const BASE_HEIGHT = 640; // 基準高さ
let scale = 1; // リサイズ時のスケール

// パドル設定
const paddle = {
  width: 100,
  height: 10,
  x: 0,
  y: 0,
  rotation: 0, // 回転角度 (ラジアン)
};

// ボール設定
const ball = {
  x: 0,
  y: 0,
  radius: 10,
  speed: 5,
  dx: 5,
  dy: -5,
};

// ブロック設定
const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 35;

let bricks = [];
for (let row = 0; row < brickRowCount; row++) {
  bricks[row] = [];
  for (let col = 0; col < brickColumnCount; col++) {
    bricks[row][col] = { x: 0, y: 0, status: 1 };
  }
}

// ゲームオーバーフラグ
let isGameOver = false;

// キャンバスサイズをリサイズ
function resizeCanvas() {
  const windowWidth = window.innerWidth * 0.75; // 画面幅の3/4
  const windowHeight = window.innerHeight * 0.75; // 画面高さの3/4

  if (windowWidth / windowHeight < ASPECT_RATIO) {
    canvas.width = windowWidth;
    canvas.height = windowWidth / ASPECT_RATIO;
  } else {
    canvas.height = windowHeight;
    canvas.width = windowHeight * ASPECT_RATIO;
  }

  scale = canvas.width / BASE_WIDTH;

  // パドルの位置を再設定
  paddle.width = 100 * scale;
  paddle.height = 10 * scale;
  paddle.x = (BASE_WIDTH / 2 - 50) * scale;
  paddle.y = (BASE_HEIGHT - 20) * scale;

  // ボールの位置を再設定
  ball.x = (BASE_WIDTH / 2) * scale;
  ball.y = (BASE_HEIGHT / 2) * scale;
  ball.radius = 10 * scale;

  // ブロックのサイズと位置をスケーリング
  for (let row = 0; row < brickRowCount; row++) {
    for (let col = 0; col < brickColumnCount; col++) {
      const brick = bricks[row][col];
      brick.x = (brickOffsetLeft + col * (brickWidth + brickPadding)) * scale;
      brick.y = (brickOffsetTop + row * (brickHeight + brickPadding)) * scale;
      brick.width = brickWidth * scale;
      brick.height = brickHeight * scale;
    }
  }
}

// パドルを描画（回転を適用）
function drawPaddle() {
  ctx.save(); // 現在の状態を保存
  ctx.translate(paddle.x + paddle.width / 2, paddle.y + paddle.height / 2); // 中心点に移動
  ctx.rotate(paddle.rotation); // 回転を適用
  ctx.fillStyle = "#0095dd";
  ctx.fillRect(-paddle.width / 2, -paddle.height / 2, paddle.width, paddle.height); // 中心から描画
  ctx.restore(); // 保存した状態を復元
}

// ボールを描画
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095dd";
  ctx.fill();
  ctx.closePath();
}

// ブロックを描画
function drawBricks() {
  for (let row = 0; row < brickRowCount; row++) {
    for (let col = 0; col < brickColumnCount; col++) {
      const brick = bricks[row][col];
      if (brick.status === 1) {
        ctx.fillStyle = "#0095dd";
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      }
    }
  }
}

// ボールの移動
function moveBall() {
  ball.x += ball.dx * scale;
  ball.y += ball.dy * scale;

  // 壁との衝突
  if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
    ball.dx *= -1;
  }
  if (ball.y - ball.radius < 0) {
    ball.dy *= -1;
  }

// パドルとの衝突
if (
  ball.x > paddle.x &&
  ball.x < paddle.x + paddle.width &&
  ball.y + ball.radius > paddle.y
) {
  const paddleCenter = paddle.x + paddle.width / 2; // パドルの中心
  const impactPoint = ball.x - paddleCenter; // 衝突位置の相対座標
  const maxBounceAngle = Math.PI / 3; // 最大反射角（60度）

  // 衝突位置を基に反射角を計算
  const bounceAngle = (impactPoint / (paddle.width / 2)) * maxBounceAngle;

  // 速度を更新
  const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2); // 現在の速度を一定に保つ
  ball.dx = speed * Math.sin(bounceAngle); // 新しいX方向速度
  ball.dy = -speed * Math.cos(bounceAngle); // 新しいY方向速度
}


  // ブロックとの衝突
  for (let row = 0; row < brickRowCount; row++) {
    for (let col = 0; col < brickColumnCount; col++) {
      const brick = bricks[row][col];
      if (
        brick.status === 1 &&
        ball.x > brick.x &&
        ball.x < brick.x + brick.width &&
        ball.y > brick.y &&
        ball.y < brick.y + brick.height
      ) {
        ball.dy *= -1;
        brick.status = 0;
      }
    }
  }

  // 底に落ちた場合
  if (ball.y + ball.radius > canvas.height && !isGameOver) {
    isGameOver = true;
    alert("ゲームオーバー！");
    document.location.reload();
  }
}

// 描画
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPaddle();
  drawBall();
  drawBricks();
}

// 更新
function update() {
  moveBall();          // ボールの移動
  updatePaddleRotation(); // パドルの回転を更新
  draw();              // 描画（画面の描画）
  if (!isGameOver) requestAnimationFrame(update); // 次のフレームをリクエスト
}

// パドルの回転を更新
function updatePaddleRotation() {
  paddle.rotation += 0.01; // 回転速度を設定（小さいほどゆっくり）
}

// マウスとタッチの移動イベント
canvas.addEventListener("mousemove", handlePaddleMove);
canvas.addEventListener("touchmove", handlePaddleMove);

function handlePaddleMove(e) {
  e.preventDefault(); // スクロールを無効化

  const canvasRect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const mouseX = clientX - canvasRect.left;

  paddle.x = mouseX - paddle.width / 2;

  // パドルが画面外に出ないよう制御
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width)
    paddle.x = canvas.width - paddle.width;
}

// 初期化
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
update();
