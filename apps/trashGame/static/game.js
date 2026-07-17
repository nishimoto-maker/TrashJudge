// ===================================================
// CYBER ECOLOGY FACTORY - CORE ENGINE (RE-BUILT SYSTEM)
// ===================================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let score, pollution, trashes, selectedTrash, gameOver, timeLeft, difficulty;
let combo, fever, feverTimer;
let damageEffect = 0;
let scanLineY = 0; 

const MAX_SCORE = 99999999;
const MIN_SCORE = -99999999;

let paused = false;
let mouseX = 0;
let mouseY = 0;

let transitionTimer = 0;       // 遷移アニメーションのタイマー（フレームカウント）
const TRANSITION_MAX = 30;     // アニメーションの総フレーム数（約0.5秒）
let selectedDifficultyNext = null; // 一時的に選択された難易度を保持する変数
let isFirstSpawnFade = false;
let spawnFadeTimer = 0;

// ポーズ中の選択肢管理 (0: YES / 1: NO) 
let pauseSelectIndex = 1;
let titleBgmStarted = false;

const bgm = {
    title: new Audio("/game/static/audio/gomi.mp3"),
    game: new Audio("/game/static/audio/game.mp3")
};

bgm.title.loop = true;
bgm.game.loop = true;

bgm.title.volume = 0.4;
bgm.game.volume = 0.2;

const se = {
    select: new Audio("/game/static/audio/決定.mp3"),
    mausu: new Audio("/game/static/audio/セレクト音.mp3"),
    damage: new Audio("/game/static/audio/ダメージ.mp3"),
    kaihuku: new Audio("/game/static/audio/回復.mp3"),
    ok: new Audio("/game/static/audio/成功.mp3"),
    bomb: new Audio("/game/static/audio/爆弾.mp3"),
    bigbomb: new Audio("/game/static/audio/デーモンコア.mp3"),
    buzar: new Audio("/game/static/audio/警告.mp3"),
    fiver: new Audio("/game/static/audio/フィーバー.mp3"),
    finalAlarm: new Audio("/game/static/audio/カウントダウン.mp3"),
    clear : new Audio("/game/static/audio/クリア.mp3")
};

let buzzerPlaying = false;
se.buzar.loop = true;

se.select.volume = 0.6;
se.mausu.volume = 0.8;
se.damage.volume = 0.8;
se.kaihuku.volume = 1.0;
se.ok.volume = 0.8;
se.bomb.volume = 0.8;
se.bigbomb.volume = 1.0;
se.buzar.volume = 1.0;
se.fiver.volume = 1.0;
se.clear.volume = 1.0;

let finalAlarmPlaying = false;
se.finalAlarm.volume = 1.0;

function drawRoundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);

    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);

    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);

    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);

    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);

    ctx.closePath();
}

function hexToRgb(hex) {
    hex = hex.replace("#", "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
}

function drawCyberStar(ctx, x, y, radius, points) {

    ctx.beginPath();

    for (let i = 0; i < points * 2; i++) {

        const angle = (Math.PI / points) * i;
        const r = i % 2 === 0 ? radius : radius * 0.5;

        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.closePath();
    ctx.stroke();
}

// マウス位置などの状態管理（ホバーアニメーション用）
let hoveredSector = null; // 現在マウスが乗っているセクターのインデックス (0~2)

// =====================
// 難易度カード共通定義
// =====================
const CARD_X = 25;
const CARD_W = 500;
const CARD_H = 100;

const EASY_Y = 160;
const NORMAL_Y = 300;
const HARD_Y = 440;

// =====================
const DIFFICULTY = {
    easy: { MIN_SPEED: 1.5, MAX_SPEED: 3, max: 3, time: 30 },
    normal: { MIN_SPEED: 2, MAX_SPEED: 4, max: 5, time: 30 },
    hard: { MIN_SPEED: 2, MAX_SPEED: 4, max: 5, time: 30 }
};

difficulty = null;

// =====================
const images = {
    burn: new Image(),
    recycle: new Image(),
    can: new Image(),
    plastic: new Image(),
    bag: new Image(),
    bomb: new Image(),
    superBomb: new Image(),
    easy: new Image(),
    normal: new Image(),
    hard: new Image()
};

images.burn.src = "/game/static/img/燃えるゴミ.png";
images.recycle.src = "/game/static/img/リサイクル.png";
images.can.src = "/game/static/img/缶ごみ.png";
images.plastic.src = "/game/static/img/プラスチックごみ.png";
images.bag.src = "/game/static/img/大きなゴミ.png";
images.bomb.src = "/game/static/img/爆弾.png";
images.superBomb.src = "/game/static/img/デーモンコア.png";

images.easy.src = "/game/static/img/easy.png";
images.normal.src = "/game/static/img/normal.png";
images.hard.src = "/game/static/img/hard.png";

const baseBoxes = [
    { x: 80, type: "burn", img: images.burn, color: "#ff5500" },
    { x: 200, type: "recycle", img: images.recycle, color: "#00ff66" },
    { x: 320, type: "can", img: images.can, color: "#ffcc00" },
    { x: 440, type: "plastic", img: images.plastic, color: "#00bfff" }
];

const trashTypes = [
    { type: "burn", img: images.burn, w: 40, h: 40 },
    { type: "recycle", img: images.recycle, w: 40, h: 40 },
    { type: "can", img: images.can, w: 60, h: 60 },
    { type: "plastic", img: images.plastic, w: 40, h: 40 },

    { type: "bag", img: images.bag, w: 80, h: 80, onlyHard: true, hp: 3, weight: 1 },
    { type: "bomb", img: images.bomb, w: 50, h: 50, onlyHard: true, weight: 1 },
    { type: "superBomb", img: images.superBomb, w: 60, h: 60, onlyHard: true, weight: 0 }
];

// =====================
function weightedRandom(list) {
    let pool = [];
    for (let item of list) {
        let w = item.weight ?? 5;
        for (let i = 0; i < w; i++) pool.push(item);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

// =====================
function createTrash(fromBag = false) {
    let available = difficulty === DIFFICULTY.hard
        ? trashTypes
        : trashTypes.filter(t => !t.onlyHard);

    const t = weightedRandom(available);

    let speed = fromBag ? 1.2 :
        Math.random() * (difficulty.MAX_SPEED - difficulty.MIN_SPEED) + difficulty.MIN_SPEED;

    if (fever) {
        speed *= 0.5;
    }

    let targetLane = baseBoxes[Math.floor(Math.random() * baseBoxes.length)];
    let spawnX = targetLane.x;

    if (
        (t.type === "bomb" || t.type === "superBomb")
        && fever
        && !fromBag
    ) {
        spawnX = canvas.width + 20;
    }

    return {
        x: spawnX,
        y: -20,
        w: t.w,
        h: t.h,
        speed,
        type: t.type,
        img: t.img,
        hp: t.hp || 1,
        hit: false
    };
}

// =====================
function initGame(mode) {
    difficulty = DIFFICULTY[mode];
    score = 0;
    pollution = 0; 
    trashes = [];
    selectedTrash = null;
    gameOver = false;
    paused = false; // 初期化時はポーズ解除
    combo = 0;
    fever = false;
    feverTimer = 0;
    timeLeft = difficulty.time;

    bgm.title.pause();
    bgm.title.currentTime = 0;

    bgm.game.currentTime = 0;
    bgm.game.play().catch(() => {});
}

// =====================
// タイマーシステム
setInterval(() => {
    // ゲーム中かつポーズ中でない場合のみタイマーと環境変化を処理
    if (difficulty && !gameOver && !paused) {
        
        timeLeft--;
      
        if (timeLeft <= 10 && timeLeft > 0) {

            if (!buzzerPlaying) {
                se.finalAlarm.loop = true;
                se.finalAlarm.currentTime = 0;
                se.finalAlarm.play().catch(() => {});

                buzzerPlaying = true;
            }
        }

        // タイマーが0以下になったらピタッと止めてゲームオーバー
        if (timeLeft <= 0) {

            timeLeft = 0;

            se.finalAlarm.pause();
            se.finalAlarm.currentTime = 0;

            se.clear.currentTime = 0;
            se.clear.play().catch(() => {});

            buzzerPlaying = false;

            gameOver = true;
        }

        // 環境汚染度によるスコア変動ロジック
        if (pollution >= 180) {

            if (!buzzerPlaying) {
                se.buzar.loop = true;
                se.buzar.play().catch(() => {});
                buzzerPlaying = true;
            }

            score = Math.max(MIN_SCORE, score - 80000);
            damageEffect = Math.max(damageEffect, 3); 
        } else if (pollution >= 150) {   
            if (buzzerPlaying) {
                se.buzar.pause();
                se.buzar.currentTime = 0;
                buzzerPlaying = false;
            }

            score = Math.max(MIN_SCORE, score - 45000);
        } else if (pollution <= 50) {        
            if (buzzerPlaying) {
                se.buzar.pause();
                se.buzar.currentTime = 0;
                buzzerPlaying = false;
            }

            score = Math.min(MAX_SCORE, score + 10000);
        }

        // フィーバータイムのカウントダウン
        if (fever) {
            feverTimer--;

            if (feverTimer <= 0) {
                console.log("FEVER END");
                let bombs = trashes.filter(t => t.type === "bomb" || t.type === "superBomb");

                for (let b of bombs) {
                    for (let o of trashes) {
                        let dx = o.x - b.x;
                        let dy = o.y - b.y;

                        if (Math.sqrt(dx*dx + dy*dy) < 120) {
                            Object.assign(o, createTrash());
                            delete o.vx; 
                        }
                    }
                }

                trashes = trashes.filter(t => t.type !== "bomb" && t.type !== "superBomb");
                fever = false;
                combo = 0;

                while (trashes.length > difficulty.max) {
                    let i = Math.floor(Math.random() * trashes.length);
                    trashes.splice(i, 1);
                }
            }
        }
    }
}, 1000);

// =====================
function getBombZone() {
    return {
        x: canvas.width - 30,
        y: canvas.height / 2,
        w: 80,
        h: 220
    };
}

// =====================
function loop() {
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // ---------------------------------------------------
    //【条件分岐】シーン別サイバー背景描画
    // ---------------------------------------------------
    if (difficulty) {
        // ===================================================
        // ゲームプレイ本編の背景（従来の縦縞レーンと横線）
        // ===================================================
        ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.height; i += 30) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
        }

        baseBoxes.forEach(b => {
            let laneColor = fever ? "rgba(255, 0, 85, 0.12)" : "rgba(0, 240, 255, 0.05)";
            let lineColor = fever ? "rgba(255, 0, 85, 0.3)" : "rgba(0, 240, 255, 0.15)";
            
            ctx.fillStyle = laneColor;
            ctx.fillRect(b.x - 25, 0, 50, canvas.height);
            
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.beginPath(); ctx.moveTo(b.x - 25, 0); ctx.lineTo(b.x - 25, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(b.x + 25, 0); ctx.lineTo(b.x + 25, canvas.height); ctx.stroke();
            ctx.setLineDash([]); 
        });

        // ==========================================
        // 【PAUSE GUIDE】右上にスペースキーの案内を表示
        // ==========================================
        ctx.save();
        ctx.fillStyle = "rgba(0, 240, 255, 0.65)"; // サイバーブルー（少し透過）
        ctx.font = "12px 'Share Tech Mono', sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "top";

        // [AUDIO] などの表示スタイルに合わせて
        ctx.fillText("[ SYSTEM: READY ]", canvas.width - 30, 50);
        ctx.fillText("➢ PRESS [SPACE] TO PAUSE", canvas.width - 10, 65);
        ctx.restore();

    } else if (transitionTimer === 0) {
        // ===================================================
        // 難易度選択画面（SELECT SECTOR）の極上サイバーUI
        // ===================================================
        const time = Date.now() * 0.002; // アニメーション用の時間係数

        // 難易度ごとのデータ定義（プロジェクトの実際の画像名・位置に最適化）
        const sectors = [
            {
                level: "EASY MODE",
                desc: "低汚染区域で処理訓練を行います。",
                req: "SECTOR CLASS : C",
                color: "#00ff33",
                bgImg: images.easy,
                iconType: "compass",
                y: EASY_Y
            },
            {
                level: "NORMAL MODE",
                desc: "一般区域の廃棄物処理を行います。",
                req: "SECTOR CLASS : B",
                color: "#ffcc00",
                bgImg: images.normal,
                iconType: "target",
                y: NORMAL_Y
            },
            {
                level: "HARD MODE",
                desc: "危険廃棄物処理区域へ配属されます。",
                req: "SECTOR CLASS : A",
                color: "#ff1144",
                bgImg: images.hard,
                iconType: "skull",
                y: HARD_Y
            }
        ];

        // ---------------------------------------------------
        // LAYER 1: 空間の奥行きを演出するダークラジアルグラデーション
        // ---------------------------------------------------
        let bgGrad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 50,
            canvas.width / 2, canvas.height / 2, canvas.width
        );
        bgGrad.addColorStop(0, "#081022");
        bgGrad.addColorStop(1, "#02040a");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ---------------------------------------------------
        // LAYER 2: 背景の薄いシステムサークル（幾何学模様）
        // ---------------------------------------------------
        ctx.save();
        ctx.strokeStyle = "rgba(0, 240, 255, 0.025)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 180, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 320, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 50); ctx.lineTo(canvas.width / 2, canvas.height - 50);
        ctx.moveTo(50, canvas.height / 2); ctx.lineTo(canvas.width - 50, canvas.height / 2);
        ctx.stroke();
        ctx.restore();

        // ---------------------------------------------------
        // LAYER 3: スキャンパルス（背景の底を流れるデータの波）
        // ---------------------------------------------------
        ctx.save();
        let pulseY = (time * 60) % (canvas.height + 200) - 100;
        let pulseGrad = ctx.createLinearGradient(0, pulseY - 40, 0, pulseY + 40);
        pulseGrad.addColorStop(0, "rgba(0, 240, 255, 0)");
        pulseGrad.addColorStop(0.5, "rgba(0, 240, 255, 0.2)");
        pulseGrad.addColorStop(1, "rgba(0, 240, 255, 0)");
        ctx.fillStyle = pulseGrad;
        ctx.fillRect(0, pulseY - 40, canvas.width, 80);
        ctx.restore();

        // ---------------------------------------------------
        // LAYER 4: パルス・ドットマトリクス（動的に明滅するグリッド）
        // ---------------------------------------------------
        for (let x = 20; x < canvas.width; x += 25) {
            for (let y = 20; y < canvas.height; y += 25) {
                let dx = x - canvas.width / 2;
                let dy = y - canvas.height / 2;
                let dist = Math.sqrt(dx * dx + dy * dy) * 0.01;
                let pulse = Math.sin(dist - time) * 0.5 + 0.5;

                ctx.fillStyle = `rgba(0, 240, 255, ${0.01 + pulse * 0.05})`;
                ctx.beginPath();
                ctx.arc(x, y, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ---------------------------------------------------
        // LAYER 5: 画面外殻のSF風アサルトフレーム＆目盛り
        // ---------------------------------------------------
        ctx.save();
        ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(35, 30); ctx.lineTo(35, canvas.height - 30);
        ctx.moveTo(canvas.width - 35, 30); ctx.lineTo(canvas.width - 35, canvas.height - 30);
        ctx.stroke();

        ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
        for (let hY = 60; hY < canvas.height - 60; hY += 40) {
            ctx.fillRect(32, hY, 4, 1);
            ctx.fillRect(canvas.width - 36, hY, 4, 1);
        }

        // 四隅のL字型高精度コーナーフレーム
        ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
        ctx.lineWidth = 2;
        const offset = 25;
        const len = 30;
        ctx.beginPath(); ctx.moveTo(offset, offset + len); ctx.lineTo(offset, offset); ctx.lineTo(offset + len, offset); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(canvas.width - offset - len, offset); ctx.lineTo(canvas.width - offset, offset); ctx.lineTo(canvas.width - offset, offset + len); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(offset, canvas.height - offset - len); ctx.lineTo(offset, canvas.height - offset); ctx.lineTo(offset + len, canvas.height - offset); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(canvas.width - offset - len, canvas.height - offset); ctx.lineTo(canvas.width - offset, canvas.height - offset); ctx.lineTo(canvas.width - offset, canvas.height - offset - len); ctx.stroke();
        ctx.restore();

        // ---------------------------------------------------
        // LAYER 6: 画面最下部のシステムステータス表示
        // ---------------------------------------------------
        ctx.save();
        ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
        ctx.font = "9px 'Share Tech Mono', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("SYS_STATUS: ONLINE // BOOT_LOG_OK", 45, canvas.height - 40);
        ctx.fillText("CORE_TEMP: 34.2C // LATENCY: 0.003ms", 45, canvas.height - 28);
        ctx.textAlign = "right";
        ctx.fillText("SECTOR_SELECT_OS_V4.26", canvas.width - 45, canvas.height - 40);
        ctx.fillText(Math.random() > 0.98 ? "!! WARNING: OVERFLOW !!" : "SECURITY_LEVEL: MAXIMUM", canvas.width - 45, canvas.height - 28);
        ctx.restore();

        // ---------------------------------------------------
        // LAYER 7: タイトル表示（SELECT SECTOR）
        // ---------------------------------------------------
        ctx.save();
        ctx.fillStyle = "#00f0ff";
        ctx.font = "italic bold 38px 'Share Tech Mono', sans-serif";
        ctx.textAlign = "center";
        ctx.shadowBlur = 40;
        ctx.shadowColor = "#00f0ff";
        ctx.fillText("===  SELECT SECTOR  ===", canvas.width / 2, 100);

        // タイトルアンダーライン（呼吸エフェクト）
        ctx.shadowBlur = 8;
        ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
        ctx.lineWidth = 1;
        let barW = 220 + Math.sin(time * 2) * 10;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - barW, 130); ctx.lineTo(canvas.width / 2 + barW, 130);
        ctx.stroke();
        ctx.restore();

        // ---------------------------------------------------
        // LAYER 8: 【難易度カードのレンダリング】
        // ---------------------------------------------------
        sectors.forEach((sector, index) => {
            const isHover = (hoveredSector === index);
            ctx.save();

            // ==================================================
            // 【サイズ最適化】ゲーム画面にジャストフィットする大きさに縮小
            // ==================================================
            const cardX = CARD_X;          // 中央に配置されるようX座標を調整
            const cardY = sector.y;      // 各セクターのY座標
            const cardW = CARD_W;          // 横幅をシャープに調整
            const cardH = CARD_H;          // 高さをコンパクトに凝縮
            const radius = 8;           // 角丸もサイズに合わせて少しシャープに

            // ==========================
            // 背景画像
            // ==========================
            ctx.save();
            drawRoundRectPath(ctx, cardX, cardY, cardW, cardH, radius);
            ctx.clip();

            ctx.fillStyle = "#040812";
            ctx.fillRect(cardX, cardY, cardW, cardH);

            let bgImg = sector.bgImg;

            if (bgImg) {
                ctx.globalAlpha = isHover ? 0.45 : 0.25;

                let zoom = isHover
                    ? 1.05 + Math.sin(time * 2) * 0.01
                    : 1.0;

                let imgW = cardW * zoom;
                let imgH = cardH * zoom;

                let imgX = cardX - (imgW - cardW) / 2;
                let imgY = cardY - (imgH - cardH) / 2;

                ctx.drawImage(bgImg, imgX, imgY, imgW, imgH);
            }

            ctx.restore();

            // ==========================
            // ネオン枠
            // ==========================
            ctx.strokeStyle = sector.color;
            ctx.lineWidth = isHover ? 2.5 : 1.2;
            ctx.shadowBlur = isHover ? 100 : 8;
            ctx.shadowColor = sector.color;

            drawRoundRectPath(
                ctx,
                cardX,
                cardY,
                cardW,
                cardH,
                radius
            );

            ctx.stroke();

            // ==========================
            // アイコン (サイズに合わせて中央配置)
            // ==========================
            ctx.save();

            ctx.shadowBlur = isHover ? 10 : 2;
            ctx.shadowColor = sector.color;
            ctx.strokeStyle = sector.color;
            ctx.lineWidth = 1.5;

            // 高さが縮んだため、cardH / 2 で自動的に縦中央になります
            let iconX = cardX + 65; 
            let iconY = cardY + cardH / 2;

            ctx.beginPath();
            ctx.arc(iconX, iconY, 26, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = `rgba(${hexToRgb(sector.color)}, 0.25)`;

            ctx.beginPath();
            ctx.moveTo(iconX - 32, iconY);
            ctx.lineTo(iconX + 32, iconY);

            ctx.moveTo(iconX, iconY - 32);
            ctx.lineTo(iconX, iconY + 32);

            ctx.stroke();

            ctx.strokeStyle = sector.color;

            if (sector.iconType === "compass") {
                drawCyberStar(ctx, iconX, iconY, 16, 7);
            }
            else if (sector.iconType === "target") {
                ctx.beginPath();
                ctx.arc(iconX, iconY, 12, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillRect(iconX - 1.5, iconY - 18, 3, 5);
                ctx.fillRect(iconX - 1.5, iconY + 13, 3, 5);
                ctx.fillRect(iconX - 18, iconY - 1.5, 5, 3);
                ctx.fillRect(iconX + 13, iconY - 1.5, 5, 3);
            }
            else if (sector.iconType === "skull") {
                ctx.fillStyle = sector.color;
                ctx.font = "bold 26px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("💀", iconX, iconY);
            }

            ctx.restore();

            // ==========================
            // テキスト位置調整 (縮小枠にジャストフィット)
            // ==========================
            const textX = cardX + 140;

            // 1行目: [ MODE NAME ]
            ctx.fillStyle = sector.color;
            ctx.font = "bold 24px 'Share Tech Mono', sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(
                `[ ${sector.level} ]`,
                textX,
                cardY + 18
            );

            // 2行目: 説明文
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.font = "14px 'Noto Sans JP', sans-serif";
            ctx.fillText(
                sector.desc,
                textX,
                cardY + 50
            );

            // 3行目: 推奨Lv
            ctx.fillStyle = sector.color;
            ctx.font = "bold 16px 'Share Tech Mono', sans-serif";
            ctx.fillText(
                sector.req,
                textX,
                cardY + 75
            );

            // ==========================
            // バーコード装飾 (右下に綺麗に収める)
            // ==========================
            ctx.fillStyle = `rgba(${hexToRgb(sector.color)},0.3)`;

            for (let b = 0; b < 16; b++) {
                let bw = (b % 3 === 0) ? 3 : 1;
                ctx.fillRect(
                    cardX + cardW - 90 + (b * 4),
                    cardY + cardH - 24,
                    bw,
                    6
                );
            }

            ctx.restore();
        });
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // ---------------------------------------------------
    // シーン管理 & ワープトランジション演出
    // ---------------------------------------------------
    if (!difficulty) {

        if (!titleBgmStarted) {
            bgm.title.play()
                .then(() => console.log("title bgm success"))
                .catch(err => console.log("title bgm fail", err));

            titleBgmStarted = true;
        }

        // 滑らかなフラッシュアウト・ワープエフェクト
        if (transitionTimer > 0) {

            transitionTimer++;

            let progress = transitionTimer / TRANSITION_MAX;

            ctx.save();

            ctx.fillStyle =
                `rgba(10, 15, 26, ${0.1 + progress * 0.4})`;

            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            // ==================================================
            // 1. スピードトンネル
            // ==================================================
            ctx.strokeStyle =
                `rgba(0, 240, 255, ${0.3 + progress * 0.7})`;

            ctx.lineWidth =
                1 + progress * 6;

            const numLines = 10;

            for (let i = 0; i <= numLines; i++) {

                let baseX =
                    (canvas.width / numLines) * i;

                let targetX =
                    canvas.width / 2 +
                    (baseX - canvas.width / 2)
                    * (1 + progress * 8);

                ctx.beginPath();

                let warpY;

                if (selectedDifficultyNext === "easy") {
                    warpY = EASY_Y + CARD_H / 2;
                }
                else if (selectedDifficultyNext === "normal") {
                    warpY = NORMAL_Y + CARD_H / 2;
                }
                else {
                    warpY = HARD_Y + CARD_H / 2;
                }

                ctx.moveTo(
                    canvas.width / 2 +
                    (baseX - canvas.width / 2) * 0.05,
                    warpY
                );

                ctx.lineTo(
                    targetX,
                    canvas.height
                );

                ctx.stroke();
            }

            // ==================================================
            // 2. タイトル消失演出
            // ==================================================
            ctx.globalAlpha =
                Math.max(0, 1 - progress * 1.3);

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillStyle = "#00f0ff";

            ctx.font =
                `bold ${34 + progress * 50}px 'Share Tech Mono', sans-serif`;

            ctx.fillText(
                "=== SELECT SECTOR ===",
                canvas.width / 2,
                100 - progress * 30
            );

            // ==================================================
            // 選択中カードの表示
            // ==================================================
            let displayTxt = "";
            let displayColor = "#ffffff";

            if (selectedDifficultyNext === "easy") {
                displayTxt = "[ EASY MODE ]";
                displayColor = "#00ff66";
            }
            else if (selectedDifficultyNext === "normal") {
                displayTxt = "[ NORMAL MODE ]";
                displayColor = "#ffcc00";
            }
            else if (selectedDifficultyNext === "hard") {
                displayTxt = "[ HARD MODE ]";
                displayColor = "#ff0055";
            }

            let baseY;

            if (selectedDifficultyNext === "easy") {
                baseY = EASY_Y + CARD_H / 2;
            }
            else if (selectedDifficultyNext === "normal") {
                baseY = NORMAL_Y + CARD_H / 2;
            }
            else {
                baseY = HARD_Y + CARD_H / 2;
            }

            ctx.fillStyle = displayColor;

            ctx.font =
                `bold ${26 + progress * 70}px 'Share Tech Mono', sans-serif`;

            ctx.fillText(
                displayTxt,
                canvas.width / 2,
                baseY
            );

            ctx.restore();

            // ==================================================
            // 白フラッシュ
            // ==================================================
            if (progress > 0.6) {

                ctx.save();

                let flashAlpha =
                    (progress - 0.6) / 0.4;

                ctx.fillStyle =
                    `rgba(255, 255, 255, ${flashAlpha})`;

                ctx.fillRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                ctx.restore();
            }

            // ==================================================
            // シーン切り替え
            // ==================================================
            if (transitionTimer >= TRANSITION_MAX) {

                let finalDiff =
                    selectedDifficultyNext;

                transitionTimer = 0;
                selectedDifficultyNext = null;

                initGame(finalDiff);

                isFirstSpawnFade = true;
                spawnFadeTimer = 15;
            }

            requestAnimationFrame(loop);
            return;
        }

        // ---------------------------------------------------
        // 通常時の難易度選択画面
        // ---------------------------------------------------
        let isHoverHome = false;
        if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
            isHoverHome = (mouseX >= canvas.width - 150 && mouseX <= canvas.width - 30 && mouseY >= 25 && mouseY <= 70);
        }

        // HOMEボタン描画
        ctx.save();
        const btnX = canvas.width - 145;
        const btnY = 25;
        const btnW = 120;
        const btnH = 40;
        const notch = 12;
        const btnColor = isHoverHome ? "#00f0ff" : "rgba(0, 240, 255, 0.6)";
        
        ctx.fillStyle = "rgba(10, 15, 26, 0.85)";
        ctx.shadowBlur = isHoverHome ? 18 : 5;
        ctx.shadowColor = btnColor;
        ctx.beginPath();
        ctx.moveTo(btnX + notch, btnY); ctx.lineTo(btnX + btnW, btnY);
        ctx.lineTo(btnX + btnW, btnY + btnH - notch); ctx.lineTo(btnX + btnW - notch, btnY + btnH);
        ctx.lineTo(btnX, btnY + btnH); ctx.lineTo(btnX, btnY + notch);
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = btnColor; ctx.lineWidth = isHoverHome ? 2.5 : 1.5; ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(btnX, btnY + notch + 10); ctx.lineTo(btnX, btnY + notch);
        ctx.lineTo(btnX + notch, btnY + notch); ctx.lineTo(btnX + notch + 10, btnY + notch); ctx.stroke();

        ctx.fillStyle = isHoverHome ? "#ffffff" : btnColor;
        ctx.font = "bold 16px 'Share Tech Mono', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        if (isHoverHome) { ctx.shadowColor = "#00f0ff"; ctx.shadowBlur = 8; }
        ctx.fillText("▶ HOME", btnX + btnW / 2, btnY + btnH / 2 + 1);
        ctx.restore();

        requestAnimationFrame(loop);
        return;
    }

    // ---------------------------------------------------
    // ゲームプレイ画面の更新処理 (ポーズ時・終了時はスキップ)
    // ---------------------------------------------------
    let boxY = fever ? 380 : 530; 

    const boxes = baseBoxes.map(b => ({
        x: b.x, y: boxY, w: 76, h: 46, type: b.type, img: b.img, color: b.color
    }));

    const bombZone = getBombZone();

    // 更新処理はポーズ中、およびゲームオーバー時は停止する
    if (!paused && !gameOver) {
        if (combo >= 3 && !fever) {
            fever = true;
            feverTimer = difficulty === DIFFICULTY.hard ? 7 : 5;
            se.fiver.currentTime = 0;
            se.fiver.play().catch(() => {});
        }

        if (fever && Math.random() < 0.2) {
            const isSuper = Math.random() < 0.08;
            trashes.push({
                x: canvas.width + 20,
                y: 150 + Math.random() * 200,
                w: isSuper ? 60 : 35,
                h: isSuper ? 60 : 35,
                speed: 0,
                vx: -3,
                type: isSuper ? "superBomb" : "bomb",
                img: isSuper ? images.superBomb : images.bomb
            });
        }

        let maxNow = fever ? difficulty.max * 2 : difficulty.max;
        while (trashes.length < maxNow) trashes.push(createTrash());

        for (let t of trashes) {
            if (t.vx) t.x += t.vx;
            if (t !== selectedTrash) t.y += t.speed;

            if (t.y > canvas.height + 20 && !t.hit) {
                t.hit = true;

                if (t.type === "bomb" || t.type === "superBomb") {
                    damageEffect = Math.max(damageEffect, 3); 
                    score = Math.max(MIN_SCORE, score - 100);
                } else {
                    for (let o of trashes) {
                        let dx = o.x - t.x;
                        let dy = o.y - t.y;
                        if (Math.sqrt(dx*dx + dy*dy) < 80) {
                            Object.assign(o, createTrash());
                        }
                    }
                    pollution = Math.min(200, pollution + (t.type === "bag" ? 25 : 10));
                    score = Math.max(MIN_SCORE, score - 100);
                    combo = 0;
                    damageEffect = Math.max(damageEffect, 5);
                }

                Object.assign(t, createTrash());
                delete t.vx;
            }
        }

        // 判定処理ループ
        trashLoop: for (let t of trashes) {
            if (t.hit) continue;

            if (
                (t.type === "bomb" || t.type === "superBomb") &&
                t.x > bombZone.x - bombZone.w / 2 &&
                t.x < bombZone.x + bombZone.w / 2 &&
                t.y > bombZone.y - bombZone.h / 2 &&
                t.y < bombZone.y + bombZone.h / 2
            ) {
                trashes = trashes.filter(x => x !== t);
                continue trashLoop;
            }

            for (let b of boxes) {
                let range = fever ? 60 : 10;

                if (
                    t.x - t.w/2 < b.x + b.w/2 + range &&
                    t.x + t.w/2 > b.x - b.w/2 - range &&
                    t.y - t.h/2 < b.y + b.h/2 + range &&
                    t.y + t.h/2 > b.y - b.h/2 - range
                ) {
                    t.hit = true;

                    if (t.type === "bomb" || t.type === "superBomb") {
                        if (!fever) {
                            se.bomb.currentTime = 0;
                            se.bomb.play().catch(() => {});

                            score = Math.max(MIN_SCORE, score - 15 ** 5);
                            pollution = Math.min(200, pollution + 15); 
                            damageEffect = 10; 
                            combo = 0;
                        }
                        Object.assign(t, createTrash());
                        delete t.vx;
                        continue trashLoop; 
                    }

                    if (t.type === b.type) {
                        se.ok.currentTime = 0;
                        se.ok.play().catch(() => {});

                        combo++;
                        score = Math.min(MAX_SCORE, score + (fever ? 100 : 10));
                        if (t.type === "recycle") {
                            se.kaihuku.currentTime = 0;
                            se.kaihuku.play().catch(() => {});

                            pollution = Math.max(0, pollution - 30);
                            score = Math.min(MAX_SCORE, score + (fever ? 150 : 20));
                        }
                    } else {
                        if (!fever) {
                            se.damage.currentTime = 0;
                            se.damage.play().catch(() => {});

                            pollution = Math.min(200, pollution + 10); 
                            damageEffect = Math.max(damageEffect, 1); 
                            score = Math.max(MIN_SCORE, score - 50);
                        }
                        combo = 0;
                    }
                    Object.assign(t, createTrash());
                    delete t.vx;
                    continue trashLoop; 
                }
            }
        }
    }

    // ---------------------------------------------------
    // オブジェクトのサイバー描画 
    // ---------------------------------------------------
    for (let t of trashes) {
        ctx.save();
        ctx.globalAlpha = 1.0;

        if (t.type === "superBomb") {
            ctx.strokeStyle = "#00ffc8a3";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.w, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.w * 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = t.h + "px Arial";
        ctx.drawImage(t.img, t.x - t.w / 2, t.y - t.h / 2, t.w, t.h);

        if (t.type === "bag") {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(t.x - 20, t.y - t.h/2 - 20, 40, 16);
            ctx.fillStyle = "#ff0055";
            ctx.font = "bold 12px 'Share Tech Mono', sans-serif";
            ctx.fillText("HP:" + t.hp, t.x, t.y - t.h/2 - 12);
        }
        ctx.restore();
    }

    for (let b of boxes) {
        ctx.save();
        let gateColor = fever ? "#ff5500" : b.color;
        
        ctx.fillStyle = "rgba(10, 15, 26, 0.8)";
        ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
        
        ctx.strokeStyle = gateColor;
        ctx.lineWidth = fever ? 4 : 2;
        ctx.shadowColor = gateColor;
        ctx.shadowBlur = fever ? 15 : 8; 
        ctx.strokeRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
        
        ctx.drawImage(b.img, b.x - 16, b.y - 16, 32, 32);
        ctx.restore();
    }

    if (!fever) {
        ctx.save();
        ctx.fillStyle = "rgba(20, 20, 25, 0.9)";
        ctx.fillRect(bombZone.x - bombZone.w/2, bombZone.y - bombZone.h/2, bombZone.w, bombZone.h);
        
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 2;
        ctx.strokeRect(bombZone.x - bombZone.w/2, bombZone.y - bombZone.h/2, bombZone.w, bombZone.h);
        
        ctx.strokeStyle = "rgba(255, 204, 0, 0.25)";
        ctx.lineWidth = 4;
        for (let k = -20; k < bombZone.h; k += 15) {
            ctx.beginPath();
            ctx.moveTo(bombZone.x - bombZone.w/2, bombZone.y - bombZone.h/2 + k);
            ctx.lineTo(bombZone.x + bombZone.w/2, bombZone.y - bombZone.h/2 + k + 20);
            ctx.stroke();
        }

        ctx.drawImage(images.bomb, bombZone.x - 20, bombZone.y - 30, 40, 40);
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 12px 'Share Tech Mono', sans-serif";
        ctx.fillText("HAZARD", bombZone.x, bombZone.y + 35);
        ctx.restore();
    }

    if (fever) {
        ctx.save();
        ctx.fillStyle = "#ff3300";
        ctx.font = "bold 32px 'Share Tech Mono', sans-serif";
        if (Math.floor(Date.now() / 250) % 2 === 0) {
            ctx.fillText("!! OVERLOAD FEVER !!", canvas.width / 2, 100);
        }
        ctx.restore();
    }

    if (damageEffect > 0) {
        ctx.fillStyle = "rgba(255, 0, 85, " + (damageEffect / 10) * 0.3 + ")";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        canvas.style.transform = "translate(" + (Math.random()*6-3) + "px," + (Math.random()*6-3) + "px)";
        damageEffect--;
    } else if (pollution >= 180) {
        canvas.style.transform = "translate(" + (Math.random()*2-1) + "px," + (Math.random()*2-1) + "px)";
    } else {
        canvas.style.transform = "translate(0,0)";
    }

    // ---------------------------------------------------
    // HUD & 環境汚染ゲージ
    // ---------------------------------------------------
    ctx.save();
    ctx.font = "bold 20px 'Share Tech Mono', sans-serif";
    
    ctx.textAlign = "left";
    ctx.fillStyle = "#00f0ff";
    const scoreStr = score < 0
        ? "-" + String(Math.abs(score)).padStart(8, "0")
        : String(score).padStart(8, "0");

    ctx.fillText("SCORE: " + scoreStr, 20, 30);
    
    ctx.fillStyle = combo > 0 ? "#00ff66" : "#445566";
    ctx.fillText("COMBO: " + String(combo).padStart(3, '0'), 20, 60);
    
    ctx.textAlign = "right";
    ctx.fillStyle = timeLeft <= 5 ? "#ff0055" : "#00f0ff";
    ctx.fillText("SEC_LEFT: " + String(timeLeft).padStart(2, '0'), canvas.width - 20, 30);

    let gaugeW = 140; 
    let gaugeH = 12;  
    let gaugeX = canvas.width / 2 - gaugeW / 2;
    let gaugeY = 25;  
    
    let pColor = "#00ff66";
    let statusText = "ENVIRONMENT HAZARD LEVEL";
    if (pollution >= 180) {
        pColor = "#ff0055";
        statusText = "!! MELTDOWN CRITICAL !!";
    } else if (pollution >= 150) {
        pColor = "#ffcc00";
        statusText = "WARNING: SCORE DRAINING";
    }

    ctx.textAlign = "center";
    ctx.font = "bold 10px 'Share Tech Mono', sans-serif";
    ctx.fillStyle = pColor;
    
    if (pollution < 180 || Math.floor(Date.now() / 200) % 2 === 0) {
        ctx.fillText(statusText, canvas.width / 2, gaugeY - 8);
    }

    ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(gaugeX - 2, gaugeY - 2, gaugeW + 4, gaugeH + 4);

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH);

    let MAX_POLLUTION = 200;
    let currentFillW = (pollution / MAX_POLLUTION) * gaugeW;
    if (currentFillW > 0) {
        ctx.fillStyle = pColor;
        ctx.fillRect(gaugeX, gaugeY, currentFillW, gaugeH);
    }
    ctx.restore();

    // 走査線
    ctx.fillStyle = "rgba(0, 240, 255, 0.07)";
    ctx.fillRect(0, scanLineY, canvas.width, 2);
    scanLineY = (scanLineY + 1.5) % canvas.height;

    score = Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));

    for (let t of trashes) {
        t.hit = false;
    }

    // ゲームオーバー画面のオーバーレイ描画
    if (gameOver) {
        damageEffect--;
        canvas.style.transform = "translate(0,0)";

        if (buzzerPlaying) {
            se.buzar.pause();
            se.buzar.currentTime = 0;
            buzzerPlaying = false;
        }

        ctx.save();
        ctx.fillStyle = "rgba(10, 15, 26, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";
        ctx.fillStyle = "#ff0055";
        ctx.font = "bold 40px 'Share Tech Mono', sans-serif";
        ctx.shadowColor = "#ff0055";
        ctx.shadowBlur = 15;
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 30);

        ctx.fillStyle = "#ffffff";
        ctx.font = "20px 'Share Tech Mono', sans-serif";
        ctx.shadowBlur = 0;
        ctx.fillText("FINAL SCORE: " + scoreStr, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.fillStyle = "rgba(0, 240, 255, 0.8)";
        ctx.font = "14px 'Share Tech Mono', sans-serif";
        ctx.fillText("PRESS [ENTER] TO RETURN SELECT SECTOR", canvas.width / 2, canvas.height / 2 + 70);
        ctx.restore();
    }

    // スペースキーポーズ（中断）画面の描画
    if (paused && !gameOver) {
        ctx.save();
        ctx.fillStyle = "rgba(10, 15, 26, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 160, canvas.height / 2 - 90, 320, 180);
        ctx.fillStyle = "rgba(0, 240, 255, 0.05)";
        ctx.fillRect(canvas.width / 2 - 160, canvas.height / 2 - 90, 320, 180);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        ctx.fillStyle = "#00f0ff";
        ctx.font = "bold 24px 'Share Tech Mono', sans-serif";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 10;
        ctx.fillText("|| SYSTEM PAUSED", canvas.width / 2, canvas.height / 2 - 60);
        
        ctx.shadowBlur = 0;

        ctx.font = "14px 'Share Tech Mono', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("RETURN TO SECTOR SELECT?", canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = "bold 16px 'Share Tech Mono', sans-serif";
        if (pauseSelectIndex === 0) {
            ctx.fillStyle = "#ff0055";
            ctx.fillText("> YES <", canvas.width / 2 - 60, canvas.height / 2 + 15);
        } else {
            ctx.fillStyle = "#556677";
            ctx.fillText("  YES  ", canvas.width / 2 - 60, canvas.height / 2 + 15);
        }

        if (pauseSelectIndex === 1) {
            ctx.fillStyle = "#00ffaa";
            ctx.fillText("> NO <", canvas.width / 2 + 60, canvas.height / 2 + 15);
        } else {
            ctx.fillStyle = "#556677";
            ctx.fillText("  NO  ", canvas.width / 2 + 60, canvas.height / 2 + 15);
        }

        ctx.font = "11px 'Share Tech Mono', sans-serif";
        ctx.fillStyle = "#00f0ff";
        ctx.fillText("[A/D] or [←/→]: SELECT   [ENTER]: CONFIRM", canvas.width / 2, canvas.height / 2 + 55);
        
        ctx.font = "9px 'Share Tech Mono', sans-serif";
        ctx.fillStyle = "#8899aa";
        ctx.fillText("(OR PRESS [SPACE] TO RESUME)", canvas.width / 2, canvas.height / 2 + 75);

        ctx.restore();
    }

    if (isFirstSpawnFade && spawnFadeTimer > 0) {
        ctx.save();
        let alpha = spawnFadeTimer / 15; 
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        spawnFadeTimer--;
        if (spawnFadeTimer <= 0) isFirstSpawnFade = false;
    }

    requestAnimationFrame(loop);
}

loop();

// =====================
// イベントリスナー関係
canvas.addEventListener("mousedown", (e) => {

    // HOMEボタン
    if (
        !difficulty &&
        e.offsetX >= canvas.width - 150 &&
        e.offsetX <= canvas.width - 30 &&
        e.offsetY >= 25 &&
        e.offsetY <= 65
    ) {
        se.select.currentTime = 0;
        se.select.play().catch(() => {});

        setTimeout(() => {
            window.location.href = "/game";
        }, 1500);

        return;
    }

    // ポーズ中またはゲームオーバー時は操作不可
    if (paused || gameOver) {
        return;
    }

    // =================================
    // SELECT SECTOR
    // =================================
    if (!difficulty) {

        // EASY
        if (
            e.offsetX >= CARD_X &&
            e.offsetX <= CARD_X + CARD_W &&
            e.offsetY >= EASY_Y &&
            e.offsetY <= EASY_Y + CARD_H
        ) {
            se.select.currentTime = 0;
            se.select.play().catch(() => {});

            selectedDifficultyNext = "easy";
            transitionTimer = 1;
        }

        // NORMAL
        else if (
            e.offsetX >= CARD_X &&
            e.offsetX <= CARD_X + CARD_W &&
            e.offsetY >= NORMAL_Y &&
            e.offsetY <= NORMAL_Y + CARD_H
        ) {
            se.select.currentTime = 0;
            se.select.play().catch(() => {});

            selectedDifficultyNext = "normal";
            transitionTimer = 1;
        }

        // HARD
        else if (
            e.offsetX >= CARD_X &&
            e.offsetX <= CARD_X + CARD_W &&
            e.offsetY >= HARD_Y &&
            e.offsetY <= HARD_Y + CARD_H
        ) {
            se.select.currentTime = 0;
            se.select.play().catch(() => {});

            selectedDifficultyNext = "hard";
            transitionTimer = 1;
        }

        return;
    }

    // =================================
    // ゲームプレイ中
    // =================================
    for (let t of trashes) {

        if (
            Math.abs(e.offsetX - t.x) < t.w / 2 &&
            Math.abs(e.offsetY - t.y) < t.h / 2
        ) {

            // -------------------------
            // BAG
            // -------------------------
            if (t.type === "bag") {

                t.hp--;

                if (t.hp <= 0) {
                    trashes = trashes.filter(x => x !== t);
                    score = Math.min(MAX_SCORE, score + 100);
                }

                return;
            }

            // -------------------------
            // SUPER BOMB (FEVER)
            // -------------------------
            if (t.type === "superBomb" && fever) {

                se.bigbomb.currentTime = 0;
                se.bigbomb.play().catch(() => {});

                let explodedCount = 0;

                for (let o of trashes) {

                    if (o === t) continue;

                    explodedCount++;

                    if (o.type === "bag") {
                        trashes = trashes.filter(x => x !== o);
                        continue;
                    }

                    Object.assign(o, createTrash());
                    delete o.vx;
                }

                score = Math.min(
                    MAX_SCORE,
                    score + explodedCount * 77777
                );

                trashes = trashes.filter(x => x !== t);

                return;
            }

            // -------------------------
            // BOMB (FEVER)
            // -------------------------
            if (t.type === "bomb" && fever) {

                se.bomb.currentTime = 0;
                se.bomb.play().catch(() => {});

                let explodedCount = 0;

                for (let o of trashes) {

                    let dx = o.x - t.x;
                    let dy = o.y - t.y;

                    if (Math.sqrt(dx * dx + dy * dy) < 150) {

                        explodedCount++;

                        if (o.type === "bag") {
                            trashes = trashes.filter(x => x !== o);
                            continue;
                        }

                        Object.assign(o, createTrash());
                        delete o.vx;
                    }
                }

                if (explodedCount > 0) {
                    score = Math.min(
                        MAX_SCORE,
                        score + explodedCount * 7777
                    );
                }

                trashes = trashes.filter(x => x !== t);

                return;
            }

            selectedTrash = t;
            break;
        }
    }
});

canvas.addEventListener("mouseup", () => selectedTrash = null);

canvas.addEventListener("mousemove", (e) => {

    mouseX = e.offsetX;
    mouseY = e.offsetY;

    // -------------------------
    // ゴミドラッグ中
    // -------------------------
    if (selectedTrash && !paused && !gameOver) {
        selectedTrash.x = e.offsetX;
        selectedTrash.y = e.offsetY;
    }

    // -------------------------
    // SELECT SECTOR ホバー判定
    // -------------------------
    if (!difficulty) {

        let currentHover = null;

        // 横方向判定
        if (
            e.offsetX >= CARD_X &&
            e.offsetX <= CARD_X + CARD_W
        ) {

            // EASY
            if (
                e.offsetY >= EASY_Y &&
                e.offsetY <= EASY_Y + CARD_H
            ) {
                currentHover = 0;
            }

            // NORMAL
            else if (
                e.offsetY >= NORMAL_Y &&
                e.offsetY <= NORMAL_Y + CARD_H
            ) {
                currentHover = 1;
            }

            // HARD
            else if (
                e.offsetY >= HARD_Y &&
                e.offsetY <= HARD_Y + CARD_H
            ) {
                currentHover = 2;
            }
        }

        // ホバー対象が変わった瞬間だけSE
        if (currentHover !== hoveredSector) {

            if (currentHover !== null) {
                se.mausu.currentTime = 0;
                se.mausu.play().catch(() => {});
            }

            hoveredSector = currentHover;
        }
    }
});

// キーボード入力を監視するイベントリスナー内の処理
document.addEventListener("keydown", e => {
    // ゲームオーバー時にEnterキーで難易度選択（セクター選択）へ完全に戻る
    if (gameOver && e.key === "Enter") {

        difficulty = null;
        gameOver = false;
        trashes = [];        // ゾンビのように残るゴミデータを完全に消去
        selectedTrash = null;// ドラッグ状態も強制解除
        se.select.currentTime = 0;
        se.select.play().catch(() => {});

        bgm.game.pause();
        bgm.game.currentTime = 0;
        bgm.title.play().catch(() => {});
    }

    // 最優先でスペースキーの判定を行い、押されたらここで処理を終了(return)させる
    if (e.code === "Space" && difficulty && !gameOver) {
        paused = !paused;

        if (buzzerPlaying) {
            se.buzar.pause();
            se.buzar.currentTime = 0;
            buzzerPlaying = false;
        }
        
        se.select.currentTime = 0;
        se.select.play().catch(() => {});

        if (paused) {
            pauseSelectIndex = 1; // ポーズを開いたときは必ず「NO」にカーソルを合わせる
        }
        return; // 💡 スペースキーを処理したら、このイベントのこれ以降の処理は一切実行しない！
    }

    // ポーズ中の操作（スペースキー以外が押されたときだけここに来る）
    if (paused && difficulty && !gameOver) {
        // 左右キー（またはA/Dキー）で YES と NO を切り替え
        if (e.key === "ArrowLeft" || e.code === "KeyA") {
            se.mausu.currentTime = 0;
            se.mausu.play().catch(() => {});

            pauseSelectIndex = 0; // YES (戻る)
        }
        if (e.key === "ArrowRight" || e.code === "KeyD") {
            se.mausu.currentTime = 0;
            se.mausu.play().catch(() => {});

            pauseSelectIndex = 1; // NO (再開)
        }

        // Enterキーで決定
        if (e.key === "Enter") {
            if (pauseSelectIndex === 0) {
                // 💡 【YES】が選ばれたら、安全にセクター選択画面へ戻す処理
                difficulty = null; 
                gameOver = false;
                paused = false;
                trashes = [];        // ゾンビのように残るゴミデータを完全に消去
                selectedTrash = null;// ドラッグ状態も強制解除
           
                se.select.currentTime = 0;
                se.select.play().catch(() => {});

                bgm.game.pause();
                bgm.game.currentTime = 0;
                bgm.title.play().catch(() => {});
            } else {
                // 【NO】が選ばれたら、ポーズを解除してゲーム再開
                
                se.select.currentTime = 0;
                se.select.play().catch(() => {});

                paused = false;
            }
        }
    }
});