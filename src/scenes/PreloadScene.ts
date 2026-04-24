import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Player sprites
    this.load.image('trippie-a', 'assets/sprite-trippie-a.png');
    this.load.image('trippie-b', 'assets/sprite-trippie-b.png');
    this.load.image('trippie-c', 'assets/sprite-trippie-c.png');
    this.load.image('trippie-d', 'assets/sprite-trippie-d.png');
    this.load.image('trippie-face', 'assets/trippie-face.png');
    this.load.image('trippie-coins', 'assets/trippie-coins.png');

    // Ghost sprites
    this.load.image('chaser', 'assets/sprite-chaser.png');
    this.load.image('chaser-dead', 'assets/sprite-chaser-dead.png');
    this.load.image('ambusher', 'assets/sprite-ambusher.png');
    this.load.image('ambusher-dead', 'assets/sprite-ambusher-dead.png');

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
