/* Store-click measurement only. Does not load analytics or set cookies.
   When a consented GA4 property is configured, pass measurementId in config below. */
(() => {
  'use strict';
  const measurementId = ''; // GA4 ID for contegames.com ONLY, e.g. G-XXXXXXXXXX.
  if (!/^G-[A-Z0-9]{6,}$/.test(measurementId)) return;
  // GA4 is not loaded until a valid studio ID and a consent mechanism are configured.
  // Do not copy the measurement ID belonging to the separate painting company.
  // This reserved module makes activation straightforward after verification.
})();
