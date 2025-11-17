/* script.js
   Controls step-sequence, saves data to localStorage, and prevents skipping steps.
*/

const STEP_KEYS = {
  "index.html": 1,
  "about.html": 2,
  "services.html": 3,
  "contact.html": 4
};

function currentPageName() {
  const path = window.location.pathname;
  return path.substring(path.lastIndexOf('/')+1) || 'index.html';
}

function markStepDone(step) {
  localStorage.setItem('step_' + step, 'done');
}

function isStepDone(step) {
  return localStorage.getItem('step_' + step) === 'done';
}

function requirePreviousSteps() {
  const page = currentPageName();
  const step = STEP_KEYS[page] || 1;
  // All previous steps must be done (1..step-1)
  for (let s = 1; s < step; s++) {
    if (!isStepDone(s)) {
      // redirect to the first incomplete step
      for (let r = 1; r <= 4; r++) {
        if (!isStepDone(r)) {
          const target = Object.keys(STEP_KEYS).find(k => STEP_KEYS[k] === r);
          window.location.href = target;
          return;
        }
      }
    }
  }
}

// Save form data (generic)
function saveFormData(prefix='form') {
  const form = document.querySelector('form');
  if (!form) return;
  const data = {};
  Array.from(form.elements).forEach(el => {
    if (!el.name) return;
    if (el.type === 'checkbox') data[el.name] = el.checked;
    else data[el.name] = el.value;
  });
  localStorage.setItem(prefix + '_data', JSON.stringify(data));
}

// Load form data
function loadFormData(prefix='form') {
  const raw = localStorage.getItem(prefix + '_data');
  if (!raw) return;
  const data = JSON.parse(raw);
  const form = document.querySelector('form');
  if (!form) return;
  Array.from(form.elements).forEach(el => {
    if (!el.name) return;
    if (el.type === 'checkbox') el.checked = !!data[el.name];
    else if (data[el.name] !== undefined) el.value = data[el.name];
  });
}

// When a page's form is submitted/Next is clicked, mark step done and go to next page
function setupNextButton(nextHref, stepToMark, prefix='form') {
  const btn = document.getElementById('nextBtn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    // If form exists, do HTML5 validation
    const form = document.querySelector('form');
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    saveFormData(prefix);
    markStepDone(stepToMark);
    if (nextHref) window.location.href = nextHref;
  });
}

// Setup Back button
function setupBackButton(prevHref) {
  const btn = document.getElementById('backBtn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (prevHref) window.location.href = prevHref;
  });
}

// On contact (final) page handle submit
function setupFinalSubmit(prefix='form') {
  const form = document.querySelector('form');
  const submitBtn = document.getElementById('submitBtn');
  if (!form || !submitBtn) return;
  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    saveFormData(prefix);
    markStepDone(4);
    showSummary(prefix);
    // Optionally clear steps after confirmation or keep them
  });
}

function showSummary(prefix='form') {
  const raw = localStorage.getItem(prefix + '_data') || '{}';
  const data = JSON.parse(raw);
  const out = document.getElementById('summary');
  if (!out) return;
  out.innerHTML = '<h3>Confirmation</h3>';
  const wrap = document.createElement('div');
  wrap.className = 'summary';
  for (const k in data) {
    const p = document.createElement('p');
    p.innerHTML = `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(data[k])}`;
    wrap.appendChild(p);
  }
  out.appendChild(wrap);
}

// small helper to avoid HTML injection in the summary
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

// On every page load enforce sequence
document.addEventListener('DOMContentLoaded', () => {
  requirePreviousSteps();
  // load data automatically if there's a form
  loadFormData('form');
  // auto setup navigation if elements exist
  const page = currentPageName();
  const step = STEP_KEYS[page] || 1;
  // Next/Back wiring (page-specific)
  if (page === 'index.html') {
    setupNextButton('about.html', 1, 'form');
    setupBackButton(null);
  } else if (page === 'about.html') {
    setupNextButton('services.html', 2, 'form');
    setupBackButton('index.html');
  } else if (page === 'services.html') {
    setupNextButton('contact.html', 3, 'form');
    setupBackButton('about.html');
  } else if (page === 'contact.html') {
    setupBackButton('services.html');
    setupFinalSubmit('form');
    // If user already submitted, show summary
    if (isStepDone(4)) showSummary('form');
  }
});