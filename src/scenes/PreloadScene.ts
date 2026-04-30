import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Player sprites
    this.load.image('trippie-a', 'assets/sprite-trippie-a.png');         // right closed
    this.load.image('trippie-b', 'assets/sprite-trippie-b.png');         // front (up/down)
    this.load.image('trippie-c', 'assets/sprite-trippie-c.png');         // front (up/down)
    this.load.image('trippie-d', 'assets/sprite-trippie-d.png');         // left closed
    this.load.image('trippie-right-open', 'assets/sprite-trippie-right-open.png');
    this.load.image('trippie-left-open', 'assets/sprite-trippie-left-open.png');
    this.load.image('trippie-face', 'assets/trippie-face.png');
    this.load.image('trippie-coins', 'assets/trippie-coins.png');

    // Monster sprites — 3 fee monsters
    this.load.image('monster-blue', 'assets/monster-blue.png');
    this.load.image('monster-blue-dead', 'assets/monster-blue-dead.png');
    this.load.image('monster-green', 'assets/monster-green.png');
    this.load.image('monster-green-dead', 'assets/monster-green-dead.png');
    this.load.image('monster-orange', 'assets/monster-orange.png');
    this.load.image('monster-orange-dead', 'assets/monster-orange-dead.png');

    // Item sprites
    this.load.image('card', 'assets/sprite-card.png');
    this.load.image('airplane', 'assets/sprite-airplane.png');
    this.load.image('passport', 'assets/passport.png');
    this.load.image('globe', 'assets/sprite-globe.png');

    // Backgrounds
    this.load.image('game-bg', 'assets/game-bg.png');
    this.load.image('game-over-bg', 'assets/game-over-bg.png');
  }

  create(): void {
    this.scene.start('StartScene');
  }
}
