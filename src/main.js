import { BootScene }   from './scenes/BootScene.js';
import { MenuScene }   from './scenes/MenuScene.js';
import { GameScene }   from './scenes/GameScene.js';
import { ResultScene } from './scenes/ResultScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#120D06',
  parent: 'game-container',
  scene: [BootScene, MenuScene, GameScene, ResultScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
