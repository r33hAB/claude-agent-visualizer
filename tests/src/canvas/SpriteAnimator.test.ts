import { describe, it, expect } from 'vitest';
import { SpriteAnimator, type SpriteSheet } from '../../../src/canvas/SpriteAnimator';
import type { AnimationState } from '../../../src/types/agent';

function makeMockSheet(): SpriteSheet {
  return {
    frameWidth: 64,
    frameHeight: 64,
    animations: {
      idle: { startFrame: 0, frameCount: 4, frameDuration: 200 },
      working: { startFrame: 4, frameCount: 6, frameDuration: 100 },
      walking_left: { startFrame: 10, frameCount: 4, frameDuration: 150 },
      walking_right: { startFrame: 14, frameCount: 4, frameDuration: 150 },
      interacting: { startFrame: 18, frameCount: 4, frameDuration: 150 },
      celebrating: { startFrame: 22, frameCount: 4, frameDuration: 200 },
      error: { startFrame: 26, frameCount: 2, frameDuration: 300 },
      entering: { startFrame: 28, frameCount: 3, frameDuration: 150 },
      exiting: { startFrame: 31, frameCount: 3, frameDuration: 150 },
    },
    image: null as unknown as HTMLImageElement,
  };
}

describe('SpriteAnimator', () => {
  it('starts in idle state', () => {
    const animator = new SpriteAnimator(makeMockSheet());
    expect(animator.getCurrentState()).toBe('idle');
  });

  it('transitions to a new state', () => {
    const animator = new SpriteAnimator(makeMockSheet());
    animator.setState('working');
    expect(animator.getCurrentState()).toBe('working');
  });

  it('advances frames over time', () => {
    const animator = new SpriteAnimator(makeMockSheet());
    animator.setState('idle');
    const frame0 = animator.getCurrentFrame();
    animator.update(250);
    const frame1 = animator.getCurrentFrame();
    expect(frame1).not.toBe(frame0);
  });

  it('loops animation', () => {
    const animator = new SpriteAnimator(makeMockSheet());
    animator.setState('idle');
    animator.update(900);
    const frame = animator.getCurrentFrame();
    expect(frame).toBe(0);
  });

  it('adjusts speed multiplier', () => {
    const animator = new SpriteAnimator(makeMockSheet());
    animator.setSpeedMultiplier(2.0);
    animator.setState('idle');
    const frame0 = animator.getCurrentFrame();
    animator.update(120);
    const frame1 = animator.getCurrentFrame();
    expect(frame1).not.toBe(frame0);
  });
});
