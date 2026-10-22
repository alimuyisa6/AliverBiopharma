import { useEffect, useRef } from 'react';

// Canvas drawing helpers consume RGB channel arrays, not CSS hex strings.
const PALETTE = {
  primary: [84, 101, 255],
  accent: [0, 255, 212],
  periwinkle: [210, 221, 255],
};

function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const smooth = (value) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const easeOut = (value) => 1 - Math.pow(1 - clamp(value), 3);
const lerp = (a, b, t) => a + (b - a) * t;
const mixColor = (a, b, t) => a.map((value, i) => lerp(value, b[i], t));

function rgba(color, alpha) {
  return `rgba(${color[0] | 0},${color[1] | 0},${color[2] | 0},${alpha})`;
}

function drawSperm(ctx, x, y, heading, radius, tailLength, time, phase, color, alpha = 1) {
  const px = -Math.sin(heading);
  const py = Math.cos(heading);
  ctx.beginPath();
  for (let k = 0; k <= 14; k += 1) {
    const s = k / 14;
    const offset = Math.sin(time * 14 - k * 0.7 + phase) * radius * 0.9 * s;
    const X = x - Math.cos(heading) * s * tailLength + px * offset;
    const Y = y - Math.sin(heading) * s * tailLength + py * offset;
    if (k) ctx.lineTo(X, Y);
    else ctx.moveTo(X, Y);
  }
  ctx.lineWidth = Math.max(1.5, radius * 0.32);
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(color, 0.78 * alpha);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(x, y, radius * 1.3, radius, heading, 0, Math.PI * 2);
  ctx.fillStyle = rgba(color, 0.95 * alpha);
  ctx.fill();
}

function drawNucleus(ctx, x, y, radius, color, alpha = 1) {
  const gradient = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, radius * 0.1,
    x, y, radius,
  );
  gradient.addColorStop(0, rgba(mixColor(color, [255, 255, 255], 0.45), alpha));
  gradient.addColorStop(1, rgba(color, alpha));
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawFertilization(ctx, width, height, time, absoluteTime, opacity, spermData) {
  const landscape = width >= height;
  const cx = landscape ? width * 0.62 : width * 0.5;
  const cy = landscape ? height * 0.5 : height * 0.46;
  const ovumRadius = Math.min(height * 0.3, width * (landscape ? 0.24 : 0.32));
  const headRadius = ovumRadius * 0.07;
  const tailLength = ovumRadius * 0.75;
  const distance = Math.max(width, height) * 0.5;

  // Corona radiata and zona pellucida.
  ctx.globalAlpha = opacity * 0.42;
  ctx.fillStyle = rgba(PALETTE.periwinkle, 1);
  for (let i = 0; i < 56; i += 1) {
    const angle = (i / 56) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(angle) * ovumRadius * 1.11,
      cy + Math.sin(angle) * ovumRadius * 1.11,
      ovumRadius * 0.03, 0, Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.globalAlpha = opacity * 0.35;
  ctx.beginPath();
  ctx.arc(cx, cy, ovumRadius * 1.04, 0, Math.PI * 2);
  ctx.lineWidth = ovumRadius * 0.05;
  ctx.strokeStyle = rgba(PALETTE.primary, 1);
  ctx.stroke();

  const cytoplasm = ctx.createRadialGradient(cx, cy, 0, cx, cy, ovumRadius);
  cytoplasm.addColorStop(0, rgba(PALETTE.periwinkle, 0.12));
  cytoplasm.addColorStop(1, rgba(PALETTE.primary, 0.4));
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.arc(cx, cy, ovumRadius, 0, Math.PI * 2);
  ctx.fillStyle = cytoplasm;
  ctx.fill();

  const pulse = smooth((time - 6.1) / 0.4) * (1 - smooth((time - 7) / 1.5));
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = rgba(mixColor(PALETTE.periwinkle, PALETTE.accent, pulse), 0.9 * opacity);
  ctx.stroke();

  const lead = spermData[0];
  const ux = Math.cos(lead.angle);
  const uy = Math.sin(lead.angle);
  const membraneX = cx + ux * ovumRadius;
  const membraneY = cy + uy * ovumRadius;
  const insideX = cx + ux * ovumRadius * 0.5;
  const insideY = cy + uy * ovumRadius * 0.5;
  const merge = smooth((time - 11.8) / 2);

  drawNucleus(
    ctx,
    lerp(cx - ux * ovumRadius * 0.2, cx, merge),
    lerp(cy - uy * ovumRadius * 0.2, cy, merge),
    lerp(ovumRadius * 0.16, ovumRadius * 0.23, merge),
    mixColor(PALETTE.primary, PALETTE.periwinkle, merge),
    0.95 * opacity,
  );

  for (let i = 1; i < spermData.length; i += 1) {
    const sperm = spermData[i];
    const progress = clamp((time - sperm.delay) / sperm.duration);
    const eased = easeOut(progress);
    const sx = cx + Math.cos(sperm.angle) * distance * sperm.distance;
    const sy = cy + Math.sin(sperm.angle) * distance * sperm.distance;
    const expansion = 1 + 0.3 * smooth((time - 6.5) / 2);
    const ex = cx + Math.cos(sperm.endAngle) * ovumRadius * sperm.endRadius * expansion;
    const ey = cy + Math.sin(sperm.endAngle) * ovumRadius * sperm.endRadius * expansion;
    const heading = Math.atan2(ey - sy, ex - sx);
    const wobble = Math.sin(time * 2 + sperm.phase) * ovumRadius * 0.12 * (1 - eased);
    const X = lerp(sx, ex, eased) - Math.sin(heading) * wobble;
    const Y = lerp(sy, ey, eased) + Math.cos(heading) * wobble;
    const alpha = clamp(progress * 3) * (1 - smooth((time - 6.8) / 2.2));
    if (alpha > 0.01) {
      drawSperm(ctx, X, Y, heading, headRadius, tailLength, absoluteTime, sperm.phase, PALETTE.periwinkle, alpha * opacity);
    }
  }

  const sx = cx + ux * distance * lead.distance;
  const sy = cy + uy * distance * lead.distance;
  const heading = Math.atan2(membraneY - sy, membraneX - sx);
  if (time < 8.6) {
    const progress = easeOut((time - lead.delay) / lead.duration);
    let X;
    let Y;
    if (time < 6.2) {
      X = lerp(sx, membraneX, progress);
      Y = lerp(sy, membraneY, progress);
    } else {
      const enter = smooth((time - 6.2) / 2.4);
      X = lerp(membraneX, insideX, enter);
      Y = lerp(membraneY, insideY, enter);
    }
    drawSperm(ctx, X, Y, heading, headRadius, tailLength, absoluteTime, lead.phase, PALETTE.accent, 1 - smooth((time - 6.3) / 1.3));
  } else {
    const entry = smooth((time - 8.6) / 3);
    const X = lerp(insideX, cx + ux * ovumRadius * 0.2, entry);
    const Y = lerp(insideY, cy + uy * ovumRadius * 0.2, entry);
    drawNucleus(
      ctx, lerp(X, cx, merge), lerp(Y, cy, merge),
      lerp(headRadius * 1.3, ovumRadius * 0.16, smooth((time - 8.6) / 1.6)),
      mixColor(mixColor(PALETTE.periwinkle, PALETTE.accent, smooth((time - 8.6) / 1.5)), PALETTE.periwinkle, merge),
      0.95 * opacity,
    );
  }

  if (time > 6.1 && time < 8) {
    const ripple = (time - 6.1) / 1.9;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(membraneX, membraneY, ripple * ovumRadius * 0.85 + 4, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = rgba(PALETTE.accent, (1 - ripple) * opacity);
    ctx.stroke();
  }

  if (time > 13.8) {
    const glow = smooth((time - 13.8) / 1);
    const phase = (absoluteTime * 0.45) % 1;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, ovumRadius * 0.7);
    gradient.addColorStop(0, rgba(PALETTE.accent, 0.35 * glow * opacity));
    gradient.addColorStop(1, rgba(PALETTE.accent, 0));
    ctx.globalAlpha = 1;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, ovumRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55 * (1 - phase) * glow * opacity;
    ctx.beginPath();
    ctx.arc(cx, cy, ovumRadius * (0.28 + phase * 0.7), 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = rgba(PALETTE.accent, 1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawCapsule(ctx, x, y, angle, length, thickness, split, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const leftEnd = -length / 2 + thickness / 2 - split;
  ctx.beginPath();
  ctx.moveTo(-split, -thickness / 2);
  ctx.lineTo(leftEnd, -thickness / 2);
  ctx.arc(leftEnd, 0, thickness / 2, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(-split, thickness / 2);
  ctx.closePath();
  ctx.fillStyle = rgba(PALETTE.periwinkle, opacity);
  ctx.fill();

  const rightEnd = length / 2 - thickness / 2 + split;
  ctx.beginPath();
  ctx.moveTo(split, -thickness / 2);
  ctx.lineTo(rightEnd, -thickness / 2);
  ctx.arc(rightEnd, 0, thickness / 2, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(split, thickness / 2);
  ctx.closePath();
  ctx.fillStyle = rgba(PALETTE.accent, opacity);
  ctx.fill();
  ctx.restore();
}

function drawBloodstream(ctx, width, height, time, absoluteTime, opacity, cells, particles) {
  const centerY = (x) => height * 0.56 + Math.sin((x / Math.max(width, 1)) * Math.PI * 1.3 + 0.6) * height * 0.035;
  const radius = Math.min(height * 0.17, width * (width < height ? 0.17 : 0.14));
  const flowSpeed = width * 0.085;

  ctx.globalAlpha = opacity;
  ctx.beginPath();
  for (let x = -20; x <= width + 20; x += 14) ctx.lineTo(x, centerY(x) - radius);
  for (let x = width + 20; x >= -20; x -= 14) ctx.lineTo(x, centerY(x) + radius);
  ctx.closePath();

  const vessel = ctx.createLinearGradient(0, height * 0.56 - radius, 0, height * 0.56 + radius);
  vessel.addColorStop(0, rgba(PALETTE.primary, 0.3));
  vessel.addColorStop(0.5, rgba(PALETTE.primary, 0.07));
  vessel.addColorStop(1, rgba(PALETTE.primary, 0.3));
  ctx.fillStyle = vessel;
  ctx.fill();

  [-1, 1].forEach((side) => {
    ctx.beginPath();
    for (let x = -20; x <= width + 20; x += 14) {
      const y = centerY(x) + side * radius;
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineWidth = 16;
    ctx.strokeStyle = rgba(PALETTE.primary, 0.14 * opacity);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = rgba(PALETTE.primary, 0.95 * opacity);
    ctx.stroke();
  });

  // Red cells are stylised with the website's periwinkle/mint brand colours.
  const span = width * 1.2;
  cells.forEach((cell) => {
    const X = ((cell.x * span + absoluteTime * flowSpeed * cell.speed * (1 - 0.55 * cell.lane * cell.lane)) % span + span) % span - width * 0.1;
    const Y = centerY(X) + cell.lane * radius * 0.78 + Math.sin(absoluteTime * 1.3 + cell.phase) * radius * 0.03;
    const r = radius * cell.size * 1.5;
    const rotation = absoluteTime * 0.9 * cell.speed + cell.phase;
    ctx.save();
    ctx.translate(X, Y);
    ctx.rotate(Math.sin(rotation * 0.5) * 0.5);
    ctx.scale(0.75 + 0.25 * Math.abs(Math.cos(rotation)), 1);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgba(PALETTE.periwinkle, 0.5 * opacity);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = rgba(PALETTE.periwinkle, 0.9 * opacity);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.45, r * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgba(PALETTE.primary, 0.45 * opacity);
    ctx.fill();
    ctx.restore();
  });

  // Small receptor-like structures along the vessel wall.
  for (let k = 0; k < 6; k += 1) {
    const x = width * (0.62 + 0.05 * k);
    const y = centerY(x) + radius;
    const size = radius * 0.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - size * 0.5);
    ctx.lineTo(x - size * 0.3, y - size);
    ctx.moveTo(x, y - size * 0.5);
    ctx.lineTo(x + size * 0.3, y - size);
    ctx.lineWidth = 2;
    ctx.strokeStyle = rgba(PALETTE.periwinkle, 0.8 * opacity);
    ctx.stroke();
  }

  const capsuleX = width * 0.3;
  const wallY = centerY(capsuleX) - radius;
  const capsuleLength = Math.min(height, width) * 0.11;
  const capsuleThickness = capsuleLength * 0.42;

  if (time < 3.9) {
    const progress = clamp((time - 0.4) / 2.2);
    const x = lerp(capsuleX - width * 0.1, capsuleX, smooth(progress));
    const y = lerp(-height * 0.08, wallY - capsuleThickness * 0.8, progress * progress);
    const angle = lerp(-1.1, 0.35, smooth(progress));
    const split = smooth((time - 2.6) / 0.8) * capsuleLength * 0.4;
    const fade = 1 - smooth((time - 2.9) / 1);
    drawCapsule(ctx, x, y, angle, capsuleLength, capsuleThickness, split, 0.95 * fade * opacity);
    if (time > 2.6) {
      const ripple = (time - 2.6) / 1.2;
      if (ripple < 1) {
        ctx.beginPath();
        ctx.arc(capsuleX, wallY, ripple * radius * 0.5 + 3, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = rgba(PALETTE.accent, 0.8 * (1 - ripple) * opacity);
        ctx.stroke();
      }
    }
  }

  ctx.globalCompositeOperation = 'lighter';
  const particleRadius = Math.max(3.5, radius * 0.045);
  const fadeOut = time > 13.4 ? 1 - smooth((time - 13.4) / 1.2) : 1;
  particles.forEach((particle) => {
    const age = time - particle.start;
    if (age < 0) return;
    const velocity = flowSpeed * (1 - 0.55 * particle.lane * particle.lane) * particle.velocity;
    const originX = capsuleX + particle.offset * width;
    let X = originX + velocity * (age < 1.1 ? age * 0.4 : 0.44 + (age - 1.1));
    let Y = centerY(X) + lerp(-radius, particle.lane * radius * 0.8, easeOut(age / 1.1))
      + Math.sin(age * 2 + particle.phase) * radius * 0.03;
    let alpha = clamp(age / 0.4) * fadeOut;

    if (particle.bound) {
      const receptorX = width * (0.62 + 0.05 * particle.receptor);
      if (X >= receptorX) {
        const attach = smooth((X - receptorX) / (width * 0.04));
        X = receptorX;
        Y = lerp(Y, centerY(receptorX) + radius - radius * 0.3, attach);
        if (attach >= 1) {
          const phase = (age * 0.6) % 1;
          ctx.beginPath();
          ctx.arc(X, Y, particleRadius * (1.5 + phase * 3), 0, Math.PI * 2);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = rgba(PALETTE.accent, (1 - phase) * 0.7 * alpha * opacity);
          ctx.stroke();
        }
      }
    } else if (X > width * 0.9) {
      alpha *= clamp(1 - (X - width * 0.9) / (width * 0.08));
    }

    if (alpha <= 0.01) return;
    ctx.fillStyle = rgba(PALETTE.accent, 0.16 * alpha * opacity);
    ctx.beginPath();
    ctx.arc(X, Y, particleRadius * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(PALETTE.accent, 0.95 * alpha * opacity);
    ctx.beginPath();
    ctx.arc(X, Y, particleRadius, 0, Math.PI * 2);
    ctx.fill();
    if (particle.hexagon) {
      ctx.beginPath();
      for (let j = 0; j < 6; j += 1) {
        const angle = (j / 6) * Math.PI * 2 + age;
        const px = X + Math.cos(angle) * particleRadius * 2;
        const py = Y + Math.sin(angle) * particleRadius * 2;
        if (!j) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(PALETTE.accent, 0.7 * alpha * opacity);
      ctx.stroke();
    }
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

export default function HeroScienceCanvas() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(0);
  const reducedRef = useRef(false);
  const autoRotateRef = useRef(true);
  const sceneStartRef = useRef(0);
  const repaintRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !hero || !context) return undefined;

    const randomSperm = seededRandom(21);
    const spermData = Array.from({ length: 14 }, (_, index) => {
      const lead = index === 0;
      const angle = lead ? Math.PI * 0.92 : Math.PI + (randomSperm() - 0.5) * 2.2;
      return {
        angle,
        endAngle: lead ? angle : angle + (randomSperm() - 0.5) * 0.8,
        endRadius: lead ? 1 : 1.12 + randomSperm() * 0.3,
        distance: 1.15 + randomSperm() * 0.7,
        delay: lead ? 0.3 : randomSperm() * 2,
        duration: lead ? 5.7 : 4 + randomSperm() * 2.2,
        phase: randomSperm() * Math.PI * 2,
      };
    });

    const randomBlood = seededRandom(7);
    const cells = Array.from({ length: 30 }, () => ({
      x: randomBlood(),
      lane: randomBlood() * 1.7 - 0.85,
      speed: 0.7 + randomBlood() * 0.6,
      phase: randomBlood() * Math.PI * 2,
      size: 0.16 + randomBlood() * 0.07,
    }));
    const particles = Array.from({ length: 72 }, (_, index) => ({
      start: 2.7 + index * 0.04,
      lane: (randomBlood() * 2 - 1) * 0.72,
      offset: (randomBlood() - 0.5) * 0.06,
      velocity: 0.9 + randomBlood() * 0.2,
      phase: randomBlood() * Math.PI * 2,
      bound: index % 9 === 0,
      receptor: Math.floor(index / 9) % 6,
      hexagon: index % 3 === 0,
    }));

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let startTime = 0;
    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;
    let driftX = 0;
    let driftY = 0;
    const periods = [18, 15];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    // Desktop-site mode can report a wide viewport on a phone. Keep the hero
    // artwork static and at device-pixel-ratio 1 on touch-first hardware.
    reducedRef.current = reducedMotion.matches || coarsePointer.matches;
    let isInView = true;

    const resize = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1 : 1.5);
      width = Math.max(1, hero.clientWidth);
      height = Math.max(1, hero.clientHeight);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const paint = (time, absoluteTime, opacity) => {
      context.globalAlpha = 1;
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(driftX * 7, driftY * 4);
      if (sceneRef.current === 0) {
        drawFertilization(context, width, height, time, absoluteTime, opacity, spermData);
      } else {
        drawBloodstream(context, width, height, time, absoluteTime, opacity, cells, particles);
      }
      context.restore();
      context.globalAlpha = 1;
    };

    const renderFrame = (now) => {
      if (!isInView || reducedRef.current) return;
      const absoluteTime = (now - startTime) / 1000;
      let sceneElapsed = (now - sceneStartRef.current) / 1000;
      if (autoRotateRef.current && sceneElapsed >= periods[sceneRef.current]) {
        sceneRef.current = 1 - sceneRef.current;
        sceneStartRef.current = now;
        sceneElapsed = 0;
      }
      driftX += (pointerX - driftX) * 0.05;
      driftY += (pointerY - driftY) * 0.05;
      const period = periods[sceneRef.current];
      const localTime = autoRotateRef.current ? sceneElapsed : sceneElapsed % period;
      paint(localTime, absoluteTime, Math.min(smooth(localTime / 0.7), smooth((period - localTime) / 0.8)));
      if (!reducedRef.current) frameId = window.requestAnimationFrame(renderFrame);
    };

    const renderStill = () => {
      paint(sceneRef.current === 0 ? 13.2 : 7.5, 3, 1);
    };
    repaintRef.current = renderStill;

    const onPointerMove = (event) => {
      const rect = hero.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };

    const syncMotion = () => {
      reducedRef.current = reducedMotion.matches || coarsePointer.matches;
      window.cancelAnimationFrame(frameId);
      if (reducedRef.current) {
        renderStill();
      } else if (isInView) {
        startTime = performance.now();
        sceneStartRef.current = startTime;
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    resize();
    startTime = performance.now();
    sceneStartRef.current = startTime;
    if (reducedRef.current) renderStill();
    else frameId = window.requestAnimationFrame(renderFrame);
    let resizeFrame = 0;
    const resizeObserver = new ResizeObserver(() => {
      // Defer canvas backing-store writes until after ResizeObserver delivery.
      // This prevents resize feedback loops on narrow/mobile desktop-mode layouts.
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
        if (reducedRef.current) renderStill();
      });
    });
    resizeObserver.observe(hero);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting;
      if (!isInView) {
        window.cancelAnimationFrame(frameId);
      } else if (!reducedRef.current) {
        startTime = performance.now();
        sceneStartRef.current = startTime;
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(renderFrame);
      }
    }, { rootMargin: '80px 0px' });
    visibilityObserver.observe(hero);
    hero.addEventListener('pointermove', onPointerMove, { passive: true });
    reducedMotion.addEventListener?.('change', syncMotion);
    coarsePointer.addEventListener?.('change', syncMotion);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      hero.removeEventListener('pointermove', onPointerMove);
      reducedMotion.removeEventListener?.('change', syncMotion);
      coarsePointer.removeEventListener?.('change', syncMotion);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hero-science-canvas"
      aria-hidden="true"
    />
  );
}
