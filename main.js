const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvas(){
  const styleW = canvas.clientWidth || 960;
  const styleH = canvas.clientHeight || 640;
  canvas.width = styleW * devicePixelRatio;
  canvas.height = styleH * devicePixelRatio;
  canvas.style.width = styleW + 'px';
  canvas.style.height = styleH + 'px';
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
fitCanvas();
window.addEventListener('resize', ()=>{ fitCanvas(); });

const TILE = 32;

let mouse = {x: 400, y: 300, down:false};
let keys = {};
let joystick = {x:0,y:0};

// Audio (WebAudio synth) — small beeps for shoot/hit
let audioCtx = null;
function ensureAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
function playShoot(){ try{ ensureAudio(); const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='square'; o.frequency.value = 900; g.gain.value = 0.08; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime+0.12); o.stop(audioCtx.currentTime+0.13);}catch(e){} }
function playHit(){ try{ ensureAudio(); const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='sawtooth'; o.frequency.value = 220 + Math.random()*120; g.gain.value = 0.1; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime+0.22); o.stop(audioCtx.currentTime+0.23);}catch(e){} }

class Particle{
  constructor(x,y,dx,dy,color){ this.x=x; this.y=y; this.vx=dx; this.vy=dy; this.life=1.0; this.color=color; this.r=3+Math.random()*3; }
  update(dt){ this.x += this.vx*dt; this.y += this.vy*dt; this.vy += 160*dt; this.life -= dt; }
  draw(){ ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color; ctx.fillRect(this.x-this.r/2, this.y-this.r/2, this.r, this.r); ctx.globalAlpha = 1; }
}

document.addEventListener('mousemove', e=>{
  const rect = canvas.getBoundingClientRect(); mouse.x = (e.clientX - rect.left); mouse.y = (e.clientY - rect.top);
});
document.addEventListener('mousedown', ()=>{ mouse.down = true; try{ if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); } catch(e) {} });
document.addEventListener('mouseup', ()=> mouse.down = false);
document.addEventListener('keydown', e=>{ keys[e.key.toLowerCase()] = true; if(e.code==='Space') mouse.down = true; if(e.code==='KeyM') { if(audioCtx && audioCtx.state!=='suspended') audioCtx.suspend(); } });
document.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()] = false; if(e.code==='Space') mouse.down = false; });

class Player{
  constructor(x,y){ this.x = x; this.y = y; this.size=28; this.speed=180; this.reload=0; this.score=0; }
  update(dt){
    let dx=0, dy=0;
    if(joystick.x || joystick.y){ dx = joystick.x; dy = joystick.y; }
    else { if(keys['a']||keys['arrowleft']) dx -= 1; if(keys['d']||keys['arrowright']) dx += 1; if(keys['w']||keys['arrowup']) dy -= 1; if(keys['s']||keys['arrowdown']) dy += 1; }
    if(dx||dy){ const len = Math.hypot(dx,dy)||1; dx/=len; dy/=len; this.x += dx*this.speed*dt; this.y += dy*this.speed*dt; this.x = Math.max(20, Math.min(canvas.clientWidth-20, this.x)); this.y = Math.max(20, Math.min(canvas.clientHeight-20, this.y)); }
    if(this.reload>0) this.reload -= dt;
  }
  draw(){
    // body and legs
    ctx.fillStyle = '#1b1b1b'; ctx.fillRect(this.x-8,this.y+8,6,12); ctx.fillRect(this.x+2,this.y+8,6,12);
    ctx.fillStyle = '#0f3d2c'; ctx.fillRect(this.x-12,this.y-6,24,20);
    ctx.fillStyle = '#13392d'; ctx.fillRect(this.x-16,this.y-6,4,16); ctx.fillRect(this.x+12,this.y-6,4,16);
    ctx.fillStyle = '#e8c38a'; ctx.fillRect(this.x-11,this.y-28,22,22);
    ctx.fillStyle = '#000'; ctx.fillRect(this.x-5,this.y-22,3,3); ctx.fillRect(this.x+2,this.y-22,3,3);

    // gun
    const ang = Math.atan2(mouse.y - this.y, mouse.x - this.x);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(ang);
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(12, -4, 24, 8);
    ctx.fillRect(6, 2, 8, 10);
    ctx.fillStyle = '#111';
    ctx.fillRect(26, -3, 8, 6);
    ctx.restore();
  }
}

class Enemy{ constructor(x,y){ this.x=x; this.y=y; this.size=26; this.speed=70 + Math.random()*40; } update(dt, player){ const ax = player.x - this.x; const ay = player.y - this.y; const d = Math.hypot(ax,ay)||1; this.x += (ax/d)*this.speed*dt; this.y += (ay/d)*this.speed*dt; } draw(){
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(this.x-12,this.y-18,24,30);
    ctx.fillStyle = '#0d1a0f'; ctx.fillRect(this.x-12,this.y-18,24,10);
    ctx.fillStyle = '#742222'; ctx.fillRect(this.x-10,this.y-28,20,16);
    ctx.fillStyle = '#000'; ctx.fillRect(this.x-8,this.y-24,6,6); ctx.fillRect(this.x+2,this.y-24,6,6);
    ctx.fillStyle = '#e43535'; ctx.fillRect(this.x-5,this.y-16,10,4);
    ctx.fillStyle = '#382717'; ctx.fillRect(this.x-16,this.y-6,4,16); ctx.fillRect(this.x+12,this.y-6,4,16);
    ctx.fillStyle = '#a02f2f'; ctx.fillRect(this.x-10,this.y-8,20,4);
  } }

class Bullet{ constructor(x,y,vx,vy){ this.x=x; this.y=y; this.vx=vx; this.vy=vy; this.r=4; this.life=2; } update(dt){ this.x += this.vx*dt; this.y += this.vy*dt; this.life -= dt; } draw(){ ctx.fillStyle='#fff2a8'; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); } }

const levels = [5,8,12,16,22];
let currentLevel = 0;
let player = new Player(400,300);
let enemies = [];
let bullets = [];
let particles = [];

function spawnEnemies(n){ enemies = []; for(let i=0;i<n;i++){ const margin = 80; const x = Math.random()*(canvas.clientWidth-2*margin)+margin; const y = Math.random()*(canvas.clientHeight-2*margin)+margin; enemies.push(new Enemy(x,y)); } }

function spawnParticles(x,y,color,count=12){ for(let i=0;i<count;i++){ const ang = Math.random()*Math.PI*2; const sp = 80 + Math.random()*180; particles.push(new Particle(x, y, Math.cos(ang)*sp, Math.sin(ang)*sp, color)); } }

function setLevel(idx){ currentLevel = Math.max(0, Math.min(levels.length-1, idx)); spawnEnemies(levels[currentLevel]); document.getElementById('level').textContent = currentLevel+1; }

// level select UI
const levelSelect = document.getElementById('levelSelect');
for(let i=0;i<levels.length;i++){ const opt = document.createElement('option'); opt.value = i; opt.textContent = 'Level ' + (i+1); levelSelect.appendChild(opt); }
levelSelect.addEventListener('change', ()=>{ setLevel(parseInt(levelSelect.value)); });

// High score
const highKey = 'blockshot_highscore_v1';
function loadHigh(){ const v = parseInt(localStorage.getItem(highKey))||0; document.getElementById('highscore').textContent = v; return v; }
function saveHighIfHigher(score){ const cur = parseInt(localStorage.getItem(highKey))||0; if(score > cur){ localStorage.setItem(highKey, score); document.getElementById('highscore').textContent = score; } }
document.getElementById('resetHigh').addEventListener('click', ()=>{ localStorage.removeItem(highKey); document.getElementById('highscore').textContent = '0'; });
loadHigh();

spawnEnemies(levels[0]);

function drawForestFloor(){
  const cols = Math.ceil(canvas.clientWidth / TILE);
  const rows = Math.ceil(canvas.clientHeight / TILE);
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const x=c*TILE, y=r*TILE;
      if(r > rows - 4){ ctx.fillStyle = '#3d331f'; ctx.fillRect(x,y,TILE,TILE); if(r === rows-4){ ctx.fillStyle = '#4b6c2f'; ctx.fillRect(x,y, TILE, TILE/3); } }
      else { ctx.fillStyle = (Math.random()<0.15)? '#356131' : '#244826'; ctx.fillRect(x,y,TILE,TILE); }
      if(Math.random() < 0.05){ ctx.fillStyle = '#1f4b1f'; ctx.fillRect(x+6,y+6,20,20); }
      ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.strokeRect(x+0.5,y+0.5,TILE-1,TILE-1);
    }
  }

  // simple forest silhouettes
  const treePositions = [80, 240, 420, 600, 760];
  for(let tx of treePositions){
    const ty = 120 + (tx % 180);
    ctx.fillStyle = '#5d3b1d'; ctx.fillRect(tx-4, ty, 8, 60);
    ctx.fillStyle = '#1f5b2f';
    ctx.beginPath(); ctx.moveTo(tx-26, ty+12); ctx.lineTo(tx+26, ty+12); ctx.lineTo(tx, ty-22); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx-22, ty+28); ctx.lineTo(tx+22, ty+28); ctx.lineTo(tx, ty-10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx-18, ty+42); ctx.lineTo(tx+18, ty+42); ctx.lineTo(tx, ty+8); ctx.fill();
  }
}

let last = performance.now();
function loop(t){
  const dt = Math.min(0.05, (t-last)/1000); last = t;
  player.update(dt);
  for(let b of bullets) b.update(dt);
  for(let p of particles) p.update(dt);
  for(let e of enemies) e.update(dt, player);
  bullets = bullets.filter(b => b.life>0 && b.x>0 && b.x<canvas.clientWidth && b.y>0 && b.y<canvas.clientHeight);
  particles = particles.filter(p => p.life>0 && p.y < canvas.clientHeight+100);

  // shooting
  if(mouse.down && player.reload <= 0){
    const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const speed = 520;
    bullets.push(new Bullet(player.x + Math.cos(ang)*20, player.y + Math.sin(ang)*20, Math.cos(ang)*speed, Math.sin(ang)*speed));
    player.reload = 0.18; playShoot();
  }

  // collisions
  for(let i=enemies.length-1;i>=0;i--){
    const e = enemies[i];
    for(let j=bullets.length-1;j>=0;j--){
      const b = bullets[j];
      const dx = e.x - b.x; const dy = e.y - b.y;
      if(Math.hypot(dx,dy) < 18){
        spawnParticles(e.x, e.y, '#e07f7f', 16);
        enemies.splice(i,1); bullets.splice(j,1); player.score += 10; document.getElementById('score').textContent = player.score; playHit(); saveHighIfHigher(player.score); break;
      }
    }
  }

  // level cleared?
  if(enemies.length === 0){
    if(currentLevel < levels.length-1){ setLevel(currentLevel+1); levelSelect.value = currentLevel; }
    else { spawnEnemies(levels[levels.length-1] + Math.floor(Math.random()*6)); }
  }

  // draw
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawForestFloor();
  for(let p of particles) p.draw();
  for(let e of enemies) e.draw();
  for(let b of bullets) b.draw();
  player.draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// Mobile touch joystick + shoot button
const joystickEl = document.getElementById('joystick');
const shootBtn = document.getElementById('shootBtn');
let activeJoyId = null; let joyStart = null;
joystickEl.addEventListener('touchstart', (ev)=>{ ev.preventDefault(); const t = ev.changedTouches[0]; activeJoyId = t.identifier; joyStart = {x:t.clientX, y:t.clientY}; }, {passive:false});
joystickEl.addEventListener('touchmove', (ev)=>{ ev.preventDefault(); for(const t of ev.changedTouches){ if(t.identifier===activeJoyId){ const dx = t.clientX - joyStart.x; const dy = t.clientY - joyStart.y; const max = 48; joystick.x = Math.max(-1, Math.min(1, dx/max)); joystick.y = Math.max(-1, Math.min(1, dy/max)); } } }, {passive:false});
joystickEl.addEventListener('touchend', (ev)=>{ for(const t of ev.changedTouches){ if(t.identifier===activeJoyId){ activeJoyId = null; joyStart=null; joystick.x=0; joystick.y=0; } } }, {passive:false});

shootBtn.addEventListener('touchstart', (ev)=>{ ev.preventDefault(); mouse.down = true; }, {passive:false});
shootBtn.addEventListener('touchend', (ev)=>{ ev.preventDefault(); mouse.down = false; }, {passive:false});

// keep canvas centered on load
window.addEventListener('load', ()=>{ fitCanvas(); player.x = canvas.clientWidth/2; player.y = canvas.clientHeight/2; });
