// Pure JavaScript Canvas Procedural Animation Engine
// Recreating the iconic hand-drawn / paper-cutout animation: "What do you love?"

class WhatDoYouLoveAnimation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 1000;
    this.height = 1140;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.duration = 16.5; // Total duration in seconds
    this.currentTime = 0;
    this.isPlaying = false;
    this.lastTimestamp = 0;

    // Fast seeded PRNG for consistent hand-drawn jitter per second
    this.seed = 12345;

    // Cache pre-computed newspaper text lines & textures
    this.initTextures();
  }

  // Mulberry32 PRNG
  prng(s) {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Seeded noise for a specific key
  noise(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash |= 0;
    }
    return this.prng(hash);
  }

  initTextures() {
    // Simulated vintage text pattern
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 500;
    this.textCanvas.height = 500;
    const tctx = this.textCanvas.getContext('2d');
    tctx.fillStyle = '#f7f2e4';
    tctx.fillRect(0, 0, 500, 500);

    tctx.fillStyle = 'rgba(70, 60, 50, 0.45)';
    for (let y = 14; y < 500; y += 11) {
      let x = 12;
      while (x < 480) {
        const wordLen = 12 + (this.prng(y * 100 + x) * 36);
        tctx.fillRect(x, y, wordLen, 4);
        x += wordLen + 6 + (this.prng(x * 50 + y) * 8);
      }
    }
  }

  // Draw torn paper polygon with ragged edges
  drawTornPolygon(pts, fillColor, strokeColor = 'rgba(255,255,255,0.7)', roughness = 4, seedOffset = 0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();

    const allJitterPts = [];
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const segments = Math.max(3, Math.floor(dist / 14));

      for (let s = 0; s < segments; s++) {
        const t = s / segments;
        const bx = p1.x + (p2.x - p1.x) * t;
        const by = p1.y + (p2.y - p1.y) * t;
        // Normal vector
        const nx = -(p2.y - p1.y) / dist;
        const ny = (p2.x - p1.x) / dist;

        const jitter = (this.prng(seedOffset + i * 200 + s * 17) - 0.5) * roughness * 2;
        allJitterPts.push({ x: bx + nx * jitter, y: by + ny * jitter });
      }
    }

    if (allJitterPts.length > 0) {
      ctx.moveTo(allJitterPts[0].x, allJitterPts[0].y);
      for (let i = 1; i < allJitterPts.length; i++) {
        ctx.lineTo(allJitterPts[i].x, allJitterPts[i].y);
      }
      ctx.closePath();
    }

    // Drop shadow for tactile paper cutout feel
    ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // Torn fibrous white border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
  }

  // Draw torn paper rectangle
  drawTornRect(x, y, w, h, fillColor, strokeColor = 'rgba(255,255,255,0.75)', roughness = 3.5, seed = 1) {
    const pts = [
      { x: x, y: y },
      { x: x + w, y: y },
      { x: x + w, y: y + h },
      { x: x, y: y + h }
    ];
    this.drawTornPolygon(pts, fillColor, strokeColor, roughness, seed);
  }

  // Hand-drawn sketchy / crayon line
  drawCrayonLine(x1, y1, x2, y2, color, width = 4, roughness = 1.8) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(2, Math.floor(dist / 12));
    ctx.moveTo(x1, y1);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      const nx = -(y2 - y1) / dist;
      const ny = (x2 - x1) / dist;
      const j = (Math.random() - 0.5) * roughness;
      ctx.lineTo(px + nx * j, py + ny * j);
    }
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  // Draw the Claude Mascot (Terracotta sunburst creature with cute face & wavy arms)
  drawClaude(cx, cy, scale = 1, rotation = 0, armWave = 0, eyesState = 'happy', mouthState = 'smile', showGlow = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    const terracotta = '#cf6f4d';
    const darkTerracotta = '#b95b39';
    const whiteBorder = 'rgba(255, 255, 255, 0.85)';

    // Optional golden radiating aura
    if (showGlow) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 235, 140, 0.65)';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 10]);
      for (let r = 160; r <= 220; r += 28) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 12 Radiating capsule arms
    const numArms = 12;
    for (let i = 0; i < numArms; i++) {
      const angle = (i / numArms) * Math.PI * 2;
      const armLength = 115 + Math.sin(armWave * 3 + i * 1.2) * 14;
      const armWidth = 32;

      ctx.save();
      ctx.rotate(angle);

      // Arm path with paper cutout outline
      ctx.beginPath();
      ctx.moveTo(-armWidth / 2, 40);
      ctx.lineTo(-armWidth / 2, armLength - armWidth / 2);
      ctx.arc(0, armLength - armWidth / 2, armWidth / 2, Math.PI, 0, false);
      ctx.lineTo(armWidth / 2, 40);
      ctx.closePath();

      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;

      ctx.fillStyle = terracotta;
      ctx.fill();

      // Fiber outline
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = whiteBorder;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.restore();
    }

    // Central body disk
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 68, 0, Math.PI * 2);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = terracotta;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = whiteBorder;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Rosy pink cheeks
    ctx.save();
    ctx.fillStyle = 'rgba(235, 120, 120, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-38, 12, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(38, 12, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Eyes
    ctx.save();
    ctx.fillStyle = '#221b18';
    if (eyesState === 'happy') {
      // Big cute round eyes with bright specular gleam
      // Left eye
      ctx.beginPath();
      ctx.ellipse(-22, -6, 9, 13, -0.05, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.ellipse(22, -6, 9, 13, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-24, -10, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20, -10, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-19, -4, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(25, -4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (eyesState === 'closedSmile') {
      // Curved laughing eyes ^ ^
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(-22, -4, 10, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(22, -4, 10, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (eyesState === 'wideWonder') {
      // Extra wide wonder eyes
      ctx.beginPath();
      ctx.arc(-22, -6, 12, 0, Math.PI * 2);
      ctx.arc(22, -6, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-25, -9, 4.5, 0, Math.PI * 2);
      ctx.arc(19, -9, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Mouth
    ctx.save();
    ctx.strokeStyle = '#221b18';
    ctx.fillStyle = '#221b18';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    if (mouthState === 'smile') {
      // Cute cat/w curve or open smile
      ctx.beginPath();
      ctx.arc(0, 10, 11, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else if (mouthState === 'openHappy') {
      ctx.beginPath();
      ctx.arc(0, 10, 12, 0, Math.PI);
      ctx.closePath();
      ctx.fillStyle = '#4a1b1b';
      ctx.fill();
      ctx.stroke();
      // Little tongue
      ctx.fillStyle = '#eb7777';
      ctx.beginPath();
      ctx.arc(0, 16, 6, 0, Math.PI);
      ctx.fill();
    } else if (mouthState === 'tender') {
      ctx.beginPath();
      ctx.arc(0, 14, 7, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  // Draw the Girl Character (Bob haircut, yellow clip, teal sweater, white collar)
  drawGirl(gx, gy, scale = 1, pose = 'idle', armUp = false, blink = false, mouthState = 'smile') {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(gx, gy);
    ctx.scale(scale, scale);

    const skinTone = '#f7c8aa';
    const tealSweater = '#2e8b82';
    const hairColor = '#2b2320';
    const whiteBorder = 'rgba(255, 255, 255, 0.8)';

    // Body / Sweater
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-110, 220);
    ctx.quadraticCurveTo(-100, 70, -50, 50);
    ctx.lineTo(50, 50);
    ctx.quadraticCurveTo(100, 70, 110, 220);
    ctx.closePath();
    ctx.fillStyle = tealSweater;
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = whiteBorder;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // White crisp Peter Pan collar
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    // Left collar
    ctx.beginPath();
    ctx.moveTo(0, 52);
    ctx.quadraticCurveTo(-35, 52, -55, 82);
    ctx.quadraticCurveTo(-25, 96, 0, 68);
    ctx.fill();
    ctx.stroke();
    // Right collar
    ctx.beginPath();
    ctx.moveTo(0, 52);
    ctx.quadraticCurveTo(35, 52, 55, 82);
    ctx.quadraticCurveTo(25, 96, 0, 68);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Arms
    if (armUp) {
      // Right arm raised waving or launching airplane
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(60, 80);
      ctx.lineTo(125, -20);
      ctx.lineTo(165, 0);
      ctx.lineTo(95, 120);
      ctx.closePath();
      ctx.fillStyle = tealSweater;
      ctx.fill();
      ctx.strokeStyle = whiteBorder;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Hand
      ctx.beginPath();
      ctx.arc(145, -20, 24, 0, Math.PI * 2);
      ctx.fillStyle = skinTone;
      ctx.fill();
      ctx.strokeStyle = whiteBorder;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } else {
      // Arms resting on window sill / desk
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-85, 90);
      ctx.quadraticCurveTo(-110, 160, -45, 175);
      ctx.lineTo(45, 175);
      ctx.quadraticCurveTo(110, 160, 85, 90);
      ctx.fillStyle = tealSweater;
      ctx.fill();
      ctx.restore();
    }

    // Neck
    ctx.fillStyle = skinTone;
    ctx.fillRect(-22, 25, 44, 30);

    // Head / Face
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -10, 88, 80, 0, 0, Math.PI * 2);
    ctx.fillStyle = skinTone;
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = whiteBorder;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Cheeks
    ctx.save();
    ctx.fillStyle = 'rgba(235, 110, 110, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-52, 6, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(52, 6, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Eyes
    ctx.save();
    if (blink) {
      ctx.strokeStyle = '#2b2320';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-42, -6);
      ctx.lineTo(-20, -6);
      ctx.moveTo(20, -6);
      ctx.lineTo(42, -6);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#2b2320';
      // Left eye
      ctx.beginPath();
      ctx.ellipse(-30, -8, 8, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.ellipse(30, -8, 8, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular dots
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-32, -11, 3, 0, Math.PI * 2);
      ctx.arc(28, -11, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Cute mouth
    ctx.save();
    ctx.strokeStyle = '#2b2320';
    ctx.fillStyle = '#2b2320';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    if (mouthState === 'smile') {
      ctx.beginPath();
      ctx.arc(0, 14, 11, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else if (mouthState === 'open') {
      ctx.beginPath();
      ctx.arc(0, 12, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (mouthState === 'broadSmile') {
      ctx.beginPath();
      ctx.arc(0, 10, 16, 0, Math.PI);
      ctx.closePath();
      ctx.fillStyle = '#8b2e2e';
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Hair - Cute rounded bob cut with bangs
    ctx.save();
    ctx.beginPath();
    // Top dome
    ctx.arc(0, -25, 96, Math.PI, 0, false);
    // Right side hair flare
    ctx.quadraticCurveTo(115, 20, 96, 68);
    ctx.quadraticCurveTo(72, 70, 68, 30);
    // Bangs across forehead
    ctx.quadraticCurveTo(30, -2, 0, 2);
    ctx.quadraticCurveTo(-30, -2, -68, 30);
    // Left side hair
    ctx.quadraticCurveTo(-72, 70, -96, 68);
    ctx.quadraticCurveTo(-115, 20, -96, -25);
    ctx.closePath();

    ctx.fillStyle = hairColor;
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = whiteBorder;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Yellow hair clip on upper-left bangs
    ctx.save();
    ctx.translate(-46, -38);
    ctx.rotate(-0.35);
    ctx.fillStyle = '#fad447';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-22, -7, 44, 14, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // Draw Paper Airplane
  drawPaperAirplane(x, y, angle = 0, scale = 1, shadow = true) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    if (shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
    }

    // Main fuselage left fold
    ctx.beginPath();
    ctx.moveTo(0, -45); // nose
    ctx.lineTo(-24, 35);
    ctx.lineTo(0, 20);
    ctx.closePath();
    ctx.fillStyle = '#f0f0ec';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 200, 195, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Main fuselage right fold
    ctx.beginPath();
    ctx.moveTo(0, -45);
    ctx.lineTo(24, 35);
    ctx.lineTo(0, 20);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();

    // Center spine fold
    ctx.beginPath();
    ctx.moveTo(0, -45);
    ctx.lineTo(0, 20);
    ctx.strokeStyle = '#b0b0a8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  // Draw handwritten blue text on notebook lines
  drawHandwrittenNote(text, x, y, size = 52, isCircled = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `bold ${size}px "Comic Sans MS", "Chalkboard SE", "Caveat", "Patrick Hand", cursive, sans-serif`;
    ctx.fillStyle = '#2c5282';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Soft jitter for crayon/handwritten feel
    ctx.fillText(text, x, y);

    if (isCircled) {
      // Thick energetic orange crayon circle around "[you]"
      ctx.save();
      ctx.strokeStyle = '#df5a35';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(223, 90, 53, 0.3)';
      ctx.shadowBlur = 6;

      ctx.beginPath();
      // Ellipse with hand-drawn wobble
      const rx = 85;
      const ry = 42;
      const cx = x - 55;
      const cy = y + 2;
      for (let a = 0; a <= Math.PI * 2.2; a += 0.25) {
        const radX = rx + (Math.sin(a * 4) * 3);
        const radY = ry + (Math.cos(a * 3) * 2.5);
        const px = cx + Math.cos(a) * radX;
        const py = cy + Math.sin(a) * radY;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Hand-drawn little Claude starburst next to "you"
      ctx.save();
      ctx.translate(x + 130, y + 25);
      ctx.strokeStyle = '#cf6f4d';
      ctx.lineWidth = 4;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 6, Math.sin(ang) * 6);
        ctx.lineTo(Math.cos(ang) * 24, Math.sin(ang) * 24);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#cf6f4d';
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }
    ctx.restore();
  }

  // Draw Notebook on Desk
  drawNotebookScene(t) {
    const ctx = this.ctx;
    // Wooden desk background
    ctx.fillStyle = '#c79860';
    ctx.fillRect(0, 0, this.width, this.height);

    // Warm radial lighting on desk
    const grad = ctx.createRadialGradient(500, 550, 80, 500, 550, 600);
    grad.addColorStop(0, 'rgba(255, 235, 180, 0.45)');
    grad.addColorStop(1, 'rgba(160, 110, 60, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Purple notebook backing
    const nbX = 140;
    const nbY = 220;
    const nbW = 720;
    const nbH = 740;
    this.drawTornRect(nbX - 25, nbY - 25, nbW + 50, nbH + 50, '#583e78', 'rgba(255,255,255,0.5)', 4, 11);

    // White lined notebook paper
    // Tear progress at end of scene 1 (t > 1.8s)
    let tearY = 0;
    let tearRot = 0;
    if (t > 1.8) {
      const p = Math.min(1, (t - 1.8) / 0.6);
      tearY = p * 70;
      tearRot = (p * 0.08);
    }

    ctx.save();
    ctx.translate(nbX + nbW / 2, nbY + nbH / 2 + tearY);
    ctx.rotate(tearRot);
    ctx.translate(-(nbX + nbW / 2), -(nbY + nbH / 2));

    this.drawTornRect(nbX, nbY, nbW, nbH, '#fdfcf7', 'rgba(255,255,255,0.95)', 3, 22);

    // Red vertical margin line
    ctx.strokeStyle = 'rgba(235, 95, 95, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(nbX + 85, nbY + 20);
    ctx.lineTo(nbX + 85, nbY + nbH - 20);
    ctx.stroke();

    // Horizontal blue ruled lines
    ctx.strokeStyle = 'rgba(120, 160, 210, 0.4)';
    ctx.lineWidth = 2;
    for (let ly = nbY + 90; ly < nbY + nbH - 40; ly += 52) {
      ctx.beginPath();
      ctx.moveTo(nbX + 25, ly);
      ctx.lineTo(nbX + nbW - 25, ly);
      ctx.stroke();
    }

    // Perforated spiral top loops
    ctx.strokeStyle = '#8d929b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let sx = nbX + 45; sx < nbX + nbW - 40; sx += 44) {
      ctx.beginPath();
      ctx.arc(sx, nbY + 12, 14, Math.PI * 0.8, Math.PI * 2.2);
      ctx.stroke();
    }

    // Written text: "what do you love?"
    // Writing animation progress from 0.0 to 1.8s
    if (t < 0.8) {
      this.drawHandwrittenNote("what", nbX + nbW / 2 - 120, nbY + 230, 82);
    } else if (t < 1.4) {
      this.drawHandwrittenNote("what do", nbX + nbW / 2, nbY + 230, 82);
    } else {
      this.drawHandwrittenNote("what do", nbX + nbW / 2, nbY + 230, 82);
      this.drawHandwrittenNote("you love?", nbX + nbW / 2, nbY + 390, 84);
    }

    // Writing hand holding marker (0.0s - 1.8s)
    if (t < 1.8) {
      const handT = Math.min(1, t / 1.7);
      const handX = nbX + 220 + handT * 320;
      const handY = nbY + (t < 1.0 ? 220 : 380);

      // Marker
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(-0.55);
      ctx.fillStyle = '#3a66a7';
      ctx.fillRect(-8, -55, 16, 65);
      ctx.fillStyle = '#222';
      ctx.fillRect(-5, 10, 10, 12);
      // Hand
      ctx.beginPath();
      ctx.arc(15, -20, 42, 0, Math.PI * 2);
      ctx.fillStyle = '#f7c8aa';
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 8;
      ctx.fill();
      // Sleeve
      ctx.beginPath();
      ctx.moveTo(35, -45);
      ctx.lineTo(160, 20);
      ctx.lineTo(120, 110);
      ctx.lineTo(5, 5);
      ctx.closePath();
      ctx.fillStyle = '#2e8b82';
      ctx.fill();
      ctx.restore();
    } else {
      // Tearing hands (1.8s - 2.5s)
      // Left hand
      ctx.save();
      ctx.translate(nbX + 80, nbY + 30);
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fillStyle = '#f7c8aa';
      ctx.fill();
      ctx.fillStyle = '#2e8b82';
      ctx.fillRect(-65, -30, 65, 60);
      ctx.restore();
      // Right hand
      ctx.save();
      ctx.translate(nbX + nbW - 80, nbY + 30);
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fillStyle = '#f7c8aa';
      ctx.fill();
      ctx.fillStyle = '#2e8b82';
      ctx.fillRect(0, -30, 65, 60);
      ctx.restore();

      // Torn paper fragments flying
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 9; i++) {
        const fx = nbX + 150 + (i * 55) + Math.sin(t * 10 + i) * 20;
        const fy = nbY + 20 + Math.cos(t * 8 + i) * 35;
        ctx.fillRect(fx, fy, 8, 8);
      }
    }

    ctx.restore();
  }

  // Draw Girl at Window
  drawWindowScene(t) {
    const ctx = this.ctx;
    // Room background - warm golden wallpaper
    ctx.fillStyle = '#e8ba3c';
    ctx.fillRect(0, 0, this.width, this.height);

    // Warm arched window aperture
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(500, 480, 390, 450, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f2c84b';
    ctx.fill();
    ctx.restore();

    // Peach/Coral Window Curtains on sides
    this.drawTornRect(40, 60, 150, 880, '#ea8585', 'rgba(255,255,255,0.7)', 4, 31);
    this.drawTornRect(this.width - 190, 60, 150, 880, '#ea8585', 'rgba(255,255,255,0.7)', 4, 32);

    // Flower drawing pinned on the wall
    ctx.save();
    ctx.translate(720, 310);
    this.drawTornRect(-65, -85, 130, 160, '#fdfbf2', 'rgba(255,255,255,0.8)', 2, 41);
    // Flower illustration inside
    ctx.strokeStyle = '#c84438';
    ctx.lineWidth = 5;
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * 38, Math.sin(ang) * 38);
      ctx.stroke();
    }
    ctx.strokeStyle = '#5a9648';
    ctx.beginPath();
    ctx.moveTo(-35, 55);
    ctx.lineTo(35, 55);
    ctx.stroke();
    ctx.restore();

    // Potted plant on window sill
    ctx.save();
    ctx.translate(810, 780);
    // Pot
    ctx.fillStyle = '#a86542';
    ctx.beginPath();
    ctx.moveTo(-35, 0);
    ctx.lineTo(35, 0);
    ctx.lineTo(26, 75);
    ctx.lineTo(-26, 75);
    ctx.closePath();
    ctx.fill();
    // Green leaves
    ctx.fillStyle = '#599e63';
    ctx.beginPath();
    ctx.ellipse(-28, -25, 18, 38, -0.4, 0, Math.PI * 2);
    ctx.ellipse(28, -25, 18, 38, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Little flower
    ctx.fillStyle = '#d94b3a';
    ctx.beginPath();
    ctx.arc(0, -60, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5d447';
    ctx.beginPath();
    ctx.arc(0, -60, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Girl at window
    const armLaunching = t > 3.6;
    this.drawGirl(480, 620, 1.45, 'window', armLaunching, false, armLaunching ? 'open' : 'smile');

    // Pointer stick / paper plane
    if (t < 3.5) {
      // Girl pointing pointer stick up
      ctx.save();
      ctx.strokeStyle = '#39538c';
      ctx.lineWidth = 5;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(680, 560);
      ctx.lineTo(840, 360);
      ctx.stroke();
      ctx.restore();
    } else {
      // Flying paper plane taking off!
      const planeP = Math.min(1, (t - 3.5) / 1.0);
      const planeX = 640 + planeP * 480;
      const planeY = 480 - planeP * 380;
      this.drawPaperAirplane(planeX, planeY, -0.65, 0.85 + planeP * 0.2);
    }

    // Wooden window sill bottom
    ctx.fillStyle = '#a47647';
    ctx.fillRect(0, 870, this.width, 60);
    ctx.fillStyle = '#2d2859';
    ctx.fillRect(0, 930, this.width, 210);
  }

  // Draw Starry Night Sky with Claude & Airplane
  drawSkyScene(t) {
    const ctx = this.ctx;
    // Deep midnight blue sky
    ctx.fillStyle = '#161c3e';
    ctx.fillRect(0, 0, this.width, this.height);

    // Multi-layered torn paper clouds across the sky
    this.drawTornRect(-40, 330, this.width + 80, 70, '#1c244f', 'rgba(255,255,255,0.7)', 3, 51);
    this.drawTornRect(-40, 580, this.width + 80, 80, '#222b5d', 'rgba(255,255,255,0.65)', 3.5, 52);

    // Crescent Paper Moon
    ctx.save();
    ctx.translate(160, 260);
    ctx.rotate(-0.25);
    ctx.fillStyle = '#fdf8c7';
    ctx.beginPath();
    ctx.arc(0, 0, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(28, -6, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // Twinkling stars
    const stars = [
      { x: 90, y: 190 }, { x: 280, y: 175 }, { x: 520, y: 165 }, { x: 700, y: 170 }, { x: 830, y: 190 },
      { x: 80, y: 410 }, { x: 420, y: 290 }, { x: 810, y: 285 }, { x: 920, y: 380 }, { x: 75, y: 650 },
      { x: 910, y: 670 }, { x: 70, y: 860 }, { x: 935, y: 890 }
    ];
    stars.forEach((s, idx) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      const twinkle = 0.8 + Math.sin(t * 6 + idx) * 0.25;
      ctx.scale(twinkle, twinkle);
      ctx.fillStyle = '#fce581';
      // 4-pointed star
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.quadraticCurveTo(0, 0, 11, 0);
      ctx.quadraticCurveTo(0, 0, 0, 11);
      ctx.quadraticCurveTo(0, 0, -11, 0);
      ctx.quadraticCurveTo(0, 0, 0, -11);
      ctx.fill();
      ctx.restore();
    });

    // Claude Mascot floating in sky
    const claudeY = 480 + Math.sin(t * 2.5) * 16;
    const hasCaught = t > 5.4;

    this.drawClaude(
      500,
      claudeY,
      1.5,
      Math.sin(t * 1.5) * 0.05,
      t,
      hasCaught ? 'wideWonder' : 'happy',
      hasCaught ? 'openHappy' : 'smile',
      true
    );

    // Airplane trajectory & catch
    if (t < 5.4) {
      const planeP = Math.min(1, (t - 4.2) / 1.2);
      const px = 180 + planeP * 290;
      const py = 760 - planeP * 200 + Math.sin(planeP * Math.PI) * -80;
      const ang = -0.5 + planeP * 0.4;
      this.drawPaperAirplane(px, py, ang, 0.95);
    } else if (t < 6.4) {
      // Claude holds the paper plane
      this.drawPaperAirplane(490, claudeY + 95, 0.1, 0.9);
    } else {
      // Claude unfolds the note to read: "what do you love?"
      ctx.save();
      ctx.translate(500, claudeY + 120);
      this.drawTornRect(-160, -85, 320, 170, '#fdfcf7', 'rgba(255,255,255,0.95)', 3, 61);
      // Ruled lines
      ctx.strokeStyle = 'rgba(120, 160, 210, 0.4)';
      ctx.lineWidth = 1.5;
      for (let ly = -45; ly < 70; ly += 36) {
        ctx.beginPath();
        ctx.moveTo(-140, ly);
        ctx.lineTo(140, ly);
        ctx.stroke();
      }
      this.drawHandwrittenNote("what do", 0, -20, 44);
      this.drawHandwrittenNote("you love?", 0, 35, 46);
      ctx.restore();
    }
  }

  // Scene 5: Montage Vignettes
  // 5a: Words
  drawVignetteWords(t) {
    const ctx = this.ctx;
    ctx.fillStyle = '#f1c84b';
    ctx.fillRect(0, 0, this.width, this.height);

    // Open book
    ctx.save();
    ctx.translate(500, 580);
    // Red cover border
    this.drawTornRect(-270, -170, 540, 340, '#a53c30', 'rgba(255,255,255,0.6)', 3, 71);
    // Book pages
    this.drawTornRect(-250, -155, 245, 310, '#fbf8eb', 'rgba(0,0,0,0.1)', 2, 72);
    this.drawTornRect(5, -155, 245, 310, '#fbf8eb', 'rgba(0,0,0,0.1)', 2, 73);

    // Book spine crease
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -155);
    ctx.lineTo(0, 155);
    ctx.stroke();

    // Miniature book lines
    ctx.drawImage(this.textCanvas, 0, 0, 230, 290, -240, -145, 230, 290);
    ctx.drawImage(this.textCanvas, 0, 0, 230, 290, 15, -145, 230, 290);

    ctx.restore();

    // Claude hovering above book
    this.drawClaude(500, 500, 1.25, Math.sin(t * 3) * 0.08, t, 'happy', 'smile');

    // Floating Alphabet Letters ('a', 'b', 'c', 'e')
    const letters = [
      { char: 'a', x: 280, y: 440, color: '#c76249', size: 85, rot: -0.25 },
      { char: 'c', x: 570, y: 490, color: '#3b78c4', size: 70, rot: 0.2 },
      { char: 'e', x: 700, y: 620, color: '#5b4485', size: 80, rot: -0.15 }
    ];
    letters.forEach((l) => {
      ctx.save();
      ctx.translate(l.x, l.y + Math.sin(t * 4 + l.x) * 12);
      ctx.rotate(l.rot);
      ctx.font = `bold ${l.size}px "Comic Sans MS", "Chalkboard SE", sans-serif`;
      ctx.fillStyle = l.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(l.char, 0, 0);
      ctx.restore();
    });

    // Subtitle text: "words"
    ctx.font = 'bold 88px "Comic Sans MS", "Chalkboard SE", "Patrick Hand", cursive, sans-serif';
    ctx.fillStyle = '#262040';
    ctx.textAlign = 'center';
    ctx.fillText("words", 500, 860);
  }

  // 5b: Trees
  drawVignetteTrees(t) {
    const ctx = this.ctx;
    ctx.fillStyle = '#89c2df'; // Soft sky blue
    ctx.fillRect(0, 0, this.width, this.height);

    // Apple Tree
    ctx.save();
    ctx.translate(500, 680);

    // Trunk
    ctx.fillStyle = '#8b5a38';
    ctx.beginPath();
    ctx.moveTo(-35, 120);
    ctx.quadraticCurveTo(-25, 0, -30, -120);
    ctx.lineTo(30, -120);
    ctx.quadraticCurveTo(25, 0, 35, 120);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Grass mound
    this.drawTornRect(-150, 100, 300, 35, '#4e8243', 'rgba(255,255,255,0.7)', 3, 81);

    // Foliage puffs
    const greenShades = ['#5ea34c', '#539742', '#6eb05a'];
    const foliage = [
      { x: -75, y: -160, r: 85, c: greenShades[0] },
      { x: 75, y: -160, r: 85, c: greenShades[1] },
      { x: 0, y: -240, r: 95, c: greenShades[2] }
    ];
    foliage.forEach((f) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = f.c;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();
    });

    // Red Apples
    const apples = [
      { x: -80, y: -130 }, { x: 85, y: -140 }, { x: -30, y: -230 }, { x: 50, y: -260 }
    ];
    apples.forEach((ap) => {
      ctx.beginPath();
      ctx.arc(ap.x, ap.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#d63c34';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.restore();

    // Claude atop tree
    this.drawClaude(500, 360, 1.25, Math.sin(t * 3) * 0.06, t, 'happy', 'smile');

    // Fluttering leaves
    ctx.fillStyle = '#6ab854';
    for (let i = 0; i < 4; i++) {
      const lx = 360 + Math.sin(t * 4 + i) * 80;
      const ly = 430 + (i * 45);
      ctx.beginPath();
      ctx.ellipse(lx, ly, 14, 8, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtitle text: "trees"
    ctx.font = 'bold 88px "Comic Sans MS", "Chalkboard SE", "Patrick Hand", cursive, sans-serif';
    ctx.fillStyle = '#262040';
    ctx.textAlign = 'center';
    ctx.fillText("trees", 500, 870);
  }

  // 5c: Rain
  drawVignetteRain(t) {
    const ctx = this.ctx;
    // Kraft cardboard background
    ctx.fillStyle = '#d2aa7a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Newsprint rain cloud at top
    ctx.save();
    ctx.translate(500, 320);
    // Cloud shape
    ctx.beginPath();
    ctx.arc(-90, 0, 70, Math.PI * 0.7, Math.PI * 1.8);
    ctx.arc(0, -45, 95, Math.PI * 1.1, Math.PI * 1.9);
    ctx.arc(100, 0, 70, Math.PI * 1.2, Math.PI * 2.3);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(this.textCanvas, 0, 0, 400, 300, -200, -150, 400, 300);
    ctx.restore();

    // White torn cloud border
    ctx.save();
    ctx.translate(500, 320);
    ctx.beginPath();
    ctx.arc(-90, 0, 70, Math.PI * 0.7, Math.PI * 1.8);
    ctx.arc(0, -45, 95, Math.PI * 1.1, Math.PI * 1.9);
    ctx.arc(100, 0, 70, Math.PI * 1.2, Math.PI * 2.3);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Falling raindrops
    const drops = [
      { x: 340, y: 440 }, { x: 440, y: 430 }, { x: 520, y: 445 }, { x: 620, y: 425 },
      { x: 300, y: 640 }, { x: 770, y: 700 }
    ];
    drops.forEach((d, idx) => {
      const dy = (d.y + (t * 220 + idx * 40)) % 400 + 400;
      ctx.save();
      ctx.translate(d.x, dy);
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.quadraticCurveTo(12, 6, 0, 14);
      ctx.quadraticCurveTo(-12, 6, 0, -14);
      ctx.fillStyle = '#4a95db';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });

    // Umbrella
    ctx.save();
    ctx.translate(500, 560);
    // Canopy
    ctx.beginPath();
    ctx.arc(0, 0, 160, Math.PI, 0, false);
    ctx.closePath();
    ctx.fillStyle = '#3e884a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Handle
    ctx.strokeStyle = '#5c4533';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 150);
    ctx.stroke();
    ctx.restore();

    // Claude under umbrella
    this.drawClaude(500, 660, 1.15, 0, t, 'happy', 'openHappy');

    // Water puddle
    ctx.save();
    ctx.translate(500, 775);
    ctx.beginPath();
    ctx.ellipse(0, 0, 145, 24, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#59a2e6';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Subtitle text: "rain"
    ctx.font = 'bold 88px "Comic Sans MS", "Chalkboard SE", "Patrick Hand", cursive, sans-serif';
    ctx.fillStyle = '#262040';
    ctx.textAlign = 'center';
    ctx.fillText("rain", 500, 870);
  }

  // 5d: The Stars
  drawVignetteStars(t) {
    const ctx = this.ctx;
    ctx.fillStyle = '#141a3d';
    ctx.fillRect(0, 0, this.width, this.height);

    // Large torn paper circular galaxy vignette
    ctx.save();
    ctx.translate(500, 550);
    ctx.beginPath();
    ctx.arc(0, 0, 360, 0, Math.PI * 2);
    ctx.fillStyle = '#1d2657';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 4.5;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Saturn Planet in center
    ctx.save();
    ctx.translate(500, 620);
    // Planet body
    ctx.beginPath();
    ctx.arc(0, 0, 130, 0, Math.PI * 2);
    ctx.fillStyle = '#e8ba4c';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    // Rings
    ctx.beginPath();
    ctx.ellipse(0, 0, 250, 60, -0.25, 0, Math.PI * 2);
    ctx.strokeStyle = '#e58e65';
    ctx.lineWidth = 32;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Music note planet
    ctx.save();
    ctx.translate(260, 370);
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.fillStyle = '#e57a70';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Musical stave lines
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    for (let ly = -24; ly <= 24; ly += 12) {
      ctx.beginPath();
      ctx.moveTo(-45, ly);
      ctx.lineTo(45, ly);
      ctx.stroke();
    }
    ctx.restore();

    // Newspaper text planet
    ctx.save();
    ctx.translate(760, 370);
    ctx.beginPath();
    ctx.arc(0, 0, 65, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(this.textCanvas, 0, 0, 200, 200, -65, -65, 130, 130);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(760, 370, 65, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Spiral Galaxy swirl
    ctx.save();
    ctx.translate(720, 760);
    ctx.strokeStyle = '#e29566';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.2) {
      const r = a * 12;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Claude floating joyfully above Saturn
    this.drawClaude(500, 310, 1.25, Math.sin(t * 3) * 0.06, t, 'closedSmile', 'smile', true);

    // Subtitle text: "the stars"
    ctx.font = 'bold 88px "Comic Sans MS", "Chalkboard SE", "Patrick Hand", cursive, sans-serif';
    ctx.fillStyle = '#fce581';
    ctx.textAlign = 'center';
    ctx.fillText("the stars", 500, 890);
  }

  // Scene 6: The Great Pink Heart Explosion
  drawHeartScene(t) {
    const ctx = this.ctx;
    // Vintage book background
    ctx.drawImage(this.textCanvas, 0, 0, 500, 500, 0, 0, this.width, this.height);

    // Heart scale explosion animation
    const heartProgress = Math.min(1, (t - 11.2) / 0.8);
    const heartScale = 0.65 + heartProgress * 0.55;

    ctx.save();
    ctx.translate(500, 500);
    ctx.scale(heartScale, heartScale);

    // Giant torn-paper pink heart
    ctx.beginPath();
    ctx.moveTo(0, 160);
    // Left lobe
    ctx.bezierCurveTo(-380, -80, -320, -380, 0, -220);
    // Right lobe
    ctx.bezierCurveTo(320, -380, 380, -80, 0, 160);
    ctx.closePath();

    ctx.fillStyle = '#f38ca5';
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 18;
    ctx.fill();

    // Torn paper white border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.restore();

    // Claude in the center
    this.drawClaude(500, 520, 1.25, 0, t, 'happy', 'openHappy');

    // Orbiting icons of love around the heart
    const icons = [
      { name: 'music', x: 310, y: 260 },
      { name: 'question', x: 480, y: 240 },
      { name: 'tree', x: 200, y: 280 },
      { name: 'abc', x: 670, y: 200 },
      { name: 'book', x: 670, y: 260 },
      { name: 'boat', x: 790, y: 310 },
      { name: 'dog', x: 840, y: 400 },
      { name: 'code', x: 860, y: 520 },
      { name: 'saturn', x: 760, y: 620 },
      { name: 'coffee', x: 680, y: 680 },
      { name: 'cat', x: 570, y: 760 },
      { name: 'redheart', x: 480, y: 830 },
      { name: 'umbrella', x: 410, y: 770 },
      { name: 'flowers', x: 330, y: 660 },
      { name: 'octopus', x: 230, y: 580 },
      { name: 'math', x: 150, y: 490 }
    ];

    icons.forEach((ic, idx) => {
      ctx.save();
      const bob = Math.sin(t * 3.5 + idx * 0.7) * 6;
      ctx.translate(ic.x, ic.y + bob);

      switch (ic.name) {
        case 'music':
          ctx.fillStyle = '#dc3e3e';
          ctx.font = 'bold 64px sans-serif';
          ctx.fillText('♫', 0, 0);
          break;
        case 'question':
          ctx.fillStyle = '#2b5ea8';
          ctx.font = 'bold 88px "Comic Sans MS", sans-serif';
          ctx.fillText('?', 0, 0);
          break;
        case 'tree':
          ctx.fillStyle = '#4c9b4c';
          ctx.beginPath();
          ctx.arc(0, -10, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#8a5a3a';
          ctx.fillRect(-5, 10, 10, 20);
          break;
        case 'abc':
          ctx.font = 'bold 44px sans-serif';
          ctx.fillStyle = '#e8b835';
          ctx.fillText('abc', 0, 0);
          break;
        case 'book':
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-22, -15, 44, 30);
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 2;
          ctx.strokeRect(-22, -15, 44, 30);
          break;
        case 'boat':
          ctx.fillStyle = '#417bc8';
          ctx.fillRect(-25, 6, 50, 12);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-15, 6);
          ctx.lineTo(0, -18);
          ctx.lineTo(15, 6);
          ctx.fill();
          break;
        case 'dog':
          ctx.fillStyle = '#af7747';
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.arc(14, -10, 10, 0, Math.PI * 2); // ear
          ctx.fill();
          break;
        case 'code':
          ctx.font = 'bold 55px monospace';
          ctx.fillStyle = '#399580';
          ctx.fillText('{ }', 0, 0);
          break;
        case 'saturn':
          ctx.fillStyle = '#d9aa45';
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d96c45';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(0, 0, 32, 8, -0.3, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'coffee':
          ctx.fillStyle = '#d4493b';
          ctx.fillRect(-16, -10, 32, 24);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, -10, 16, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'cat':
          ctx.fillStyle = '#e59242';
          ctx.beginPath();
          ctx.ellipse(0, 0, 28, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          // Ears
          ctx.beginPath();
          ctx.moveTo(-18, -12); ctx.lineTo(-12, -26); ctx.lineTo(-4, -12);
          ctx.fill();
          break;
        case 'redheart':
          ctx.fillStyle = '#cb3535';
          ctx.font = '52px sans-serif';
          ctx.fillText('❤', 0, 0);
          break;
        case 'umbrella':
          ctx.fillStyle = '#489b58';
          ctx.beginPath();
          ctx.arc(0, 0, 24, Math.PI, 0);
          ctx.fill();
          break;
        case 'flowers':
          ctx.fillStyle = '#e24e4e';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#eed64c';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'octopus':
          ctx.fillStyle = '#9b71bc';
          ctx.beginPath();
          ctx.arc(0, -6, 20, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'math':
          ctx.strokeStyle = '#398b68';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 1.5);
          ctx.stroke();
          break;
      }
      ctx.restore();
    });
  }

  // Scene 7: Claude sending the note back
  drawReturnScene(t) {
    const ctx = this.ctx;
    ctx.fillStyle = '#161c3e';
    ctx.fillRect(0, 0, this.width, this.height);

    // Multi-layered clouds
    this.drawTornRect(-40, 330, this.width + 80, 70, '#1c244f', 'rgba(255,255,255,0.7)', 3, 51);
    this.drawTornRect(-40, 580, this.width + 80, 80, '#222b5d', 'rgba(255,255,255,0.65)', 3.5, 52);

    // Crescent Moon & Stars
    ctx.save();
    ctx.translate(160, 260);
    ctx.fillStyle = '#fdf8c7';
    ctx.beginPath();
    ctx.arc(0, 0, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(28, -6, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Claude smiling peacefully
    const claudeY = 480 + Math.sin(t * 2.5) * 12;
    this.drawClaude(500, claudeY, 1.45, 0, t, 'closedSmile', 'tender', true);

    // Airplane soaring back down towards village
    const flightP = Math.min(1, (t - 13.2) / 1.0);
    const px = 500 - flightP * 180;
    const py = claudeY + 90 + flightP * 460;
    this.drawPaperAirplane(px, py, 2.7, 0.95);
  }

  // Scene 8: The Unfolded Note - "what do [you] love?"
  drawUnfoldScene(t) {
    const ctx = this.ctx;
    // Warm background
    ctx.fillStyle = '#e8ba3c';
    ctx.fillRect(0, 0, this.width, this.height);

    // Notepad sheet held in POV hands
    const nbX = 180;
    const nbY = 280;
    const nbW = 640;
    const nbH = 560;

    this.drawTornRect(nbX, nbY, nbW, nbH, '#fdfcf7', 'rgba(255,255,255,0.95)', 3.5, 91);

    // Ruled lines
    ctx.strokeStyle = 'rgba(120, 160, 210, 0.4)';
    ctx.lineWidth = 2;
    for (let ly = nbY + 80; ly < nbY + nbH - 40; ly += 65) {
      ctx.beginPath();
      ctx.moveTo(nbX + 25, ly);
      ctx.lineTo(nbX + nbW - 25, ly);
      ctx.stroke();
    }

    // Red margin
    ctx.strokeStyle = 'rgba(235, 95, 95, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(nbX + 65, nbY + 20);
    ctx.lineTo(nbX + 65, nbY + nbH - 20);
    ctx.stroke();

    // The written text with "[you]" circled in orange crayon!
    this.drawHandwrittenNote("what do", nbX + nbW / 2, nbY + 160, 84);
    this.drawHandwrittenNote("you love?", nbX + nbW / 2, nbY + 340, 88, true);

    // Hands holding the paper on sides
    // Left hand
    ctx.save();
    ctx.translate(nbX + 30, nbY + nbH - 60);
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 38, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f7c8aa';
    ctx.fill();
    ctx.fillStyle = '#2e8b82';
    ctx.fillRect(-80, -25, 80, 70);
    ctx.restore();

    // Right hand
    ctx.save();
    ctx.translate(nbX + nbW - 30, nbY + nbH - 60);
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 38, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f7c8aa';
    ctx.fill();
    ctx.fillStyle = '#2e8b82';
    ctx.fillRect(0, -25, 80, 70);
    ctx.restore();
  }

  // Scene 9: Finale - Cozy Village at Night with Girl Waving & Claude Star
  drawFinalVillageScene(t) {
    const ctx = this.ctx;
    // Deep midnight blue sky
    ctx.fillStyle = '#161c3e';
    ctx.fillRect(0, 0, this.width, this.height);

    // Multi-layered clouds
    this.drawTornRect(-40, 380, this.width + 80, 70, '#1c244f', 'rgba(255,255,255,0.7)', 3, 51);
    this.drawTornRect(-40, 600, this.width + 80, 80, '#222b5d', 'rgba(255,255,255,0.65)', 3.5, 52);

    // Crescent Moon
    ctx.save();
    ctx.translate(140, 240);
    ctx.fillStyle = '#fdf8c7';
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(24, -6, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Twinkling stars in night sky
    const stars = [
      { x: 70, y: 170 }, { x: 310, y: 185 }, { x: 510, y: 165 }, { x: 820, y: 180 }, { x: 930, y: 280 },
      { x: 80, y: 410 }, { x: 900, y: 460 }, { x: 940, y: 680 }
    ];
    stars.forEach((s, idx) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      const twinkle = 0.8 + Math.sin(t * 6 + idx) * 0.25;
      ctx.scale(twinkle, twinkle);
      ctx.fillStyle = '#fce581';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.quadraticCurveTo(0, 0, 9, 0);
      ctx.quadraticCurveTo(0, 0, 0, 9);
      ctx.quadraticCurveTo(0, 0, -9, 0);
      ctx.quadraticCurveTo(0, 0, 0, -9);
      ctx.fill();
      ctx.restore();
    });

    // Claude shining brightly like the North Star
    this.drawClaude(680, 360, 1.35, Math.sin(t * 2) * 0.04, t, 'happy', 'smile', true);

    // City Houses & Rooftops silhouette
    // Tower 1 (Left background)
    ctx.fillStyle = '#222854';
    ctx.fillRect(590, 680, 120, 280);
    // Roof triangle
    ctx.beginPath();
    ctx.moveTo(580, 680); ctx.lineTo(650, 600); ctx.lineTo(720, 680); ctx.fill();

    // Tower 2 (Center)
    ctx.fillStyle = '#1c224a';
    ctx.fillRect(710, 650, 130, 310);
    ctx.beginPath();
    ctx.moveTo(700, 650); ctx.lineTo(775, 560); ctx.lineTo(850, 650); ctx.fill();

    // Tower 3 (Right)
    ctx.fillStyle = '#171c40';
    ctx.fillRect(840, 720, 140, 240);
    ctx.beginPath();
    ctx.moveTo(830, 720); ctx.lineTo(910, 640); ctx.lineTo(990, 720); ctx.fill();

    // Black Cat silhouette on rooftop
    ctx.save();
    ctx.translate(865, 665);
    ctx.fillStyle = '#0f132a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.arc(0, -14, 11, 0, Math.PI * 2); // Head
    ctx.fill();
    // Cat ears
    ctx.beginPath();
    ctx.moveTo(-9, -20); ctx.lineTo(-6, -29); ctx.lineTo(-2, -21); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2, -21); ctx.lineTo(6, -29); ctx.lineTo(9, -20); ctx.fill();
    // Curled tail
    ctx.strokeStyle = '#0f132a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(16, -2, 12, 0.4 * Math.PI, 1.4 * Math.PI, false);
    ctx.stroke();
    ctx.restore();

    // Glowing warm windows (+ windowpane crosses)
    const windows = [
      { x: 620, y: 770 }, { x: 690, y: 770 }, { x: 760, y: 720 }, { x: 800, y: 720 },
      { x: 760, y: 830 }, { x: 880, y: 810 }, { x: 940, y: 810 }, { x: 635, y: 920 },
      { x: 690, y: 920 }, { x: 780, y: 920 }, { x: 825, y: 920 }, { x: 885, y: 940 }, { x: 935, y: 940 }
    ];
    windows.forEach((w) => {
      ctx.save();
      ctx.translate(w.x, w.y);
      // Soft glow
      ctx.shadowColor = 'rgba(255, 235, 140, 0.7)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#fce27c';
      ctx.fillRect(-14, -18, 28, 36);

      // Window cross pane
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#222854';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(0, 18);
      ctx.moveTo(-14, 0); ctx.lineTo(14, 0);
      ctx.stroke();
      ctx.restore();
    });

    // Foreground House with Girl's Lit Window (Bottom Left)
    const winX = 60;
    const winY = 580;
    const winW = 420;
    const winH = 430;

    // Dark exterior wall
    this.drawTornRect(20, 500, 560, 600, '#2e2752', 'rgba(255,255,255,0.7)', 4, 101);

    // Warm Window interior
    ctx.fillStyle = '#ebc349';
    ctx.fillRect(winX + 25, winY + 25, winW - 50, winH - 50);

    // Curtains
    this.drawTornRect(winX + 25, winY + 25, 75, winH - 50, '#ea8585', 'rgba(255,255,255,0.6)', 3, 102);
    this.drawTornRect(winX + winW - 100, winY + 25, 75, winH - 50, '#ea8585', 'rgba(255,255,255,0.6)', 3, 103);

    // White torn window frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 14;
    ctx.strokeRect(winX + 15, winY + 15, winW - 30, winH - 30);

    // Potted plant on sill
    ctx.save();
    ctx.translate(winX + winW - 70, winY + winH - 60);
    ctx.fillStyle = '#a86542';
    ctx.fillRect(-14, 0, 28, 30);
    ctx.fillStyle = '#599e63';
    ctx.beginPath();
    ctx.ellipse(0, -10, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // The Girl holding the note with left hand, waving up to Claude with right arm!
    this.drawGirl(winX + 185, winY + 240, 1.15, 'window', true, false, 'broadSmile');

    // The Note held against her chest
    ctx.save();
    ctx.translate(winX + 190, winY + 345);
    this.drawTornRect(-65, -45, 130, 90, '#fdfcf7', 'rgba(255,255,255,0.9)', 2, 104);
    // Orange circle on note visible
    ctx.strokeStyle = '#df5a35';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 10, 26, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Window sill
    ctx.fillStyle = '#a47647';
    ctx.fillRect(winX - 10, winY + winH - 25, winW + 20, 35);
  }

  // Master Render Function: time t (0 to 16.5 seconds)
  render(t) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Scene Router based on timing
    if (t < 2.5) {
      // Scene 1: Writing note & paper tear
      this.drawNotebookScene(t);
    } else if (t < 4.5) {
      // Scene 2: Girl folding & throwing paper plane out window
      this.drawWindowScene(t);
    } else if (t < 7.4) {
      // Scene 3 & 4: Night sky & Claude catches note
      this.drawSkyScene(t);
    } else if (t < 8.4) {
      // Scene 5a: "words"
      this.drawVignetteWords(t);
    } else if (t < 9.3) {
      // Scene 5b: "trees"
      this.drawVignetteTrees(t);
    } else if (t < 10.2) {
      // Scene 5c: "rain"
      this.drawVignetteRain(t);
    } else if (t < 11.2) {
      // Scene 5d: "the stars"
      this.drawVignetteStars(t);
    } else if (t < 13.0) {
      // Scene 6: The Great Pink Heart Explosion
      this.drawHeartScene(t);
    } else if (t < 14.2) {
      // Scene 7: Claude smiling & sending airplane back
      this.drawReturnScene(t);
    } else if (t < 15.3) {
      // Scene 8: The Note revealed ("[you]" circled)
      this.drawUnfoldScene(t);
    } else {
      // Scene 9: Final cozy village at night & Claude star
      this.drawFinalVillageScene(t);
    }
  }

  play() {
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.loop();
  }

  pause() {
    this.isPlaying = false;
  }

  seek(time) {
    this.currentTime = Math.max(0, Math.min(this.duration, time));
    this.render(this.currentTime);
  }

  loop(timestamp = performance.now()) {
    if (!this.isPlaying) return;
    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.currentTime += delta;
    if (this.currentTime >= this.duration) {
      this.currentTime = this.duration;
      this.isPlaying = false;
      this.render(this.currentTime);
      if (window.onAnimationComplete) window.onAnimationComplete();
      return;
    }

    this.render(this.currentTime);
    if (window.onAnimationUpdate) window.onAnimationUpdate(this.currentTime, this.duration);

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.WhatDoYouLoveAnimation = WhatDoYouLoveAnimation;
