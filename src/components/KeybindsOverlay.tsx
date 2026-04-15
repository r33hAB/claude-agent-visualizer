import { useState } from 'react';

export default function KeybindsOverlay() {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-50 px-3 py-1.5 bg-lab-panel/80 backdrop-blur border border-lab-border rounded text-xs text-gray-400 hover:text-white hover:border-lab-accent"
      >
        ? Controls
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-lab-panel/90 backdrop-blur-md border border-lab-border rounded-lg p-4 text-xs text-gray-300 w-56">
      <div className="flex justify-between items-center mb-3">
        <span className="text-white font-bold text-sm">Controls</span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-gray-500 hover:text-white"
        >
          x
        </button>
      </div>

      <div className="space-y-2.5">
        <div className="border-b border-lab-border pb-2 mb-2">
          <div className="text-gray-500 font-bold mb-1.5">Camera</div>
          <Row keys="W A S D" desc="Move" />
          <Row keys="J L" desc="Rotate left/right" />
          <Row keys="I K" desc="Look up/down" />
          <Row keys="Mouse Drag" desc="Free look" />
          <Row keys="Scroll" desc="Zoom" />
          <Row keys="E / Space" desc="Move up" />
          <Row keys="Q" desc="Move down" />
          <Row keys="Shift" desc="Speed boost" />
        </div>

        <div>
          <div className="text-gray-500 font-bold mb-1.5">Interaction</div>
          <Row keys="Click" desc="Select agent" />
          <Row keys="Esc" desc="Deselect" />
        </div>
      </div>
    </div>
  );
}

function Row({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-gray-400">{desc}</span>
      <span className="font-mono text-lab-neon bg-lab-bg/50 px-1.5 py-0.5 rounded text-[10px]">{keys}</span>
    </div>
  );
}
