"use client";

import { useState } from "react";

export default function PasswordField({ id, value, onChange, autoComplete, minLength, maxLength, required = false, showStrength = false }) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const length = value.length;
  const strength = length < 10 ? "Add a few more characters" : length < 14 ? "Good length" : "Strong length";

  return <>
    <span className="password-field">
      <input id={id} required={required} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} maxLength={maxLength} value={value} onChange={onChange} onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))} onBlur={() => setCapsLock(false)} />
      <button type="button" className="password-visibility" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
        {visible ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A10.7 10.7 0 0112 5c5 0 8.5 4.3 9.5 6.1a1.7 1.7 0 010 1.8 14 14 0 01-3.1 3.5M6.2 6.2a14.6 14.6 0 00-3.7 4.9 1.7 1.7 0 000 1.8C3.5 14.7 7 19 12 19a10 10 0 003-.5" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.7" /></svg>}
      </button>
    </span>
    {capsLock && <small className="password-caps" role="status">Caps Lock is on</small>}
    {showStrength && <span className={`password-strength ${length >= 10 ? "meets-minimum" : ""}`} aria-live="polite"><i><b style={{ width: `${Math.min(100, length * 6.25)}%` }} /></i><small>{length ? strength : "Use at least 10 characters"}</small></span>}
  </>;
}
