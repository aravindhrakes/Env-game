import { SiteMap, ZONES } from '../objects/SiteMap.js';
import { Hazard } from '../objects/Hazard.js';
import { HAZARD_TYPES, LEVELS } from '../data/hazards.js';

const PALETTE = {
  bg:         0x120D06,
  panelDark:  0x2C1F0E,
  panelBorder:0x6B5030,
  textMain:   '#DEB887',
  textSub:    '#A0896B',
  textDim:    '#7A6840',
  healthGood: 0x4A8035,
  healthMid:  0xCC8800,
  healthLow:  0xCC2200,
  scoreGreen: '#6B8E23',
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.currentLevel = data.level ?? 1;
    this.levelData    = LEVELS[this.currentLevel - 1];
    this.score        = data.score ?? 0;
    this.health       = 100;
    this.activeHazards  = [];
    this.fixedHazards   = [];
    this.missedTypes    = [];
    this.gameOver       = false;
    this.levelComplete  = false;
    this.factVisible    = false;
    this.levelTimerMs   = this.levelData.duration;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, PALETTE.bg);
    this.drawSkyGradient();

    this.siteMap = new SiteMap(this, width / 2, 210);

    this.buildHUD();

    this.events.on('hazardFixed',   this.onHazardFixed,   this);
    this.events.on('hazardExpired', this.onHazardExpired, this);

    this.showLevelIntro(() => {
      this.startSpawning();
      this.startLevelTimer();
    });
  }

  buildHUD() {
    const { width } = this.scale;
    const D = 100;

    const hudBg = this.add.graphics().setDepth(D);
    hudBg.fillStyle(0x1A1208, 0.93);
    hudBg.fillRect(0, 0, width, 54);
    hudBg.lineStyle(1, PALETTE.panelBorder, 0.6);
    hudBg.lineBetween(0, 54, width, 54);

    this.add.text(14, 8, 'SITE HEALTH', { fontSize: '9px', color: '#7A6840', fontFamily: 'monospace' }).setDepth(D + 1);
    const barBg = this.add.graphics().setDepth(D + 1);
    barBg.fillStyle(0x3A2818, 1);
    barBg.fillRoundedRect(14, 22, 190, 16, 4);

    this.healthBar = this.add.graphics().setDepth(D + 2);
    this.healthPct = this.add.text(210, 24, '100%', { fontSize: '11px', color: PALETTE.textMain, fontFamily: 'monospace', fontStyle: 'bold' }).setDepth(D + 2);
    this.redrawHealthBar(100);

    this.add.text(width / 2 - 80, 8, 'SCORE', { fontSize: '9px', color: '#7A6840', fontFamily: 'monospace' }).setDepth(D + 1);
    this.scoreTxt = this.add.text(width / 2 - 80, 22, '0', { fontSize: '20px', color: PALETTE.textMain, fontFamily: 'monospace', fontStyle: 'bold' }).setDepth(D + 2);

    this.add.text(width / 2 + 10, 8, `LEVEL ${this.levelData.level}`, { fontSize: '9px', color: '#7A6840', fontFamily: 'monospace' }).setDepth(D + 1);
    this.add.text(width / 2 + 10, 22, this.levelData.name, { fontSize: '11px', color: '#C4A882', fontFamily: 'monospace' }).setDepth(D + 1);

    this.add.text(width - 70, 8, 'TIME', { fontSize: '9px', color: '#7A6840', fontFamily: 'monospace' }).setDepth(D + 1);
    this.timerTxt = this.add.text(width - 70, 20, '60', { fontSize: '22px', color: PALETTE.textMain, fontFamily: 'monospace', fontStyle: 'bold' }).setDepth(D + 2);
  }

  redrawHealthBar(health) {
    this.healthBar.clear();
    const w = Math.max(0, 190 * (health / 100));
    const color = health > 50 ? PALETTE.healthGood : health > 25 ? PALETTE.healthMid : PALETTE.healthLow;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRoundedRect(14, 22, w, 16, 4);
    this.healthPct.setText(`${Math.max(0, health)}%`);
    this.healthPct.setColor(health > 25 ? PALETTE.textMain : '#FF6030');
  }

  updateScoreDisplay() {
    this.scoreTxt.setText(String(this.score));
    this.tweens.add({ targets: this.scoreTxt, scaleX: 1.35, scaleY: 1.35, duration: 90, yoyo: true });
  }

  updateTimerDisplay(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    this.timerTxt.setText(String(s));
    this.timerTxt.setColor(s <= 10 ? '#CC2200' : s <= 20 ? '#CC8800' : PALETTE.textMain);
  }

  showLevelIntro(onDone) {
    const { width, height } = this.scale;
    const D = 200;
    const panel = [];

    const overlay = this.add.graphics().setDepth(D);
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, width, height);
    panel.push(overlay);

    const bg = this.add.graphics().setDepth(D + 1);
    bg.fillStyle(PALETTE.panelDark, 1);
    bg.fillRoundedRect(width / 2 - 230, height / 2 - 110, 460, 220, 12);
    bg.lineStyle(2, 0xDEB887, 1);
    bg.strokeRoundedRect(width / 2 - 230, height / 2 - 110, 460, 220, 12);
    panel.push(bg);

    const t1 = this.add.text(width / 2, height / 2 - 80, `LEVEL ${this.levelData.level}`, {
      fontSize: '28px', color: PALETTE.textMain, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(D + 2);
    panel.push(t1);

    const t2 = this.add.text(width / 2, height / 2 - 44, this.levelData.name, {
      fontSize: '16px', color: '#C4A882', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(D + 2);
    panel.push(t2);

    const t3 = this.add.text(width / 2, height / 2, this.levelData.description, {
      fontSize: '12px', color: PALETTE.textSub, fontFamily: 'monospace',
      align: 'center', wordWrap: { width: 400 },
    }).setOrigin(0.5).setDepth(D + 2);
    panel.push(t3);

    const t4 = this.add.text(width / 2, height / 2 + 75, '— Click to start —', {
      fontSize: '13px', color: PALETTE.scoreGreen, fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(D + 2);
    panel.push(t4);

    this.tweens.add({ targets: t4, alpha: { from: 1, to: 0.2 }, duration: 550, yoyo: true, repeat: -1 });

    this.input.once('pointerdown', () => {
      panel.forEach(el => el.destroy());
      onDone();
    });
  }

  startSpawning() {
    this.spawnHazard();
    this.spawnTimer = this.time.addEvent({
      delay: this.levelData.spawnInterval,
      callback: this.spawnHazard,
      callbackScope: this,
      loop: true,
    });
  }

  spawnHazard() {
    if (this.gameOver || this.levelComplete) return;
    if (this.activeHazards.length >= this.levelData.maxHazards) return;

    const types = this.levelData.hazardTypes;
    const type = Phaser.Utils.Array.GetRandom(types);
    const typeData = HAZARD_TYPES[type];

    const eligibleZones = typeData.zones.filter(z => ZONES[z]);
    const zoneName = Phaser.Utils.Array.GetRandom(eligibleZones);
    const positions = this.siteMap.getSpawnPositions(zoneName);

    const occupied = new Set(this.activeHazards.map(h => `${h.col},${h.row}`));
    const available = positions.filter(p => !occupied.has(`${p.col},${p.row}`));
    if (available.length === 0) return;

    const pos = Phaser.Utils.Array.GetRandom(available);
    const hazard = new Hazard(this, pos.col, pos.row, type, this.levelData, this.siteMap);
    this.activeHazards.push(hazard);
  }

  startLevelTimer() {
    this.updateTimerDisplay(this.levelTimerMs);
    this.levelClock = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.levelTimerMs -= 1000;
        this.updateTimerDisplay(this.levelTimerMs);
        if (this.levelTimerMs <= 0) this.endLevel();
      },
    });
  }

  onHazardFixed({ hazard, points }) {
    this.score += points;
    this.fixedHazards.push(hazard.type);
    this.activeHazards = this.activeHazards.filter(h => h !== hazard);
    this.updateScoreDisplay();
    this.showFactPopup(hazard.data, points);
  }

  onHazardExpired(hazard) {
    this.health = Math.max(0, this.health - this.levelData.healthDrop);
    this.missedTypes.push(hazard.type);
    this.activeHazards = this.activeHazards.filter(h => h !== hazard);
    this.redrawHealthBar(this.health);

    if (this.health <= 0) {
      this.health = 0;
      this.triggerGameOver();
    }
  }

  showFactPopup(typeData, points) {
    if (this.factVisible) return;
    this.factVisible = true;

    const { width, height } = this.scale;
    const D = 150;
    const elements = [];

    const overlay = this.add.graphics().setDepth(D);
    overlay.fillStyle(0x000000, 0.55);
    overlay.fillRect(0, 0, width, height);
    elements.push(overlay);

    const bg = this.add.graphics().setDepth(D + 1);
    bg.fillStyle(PALETTE.panelDark, 1);
    bg.fillRoundedRect(width / 2 - 230, height / 2 - 130, 460, 260, 12);
    bg.lineStyle(2, 0x4A8035, 1);
    bg.strokeRoundedRect(width / 2 - 230, height / 2 - 130, 460, 260, 12);
    elements.push(bg);

    const makeTxt = (txt, y, style) =>
      elements.push(this.add.text(width / 2, y, txt, style).setOrigin(0.5).setDepth(D + 2));

    makeTxt('✓  HAZARD FIXED', height / 2 - 105, {
      fontSize: '15px', color: PALETTE.scoreGreen, fontFamily: 'monospace', fontStyle: 'bold',
    });

    makeTxt(typeData.label, height / 2 - 76, {
      fontSize: '20px', color: PALETTE.textMain, fontFamily: 'monospace', fontStyle: 'bold',
    });

    const div = this.add.graphics().setDepth(D + 2);
    div.lineStyle(1, 0x6B5030, 0.6);
    div.lineBetween(width / 2 - 190, height / 2 - 54, width / 2 + 190, height / 2 - 54);
    elements.push(div);

    makeTxt('DID YOU KNOW?', height / 2 - 42, {
      fontSize: '10px', color: '#7A6840', fontFamily: 'monospace',
    });

    makeTxt(typeData.fact, height / 2 + 8, {
      fontSize: '12px', color: '#C4A882', fontFamily: 'monospace',
      wordWrap: { width: 400 }, align: 'center',
    });

    makeTxt(`+${points} points`, height / 2 + 82, {
      fontSize: '15px', color: PALETTE.scoreGreen, fontFamily: 'monospace', fontStyle: 'bold',
    });

    const cont = this.add.text(width / 2, height / 2 + 106, '[ Click to continue ]', {
      fontSize: '12px', color: '#A0896B', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(D + 2);
    elements.push(cont);

    this.tweens.add({ targets: cont, alpha: { from: 1, to: 0.3 }, duration: 480, yoyo: true, repeat: -1 });

    const dismiss = () => {
      elements.forEach(el => el.destroy());
      this.factVisible = false;
    };

    this.time.delayedCall(400, () => this.input.once('pointerdown', dismiss));
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.spawnTimer?.remove();
    this.levelClock?.remove();
    this.activeHazards.forEach(h => h.destroy());
    this.activeHazards = [];

    this.cameras.main.shake(400, 0.012);

    this.time.delayedCall(800, () => {
      this.scene.start('ResultScene', {
        level:    this.currentLevel,
        score:    this.score,
        fixed:    this.fixedHazards.length,
        missed:   this.missedTypes,
        health:   0,
        gameOver: true,
      });
    });
  }

  endLevel() {
    if (this.levelComplete || this.gameOver) return;
    this.levelComplete = true;
    this.spawnTimer?.remove();
    this.levelClock?.remove();

    this.time.delayedCall(1200, () => {
      this.activeHazards.forEach(h => h.destroy());
      this.activeHazards = [];
      this.scene.start('ResultScene', {
        level:    this.currentLevel,
        score:    this.score,
        fixed:    this.fixedHazards.length,
        missed:   this.missedTypes,
        health:   this.health,
        gameOver: false,
      });
    });
  }

  drawSkyGradient() {
    const g = this.add.graphics().setDepth(-1);
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.round(Phaser.Math.Linear(0x28, 0x12, t));
      const gr = Math.round(Phaser.Math.Linear(0x1E, 0x0D, t));
      const b = Math.round(Phaser.Math.Linear(0x0E, 0x06, t));
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, i * 10, 800, 10);
    }
  }
}
