import { HAZARD_TYPES } from '../data/hazards.js';

export class Hazard {
  constructor(scene, col, row, type, levelData, siteMap) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.type = type;
    this.levelData = levelData;
    this.severity = 0;
    this.fixed = false;
    this.data = HAZARD_TYPES[type];

    const pos = siteMap.getTileCenter(col, row);
    this.wx = pos.x;
    this.wy = pos.y - 18;

    this.gfx = scene.add.graphics().setDepth(20);
    this.label = scene.add.text(this.wx, this.wy - 22, this.data.label, {
      fontSize: '10px',
      color: '#F0E0C4',
      fontFamily: 'monospace',
      backgroundColor: '#2C1810CC',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setDepth(25);

    this.countdownText = scene.add.text(this.wx, this.wy + 22, '', {
      fontSize: '11px',
      color: '#FF8030',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(25);

    this.draw();
    this.startTimers();
    this.makeInteractive();
  }

  draw() {
    this.gfx.clear();
    const c = this.data.color;

    switch (this.type) {
      case 'spill':    this.drawSpill(c);    break;
      case 'dust':     this.drawDust(c);     break;
      case 'waste':    this.drawWaste(c);    break;
      case 'runoff':   this.drawRunoff(c);   break;
      case 'chemical': this.drawChemical(c); break;
      case 'erosion':  this.drawErosion(c);  break;
    }

    if (this.severity >= 1) {
      const pulse = this.severity === 1 ? 0xCC7700 : 0xCC2200;
      this.gfx.lineStyle(2, pulse, 0.9);
      this.gfx.strokeCircle(this.wx, this.wy, 24);
    }
    if (this.severity >= 2) {
      this.gfx.lineStyle(3, 0xFF2000, 0.8);
      this.gfx.strokeCircle(this.wx, this.wy, 29);
    }
  }

  drawSpill(c) {
    this.gfx.fillStyle(c, 0.92);
    this.gfx.fillEllipse(this.wx - 5, this.wy + 6, 32, 14);
    this.gfx.fillEllipse(this.wx + 7, this.wy, 22, 12);
    this.gfx.fillEllipse(this.wx - 2, this.wy - 2, 18, 12);
    this.gfx.fillStyle(0x4A2810, 0.45);
    this.gfx.fillEllipse(this.wx - 3, this.wy + 2, 10, 6);
  }

  drawDust(c) {
    this.gfx.fillStyle(c, 0.55);
    this.gfx.fillCircle(this.wx - 9, this.wy + 5, 12);
    this.gfx.fillCircle(this.wx + 7, this.wy + 3, 14);
    this.gfx.fillCircle(this.wx,     this.wy - 3, 10);
    this.gfx.fillStyle(c, 0.28);
    this.gfx.fillCircle(this.wx + 14, this.wy - 1, 8);
    this.gfx.fillCircle(this.wx - 14, this.wy - 1, 7);
  }

  drawWaste(c) {
    this.gfx.fillStyle(c, 1);
    this.gfx.fillRect(this.wx - 11, this.wy - 5, 9, 7);
    this.gfx.fillRect(this.wx + 2,  this.wy - 7, 11, 6);
    this.gfx.fillRect(this.wx - 7,  this.wy + 4, 15, 6);
    this.gfx.fillStyle(0x80A030, 0.65);
    this.gfx.fillRect(this.wx - 9,  this.wy - 4, 7, 3);
    this.gfx.fillRect(this.wx + 4,  this.wy + 5, 9, 3);
  }

  drawRunoff(c) {
    this.gfx.fillStyle(c, 0.72);
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 9;
      this.gfx.fillEllipse(this.wx + ox, this.wy + i * 5, 7, 18);
    }
    this.gfx.fillStyle(c, 0.5);
    this.gfx.fillEllipse(this.wx, this.wy + 12, 26, 9);
  }

  drawChemical(c) {
    this.gfx.fillStyle(0x3A2818, 1);
    this.gfx.fillEllipse(this.wx, this.wy, 18, 26);
    this.gfx.fillStyle(0x7A5A14, 1);
    this.gfx.fillRect(this.wx - 9, this.wy - 8, 18, 3);
    this.gfx.fillRect(this.wx - 9, this.wy,     18, 3);
    this.gfx.fillStyle(c, 0.85);
    this.gfx.fillEllipse(this.wx, this.wy - 12, 16, 8);
    this.gfx.fillStyle(c, 0.9);
    this.gfx.fillEllipse(this.wx + 9, this.wy + 9, 9, 7);
  }

  drawErosion(c) {
    this.gfx.fillStyle(c, 0.82);
    this.gfx.fillTriangle(
      this.wx - 15, this.wy + 9,
      this.wx,      this.wy - 8,
      this.wx + 15, this.wy + 9
    );
    this.gfx.fillStyle(this.data.color, 0.5);
    this.gfx.fillTriangle(
      this.wx - 10, this.wy + 11,
      this.wx + 3,  this.wy - 2,
      this.wx + 17, this.wy + 11
    );
    this.gfx.fillStyle(0xA07050, 0.9);
    for (let i = 0; i < 4; i++) {
      this.gfx.fillCircle(this.wx - 8 + i * 5, this.wy + 9 + (i % 2) * 4, 2);
    }
  }

  startTimers() {
    const t = this.data.baseTimeout;

    this.timer1 = this.scene.time.delayedCall(t * 0.4, () => {
      if (!this.fixed) {
        this.severity = 1;
        this.draw();
        this.scene.cameras.main.shake(80, 0.003);
      }
    });

    this.timer2 = this.scene.time.delayedCall(t * 0.72, () => {
      if (!this.fixed) {
        this.severity = 2;
        this.draw();
        this.scene.cameras.main.shake(120, 0.005);
      }
    });

    this.timer3 = this.scene.time.delayedCall(t, () => {
      if (!this.fixed) {
        this.scene.events.emit('hazardExpired', this);
        this.destroy();
      }
    });

    this.remaining = t;
    this.countdownTimer = this.scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        this.remaining -= 200;
        if (!this.fixed && this.remaining > 0) {
          this.countdownText.setText(`${Math.ceil(this.remaining / 1000)}s`);
        }
      },
    });
  }

  makeInteractive() {
    this.hitZone = this.scene.add.zone(this.wx, this.wy, 56, 56)
      .setInteractive({ useHandCursor: true })
      .setDepth(30);

    this.hitZone.on('pointerdown', () => {
      if (!this.fixed) this.fix();
    });

    this.hitZone.on('pointerover', () => {
      if (!this.fixed) this.gfx.setAlpha(0.75);
    });

    this.hitZone.on('pointerout', () => {
      this.gfx.setAlpha(1);
    });
  }

  fix() {
    this.fixed = true;
    const points = this.severity === 0 ? 10 : this.severity === 1 ? 7 : 5;

    this.scene.events.emit('hazardFixed', { hazard: this, points });

    const ripple = this.scene.add.graphics().setDepth(40);
    ripple.lineStyle(3, 0x6B8E23, 1);
    ripple.strokeCircle(this.wx, this.wy, 12);
    this.scene.tweens.add({
      targets: ripple,
      scaleX: 3.5, scaleY: 3.5,
      alpha: 0,
      duration: 480,
      onComplete: () => ripple.destroy(),
    });

    this.scene.tweens.add({
      targets: [this.gfx, this.label, this.countdownText],
      alpha: 0,
      duration: 280,
      onComplete: () => this.destroy(),
    });
  }

  destroy() {
    this.fixed = true;
    this.timer1?.remove();
    this.timer2?.remove();
    this.timer3?.remove();
    this.countdownTimer?.remove();
    this.gfx?.destroy();
    this.label?.destroy();
    this.countdownText?.destroy();
    this.hitZone?.destroy();
  }
}
