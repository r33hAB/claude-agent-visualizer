import { describe, it, expect } from 'vitest';
import { getProgressColor } from '../../../src/canvas/ProgressRing';
import { PROGRESS_COLORS } from '../../../src/types/agent';

describe('getProgressColor', () => {
  it('returns blue for 0-30%', () => {
    expect(getProgressColor(0)).toBe(PROGRESS_COLORS.low);
    expect(getProgressColor(15)).toBe(PROGRESS_COLORS.low);
    expect(getProgressColor(30)).toBe(PROGRESS_COLORS.low);
  });
  it('returns cyan for 31-60%', () => {
    expect(getProgressColor(31)).toBe(PROGRESS_COLORS.mid);
    expect(getProgressColor(50)).toBe(PROGRESS_COLORS.mid);
    expect(getProgressColor(60)).toBe(PROGRESS_COLORS.mid);
  });
  it('returns green for 61-90%', () => {
    expect(getProgressColor(61)).toBe(PROGRESS_COLORS.high);
    expect(getProgressColor(75)).toBe(PROGRESS_COLORS.high);
    expect(getProgressColor(90)).toBe(PROGRESS_COLORS.high);
  });
  it('returns gold for 91-100%', () => {
    expect(getProgressColor(91)).toBe(PROGRESS_COLORS.complete);
    expect(getProgressColor(100)).toBe(PROGRESS_COLORS.complete);
  });
  it('returns error for negative (error state)', () => {
    expect(getProgressColor(-1)).toBe(PROGRESS_COLORS.error);
  });
});
