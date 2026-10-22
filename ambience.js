(() => {
  'use strict';

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 520px)');
  const button = document.querySelector('.motion-control');
  const sky = document.getElementById('dragon-sky');
  const ctx = sky.getContext('2d');
  let paused = reducedMotion.matches;
  let elapsed = 0;
  let lastTick = 0;
  let request = 0;
  let width = 0;
  let height = 0;
  let carvers = [];
  let resizeVersion = 0;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  const images = new Map();
  function asset(name) {
    if (!images.has(name)) images.set(name, loadImage(`/assets/${name}`));
    return images.get(name);
  }

  let dragon;
  // Register each pose at the shoulder so the body remains steady during a beat: anchor, then shift and tilt.
  const anchors = [[306, 350], [309, 350], [309, 348], [294, 254], [320, 268], [327, 313]];
  const offsets = [null, null, null, [-23, 18, 16 * Math.PI / 180], null, null];
  // One wingbeat, starting and ending on the gliding pose.
  const beat = [2, 1, 0, 1, 2, 4, 3, 4];
  const flapTime = 1.8;
  const flaps = 2;
  // Farthest first: the small dragon flies low near the mountains, slower and veiled by the haze.
  const flights = [
    { offset: .58, period: 84, size: .06, y: .2, phase: 4.7, direction: 1, haze: .38 },
    { offset: .76, period: 47, size: .17, y: .17, phase: 2.4, direction: -1, haze: 0 },
    { offset: .25, period: 34, size: .27, y: .215, phase: 0, direction: 1, haze: 0 },
  ];

  // Poses are cross-faded on a scratch canvas: additive blending of premultiplied pixels keeps the body opaque.
  const blend = document.createElement('canvas');
  const blendCtx = blend.getContext('2d');

  function drawPose(target, pose, scale, alpha) {
    const col = pose % 3;
    const row = Math.floor(pose / 3);
    const anchor = anchors[pose];
    const offset = offsets[pose];
    target.save();
    if (offset) {
      target.translate(offset[0] * scale, offset[1] * scale);
      target.rotate(offset[2]);
    }
    target.globalAlpha = alpha;
    target.drawImage(dragon, col * 512, row * 512, 512, 512,
      -anchor[0] * scale, -anchor[1] * scale, 512 * scale, 512 * scale);
    target.restore();
  }

  // Wing position along the beat, from 0 to beat.length: eased so the wings linger at the top and bottom.
  function wingPosition(cycle) {
    if (cycle >= flapTime * flaps) return 0;
    const flap = (cycle / flapTime) % 1;
    const eased = flap + Math.sin(flap * Math.PI * 4) / (Math.PI * 8);
    return eased * beat.length;
  }

  function drawWings(position, scale, density, haze) {
    const index = Math.floor(position) % beat.length;
    // A short, eased fade between two poses: each pose stays crisp most of the time.
    const fade = Math.min(Math.max((position - Math.floor(position) - .25) / .5, 0), 1);
    const mix = fade * fade * (3 - 2 * fade);
    const from = beat[index];
    const to = beat[(index + 1) % beat.length];
    const single = mix < .01 || mix > .99 || from === to;
    if (single && !haze) { drawPose(ctx, mix > .99 ? to : from, scale, 1); return; }
    const box = Math.ceil(1400 * scale * density);
    if (blend.width < box) blend.width = blend.height = box;
    blendCtx.setTransform(1, 0, 0, 1, 0, 0);
    blendCtx.globalCompositeOperation = 'source-over';
    blendCtx.clearRect(0, 0, box, box);
    blendCtx.setTransform(density, 0, 0, density, box / 2, box / 2);
    blendCtx.globalCompositeOperation = 'lighter';
    if (single) drawPose(blendCtx, mix > .99 ? to : from, scale, 1);
    else {
      drawPose(blendCtx, from, scale, 1 - mix);
      drawPose(blendCtx, to, scale, mix);
    }
    if (haze) {
      // Distant air: tint the dragon towards the pale blue of the far mountains.
      blendCtx.setTransform(1, 0, 0, 1, 0, 0);
      blendCtx.globalCompositeOperation = 'source-atop';
      blendCtx.globalAlpha = haze;
      blendCtx.fillStyle = '#a9bcd6';
      blendCtx.fillRect(0, 0, box, box);
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(blend, 0, 0, box, box, -box / 2 / density, -box / 2 / density, box / density, box / density);
  }

  function drawDragons(time) {
    if (!ctx || !dragon) return;
    ctx.clearRect(0, 0, width, height);
    const header = document.querySelector('.site-header').offsetHeight;
    const density = Math.min(devicePixelRatio || 1, 2);
    for (const flight of flights) {
      const size = Math.max(flight.size * width, flight.size * 760);
      const progress = (flight.offset + time / flight.period) % 1;
      const x = flight.direction === 1
        ? -size + progress * (width + size * 2)
        : width + size - progress * (width + size * 2);
      const y = header + (flight.y - .08) * 650 + Math.sin(time * .19 + flight.phase) * 17;
      const cycle = (time + flight.phase) % 9;
      // Broad, slow wingbeats alternate with long quiet glides.
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flight.direction, 1);
      ctx.rotate(Math.sin(time * .2 + flight.phase) * .025 - .055);
      drawWings(wingPosition(cycle), size / 512, density, flight.haze);
      ctx.restore();
    }
  }

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = vec2((a_position.x + 1.0) * .5, (1.0 - a_position.y) * .5);
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`;
  const fragmentSource = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_image;
    uniform vec4 u_crop;
    uniform vec4 u_heads[3];
    uniform float u_time;
    void main() {
      vec2 uv = v_uv;
      for (int i = 0; i < 3; i++) {
        vec4 head = u_heads[i];
        vec2 d = (v_uv - head.xy) / head.zw;
        float falloff = 1.0 - smoothstep(.25, 1.0, length(d));
        float anchored = falloff * smoothstep(.0, .1, v_uv.y)
          * (1.0 - smoothstep(.88, 1.0, v_uv.y));
        float phase = float(i) * 2.1;
        uv.x -= sin(u_time * .43 + phase) * .0020 * anchored;
        uv.y -= (cos(u_time * .36 + phase) - 1.0) * .0040 * anchored;
      }
      gl_FragColor = texture2D(u_image, u_crop.xy + uv * u_crop.zw);
    }`;

  function shader(gl, type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error('Carving shader unavailable');
    return result;
  }

  function carving(element, image, crop, heads) {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return null;
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl, gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, shader(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Premultiplied texels keep the hidden colour of transparent pixels out of the edges (Safari showed red fringes).
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform4fv(gl.getUniformLocation(program, 'u_crop'), crop);
    gl.uniform4fv(gl.getUniformLocation(program, 'u_heads[0]'), heads.flat());
    const clock = gl.getUniformLocation(program, 'u_time');
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(element.clientWidth * density);
    canvas.height = Math.round(element.clientHeight * density);
    gl.viewport(0, 0, canvas.width, canvas.height);
    element.replaceChildren(canvas);
    element.classList.add('animated-carving');
    const result = {
      element,
      visible: true,
      draw(time) {
        if (!this.visible) return;
        gl.uniform1f(clock, time);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      destroy() {
        observer.unobserve(element);
        element.classList.remove('animated-carving');
        canvas.remove();
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      },
    };
    observer.observe(element);
    result.draw(0);
    return result;
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const item = carvers.find(item => item.element === entry.target);
      if (item) { item.visible = entry.isIntersecting; if (item.visible) item.draw(elapsed); }
    }
  }, { rootMargin: '80px' });

  async function resize() {
    const version = ++resizeVersion;
    width = innerWidth;
    height = innerHeight;
    const density = Math.min(devicePixelRatio || 1, 2);
    sky.width = Math.round(width * density);
    sky.height = Math.round(height * density);
    ctx?.setTransform(density, 0, 0, density, 0, 0);
    drawDragons(elapsed);
    const portrait = mobile.matches;
    const [royal, projects] = await Promise.all([
      asset(portrait ? 'top-royal-frame-portrait.webp' : 'top-royal-frame.webp'),
      asset('project-frames-lion-dragon.webp'),
    ]).catch(() => []);
    if (version !== resizeVersion || !royal || !projects) return;
    carvers.forEach(item => item.destroy());
    carvers = [];
    const disabled = [-2, -2, .01, .01];
    const configurations = [
      ['.royal-panel', royal, [0, 0, 1, portrait ? 297 / 1536 : 288.8 / 871],
        portrait ? [[.5, .52, .13, .45], [.10, .3, .10, .3], [.9, .3, .10, .3]]
          : [[.5, .52, .07, .44], [.064, .32, .06, .3], [.936, .32, .06, .3]]],
      ['.lion-panel', projects, [0, 0, 1 / 3, .34], [[.5, .54, .15, .4], disabled, disabled]],
      ['.dragon-panel', projects, [1 / 3, 0, 1 / 3, .34], [[.12, .55, .12, .34], [.88, .55, .12, .34], disabled]],
      ['.nature-panel', projects, [2 / 3, 0, 1 / 3, .34], [[.15, .58, .14, .38], [.89, .56, .12, .35], disabled]],
      ['.tableaux-panel', projects, [0, 0, 1 / 3, .34], [[.5, .54, .15, .4], disabled, disabled]],
    ];
    for (const [selector, image, crop, heads] of configurations) {
      try {
        const result = carving(document.querySelector(`${selector} .frame-top`), image, crop, heads);
        if (result) carvers.push(result);
      } catch (_) { /* The original carved artwork is the static fallback. */ }
    }
    carvers.forEach(item => item.draw(elapsed));
  }

  function tick(timestamp) {
    request = 0;
    if (document.hidden || paused) { lastTick = 0; return; }
    if (!lastTick) lastTick = timestamp;
    const delta = timestamp - lastTick;
    if (delta >= 1000 / 70) {
      elapsed += Math.min(delta, 100) / 1000;
      lastTick = timestamp;
      drawDragons(elapsed);
      carvers.forEach(item => item.draw(elapsed));
    }
    request = requestAnimationFrame(tick);
  }

  const motionLabels = {"fr":["Animer le royaume","Mettre l’animation en pause"],"en":["Animate the kingdom","Pause animation"],"es":["Animar el reino","Pausar animación"],"de":["Königreich animieren","Animation pausieren"],"it":["Anima il regno","Metti in pausa l'animazione"],"pt":["Animar o reino","Pausar animação"],"ja":["アニメーションを再開","アニメーションを一時停止"],"ko":["애니메이션 재생","애니메이션 일시 정지"],"zh-cn":["恢复动画","暂停动画"],"zh-tw":["繼續動畫","暫停動畫"],"hi":["एनिमेशन फिर चलाएँ","एनिमेशन रोकें"],"id":["Lanjutkan animasi","Jeda animasi"],"pt-br":["Continuar animação","Pausar animação"],"es-mx":["Reanudar animación","Pausar animación"],"ar":["استئناف الحركة","إيقاف الحركة مؤقتًا"],"tr":["Animasyonu sürdür","Animasyonu duraklat"],"ru":["Возобновить анимацию","Приостановить анимацию"],"nl":["Animatie hervatten","Animatie pauzeren"],"pl":["Wznów animację","Wstrzymaj animację"],"th":["เล่นภาพเคลื่อนไหวต่อ","หยุดภาพเคลื่อนไหวชั่วคราว"],"vi":["Tiếp tục hoạt ảnh","Tạm dừng hoạt ảnh"],"uk":["Відновити анімацію","Призупинити анімацію"],"sv":["Återuppta animation","Pausa animation"],"ms":["Sambung animasi","Jeda animasi"],"ro":["Reia animația","Pune animația pe pauză"],"el":["Συνέχεια κινούμενων εικόνων","Παύση κινούμενων εικόνων"],"cs":["Obnovit animaci","Pozastavit animaci"],"hu":["Animáció folytatása","Animáció szüneteltetése"],"fi":["Jatka animaatiota","Keskeytä animaatio"],"he":["המשך הנפשה","השהה הנפשה"],"da":["Genoptag animation","Sæt animation på pause"],"nb":["Fortsett animasjonen","Sett animasjonen på pause"],"sk":["Obnoviť animáciu","Pozastaviť animáciu"],"bg":["Продължи анимацията","Спри анимацията"],"hr":["Nastavi animaciju","Pauziraj animaciju"],"sl":["Nadaljuj animacijo","Začasno ustavi animacijo"],"lt":["Tęsti animaciją","Pristabdyti animaciją"],"lv":["Atsākt animāciju","Apturēt animāciju"],"et":["Jätka animatsiooni","Peata animatsioon"],"ca":["Reprèn l'animació","Posa l'animació en pausa"]};
  function updateMotion() {
    button.setAttribute('aria-pressed', String(paused));
    const locale = document.documentElement.lang.toLowerCase();
    const labels = motionLabels[locale] || motionLabels[locale.split('-')[0]] || motionLabels.fr;
    button.textContent = labels[paused ? 0 : 1];
    if (paused && request) { cancelAnimationFrame(request); request = 0; lastTick = 0; }
    if (!paused && !document.hidden && !request) request = requestAnimationFrame(tick);
  }

  button.addEventListener('click', () => { paused = !paused; updateMotion(); });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updateMotion(); });
  document.addEventListener('visibilitychange', updateMotion);
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 120); });
  asset('dragon-flight.webp').then(image => { dragon = image; drawDragons(elapsed); }).catch(() => {});
  document.fonts.ready.then(resize);
  updateMotion();
})();
