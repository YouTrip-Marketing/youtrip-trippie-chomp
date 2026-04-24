import {
  Direction, DX, DY, OPPOSITE, COLS, ROWS, WALL, GATE,
  PLAYER_START, getPlayerSpeed,
} from '../config/constants';

export class Player {
  col: number;
  row: number;
  px: number; // sub-tile x position
  py: number; // sub-tile y position
  dir: Direction;
  nextDir: Direction;
  speed: number;
  lastHDir: 'left' | 'right' = 'right';
  mouthAngle: number = 0;
  mouthDir: number = 1;

  constructor(level: number) {
    this.col = PLAYER_START.col;
    this.row = PLAYER_START.row;
    this.px = PLAYER_START.col;
    this.py = PLAYER_START.row;
    this.dir = Direction.LEFT;
    this.nextDir = Direction.NONE;
    this.speed = getPlayerSpeed(level);
  }

  reset(level: number): void {
    this.col = PLAYER_START.col;
    this.row = PLAYER_START.row;
    this.px = PLAYER_START.col;
    this.py = PLAYER_START.row;
    this.dir = Direction.LEFT;
    this.nextDir = Direction.NONE;
    this.speed = getPlayerSpeed(level);
  }

  private isWalkable(map: number[][], col: number, row: number): boolean {
    if (row < 0 || row >= ROWS) return false;
    if (col < 0 || col >= COLS) return true; // tunnel
    return map[row][col] !== WALL && map[row][col] !== GATE;
  }

  private atCenter(): boolean {
    return Math.abs(this.px - Math.round(this.px)) < 0.04 &&
           Math.abs(this.py - Math.round(this.py)) < 0.04;
  }

  /**
   * Move player. Returns tile coordinates where collection should happen, or null.
   * dtMs is delta time in ms.
   */
  move(map: number[][], dtMs: number, boostActive: boolean): { col: number; row: number } | null {
    const speedMult = boostActive ? 2 : 1;
    // Convert dt from ms to the v1 tick system: v1 uses dt * 0.06 where dt is in ticks (~16.67ms)
    let remaining = this.speed * speedMult * (dtMs / 16.667);
    let collectedTile: { col: number; row: number } | null = null;

    // Instant reverse
    if (this.nextDir !== Direction.NONE && this.nextDir === OPPOSITE[this.dir]) {
      this.dir = this.nextDir;
      this.nextDir = Direction.NONE;
    }

    // Snap-to-center turning — generous threshold for smooth cornering
    if (this.nextDir !== Direction.NONE && this.nextDir !== this.dir) {
      const nearCol = Math.round(this.px);
      const nearRow = Math.round(this.py);
      const distFromCenter = Math.abs(this.px - nearCol) + Math.abs(this.py - nearRow);
      if (distFromCenter < 0.8) {
        let nc = nearCol + DX[this.nextDir];
        let nr = nearRow + DY[this.nextDir];
        if (nc < 0) nc = COLS - 1;
        else if (nc >= COLS) nc = 0;
        if (this.isWalkable(map, nc, nr)) {
          this.col = nearCol;
          this.row = nearRow;
          this.px = nearCol;
          this.py = nearRow;
          this.dir = this.nextDir;
          this.nextDir = Direction.NONE;
        }
      }
    }

    while (remaining > 0.001) {
      if (this.dir === Direction.NONE) break;

      if (this.atCenter()) {
        this.col = Math.round(this.px);
        this.row = Math.round(this.py);
        if (this.col < 0) this.col = COLS - 1;
        else if (this.col >= COLS) this.col = 0;
        this.px = this.col;
        this.py = this.row;

        // Signal collection
        collectedTile = { col: this.col, row: this.row };

        // Try queued turn
        if (this.nextDir !== Direction.NONE) {
          let nc = this.col + DX[this.nextDir];
          let nr = this.row + DY[this.nextDir];
          if (nc < 0) nc = COLS - 1;
          else if (nc >= COLS) nc = 0;
          if (this.isWalkable(map, nc, nr)) {
            this.dir = this.nextDir;
            this.nextDir = Direction.NONE;
          }
        }

        // Check wall ahead
        let nc = this.col + DX[this.dir];
        let nr = this.row + DY[this.dir];
        if (nc < 0) nc = COLS - 1;
        else if (nc >= COLS) nc = 0;
        if (!this.isWalkable(map, nc, nr)) {
          break;
        }
      }

      // Distance to next tile center
      let distToCenter: number;
      if (DX[this.dir] !== 0) {
        distToCenter = DX[this.dir] > 0
          ? Math.ceil(this.px + 0.01) - this.px
          : this.px - Math.floor(this.px - 0.01);
      } else {
        distToCenter = DY[this.dir] > 0
          ? Math.ceil(this.py + 0.01) - this.py
          : this.py - Math.floor(this.py - 0.01);
      }
      if (distToCenter < 0.01) distToCenter = 1;

      const step = Math.min(remaining, distToCenter);
      this.px += DX[this.dir] * step;
      this.py += DY[this.dir] * step;
      remaining -= step;

      // Tunnel wrap
      if (this.px < -0.5) this.px += COLS;
      else if (this.px >= COLS - 0.5) this.px -= COLS;

      const newCol = Math.round(this.px);
      const newRow = Math.round(this.py);
      if (newCol !== this.col || newRow !== this.row) {
        this.col = newCol < 0 ? COLS - 1 : newCol >= COLS ? 0 : newCol;
        this.row = newRow;
      }
    }

    // Track facing direction
    if (this.dir === Direction.LEFT) this.lastHDir = 'left';
    else if (this.dir === Direction.RIGHT) this.lastHDir = 'right';

    // Mouth animation
    this.mouthAngle += this.mouthDir * 0.03;
    if (this.mouthAngle > 0.35) this.mouthDir = -1;
    if (this.mouthAngle < 0.02) this.mouthDir = 1;

    return collectedTile;
  }
}
