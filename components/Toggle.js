'use client';

import { useState } from 'react';

export default function Toggle({ label, defaultChecked = false, disabled = false }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => setChecked((c) => !c)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
        checked ? 'bg-ice/80 border-ice' : 'bg-polar-raised border-polar-border',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]',
        ].join(' ')}
      />
    </button>
  );
}
