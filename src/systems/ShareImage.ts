/**
 * Generates a 1080x1920 share image for Instagram stories.
 * Mirrors the Phaser GameOverScene design (without the intro button).
 */
export interface ShareStats {
  score: number;
  level: number;
  dotsEaten: number;
  ghostsEaten: number;
}

// Draw text with black stroke (pixel-retro pop)
function drawStrokedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  strokeWidth: number,
): void {
  if (strokeWidth > 0) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);
  }
  ctx.fillText(text, x, y);
}

export async function generateShareImage(
  stats: ShareStats,
  gameOverBgImg: HTMLImageElement,
  trippieCoinsImg: HTMLImageElement,
): Promise<Blob> {
  const W = 1080, H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;

  // Background — cover-fit
  if (gameOverBgImg.complete && gameOverBgImg.naturalWidth > 0) {
    const imgRatio = gameOverBgImg.naturalWidth / gameOverBgImg.naturalHeight;
    const canvasRatio = W / H;
    let sw: number, sh: number, sx: number, sy: number;
    if (imgRatio > canvasRatio) {
      sh = gameOverBgImg.naturalHeight;
      sw = sh * canvasRatio;
      sx = (gameOverBgImg.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = gameOverBgImg.naturalWidth;
      sh = sw / canvasRatio;
      sx = 0;
      sy = (gameOverBgImg.naturalHeight - sh) / 2;
    }
    x.drawImage(gameOverBgImg, sx, sy, sw, sh, 0, 0, W, H);
  } else {
    x.fillStyle = '#0D0D1A';
    x.fillRect(0, 0, W, H);
  }

  // Card — matches GameOverScene (420x560 → scale 2.57x for 1080 width)
  const cardW = 960, cardH = 1280;
  const cardX = (W - cardW) / 2;
  const cardY = (H - cardH) / 2 - 20;
  x.fillStyle = 'rgba(30, 20, 50, 0.75)';
  x.beginPath();
  x.roundRect(cardX, cardY, cardW, cardH, 40);
  x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.12)';
  x.lineWidth = 2;
  x.stroke();

  const pad = 50;
  x.textAlign = 'center';

  // Title "GAME OVER" — light purple, 2 lines, with black stroke
  x.fillStyle = '#D8B4FE';
  x.font = '700 92px "Press Start 2P", monospace';
  drawStrokedText(x, 'GAME', W / 2, cardY + 155, 10);
  drawStrokedText(x, 'OVER', W / 2, cardY + 265, 10);

  // Trippie coins — tighter gap from title
  if (trippieCoinsImg.complete && trippieCoinsImg.naturalWidth > 0) {
    const imgW = 580;
    const imgH = imgW * (trippieCoinsImg.naturalHeight / trippieCoinsImg.naturalWidth);
    // at 580w, height = 580*(1645/1912) = 499. Top at cardY+275, bottom at cardY+774.
    x.drawImage(trippieCoinsImg, (W - imgW) / 2, cardY + 275, imgW, imgH);
  }

  // Score "YOU SAVED S$X!" — tighter gap from coins
  x.fillStyle = '#FFD700';
  x.font = '700 46px "Press Start 2P", monospace';
  drawStrokedText(x, `YOU SAVED S$${stats.score}!`, W / 2, cardY + 825, 6);

  // Stat boxes — values in mint green
  const statY = cardY + 865;
  const statH = 230;
  const statGap = 20;
  const statW = (cardW - pad * 2 - statGap * 2) / 3;
  const statData = [
    { label: 'CURRENCIES\nEATEN', val: stats.dotsEaten },
    { label: 'LEVEL\nREACHED', val: stats.level },
    { label: 'FEE MONSTERS\nEATEN', val: stats.ghostsEaten },
  ];

  statData.forEach((s, i) => {
    const sx2 = cardX + pad + i * (statW + statGap);

    // Box
    x.fillStyle = 'rgba(255,255,255,0.08)';
    x.beginPath();
    x.roundRect(sx2, statY, statW, statH, 24);
    x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.15)';
    x.lineWidth = 2;
    x.stroke();

    // Label
    x.fillStyle = 'rgba(255,255,255,0.65)';
    x.font = '700 18px "Press Start 2P", monospace';
    const lines = s.label.split('\n');
    lines.forEach((line, li) => {
      x.fillText(line, sx2 + statW / 2, statY + 48 + li * 28);
    });

    // Value — mint green with stroke
    x.fillStyle = '#00D2C8';
    x.font = '700 62px "Press Start 2P", monospace';
    drawStrokedText(x, String(s.val), sx2 + statW / 2, statY + 200, 5);
  });

  // CTA "SHARE ON IG & STAND A CHANCE / TO WIN A YEAR OF TRAVEL ON US"
  // 28 chars at 28px monospace ≈ 784px, fits in 960 card width
  x.fillStyle = 'rgba(255,255,255,0.7)';
  x.font = '700 28px "Press Start 2P", monospace';
  const ctaY = statY + statH + 72;
  x.fillText('SHARE ON IG & STAND A CHANCE', W / 2, ctaY);
  x.fillText('TO WIN A YEAR OF TRAVEL ON US', W / 2, ctaY + 44);

  // Branding at bottom
  x.fillStyle = '#D8B4FE';
  x.font = '700 36px "Press Start 2P", monospace';
  drawStrokedText(x, 'TRIPPIE CHOMP', W / 2, H - 180, 6);
  x.fillStyle = 'rgba(255,255,255,0.5)';
  x.font = '700 20px "Press Start 2P", monospace';
  x.fillText('powered by YouTrip', W / 2, H - 130);

  return new Promise<Blob>((resolve) => {
    c.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export async function shareToIG(stats: ShareStats, gameOverBgImg: HTMLImageElement, trippieCoinsImg: HTMLImageElement): Promise<void> {
  const blob = await generateShareImage(stats, gameOverBgImg, trippieCoinsImg);
  const file = new File([blob], 'trippie-chomp-score.png', { type: 'image/png' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Trippie Chomp',
        text: `I saved S$${stats.score} on Trippie Chomp! Can you beat my score?`,
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') downloadImage(blob);
    }
  } else {
    downloadImage(blob);
  }
}

function downloadImage(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trippie-chomp-score.png';
  a.click();
  URL.revokeObjectURL(url);
}
