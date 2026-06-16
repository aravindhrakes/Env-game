export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1A1208);

    this.add.text(width / 2, height / 2 - 30, 'ECOSITE GUARDIAN', {
      fontSize: '28px',
      color: '#DEB887',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 10, 'Loading...', {
      fontSize: '13px',
      color: '#8B7355',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.time.delayedCall(600, () => this.scene.start('MenuScene'));
  }
}
