import { useEffect, useRef, useCallback } from 'react';

export function useCanvasResize(
  containerRef: React.RefObject<HTMLDivElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onResize?: (width: number, height: number) => void,
) {
  const resizeObserver = useRef<ResizeObserver | null>(null);

  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    onResize?.(width, height);
  }, [containerRef, canvasRef, onResize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    resizeObserver.current = new ResizeObserver(handleResize);
    resizeObserver.current.observe(container);
    handleResize();

    return () => resizeObserver.current?.disconnect();
  }, [containerRef, handleResize]);
}
