import { HAZARD_TYPES, LEVELS } from '../data/hazards.js';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data) {
    this.level    = data.level;
    this.score    = data.score;
    this.fixed    = data.fixed;
    this.missed   = data.missed ?? [];
    this.health   = data.health ?? 0;
    this.gameOver = data.gameOver;
  }

  create() {
    const { width, height } = this.scale;
    const isLast = this.level >= LEVELS.length;

    this.add.rectangle(width / 2, height / 2, width, height, 0x120D06);
    this.drawBgGrid();

    const panelH = 380 + (this.missed.length > 0 ? 60 : 0);
    const panelY = height / 2 - panelH / 2;

    const border = this.gameOver ? 0xCC2200 : isLast ? 0xDEB887 : 0x4A8035;
    const bg = this.add.graphics();
    bg.fillStyle(0x2C1F0E, 0.96);
    bg.fillRoundedRect(width / 2 - 280, panelY, 560, panelH, 12);
    bg.lineStyle(2, border, 1);
    bg.strokeRoundedRect(width / 2 - 280, panelY, 560, panelH, 12);

    let y = panelY + 32;

    let header = 'LEVEL COMPLETE';
    let headerColor = '#4A8035';
    if (this.gameOver)  { header = 'SITE CONTAMINATED';  headerColor = '#CC2200'; }
    if (!this.gameOver && isLast) { header = 'MISSION ACCOMPLISHED'; headerColor = '#DEB887'; }

    this.add.text(width / 2, y, header, {
      fontSize: '28px', color: headerColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    y += 34;

    const sub = this.gameOver
      ? 'Environmental damage threshold exceeded.'
      : isLast
        ? 'You have completed all levels — Master Eco Officer!'
        : `Level ${this.level} cleared. Keep the site clean!`;

    this.add.text(width / 2, y, sub, {
      fontSize: '12px', color: '#A0896B', fontFamily: 'monospace',
    }).setOrigin(0.5);
    y += 40;

    const stats = [
      { label: 'Score',            value: String(this.score),        color: '#DEB887' },
      { label: 'Hazards Fixed',    value: String(this.fixed),        color: '#6B8E23' },
      { label: 'Hazards Missed',   value: String(this.missed.length), color: this.missed.length > 0 ? '#CC6600' : '#6B8E23' },
      { label: 'Site Health',      value: `${Math.max(0, this.health)}%`, color: '#C4A882' },
    ];

    stats.forEach(stat => {
      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x1A1208, 0.5);
      rowBg.fillRoundedRect(width / 2 - 210, y - 4, 420, 28, 4);

      this.add.text(width / 2 - 194, y + 5, stat.label, {
        fontSize: '12px', color: '#8B7355', fontFamily: 'monospace',
      });
      this.add.text(width / 2 + 194, y + 5, stat.value, {
        fontSize: '14px', color: stat.color, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(1, 0);
      y += 36;
    });

    if (this.missed.length > 0) {
      y += 10;
      this.add.text(width / 2, y, 'ENVIRONMENTAL IMPACT (MISSED):', {
        fontSize: '10px', color: '#7A6840', fontFamily: 'monospace',
      }).setOrigin(0.5);
      y += 18;

      const unique = [...new Set(this.missed)].slice(0, 2);
      unique.forEach(type => {
        const d = HAZARD_TYPES[type];
        if (!d) return;
        const snippet = d.fact.length > 80 ? d.fact.substring(0, 80) + '…' : d.fact;
        this.add.text(width / 2, y, `${d.label}: ${snippet}`, {
          fontSize: '10px', color: '#A07850', fontFamily: 'monospace',
          wordWrap: { width: 480 }, align: 'center',
        }).setOrigin(0.5);
        y += 30;
      });
    }

    y = Math.max(y, panelY + panelH - 70);

    const hasNext = !this.gameOver && !isLast;

    if (hasNext) {
      this.addButton(width / 2 - 118, y + 26, 'NEXT LEVEL', 200, 42, 0x2D5020, 0x4A8035, () => {
        this.scene.start('GameScene', { level: this.level + 1, score: this.score });
      });
    }

    const rightLabel = this.gameOver ? 'TRY AGAIN' : isLast ? 'PLAY AGAIN' : 'MAIN MENU';
    const rightCb = (this.gameOver || isLast)
      ? () => this.scene.start('GameScene', { level: 1, score: 0 })
      : () => this.scene.start('MenuScene');

    this.addButton(hasNext ? width / 2 + 118 : width / 2, y + 26, rightLabel, 200, 42, 0x4A2010, 0x7A3518, rightCb);
  }

  addButton(x, y, label, w, h, colorOff, colorOn, cb) {
    const g = this.add.graphics();
    const draw = (c) => {
      g.clear();
      g.fillStyle(c, 1);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      g.lineStyle(2, colorOn, 1);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    };
    draw(colorOff);
    this.add.text(x, y, label, {
      fontSize: '14px', color: '#DEB887', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);

    g.setInteractive(
      new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );
    g.on('pointerover',  () => draw(colorOn));
    g.on('pointerout',   () => draw(colorOff));
    g.on('pointerdown',  cb);
  }

  drawBgGrid() {
    const g = this.add.graphics().setAlpha(0.1);
    const TW = 64, TH = 32, OX = 400, OY = 300;
    const colors = [0x8B7355, 0x6B5840];
    for (let row = -2; row < 10; row++) {
      for (let col = -2; col < 14; col++) {
        const sx = OX + (col - row) * (TW / 2);
        const sy = OY + (col + row) * (TH / 2);
        g.fillStyle(colors[(col + row) % 2], 1);
        g.fillPoints([
          { x: sx,          y: sy - TH / 2 },
          { x: sx + TW / 2, y: sy },
          { x: sx,          y: sy + TH / 2 },
          { x: sx - TW / 2, y: sy },
        ], true);
      }
    }
  }
}
