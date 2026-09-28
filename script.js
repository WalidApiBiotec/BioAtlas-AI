/* global matchMedia */

const elements = {
  root: document.documentElement,
  themeButton: document.getElementById('themeBtn'),
  specFrame: document.getElementById('specFrame'),
  aiToggle: document.getElementById('aiToggle'),
  aiLabel: document.getElementById('aiToggleLabel'),
  footerLogo: document.getElementById('footerLogo'),
  brandLogo: document.querySelector('.brand-mark'),
  newsletterForm: document.getElementById('newsForm'),
  newsletterMessage: document.getElementById('newsOk'),
  dropzone: document.getElementById('dz'),
  fileInput: document.getElementById('fileInput'),
  identifyButton: document.getElementById('dzGo'),
  uploadTitle: document.getElementById('dzTitle'),
  uploadSubtitle: document.getElementById('dzSub'),
  result: document.getElementById('dzResult'),
  searchForm: document.getElementById('searchForm'),
  searchInput: document.getElementById('searchInput'),
  searchScope: document.getElementById('searchScope'),
};

const demoResults = [
  { scientificName: 'Betula pendula', commonName: 'Silver Birch', match: 94, description: 'Tricolporate · 24µm' },
  { scientificName: 'Corylus avellana', commonName: 'Hazel', match: 89, description: 'Triporate · 26µm' },
  { scientificName: 'Taraxacum officinale', commonName: 'Dandelion', match: 91, description: 'Echinate · 30µm' },
];

function getSystemTheme(){
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme){
  elements.root.setAttribute('data-theme', theme);
  elements.themeButton?.setAttribute('aria-pressed', String(theme === 'dark'));

  try {
    localStorage.setItem('ba-theme', theme);
  } catch {
    // Storage can be unavailable in restrictive browser environments.
  }
}

function initTheme(){
  if(!elements.themeButton) return;

  let saved = null;
  try {
    saved = localStorage.getItem('ba-theme');
  } catch {
    // Fall back to the operating system preference.
  }

  const initialTheme = saved || getSystemTheme();
  elements.root.setAttribute('data-theme', initialTheme);
  elements.themeButton.setAttribute('aria-pressed', String(initialTheme === 'dark'));

  elements.themeButton.addEventListener('click', () => {
    const current = elements.root.getAttribute('data-theme') || getSystemTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function initAiOverlay(){
  if(!elements.aiToggle || !elements.specFrame || !elements.aiLabel) return;

  elements.aiToggle.addEventListener('click', () => {
    const currentlyOn = elements.aiToggle.getAttribute('aria-pressed') === 'true';
    const nextIsOn = !currentlyOn;

    elements.aiToggle.setAttribute('aria-pressed', String(nextIsOn));
    elements.specFrame.classList.toggle('hide-ai', !nextIsOn);
    elements.aiLabel.textContent = nextIsOn ? 'AI view' : 'Raw capture';
  });
}

function animateCounter(counter, target, duration = 900){
  const start = performance.now();

  function tick(now){
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = Math.round(target * eased).toLocaleString();

    if(progress < 1){
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function initCounters(){
  const sections = document.querySelectorAll('.trust, .stats-big');
  if(!sections.length || !('IntersectionObserver' in window)) return;

  sections.forEach(section => {
    const counters = section.querySelectorAll('.cnt');
    if(!counters.length) return;

    const observer = new IntersectionObserver(entries => {
      if(!entries.some(entry => entry.isIntersecting)) return;

      counters.forEach(counter => {
        const target = Number(counter.dataset.to);
        if(Number.isFinite(target)) animateCounter(counter, target);
      });

      observer.disconnect();
    }, {threshold: 0.35});

    observer.observe(section);
  });
}

function initFooter(){
  if(elements.footerLogo && elements.brandLogo){
    elements.footerLogo.src = elements.brandLogo.src;
  }

  elements.newsletterForm?.addEventListener('submit', event => {
    event.preventDefault();
    elements.newsletterForm.reset();
    if(elements.newsletterMessage){
      elements.newsletterMessage.hidden = false;
    }
  });
}

function isValidImage(file){
  return Boolean(file) && file.type.startsWith('image/');
}

function formatFileSize(bytes){
  const megabytes = bytes / 1024 / 1024;
  return `${megabytes.toFixed(1)} MB`;
}

function setIdentifyButtonLoading(isLoading){
  if(!elements.identifyButton) return;

  elements.identifyButton.disabled = isLoading;
  elements.identifyButton.classList.toggle('is-loading', isLoading);
  elements.identifyButton.querySelector('svg')?.classList.toggle('is-hidden', isLoading);
  elements.identifyButton.firstChild.textContent = isLoading ? 'Analyzing…' : 'Identify with AI ';
}

function handleFile(file){
  if(!isValidImage(file)){
    elements.uploadTitle.textContent = 'Please choose an image file.';
    elements.uploadSubtitle.textContent = 'JPG, PNG, TIFF · max 20MB';
    elements.identifyButton.disabled = true;
    return;
  }

  const maxBytes = 20 * 1024 * 1024;
  if(file.size > maxBytes){
    elements.uploadTitle.textContent = 'Image is too large.';
    elements.uploadSubtitle.textContent = 'Please choose an image smaller than 20MB.';
    elements.identifyButton.disabled = true;
    elements.result.hidden = true;
    return;
  }

  elements.uploadTitle.textContent = file.name;
  elements.uploadSubtitle.textContent = `${formatFileSize(file.size)} · ready to analyze`;
  elements.identifyButton.disabled = false;
  elements.result.hidden = true;
}

function clearDragState(){
  elements.dropzone.classList.remove('drag');
}

function initUpload(){
  if(!elements.dropzone || !elements.fileInput || !elements.identifyButton) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      elements.dropzone.classList.add('drag');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      clearDragState();
    });
  });

  elements.dropzone.addEventListener('drop', event => {
    const file = event.dataTransfer.files?.[0];
    if(file) handleFile(file);
  });

  elements.fileInput.addEventListener('change', () => {
    const file = elements.fileInput.files?.[0];
    if(file) handleFile(file);
  });

  elements.identifyButton.addEventListener('click', () => {
    if(elements.identifyButton.disabled) return;

    setIdentifyButtonLoading(true);
    elements.result.hidden = true;

    // Demo only: replace this timeout + random selection with a real API call later.
    window.setTimeout(() => {
      const result = demoResults[Math.floor(Math.random() * demoResults.length)];
      renderDemoResult(result);
      setIdentifyButtonLoading(false);
    }, 1300);
  });
}

function renderDemoResult(result){
  elements.result.innerHTML = '';

  const label = document.createElement('div');
  label.className = 'sp';
  label.textContent = 'Demo match';

  const row = document.createElement('div');
  row.className = 'match';

  const name = document.createElement('span');
  const scientific = document.createElement('em');
  scientific.textContent = result.scientificName;
  const common = document.createTextNode(` — ${result.commonName}`);
  name.append(scientific, common);

  const score = document.createElement('span');
  score.textContent = `${result.match}%`;

  row.append(name, score);

  const bar = document.createElement('div');
  bar.className = 'dz-bar';
  const fill = document.createElement('i');
  fill.className = 'dz-bar-fill';
  bar.appendChild(fill);

  const description = document.createElement('div');
  description.className = 'sp result-meta';
  description.textContent = result.description;

  elements.result.append(label, row, bar, description);
  elements.result.hidden = false;

  requestAnimationFrame(() => {
    fill.style.width = `${result.match}%`;
  });
}

function initSearch(){
  elements.searchForm?.addEventListener('submit', event => {
    event.preventDefault();
    const query = elements.searchInput?.value.trim();
    const scope = elements.searchScope?.value || 'All';

    if(!query){
      elements.searchInput?.focus();
      return;
    }

    // Front-end prototype: real search will connect to a database/API later.
    window.alert(`Search prototype\nCategory: ${scope}\nQuery: ${query}`);
  });
}

function initApp(){
  initTheme();
  initAiOverlay();
  initCounters();
  initFooter();
  initUpload();
  initSearch();
}

document.addEventListener('DOMContentLoaded', initApp);
