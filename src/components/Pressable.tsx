'use client';

import type { ButtonHTMLAttributes } from 'react';
import { usePressable } from '@/lib/hooks';

/* Instant press feedback — the element scales under the finger and springs
   back on release, interruptibly. */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { pressScale?: number };

export function PressButton({ pressScale = 0.96, ...props }: ButtonProps) {
  const ref = usePressable<HTMLButtonElement>(pressScale);
  return <button ref={ref} {...props} />;
}
