import type { SwarmEnvironmentState } from '../types/agent';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface EnvironmentConfig {
  bgColor: string;
  ambientGlow: string;
  ambientAlpha: number;
  particleColor: string;
  particleCount: number;
}

const ENV_CONFIGS: Record<SwarmEnvironmentState, EnvironmentConfig> = {
  idle: {
    bgColor: '#050810',
    ambientGlow: '#1e293b',
    ambientAlpha: 0.1,
    particleColor: '#334155',
    particleCount: 5,
  },
  active: {
    bgColor: '#0a0e1a',
    ambientGlow: '#3b82f6',
    ambientAlpha: 0.08,
    particleColor: '#3b82f6',
    particleCount: 15,
  },
  heavy: {
    bgColor: '#0d1225',
    ambientGlow: '#8b5cf6',
    ambientAlpha: 0.15,
    particleColor: '#a78bfa',
    particleCount: 40,
  },
  error: {
    bgColor: '#0f0505',
    ambientGlow: '#ef4444',
    ambientAlpha: 0.12,
    particleColor: '#ef4444',
    particleCount: 20,
  },
  complete: {
    bgColor: '#0a1008',
    ambientGlow: '#f59e0b',
    ambientAlpha: 0.1,
    particleColor: '#fbbf24',
    particleCount: 30,
  },
  shutdown: {
    bgColor: '#020204',
    ambientGlow: '#1e293b',
    ambientAlpha: 0.03,
    particleColor: '#334155',
    particleCount: 2,
  },
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = parseInt(hex.replace('#', ''), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

export class EnvironmentRenderer {
  private state: SwarmEnvironmentState = 'idle';
  private config: EnvironmentConfig = ENV_CONFIGS.idle;
  private width = 800;
  private height = 600;
  private particles: Particle[] = [];
  private confetti: Particle[] = [];
  private shakeTime = 0;
  private elapsed = 0;

  setState(state: SwarmEnvironmentState): void {
    this.state = state;
    this.config = ENV_CONFIGS[state];
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  getShakeOffset(): { x: number; y: number } {
    if (this.state === 'error') {
      return {
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 6,
      };
    }
    if (this.state === 'heavy') {
      return {
        x: (Math.random() - 0.5) * 3,
        y: (Math.random() - 0.5) * 3,
      };
    }
    return { x: 0, y: 0 };
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.shakeTime += dt;

    const target = this.config.particleCount;

    // Spawn particles to match target
    while (this.particles.length < target) {
      this.particles.push(this.spawnParticle(true));
    }

    // Remove excess particles
    while (this.particles.length > target) {
      this.particles.pop();
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Fade in during first 20% of life, fade out during last 20%
      const lifeRatio = p.life / p.maxLife;
      if (lifeRatio > 0.8) {
        p.alpha = (1 - lifeRatio) * 5; // fade in
      } else if (lifeRatio < 0.2) {
        p.alpha = lifeRatio * 5; // fade out
      } else {
        p.alpha = 1;
      }

      // Respawn at bottom when expired
      if (p.life <= 0) {
        this.particles[i] = this.spawnParticle(false);
      }
    }

    // Update confetti for complete state
    if (this.state === 'complete') {
      while (this.confetti.length < 30) {
        this.confetti.push(this.spawnConfetti());
      }
      for (let i = this.confetti.length - 1; i >= 0; i--) {
        const c = this.confetti[i];
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vy += 30 * dt; // gravity
        c.life -= dt;
        if (c.life <= 0) {
          this.confetti[i] = this.spawnConfetti();
        }
      }
    } else {
      this.confetti.length = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this;

    // Background fill
    ctx.fillStyle = this.config.bgColor;
    ctx.fillRect(0, 0, width, height);

    // Subtle isometric floor grid
    this.drawFloorGrid(ctx);

    // Radial gradient ambient glow
    this.drawAmbientGlow(ctx);

    // Floating particles
    this.drawParticles(ctx);

    // Warning strips for error state
    if (this.state === 'error') {
      this.drawWarningStrips(ctx);
    }

    // Confetti for complete state
    if (this.state === 'complete') {
      this.drawConfetti(ctx);
    }
  }

  private spawnParticle(randomY: boolean): Particle {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : this.height + 10,
      vx: (Math.random() - 0.5) * 10,
      vy: -(10 + Math.random() * 20),
      size: 1 + Math.random() * 2.5,
      alpha: 0,
      life: 3 + Math.random() * 4,
      maxLife: 3 + Math.random() * 4,
    };
  }

  private spawnConfetti(): Particle {
    return {
      x: Math.random() * this.width,
      y: -10,
      vx: (Math.random() - 0.5) * 80,
      vy: 20 + Math.random() * 40,
      size: 2 + Math.random() * 3,
      alpha: 0.8 + Math.random() * 0.2,
      life: 3 + Math.random() * 2,
      maxLife: 5,
    };
  }

  private drawFloorGrid(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;

    const spacing = 64;
    const cx = this.width / 2;
    const cy = this.height / 2;

    // Draw isometric grid lines
    for (let i = -10; i <= 10; i++) {
      // Lines going top-right to bottom-left
      const startX = cx + i * (spacing / 2);
      const startY = cy + i * (spacing / 4) - this.height / 2;
      ctx.beginPath();
      ctx.moveTo(startX - this.width, startY + this.width / 2);
      ctx.lineTo(startX + this.width, startY - this.width / 2);
      ctx.stroke();

      // Lines going top-left to bottom-right
      ctx.beginPath();
      ctx.moveTo(startX - this.width, startY - this.width / 2);
      ctx.lineTo(startX + this.width, startY + this.width / 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawAmbientGlow(ctx: CanvasRenderingContext2D): void {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius = Math.max(this.width, this.height) * 0.5;

    const { r, g, b } = hexToRgb(this.config.ambientGlow);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.config.ambientAlpha})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    const { r, g, b } = hexToRgb(this.config.particleColor);

    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.6})`;
      ctx.fill();
    }
  }

  private drawWarningStrips(ctx: CanvasRenderingContext2D): void {
    const pulse = Math.sin(this.elapsed * 4) * 0.3 + 0.5;
    ctx.save();
    ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, this.width - 4, this.height - 4);
    ctx.restore();
  }

  private drawConfetti(ctx: CanvasRenderingContext2D): void {
    const confettiColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

    for (let i = 0; i < this.confetti.length; i++) {
      const c = this.confetti[i];
      const color = confettiColors[i % confettiColors.length];
      ctx.save();
      ctx.globalAlpha = Math.max(0, c.life / c.maxLife);
      ctx.fillStyle = color;
      ctx.translate(c.x, c.y);
      ctx.rotate(this.elapsed * 3 + i);
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.5);
      ctx.restore();
    }
  }
}
