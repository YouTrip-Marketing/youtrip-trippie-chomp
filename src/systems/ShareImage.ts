/**
 * Generates a 1080x1920 share image for Instagram stories.
 * Exact replica of v1 share image generator.
 */
export interface ShareStats {
  score: number;
  level: number;
  dotsEaten: number;
  ghostsEaten: number;
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

  // Background
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

  // Card background
  const cardX = 60, cardY = 280, cardW = W - 120, cardH = 1100;
  x.fillStyle = 'rgba(30, 20, 50, 0.8)';
  x.beginPath();
  x.roundRect(cardX, cardY, cardW, cardH, 32);
  x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.12)';
  x.lineWidth = 2;
  x.stroke();

  // Title
  x.fillStyle = '#fff';
  x.font = '700 48px "Press Start 2P", monospace';
  x.textAlign = 'center';
  x.fillText('GAME OVER', W / 2, cardY + 80);

  // Trippie coins image
  if (trippieCoinsImg.complete && trippieCoinsImg.naturalWidth > 0) {
    const imgW = 400;
    const imgH = 400 * (trippieCoinsImg.naturalHeight / trippieCoinsImg.naturalWidth);
    x.drawImage(trippieCoinsImg, (W - imgW) / 2, cardY + 110, imgW, imgH);
  }

  // Score
  x.fillStyle = '#FFD700';
  x.font = '700 42px "Press Start 2P", monospace';
  x.fillText(`YOU SAVED S$${stats.score}!`, W / 2, cardY + 580);

  // Stat boxes
  const statY = cardY + 630, statH = 180, statGap = 20;
  const statW = (cardW - statGap * 4) / 3;
  const statData = [
    { label: 'CURRENCIES\nEATEN', val: stats.dotsEaten },
    { label: 'LEVEL\nREACHED', val: stats.level },
    { label: 'FEE MONSTERS\nEATEN', val: stats.ghostsEaten },
  ];

  statData.forEach((s, i) => {
    const sx2 = cardX + statGap + i * (statW + statGap);
    x.fillStyle = 'rgba(255,255,255,0.08)';
    x.beginPath();
    x.roundRect(sx2, statY, statW, statH, 20);
    x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.15)';
    x.lineWidth = 1;
    x.stroke();

    x.fillStyle = 'rgba(255,255,255,0.6)';
    x.font = '700 18px "Press Start 2P", monospace';
    const lines = s.label.split('\n');
    lines.forEach((line, li) => {
      x.fillText(line, sx2 + statW / 2, statY + 50 + li * 28);
    });

    x.fillStyle = '#fff';
    x.font = '700 48px "Press Start 2P", monospace';
    x.fillText(String(s.val), sx2 + statW / 2, statY + 145);
  });

  // CTA
  x.fillStyle = 'rgba(255,255,255,0.6)';
  x.font = '700 26px "Press Start 2P", monospace';
  x.fillText('STAND A CHANCE TO WIN', W / 2, statY + statH + 100);
  x.fillText('A YEAR OF TRAVEL', W / 2, statY + statH + 140);
  x.fillText('FUNDED BY US', W / 2, statY + statH + 180);

  // T&Cs
  x.fillStyle = 'rgba(255,255,255,0.25)';
  x.font = '700 16px "Press Start 2P", monospace';
  x.fillText('*T&Cs apply.', W / 2, statY + statH + 225);

  // Branding
  x.fillStyle = '#00D2C8';
  x.font = '700 28px "Press Start 2P", monospace';
  x.fillText('TRIPPIE CHOMP', W / 2, H - 200);
  x.fillStyle = 'rgba(255,255,255,0.4)';
  x.font = '700 18px "Press Start 2P", monospace';
  x.fillText('powered by YouTrip', W / 2, H - 160);

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
