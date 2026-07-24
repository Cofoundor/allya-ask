'use client';

import { useEffect, useRef } from 'react';
import { createBrain, type BrainHandle, type BrainOptions, type NodeSpec } from '@/lib/brain';

interface Props {
  options: BrainOptions;
  /** handed the live engine once it exists — fire thoughts at it */
  onReady?: (handle: BrainHandle) => void;
  onTap?: (node: NodeSpec) => void;
  className?: string;
}

/* A React shell around the canvas engine. The engine owns the pixels and the
   pointer bindings; React only owns the box around them — which is why the
   graph survives the gate → chat transition without losing its state or its
   momentum. It is mounted once, above both screens, and never keyed. */
export function BrainCanvas({ options, onReady, onTap, className }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(onReady);
  const tapRef = useRef(onTap);

  // keep the callbacks current without re-creating the engine
  useEffect(() => {
    readyRef.current = onReady;
    tapRef.current = onTap;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    const handle = createBrain(canvas, box, {
      ...options,
      onTap: (n) => tapRef.current?.(n),
    });
    handle.start();
    readyRef.current?.(handle);
    return () => handle.destroy();
    // the graph is static data; re-running this would throw away the engine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className} ref={boxRef} aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
}
