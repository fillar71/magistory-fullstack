// idea.js
// ------------------------------
// CONFIG
// ------------------------------
const apiBase = 'https://magistory-fullstack-production.up.railway.app/api'; // leave empty for Acode/mobile local preview; set to backend URL in production (e.g. 'https://your-server.com/api')
const generateBtn = document.getElementById('generate-btn');
const ideaTextEl = document.getElementById('idea-text');
const statusEl = document.getElementById('generate-status');

const timelineArea = document.getElementById('timeline-area');
const timelineTitle = document.getElementById('timeline-title');
const scenesContainer = document.getElementById('scenes-container');
const previewPlayer = document.getElementById('preview-player');

const saveProjectBtn = document.getElementById('save-project');
const renderProjectBtn = document.getElementById('render-project');
const renderModal = document.getElementById('render-modal');
const startRenderBtn = document.getElementById('start-render');
const cancelRenderBtn = document.getElementById('cancel-render');
const renderResolution = document.getElementById('render-resolution');
const renderStatus = document.getElementById('render-status');

const pexelsModal = document.getElementById('pexels-modal');
const pexelsQuery = document.getElementById('pexels-query');
const pexelsSearchBtn = document.getElementById('pexels-search');
const pexelsResults = document.getElementById('pexels-results');
const closePexels = document.getElementById('close-pexels');

const downloadJsonBtn = document.getElementById('download-json');

let currentProject = null;
let previewPlaylist = [];
let previewTimeout = null;

// Helpers
function setStatus(msg){ statusEl.textContent = msg; }
function humanTime(s){
  const mm = String(Math.floor(s/60)).padStart(2,'0');
  const ss = String(Math.floor(s%60)).padStart(2,'0');
  return `${mm}:${ss}`;
}

// Mock Gemini generator (used when apiBase not set or fetch fails)
function mockGeminiGenerate(idea, cfg){
  // simple splitting: create scenes by keywords in idea or by even chunks
  const totalSec = Number(cfg.duration) || 30;
  const sceneCount = Math.max(1, Math.min(6, Math.ceil(totalSec / 30)));
  const per = Math.floor(totalSec / sceneCount);
  const adegan = [];
  for(let i=0;i<sceneCount;i++){
    const start = i*per;
    const end = (i+1)*per;
    const duration = `${String(Math.floor(start/60)).padStart(2,'0')}:${String(start%60).padStart(2,'0')}-${String(Math.floor(end/60)).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`;
    const keywords = extractKeywordsFromIdea(idea).slice(i*3, i*3 + 3);
    adegan.push({
      nomor_adegan: i+1,
      durasi: duration,
      deskripsi_visual: keywords.length ? keywords : [`topic${i+1}`],
      narasi: `Narasi singkat untuk adegan ${i+1}. ${idea}`
    });
  }
  return { judul: `Project: ${idea.slice(0,40)}`, adegan };
}

function extractKeywordsFromIdea(text){
  if(!text) return [];
  // naive split words, take unique nouns-like words >3 chars
  const words = text.replace(/[^\w\s]/g,'').split(/\s+/).map(w=>w.toLowerCase());
  const filtered = words.filter(w=>w.length>3);
  // unique
  const uniq = [...new Set(filtered)];
  return uniq.slice(0, 30);
}

// ------------------------------
// Events & flow
// ------------------------------
document.getElementById('load-sample').addEventListener('click', ()=>{
  ideaTextEl.value = "AI dan dampaknya pada pekerjaan manusia. Tekankan contoh: pekerja pabrik, kasir, pekerja kantoran, dan robot di industri.";
});

downloadJsonBtn.addEventListener('click', ()=>{
  if(!currentProject) return alert('Belum ada project. Generate dulu.');
  const blob = new Blob([JSON.stringify(currentProject, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(currentProject.judul||'project').replace(/\s+/g,'_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

generateBtn.addEventListener('click', async ()=>{
  const idea = ideaTextEl.value.trim();
  if(!idea){ setStatus('Tuliskan ide terlebih dahulu.'); return; }
  const cfg = {
    duration: Number(document.getElementById('config-duration').value) || 30,
    aspect: document.getElementById('config-aspect').value,
    style: document.getElementById('config-style').value
  };
  setStatus('Mengirim permintaan generate...');
  generateBtn.disabled = true;

  // try backend if apiBase defined, else fallback to mock
  if(apiBase){
    try {
      const r = await fetch(apiBase + '/generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ idea, config: cfg })
      });
      if(!r.ok) throw new Error('backend error');
      const json = await r.json();
      // accept either { project } or raw parsed gemini output
      if(json.project) currentProject = json.project;
      else currentProject = transformGeminiToProject(json);
    } catch(err){
      console.warn('backend generate failed, using mock', err);
      currentProject = transformGeminiToProject(mockGeminiGenerate(idea, cfg));
    }
  } else {
    currentProject = transformGeminiToProject(mockGeminiGenerate(idea, cfg));
  }

  // ensure clips exist
  fillProjectWithClips(currentProject);
  renderTimeline(currentProject);
  setStatus('Timeline ter-generate.');
  timelineArea.style.display = 'block';
  generateBtn.disabled = false;
});

// transform gemini format -> front project format if needed
function transformGeminiToProject(gem){
  if(!gem) return null;
  // gem might already have 'judul' and 'adegan'
  return {
    id: 'local-' + Date.now(),
    judul: gem.judul || gem.title || 'Project',
    adegan: (gem.adegan || gem.scenes || []).map(s=>{
      return {
        nomor_adegan: s.nomor_adegan || s.scene || s.index || 1,
        durasi: s.durasi || s.duration || '00:00-00:30',
        deskripsi_visual: s.deskripsi_visual || s.visual || [],
        narasi: s.narasi || s.narration || ''
      };
    })
  };
}

// populate adegan[].clips with placeholder or pexels results (max 5)
function fillProjectWithClips(project){
  project.adegan.forEach(sc=>{
    const sec = parseSceneDurationToSeconds(sc.durasi);
    const count = Math.max(1, Math.min(5, Math.ceil(sec / 5)));
    sc.clips = sc.clips || [];
    // if insufficient, push placeholders
    while(sc.clips.length < count){
      sc.clips.push({
        type: 'image',
        src: placeholderForKeywords(sc.deskripsi_visual, sc.nomor_adegan, sc.clips.length),
        duration: 5,
        trimStart: 0,
        keywords: sc.deskripsi_visual
      });
    }
    // limit to 5
    sc.clips = sc.clips.slice(0,5);
  });
}

function placeholderForKeywords(keywords, sceneIndex, idx){
  const q = (keywords && keywords.length) ? keywords[0] : `scene${sceneIndex}`;
  // use placeholder.com to generate image
  const text = encodeURIComponent(q);
  return `https://via.placeholder.com/640x360.png?text=${text}`;
}

function parseSceneDurationToSeconds(range){
  if(!range) return 5;
  const m = range.match(/([0-9]{2}):([0-9]{2})-([0-9]{2}):([0-9]{2})/);
  if(!m) return 5;
  const a = Number(m[1])*60 + Number(m[2]);
  const b = Number(m[3])*60 + Number(m[4]);
  return Math.max(1, b - a);
}

// ------------------------------
// RENDER TIMELINE UI
// ------------------------------
function renderTimeline(project){
  timelineTitle.textContent = project.judul || 'Tanpa Judul';
  scenesContainer.innerHTML = '';
  previewPlaylist = [];

  project.adegan.forEach((scene, i) => {
    const sceneCard = document.createElement('div');
    sceneCard.className = 'scene-card';

    const meta = document.createElement('div');
    meta.className = 'scene-meta';
    meta.innerHTML = `<strong>Adegan ${scene.nomor_adegan}</strong>
      <div class="small">Durasi: <span class="scene-duration">${scene.durasi}</span></div>
      <div class="small">Deskripsi Visual: ${scene.deskripsi_visual.join(', ')}</div>
      <div style="margin-top:8px;"><textarea class="scene-narasi" data-scene="${i}" rows="3">${scene.narasi || ''}</textarea></div>
      <div class="small">Klik dan seret klip untuk urutkan ulang.</div>
    `;

    const clipsWrap = document.createElement('div');
    clipsWrap.className = 'scene-clips';

    scene.clips.forEach((clip, ci) => {
      const clipEl = document.createElement('div');
      clipEl.className = 'clip';
      clipEl.draggable = true;
      clipEl.dataset.scene = i;
      clipEl.dataset.index = ci;

      if(clip.type === 'video'){
        clipEl.innerHTML = `<video src="${clip.src}" muted></video>
          <div class="small">dur: <input type="number" class="clip-duration" value="${clip.duration}" min="1" style="width:60px"/></div>
          <div class="clip-controls">
            <button class="btn small replace-clip">Ganti</button>
            <button class="btn small trim-clip">Trim</button>
          </div>`;
      } else {
        clipEl.innerHTML = `<img src="${clip.src}" alt="clip" />
          <div class="small">dur: <input type="number" class="clip-duration" value="${clip.duration}" min="1" style="width:60px"/></div>
          <div class="clip-controls">
            <button class="btn small replace-clip">Ganti</button>
          </div>`;
      }

      // replace handler -> open pexels modal (or choose local file)
      clipEl.querySelector('.replace-clip').addEventListener('click', ()=>{
        openPexelsModal((selected)=> {
          clip.type = selected.type;
          clip.src = selected.src;
          renderTimeline(currentProject);
        });
      });

      const trimBtn = clipEl.querySelector('.trim-clip');
      if(trimBtn){
        trimBtn.addEventListener('click', ()=>{
          const start = prompt('Trim mulai (detik):', String(clip.trimStart || 0));
          const dur = prompt('Trim durasi (detik):', String(clip.duration || 5));
          if(start !== null && dur !== null){
            clip.trimStart = Number(start);
            clip.duration = Number(dur);
            renderTimeline(currentProject);
          }
        });
      }

      // change duration input
      clipEl.querySelector('.clip-duration').addEventListener('change', (e)=>{
        clip.duration = Number(e.target.value);
        renderPreview();
      });

      // drag/drop
      clipEl.addEventListener('dragstart', (ev)=>{
        ev.dataTransfer.setData('text/plain', JSON.stringify({scene:i, index:ci}));
      });
      clipEl.addEventListener('dragover', ev=>ev.preventDefault());
      clipEl.addEventListener('drop', (ev)=>{
        ev.preventDefault();
        try {
          const payload = JSON.parse(ev.dataTransfer.getData('text/plain'));
          const srcScene = payload.scene;
          const srcIndex = payload.index;
          const dstScene = Number(clipEl.dataset.scene);
          const dstIndex = Number(clipEl.dataset.index);
          const tmp = currentProject.adegan[srcScene].clips[srcIndex];
          currentProject.adegan[srcScene].clips.splice(srcIndex,1);
          currentProject.adegan[dstScene].clips.splice(dstIndex,0,tmp);
          renderTimeline(currentProject);
        } catch(e){ console.warn(e); }
      });

      clipsWrap.appendChild(clipEl);
    });

    sceneCard.appendChild(meta);
    sceneCard.appendChild(clipsWrap);
    scenesContainer.appendChild(sceneCard);
  });

  // attach edits binding for narasi changes
  document.querySelectorAll('.scene-narasi').forEach((el, idx)=>{
    el.addEventListener('input', ()=> currentProject.adegan[idx].narasi = el.value);
  });

  renderPreview();
}

// ------------------------------
// PREVIEW (carousel playback of clips sequentially)
// ------------------------------
function renderPreview(){
  if(previewTimeout) { clearTimeout(previewTimeout); previewTimeout = null; }
  previewPlaylist = [];
  currentProject.adegan.forEach(scene=>{
    scene.clips.forEach(c=>{
      previewPlaylist.push({...c, sceneIndex: scene.nomor_adegan});
    });
  });
  const player = previewPlayer;
  player.innerHTML = '';
  if(previewPlaylist.length === 0){ player.textContent = 'Tidak ada media untuk preview'; return; }

  let idx = 0;
  const show = (i) => {
    if(!previewPlaylist[i]) return;
    player.innerHTML = '';
    const clip = previewPlaylist[i];
    if(clip.type === 'video'){
      const v = document.createElement('video');
      v.src = clip.src;
      v.muted = true;
      v.autoplay = true;
      v.playsInline = true;
      v.style.width = '100%';
      v.style.height = '100%';
      v.style.objectFit = 'cover';
      player.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = clip.src;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      player.appendChild(img);
    }
    const duration = (clip.duration || 5) * 1000;
    previewTimeout = setTimeout(()=>{
      idx = (idx + 1) % previewPlaylist.length;
      show(idx);
    }, duration);
  };
  show(0);
}

// ------------------------------
// PEXELS MODAL (simple wrapper, uses backend if available else placeholders)
// ------------------------------
function openPexelsModal(callback){
  pexelsModal.classList.remove('hidden');
  pexelsModal._onSelect = callback;
  pexelsResults.innerHTML = '<div class="small">Ready. Masukkan keyword lalu klik Cari.</div>';
}
pexelsSearchBtn.addEventListener('click', async ()=>{
  const q = pexelsQuery.value.trim();
  if(!q) return alert('Masukkan keyword.');
  pexelsResults.innerHTML = 'Mencari...';
  if(apiBase){
    try {
      const r = await fetch(apiBase + '/pexels-search?q=' + encodeURIComponent(q));
      const json = await r.json();
      pexelsResults.innerHTML = '';
      const photos = json.photos || [];
      if(photos.length === 0) pexelsResults.innerHTML = '<div class="small">Tidak ada hasil.</div>';
      photos.forEach(p=>{
        const div = document.createElement('div');
        div.className = 'media-item';
        div.innerHTML = `<img src="${p.src.medium}" style="width:100%;height:100px;object-fit:cover"/><div class="small">${p.photographer||''}</div>`;
        div.addEventListener('click', ()=>{
          const sel = { type: 'image', src: p.src.original };
          if(pexelsModal._onSelect) pexelsModal._onSelect(sel);
          pexelsModal.classList.add('hidden');
        });
        pexelsResults.appendChild(div);
      });
      return;
    } catch(err){
      console.warn('pexels backend failed', err);
    }
  }
  // fallback: generate placeholder grid
  pexelsResults.innerHTML = '';
  for(let i=0;i<8;i++){
    const div = document.createElement('div');
    div.className='media-item';
    const url = `https://via.placeholder.com/640x360.png?text=${encodeURIComponent(q+'_'+(i+1))}`;
    div.innerHTML = `<img src="${url}" style="width:100%;height:100px;object-fit:cover"/><div class="small">placeholder</div>`;
    div.addEventListener('click', ()=>{
      const sel = { type: 'image', src: url };
      if(pexelsModal._onSelect) pexelsModal._onSelect(sel);
      pexelsModal.classList.add('hidden');
    });
    pexelsResults.appendChild(div);
  }
});
closePexels.addEventListener('click', ()=> pexelsModal.classList.add('hidden'));

// ------------------------------
// Save Project (download JSON) and Save to localStorage auto
// ------------------------------
saveProjectBtn.addEventListener('click', ()=>{
  if(!currentProject) return alert('Tidak ada project untuk disimpan.');
  // update narasi from textareas
  document.querySelectorAll('.scene-narasi').forEach((el, idx)=> currentProject.adegan[idx].narasi = el.value);
  // save to localStorage
  try {
    localStorage.setItem('magistory_last_project', JSON.stringify(currentProject));
  } catch(e){ console.warn(e); }
  // also download JSON file for convenience
  const blob = new Blob([JSON.stringify(currentProject, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(currentProject.judul||'project').replace(/\s+/g,'_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert('Project disimpan (downloaded + saved locally).');
});

// ------------------------------
// Render flow (simulated): popup -> Render Now -> simulate job
// ------------------------------
renderProjectBtn.addEventListener('click', ()=> {
  renderModal.classList.remove('hidden');
  renderStatus.textContent = '';
});
cancelRenderBtn?.addEventListener('click', ()=> {
  renderModal.classList.add('hidden');
});
startRenderBtn?.addEventListener('click', ()=> {
  if(!currentProject) return alert('Tidak ada project.');
  renderStatus.textContent = 'Memulai render...';
  startRenderBtn.disabled = true;
  // simulate render job (real implementation should call backend)
  setTimeout(()=>{
    renderStatus.textContent = 'Render selesai (simulasi). File output: output_demo.mp4';
    startRenderBtn.disabled = false;
    // offer download of simulated file (we create a tiny text file to simulate)
    const blob = new Blob(['This is a simulated render output for '+(currentProject.judul||'project')], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentProject.judul||'project').replace(/\s+/g,'_')}_render.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, 3500);
});

// ------------------------------
// On load: attempt to restore last project
// ------------------------------
window.addEventListener('load', ()=>{
  const saved = localStorage.getItem('magistory_last_project');
  if(saved){
    try {
      const p = JSON.parse(saved);
      currentProject = p;
      fillProjectWithClips(currentProject);
      renderTimeline(currentProject);
      timelineArea.style.display = 'block';
      setStatus('Restored last project from localStorage.');
    } catch(e){ /* ignore */ }
  }
});
