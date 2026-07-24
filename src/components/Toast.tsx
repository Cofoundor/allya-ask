/** A single transient line. `nonce` re-keys the element, which restarts the
    show-then-fade animation — no state, no timers, nothing to clean up. */
export function Toast({ message, nonce }: { message: string; nonce: number }) {
  if (!nonce) return null;
  return (
    <div key={nonce} className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
