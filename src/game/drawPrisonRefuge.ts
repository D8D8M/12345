/** Decorative prison scenery for the merchant refuge. It has no collision or gameplay objects. */
export const drawPrisonRefuge = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const wallTop = height * .08;
  const wallBottom = height * .75;
  ctx.fillStyle = '#18252b';
  ctx.fillRect(0, wallTop, width, wallBottom - wallTop);

  for (let row = 0, y = wallTop; y < wallBottom; row++, y += 54) {
    const offset = row % 2 ? -64 : 0;
    for (let x = offset; x < width; x += 128) {
      ctx.fillStyle = row % 3 ? '#26363c' : '#2d3d42';
      ctx.fillRect(x + 4, y + 4, 120, 46);
      ctx.fillStyle = 'rgba(7,14,18,.5)';
      ctx.fillRect(x, y + 50, 128, 4);
      ctx.fillRect(x + 124, y, 4, 54);
    }
  }

  const cellWidth = Math.max(150, width * .14);
  for (let cell = 0; cell < 5; cell++) {
    const center = width * (.1 + cell * .2);
    const x = center - cellWidth / 2;
    const y = height * .2 + (cell % 2) * 12;
    const cellHeight = height * .38;
    ctx.fillStyle = '#080e12'; ctx.fillRect(x, y, cellWidth, cellHeight);
    ctx.strokeStyle = '#60736e'; ctx.lineWidth = 7; ctx.strokeRect(x, y, cellWidth, cellHeight);
    ctx.fillStyle = '#35494a';
    for (let barX = x + 15; barX < x + cellWidth - 8; barX += 24) ctx.fillRect(barX, y + 5, 7, cellHeight - 10);
    ctx.fillRect(x + 5, y + cellHeight * .48, cellWidth - 10, 7);
    ctx.fillStyle = '#81918b'; ctx.fillRect(x + cellWidth - 25, y + cellHeight * .53, 10, 8);
  }

  const shade = ctx.createLinearGradient(0, wallTop, 0, wallBottom);
  shade.addColorStop(0, 'rgba(2,7,10,.12)'); shade.addColorStop(.6, 'rgba(2,7,10,.03)'); shade.addColorStop(1, 'rgba(2,7,10,.68)');
  ctx.fillStyle = shade; ctx.fillRect(0, wallTop, width, wallBottom - wallTop);
};
