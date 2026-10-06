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
    if (!images.has(name)) images.set(name, loadImage(`assets/${name}`));
    return images.get(name);
  }

  let dragon;
  // Register each pose at the shoulder so the body remains steady during a beat.
  const anchors = [[306, 350], [309, 350], [309, 348], [294, 254], [308, 296], [327, 313]];
  const beat = [0, 1, 2, 4, 3, 4, 2, 1];
  const flights = [
    { offset: .76, period: 47, size: .17, y: .17, phase: 2.4, direction: -1 },
    { offset: .25, period: 34, size: .27, y: .215, phase: 0, direction: 1 },
    { offset: .58, period: 59, size: .09, y: .13, phase: 4.7, direction: 1 },
  ];

  function drawPose(pose, scale) {
    const col = pose % 3;
    const row = Math.floor(pose / 3);
    const anchor = anchors[pose];
    ctx.drawImage(dragon, col * 512, row * 512, 512, 512,
      -anchor[0] * scale, -anchor[1] * scale, 512 * scale, 512 * scale);
  }

  function drawDragons(time) {
    if (!ctx || !dragon) return;
    ctx.clearRect(0, 0, width, height);
    const header = document.querySelector('.site-header').offsetHeight;
    for (const flight of flights) {
      const size = Math.max(flight.size * width, flight.size * 760);
      const progress = (flight.offset + time / flight.period) % 1;
      const x = flight.direction === 1
        ? -size + progress * (width + size * 2)
        : width + size - progress * (width + size * 2);
      const y = header + (flight.y - .08) * 650 + Math.sin(time * .19 + flight.phase) * 17;
      const cycle = (time + flight.phase) % 9;
      // Broad, slow wingbeats alternate with long quiet glides.
      const pose = cycle < 3.2 ? beat[Math.floor(cycle / .2) % beat.length] : 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flight.direction, 1);
      ctx.rotate(Math.sin(time * .2 + flight.phase) * .025 - .055);
      drawPose(pose, size / 512);
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
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
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
      asset(portrait ? 'top-royal-frame-portrait.png' : 'top-royal-frame.png'),
      asset('project-frames-lion-dragon.png'),
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
    if (delta >= 1000 / 30) {
      elapsed += Math.min(delta, 100) / 1000;
      lastTick = timestamp;
      drawDragons(elapsed);
      carvers.forEach(item => item.draw(elapsed));
    }
    request = requestAnimationFrame(tick);
  }

  function updateMotion() {
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? 'Animer le royaume' : 'Mettre l’animation en pause';
    if (paused && request) { cancelAnimationFrame(request); request = 0; lastTick = 0; }
    if (!paused && !document.hidden && !request) request = requestAnimationFrame(tick);
  }

  button.addEventListener('click', () => { paused = !paused; updateMotion(); });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updateMotion(); });
  document.addEventListener('visibilitychange', updateMotion);
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 120); });
  asset('dragon-flight.png').then(image => { dragon = image; drawDragons(elapsed); }).catch(() => {});
  document.fonts.ready.then(resize);
  updateMotion();
})();
