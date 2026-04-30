import {
  Direction, DX, DY, OPPOSITE, COLS, ROWS, WALL, GATE,
  GhostAI, GHOST_STARTS, GHOST_AI_TYPES, GHOST_SPRITES,
  GHOST_SPEED_MULTS, GHOST_HOME_TIMERS, PATROL_ROUTE,
  getGhostBaseSpeed, GHOST_RESPAWN_DELAY, GHOST_PEN_EXIT,
} from '../config/constants';
import { Player } from './Player';

export class Ghost {
  col: number;
  row: number;
  px: number;
  py: number;
  dir: Direction;
  ai: GhostAI;
  spriteKey: string;
  speed: number;
  scared: boolean = false;
  eaten: boolean = false;
  respawning: boolean = false;
  respawnTimer: number = 0;
  home: boolean = true;
  homeTimer: number;
  patrolIdx: number;

  constructor(index: number, level: number) {
    const start = GHOST_STARTS[index];
    this.col = start.col;
    this.row = start.row;
    this.px = start.col;
    this.py = start.row;
    this.dir = Direction.UP; // all ghosts start in pen, face up to exit
    this.ai = GHOST_AI_TYPES[index];
    this.spriteKey = GHOST_SPRITES[this.ai];
    const baseSpeed = getGhostBaseSpeed(level);
    this.speed = baseSpeed * GHOST_SPEED_MULTS[this.ai];
    this.homeTimer = GHOST_HOME_TIMERS[index];
    this.patrolIdx = 0;
  }

  private isWalkableForGhost(map: number[][], col: number, row: number, canPassGate: boolean): boolean {
    if (row < 0 || row >= ROWS) return false;
    if (col < 0 || col >= COLS) return true;
    const t = map[row][col];
    if (t === WALL) return false;
    if (t === GATE && !canPassGate) return false;
    return true;
  }

  private dist(x1: number, y1: number, x2: number, y2: number): number {
    return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  }

  private getTarget(player: Player): { col: number; row: number } {
    if (this.eaten) return { col: GHOST_PEN_EXIT.col, row: GHOST_PEN_EXIT.row };
    if (this.scared) return {
      col: Math.random() * COLS | 0,
      row: Math.random() * ROWS | 0,
    };

    switch (this.ai) {
      case 'chase':
        return { col: player.col, row: player.row };

      case 'ambush':
        return {
          col: player.col + DX[player.dir] * 4,
          row: player.row + DY[player.dir] * 4,
        };

      case 'patrol': {
        const target = PATROL_ROUTE[this.patrolIdx];
        if (Math.abs(this.col - target.col) <= 2 && Math.abs(this.row - target.row) <= 2) {
          this.patrolIdx = (this.patrolIdx + 1) % PATROL_ROUTE.length;
        }
        return PATROL_ROUTE[this.patrolIdx];
      }

      default:
        return { col: Math.random() * COLS | 0, row: Math.random() * ROWS | 0 };
    }
  }

  private chooseDir(map: number[][], player: Player): Direction {
    const canGate = this.eaten || this.home;
    const target = this.getTarget(player);
    let bestDir = this.dir;
    let bestDist = Infinity;

    for (let d = 0; d < 4; d++) {
      if (d === OPPOSITE[this.dir] && !this.home) continue;
      const nc = this.col + DX[d];
      const nr = this.row + DY[d];
      const wrappedCol = nc < 0 ? COLS - 1 : nc >= COLS ? 0 : nc;
      if (!this.isWalkableForGhost(map, wrappedCol, nr, canGate)) continue;
      const dd = this.dist(nc, nr, target.col, target.row);
      if (dd < bestDist) { bestDist = dd; bestDir = d as Direction; }
    }

    return bestDir;
  }

  private atCenter(): boolean {
    return Math.abs(this.px - Math.round(this.px)) < 0.02 &&
           Math.abs(this.py - Math.round(this.py)) < 0.02;
  }

  /**
   * Update ghost. Returns true if ghost just finished respawning (ready to re-enter).
   */
  update(map: number[][], player: Player, dtMs: number, frozen: boolean, powerActive: boolean): boolean {
    // Handle respawn delay
    if (this.respawning) {
      this.respawnTimer -= dtMs;
      if (this.respawnTimer <= 0) {
        this.respawning = false;
        this.eaten = false;
        this.scared = powerActive;
        this.col = GHOST_PEN_EXIT.col;
        this.row = GHOST_PEN_EXIT.row;
        this.px = GHOST_PEN_EXIT.col;
        this.py = GHOST_PEN_EXIT.row;
        this.dir = Direction.LEFT;
        return true;
      }
      return false;
    }

    // Home timer (release from pen)
    if (this.home) {
      this.homeTimer -= dtMs;
      if (this.homeTimer <= 0) {
        this.home = false;
        this.col = GHOST_PEN_EXIT.col;
        this.row = GHOST_PEN_EXIT.row;
        this.px = GHOST_PEN_EXIT.col;
        this.py = GHOST_PEN_EXIT.row;
        this.dir = Direction.LEFT;
        if (powerActive) this.scared = true;
      }
      return false;
    }

    // Frozen by luggage power-up
    if (frozen) return false;

    // Move
    this.moveGhost(map, player, dtMs);
    return false;
  }

  private moveGhost(map: number[][], player: Player, dtMs: number): void {
    const spdMult = this.eaten ? 2 : this.scared ? 0.6 : 1;
    let remaining = this.speed * spdMult * (dtMs / 16.667);

    while (remaining > 0.001) {
      if (this.atCenter()) {
        this.col = Math.round(this.px);
        this.row = Math.round(this.py);
        if (this.col < 0) this.col = COLS - 1;
        else if (this.col >= COLS) this.col = 0;
        this.px = this.col;
        this.py = this.row;

        // Check pen arrival for eaten ghosts
        if (this.eaten && this.col >= 8 && this.col <= 10 && this.row >= 8 && this.row <= 10) {
          this.respawning = true;
          this.respawnTimer = GHOST_RESPAWN_DELAY;
          this.eaten = false;
          return;
        }

        this.dir = this.chooseDir(map, player);
        const canGate = this.eaten;
        let nc = this.col + DX[this.dir];
        let nr = this.row + DY[this.dir];
        if (nc < 0) nc = COLS - 1;
        else if (nc >= COLS) nc = 0;
        if (!this.isWalkableForGhost(map, nc, nr, canGate)) break;
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
  }
}
