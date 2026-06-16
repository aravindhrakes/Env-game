export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x120D06);

    this.drawBgGrid();

    // Title panel
    this.drawPanel(width / 2, 130, 540, 130);
    this.add.text(width / 2, 86, 'ECOSITE GUARDIAN', {
      fontSize: '34px',
      color: '#DEB887',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 128, 'Construction Environmental Awareness Training', {
      fontSize: '13px',
      color: '#A0896B',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(width / 2, 158, 'You are the Eco Officer. Protect the site from environmental damage.', {
      fontSize: '11px',
      color: '#7A6840',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // How to play
    this.drawPanel(width / 2, 305, 540, 150);
    this.add.text(width / 2, 222, 'HOW TO PLAY', {
      fontSize: '13px',
      color: '#8B7355',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const instructions = [
      '  Environmental hazards appear across the isometric construction site',
      '  CLICK hazards to fix them before they escalate',
      '  Hazards turn ORANGE then RED as urgency increases',
      '  Each missed hazard drains site health — don\'t let it hit zero',
      '  Learn a real environmental fact with every fix',
    ];

    instructions.forEach((line, i) => {
      this.add.text(width / 2, 248 + i * 22, line, {
        fontSize: '11px',
        color: '#C4A882',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    // Legend
    this.drawLegend(width / 2, 408);

    // Start button
    this.addButton(width / 2, 488, 'START MISSION', 220, 44, 0x2D5020, 0x4A8035, () => {
      this.scene.start('GameScene', { level: 1, score: 0 });
    });

    this.add.text(width / 2, 560, 'Environmental Compliance | Construction Site Safety', {
      fontSize: '10px',
      color: '#4A3820',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  drawBgGrid() {
    const g = this.add.graphics().setAlpha(0.14);
    const TW = 64, TH = 32;
    const OX = 400, OY = 300;
    const palette = [0x8B7355, 0x7A6B4F, 0x6B5840, 0x9A8A72, 0x5C7A5C];

    for (let row = -3; row < 10; row++) {
      for (let col = -2; col < 14; col++) {
        const sx = OX + (col - row) * (TW / 2);
        const sy = OY + (col + row) * (TH / 2);
        const color = palette[(col + row * 3 + 5) % palette.length];
        g.fillStyle(color, 1);
        g.fillPoints([
          { x: sx,          y: sy - TH / 2 },
          { x: sx + TW / 2, y: sy },
          { x: sx,          y: sy + TH / 2 },
          { x: sx - TW / 2, y: sy },
        ], true);
      }
    }
  }

  drawPanel(cx, cy, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x2C1F0E, 0.88);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
    g.lineStyle(1, 0x6B5030, 0.7);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
  }

  drawLegend(cx, cy) {
    this.drawPanel(cx, cy, 540, 60);
    const items = [
      { color: 0xDEB887, label: 'New hazard' },
      { color: 0xCC7700, label: 'Escalating' },
      { color: 0xCC2200, label: 'Critical!' },
      { color: 0x4A8035, label: 'Fixed' },
    ];
    const startX = cx - 220;
    items.forEach((item, i) => {
      const x = startX + i * 116;
      const g = this.add.graphics();
      g.fillStyle(item.color, 1);
      g.fillCircle(x, cy, 7);
      this.add.text(x + 14, cy, item.label, {
        fontSize: '10px',
        color: '#C4A882',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5);
    });
  }

  addButton(x, y, label, w, h, colorOff, colorOn, callback) {
    const g = this.add.graphics();
    const draw = (color) => {
      g.clear();
      g.fillStyle(color, 1);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      g.lineStyle(2, colorOn, 1);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    };

    draw(colorOff);
    this.add.text(x, y, label, {
      fontSize: '16px',
      color: '#DEB887',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);

    g.setInteractive(
      new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );
    g.on('pointerover',  () => draw(colorOn));
    g.on('pointerout',   () => draw(colorOff));
    g.on('pointerdown',  callback);
  }
}
