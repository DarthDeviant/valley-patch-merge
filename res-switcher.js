/* ════════════════════════════════════════════════════════
   res-switcher.js — Game Trial Resolution Switcher
   Adds a desktop / mobile viewport toggle to the
   patch.merge v4 game trial frame controls.
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Presets ── */
  const PRESETS = [
    { id: 'desktop',  label: '🖥',  title: 'Desktop',       w: null,  h: 640, scale: 1   },
    { id: 'tablet',   label: '▭',   title: 'Tablet (768)',  w: 768,   h: 640, scale: 1   },
    { id: 'mobile-l', label: '📱',  title: 'Mobile L (430)',w: 430,   h: 640, scale: 1   },
    { id: 'mobile-s', label: '▯',   title: 'Mobile S (375)',w: 375,   h: 640, scale: 1   },
  ];

  let activeId = 'desktop';
  let isLandscape = false;

  /* ── Inject styles ── */
  const style = document.createElement('style');
  style.id = 'vf-res-styles';
  style.textContent = `
    #vf-res-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      padding: 7px 13px;
      border-top: 1px solid rgba(255,255,255,0.07);
      background: var(--surf2, #161b24);
    }
    #vf-res-bar .vf-res-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--mu2, #6b7a96);
      margin-right: 2px;
    }
    .vf-res-btn {
      font-family: var(--mono, monospace);
      font-size: 11px;
      font-weight: 700;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.07);
      color: var(--mu2, #6b7a96);
      border-radius: 4px;
      padding: 4px 9px;
      cursor: pointer;
      transition: all .14s;
      display: flex;
      align-items: center;
      gap: 5px;
      line-height: 1;
    }
    .vf-res-btn:hover {
      background: rgba(255,255,255,0.05);
      color: var(--tx, #dde1ec);
      border-color: rgba(255,255,255,0.15);
    }
    .vf-res-btn.vf-active {
      background: var(--blu-d, rgba(96,165,250,0.1));
      color: var(--blu, #60a5fa);
      border-color: rgba(96,165,250,0.35);
    }
    .vf-res-sep {
      width: 1px;
      height: 16px;
      background: rgba(255,255,255,0.07);
      margin: 0 2px;
    }
    .vf-rot-btn {
      font-family: var(--mono, monospace);
      font-size: 11px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.07);
      color: var(--mu, #4a5468);
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      transition: all .14s;
      line-height: 1;
    }
    .vf-rot-btn:hover {
      color: var(--ylw, #fbbf24);
      border-color: rgba(251,191,36,0.3);
      background: rgba(251,191,36,0.07);
    }
    .vf-rot-btn.vf-landscape {
      color: var(--ylw, #fbbf24);
      border-color: rgba(251,191,36,0.3);
      background: rgba(251,191,36,0.07);
    }
    #vf-res-dims {
      font-size: 9.5px;
      color: var(--mu, #4a5468);
      margin-left: 4px;
      font-family: var(--mono, monospace);
      letter-spacing: .5px;
      min-width: 80px;
    }
    /* Frame wrapper when a mobile width is active */
    #trial-frame-wrap.vf-contained {
      background: #060810;
      padding: 16px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 300px;
    }
    #trial-frame-wrap.vf-contained #game-frame {
      border-radius: 8px;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.08),
        0 8px 40px rgba(0,0,0,0.6);
      overflow: hidden;
      flex-shrink: 0;
    }
    /* little device-chrome notch for mobile */
    #vf-device-bar {
      display: none;
      width: 100%;
      justify-content: center;
      align-items: center;
      gap: 6px;
      height: 20px;
      background: #0d1018;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      border-radius: 8px 8px 0 0;
      position: relative;
    }
    #vf-device-bar.show { display: flex; }
    #vf-device-bar .notch {
      width: 54px; height: 8px;
      background: #1a1f2a;
      border-radius: 4px;
    }
    #vf-device-bar .cam {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #1e2430;
      position: absolute;
      right: 14px; top: 50%;
      transform: translateY(-50%);
    }
    /* wrapper so device-bar + frame stack vertically */
    #vf-phone-shell {
      display: contents;
    }
    #trial-frame-wrap.vf-contained #vf-phone-shell {
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }
  `;
  document.head.appendChild(style);

  /* ── Wait for trial-hd to exist, then inject bar ── */
  function inject() {
    const trialWrap = document.getElementById('trial-wrap');
    const frameWrap = document.getElementById('trial-frame-wrap');
    if (!trialWrap || !frameWrap) {
      setTimeout(inject, 300);
      return;
    }

    /* Build the phone shell wrapper (wraps device-bar + iframe) */
    const phoneShell = document.createElement('div');
    phoneShell.id = 'vf-phone-shell';
    frameWrap.appendChild(phoneShell);

    const deviceBar = document.createElement('div');
    deviceBar.id = 'vf-device-bar';
    deviceBar.innerHTML = '<div class="notch"></div><div class="cam"></div>';
    phoneShell.appendChild(deviceBar);

    /* Build the control bar */
    const bar = document.createElement('div');
    bar.id = 'vf-res-bar';

    const lbl = document.createElement('span');
    lbl.className = 'vf-res-label';
    lbl.textContent = 'viewport';
    bar.appendChild(lbl);

    PRESETS.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = 'vf-res-btn' + (preset.id === activeId ? ' vf-active' : '');
      btn.id = 'vf-btn-' + preset.id;
      btn.title = preset.title;
      btn.textContent = preset.label + ' ' + preset.title;
      btn.addEventListener('click', () => applyPreset(preset.id));
      bar.appendChild(btn);
    });

    const sep = document.createElement('div');
    sep.className = 'vf-res-sep';
    bar.appendChild(sep);

    const rotBtn = document.createElement('button');
    rotBtn.className = 'vf-rot-btn';
    rotBtn.id = 'vf-rot-btn';
    rotBtn.title = 'Rotate (landscape/portrait)';
    rotBtn.textContent = '⟳ rotate';
    rotBtn.addEventListener('click', toggleRotate);
    bar.appendChild(rotBtn);

    const dims = document.createElement('span');
    dims.id = 'vf-res-dims';
    bar.appendChild(dims);

    /* Insert bar inside trial-wrap, just above the inject-result / gamelog */
    const injectResult = document.getElementById('inject-result');
    if (injectResult) {
      trialWrap.insertBefore(bar, injectResult);
    } else {
      const gamelogWrap = trialWrap.querySelector('.gamelog-wrap');
      if (gamelogWrap) trialWrap.insertBefore(bar, gamelogWrap);
      else trialWrap.appendChild(bar);
    }

    /* Move iframe into phone shell (if already exists) */
    relocateFrame();

    /* Observe DOM for when game-frame is created/replaced */
    const obs = new MutationObserver(() => relocateFrame());
    obs.observe(frameWrap, { childList: true, subtree: false });

    /* Initial apply */
    applyPreset('desktop');
  }

  /* ── Move #game-frame into phone shell ── */
  function relocateFrame() {
    const shell = document.getElementById('vf-phone-shell');
    const frame = document.getElementById('game-frame');
    const deviceBar = document.getElementById('vf-device-bar');
    if (!shell || !frame) return;
    if (frame.parentNode !== shell) {
      shell.appendChild(frame);
    }
    // ensure device bar stays first
    if (deviceBar && shell.firstChild !== deviceBar) {
      shell.insertBefore(deviceBar, shell.firstChild);
    }
    // re-apply current preset dimensions to the new frame
    applyPreset(activeId, true);
  }

  /* ── Apply a preset ── */
  function applyPreset(id, silent) {
    activeId = id;
    const preset = PRESETS.find(p => p.id === id);
    if (!preset) return;

    const frameWrap = document.getElementById('trial-frame-wrap');
    const frame = document.getElementById('game-frame');
    const deviceBar = document.getElementById('vf-device-bar');
    const rotBtn = document.getElementById('vf-rot-btn');
    const dims = document.getElementById('vf-res-dims');

    // Update active button
    PRESETS.forEach(p => {
      const btn = document.getElementById('vf-btn-' + p.id);
      if (btn) btn.classList.toggle('vf-active', p.id === id);
    });

    const isMobile = id !== 'desktop';

    let w = preset.w;
    let h = preset.h;

    // Apply landscape rotation (swap w/h for mobile)
    if (isMobile && isLandscape && w) {
      [w, h] = [h, w];
    }

    if (frameWrap) {
      frameWrap.classList.toggle('vf-contained', isMobile);
    }

    if (deviceBar) {
      deviceBar.classList.toggle('show', isMobile && !isLandscape);
    }

    if (frame) {
      if (isMobile && w) {
        frame.style.width  = w + 'px';
        frame.style.height = h + 'px';
        frame.style.borderRadius = isLandscape ? '8px' : '0 0 8px 8px';
      } else {
        // Desktop — full width
        frame.style.width  = '100%';
        frame.style.height = '640px';
        frame.style.borderRadius = '';
        frame.style.boxShadow = '';
      }
    }

    // Update rotate button state (only relevant for non-desktop)
    if (rotBtn) {
      rotBtn.style.opacity = isMobile ? '1' : '0.3';
      rotBtn.style.pointerEvents = isMobile ? '' : 'none';
      rotBtn.classList.toggle('vf-landscape', isLandscape && isMobile);
    }

    // Dims readout
    if (dims) {
      if (!isMobile) {
        dims.textContent = 'full width';
      } else {
        dims.textContent = (w || '?') + ' × ' + h + 'px';
      }
    }

    if (!silent) {
      logIfAvailable(`📐 Viewport → ${preset.title}${isLandscape && isMobile ? ' (landscape)' : ''}`);
    }
  }

  /* ── Rotate ── */
  function toggleRotate() {
    isLandscape = !isLandscape;
    applyPreset(activeId);
  }

  /* ── Optionally log to game console ── */
  function logIfAvailable(msg) {
    if (typeof addGameLog === 'function') {
      addGameLog('info', msg);
    }
  }

  /* ── Kick off ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();
