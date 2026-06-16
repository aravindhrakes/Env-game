export const TILE_W = 64;
export const TILE_H = 32;
export const GRID_COLS = 8;
export const GRID_ROWS = 6;

export const ZONES = {
  waste:      { cols: [0, 1, 2], rows: [0, 1, 2], color: 0x7A6B4F, label: 'Waste Bay' },
  storage:    { cols: [5, 6, 7], rows: [0, 1, 2], color: 0x8B7355, label: 'Storage' },
  excavation: { cols: [0, 1, 2], rows: [3, 4, 5], color: 0x6B5840, label: 'Excavation' },
  drainage:   { cols: [5, 6, 7], rows: [3, 4, 5], color: 0x5C7A5C, label: 'Drainage' },
  general:    { cols: [3, 4],    rows: [0, 1, 2, 3, 4, 5], color: 0x9A8A72, label: 'Work Zone' },
};

export class SiteMap {
  constructor(scene, offsetX, offsetY) {
    this.scene = scene;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.tileGraphics = scene.add.graphics().setDepth(0);
    this.structureGraphics = [];
    this.labelTexts = [];
    this.draw();
  }

  isoToScreen(col, row) {
    return {
      x: this.offsetX + (col - row) * (TILE_W / 2),
      y: this.offsetY + (col + row) * (TILE_H / 2),
    };
  }

  getZoneForTile(col, row) {
    for (const [name, zone] of Object.entries(ZONES)) {
      if (zone.cols.includes(col) && zone.rows.includes(row)) return name;
    }
    return 'general';
  }

  darken(hex, factor) {
    const r = Math.floor(((hex >> 16) & 0xFF) * factor);
    const g = Math.floor(((hex >> 8) & 0xFF) * factor);
    const b = Math.floor((hex & 0xFF) * factor);
    return (r << 16) | (g << 8) | b;
  }

  drawIsoDiamond(g, x, y, fillColor, alpha) {
    const hw = TILE_W / 2;
    const hh = TILE_H / 2;

    g.fillStyle(fillColor, alpha);
    g.fillPoints([
      { x, y: y - hh },
      { x: x + hw, y },
      { x, y: y + hh },
      { x: x - hw, y },
    ], true);

    g.fillStyle(this.darken(fillColor, 0.68), alpha);
    g.fillPoints([
      { x: x - hw, y },
      { x,         y: y + hh },
      { x,         y: y + hh + 9 },
      { x: x - hw, y: y + 9 },
    ], true);

    g.fillStyle(this.darken(fillColor, 0.82), alpha);
    g.fillPoints([
      { x,         y: y + hh },
      { x: x + hw, y },
      { x: x + hw, y: y + 9 },
      { x,         y: y + hh + 9 },
    ], true);

    g.lineStyle(1, 0x1A0E04, 0.35);
    g.strokePoints([
      { x, y: y - hh },
      { x: x + hw, y },
      { x, y: y + hh },
      { x: x - hw, y },
    ], true);
  }

  draw() {
    this.tileGraphics.clear();

    for (let sum = 0; sum <= GRID_ROWS + GRID_COLS - 2; sum++) {
      for (let col = Math.min(sum, GRID_COLS - 1); col >= Math.max(0, sum - GRID_ROWS + 1); col--) {
        const row = sum - col;
        if (row < 0 || row >= GRID_ROWS) continue;
        const zone = ZONES[this.getZoneForTile(col, row)];
        const color = zone ? zone.color : 0x9A8A72;
        const { x, y } = this.isoToScreen(col, row);
        this.drawIsoDiamond(this.tileGraphics, x, y, color, 1);
      }
    }

    this.drawZoneLabels();
    this.drawStructures();
  }

  drawZoneLabels() {
    this.labelTexts.forEach(t => t.destroy());
    this.labelTexts = [];

    const centers = {
      waste:      { col: 1,   row: 1   },
      storage:    { col: 6,   row: 1   },
      excavation: { col: 1,   row: 4   },
      drainage:   { col: 6,   row: 4   },
      general:    { col: 3.5, row: 2.5 },
    };

    for (const [name, pos] of Object.entries(centers)) {
      const { x, y } = this.isoToScreen(pos.col, pos.row);
      const t = this.scene.add.text(x, y - 6, ZONES[name]?.label ?? name, {
        fontSize: '9px',
        color: '#F0E0C4',
        fontFamily: 'monospace',
        alpha: 0.65,
      }).setOrigin(0.5, 0.5).setDepth(5);
      this.labelTexts.push(t);
    }
  }

  addStructureGfx() {
    const g = this.scene.add.graphics().setDepth(10);
    this.structureGraphics.push(g);
    return g;
  }

  drawStructures() {
    this.structureGraphics.forEach(g => g.destroy());
    this.structureGraphics = [];

    this.drawBarrel(this.isoToScreen(6, 0));
    this.drawBarrel(this.isoToScreen(7, 1));
    this.drawExcavator(this.isoToScreen(0, 4));
    this.drawDrainCover(this.isoToScreen(7, 3));
    this.drawWasteBin(this.isoToScreen(0, 1));
    this.drawWasteBin(this.isoToScreen(1, 0));
    this.drawCabin(this.isoToScreen(3, 2));
  }

  drawBarrel({ x, y }) {
    const g = this.addStructureGfx();
    y -= 14;
    g.fillStyle(0x3A2818, 1);
    g.fillEllipse(x, y, 18, 26);
    g.fillStyle(0x7A5A14, 1);
    g.fillRect(x - 9, y - 9, 18, 3);
    g.fillRect(x - 9, y - 2, 18, 3);
    g.fillRect(x - 9, y + 5, 18, 3);
    g.fillStyle(0x5A3C1A, 0.5);
    g.fillEllipse(x - 2, y - 5, 6, 8);
  }

  drawExcavator({ x, y }) {
    const g = this.addStructureGfx();
    y -= 10;
    g.fillStyle(0xC49000, 1);
    g.fillRect(x - 16, y - 14, 24, 14);
    g.fillStyle(0xA07000, 1);
    g.fillRect(x - 18, y, 28, 6);
    g.fillStyle(0x806000, 1);
    g.fillRect(x + 6, y - 22, 5, 22);
    g.fillRect(x + 4, y - 24, 10, 6);
    g.fillStyle(0x303030, 0.8);
    g.fillRect(x - 12, y - 12, 10, 10);
  }

  drawDrainCover({ x, y }) {
    const g = this.addStructureGfx();
    y -= 4;
    g.fillStyle(0x4A4A4A, 1);
    g.fillEllipse(x, y, 24, 14);
    g.lineStyle(2, 0x606060, 1);
    g.strokeEllipse(x, y, 22, 12);
    g.lineStyle(1, 0x606060, 0.7);
    g.lineBetween(x - 10, y, x + 10, y);
    g.lineBetween(x - 8, y - 4, x + 8, y - 4);
    g.lineBetween(x - 8, y + 4, x + 8, y + 4);
  }

  drawWasteBin({ x, y }) {
    const g = this.addStructureGfx();
    y -= 12;
    g.fillStyle(0x1A5C22, 1);
    g.fillRect(x - 10, y - 8, 20, 20);
    g.fillStyle(0x124018, 1);
    g.fillRect(x - 12, y - 10, 24, 4);
    g.fillStyle(0xFFFFFF, 0.5);
    g.fillRect(x - 5, y - 4, 3, 10);
    g.fillRect(x + 2, y - 4, 3, 10);
  }

  drawCabin({ x, y }) {
    const g = this.addStructureGfx();
    y -= 16;
    g.fillStyle(0xA0784A, 1);
    g.fillRect(x - 18, y - 10, 36, 26);
    g.fillStyle(0x7A5430, 1);
    g.fillRect(x - 18, y - 14, 36, 6);
    g.fillStyle(0x6088AA, 0.7);
    g.fillRect(x - 12, y - 6, 10, 14);
    g.fillRect(x + 2, y - 6, 10, 14);
    g.fillStyle(0x3A2010, 1);
    g.fillRect(x - 4, y + 2, 8, 14);
  }

  getSpawnPositions(zoneName) {
    const zone = ZONES[zoneName] ?? ZONES.general;
    const positions = [];
    for (const col of zone.cols) {
      for (const row of zone.rows) {
        positions.push({ col, row });
      }
    }
    return positions;
  }

  getTileCenter(col, row) {
    return this.isoToScreen(col, row);
  }

  destroy() {
    this.tileGraphics.destroy();
    this.structureGraphics.forEach(g => g.destroy());
    this.labelTexts.forEach(t => t.destroy());
  }
}
