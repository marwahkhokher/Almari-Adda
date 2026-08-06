// Lightweight UI sound effects using the Web Audio API — no assets, no
// dependencies. Every call is fully guarded so a missing/blocked audio
// context can never throw or break the UI.
//
// NOTE: this module was referenced by DashboardScreen but not present in
// the repo, which broke the build. This provides the expected `playWhoosh`
// export with a safe, minimal implementation.

let audioCtx = null;

function getContext() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a short, soft "whoosh" — a quick downward frequency sweep with a
 * gentle volume envelope. Safe to call anywhere; silently no-ops if audio
 * isn't available (e.g. before a user gesture, or blocked by the browser).
 */
export function playWhoosh() {
  try {
    const ctx = getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  } catch {
    // Never let a sound effect break the UI.
  }
}

export default { playWhoosh };
