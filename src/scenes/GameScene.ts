import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Ghost } from '../entities/Ghost';
import { BonusData, spawnBonus, isBonusBlinking } from '../entities/BonusItem';
import { audioSystem } from '../systems/AudioSystem';
import { cloneMap, countDots } from '../config/maze-data';
import {
  COLS, ROWS, WALL, DOT, POWER, EMPTY, GATE,
  Direction, STARTING_LIVES,
  POWER_DURATION, POWER_FLASH_THRESHOLD,
  INVINCIBLE_DURATION, DYING_DURATION, LEVEL_WIN_DURATION,
  BONUS_FIRST_SPAWN_DELAY, BONUS_SPAWN_MIN, BONUS_SPAWN_MAX,
  BOOST_DURATION, FREEZE_DURATION,
  SCORE_DOT, SCORE_POWER, SCORE_BONUS, SCORE_GHOST_BASE,
  POPUP_DURATION,
  COLOR_WALL, COLOR_WALL_BORDER, COLOR_DOT, COLOR_GATE,
} from '../config/constants';

// Fixed game dimensions (must match main.ts)
const W = 480;
const H = 720;
const HUD_HEIGHT = 52;

type GameState = 'playing' | 'dying' | 'levelwin';

export class GameScene extends Phaser.Scene {
  // Game state
  private map!: number[][];
  private score: number = 0;
  private lives: number = STARTING_LIVES;
  private level: number = 1;
  private dotsLeft: number = 0;
  private gameState: GameState = 'playing';

  // Entities
  private player!: Player;
  private ghosts: Ghost[] = [];

  // Timers (in ms)
  private powerTimer: number = 0;
  private ghostScore: number = SCORE_GHOST_BASE;
  private invincibleTimer: number = 0;
  private freezeTimer: number = 0;
  private boostTimer: number = 0;
  private popupTimer: number = 0;
  private popupText: string = '';
  private dyingTimer: number = 0;
  private levelWinTimer: number = 0;

  // Bonus
  private bonusItem: BonusData | null = null;
  private bonusSpawnTimer: number = BONUS_FIRST_SPAWN_DELAY;

  // Stats
  private totalDotsEaten: number = 0;
  private totalGhostsEaten: number = 0;

  // Rendering
  private tileSize: number = 24;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private mazeGraphics!: Phaser.GameObjects.Graphics;
  private entityGraphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private livesContainer!: Phaser.GameObjects.Container;
  private popupTextObj!: Phaser.GameObjects.Text;
  private bgImage!: Phaser.GameObjects.Image;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private touchStartX: number = 0;
  private touchStartY: number = 0;

  // Sprite objects
  private playerSprite!: Phaser.GameObjects.Image;
  private ghostSprites: Phaser.GameObjects.Image[] = [];
  private cardSprites: Phaser.GameObjects.Image[] = [];
  private bonusSprites: Phaser.GameObjects.Image[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.totalDotsEaten = 0;
    this.totalGhostsEaten = 0;

    // Start background music
    audioSystem.startBGM();

    this.calculateLayout();
    this.setupRendering();
    this.setupInput();
    this.startLevel();
  }

  private calculateLayout(): void {
    // Calculate tile size to fill the game canvas
    const availW = W - 8;  // 4px padding each side
    const availH = H - HUD_HEIGHT - 12; // HUD top + padding bottom
    this.tileSize = Math.floor(Math.min(availW / COLS, availH / ROWS));
    this.tileSize = Math.max(this.tileSize, 10);

    const mazeW = COLS * this.tileSize;
    const mazeH = ROWS * this.tileSize;
    this.offsetX = (W - mazeW) / 2;
    this.offsetY = HUD_HEIGHT + (H - HUD_HEIGHT - mazeH) / 2;
  }

  private setupRendering(): void {
    // Background — same as start screen (full opacity)
    this.bgImage = this.add.image(W / 2, H / 2, 'game-over-bg');
    const bgScale = Math.max(W / this.bgImage.width, H / this.bgImage.height);
    this.bgImage.setScale(bgScale);

    // Maze graphics layer
    this.mazeGraphics = this.add.graphics();

    // Card sprites (power pellets) — 4 corners
    this.cardSprites = [];
    for (let i = 0; i < 4; i++) {
      const card = this.add.image(0, 0, 'card');
      card.setVisible(false);
      this.cardSprites.push(card);
    }

    // Bonus sprites — up to 2 (teleport pair)
    this.bonusSprites = [];
    for (let i = 0; i < 2; i++) {
      const bonus = this.add.image(0, 0, 'airplane');
      bonus.setVisible(false);
      this.bonusSprites.push(bonus);
    }

    // Ghost sprites — 4
    this.ghostSprites = [];
    for (let i = 0; i < 4; i++) {
      const ghost = this.add.image(0, 0, 'chaser');
      ghost.setVisible(false);
      this.ghostSprites.push(ghost);
    }

    // Entity graphics layer (overlays, trails)
    this.entityGraphics = this.add.graphics();

    // Player sprite
    this.playerSprite = this.add.image(0, 0, 'trippie-a');
    this.playerSprite.setVisible(false);

    // ← INTRO button (top-left)
    const introBtnG = this.add.graphics();
    introBtnG.fillStyle(0x1E1432, 0.8);
    introBtnG.fillRoundedRect(8, 6, 105, 24, 12);
    introBtnG.lineStyle(1, 0xFFFFFF, 0.15);
    introBtnG.strokeRoundedRect(8, 6, 105, 24, 12);
    introBtnG.setInteractive(
      new Phaser.Geom.Rectangle(8, 6, 105, 24),
      Phaser.Geom.Rectangle.Contains
    ).setDepth(50);
    this.add.text(60, 18, '← INTRO', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(50);
    introBtnG.on('pointerdown', () => {
      audioSystem.play('click');
      audioSystem.stopBGM();
      this.scene.start('HowToPlayScene');
    });

    // HUD — score left, level center, lives right (all vertically aligned)
    const hudY = 10;
    const hudStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#ffffff',
    };

    const hudRow = HUD_HEIGHT + 2;
    this.scoreText = this.add.text(16, hudRow, 'SCORE: 0', hudStyle);
    this.levelText = this.add.text(W / 2, hudRow, 'LVL: 1', hudStyle).setOrigin(0.5, 0);
    this.livesContainer = this.add.container(W - 10, hudRow);

    // Popup text
    this.popupTextObj = this.add.text(W / 2, H / 2, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: `${Math.round(this.tileSize * 0.85)}px`,
      color: '#00D2C8',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(100);
  }

  private setupInput(): void {
    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Touch/swipe
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      if (this.gameState !== 'playing') return;

      const dx = pointer.x - this.touchStartX;
      const dy = pointer.y - this.touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < 5) return;

      if (absDx > absDy) {
        this.player.nextDir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        this.player.nextDir = dy > 0 ? Direction.DOWN : Direction.UP;
      }

      // Reset origin for continuous chained swipes
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
    });
  }

  private startLevel(): void {
    this.map = cloneMap();
    this.dotsLeft = countDots(this.map);
    this.player = new Player(this.level);
    this.ghosts = [];
    for (let i = 0; i < 4; i++) {
      this.ghosts.push(new Ghost(i, this.level));
    }
    this.powerTimer = 0;
    this.ghostScore = SCORE_GHOST_BASE;
    this.bonusItem = null;
    this.bonusSpawnTimer = BONUS_FIRST_SPAWN_DELAY;
    this.boostTimer = 0;
    this.freezeTimer = 0;
    this.invincibleTimer = 0;
    this.gameState = 'playing';
    this.updateHUD();
    this.drawMaze();
  }

  private resetAfterDeath(): void {
    this.player = new Player(this.level);
    this.ghosts = [];
    for (let i = 0; i < 4; i++) {
      this.ghosts.push(new Ghost(i, this.level));
    }
    this.powerTimer = 0;
    this.invincibleTimer = INVINCIBLE_DURATION;
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 100);

    this.handleInput();

    switch (this.gameState) {
      case 'dying':
        this.updateDying(dt);
        break;
      case 'levelwin':
        this.updateLevelWin(dt);
        break;
      case 'playing':
        this.updatePlaying(dt);
        break;
    }

    this.drawEntities();
  }

  private handleInput(): void {
    if (this.gameState !== 'playing') return;

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.nextDir = Direction.UP;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.nextDir = Direction.DOWN;
    } else if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.nextDir = Direction.LEFT;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.nextDir = Direction.RIGHT;
    }
  }

  private updateDying(dt: number): void {
    this.dyingTimer -= dt;
    if (this.dyingTimer <= 0) {
      this.lives--;
      if (this.lives <= 0) {
        audioSystem.stopBGM();
        this.scene.start('GameOverScene', {
          score: this.score,
          level: this.level,
          dotsEaten: this.totalDotsEaten,
          ghostsEaten: this.totalGhostsEaten,
        });
      } else {
        this.resetAfterDeath();
        this.gameState = 'playing';
      }
    }
    this.updateHUD();
  }

  private updateLevelWin(dt: number): void {
    this.levelWinTimer -= dt;
    if (this.levelWinTimer <= 0) {
      this.level++;
      this.startLevel();
    }
  }

  private updatePlaying(dt: number): void {
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    if (this.boostTimer > 0) this.boostTimer -= dt;
    if (this.popupTimer > 0) this.popupTimer -= dt;

    // Bonus spawn
    if (!this.bonusItem) {
      this.bonusSpawnTimer -= dt;
      if (this.bonusSpawnTimer <= 0) {
        this.bonusItem = spawnBonus(this.map, this.player);
        this.bonusSpawnTimer = BONUS_SPAWN_MIN + Math.random() * (BONUS_SPAWN_MAX - BONUS_SPAWN_MIN);
      }
    } else {
      this.bonusItem.timer -= dt;
      if (this.bonusItem.timer <= 0) this.bonusItem = null;
    }

    // Power timer
    if (this.powerTimer > 0) {
      this.powerTimer -= dt;
      if (this.powerTimer <= 0) {
        this.powerTimer = 0;
        this.ghosts.forEach(g => { g.scared = false; });
      }
    }

    // Move player
    const collected = this.player.move(this.map, dt, this.boostTimer > 0);
    if (collected) {
      this.collectAtTile(collected.col, collected.row);
      if (this.gameState !== 'playing') return;
    }

    // Move ghosts
    const frozen = this.freezeTimer > 0;
    this.ghosts.forEach(g => {
      g.update(this.map, this.player, dt, frozen, this.powerTimer > 0);
    });

    this.checkCollisions();
  }

  private collectAtTile(col: number, row: number): void {
    const tile = this.map[row][col];
    if (tile === DOT) {
      this.map[row][col] = EMPTY;
      this.score += SCORE_DOT;
      this.dotsLeft--;
      this.totalDotsEaten++;
      audioSystem.play('dot');
      this.drawMaze();
    } else if (tile === POWER) {
      this.map[row][col] = EMPTY;
      this.score += SCORE_POWER;
      this.dotsLeft--;
      this.totalDotsEaten++;
      this.powerTimer = POWER_DURATION;
      this.ghostScore = SCORE_GHOST_BASE;
      this.ghosts.forEach(g => {
        if (!g.eaten && !g.home && !g.respawning) g.scared = true;
      });
      this.showPopup('FEE MONSTERS ARE DEAD!');
      audioSystem.play('power');
      this.drawMaze();
    }

    // Bonus collection
    if (this.bonusItem) {
      let collected = false;
      if (col === this.bonusItem.col && row === this.bonusItem.row) {
        collected = true;
        if (this.bonusItem.type === 'teleport' && this.bonusItem.col2 !== undefined && this.bonusItem.row2 !== undefined) {
          this.player.col = this.bonusItem.col2;
          this.player.row = this.bonusItem.row2;
          this.player.px = this.bonusItem.col2;
          this.player.py = this.bonusItem.row2;
        }
      } else if (this.bonusItem.type === 'teleport' &&
                 col === this.bonusItem.col2 && row === this.bonusItem.row2) {
        collected = true;
        this.player.col = this.bonusItem.col;
        this.player.row = this.bonusItem.row;
        this.player.px = this.bonusItem.col;
        this.player.py = this.bonusItem.row;
      }

      if (collected) {
        const type = this.bonusItem.type;
        this.score += SCORE_BONUS;
        this.bonusItem = null;
        if (type === 'boost') {
          this.boostTimer = BOOST_DURATION;
          this.showPopup('JET MODE!');
        } else if (type === 'freeze') {
          this.freezeTimer = FREEZE_DURATION;
          this.showPopup('RATES LOCKED!');
        } else if (type === 'teleport') {
          this.showPopup('PASSPORT CONTROL!');
        }
        audioSystem.play('power');
      }
    }

    if (this.dotsLeft <= 0) {
      this.gameState = 'levelwin';
      this.levelWinTimer = LEVEL_WIN_DURATION;
      this.score += 500 * this.level;
      this.showPopup('LEVEL UP!');
      audioSystem.play('levelup');
      this.updateHUD();
    }
    this.updateHUD();
  }

  private checkCollisions(): void {
    for (const g of this.ghosts) {
      if (g.home || g.respawning || g.eaten) continue;
      if (g.col === this.player.col && g.row === this.player.row) {
        if (g.scared) {
          g.eaten = true;
          g.scared = false;
          this.score += this.ghostScore;
          this.ghostScore *= 2;
          this.totalGhostsEaten++;
          audioSystem.play('ghost');
          this.updateHUD();
        } else if (this.invincibleTimer <= 0) {
          this.gameState = 'dying';
          this.dyingTimer = DYING_DURATION;
          audioSystem.play('die');
        }
      }
    }
  }

  private showPopup(text: string): void {
    this.popupText = text;
    this.popupTimer = POPUP_DURATION;
  }

  private updateHUD(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.levelText.setText(`LVL: ${this.level}`);

    this.livesContainer.removeAll(true);
    for (let i = 0; i < this.lives; i++) {
      const life = this.add.image(-i * 28, -3, 'trippie-face');
      life.setScale(26 / life.width);
      life.setOrigin(1, 0);
      this.livesContainer.add(life);
    }
  }

  private drawMaze(): void {
    const T = this.tileSize;
    const half = T / 2;
    this.mazeGraphics.clear();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = this.map[r][c];
        const x = this.offsetX + c * T;
        const y = this.offsetY + r * T;

        // Draw path tiles with a subtle lighter fill so corridors are visible
        if (t !== WALL) {
          this.mazeGraphics.fillStyle(0xFFFFFF, 0.04);
          this.mazeGraphics.fillRect(x, y, T, T);
        }

        if (t === WALL) {
          this.mazeGraphics.fillStyle(COLOR_WALL, 1);
          this.mazeGraphics.fillRect(x, y, T, T);

          this.mazeGraphics.lineStyle(0.5, COLOR_WALL_BORDER, 1);
          if (r > 0 && this.map[r - 1][c] !== WALL) {
            this.mazeGraphics.lineBetween(x, y, x + T, y);
          }
          if (r < ROWS - 1 && this.map[r + 1][c] !== WALL) {
            this.mazeGraphics.lineBetween(x, y + T, x + T, y + T);
          }
          if (c > 0 && this.map[r][c - 1] !== WALL) {
            this.mazeGraphics.lineBetween(x, y, x, y + T);
          }
          if (c < COLS - 1 && this.map[r][c + 1] !== WALL) {
            this.mazeGraphics.lineBetween(x + T, y, x + T, y + T);
          }
        } else if (t === DOT) {
          this.mazeGraphics.fillStyle(COLOR_DOT, 1);
          this.mazeGraphics.fillCircle(x + half, y + half, T * 0.12);
        } else if (t === GATE) {
          this.mazeGraphics.fillStyle(COLOR_GATE, 1);
          this.mazeGraphics.fillRect(x, y + half - 1.5, T, 3);
        }
      }
    }
  }

  private drawEntities(): void {
    const T = this.tileSize;
    const half = T / 2;
    const now = this.time.now;
    this.entityGraphics.clear();

    // Power pellet cards
    let cardIdx = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map[r][c] === POWER && cardIdx < this.cardSprites.length) {
          const pulse = 0.9 + 0.1 * Math.sin(now * 0.004);
          const size = T * 1.4 * pulse;
          const x = this.offsetX + c * T + half;
          const y = this.offsetY + r * T + half;
          this.cardSprites[cardIdx].setPosition(x, y);
          this.cardSprites[cardIdx].setDisplaySize(size, size);
          this.cardSprites[cardIdx].setVisible(true);
          cardIdx++;
        }
      }
    }
    for (let i = cardIdx; i < this.cardSprites.length; i++) {
      this.cardSprites[i].setVisible(false);
    }

    // Bonus items — 2x bigger than cards, with glow
    this.bonusSprites.forEach(s => s.setVisible(false));
    if (this.bonusItem) {
      const pulse = 0.8 + 0.2 * Math.sin(now * 0.005);
      const size = T * 2.1 * pulse;
      const blinking = isBonusBlinking(this.bonusItem);
      const alpha = blinking ? 0.3 : 1;

      const bx = this.offsetX + this.bonusItem.col * T + half;
      const by = this.offsetY + this.bonusItem.row * T + half;

      // Glow circle behind bonus
      const glowColors: Record<string, number> = { boost: 0xFFD700, teleport: 0xE040FB, freeze: 0x4FC3F7 };
      const glowColor = glowColors[this.bonusItem.type] || 0xFFFFFF;
      this.entityGraphics.fillStyle(glowColor, 0.15 * alpha);
      this.entityGraphics.fillCircle(bx, by, size * 0.7);
      this.entityGraphics.fillStyle(glowColor, 0.08 * alpha);
      this.entityGraphics.fillCircle(bx, by, size * 1.0);

      const textureKey = this.bonusItem.type === 'teleport' ? 'passport'
        : this.bonusItem.type === 'freeze' ? 'globe' : 'airplane';
      this.bonusSprites[0].setTexture(textureKey);
      this.bonusSprites[0].setPosition(bx, by);
      this.bonusSprites[0].setDisplaySize(size, size);
      this.bonusSprites[0].setAlpha(alpha);
      this.bonusSprites[0].setVisible(true);

      // Second teleport point
      if (this.bonusItem.type === 'teleport' && this.bonusItem.col2 !== undefined && this.bonusItem.row2 !== undefined) {
        const bx2 = this.offsetX + this.bonusItem.col2 * T + half;
        const by2 = this.offsetY + this.bonusItem.row2 * T + half;
        this.entityGraphics.fillStyle(glowColor, 0.15 * alpha);
        this.entityGraphics.fillCircle(bx2, by2, size * 0.7);
        this.entityGraphics.fillStyle(glowColor, 0.08 * alpha);
        this.entityGraphics.fillCircle(bx2, by2, size * 1.0);
        this.bonusSprites[1].setTexture('passport');
        this.bonusSprites[1].setPosition(bx2, by2);
        this.bonusSprites[1].setDisplaySize(size, size);
        this.bonusSprites[1].setAlpha(alpha);
        this.bonusSprites[1].setVisible(true);
      }
    }

    // Player
    const pSprite = this.playerSprite;
    if (this.gameState === 'dying') {
      const progress = 1 - this.dyingTimer / DYING_DURATION;
      if (this.dyingTimer > 0 && Math.floor(this.dyingTimer / 166) % 2 > 0) {
        const size = T * 1.6 * (1 - progress);
        const px = this.offsetX + this.player.px * T + half;
        const py = this.offsetY + this.player.py * T + half;
        pSprite.setPosition(px, py);
        pSprite.setDisplaySize(size, size);
        pSprite.setAlpha(1 - progress);
        pSprite.setTexture(this.getPlayerTexture());
        pSprite.setVisible(true);
      } else {
        pSprite.setVisible(false);
      }
    } else {
      const size = T * 1.6;
      const px = this.offsetX + this.player.px * T + half;
      const py = this.offsetY + this.player.py * T + half;

      let alpha = 1;
      if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 100) % 2 === 0) {
        alpha = 0.4;
      }

      pSprite.setTexture(this.getPlayerTexture());
      pSprite.setPosition(px, py);
      pSprite.setDisplaySize(size, size);
      pSprite.setAlpha(alpha);
      pSprite.setVisible(true);

      // Speed boost trail
      if (this.boostTimer > 0) {
        if (this.boostTimer < 1500 && Math.floor(this.boostTimer / 120) % 2 === 0) {
          pSprite.setAlpha(0.5);
        }
        const trailDx = this.player.dir === Direction.RIGHT ? -1 : this.player.dir === Direction.LEFT ? 1 : 0;
        const trailDy = this.player.dir === Direction.DOWN ? -1 : this.player.dir === Direction.UP ? 1 : 0;
        for (let i = 1; i <= 3; i++) {
          this.entityGraphics.fillStyle(0xFFD700, 0.3 - i * 0.08);
          this.entityGraphics.fillCircle(
            px + trailDx * T * 0.3 * i,
            py + trailDy * T * 0.3 * i,
            T * (0.2 - i * 0.04)
          );
        }
      }
    }

    // Ghosts
    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      const gs = this.ghostSprites[i];

      if (g.home || g.respawning) {
        gs.setVisible(false);
        continue;
      }

      let textureKey: string;
      if (g.scared || g.eaten) {
        textureKey = g.spriteKey + '-dead';
        if (this.powerTimer < POWER_FLASH_THRESHOLD && this.powerTimer > 0 &&
            Math.floor(this.powerTimer / 150) % 2 === 0) {
          textureKey = g.spriteKey;
        }
      } else {
        textureKey = g.spriteKey;
      }

      const size = T * 1.6;
      const gx = this.offsetX + g.px * T + half;
      const gy = this.offsetY + g.py * T + half;

      gs.setTexture(textureKey);
      gs.setPosition(gx, gy);
      gs.setDisplaySize(size, size);
      gs.setVisible(true);

      if (g.eaten) {
        gs.setAlpha(0.4);
      } else if (this.freezeTimer > 0) {
        if (this.freezeTimer < 1500 && Math.floor(this.freezeTimer / 150) % 2 === 0) {
          gs.setAlpha(0.5);
        } else {
          gs.setAlpha(1);
        }
        this.entityGraphics.fillStyle(0x4FC3F7, 0.3);
        this.entityGraphics.fillRect(gx - size / 2, gy - size / 2, size, size);
      } else {
        gs.setAlpha(1);
      }
    }

    // Popup text
    if (this.popupTimer > 0) {
      const fadeIn = Math.min(1, (POPUP_DURATION - this.popupTimer) / 200);
      const fadeOut = Math.min(1, this.popupTimer / 300);
      const alpha = Math.min(fadeIn, fadeOut);
      this.popupTextObj.setText(this.popupText);
      this.popupTextObj.setAlpha(alpha);
    } else {
      this.popupTextObj.setAlpha(0);
    }
  }

  private getPlayerTexture(): string {
    const mouthOpen = this.player.mouthAngle > 0.18;
    if (this.player.lastHDir === 'right') {
      return mouthOpen ? 'trippie-b' : 'trippie-a';
    } else {
      return mouthOpen ? 'trippie-c' : 'trippie-d';
    }
  }
}
