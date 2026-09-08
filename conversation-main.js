// ============================================================
// BLOCK: 앞두자리(도메인) + SUBBLOCK: 뒤두자리(기능) → 4자리 숫자로 검색 (예: 0100 = BLOCK01)
// ============================================================
// ============================================================
// ============================================================
//  BLOCK 0100: anne-core.js
// ============================================================
// ============================================================

const C = window.LICENSE_CONFIG || {
  authStorageKey: 'bible_supabase_auth_v1',
  progressPrefix: 'gongboo.license.'
};
const SETS = { anne: 150 };
const TITLES = { anne: 'ANNE - Quiz' };

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const licenseRemoteTutor = window.sendChatbotMessage;

// SUBBLOCK 0101
function auth() {
  try {
    const s = JSON.parse(localStorage.getItem(C.authStorageKey) || 'null');
    if (!s?.access_token) return null;
    if (s.expires_at && s.expires_at * 1000 < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

// SUBBLOCK 0102
function key() {
  return `${C.progressPrefix}${ANNE_STATE.product}.progress`;
}

// SUBBLOCK 0103
function save() {
  if (ANNE_STATE.product) {
    localStorage.setItem(
      key(),
      JSON.stringify({
        index: ANNE_STATE.baseOffset + ANNE_STATE.index,
        mode: ANNE_STATE.mode,
        first: $('biblePrimaryTextSelector').value,
        second: $('bibleSecondaryTextSelector').value,
        updatedAt: Date.now()
      })
    );
  }
}

// SUBBLOCK 0104
function saved() {
  try {
    return JSON.parse(localStorage.getItem(key()) || 'null');
  } catch {
    return null;
  }
}

// SUBBLOCK 0105
function latestProgress() {
  return Object.keys(TITLES)
    .map(code => {
      try {
        return {
          code,
          data: JSON.parse(
            localStorage.getItem(`${C.progressPrefix}${code}.progress`) || 'null'
          )
        };
      } catch {
        return null;
      }
    })
    .filter(x => x?.data)
    .sort((a, b) => Number(b.data.updatedAt || 0) - Number(a.data.updatedAt || 0))[0] || null;
}

// SUBBLOCK 0106
async function api(params) {
  const res = await fetch('/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return res.json();
}

// SUBBLOCK 0107
async function load(product, offset, size) {
  return api({ action: 'load', product, offset, size });
}

// SUBBLOCK 0108
function tr(q) {
  return q?.license_question_translations || [];
}

// SUBBLOCK 0109
function lines(translations, field) {
  return translations.map(t => ({
    code: t.language_code.toUpperCase(),
    text: t[field] || ''
  }));
}

// SUBBLOCK 0110
function htmlLines(lines) {
  return lines.map(line =>
    `<div class="language-line-${line.code.toLowerCase()}">${esc(line.text)}</div>`
  ).join('');
}


// SUBBLOCK 0200
// ============================================================
// CONVERSATION - SUPABASE REST API CONFIG
// ============================================================

const SUPABASE_CONFIG = Object.freeze({

  url:
    'https://yxudhflyxuztvzaiunva.supabase.co',

  restUrl:
    'https://yxudhflyxuztvzaiunva.supabase.co/rest/v1/conversation',

  peopleRestUrl:
    'https://yxudhflyxuztvzaiunva.supabase.co/rest/v1/conversation-240',

  publishableKey:
    'sb_publishable_9Kg6bvsSqZzOGMavBG3_1w_WO6WGbGB',

  table:
    'conversation',

  peopleTable:
    'conversation-240'
});


// SUBBLOCK 0201
// ============================================================
// CONVERSATION - Supabase REST API
// ============================================================

async function fetchConversationRows(options) {

  options = options || {};

  var select =
    options.select || '*';

  var filters =
    options.filters || '';

  var url =
    SUPABASE_CONFIG.restUrl +
    '?select=' +
    encodeURIComponent(select);

  if (filters) {
    url += '&' + filters;
  }

  var response =
    await fetch(
      url,
      {
        method: 'GET',

        headers: {
          'apikey':
            SUPABASE_CONFIG.publishableKey,

          'Authorization':
            'Bearer ' +
            SUPABASE_CONFIG.publishableKey,

          'Accept':
            'application/json'
        }
      }
    );


  var text =
    await response.text();


  if (!response.ok) {

    throw new Error(
      'Supabase Error ' +
      response.status +
      ': ' +
      text
    );
  }


  var rows =
    text
      ? JSON.parse(text)
      : [];


  console.log(
    '[CONVERSATION] Supabase rows:',
    rows
  );


  return rows;
}


// SUBBLOCK 0202
// ============================================================
// CONVERSATION CATALOG
// EN 행의 목록 정보만 전체 페이지 조회
// DIALOGUE / HELP는 목록에서 받지 않음
// ============================================================

async function loadConversationCatalog() {

  var allRows = [];

  var from = 0;

  var PAGE_SIZE = 1000;


  while (true) {

    var to =
      from +
      PAGE_SIZE -
      1;


    var url =
      SUPABASE_CONFIG.restUrl +
      '?select=' +
      encodeURIComponent(
        'ID,LNG,GROUP,CATEGORY,SUBCATEGORY,DIALOGUE_TITLE'
      ) +
      '&LNG=eq.EN' +
      '&order=ID.asc';


    var response =
      await fetch(
        url,
        {
          method: 'GET',

          headers: {

            'apikey':
              SUPABASE_CONFIG.publishableKey,

            'Authorization':
              'Bearer ' +
              SUPABASE_CONFIG.publishableKey,

            'Accept':
              'application/json',

            'Range':
              from + '-' + to,

            'Range-Unit':
              'items'
          }
        }
      );


    var text =
      await response.text();


    if (!response.ok) {

      throw new Error(
        'Conversation Catalog Error ' +
        response.status +
        ': ' +
        text
      );
    }


    var rows =
      text
        ? JSON.parse(text)
        : [];


    allRows =
      allRows.concat(
        rows
      );


    if (
      rows.length <
      PAGE_SIZE
    ) {
      break;
    }


    from +=
      PAGE_SIZE;
  }


  console.log(
    '[CONVERSATION] Catalog loaded:',
    allRows.length
  );


  return allRows;
}


// SUBBLOCK 0203
// ============================================================
// 선택한 ID + LANGUAGE 한 Conversation 조회
// ============================================================

async function loadConversationById(
  id,
  language
) {

  var lng =
    String(
      language || 'EN'
    )
    .trim()
    .toUpperCase();


  var rows =
    await fetchConversationRows({

      select:
        'ID,LNG,GROUP,CATEGORY,SUBCATEGORY,DIALOGUE_TITLE,DIALOGUE,HELP',

      filters:
        'ID=eq.' +
        encodeURIComponent(id) +
        '&LNG=eq.' +
        encodeURIComponent(lng) +
        '&limit=1'
    });


  if (!rows.length) {

    throw new Error(
      'Conversation not found: ' +
      id +
      ' / ' +
      lng
    );
  }


  return rows[0];
}


// SUBBLOCK 0204
// ============================================================
// PAGE START
// ANNE setupHome 완료 후
// Conversation List 표시
// ============================================================

window.addEventListener(
  'load',
  function() {

    window.setTimeout(
      function() {

        startConversationHome();

      },
      100
    );
  }
);

// SUBBLOCK 0205
function trData(q) {
  return Object.fromEntries(
    (q?.license_question_translations || []).map(x => [x.language_code, x])
  );
}

// SUBBLOCK 0206
function languageRecord(t, code) {
  if (code === 'KOR') return t.ko;
  if (code === 'JPN') return t.ja;
  return t.en;
}

// SUBBLOCK 0207
function linesData(t, f) {
  const values = [
    $('biblePrimaryTextSelector').value,
    $('bibleSecondaryTextSelector').value
  ];
  const seen = new Set();
  return values
    .filter(x => x !== 'NONE' && !seen.has(x) && seen.add(x))
    .map(x => ({ code: x, text: languageRecord(t, x)?.[f] || '' }))
    .filter(x => x.text);
}

// SUBBLOCK 0208
function htmlLinesData(a) {
  return a.map(x => {
    let langClass = 'en';
    if (x.code === 'KOR') langClass = 'ko';
    if (x.code === 'JPN') langClass = 'ja';
    return `<div class="language-line language-line-${langClass}" data-language="${x.code}">${esc(x.text)}</div>`;
  }).join('');
}
// SUBBLOCK 0210
// ============================================================
// CONVERSATION PEOPLE 240
// NAME → GENDER MAP
// ============================================================

var CONVERSATION_PEOPLE = {};

window.CONVERSATION_PEOPLE =
  CONVERSATION_PEOPLE;


async function loadConversationPeople() {

  try {

    var url =
      SUPABASE_CONFIG.peopleRestUrl +
      '?select=NAME,GENDER';


    var response =
      await fetch(
        url,
        {
          method: 'GET',

          headers: {

            'apikey':
              SUPABASE_CONFIG.publishableKey,

            'Authorization':
              'Bearer ' +
              SUPABASE_CONFIG.publishableKey,

            'Accept':
              'application/json'
          }
        }
      );


    var text =
      await response.text();


    if (!response.ok) {

      throw new Error(
        'People API Error ' +
        response.status +
        ': ' +
        text
      );
    }


    var rows =
      text
        ? JSON.parse(text)
        : [];


    CONVERSATION_PEOPLE = {};


    rows.forEach(
      function(row) {

        var name =
          String(
            row.NAME || ''
          ).trim();


        var gender =
          String(
            row.GENDER || ''
          )
          .trim()
          .toUpperCase();


        if (!name) {
          return;
        }


        CONVERSATION_PEOPLE[
          name.toLowerCase()
        ] = {

          name:
            name,

          gender:
            gender
        };
      }
    );


    window.CONVERSATION_PEOPLE =
      CONVERSATION_PEOPLE;


    console.log(
      '[CONVERSATION PEOPLE] loaded:',
      Object.keys(
        CONVERSATION_PEOPLE
      ).length
    );


    return CONVERSATION_PEOPLE;


  } catch (error) {

    console.error(
      '[CONVERSATION PEOPLE] load failed:',
      error
    );


    return {};
  }
}


// ============================================================
// Speaker → Gender
// ============================================================

function getConversationSpeakerGender(
  speaker
) {

  var key =
    String(
      speaker || ''
    )
    .trim()
    .toLowerCase();


  var person =
    CONVERSATION_PEOPLE[
      key
    ];


  return person
    ? person.gender
    : '';
}


// ============================================================
// BLOCK 0300: anne-state.js
// ============================================================
// ============================================================

// SUBBLOCK 0301
const ANNE_STATE = {
  product: '',
  questions: [],
  index: 0,
  baseOffset: 0,
  catalog: {},
  accessByProduct: {},
  mode: 'study',
  auto: false,
  run: 0,
  timerTotal: 0,
  timerLeft: 0,
  timerEnd: 0,
  timerId: null,
  answers: [],
  reviewSource: null,
  catalogLoading: false,

  annePassageVisible: true,
  anneQuizVisible: true,
  anneChunkVisible: false,

  recognition: null,
  micMode: false,
  _initialized: false,
  _currentDate: '',
  _currentDayStart: 0,
  _currentDayCount: 0,
  _selectedDateIndex: 0,
  _utterance: null
};

window.ANNE_STATE = ANNE_STATE;


// ============================================================
// BLOCK 0400: anne-home.js
// ============================================================
// ============================================================

var _homeInitialized = false;

// SUBBLOCK 0401
function saveLastSettings() {
  try {
    var psgBtn = document.getElementById('biblePassageToggle');
    var qzBtn = document.getElementById('bibleQuizToggle');
    
    var settings = {
      mode: ANNE_STATE.mode || 'study',
      firstLang: $('biblePrimaryTextSelector')?.value || 'ENG',
      secondLang: $('bibleSecondaryTextSelector')?.value || 'KOR',
      auto: ANNE_STATE.auto || false,
      micThreshold: window.__micThreshold || 50,
      lastDate: ANNE_STATE._currentDate || '',
      lastIndex: ANNE_STATE.index || 0,
      lastProduct: ANNE_STATE.product || '',
      lastDayStart: ANNE_STATE._currentDayStart || 0,
      psgOn: psgBtn ? psgBtn.classList.contains('is-on') : true,
      qzOn: qzBtn ? qzBtn.classList.contains('is-on') : true
    };
    localStorage.setItem('gongboo.license.lastSettings', JSON.stringify(settings));
  } catch (e) {
    console.warn('설정 저장 실패:', e);
  }
}

// SUBBLOCK 0402
function setupHome() {
    
    if (_homeInitialized) {
    console.log('[ANNE] setupHome 이미 실행됨, 중복 실행 방지');
    return;
  }

  _homeInitialized = true;
  console.log('[ANNE] setupHome 실행');

  document.documentElement.dataset.studyMode = 'study';

  var splash = document.getElementById('splashOverlay');
  if (splash) splash.style.display = 'none';

  var main = document.getElementById('mainContainer');
  if (main) main.style.display = 'block';

  var quiz = document.getElementById('quizMain');
  if (quiz) quiz.style.display = 'none';

  var setup = document.getElementById('setupSection');
  if (setup) setup.style.display = 'block';

  var satTitle = document.querySelector('.sat-title');
  if (satTitle) {
    satTitle.innerHTML =
      '<span id="currentSetTitle">  ANNE</span>';
  }

  $('bibleExploreToggle').disabled = true;
  $('biblePeopleToggle').disabled = true;
  $('biblePassageToggle').disabled = true;
  $('bibleQuizToggle').disabled = true;

  var card = document.querySelector('.card-new');

  if (card) {
    card.innerHTML = `
      <div class="card-icon">📖</div>
      <div class="card-title card-title-new"
           id="anneMainBtn"
           style="cursor:pointer;">
        ANNE - Quiz
      </div>
      <div id="licenseSetArea" hidden></div>
    `;

    var anneBtn =
      document.getElementById('anneMainBtn');

    if (anneBtn) {
      anneBtn.onclick = function() {
        console.log('[ANNE] 📖 ANNE 버튼 클릭됨');
        choose('anne');
      };
    }
  }

  var resume =
    document.querySelector('.card-resume');

  if (resume) {
    resume.hidden = true;
    resume.style.display = 'none';
  }

  installLanguages();
  installModes();
  installTimer();
  installTutor();
  installResults();
  installSpeech();
  installAnneToggles();

  var savedSettings = {};

  try {
    var raw =
      localStorage.getItem(
        'gongboo.license.lastSettings'
      );

    if (raw) {
      savedSettings =
        JSON.parse(raw);
    }
  } catch (e) {}

  if (savedSettings.mode) {
    var modeBtn =
      document.querySelector(
        '[data-ui-mode="' +
        savedSettings.mode +
        '"]'
      );

    if (modeBtn) {
      modeBtn.click();
    }
  }

  if (savedSettings.firstLang) {
    $('biblePrimaryTextSelector').value =
      savedSettings.firstLang;
  }

  if (savedSettings.secondLang) {
    $('bibleSecondaryTextSelector').value =
      savedSettings.secondLang;
  }

  if (savedSettings.auto) {
    ANNE_STATE.auto = true;

    var autoBtn =
      $('licenseAuto');

    if (autoBtn) {
      autoBtn.textContent = 'AUTO ON';
      autoBtn.setAttribute(
        'aria-pressed',
        'true'
      );
      autoBtn.classList.add('active');
    }
  }

  if (savedSettings.micThreshold) {
    var thresholdInput =
      $('licenseMicThreshold');

    var thresholdLabel =
      $('licenseMicThresholdLabel');

    if (thresholdInput) {
      thresholdInput.value =
        savedSettings.micThreshold;
    }

    window.__micThreshold =
      Number(savedSettings.micThreshold);

    if (thresholdLabel) {
      thresholdLabel.textContent =
        savedSettings.micThreshold + '%';
    }
  }

  if (savedSettings.psgOn !== undefined) {
    ANNE_STATE.annePassageVisible =
      savedSettings.psgOn;
  }

  if (savedSettings.qzOn !== undefined) {
    ANNE_STATE.anneQuizVisible =
      savedSettings.qzOn;
  }

  syncAnneToggleButtons();
  applyAnneVisibility();

  var resumeContainer =
    document.getElementById(
      'resumeQuickContainer'
    );

  if (resumeContainer) {
    if (
      savedSettings.lastProduct &&
      savedSettings.lastDate
    ) {
      resumeContainer.hidden = false;

      resumeContainer.innerHTML = `
        <div class="resume-badge"
             onclick="resumeLastSession()">
          <span class="count">
            📖 ${savedSettings.lastProduct}
          </span>
          <span class="time">
            📅 ${savedSettings.lastDate}
          </span>
          <span class="hint">
            ▶ RESUME
          </span>
        </div>
      `;
    } else {
      resumeContainer.hidden = true;
      resumeContainer.innerHTML = '';
    }
  }

  $('biblePassageToggle').disabled = false;
  $('bibleQuizToggle').disabled = false;

  saveLastSettings();

  // ==========================================================
  // CHUNK
  // ==========================================================

  var helpBtn =
    document.getElementById(
      'bibleGuideToggle'
    );

  if (helpBtn) {
    helpBtn.title = 'Chunk';

    helpBtn.onclick = function() {

      ANNE_STATE.anneChunkVisible =
        !ANNE_STATE.anneChunkVisible;

      var container =
        document.getElementById(
          'chunkContainer'
        );

      if (container) {
        container.style.display =
          ANNE_STATE.anneChunkVisible
            ? 'block'
            : 'none';
      }

      this.classList.toggle(
        'active',
        ANNE_STATE.anneChunkVisible
      );

      this.setAttribute(
        'aria-pressed',
        String(
          ANNE_STATE.anneChunkVisible
        )
      );
    };
  }

  console.log('[ANNE] ✅ setupHome 완료');
}


// ============================================================
// BLOCK 0500: anne-navigation.js
// ============================================================
// ============================================================

// SUBBLOCK 0501
async function choose(code) {
  ANNE_STATE.product = code;
  const selected = document.querySelector(`[data-product="${code}"]`) ||
    document.querySelector(`[data-product="${code.toLowerCase()}"]`) ||
    document.querySelector(`[data-product="${code.toUpperCase()}"]`);
  const area = $('licenseSetArea');
  const cardNew = document.querySelector('.card-new');
  if (cardNew) {
    cardNew.appendChild(area);
  } else {
    selected.after(area);
  }
  document.querySelectorAll('[data-product]').forEach(b =>
    b.classList.toggle('is-selected', b === selected)
  );
  area.hidden = false;
  area.innerHTML = '<div class="loading">Loading questions...</div>';

  try {
    const d = await apiData({ action: 'catalog', product: code });
    const dates = (d.products && d.products[0] && d.products[0].dates) ? d.products[0].dates : [];
    window.__currentDates = dates;

    var anneBtn = document.querySelector('[data-product="anne"]') || document.querySelector('[data-product="ANNE"]');
    if (anneBtn) { anneBtn.style.display = 'none'; }

    area.innerHTML = `
      <div style="width:100%; margin:0; padding:0; display:grid; grid-template-columns:1fr 1fr; gap:2px 8px;">
        ${dates.length > 0
          ? dates.map((dateObj, i) => `
              <div class="date-item" data-index="${i}" style="padding:3px 2px; border-bottom:1px solid #eee; cursor:pointer; font-size:15px; font-weight:400; transition:all 0.12s; color:#2c3e50;"
                   onmouseover="this.style.background='#f5f9ff'; this.style.paddingLeft='6px';"
                   onmouseout="this.style.background=''; this.style.paddingLeft='2px';"
                   onclick="selectDate(${i});">
                ${dateObj.date}
              </div>
            `).join('')
          : '<div style="padding:20px; text-align:center; color:#999;">No dates found</div>'}
      </div>
      <input type="hidden" id="licenseSetSelector" value="0">
    `;
    
    ANNE_STATE._selectedDateIndex = 0;
    
    if ($('licenseInlineLogin')) {
      $('licenseInlineLogin').onclick = () => location.href = './login.html?return=license';
    }
  } catch (e) {
    area.innerHTML = `<div class="error-msg" style="display:block">${esc(e.message)}</div>`;
  }
}

// SUBBLOCK 0502
function selectDate(index) {
  console.log('[ANNE] 📅 날짜 선택:', index);
  ANNE_STATE._selectedDateIndex = index;
  var dateItems = document.querySelectorAll('.date-item');
  dateItems.forEach(function(item, i) {
    if (i === index) {
      item.style.background = '#f5f9ff';
      item.style.fontWeight = 'bold';
      item.style.color = '#f5a623';
      item.textContent = '⏳ Loading...';
    } else {
      item.style.background = '';
      item.style.fontWeight = 'normal';
      item.style.color = '#2c3e50';
    }
  });
  startFixedSet();
}

// SUBBLOCK 0503
function resumeLastSession() {
  console.log('[ANNE] resumeLastSession() 실행...');
  
  var savedSettings = {};
  try { 
    savedSettings = JSON.parse(localStorage.getItem('gongboo.license.lastSettings') || '{}'); 
  } catch(e) {}

  if (!savedSettings.lastProduct || !savedSettings.lastDate) {
    console.warn('[ANNE] 저장된 세션이 없음');
    return;
  }

  var dates = window.__currentDates || [];
  var dateIndex = -1;
  for (var i = 0; i < dates.length; i++) {
    if (dates[i].date === savedSettings.lastDate) {
      dateIndex = i;
      break;
    }
  }

  if (dateIndex === -1) {
    console.warn('[ANNE] 저장된 날짜를 찾을 수 없음:', savedSettings.lastDate);
    return;
  }

  ANNE_STATE.product = savedSettings.lastProduct;
  ANNE_STATE._currentDate = savedSettings.lastDate;
  ANNE_STATE.index = savedSettings.lastIndex || 0;
  ANNE_STATE._currentDayStart = savedSettings.lastDayStart || 0;
  ANNE_STATE._selectedDateIndex = dateIndex;

  var dateItems = document.querySelectorAll('.date-item');
  if (dateItems[dateIndex]) {
    dateItems[dateIndex].click();
  } else {
    var selector = $('licenseSetSelector');
    if (selector) { selector.value = dateIndex; }
    startFixedSet();
  }
}

// SUBBLOCK 0504
async function startFixedSet() {

  var setIndex =
    ANNE_STATE._selectedDateIndex !== undefined
      ? ANNE_STATE._selectedDateIndex
      : Number($('licenseSetSelector').value);

  var dates =
    window.__currentDates || [];

  if (
    !dates.length ||
    !dates[setIndex]
  ) {
    return;
  }

  var offset = 0;

  for (
    var i = 0;
    i < setIndex;
    i++
  ) {
    offset += dates[i].count;
  }

  var maxSets =
    Math.min(
      setIndex + 5,
      dates.length
    );

  var size = 0;

  for (
    var i = setIndex;
    i < maxSets;
    i++
  ) {
    size += dates[i].count;
  }

  try {

    var d =
      await loadData(
        ANNE_STATE.product,
        offset,
        size
      );

    ANNE_STATE.questions =
      d.data || [];

    ANNE_STATE.answers =
      new Array(
        ANNE_STATE.questions.length
      ).fill(null);

    ANNE_STATE.baseOffset =
      offset;

    // 로딩된 5 SET 안에서는 local index 사용
    ANNE_STATE.index = 0;

    ANNE_STATE._currentDayStart = 0;

    ANNE_STATE._currentDayCount =
      dates[setIndex].count;

    ANNE_STATE._currentDate =
      dates[setIndex].date;

    ANNE_STATE._selectedDateIndex =
      setIndex;

    if (
      !ANNE_STATE.questions.length
    ) {
      throw Error(
        'No questions in this set.'
      );
    }

    enterQuiz(0);

  } catch (e) {

    alert(e.message);

  }
}

// SUBBLOCK 0505
function enterQuiz(at) {
  var actualIndex = ANNE_STATE._currentDayStart || 0;
  ANNE_STATE.index = actualIndex + at;
  
  $('setupSection').style.display = 'none';
  $('quizMain').style.display = 'block';
  $('quizContent').style.display = 'block';
  document.querySelector('.progress-area').style.display = 'block';
  $('satTutorPanel').classList.add('is-license-active');
  document.querySelector('.sat-title').textContent = TITLES[ANNE_STATE.product];
  
  $('biblePassageToggle').disabled = false;
  $('bibleQuizToggle').disabled = false;
  
  ANNE_STATE.annePassageVisible = true;
  ANNE_STATE.anneQuizVisible = true;
  
  syncAnneToggleButtons();
  setPlaybackEnabled(true);
  
  const helpBtn = document.getElementById('bibleGuideToggle');
  if (helpBtn) { helpBtn.disabled = false; }
  
  render();
  
  if (ANNE_STATE.auto && !ANNE_STATE.micMode) {
    setTimeout(function() {
      if (window.__licenseSpeechState) window.__licenseSpeechState('licensePlay');
      speakWithDyslexiaSupport();
    }, 500);
  }
}

// SUBBLOCK 0506
function goHome() {
  $('setupSection').style.display = '';
  $('quizMain').style.display = 'none';
  $('quizContent').style.display = 'none';
  document.querySelector('.progress-area').style.display = 'none';
  $('biblePassageToggle').disabled = true;
  $('bibleQuizToggle').disabled = true;
  ANNE_STATE.index = 0;
  ANNE_STATE.questions = [];
  ANNE_STATE.answers = [];
  ANNE_STATE.annePassageVisible = true;
  ANNE_STATE.anneQuizVisible = true;
  syncAnneToggleButtons();
}

// SUBBLOCK 0507
function go(d) {

  var currentDate =
    ANNE_STATE._currentDate;

  var loadedDates = [];

  ANNE_STATE.questions.forEach(function(q) {
    if (
      q.date &&
      loadedDates.indexOf(q.date) === -1
    ) {
      loadedDates.push(q.date);
    }
  });

  var loadedIndex =
    loadedDates.indexOf(currentDate);

  if (loadedIndex < 0) {
    return;
  }


  // SUBBLOCK 0507-01
  // ==========================================================
  // PSG MODE
  // 현재 Passage → 다음 Passage
  // 마지막 로딩 SET이면 다음 5 SET 로딩
  // PSG 상태 유지
  // ==========================================================

  if (!ANNE_STATE.annePassageVisible) {

    var nextLoadedIndex =
      loadedIndex + d;


    // 현재 로딩된 마지막 SET 이후
    if (
      d > 0 &&
      nextLoadedIndex >= loadedDates.length
    ) {

      loadNextSets('passage');

      return;
    }


    if (
      nextLoadedIndex < 0 ||
      nextLoadedIndex >= loadedDates.length
    ) {
      return;
    }


    var nextDate =
      loadedDates[nextLoadedIndex];


    var newStartIndex = 0;

    for (
      var i = 0;
      i < ANNE_STATE.questions.length;
      i++
    ) {

      if (
        ANNE_STATE.questions[i].date ===
        nextDate
      ) {

        newStartIndex = i;

        break;
      }
    }


    ANNE_STATE._currentDate =
      nextDate;

    ANNE_STATE._currentDayStart =
      newStartIndex;

    ANNE_STATE._currentDayCount =
      ANNE_STATE.questions.filter(function(q) {
        return q.date === nextDate;
      }).length;

    ANNE_STATE.index =
      newStartIndex;

    ANNE_STATE._selectedDateIndex +=
      d;


    // PSG 상태 유지
    ANNE_STATE.annePassageVisible =
      false;


    syncAnneToggleButtons();

    render();


    if (
      ANNE_STATE.auto &&
      !ANNE_STATE.micMode
    ) {

      setTimeout(function() {

        if (
          window.__licenseSpeechState
        ) {

          window.__licenseSpeechState(
            'licensePlay'
          );
        }

        speakWithDyslexiaSupport();

      }, 350);
    }

    return;
  }


  // SUBBLOCK 0507-02
  // ==========================================================
  // QZ MODE
  // 현재 SET 내부에서 문제 이동
  // 마지막 문제에서는 go()로 다음 SET 이동 안 함
  // SUBMIT → RESULT → NEXT SET 흐름 사용
  // ==========================================================

  var dayQuestions =
    ANNE_STATE.questions.filter(function(q) {
      return q.date === currentDate;
    });

  var dayIndex =
    ANNE_STATE.index -
    ANNE_STATE._currentDayStart;

  var newDayIndex =
    dayIndex + d;


  if (
    newDayIndex >= 0 &&
    newDayIndex < dayQuestions.length
  ) {

    ANNE_STATE.index =
      ANNE_STATE._currentDayStart +
      newDayIndex;


    syncAnneToggleButtons();

    render();


    if (
      ANNE_STATE.auto &&
      !ANNE_STATE.micMode
    ) {

      setTimeout(function() {

        if (
          window.__licenseSpeechState
        ) {

          window.__licenseSpeechState(
            'licensePlay'
          );
        }

        speakWithDyslexiaSupport();

      }, 350);
    }
  }
}

// SUBBLOCK 0508
// ============================================================
// RESULT → NEXT SET
// ============================================================

function goNextSet() {

  var loadedDates = [];

  ANNE_STATE.questions.forEach(
    function(q) {

      if (
        q.date &&
        loadedDates.indexOf(q.date) === -1
      ) {
        loadedDates.push(q.date);
      }

    }
  );

  var currentLoadedIndex =
    loadedDates.indexOf(
      ANNE_STATE._currentDate
    );

  if (
    currentLoadedIndex ===
    loadedDates.length - 1
  ) {

    loadNextSets(
      'quiz'
    );

    return;
  }

  var nextDate =
    loadedDates[
      currentLoadedIndex + 1
    ];

  var newStartIndex = 0;

  for (
    var i = 0;
    i < ANNE_STATE.questions.length;
    i++
  ) {

    if (
      ANNE_STATE.questions[i].date ===
      nextDate
    ) {

      newStartIndex = i;

      break;
    }
  }

  ANNE_STATE._selectedDateIndex++;

  ANNE_STATE._currentDate =
    nextDate;

  ANNE_STATE._currentDayStart =
    newStartIndex;

  ANNE_STATE._currentDayCount =
    ANNE_STATE.questions.filter(
      function(q) {
        return q.date === nextDate;
      }
    ).length;

  ANNE_STATE.index =
    newStartIndex;

  ANNE_STATE.annePassageVisible =
    true;

  ANNE_STATE.anneQuizVisible =
    true;

  var modal =
    document.getElementById(
      'resultModal'
    );

  if (modal) {
    modal.style.display =
      'none';
  }

  syncAnneToggleButtons();

  render();
}


// ============================================================
// 다음 묶음 SET 로딩
// 현재는 최대 5 SET,
// 나중에 다른 책에서는 개수만 변경 가능
// ============================================================

async function loadNextSets(
  viewMode
) {

  var dates =
    window.__currentDates || [];

  var nextSetIndex =
    ANNE_STATE._selectedDateIndex + 1;

  if (
    nextSetIndex >= dates.length
  ) {

    goHome();

    return;
  }

  var offset = 0;

  for (
    var i = 0;
    i < nextSetIndex;
    i++
  ) {

    offset +=
      dates[i].count;
  }

  // 현재 ANNE는 한번에 최대 5 SET 로딩
  var loadSetCount = 5;

  var endIndex =
    Math.min(
      nextSetIndex + loadSetCount,
      dates.length
    );

  var size = 0;

  for (
    var i = nextSetIndex;
    i < endIndex;
    i++
  ) {

    size +=
      dates[i].count;
  }

  try {

    var d =
      await loadData(
        ANNE_STATE.product,
        offset,
        size
      );

    ANNE_STATE.questions =
      d.data || [];

    ANNE_STATE.answers =
      new Array(
        ANNE_STATE.questions.length
      ).fill(null);

    ANNE_STATE.baseOffset =
      offset;

    ANNE_STATE.index =
      0;

    ANNE_STATE._selectedDateIndex =
      nextSetIndex;

    ANNE_STATE._currentDate =
      dates[nextSetIndex].date;

    ANNE_STATE._currentDayStart =
      0;

    ANNE_STATE._currentDayCount =
      dates[nextSetIndex].count;

    if (
      viewMode === 'passage'
    ) {

      ANNE_STATE.annePassageVisible =
        false;

    } else {

      ANNE_STATE.annePassageVisible =
        true;

      ANNE_STATE.anneQuizVisible =
        true;
    }

    var modal =
      document.getElementById(
        'resultModal'
      );

    if (modal) {
      modal.style.display =
        'none';
    }

    syncAnneToggleButtons();

    render();

  } catch (e) {

    console.error(
      '[ANNE] 다음 SET 로딩 실패:',
      e
    );

    alert(e.message);
  }
}


// ============================================================
// BLOCK 0600: anne-render.js
// ============================================================
// ============================================================

// SUBBLOCK 0601
function applyAnneVisibility() {
  var passages = document.querySelectorAll('.anne-passage');
  var fullDiaries = document.querySelectorAll('.anne-full-diary');
  var quiz = document.querySelector('.anne-quiz');
  
  passages.forEach(function(el) {
    el.style.display = ANNE_STATE.annePassageVisible ? '' : 'none';
  });
  fullDiaries.forEach(function(el) {
    el.style.display = ANNE_STATE.annePassageVisible ? 'none' : '';
  });
  if (quiz) {
    quiz.style.display = (ANNE_STATE.anneQuizVisible && ANNE_STATE.annePassageVisible) ? '' : 'none';
  }
}

// SUBBLOCK 0602
function syncAnneToggleButtons() {

  var p = document.getElementById('biblePassageToggle');
  var q = document.getElementById('bibleQuizToggle');

  if (p) {

    var passageVisible =
      ANNE_STATE.annePassageVisible;

    // PSG는 "전문 보기" 버튼이므로
    // 전문이 보일 때 ON 표시
    var psgOn =
      !passageVisible;

    p.setAttribute(
      'aria-pressed',
      String(psgOn)
    );

    // 기존 내부 상태 저장용은 유지
    p.classList.toggle(
      'is-on',
      passageVisible
    );

    // 실제 버튼 선택표시는 전문이 보일 때
    p.classList.toggle(
      'active',
      psgOn
    );

    p.style.setProperty(
      'filter',
      psgOn ? 'brightness(0.75)' : '',
      'important'
    );

    p.style.setProperty(
      'font-weight',
      psgOn ? '700' : '',
      'important'
    );
  }

  if (q) {

    var qOn =
      ANNE_STATE.anneQuizVisible;

    q.setAttribute(
      'aria-pressed',
      String(qOn)
    );

    q.classList.toggle(
      'is-on',
      qOn
    );

    q.classList.toggle(
      'active',
      qOn
    );

    q.style.setProperty(
      'filter',
      qOn ? 'brightness(0.75)' : '',
      'important'
    );

    q.style.setProperty(
      'font-weight',
      qOn ? '700' : '',
      'important'
    );
  }
}

// SUBBLOCK 0603
function installAnneToggles() {
  var p = $('biblePassageToggle');
  var q = $('bibleQuizToggle');

  if (p && !p.dataset.anneBound) {
    p.dataset.anneBound = '1';
    p.onclick = function() {
      ANNE_STATE.annePassageVisible = !ANNE_STATE.annePassageVisible;
      syncAnneToggleButtons();
      applyAnneVisibility();
      saveLastSettings();
    };
  }

  if (q && !q.dataset.anneBound) {
    q.dataset.anneBound = '1';
    q.onclick = function() {
      ANNE_STATE.anneQuizVisible = !ANNE_STATE.anneQuizVisible;
      syncAnneToggleButtons();
      applyAnneVisibility();
      saveLastSettings();
    };
  }
  syncAnneToggleButtons();
}

// SUBBLOCK 0604
function render() {

  stopSpeech();

  var currentDate =
    ANNE_STATE._currentDate;

  if (!currentDate) {
    return;
  }

  var dayQuestions =
    ANNE_STATE.questions.filter(function(q) {
      return q.date === currentDate;
    });

  if (!dayQuestions.length) {
    return;
  }

  var dayIndex =
    ANNE_STATE.index -
    ANNE_STATE._currentDayStart;

  if (
    dayIndex < 0 ||
    dayIndex >= dayQuestions.length
  ) {
    dayIndex = 0;
    ANNE_STATE.index =
      ANNE_STATE._currentDayStart;
  }

  var q =
    dayQuestions[dayIndex];

  var t =
    trData(q);


  // SUBBLOCK 0604-01
  // ==========================================================
  // 하루 전체 PASSAGE
  // 현재 선택 언어 그대로 생성
  // ==========================================================

  var selectedDiaryLanguages = [
    $('biblePrimaryTextSelector').value,
    $('bibleSecondaryTextSelector').value
  ].filter(function(code, index, arr) {
    return (
      code !== 'NONE' &&
      arr.indexOf(code) === index
    );
  });

  var fullDiaryLines = [];

  dayQuestions.forEach(function(qq) {

    var diaryTranslation =
      trData(qq);

    selectedDiaryLanguages.forEach(function(code) {

      var record =
        languageRecord(
          diaryTranslation,
          code
        );

      if (
        record &&
        record.passage
      ) {
        fullDiaryLines.push({
          code: code,
          text: record.passage
        });
      }

    });

  });


  // SUBBLOCK 0604-02
  // ==========================================================
  // 현재 선택 답
  // ==========================================================

  var picked =
    ANNE_STATE.answers[
      ANNE_STATE.index
    ];


  // SUBBLOCK 0604-03
  // ==========================================================
  // 화면 생성
  // ==========================================================

  $('questionContainer').innerHTML = `
    <div class="question-card">

      <div class="q-num">
        Question ${dayIndex + 1} / ${dayQuestions.length}

        <span style="
          float:right;
          font-weight:400;
          font-size:13px;
          color:#888;
        ">
          📅 ${currentDate}
        </span>
      </div>

      <div
        class="anne-full-diary"
        style="
          display:none;
          padding:16px;
          background:#faf8f5;
          border-radius:8px;
          margin:12px 0;
          border-left:4px solid #8b7a6a;
        "
        data-date="${q.date}"
      >
        ${htmlLinesData(fullDiaryLines)}
      </div>

      <div class="anne-passage">

        <div class="anne-passage-content">

          ${htmlLinesData(
            linesData(
              t,
              'passage'
            )
          )}

        </div>

      </div>

      <div
        id="chunkContainer"
        style="
          display:none;
          padding:16px;
          background:#fcf9f5;
          border-radius:12px;
          border-left:5px solid #d4a373;
          margin:12px 0;
        "
      >

        <div style="
          font-weight:bold;
          margin-bottom:10px;
          color:#5a4a3a;
          font-size:16px;
        ">
          📖 Chunk Reading
        </div>

        ${
          [1,2,3,4,5].map(function(n) {

            var chunkText =
              linesData(
                t,
                'chunk_' + n
              )
              .map(function(x) {
                return x.text;
              })
              .join(' ');

            return chunkText
              ? '<div style="padding:6px 0; font-size:15px; line-height:1.8; color:#2d2d2d; border-bottom:1px solid #f0ebe5;">• ' +
                chunkText +
                '</div>'
              : '';

          }).join('')
        }

      </div>

      <div class="anne-quiz">

        <div class="question-text">

          ${htmlLinesData(
            linesData(
              t,
              'question_text'
            )
          )}

        </div>

        <div class="choices">

          ${
            [1,2,3,4].map(function(n) {

              var isSelected =
                picked === n
                  ? ' selected'
                  : '';

              return (
                '<button type="button" ' +
                'class="choice' +
                isSelected +
                '" data-answer="' +
                n +
                '">' +

                '<span class="choice-letter">' +
                String.fromCharCode(64 + n) +
                '</span>' +

                '<span class="choice-language-content">' +
                htmlLinesData(
                  linesData(
                    t,
                    'option_' + n
                  )
                ) +
                '</span>' +

                '</button>'
              );

            }).join('')
          }

        </div>

        <div id="licenseFeedback"></div>

      </div>

    </div>
  `;


  // SUBBLOCK 0604-04
  // ==========================================================
  // 선택지 클릭
  // ==========================================================

  document
    .querySelectorAll('.choices .choice')
    .forEach(function(b) {

      b.onclick = function() {

        var ansNum =
          Number(
            b.getAttribute(
              'data-answer'
            )
          );

        answer(
          ansNum,
          b
        );
      };

    });


  // SUBBLOCK 0604-05
  // ==========================================================
  // 기존 선택 복원 / LRN 정답 표시
  // ==========================================================

  if (picked) {

    var selectedBtn =
      document.querySelector(
        '.choice[data-answer="' +
        picked +
        '"]'
      );

    if (selectedBtn) {
      answer(
        picked,
        selectedBtn
      );
    }

  } else if (
    ANNE_STATE.mode === 'learn'
  ) {

    var correctEl =
      document.querySelector(
        '.choice[data-answer="' +
        q.answer +
        '"]'
      );

    if (correctEl) {
      correctEl.classList.add(
        'correct'
      );
    }

    feedback(true);
  }


  // SUBBLOCK 0604-06
  // ==========================================================
  // Progress
  // ==========================================================

  var progressPercent =
    dayQuestions.length
      ? (
          (dayIndex + 1) /
          dayQuestions.length *
          100
        )
      : 0;

  $('quizProgressBar').style.width =
    progressPercent + '%';

  $('prevBtn').disabled =
    dayIndex === 0;

  var isLastQuestion =
    dayIndex ===
    dayQuestions.length - 1;


  // SUBBLOCK 0604-07
  // ==========================================================
  // 현재 로딩된 SET 목록 / 마지막 SET 확인
  // ==========================================================

  var loadedDates = [];

  ANNE_STATE.questions.forEach(function(item) {

    if (
      item.date &&
      loadedDates.indexOf(item.date) === -1
    ) {
      loadedDates.push(
        item.date
      );
    }

  });

  var isLastLoadedSet =
    currentDate ===
    loadedDates[
      loadedDates.length - 1
    ];


  // SUBBLOCK 0604-08
// ==========================================================
// PSG MODE
// ==========================================================

if (
  !ANNE_STATE.annePassageVisible
) {

  $('nextBtn').style.display =
    'inline-block';

  $('nextBtn').textContent =
    isLastLoadedSet
      ? 'LOAD NEXT SETS'
      : 'NEXT PASSAGE';

  $('skipBtn').style.display =
    'none';

  $('submitBtn').style.display =
    'none';
}


  // SUBBLOCK 0604-09
  // ==========================================================
  // QZ MODE
  // ==========================================================

  else {

    $('nextBtn').textContent =
      'NEXT';

    $('nextBtn').style.display =
      isLastQuestion
        ? 'none'
        : 'inline-block';

    $('skipBtn').style.display =
      isLastQuestion
        ? 'none'
        : 'inline-block';

    $('submitBtn').style.display =
      isLastQuestion
        ? 'inline-block'
        : 'none';

  }


  // SUBBLOCK 0604-10
  // ==========================================================
  // PSG / QZ 화면 적용
  // ==========================================================

  applyAnneVisibility();


  // SUBBLOCK 0604-11
  // ==========================================================
  // CHUNK 상태 유지
  // ==========================================================

  var chunkContainer =
    document.getElementById(
      'chunkContainer'
    );

  var helpBtn =
    document.getElementById(
      'bibleGuideToggle'
    );

  if (chunkContainer) {

    chunkContainer.style.display =
      ANNE_STATE.anneChunkVisible
        ? 'block'
        : 'none';

  }

  if (helpBtn) {

    helpBtn.classList.toggle(
      'active',
      ANNE_STATE.anneChunkVisible
    );

    helpBtn.setAttribute(
      'aria-pressed',
      String(
        ANNE_STATE.anneChunkVisible
      )
    );

  }


  // SUBBLOCK 0604-12
  // ==========================================================
  // 저장
  // ==========================================================

  save();
}

// SUBBLOCK 0605
function answer(n, b) {
  ANNE_STATE.answers[ANNE_STATE.index] = n;
  var q = ANNE_STATE.questions[ANNE_STATE.index];
  if (!q) {
    console.warn('⚠️ 현재 문제를 찾을 수 없음');
    return;
  }

  var ok = Number(n) === Number(q.answer);

  document.querySelectorAll('.choice').forEach(function(x) {
    x.classList.remove('selected', 'correct', 'incorrect');
  });

  if (b) {
    b.classList.add('selected');
  }

  if (ANNE_STATE.mode === 'exam') {
    save();
    return;
  }

  if (b) {
    b.classList.add(ok ? 'correct' : 'incorrect');
  }

  var correctEl = document.querySelector('.choice[data-answer="' + q.answer + '"]');
  if (correctEl) {
    correctEl.classList.add('correct');
  }

  feedback(ok);
  save();
}

// SUBBLOCK 0606
function feedback(ok) {
  var q = ANNE_STATE.questions[ANNE_STATE.index];
  if (!q) return;
  var t = trData(q);
  
  var feedbackEl = document.getElementById('licenseFeedback');
  if (!feedbackEl) return;
  
  feedbackEl.innerHTML = `
    <div class="explanation show" style="${ok ? 'border-left-color: #27ae60; background: #e9f7ef;' : 'border-left-color: #e74c3c; background: #fde8e8;'}">
      <strong>${ok ? '✅ Correct' : '❌ Review the rule'}</strong>
      ${htmlLinesData(linesData(t, 'explanation'))}
    </div>
  `;
}


// ============================================================
// BLOCK 0700: anne-results.js
// ============================================================
// ============================================================

// SUBBLOCK 0701
function installResults() {
  var submitBtn = document.getElementById('submitBtn');
  var retryAllBtn = document.getElementById('retryAllBtn');
  var reviewWrongBtn = document.getElementById('reviewWrongBtn');
  var retryWrongBtn = document.getElementById('retryWrongFromReviewBtn');
  var closeModalBtn = document.getElementById('closeModalBtn');
  var closeWrongBtn = document.getElementById('closeWrongBtn');

  if (submitBtn) {
    submitBtn.onclick = function() { showResults(); };
  }
  if (retryAllBtn) {
    retryAllBtn.onclick = function() {
      for (var i = 0; i < ANNE_STATE.answers.length; i++) {
        ANNE_STATE.answers[i] = null;
      }
      ANNE_STATE.index = 0;
      var modal = document.getElementById('resultModal');
      if (modal) { modal.style.display = 'none'; }
      render();
    };
  }
  if (reviewWrongBtn) {
    reviewWrongBtn.onclick = function() { showWrongAnswers(); };
  }
  if (retryWrongBtn) {
    retryWrongBtn.onclick = function() { retryWrong(); };
  }
  if (closeModalBtn) {
    closeModalBtn.onclick = function() {
      var modal = document.getElementById('resultModal');
      if (modal) { modal.style.display = 'none'; }
    };
  }
  if (closeWrongBtn) {
    closeWrongBtn.onclick = function() {
      var modal = document.getElementById('wrongModal');
      if (modal) { modal.style.display = 'none'; }
    };
  }
}

// SUBBLOCK 0702
function wrongIndices() {
  var out = [];
  for (var i = 0; i < ANNE_STATE.questions.length; i++) {
    if (ANNE_STATE.answers[i] == null || ANNE_STATE.answers[i] === -1 || Number(ANNE_STATE.answers[i]) !== Number(ANNE_STATE.questions[i].answer)) {
      out.push(i);
    }
  }
  return out;
}

// SUBBLOCK 0703
function showResults() {

  var currentDate =
    ANNE_STATE._currentDate;

  var dayQuestions =
    ANNE_STATE.questions.filter(function(q) {
      return q.date === currentDate;
    });


  // SUBBLOCK 0703-01
  // ==========================================================
  // 현재 SET 점수 계산
  // ==========================================================

  var correct = 0;
  var answered = 0;

  for (
    var i = 0;
    i < dayQuestions.length;
    i++
  ) {

    var answerIndex =
      ANNE_STATE._currentDayStart + i;

    var a =
      ANNE_STATE.answers[
        answerIndex
      ];

    if (
      a != null &&
      a !== -1
    ) {
      answered++;
    }

    if (
      Number(a) ===
      Number(
        dayQuestions[i].answer
      )
    ) {
      correct++;
    }

  }


  // SUBBLOCK 0703-02
  // ==========================================================
  // 점수 / 정답률 표시
  // ==========================================================

  var correctEl =
    document.getElementById(
      'correctCount'
    );

  var accuracyEl =
    document.getElementById(
      'accuracyRate'
    );

  if (correctEl) {

    correctEl.textContent =
      correct +
      ' / ' +
      answered;

  }

  if (accuracyEl) {

    accuracyEl.textContent =
      (
        answered
          ? Math.round(
              correct /
              answered *
              100
            )
          : 0
      ) + '%';

  }


  // SUBBLOCK 0703-03
  // ==========================================================
  // 현재 SET 결과 그리드
  // ==========================================================

  var gridEl =
    document.getElementById(
      'resultGrid'
    );

  if (gridEl) {

    var gridHtml = '';

    for (
      var i = 0;
      i < dayQuestions.length;
      i++
    ) {

      var answerIndex =
        ANNE_STATE._currentDayStart + i;

      var a =
        ANNE_STATE.answers[
          answerIndex
        ];

      var cls =
        'incorrect';

      if (
        Number(a) ===
        Number(
          dayQuestions[i].answer
        )
      ) {

        cls =
          'correct';

      } else if (
        a === -1
      ) {

        cls =
          'skipped';

      } else if (
        a == null
      ) {

        cls =
          'unanswered';

      }

      gridHtml +=
        '<div class="result-item ' +
        cls +
        '">' +
        (i + 1) +
        '</div>';

    }

    gridEl.innerHTML =
      gridHtml;

  }


  // SUBBLOCK 0703-04
  // ==========================================================
  // 현재 로딩된 SET 목록
  // ==========================================================

  var loadedDates = [];

  ANNE_STATE.questions.forEach(function(q) {

    if (
      q.date &&
      loadedDates.indexOf(q.date) === -1
    ) {

      loadedDates.push(
        q.date
      );

    }

  });


  // SUBBLOCK 0703-05
  // ==========================================================
  // 현재 SET이 로딩된 5 SET 중 마지막인지 확인
  // ==========================================================

  var isLastLoadedSet =
    currentDate ===
    loadedDates[
      loadedDates.length - 1
    ];


  // SUBBLOCK 0703-06
  // ==========================================================
  // RESULT Modal
  // ==========================================================

  var modal =
    document.getElementById(
      'resultModal'
    );

  if (!modal) {
    return;
  }


  // SUBBLOCK 0703-07
  // ==========================================================
  // NEXT SET 버튼 생성
  // ==========================================================

  var nextSetBtn =
    document.getElementById(
      'nextSetBtn'
    );

  if (!nextSetBtn) {

    nextSetBtn =
      document.createElement(
        'button'
      );

    nextSetBtn.id =
      'nextSetBtn';

    nextSetBtn.type =
      'button';

    nextSetBtn.className =
      'btn-start';

    var modalContent =
      modal.querySelector(
        '.modal-content'
      ) || modal;

    modalContent.appendChild(
      nextSetBtn
    );

  }


  // SUBBLOCK 0703-08
// ==========================================================
// NEXT SET / LOAD NEXT SETS
// ==========================================================

nextSetBtn.textContent =
  isLastLoadedSet
    ? 'LOAD NEXT SETS'
    : 'NEXT SET';

nextSetBtn.onclick =
  function() {

    if (
      isLastLoadedSet
    ) {

      loadNextSets(
        'quiz'
      );

    } else {

      goNextSet();

    }

  };


  // SUBBLOCK 0703-09
  // ==========================================================
  // 결과창 표시
  // ==========================================================

  modal.style.display =
    'flex';
}

// SUBBLOCK 0704
function showWrongAnswers() {
  var ids = wrongIndices();
  if (!ids.length) { alert('All answers are correct.'); return; }
  
  var listEl = document.getElementById('wrongList');
  if (!listEl) return;
  
  var listHtml = '';
  for (var idx = 0; idx < ids.length; idx++) {
    var i = ids[idx];
    var q = ANNE_STATE.questions[i];
    var t = trData(q);
    var a = ANNE_STATE.answers[i];
    listHtml += `
      <div class="wrong-item">
        <strong>Question ${i+1}</strong>
        <div>${htmlLinesData(linesData(t, 'question_text'))}</div>
        <p>Your answer: ${a == null || a === -1 ? '—' : String.fromCharCode(64 + Number(a))}<br>Correct answer: ${String.fromCharCode(64 + Number(q.answer))}</p>
        <div>${htmlLinesData(linesData(t, 'explanation'))}</div>
      </div>
    `;
  }
  listEl.innerHTML = listHtml;
  
  var modal = document.getElementById('wrongModal');
  if (modal) { modal.style.display = 'flex'; }
}

// SUBBLOCK 0705
function retryWrong() {
  var ids = wrongIndices();
  if (!ids.length) { alert('All answers are correct.'); return; }
  ANNE_STATE.questions = ids.map(function(i) { return ANNE_STATE.questions[i]; });
  ANNE_STATE.answers = new Array(ANNE_STATE.questions.length).fill(null);
  ANNE_STATE.index = 0;
  
  var wrongModal = document.getElementById('wrongModal');
  var resultModal = document.getElementById('resultModal');
  var reviewBanner = document.getElementById('reviewBanner');
  
  if (wrongModal) { wrongModal.style.display = 'none'; }
  if (resultModal) { resultModal.style.display = 'none'; }
  
  if (reviewBanner) {
    reviewBanner.style.display = 'flex';
    reviewBanner.innerHTML = `
      <span>Review Mode: ${ANNE_STATE.questions.length} questions</span>
      <button id="exitReviewBtn" class="exit-review-btn">EXIT REVIEW</button>
    `;
    var exitBtn = document.getElementById('exitReviewBtn');
    if (exitBtn) { exitBtn.onclick = function() { location.reload(); }; }
  }
  render();
}


// ============================================================
// BLOCK 0800: anne-settings.js
// ============================================================
// ============================================================

// SUBBLOCK 0801
function installLanguages() {
  var pairs = [
    ['biblePrimaryTextSelector', 'ENG'],
    ['bibleSecondaryTextSelector', 'KOR']
  ];
  for (var p = 0; p < pairs.length; p++) {
    var id = pairs[p][0];
    var first = pairs[p][1];
    var s = document.getElementById(id);
    if (!s) continue;
    s.innerHTML = `
      <option value="ENG">ENG</option>
      <option value="KOR">KOR</option>
      <option value="JPN">JPN</option>
      <option value="NONE">NONE</option>
    `;
    s.value = first;
    s.onchange = function(selectorId) {
      return function() {
        var otherId = selectorId === 'biblePrimaryTextSelector' ? 'bibleSecondaryTextSelector' : 'biblePrimaryTextSelector';
        var other = document.getElementById(otherId);
        if (s.value === other.value) { other.value = 'NONE'; }
        if (ANNE_STATE.questions.length) { render(); }
      };
    }(id);
  }
}

// SUBBLOCK 0802
function installModes() {
  var apply = function(next) {
    ANNE_STATE.mode = next;
    document.documentElement.dataset.studyMode = next;
    document.querySelectorAll('[data-ui-mode]').forEach(function(x) {
      var selected = x.dataset.uiMode === next;
      x.classList.toggle('active', selected);
      x.setAttribute('aria-pressed', String(selected));
    });
    var timerToggle = document.getElementById('timerToggle');
    var timerPanel = document.getElementById('timerPanel');
    if (timerToggle) { timerToggle.hidden = next !== 'exam'; }
    if (timerPanel && next !== 'exam') { timerPanel.hidden = true; }
    if (ANNE_STATE.questions.length) { render(); }
  };
  document.querySelectorAll('[data-ui-mode]').forEach(function(b) {
    b.onclick = function() { apply(b.dataset.uiMode); };
  });
  var savedMode = saved();
  apply(savedMode?.mode || 'study');
}


// ============================================================
// BLOCK 0900: anne-timer.js
// ============================================================
// ============================================================

// SUBBLOCK 0901
function installTimer() {
  var toggle = document.getElementById('timerToggle');
  var panel = document.getElementById('timerPanel');
  if (toggle) {
    toggle.hidden = true;
    toggle.onclick = function() {
      if (panel) { panel.hidden = !panel.hidden; }
    };
  }
  var setBtn = document.getElementById('timerSetBtn');
  if (setBtn) {
    setBtn.onclick = function() {
      var hours = Number(document.getElementById('timerHours')?.value) || 0;
      var mins = Number(document.getElementById('timerMinutes')?.value) || 0;
      var secs = Number(document.getElementById('timerSecondsInput')?.value) || 0;
      ANNE_STATE.timerTotal = hours * 3600 + mins * 60 + secs;
      ANNE_STATE.timerLeft = ANNE_STATE.timerTotal;
      drawTimer();
    };
  }
  var pauseBtn = document.getElementById('timerPauseBtn');
  if (pauseBtn) {
    pauseBtn.onclick = function() {
      if (ANNE_STATE.timerId) {
        clearInterval(ANNE_STATE.timerId);
        ANNE_STATE.timerId = null;
        drawTimer();
        return;
      }
      if (!ANNE_STATE.timerLeft) return;
      ANNE_STATE.timerEnd = Date.now() + ANNE_STATE.timerLeft * 1000;
      ANNE_STATE.timerId = setInterval(drawTimer, 250);
      drawTimer();
    };
  }
  var resetBtn = document.getElementById('timerResetBtn');
  if (resetBtn) {
    resetBtn.onclick = function() {
      if (ANNE_STATE.timerId) { clearInterval(ANNE_STATE.timerId); }
      ANNE_STATE.timerId = null;
      ANNE_STATE.timerLeft = ANNE_STATE.timerTotal;
      drawTimer();
    };
  }
  document.querySelectorAll('[data-close-tool]').forEach(function(b) {
    b.onclick = function() {
      var panelEl = b.closest('.quiz-tool-panel');
      if (panelEl) { panelEl.hidden = true; }
    };
  });
}

// SUBBLOCK 0902
function drawTimer() {
  if (ANNE_STATE.timerId) {
    ANNE_STATE.timerLeft = Math.max(0, Math.ceil((ANNE_STATE.timerEnd - Date.now()) / 1000));
  }
  var display = document.getElementById('timerDisplay');
  if (display) {
    var hours = Math.floor(ANNE_STATE.timerLeft / 3600);
    var mins = Math.floor(ANNE_STATE.timerLeft % 3600 / 60);
    var secs = ANNE_STATE.timerLeft % 60;
    display.textContent = 
      String(hours).padStart(2, '0') + ':' +
      String(mins).padStart(2, '0') + ':' +
      String(secs).padStart(2, '0');
  }
  var pauseBtn = document.getElementById('timerPauseBtn');
  if (pauseBtn) {
    pauseBtn.textContent = ANNE_STATE.timerId ? '⏸ Pause' : '▶ Start';
  }
  if (ANNE_STATE.timerId && !ANNE_STATE.timerLeft) {
    clearInterval(ANNE_STATE.timerId);
    ANNE_STATE.timerId = null;
  }
}


// ============================================================
// BLOCK 1000: anne-tutor.js + NAV 버튼
// ============================================================
// ============================================================

// SUBBLOCK 1001
function installTutor() {
  var panel = document.getElementById('satTutorPanel');
  var input = document.getElementById('chatbotQuestion');
  if (!panel || !input) return;
  var send = panel.querySelector('button');
  if (!send) return;
  
  panel.classList.remove('is-license-active');
  var subtitle = panel.querySelector('.sat-tutor-subtitle');
  if (subtitle) { subtitle.textContent = 'Ask about the current question · license subject tutor'; }
  
  var response = document.getElementById('chatbotResponse');
  if (response) { response.textContent = '💡 Ask about the current license question.'; }
  
  send.removeAttribute('onclick');
  send.onclick = function() { tutor(); };
  input.removeAttribute('onkeypress');
  input.onkeydown = function(e) {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      tutor();
    }
  };
  window.sendChatbotMessage = function() { tutor(); };
}

// SUBBLOCK 1002
function tutor() {
  var box = document.getElementById('chatbotResponse');
  if (!box) return;
  
  if (ANNE_STATE.accessByProduct[ANNE_STATE.product] !== 'full') {
    box.innerHTML = '<div>AI Tutor requires an upgrade.</div><button type="button" id="licenseTutorUpgrade" class="btn-start" style="margin-top:12px;min-width:140px">UPGRADE</button>';
    var upgradeBtn = document.getElementById('licenseTutorUpgrade');
    if (upgradeBtn) {
      upgradeBtn.onclick = function() { location.href = './login.html?return=license'; };
    }
    return;
  }
  if (!ANNE_STATE.questions[ANNE_STATE.index]) {
    box.textContent = 'Start a license question first.';
    return;
  }
  return licenseRemoteTutor();
}

// SUBBLOCK 1003
function setButtonActive(btn) {
  if (!btn) return;
  var navBtns = document.querySelectorAll('.nav-btn, .btn-prev, .btn-next, .btn-skip, .btn-quit, .btn-submit');
  navBtns.forEach(function(b) {
    if (b) {
      b.classList.remove('btn-active');
      b.style.transform = 'scale(1)';
      b.style.boxShadow = 'none';
      b.style.filter = 'brightness(1)';
    }
  });
  
  btn.classList.add('btn-active');
  btn.style.transform = 'scale(0.95)';
  btn.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.5), inset 0 0 20px rgba(0,0,0,0.2)';
  btn.style.filter = 'brightness(0.75)';
  
  setTimeout(function() {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = 'none';
    btn.style.filter = 'brightness(1)';
    btn.classList.remove('btn-active');
  }, 350);
}

// SUBBLOCK 1004
var prevBtn = document.getElementById('prevBtn');
var skipBtn = document.getElementById('skipBtn');
var nextBtn = document.getElementById('nextBtn');
var quitBtn = document.getElementById('quitBtn');

if (prevBtn) {
  prevBtn.onclick = function() {
    setButtonActive(this);
    go(-1);
  };
}
if (skipBtn) {
  skipBtn.onclick = function() {
    setButtonActive(this);
    if (ANNE_STATE.answers[ANNE_STATE.index] == null) {
      ANNE_STATE.answers[ANNE_STATE.index] = -1;
    }
    go(1);
  };
}
if (nextBtn) {
  nextBtn.onclick = function() {
    setButtonActive(this);
    go(1);
  };
}
if (quitBtn) {
  quitBtn.onclick = function() {
    setButtonActive(this);
    setTimeout(function() { location.reload(); }, 200);
  };
}

// SUBBLOCK 1005
document.addEventListener('keydown', function(e) {
  if (e.target.matches('input,select,textarea')) return;
  
  if ((e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') && 
      ANNE_STATE.index < ANNE_STATE.questions.length - 1) {
    e.preventDefault();
    if (nextBtn) { setButtonActive(nextBtn); }
    go(1);
  }
  if ((e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') && 
      ANNE_STATE.index > 0) {
    e.preventDefault();
    if (prevBtn) { setButtonActive(prevBtn); }
    go(-1);
  }
  if (e.key === 'Enter' && ANNE_STATE.index === ANNE_STATE.questions.length - 1) {
    e.preventDefault();
    var submitBtn = document.getElementById('submitBtn');
    if (submitBtn) { setButtonActive(submitBtn); }
    if (typeof showResults === 'function') {
      showResults();
    }
  }
});

console.log('[ANNE] ✅ NAV 버튼 이벤트 바인딩 완료');


// ============================================================
// BLOCK 1100: anne-mic.js
// ENG / KOR / JPN 음성 읽기 연습
// MIC ON → 기준 % 창 표시
// 기준 이상 → PASS → 다음 문장
// ============================================================

var Speech =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


// SUBBLOCK 1101
// ============================================================
// MIC 전역 상태
// ============================================================

var _anneMicInstalled = false;
var _anneMicMoving = false;
var _anneMicRestartTimer = null;
var _anneMicRecognizeTimer = null;
var _anneMicLastTranscript = '';
var _anneMicCurrentRecognition = null;
var _anneMicPassageIndex = 0;

window.__micRecognizeDelay =
  Number(
    localStorage.getItem(
      'gongboo.anne.micRecognizeDelay'
    )
  ) || 2.0;

window.__micAutoAdvance =
  localStorage.getItem(
    'gongboo.anne.micAutoAdvance'
  ) !== 'false';

window.__micThreshold =
  Number(
    localStorage.getItem(
      'gongboo.anne.micThreshold'
    )
  ) || 70;


// SUBBLOCK 1102
// ============================================================
// 현재 MIC 연습 언어
// PRIMARY 언어를 기준으로 함
// ENG → en-US
// KOR → ko-KR
// JPN → ja-JP
// ============================================================

function getAnneMicLanguage() {

  var selector =
    document.getElementById(
      'biblePrimaryTextSelector'
    );

  var code =
    selector
      ? selector.value
      : 'ENG';

  if (code === 'KOR') {
    return {
      code: 'KOR',
      recognition: 'ko-KR'
    };
  }

  if (code === 'JPN') {
    return {
      code: 'JPN',
      recognition: 'ja-JP'
    };
  }

  return {
    code: 'ENG',
    recognition: 'en-US'
  };
}


// SUBBLOCK 1103
// ============================================================
// 현재 MIC 대상 문장
// ANNE + CONVERSATION ADAPTER
// ============================================================

function getCurrentMicSentence() {

  // ==========================================================
  // CONVERSATION
  // ==========================================================

  var conversationTurns =
    Array.from(
      document.querySelectorAll(
        '.conversation-turn'
      )
    ).filter(
      function(el) {

        return (
          el.offsetParent !== null
        );
      }
    );


  if (
    conversationTurns.length
  ) {

    if (
      _anneMicPassageIndex < 0 ||
      _anneMicPassageIndex >=
        conversationTurns.length
    ) {

      _anneMicPassageIndex =
        0;
    }


    var turnEl =
      conversationTurns[
        _anneMicPassageIndex
      ];


    var textEl =
      turnEl.querySelector(
        '.conversation-text'
      );


    if (!textEl) {
      return null;
    }


    // TTS Highlight span이 들어가도 textContent 사용
    var text =
      String(
        textEl.dataset.originalText ||
        textEl.textContent ||
        ''
      ).trim();


    var languageCode =
      String(
        textEl.dataset.language ||
        'ENG'
      ).toUpperCase();


    var recognition =
      languageCode === 'KOR'
        ? 'ko-KR'
        : languageCode === 'JPN'
          ? 'ja-JP'
          : 'en-US';


    // 현재 MIC Target 표시
    conversationTurns.forEach(
      function(el, index) {

        if (
          index ===
          _anneMicPassageIndex
        ) {

          el.style.border =
            '3px solid #facc15';

          el.style.boxShadow =
            '0 0 0 3px rgba(250,204,21,.18)';

          el.style.background =
            '#fffdf2';

        } else {

          el.style.border =
            '1px solid #dbe3ee';

          el.style.boxShadow =
            '';

          el.style.background =
            '#fff';
        }
      }
    );


    return {

      text:
        text,

      element:
        textEl,

      code:
        languageCode,

      recognition:
        recognition,

      speaker:
        String(
          turnEl.dataset.speaker ||
          ''
        ).trim(),

      passageMode:
        true,

      passageElements:
        conversationTurns.map(
          function(el) {

            return (
              el.querySelector(
                '.conversation-text'
              ) ||
              el
            );
          }
        ),

      passageIndex:
        _anneMicPassageIndex,

      passageCount:
        conversationTurns.length,

      conversationMode:
        true
    };
  }


  // ==========================================================
  // 기존 ANNE
  // ==========================================================

  var root =
    document.getElementById(
      'questionContainer'
    );


  if (!root) {
    return null;
  }


  var passageElements =
    Array.from(
      root.querySelectorAll(
        '.anne-full-diary .language-line, .anne-passage .language-line'
      )
    ).filter(
      function(el) {

        return (
          el.offsetParent !== null &&
          String(
            el.textContent || ''
          ).trim()
        );
      }
    );


  if (
    passageElements.length
  ) {

    if (
      _anneMicPassageIndex < 0 ||
      _anneMicPassageIndex >=
        passageElements.length
    ) {

      _anneMicPassageIndex =
        0;
    }


    var passageEl =
      passageElements[
        _anneMicPassageIndex
      ];


    var passageCode =
      String(
        passageEl.dataset.language ||
        'ENG'
      ).toUpperCase();


    return {

      text:
        String(
          passageEl.textContent ||
          ''
        ).trim(),

      element:
        passageEl,

      code:
        passageCode,

      recognition:
        passageCode === 'KOR'
          ? 'ko-KR'
          : passageCode === 'JPN'
            ? 'ja-JP'
            : 'en-US',

      passageMode:
        true,

      passageElements:
        passageElements,

      passageIndex:
        _anneMicPassageIndex,

      passageCount:
        passageElements.length
    };
  }


  var sentenceEl =
    root.querySelector(
      '.language-line[data-language]'
    );


  if (!sentenceEl) {
    return null;
  }


  var code =
    String(
      sentenceEl.dataset.language ||
      'ENG'
    ).toUpperCase();


  return {

    text:
      String(
        sentenceEl.textContent ||
        ''
      ).trim(),

    element:
      sentenceEl,

    code:
      code,

    recognition:
      code === 'KOR'
        ? 'ko-KR'
        : code === 'JPN'
          ? 'ja-JP'
          : 'en-US',

    passageMode:
      false
  };
}


// SUBBLOCK 1104
// ============================================================
// ENG / KOR / JPN 비교용 텍스트 정규화
//
// 일본어:
// 私(わたし) → わたし
// 学校(がっこう) → がっこう
//
// 한자와 후리가나를 동시에 비교하지 않음
// ============================================================

function normalizeAnneMicText(
  text,
  langCode
) {

  var value =
    String(text || '')
      .normalize('NFKC');


  // ----------------------------------------------------------
  // 일본어 후리가나
  // ----------------------------------------------------------

  if (langCode === 'JPN') {

    value =
      value.replace(
        /[\u3400-\u4DBF\u4E00-\u9FFF々〆ヵヶ]+[\(（]([ぁ-ゖァ-ヺー]+)[\)）]/g,
        '$1'
      );

    value =
      value
        .replace(
          /[\s。、！？!?,.「」『』【】［］\[\]\(\)（）・：:;"']/g,
          ''
        )
        .toLowerCase();

    return value;
  }


  // ----------------------------------------------------------
  // 한국어
  // ----------------------------------------------------------

  if (langCode === 'KOR') {

    return value
      .replace(
        /[\s.,!?;:"'()[\]{}<>~`·…。，！？「」『』]/g,
        ''
      )
      .toLowerCase();
  }


  // ----------------------------------------------------------
  // 영어
  // ----------------------------------------------------------

  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9\s']/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


// SUBBLOCK 1105
// ============================================================
// MIC MANUAL SYNC
// Conversation 문장 클릭/터치
// ============================================================

function installAnneMicPassageSync() {

  var root =
    document.getElementById(
      'questionContainer'
    );


  if (!root) {
    return;
  }


  if (
    root.dataset.micSyncBound ===
    '1'
  ) {
    return;
  }


  root.dataset.micSyncBound =
    '1';


  root.addEventListener(
    'click',
    function(event) {

      if (
        !ANNE_STATE.micMode
      ) {
        return;
      }


      var turn =
        event.target.closest(
          '.conversation-turn'
        );


      if (!turn) {
        return;
      }


      var turns =
        Array.from(
          root.querySelectorAll(
            '.conversation-turn'
          )
        ).filter(
          function(el) {

            return (
              el.offsetParent !== null
            );
          }
        );


      var index =
        turns.indexOf(
          turn
        );


      if (
        index < 0
      ) {
        return;
      }


      console.log(
        '[MIC MANUAL SYNC]',
        _anneMicPassageIndex,
        '→',
        index
      );


      _anneMicPassageIndex =
        index;


      _anneMicLastTranscript =
        '';


      _anneMicMoving =
        true;


      stopAnneRecognition();


      getCurrentMicSentence();


      setTimeout(
        function() {

          _anneMicMoving =
            false;


          if (
            ANNE_STATE.micMode
          ) {

            startAnneRecognition();
          }

        },
        180
      );
    }
  );
}


// SUBBLOCK 1106
// ============================================================
// 문장 일치율 %
// ============================================================

function calculateAnneMicScore(
  original,
  spoken,
  langCode
) {

  var target =
    normalizeAnneMicText(
      original,
      langCode
    );

  var heard =
    normalizeAnneMicText(
      spoken,
      langCode
    );


  if (
    !target ||
    !heard
  ) {
    return 0;
  }


  var distance =
    anneLevenshtein(
      target,
      heard
    );


  var maxLength =
    Math.max(
      target.length,
      heard.length
    );


  if (!maxLength) {
    return 100;
  }


  var score =
    (
      1 -
      distance /
      maxLength
    ) *
    100;


  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );
}


// SUBBLOCK 1107
// ============================================================
// MIC compact panel
// START = 듣기 시작
// STOP  = 현재까지 즉시 인식/채점, MIC 계속 ON
// SCORE = STOP 버튼 오른쪽
// ============================================================

function ensureAnneMicPanel() {

  var panel =
    document.getElementById(
      'anneMicPanel'
    );

  if (panel) {
    return panel;
  }


  if (
    !document.getElementById(
      'anneMicCompactStyle'
    )
  ) {

    var style =
      document.createElement(
        'style'
      );

    style.id =
      'anneMicCompactStyle';

    style.textContent = `

      #anneMicPanel {
        width:190px;
        max-width:calc(100vw - 12px);
      }

      #anneMicPanel button {
        transition:
          transform 0.08s ease,
          box-shadow 0.08s ease,
          filter 0.08s ease;
      }

      #anneMicPanel button:active {
        transform:scale(0.96);
        box-shadow:
          inset 0 2px 4px
          rgba(0,0,0,0.28);
      }

      @media (max-width:600px) {

        #anneMicPanel {
          width:185px !important;
          min-width:185px !important;
          max-width:calc(100vw - 12px) !important;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }


  panel =
    document.createElement(
      'div'
    );

  panel.id =
    'anneMicPanel';

  panel.style.cssText = `
    display:none;
    position:absolute;
    z-index:9999;

    width:190px;
    min-width:190px;

    padding:7px 8px;

    background:#ffffff;

    border:1px solid #d1d5db;
    border-radius:8px;

    box-shadow:
      0 3px 10px
      rgba(0,0,0,0.16);

    font-size:12px;
  `;


  panel.innerHTML = `

    <div style="
      display:flex;
      align-items:center;
      gap:6px;
    ">

      <span style="
        width:34px;
        font-weight:800;
      ">
        PASS
      </span>

      <input
        id="anneMicThreshold"
        type="range"
        min="40"
        max="100"
        step="5"
        value="${window.__micThreshold}"
        style="
          flex:1;
          min-width:0;
          cursor:pointer;
        "
      >

      <span
        id="anneMicThresholdLabel"
        style="
          width:32px;
          text-align:right;
          font-weight:800;
        "
      >
        ${window.__micThreshold}%
      </span>

    </div>


    <div style="
      margin-top:6px;
      display:flex;
      align-items:center;
      gap:6px;
    ">

      <span style="
        font-weight:800;
      ">
        DELAY
      </span>

      <select
        id="anneMicRecognizeDelay"
        style="
          width:62px;
          height:25px;
          padding:1px 3px;
          border:1px solid #d1d5db;
          border-radius:5px;
          background:#ffffff;
          font-size:12px;
        "
      >
        <option value="1">1.0s</option>
        <option value="1.5">1.5s</option>
        <option value="2">2.0s</option>
        <option value="2.5">2.5s</option>
        <option value="3">3.0s</option>
        <option value="4">4.0s</option>
        <option value="5">5.0s</option>
      </select>

      <button
        id="anneMicAdvanceMode"
        type="button"
        aria-pressed="false"
        style="
          margin-left:auto;
          height:25px;
          min-width:54px;
          padding:1px 7px;
          border:1px solid #9ca3af;
          border-radius:5px;
          background:#f3f4f6;
          color:#374151;
          font-size:12px;
          font-weight:800;
          cursor:pointer;
        "
      >
        AUTO
      </button>

    </div>


    <div style="
      margin-top:6px;
      display:flex;
      gap:6px;
    ">

      <button
        id="anneMicStart"
        type="button"
        aria-pressed="false"
        style="
          flex:0 0 40%;
          height:28px;

          border:1px solid #2563eb;
          border-radius:5px;

          background:#2563eb;
          color:#ffffff;

          font-size:12px;
          font-weight:800;

          cursor:pointer;
        "
      >
        ▶ START
      </button>


      <button
        id="anneMicStop"
        type="button"
        style="
          flex:1;
          height:28px;

          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:4px;

          padding:0 7px;

          border:1px solid #dc2626;
          border-radius:5px;

          background:#dc2626;
          color:#ffffff;

          font-size:12px;
          font-weight:800;

          cursor:pointer;
        "
      >
        <span>■ STOP</span>

        <span
          id="anneMicStopScore"
          style="
            min-width:28px;
            text-align:right;
            font-weight:900;
          "
        ></span>
      </button>

    </div>


    <div
      id="anneMicScore"
      style="display:none !important;"
    ></div>
  `;


  document.body.appendChild(
    panel
  );


  var range =
    document.getElementById(
      'anneMicThreshold'
    );

  var delaySelect =
    document.getElementById(
      'anneMicRecognizeDelay'
    );

  var modeBtn =
    document.getElementById(
      'anneMicAdvanceMode'
    );

  var startBtn =
    document.getElementById(
      'anneMicStart'
    );

  var stopBtn =
    document.getElementById(
      'anneMicStop'
    );

  var scoreBox =
    document.getElementById(
      'anneMicScore'
    );

  var stopScore =
    document.getElementById(
      'anneMicStopScore'
    );

  var mainMicBtn =
    document.getElementById(
      'anneMicButton'
    );


  // ==========================================================
  // PASS
  // ==========================================================

  if (range) {

    range.oninput =
      function() {

        var value =
          Number(
            this.value
          );

        window.__micThreshold =
          value;

        localStorage.setItem(
          'gongboo.anne.micThreshold',
          String(value)
        );

        var label =
          document.getElementById(
            'anneMicThresholdLabel'
          );

        if (label) {
          label.textContent =
            value + '%';
        }

        if (
          typeof saveLastSettings ===
          'function'
        ) {
          saveLastSettings();
        }
      };
  }


  // ==========================================================
  // DELAY
  // ==========================================================

  if (delaySelect) {

    delaySelect.value =
      String(
        window.__micRecognizeDelay
      );

    delaySelect.onchange =
      function() {

        window.__micRecognizeDelay =
          Number(
            this.value
          ) || 2;

        localStorage.setItem(
          'gongboo.anne.micRecognizeDelay',
          String(
            window.__micRecognizeDelay
          )
        );
      };
  }


  // ==========================================================
  // AUTO
  // ==========================================================

  function refreshModeButton() {

    if (!modeBtn) {
      return;
    }

    var on =
      !!window.__micAutoAdvance;

    modeBtn.textContent =
      'AUTO';

    modeBtn.setAttribute(
      'aria-pressed',
      String(on)
    );

    modeBtn.style.background =
      on
        ? '#2563eb'
        : '#f3f4f6';

    modeBtn.style.color =
      on
        ? '#ffffff'
        : '#374151';

    modeBtn.style.borderColor =
      on
        ? '#2563eb'
        : '#9ca3af';

    modeBtn.style.boxShadow =
      on
        ? 'inset 0 2px 4px rgba(0,0,0,0.22)'
        : 'none';
  }


  if (modeBtn) {

    modeBtn.onclick =
      function() {

        window.__micAutoAdvance =
          !window.__micAutoAdvance;

        localStorage.setItem(
          'gongboo.anne.micAutoAdvance',
          String(
            window.__micAutoAdvance
          )
        );

        refreshModeButton();
      };

    refreshModeButton();
  }


  // ==========================================================
  // MIC ACTIVE
  // ==========================================================

  function micIsActive() {

    if (!mainMicBtn) {
      return false;
    }

    return (
      mainMicBtn.classList.contains(
        'active'
      ) ||
      mainMicBtn.classList.contains(
        'is-active'
      ) ||
      mainMicBtn.getAttribute(
        'aria-pressed'
      ) === 'true'
    );
  }


  function refreshStartButton() {

    if (!startBtn) {
      return;
    }

    var active =
      micIsActive();

    startBtn.setAttribute(
      'aria-pressed',
      String(active)
    );

    startBtn.style.background =
      active
        ? '#174ea6'
        : '#2563eb';

    startBtn.style.borderColor =
      active
        ? '#174ea6'
        : '#2563eb';

    startBtn.style.boxShadow =
      active
        ? 'inset 0 2px 4px rgba(0,0,0,0.28)'
        : 'none';
  }


  // ==========================================================
  // START
  // ==========================================================

  if (startBtn) {

    startBtn.onclick =
      function() {

        if (
          mainMicBtn &&
          !micIsActive()
        ) {
          mainMicBtn.click();
        }

        window.setTimeout(
          refreshStartButton,
          80
        );
      };
  }


  // ==========================================================
  // STOP
  // 즉시 인식/채점
  // MIC는 계속 ON
  // ==========================================================

  if (stopBtn) {

    stopBtn.onclick =
      function() {

        stopBtn.style.filter =
          'brightness(0.75)';

        window.setTimeout(
          function() {

            stopBtn.style.filter =
              '';

          },
          180
        );

        if (
          typeof finalizeAnneMicRecognition ===
          'function'
        ) {

          finalizeAnneMicRecognition(
            true
          );
        }
      };
  }


  // ==========================================================
  // SCORE → STOP 오른쪽
  // ==========================================================

  function refreshStopScore() {

    if (
      !scoreBox ||
      !stopScore
    ) {
      return;
    }

    var text =
      String(
        scoreBox.textContent ||
        ''
      ).trim();

    var match =
      text.match(
        /(\d{1,3})\s*%/
      );

    stopScore.textContent =
      match
        ? match[1] + '%'
        : '';
  }


  if (scoreBox) {

    new MutationObserver(
      refreshStopScore
    ).observe(
      scoreBox,
      {
        childList:true,
        characterData:true,
        subtree:true
      }
    );
  }


  if (mainMicBtn) {

    new MutationObserver(
      refreshStartButton
    ).observe(
      mainMicBtn,
      {
        attributes:true,
        attributeFilter:[
          'class',
          'aria-pressed'
        ]
      }
    );
  }


  refreshStartButton();


  return panel;
}


// SUBBLOCK 1108
// ============================================================
// MIC 설정창 위치
// MIC 버튼 기준으로 조금 LEFT + UP
// ============================================================

function positionAnneMicPanel() {

  var btn =
    document.getElementById(
      'anneMicButton'
    );

  var panel =
    ensureAnneMicPanel();

  if (
    !btn ||
    !panel
  ) {
    return;
  }


  var rect =
    btn.getBoundingClientRect();


  var panelWidth =
    window.innerWidth <= 600
      ? 185
      : 190;


  var left =
    rect.right +
    window.scrollX -
    panelWidth -
    8;


  left =
    Math.max(
      6,
      Math.min(
        left,
        window.scrollX +
        window.innerWidth -
        panelWidth -
        6
      )
    );


  panel.style.left =
    Math.round(
      left
    ) + 'px';


  panel.style.top =
    Math.round(
      rect.bottom +
      window.scrollY +
      1
    ) + 'px';
}


// SUBBLOCK 1109
// ============================================================
// MIC 결과 표시
// 실제 값은 hidden score에 기록
// 1107이 STOP 버튼 오른쪽에 % 표시
// ============================================================

function showAnneMicScore(
  score,
  passed
) {

  var scoreEl =
    document.getElementById(
      'anneMicScore'
    );


  if (!scoreEl) {
    return;
  }


  scoreEl.textContent =
    score +
    '% ' +
    (
      passed
        ? '✓ PASS'
        : '↻ AGAIN'
    );


  scoreEl.style.color =
    passed
      ? '#15803d'
      : '#b45309';
}

// SUBBLOCK 1110
// ============================================================
// 현재 Recognition 완전 중지
// ============================================================

function stopAnneRecognition() {

  if (_anneMicRestartTimer) {

    clearTimeout(
      _anneMicRestartTimer
    );

    _anneMicRestartTimer =
      null;
  }


  if (
    ANNE_STATE.recognition
  ) {

    try {

      ANNE_STATE.recognition.onend =
        null;


      ANNE_STATE.recognition.abort();

    } catch (e) {}


    ANNE_STATE.recognition =
      null;
  }
}


// SUBBLOCK 1111
// ============================================================
// Recognition 생성 및 시작
// PASSAGE AUTO SYNC 포함
// ============================================================

function startAnneRecognition() {

  if (!SpeechRecognition) {

    alert(
      'Chrome 또는 Edge 브라우저에서 마이크 기능을 사용해 주세요.'
    );

    return;
  }


  if (!ANNE_STATE.micMode) {
    return;
  }


  stopAnneRecognition();


  var sentence =
    getCurrentMicSentence();


  if (!sentence) {

    console.warn(
      '[MIC] 읽을 문장 없음'
    );

    return;
  }


  var recognition =
    new SpeechRecognition();


  ANNE_STATE.recognition =
    recognition;


  _anneMicCurrentRecognition =
    recognition;


  _anneMicLastTranscript =
    '';


  recognition.lang =
    sentence.recognition;


  recognition.continuous =
    true;


  recognition.interimResults =
    true;


  recognition.maxAlternatives =
    3;


  console.log(
    '[MIC] 언어:',
    sentence.code,
    recognition.lang
  );


  // ==========================================================
  // RESULT
  // ==========================================================

  recognition.onresult =
    function(event) {

      if (
        !ANNE_STATE.micMode
      ) {
        return;
      }


      var transcript =
        '';


      for (
        var i = 0;
        i < event.results.length;
        i++
      ) {

        if (
          event.results[i] &&
          event.results[i][0]
        ) {

          transcript +=
            event.results[i][0]
              .transcript +
            ' ';
        }
      }


      transcript =
        transcript.trim();


      if (!transcript) {
        return;
      }


      _anneMicLastTranscript =
        transcript;


      if (
        _anneMicRecognizeTimer
      ) {

        clearTimeout(
          _anneMicRecognizeTimer
        );
      }


      var delay =
        Math.max(
          0.5,
          Number(
            window.__micRecognizeDelay
          ) || 2
        );


      _anneMicRecognizeTimer =
        setTimeout(
          function() {

            if (
              ANNE_STATE.micMode &&
              ANNE_STATE.recognition ===
                recognition
            ) {

              finalizeAnneMicRecognition(
                false
              );
            }

          },
          delay * 1000
        );


      var scoreEl =
        document.getElementById(
          'anneMicScore'
        );


      if (scoreEl) {

        scoreEl.textContent =
          'Listening...';

        scoreEl.style.color =
          '#2563eb';
      }
    };


  // ==========================================================
  // ERROR
  // ==========================================================

  recognition.onerror =
    function(event) {

      console.warn(
        '[MIC] recognition error:',
        event.error
      );


      if (
        event.error ===
        'not-allowed'
      ) {

        alert(
          '브라우저에서 마이크 사용 권한을 허용해 주세요.'
        );

        turnAnneMicOff();
      }
    };


  // ==========================================================
  // END → SCORE / AUTO SYNC
  // ==========================================================

  recognition.onend =
    function() {

      if (
        _anneMicRecognizeTimer
      ) {

        clearTimeout(
          _anneMicRecognizeTimer
        );

        _anneMicRecognizeTimer =
          null;
      }


      if (
        !ANNE_STATE.micMode ||
        _anneMicMoving
      ) {

        return;
      }


      var spokenText =
        String(
          _anneMicLastTranscript ||
          ''
        ).trim();


      if (!spokenText) {

        _anneMicRestartTimer =
          setTimeout(
            function() {

              if (
                ANNE_STATE.micMode &&
                !_anneMicMoving
              ) {

                startAnneRecognition();
              }

            },
            350
          );

        return;
      }


      // ======================================================
      // 현재 문장 SCORE
      // ======================================================

      var score =
        calculateAnneMicScore(
          sentence.text,
          spokenText,
          sentence.code
        );


      var threshold =
        Number(
          window.__micThreshold
        ) || 70;


      // ======================================================
      // PASSAGE AUTO SYNC
      //
      // 현재 문장이 크게 안 맞으면
      // 주변 문장 중 더 잘 맞는 문장을 찾음
      // ======================================================

      if (
        sentence.passageMode &&
        sentence.passageElements &&
        score < threshold
      ) {

        var elements =
          sentence.passageElements;


        var currentIndex =
          sentence.passageIndex;


        var candidateIndexes = [

          currentIndex - 1,
          currentIndex + 1,
          currentIndex + 2

        ];


        var bestIndex =
          currentIndex;


        var bestScore =
          score;


        candidateIndexes.forEach(
          function(index) {

            if (
              index < 0 ||
              index >=
                elements.length
            ) {
              return;
            }


            var candidateText =
              String(
                elements[index]
                  .textContent ||
                ''
              ).trim();


            if (!candidateText) {
              return;
            }


            var candidateScore =
              calculateAnneMicScore(
                candidateText,
                spokenText,
                sentence.code
              );


            if (
              candidateScore >
              bestScore
            ) {

              bestScore =
                candidateScore;

              bestIndex =
                index;
            }
          }
        );


        // ----------------------------------------------------
        // 잘못된 자동 점프 방지
        //
        // 현재보다 최소 12점 높고
        // 최소 55점 이상일 때만 SYNC
        // ----------------------------------------------------

        if (
          bestIndex !==
            currentIndex &&
          bestScore >= 55 &&
          bestScore >=
            score + 12
        ) {

          console.log(
            '[MIC SYNC]',
            currentIndex,
            '→',
            bestIndex,
            bestScore + '%'
          );


          _anneMicPassageIndex =
            bestIndex;


          sentence =
            getCurrentMicSentence();


          score =
            bestScore;
        }
      }


      var passed =
        score >=
        threshold;


      console.log(
        '[MIC] 원문:',
        sentence.text
      );


      console.log(
        '[MIC] 인식:',
        spokenText
      );


      console.log(
        '[MIC] 점수:',
        score +
        '% / 기준 ' +
        threshold +
        '%'
      );


      showAnneMicScore(
        score,
        passed
      );


      highlightAnneMicWords(
        sentence,
        spokenText
      );


      // ======================================================
      // PASS
      // ======================================================

      if (passed) {

        if (
          typeof playPassSound ===
          'function'
        ) {

          playPassSound();
        }


        // ====================================================
        // AUTO
        // ====================================================

        if (
          window.__micAutoAdvance
        ) {

          // --------------------------------------------------
          // PASSAGE → 다음 문장
          // --------------------------------------------------

          if (
            sentence.passageMode &&
            sentence.passageIndex <
              sentence.passageCount - 1
          ) {

            _anneMicMoving =
              true;


            _anneMicPassageIndex =
              sentence.passageIndex + 1;


            setTimeout(
              function() {

                _anneMicMoving =
                  false;


                if (
                  ANNE_STATE.micMode
                ) {

                  startAnneRecognition();
                }

              },
              650
            );


            return;
          }


          // --------------------------------------------------
          // 단문 → 다음 문제
          // --------------------------------------------------

          _anneMicMoving =
            true;


          var currentDate =
            ANNE_STATE._currentDate;


          var dayQuestions =
            ANNE_STATE.questions.filter(
              function(q) {

                return (
                  q.date ===
                  currentDate
                );
              }
            );


          var dayIndex =
            ANNE_STATE.index -
            ANNE_STATE._currentDayStart;


          if (
            dayIndex <
            dayQuestions.length - 1
          ) {

            setTimeout(
              function() {

                if (
                  !ANNE_STATE.micMode
                ) {

                  _anneMicMoving =
                    false;

                  return;
                }


                go(1);


                setTimeout(
                  function() {

                    _anneMicMoving =
                      false;


                    if (
                      ANNE_STATE.micMode
                    ) {

                      startAnneRecognition();
                    }

                  },
                  450
                );

              },
              650
            );


            return;
          }


          _anneMicMoving =
            false;
        }

      } else {

        if (
          typeof playFailSound ===
          'function'
        ) {

          playFailSound();
        }
      }


      // ======================================================
      // MANUAL / FAIL
      // 현재 SYNC 문장에서 계속 듣기
      // ======================================================

      _anneMicRestartTimer =
        setTimeout(
          function() {

            if (
              ANNE_STATE.micMode &&
              !_anneMicMoving
            ) {

              startAnneRecognition();
            }

          },
          500
        );
    };


  // ==========================================================
  // START
  // ==========================================================

  try {

    recognition.start();

  } catch (e) {

    console.warn(
      '[MIC] 시작 실패:',
      e
    );
  }
}


// SUBBLOCK 1112
// ============================================================
// MIC ON
// ============================================================

function turnAnneMicOn() {

  var btn =
    document.getElementById(
      'anneMicButton'
    );


  if (!btn) {
    return;
  }


  // 컴퓨터 TTS 중지
  if (
    typeof stopSpeech ===
    'function'
  ) {

    stopSpeech();

  }


  ANNE_STATE.micMode =
    true;
  _anneMicPassageIndex = 0;


  btn.classList.add(
    'active'
  );


  btn.setAttribute(
    'aria-pressed',
    'true'
  );


  btn.style.filter =
    'brightness(0.75)';


  btn.style.fontWeight =
    '700';


  var panel =
    ensureAnneMicPanel();


  positionAnneMicPanel();


  panel.style.display =
    'block';


  if (
    typeof playMicOnSound ===
    'function'
  ) {

    playMicOnSound();

  }


  startAnneRecognition();
}


// SUBBLOCK 1113
// ============================================================
// MIC OFF
// ============================================================

function turnAnneMicOff() {

  ANNE_STATE.micMode =
    false;


  _anneMicMoving =
    false;


  stopAnneRecognition();


  var btn =
    document.getElementById(
      'anneMicButton'
    );


  if (btn) {

    btn.classList.remove(
      'active'
    );


    btn.setAttribute(
      'aria-pressed',
      'false'
    );


    btn.style.filter =
      '';


    btn.style.fontWeight =
      '';

  }


  var panel =
    document.getElementById(
      'anneMicPanel'
    );


  if (panel) {

    panel.style.display =
      'none';

  }


  if (
    typeof playMicOffSound ===
    'function'
  ) {

    playMicOffSound();

  }
}


// SUBBLOCK 1114
// ============================================================
// MIC 버튼 설치
//
// licenseSpeech가 버튼을 나중에 생성하므로
// 버튼이 나타날 때 자동으로 바인딩
// ============================================================

function installAnneMicButton() {

  var btn =
    document.getElementById(
      'anneMicButton'
    );


  if (!btn) {
    return false;
  }


  if (
    btn.dataset.micBound ===
    '1'
  ) {

    return true;
  }


  btn.dataset.micBound =
    '1';


  btn.setAttribute(
    'aria-pressed',
    'false'
  );


  btn.onclick =
    function() {

      if (
        ANNE_STATE.micMode
      ) {

        turnAnneMicOff();

      } else {

        turnAnneMicOn();

      }

    };


  _anneMicInstalled =
    true;


  console.log(
    '[MIC] ✅ 마이크 버튼 설치 완료'
  );


  return true;
}


// SUBBLOCK 1115
// ============================================================
// MIC 버튼 생성 감시
// ============================================================

(function watchAnneMicButton() {

  if (
    installAnneMicButton()
  ) {
    return;
  }


  var observer =
    new MutationObserver(
      function() {

        if (
          installAnneMicButton()
        ) {

          observer.disconnect();

        }

      }
    );


  observer.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true
    }
  );


  setTimeout(
    function() {

      if (
        _anneMicInstalled
      ) {

        observer.disconnect();

      }

    },
    10000
  );

})();


// ============================================================
// BLOCK 1200: anne-init.js
// ============================================================
// ============================================================

// SUBBLOCK 1201
function playPassSound() {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  var ctx = new AudioCtx();
  var now = ctx.currentTime;
  var osc1 = ctx.createOscillator();
  var gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = 880;
  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.4);
  var osc2 = ctx.createOscillator();
  var gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 660;
  gain2.gain.setValueAtTime(0.001, now + 0.25);
  gain2.gain.exponentialRampToValueAtTime(0.3, now + 0.27);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.25);
  osc2.stop(now + 0.6);
}

// SUBBLOCK 1202
function playFailSound() {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  var ctx = new AudioCtx();
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 220;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.5);
}

// SUBBLOCK 1203
function playMicOnSound() {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  var ctx = new AudioCtx();
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

// SUBBLOCK 1204
function playMicOffSound() {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  var ctx = new AudioCtx();
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

var _initDone = false;

// SUBBLOCK 1205
function initApp() {
  if (_initDone) return;
  _initDone = true;
  setupHome();
}

document.addEventListener('DOMContentLoaded', initApp);
if (document.readyState !== 'loading') { initApp(); }

window.ANNE_INIT = function() {
  if (typeof setupHome === 'function') { initApp(); }
};


// ============================================================
// BLOCK 1300: anne-speech.js
// ============================================================
// ============================================================

// SUBBLOCK 1301
function setPlaybackEnabled(enabled) {
  var ids = [
    'licensePlay',
    'licenseReplay',
    'licenseStop',
    'licenseSpeed',
    'licenseAuto',
    'anneMicButton'
  ];

  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.disabled = !enabled;
    }
  });
}

window.setPlaybackEnabled = setPlaybackEnabled;

// SUBBLOCK 1302
var _speechInstalled = false;
var _voiceListLoaded = false;
var _isSpeaking = false;
var _speechTimeout = null;
var _currentUtterance = null;
var _utteranceRefs = [];
var _speechRunId = 0;

// SUBBLOCK 1303
function getAnneState() {
  if (typeof ANNE_STATE === 'undefined') {
    console.warn('[TTS] ANNE_STATE 없음');
    return null;
  }
  return ANNE_STATE;
}

// SUBBLOCK 1304
function mapLanguageCode(code) {
  code = String(code || '').toUpperCase();
  var map = {
    ENG: 'en-US',
    KOR: 'ko-KR',
    JPN: 'ja-JP'
  };
  return map[code] || 'en-US';
}

// SUBBLOCK 1305
function ensureVoicesLoaded(callback) {
  if (!('speechSynthesis' in window)) {
    console.warn('[TTS] speechSynthesis 미지원');
    if (callback) callback();
    return;
  }
  var voices = window.speechSynthesis.getVoices();
  if (voices && voices.length) {
    _voiceListLoaded = true;
    if (callback) {
      callback();
    }
    return;
  }
  var finished = false;
  function done() {
    if (finished) return;
    finished = true;
    window.speechSynthesis.removeEventListener(
      'voiceschanged',
      voiceHandler
    );
    _voiceListLoaded = true;
    if (callback) {
      callback();
    }
  }
  function voiceHandler() {
    var list = window.speechSynthesis.getVoices();
    if (list && list.length) {
      done();
    }
  }
  window.speechSynthesis.addEventListener(
    'voiceschanged',
    voiceHandler
  );
  try {
    window.speechSynthesis.getVoices();
  } catch (e) {}
  setTimeout(done, 1500);
}

// SUBBLOCK 1306
// ============================================================
// LANGUAGE + CONVERSATION GENDER VOICE
// 기존 ANNE Voice 선택 + Speaker Gender Adapter
// ============================================================

function findVoiceForLanguage(
  lang,
  speaker
) {

  try {

    var voices =
      window.speechSynthesis
        .getVoices();


    if (
      !voices ||
      !voices.length
    ) {
      return null;
    }


    // 1314에서 speaker 전달되면 그것 사용
    // 전달 안 되더라도 현재 Highlight 문장의 speaker 사용
    speaker =
      String(
        speaker ||
        window.__conversationCurrentTtsSpeaker ||
        ''
      ).trim();


    var gender =
      speaker
        ? getConversationSpeakerGender(
            speaker
          )
        : '';


    console.log(
      '[TTS ROLE]',
      speaker || '-',
      gender || '-'
    );


    var normalized =
      String(
        lang || ''
      )
      .replace(
        '_',
        '-'
      )
      .toLowerCase();


    var prefix =
      normalized.slice(
        0,
        2
      );


    var languageVoices =
      voices.filter(
        function(v) {

          var voiceLang =
            String(
              v.lang || ''
            )
            .replace(
              '_',
              '-'
            )
            .toLowerCase();


          return (
            voiceLang ===
              normalized ||
            voiceLang.startsWith(
              prefix
            )
          );
        }
      );


    if (
      !languageVoices.length
    ) {

      languageVoices =
        voices.slice();
    }


    var femaleNames = [
      'zira',
      'aria',
      'jenny',
      'samantha',
      'victoria',
      'susan',
      'hazel',
      'heera',
      'fiona',
      'karen',
      'moira',
      'tessa',
      'female'
    ];


    var maleNames = [
      'david',
      'mark',
      'guy',
      'george',
      'james',
      'daniel',
      'alex',
      'fred',
      'ralph',
      'male'
    ];


    var wantedNames =
      gender === 'F'
        ? femaleNames
        : gender === 'M'
          ? maleNames
          : [];


    if (
      wantedNames.length
    ) {

      var genderVoice =
        languageVoices.find(
          function(v) {

            var voiceName =
              String(
                v.name || ''
              ).toLowerCase();


            return wantedNames.some(
              function(name) {

                return voiceName.includes(
                  name
                );
              }
            );
          }
        );


      if (
        genderVoice
      ) {

        console.log(
          '[TTS VOICE]',
          speaker,
          gender,
          '→',
          genderVoice.name
        );


        return genderVoice;
      }
    }


    // ========================================================
    // 기존 ANNE fallback
    // ========================================================

    var exact =
      languageVoices.find(
        function(v) {

          return String(
            v.lang || ''
          )
          .replace(
            '_',
            '-'
          )
          .toLowerCase() ===
            normalized;
        }
      );


    if (
      exact
    ) {

      console.log(
        '[TTS VOICE FALLBACK]',
        exact.name
      );


      return exact;
    }


    return languageVoices[0] ||
      null;


  } catch (e) {

    console.warn(
      '[TTS] Voice 검색 실패:',
      e
    );


    return null;
  }
}

// SUBBLOCK 1307
function isSpeechElementVisible(el) {
  if (!el) return false;
  var node = el;
  while (node && node !== document.body) {
    var style = window.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden'
    ) {
      return false;
    }
    node = node.parentElement;
  }
  return true;
}

// SUBBLOCK 1308
function collectVisibleSpeechItems() {

  var root =
    document.getElementById(
      'questionContainer'
    );

  if (!root) {

    console.warn(
      '[TTS] questionContainer 없음'
    );

    return [];
  }


  var state =
    getAnneState();


  var currentMode =
    state
      ? state.mode
      : 'study';


  var correctAnswer =
    null;


  if (state) {

    var currentDate =
      state._currentDate;


    var dayQuestions =
      state.questions.filter(
        function(q) {

          return (
            q.date ===
            currentDate
          );
        }
      );


    var dayIndex =
      state.index -
      (
        state._currentDayStart ||
        0
      );


    var currentQuestion =
      dayQuestions[
        dayIndex
      ];


    if (currentQuestion) {

      correctAnswer =
        Number(
          currentQuestion.answer
        );
    }
  }


  var elements =
    Array.from(
      root.querySelectorAll(
        '.language-line[data-language]'
      )
    );


  var items = [];


  elements.forEach(
    function(el) {

      if (
        !isSpeechElementVisible(el)
      ) {
        return;
      }


      if (
        el.closest(
          '#licenseFeedback'
        ) ||
        el.closest(
          '.explanation'
        )
      ) {
        return;
      }


      var choice =
        el.closest(
          '.choice'
        );


      if (
        currentMode ===
          'learn' &&
        choice
      ) {

        var answerNumber =
          Number(
            choice.getAttribute(
              'data-answer'
            )
          );


        if (
          answerNumber !==
          correctAnswer
        ) {
          return;
        }
      }


      var text =
        String(
          el.textContent ||
          ''
        );


      if (!text.trim()) {
        return;
      }


      var langCode =
        String(
          el.dataset.language ||
          'ENG'
        ).toUpperCase();


      if (
        langCode !== 'ENG' &&
        langCode !== 'KOR' &&
        langCode !== 'JPN'
      ) {

        langCode =
          'ENG';
      }


      // ======================================================
      // CONVERSATION ADAPTER
      // 현재 문장이 속한 Speaker를 TTS item에 직접 저장
      // ======================================================

      var turnEl =
        el.closest(
          '.conversation-turn'
        );


      var speaker =
        turnEl
          ? String(
              turnEl.dataset.speaker ||
              ''
            ).trim()
          : '';


      items.push({

        text:
          text,

        langCode:
          langCode,

        lang:
          mapLanguageCode(
            langCode
          ),

        container:
          el,

        speaker:
          speaker
      });

    }
  );


  console.log(
    '[TTS] 화면 읽기 목록:',
    items.map(
      function(x) {

        return (
          x.langCode +
          (
            x.speaker
              ? '(' +
                x.speaker +
                ')'
              : ''
          )
        );
      }
    ).join(' → ')
  );


  return items;
}

// SUBBLOCK 1309
function createHighlightSpans(
  container,
  text,
  langCode
) {

  if (
    !container ||
    !text
  ) {
    return null;
  }


  // ==========================================================
  // CONVERSATION ADAPTER
  // 현재 실제로 읽는 문장의 Speaker를 직접 기억
  // ==========================================================

  var conversationTurn =
    container.closest(
      '.conversation-turn'
    );


  window.__conversationCurrentTtsSpeaker =
    conversationTurn
      ? String(
          conversationTurn.dataset.speaker ||
          ''
        ).trim()
      : '';


  console.log(
    '[TTS CURRENT SPEAKER]',
    window.__conversationCurrentTtsSpeaker ||
    '-'
  );


  var fragment =
    document.createDocumentFragment();


  var tokens =
    [];


  function addToken(
    value,
    start,
    end
  ) {

    var span =
      document.createElement(
        'span'
      );


    span.className =
      'hl-word-span';


    span.dataset.start =
      String(start);


    span.dataset.end =
      String(end);


    span.textContent =
      value;


    span.style.display =
      'inline';


    span.style.padding =
      '1px 1px';


    span.style.borderRadius =
      '3px';


    span.style.transition =
      'background-color 0.08s ease';


    fragment.appendChild(
      span
    );


    tokens.push({

      span:
        span,

      start:
        start,

      end:
        end
    });
  }


  if (
    String(
      langCode
    ).toUpperCase() ===
    'JPN'
  ) {

    var cursor =
      0;


    Array.from(
      text
    ).forEach(
      function(ch) {

        var start =
          cursor;


        cursor +=
          ch.length;


        if (
          /\s/.test(ch)
        ) {

          fragment.appendChild(
            document.createTextNode(
              ch
            )
          );

        } else {

          addToken(
            ch,
            start,
            cursor
          );
        }
      }
    );


  } else {

    var regex =
      /\s+|[^\s]+/g;


    var match;


    while (
      (
        match =
          regex.exec(
            text
          )
      ) !== null
    ) {

      var part =
        match[0];


      var start =
        match.index;


      var end =
        start +
        part.length;


      if (
        /^\s+$/.test(
          part
        )
      ) {

        fragment.appendChild(
          document.createTextNode(
            part
          )
        );

      } else {

        addToken(
          part,
          start,
          end
        );
      }
    }
  }


  container.replaceChildren(
    fragment
  );


  return {

    container:
      container,

    text:
      text,

    tokens:
      tokens
  };
}
// SUBBLOCK 1310
function clearSpeechHighlight(data) {
  if (
    !data ||
    !data.tokens
  ) {
    return;
  }
  data.tokens.forEach(
    function(token) {
      token.span.style.backgroundColor =
        'transparent';
      token.span.style.color =
        'inherit';
      token.span.style.boxShadow =
        'none';
    }
  );
}

// SUBBLOCK 1311
function highlightSpeechAtChar(
  data,
  charIndex
) {
  if (
    !data ||
    !data.tokens ||
    !data.tokens.length
  ) {
    return;
  }
  var index =
    Number(charIndex);
  if (
    !Number.isFinite(index) ||
    index < 0
  ) {
    index = 0;
  }
  var active =
    null;
  for (
    var i = 0;
    i < data.tokens.length;
    i++
  ) {
    var token =
      data.tokens[i];
    if (
      index >= token.start &&
      index < token.end
    ) {
      active = token;
      break;
    }
    if (
      index < token.start
    ) {
      active = token;
      break;
    }
  }
  if (!active) {
    active =
      data.tokens[
        data.tokens.length - 1
      ];
  }
  data.tokens.forEach(
    function(token) {
      var on =
        token === active;
      token.span.style.backgroundColor =
        on
          ? '#fef08a'
          : 'transparent';
      token.span.style.color =
        on
          ? '#111827'
          : 'inherit';
      token.span.style.boxShadow =
        on
          ? 'inset 0 -3px 0 #facc15'
          : 'none';
    }
  );
}

// SUBBLOCK 1312
function stopSpeech() {
  _speechRunId++;
  if (_speechTimeout) {
    clearTimeout(
      _speechTimeout
    );
    _speechTimeout =
      null;
  }
  _isSpeaking =
    false;
  _currentUtterance =
    null;
  _utteranceRefs =
    [];
  var state =
    getAnneState();
  if (state) {
    state._utterance =
      null;
  }
  if (
    'speechSynthesis' in window
  ) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  document
    .querySelectorAll(
      '.hl-word-span'
    )
    .forEach(
      function(span) {
        span.style.backgroundColor =
          'transparent';
        span.style.color =
          'inherit';
        span.style.boxShadow =
          'none';
      }
    );
}

window.stopSpeech =
  stopSpeech;

// SUBBLOCK 1313
function speakWithDyslexiaSupport() {
  console.log(
    '[TTS] PLAY'
  );
  stopSpeech();
  if (
    !('speechSynthesis' in window)
  ) {
    alert(
      '이 브라우저는 음성 읽기를 지원하지 않습니다.'
    );
    return;
  }
  var items =
    collectVisibleSpeechItems();
  if (!items.length) {
    console.warn(
      '[TTS] 화면에 읽을 문장이 없음'
    );
    return;
  }
  var runId =
    ++_speechRunId;
  ensureVoicesLoaded(
    function() {
      if (
        runId !== _speechRunId
      ) {
        return;
      }
      readTextsWithHighlight(
        items,
        0,
        runId
      );
    }
  );
}

window.speakWithDyslexiaSupport =
  speakWithDyslexiaSupport;

// SUBBLOCK 1314
function readTextsWithHighlight(
  items,
  index,
  runId
) {

  if (
    runId !== _speechRunId
  ) {
    return;
  }


  if (
    index >= items.length
  ) {

    console.log(
      '[TTS] 전체 화면 읽기 완료'
    );


    _isSpeaking =
      false;


    _currentUtterance =
      null;


    if (
      window.__licenseSpeechState
    ) {

      window.__licenseSpeechState(
        'licenseStop'
      );
    }


    var finishedState =
      getAnneState();


    if (
      finishedState &&
      finishedState.auto &&
      !finishedState.micMode
    ) {

      setTimeout(
        function() {

          if (
            runId !== _speechRunId
          ) {
            return;
          }


          if (
            typeof go ===
            'function'
          ) {

            go(1);
          }

        },
        500
      );
    }


    return;
  }


  var item =
    items[index];


  var displayText =
    String(
      item.text || ''
    );


  if (
    !displayText.trim()
  ) {

    readTextsWithHighlight(
      items,
      index + 1,
      runId
    );

    return;
  }


  var textToSpeak =
    displayText;


  if (
    item.langCode === 'JPN'
  ) {

    textToSpeak =
      displayText.replace(
        /[\u3400-\u4DBF\u4E00-\u9FFF々〆ヵヶ]+[\(（]([ぁ-ゖァ-ヺー]+)[\)）]/g,
        '$1'
      );
  }


  console.log(
    '[TTS]',
    item.langCode,
    '화면:',
    displayText
  );


  console.log(
    '[TTS]',
    item.langCode,
    '읽기:',
    textToSpeak
  );


  var highlightData =
    null;


  if (
    item.langCode === 'JPN' &&
    item.container &&
    item.container.isConnected
  ) {

    var container =
      item.container;


    var fragment =
      document.createDocumentFragment();


    var tokens =
      [];


    var spokenCursor =
      0;


    var furiganaRegex =
      /([\u3400-\u4DBF\u4E00-\u9FFF々〆ヵヶ]+)[\(（]([ぁ-ゖァ-ヺー]+)[\)）]/g;


    var lastIndex =
      0;


    var match;


    function addJapaneseToken(
      visibleText,
      spokenText
    ) {

      if (!visibleText) {
        return;
      }


      var span =
        document.createElement(
          'span'
        );


      span.className =
        'hl-word-span';


      span.textContent =
        visibleText;


      span.style.display =
        'inline';


      span.style.padding =
        '1px 1px';


      span.style.borderRadius =
        '3px';


      span.style.transition =
        'background-color 0.08s ease';


      var start =
        spokenCursor;


      var end =
        start +
        String(
          spokenText || ''
        ).length;


      span.dataset.start =
        String(start);


      span.dataset.end =
        String(end);


      fragment.appendChild(
        span
      );


      tokens.push({

        span:
          span,

        start:
          start,

        end:
          end
      });


      spokenCursor =
        end;
    }


    while (
      (
        match =
          furiganaRegex.exec(
            displayText
          )
      ) !== null
    ) {

      if (
        match.index >
        lastIndex
      ) {

        var before =
          displayText.slice(
            lastIndex,
            match.index
          );


        Array.from(
          before
        ).forEach(
          function(ch) {

            addJapaneseToken(
              ch,
              ch
            );
          }
        );
      }


      addJapaneseToken(
        match[0],
        match[2]
      );


      lastIndex =
        furiganaRegex.lastIndex;
    }


    if (
      lastIndex <
      displayText.length
    ) {

      var rest =
        displayText.slice(
          lastIndex
        );


      Array.from(
        rest
      ).forEach(
        function(ch) {

          addJapaneseToken(
            ch,
            ch
          );
        }
      );
    }


    container.replaceChildren(
      fragment
    );


    highlightData = {

      container:
        container,

      text:
        textToSpeak,

      tokens:
        tokens
    };


  } else if (
    item.container &&
    item.container.isConnected
  ) {

    highlightData =
      createHighlightSpans(
        item.container,
        displayText,
        item.langCode
      );
  }


  var utterance =
    new SpeechSynthesisUtterance(
      textToSpeak
    );


  _currentUtterance =
    utterance;


  _utteranceRefs.push(
    utterance
  );


  var state =
    getAnneState();


  if (state) {

    state._utterance =
      utterance;
  }


  utterance.lang =
    item.lang;


  // ==========================================================
  // CONVERSATION SPEAKER → GENDER VOICE
  // 현재 읽는 item의 speaker를 직접 전달
  // ==========================================================

  var voice =
    findVoiceForLanguage(
      item.lang,
      item.speaker || ''
    );


  if (voice) {

    utterance.voice =
      voice;
  }


  var speedSelect =
    document.getElementById(
      'licenseSpeed'
    );


  var rate =
    speedSelect
      ? parseFloat(
          speedSelect.value
        )
      : 1;


  if (
    !Number.isFinite(rate) ||
    rate <= 0
  ) {

    rate =
      1;
  }


  utterance.rate =
    rate;


  var japaneseHighlightTimer =
    null;


  var speechStartedAt =
    0;


  var lastBoundaryTime =
    0;


  var japaneseEstimatedMs =
    Math.max(
      1500,
      (
        textToSpeak.length *
        160
      ) / rate
    );


  function stopJapaneseTimer() {

    if (
      japaneseHighlightTimer
    ) {

      clearInterval(
        japaneseHighlightTimer
      );


      japaneseHighlightTimer =
        null;
    }
  }


  function startJapaneseFallback() {

    if (
      item.langCode !==
      'JPN'
    ) {
      return;
    }


    stopJapaneseTimer();


    japaneseHighlightTimer =
      setInterval(
        function() {

          if (
            runId !==
            _speechRunId
          ) {

            stopJapaneseTimer();

            return;
          }


          if (
            !_isSpeaking
          ) {

            stopJapaneseTimer();

            return;
          }


          var now =
            Date.now();


          if (
            lastBoundaryTime &&
            now -
            lastBoundaryTime <
            700
          ) {
            return;
          }


          var elapsed =
            now -
            speechStartedAt;


          var ratio =
            elapsed /
            japaneseEstimatedMs;


          ratio =
            Math.max(
              0,
              Math.min(
                0.98,
                ratio
              )
            );


          var charIndex =
            Math.floor(
              textToSpeak.length *
              ratio
            );


          highlightSpeechAtChar(
            highlightData,
            charIndex
          );

        },
        120
      );
  }


  utterance.onstart =
    function() {

      if (
        runId !==
        _speechRunId
      ) {
        return;
      }


      _isSpeaking =
        true;


      speechStartedAt =
        Date.now();


      highlightSpeechAtChar(
        highlightData,
        0
      );


      startJapaneseFallback();
    };


  utterance.onboundary =
    function(event) {

      if (
        runId !==
        _speechRunId
      ) {
        return;
      }


      if (
        typeof event.charIndex
        !== 'number'
      ) {
        return;
      }


      lastBoundaryTime =
        Date.now();


      highlightSpeechAtChar(
        highlightData,
        event.charIndex
      );
    };


  utterance.onend =
    function() {

      if (
        runId !==
        _speechRunId
      ) {
        return;
      }


      stopJapaneseTimer();


      clearSpeechHighlight(
        highlightData
      );


      if (
        _speechTimeout
      ) {

        clearTimeout(
          _speechTimeout
        );


        _speechTimeout =
          null;
      }


      _isSpeaking =
        false;


      _currentUtterance =
        null;


      _utteranceRefs =
        _utteranceRefs.filter(
          function(u) {

            return (
              u !==
              utterance
            );
          }
        );


      if (state) {

        state._utterance =
          null;
      }


      readTextsWithHighlight(
        items,
        index + 1,
        runId
      );
    };


  utterance.onerror =
    function(event) {

      if (
        runId !==
        _speechRunId
      ) {
        return;
      }


      stopJapaneseTimer();


      var error =
        event &&
        event.error
          ? event.error
          : 'unknown';


      clearSpeechHighlight(
        highlightData
      );


      if (
        _speechTimeout
      ) {

        clearTimeout(
          _speechTimeout
        );


        _speechTimeout =
          null;
      }


      _isSpeaking =
        false;


      _currentUtterance =
        null;


      if (state) {

        state._utterance =
          null;
      }


      if (
        error === 'canceled' ||
        error === 'interrupted'
      ) {
        return;
      }


      console.warn(
        '[TTS] 오류:',
        error
      );


      readTextsWithHighlight(
        items,
        index + 1,
        runId
      );
    };


  var estimatedSeconds;


  if (
    item.langCode === 'JPN' ||
    item.langCode === 'KOR'
  ) {

    estimatedSeconds =
      Math.max(
        20,
        textToSpeak.length /
          (4 * rate)
          + 15
      );

  } else {

    var wordCount =
      textToSpeak
        .trim()
        .split(/\s+/)
        .length;


    estimatedSeconds =
      Math.max(
        20,
        wordCount *
          0.8 /
          rate
          + 15
      );
  }


  estimatedSeconds =
    Math.min(
      estimatedSeconds,
      600
    );


  _speechTimeout =
    setTimeout(
      function() {

        if (
          runId !==
          _speechRunId
        ) {
          return;
        }


        if (
          _currentUtterance !==
          utterance
        ) {
          return;
        }


        stopJapaneseTimer();


        try {

          window.speechSynthesis
            .cancel();

        } catch (e) {}


        clearSpeechHighlight(
          highlightData
        );


        _isSpeaking =
          false;


        _currentUtterance =
          null;


        if (state) {

          state._utterance =
            null;
        }


        readTextsWithHighlight(
          items,
          index + 1,
          runId
        );

      },
      estimatedSeconds *
      1000
    );


  try {

    _isSpeaking =
      true;


    window.speechSynthesis.speak(
      utterance
    );


  } catch (e) {

    stopJapaneseTimer();


    console.error(
      '[TTS] speak 실패:',
      e
    );


    clearSpeechHighlight(
      highlightData
    );


    if (
      _speechTimeout
    ) {

      clearTimeout(
        _speechTimeout
      );


      _speechTimeout =
        null;
    }


    _isSpeaking =
      false;


    _currentUtterance =
      null;


    readTextsWithHighlight(
      items,
      index + 1,
      runId
    );
  }
}

// SUBBLOCK 1315
function installSpeech() {
  if (_speechInstalled) {
    console.log(
      '[TTS] 이미 설치됨'
    );
    return;
  }
  _speechInstalled =
    true;
  if (
    'speechSynthesis' in window
  ) {
    try {
      window.speechSynthesis.getVoices();
    } catch (e) {}
    window.speechSynthesis
      .addEventListener(
        'voiceschanged',
        function() {
          var voices =
            window.speechSynthesis
              .getVoices();
          if (
            voices &&
            voices.length
          ) {
            _voiceListLoaded =
              true;
          }
        }
      );
  }
  var host =
    document.getElementById(
      'bibleHeaderActionRow'
    );
  if (!host) {
    console.warn(
      '[TTS] bibleHeaderActionRow 없음'
    );
    return;
  }
  if (
    host.querySelector(
      '.bible-speech-controls'
    )
  ) {
    return;
  }
  host.innerHTML = `
    <div class="bible-speech-controls">

      <button
        title="Play"
        aria-label="Play"
        aria-pressed="false"
        class="bible-speech-button bible-speech-play"
        id="licensePlay"
      >▶</button>

      <button
        title="Replay"
        aria-label="Replay"
        aria-pressed="false"
        class="bible-speech-button bible-speech-replay"
        id="licenseReplay"
      >↻</button>

      <button
        title="Stop"
        aria-label="Stop"
        aria-pressed="false"
        class="bible-speech-button bible-speech-stop"
        id="licenseStop"
      >
        <span class="bible-stop-icon">■</span>
      </button>

      <select
        title="Speed"
        aria-label="Speed"
        class="bible-speech-speed"
        id="licenseSpeed"
      >
        <option value="0.25">0.25×</option>
        <option value="0.5">0.5×</option>
        <option value="0.75">0.75×</option>
        <option value="1" selected>1.0×</option>
        <option value="1.25">1.25×</option>
        <option value="1.5">1.5×</option>
      </select>

      <button
        title="Auto next"
        aria-label="Auto next"
        class="bible-speech-button bible-speech-auto-next"
        id="licenseAuto"
        aria-pressed="false"
      >AUTO</button>

      <button
        title="Microphone"
        aria-label="Microphone"
        class="bible-speech-button"
        id="anneMicButton"
      >🎤</button>

    </div>
  `;
  var stateButton =
    function(active) {
      [
        'licensePlay',
        'licenseReplay',
        'licenseStop'
      ].forEach(
        function(id) {
          var btn =
            document.getElementById(id);
          if (!btn) {
            return;
          }
          var on =
            id === active;
          btn.classList.toggle(
            'active',
            on
          );
          btn.setAttribute(
            'aria-pressed',
            String(on)
          );
        }
      );
    };
  window.__licenseSpeechState =
    stateButton;
  document.getElementById(
    'licensePlay'
  ).onclick =
    function() {
      stateButton(
        'licensePlay'
      );
      speakWithDyslexiaSupport();
    };
  document.getElementById(
    'licenseReplay'
  ).onclick =
    function() {
      stateButton(
        'licenseReplay'
      );
      speakWithDyslexiaSupport();
    };
  document.getElementById(
    'licenseStop'
  ).onclick =
    function() {
      stopSpeech();
      stateButton(
        'licenseStop'
      );
    };
  var autoBtn =
    document.getElementById(
      'licenseAuto'
    );
  if (autoBtn) {
    autoBtn.onclick =
      function() {
        var state =
          getAnneState();
        if (!state) {
          return;
        }
        state.auto =
          !state.auto;
        autoBtn.classList.toggle(
          'active',
          state.auto
        );
        autoBtn.textContent =
          state.auto
            ? 'AUTO ON'
            : 'AUTO';
        autoBtn.setAttribute(
          'aria-pressed',
          String(state.auto)
        );
        if (
          typeof saveLastSettings
          === 'function'
        ) {
          saveLastSettings();
        }
      };
  }
  console.log(
    '[TTS] ✅ 설치 완료'
  );
}

// SUBBLOCK 1316
if (
  'speechSynthesis' in window
) {
  setTimeout(
    function() {
      try {
        window.speechSynthesis
          .getVoices();
      } catch (e) {}
    },
    100
  );
}

// ============================================================
// BLOCK 1400: conversation-lesson.js
// DIALOGUE Parser
// HELP Parser
// 2-Turn 기본 화면
// PSG 전체보기
// ? HELP / CHUNK
// NEXT / PREV
// ============================================================


// SUBBLOCK 1405
// ============================================================
// CONVERSATION STATE
// ============================================================

const CONVERSATION_STATE = {

  row: null,

  turns: [],

  help: {},

  pairIndex: 0,

  fullPassage: false,

  helpVisible: false
};

window.CONVERSATION_STATE =
  CONVERSATION_STATE;


// SUBBLOCK 1410
// ============================================================
// DIALOGUE Parser
//
// Jessica: Hello...<br>
// Alan: Hi...
//
// ↓
//
// [
//   {
//     turn: 1,
//     speaker: 'Jessica',
//     text: 'Hello...'
//   }
// ]
// ============================================================

function parseConversationDialogue(
  dialogue
) {

  var source =
    String(
      dialogue || ''
    )
    .trim();


  if (!source) {
    return [];
  }


  var lines =
    source
      .split(
        /<br\s*\/?>|\r?\n/gi
      )
      .map(
        function(line) {

          return String(
            line || ''
          ).trim();

        }
      )
      .filter(Boolean);


  var turns = [];


  lines.forEach(
    function(line) {

      var colonIndex =
        line.indexOf(':');


      if (
        colonIndex <= 0
      ) {
        return;
      }


      var speaker =
        line
          .slice(
            0,
            colonIndex
          )
          .trim();


      var text =
        line
          .slice(
            colonIndex + 1
          )
          .trim();


      if (
        !speaker ||
        !text
      ) {
        return;
      }


      turns.push({

        turn:
          turns.length + 1,

        speaker:
          speaker,

        text:
          text
      });

    }
  );


  console.log(
    '[CONVERSATION] Turns:',
    turns.length
  );


  return turns;
}


// SUBBLOCK 1415
// ============================================================
// HELP Parser
//
// T1=aaa : bbb | ccc : ddd ||
// T2=...
//
// ↓
//
// {
//   1: [
//     { term:'aaa', meaning:'bbb' }
//   ]
// }
// ============================================================

function parseConversationHelp(
  helpText
) {

  var source =
    String(
      helpText || ''
    ).trim();


  var result =
    {};


  if (!source) {
    return result;
  }


  var sections =
    source.split(
      /\s*\|\|\s*/
    );


  sections.forEach(
    function(section) {

      section =
        String(
          section || ''
        ).trim();


      if (!section) {
        return;
      }


      var match =
        section.match(
          /^T(\d+)\s*=\s*(.*)$/i
        );


      if (!match) {
        return;
      }


      var turnNumber =
        Number(
          match[1]
        );


      var body =
        String(
          match[2] || ''
        ).trim();


      var items =
        body
          .split(
            /\s*\|\s*/
          )
          .map(
            function(item) {

              var value =
                String(
                  item || ''
                ).trim();


              if (!value) {
                return null;
              }


              var colonIndex =
                value.indexOf(':');


              if (
                colonIndex < 0
              ) {

                return {

                  term:
                    value,

                  meaning:
                    ''
                };
              }


              return {

                term:
                  value
                    .slice(
                      0,
                      colonIndex
                    )
                    .trim(),

                meaning:
                  value
                    .slice(
                      colonIndex + 1
                    )
                    .trim()
              };

            }
          )
          .filter(Boolean);


      result[
        turnNumber
      ] =
        items;

    }
  );


  return result;
}


// SUBBLOCK 1420
// ============================================================
// 현재 2 TURN
// ============================================================

function getCurrentConversationPair() {

  var start =
    CONVERSATION_STATE.pairIndex *
    2;


  return CONVERSATION_STATE.turns.slice(
    start,
    start + 2
  );
}


// SUBBLOCK 1425
// ============================================================
// TURN HTML
// ANNE TTS ENGINE ADAPTER
//
// 기존 ANNE TTS가 찾는:
// .language-line[data-language]
//
// Conversation Turn에 그대로 제공
// ============================================================

function renderConversationTurn(
  turn,
  fullMode
) {

  if (!turn) {
    return '';
  }


  var currentPair =
    getCurrentConversationPair();


  var isCurrent =
    currentPair.some(
      function(item) {

        return (
          item.turn ===
          turn.turn
        );

      }
    );


  var languageCode =
    String(
      CONVERSATION_STATE.row?.LNG ||
      'EN'
    )
    .toUpperCase();


  var anneLanguageCode =
    languageCode === 'KO'
      ? 'KOR'
      : languageCode === 'JP'
        ? 'JPN'
        : 'ENG';


  return `
    <div
      class="conversation-turn ${isCurrent ? 'conversation-current-pair' : ''}"
      data-turn="${turn.turn}"
      data-speaker="${esc(turn.speaker)}"
      style="
        padding:14px 15px;
        margin:8px 0;

        border:
          ${isCurrent && fullMode
            ? '2px solid #facc15'
            : '1px solid #dbe3ee'};

        border-radius:10px;

        background:
          ${isCurrent && fullMode
            ? '#fffdf2'
            : '#ffffff'};
      "
    >

      <button
        type="button"
        class="conversation-speaker"
        data-speaker="${esc(turn.speaker)}"
        title="Choose ${esc(turn.speaker)} as My Role"
        style="
          display:inline;
          margin:0 5px 0 0;
          padding:0;

          border:0;
          background:transparent;

          color:#075ea8;

          font-size:15px;
          font-weight:900;

          cursor:pointer;
        "
      >
        ${esc(turn.speaker)}:
      </button>

      <span
        class="
          conversation-text
          language-line
          language-line-${anneLanguageCode.toLowerCase()}
        "
        data-language="${anneLanguageCode}"
        data-turn-text="${turn.turn}"
        data-original-text="${esc(turn.text)}"
        style="
          font-size:16px;
          line-height:1.65;
          color:#172033;
        "
      >
        ${esc(turn.text)}
      </span>

    </div>
  `;
}


// SUBBLOCK 1430
// ============================================================
// 현재 2 TURN HELP / CHUNK
// ============================================================

function renderConversationHelp() {

  if (
    !CONVERSATION_STATE.helpVisible
  ) {
    return '';
  }


  var pair =
    getCurrentConversationPair();


  var html =
    '';


  pair.forEach(
    function(turn) {

      var items =
        CONVERSATION_STATE.help[
          turn.turn
        ] || [];


      if (!items.length) {
        return;
      }


      html += `
        <div style="
          margin-bottom:12px;
        ">

          <div style="
            margin-bottom:6px;
            font-size:13px;
            font-weight:900;
            color:#075ea8;
          ">
            T${turn.turn} · ${esc(turn.speaker)}
          </div>
      `;


      items.forEach(
        function(item) {

          html += `
            <div style="
              padding:5px 0;
              border-bottom:1px solid #edf0f3;
              font-size:14px;
              line-height:1.5;
            ">
              <strong>
                ${esc(item.term)}
              </strong>

              ${
                item.meaning
                  ? ' : ' +
                    esc(
                      item.meaning
                    )
                  : ''
              }
            </div>
          `;

        }
      );


      html +=
        '</div>';

    }
  );


  if (!html) {

    html = `
      <div style="
        color:#64748b;
        font-size:14px;
      ">
        No help for these turns.
      </div>
    `;
  }


  return `
    <div
      id="conversationHelpCard"
      style="
        margin:12px 0;

        padding:14px;

        border-left:4px solid #d4a373;
        border-radius:10px;

        background:#fcf9f5;
      "
    >

      <div style="
        margin-bottom:10px;
        font-size:15px;
        font-weight:900;
        color:#5a4a3a;
      ">
        HELP
      </div>

      ${html}

    </div>
  `;
}


// SUBBLOCK 1435
// ============================================================
// CONVERSATION 화면 RENDER
// ============================================================

function renderConversationLesson() {

  var row =
    CONVERSATION_STATE.row;


  if (!row) {
    return;
  }


  var container =
    document.getElementById(
      'questionContainer'
    );


  if (!container) {
    return;
  }


  var pair =
    getCurrentConversationPair();


  var visibleTurns =
    CONVERSATION_STATE.fullPassage
      ? CONVERSATION_STATE.turns
      : pair;


  var totalPairs =
    Math.ceil(
      CONVERSATION_STATE.turns.length /
      2
    );


  var currentPairNumber =
    CONVERSATION_STATE.pairIndex +
    1;


  container.innerHTML = `

    <div
      class="question-card conversation-card"
    >

      <div
        style="
          margin-bottom:5px;
          color:#64748b;
          font-size:12px;
          font-weight:800;
        "
      >
        ${esc(row.GROUP || '')}

        ${
          row.CATEGORY
            ? ' · ' +
              esc(
                row.CATEGORY
              )
            : ''
        }
      </div>


      <div
        style="
          margin-bottom:4px;

          font-size:20px;
          font-weight:900;

          color:#172033;
        "
      >
        ${esc(
          row.DIALOGUE_TITLE ||
          'Conversation'
        )}
      </div>


      <div
        style="
          margin-bottom:14px;

          color:#64748b;
          font-size:12px;
        "
      >

        ${
          CONVERSATION_STATE.fullPassage
            ? 'FULL CONVERSATION'
            : (
                'Turns ' +
                (
                  CONVERSATION_STATE.pairIndex *
                  2 +
                  1
                ) +
                '–' +
                Math.min(
                  CONVERSATION_STATE.pairIndex *
                  2 +
                  2,
                  CONVERSATION_STATE.turns.length
                )
              )
        }

      </div>


      <div
        id="conversationTurns"
      >

        ${
          visibleTurns
            .map(
              function(turn) {

                return renderConversationTurn(
                  turn,
                  CONVERSATION_STATE.fullPassage
                );

              }
            )
            .join('')
        }

      </div>


      ${
        renderConversationHelp()
      }


      <div style="
        margin-top:12px;
        text-align:right;

        color:#64748b;
        font-size:12px;
        font-weight:700;
      ">
        ${currentPairNumber} / ${totalPairs}
      </div>

    </div>
  `;


  var progress =
    document.getElementById(
      'quizProgressBar'
    );


  if (progress) {

    progress.style.width =
      (
        currentPairNumber /
        totalPairs *
        100
      ) + '%';
  }


  syncConversationButtons();
}


// SUBBLOCK 1440
// ============================================================
// PSG / ? / NEXT / PREV BUTTON SYNC
// ============================================================

function syncConversationButtons() {

  var psg =
    document.getElementById(
      'biblePassageToggle'
    );

  var help =
    document.getElementById(
      'bibleGuideToggle'
    );

  var next =
    document.getElementById(
      'nextBtn'
    );

  var prev =
    document.getElementById(
      'prevBtn'
    );

  var skip =
    document.getElementById(
      'skipBtn'
    );

  var submit =
    document.getElementById(
      'submitBtn'
    );


  if (psg) {

    psg.textContent =
      'PSG';

    psg.classList.toggle(
      'active',
      CONVERSATION_STATE.fullPassage
    );

    psg.setAttribute(
      'aria-pressed',
      String(
        CONVERSATION_STATE.fullPassage
      )
    );
  }


  if (help) {

    help.textContent =
      '?';

    help.title =
      'Help';

    help.classList.toggle(
      'active',
      CONVERSATION_STATE.helpVisible
    );

    help.setAttribute(
      'aria-pressed',
      String(
        CONVERSATION_STATE.helpVisible
      )
    );
  }


  var totalPairs =
    Math.ceil(
      CONVERSATION_STATE.turns.length /
      2
    );


  if (prev) {

    prev.style.display =
      CONVERSATION_STATE.fullPassage
        ? 'none'
        : 'inline-block';

    prev.disabled =
      CONVERSATION_STATE.pairIndex <=
      0;

    prev.textContent =
      '◀ PREV';
  }


  if (next) {

    next.style.display =
      CONVERSATION_STATE.fullPassage
        ? 'none'
        : 'inline-block';

    next.disabled =
      CONVERSATION_STATE.pairIndex >=
      totalPairs - 1;

    next.textContent =
      'NEXT ▶';
  }


  if (skip) {
    skip.style.display =
      'none';
  }


  if (submit) {
    submit.style.display =
      'none';
  }
}


// SUBBLOCK 1445
// ============================================================
// CONVERSATION BUTTON EVENTS
// ============================================================

function installConversationLessonControls() {

  var psg =
    document.getElementById(
      'biblePassageToggle'
    );

  var help =
    document.getElementById(
      'bibleGuideToggle'
    );

  var next =
    document.getElementById(
      'nextBtn'
    );

  var prev =
    document.getElementById(
      'prevBtn'
    );


  if (psg) {

    psg.disabled =
      false;

    psg.onclick =
      function() {

        CONVERSATION_STATE.fullPassage =
          !CONVERSATION_STATE.fullPassage;

        renderConversationLesson();
      };
  }


  if (help) {

    help.disabled =
      false;

    help.onclick =
      function() {

        CONVERSATION_STATE.helpVisible =
          !CONVERSATION_STATE.helpVisible;

        renderConversationLesson();
      };
  }


  if (next) {

    next.onclick =
      function() {

        var totalPairs =
          Math.ceil(
            CONVERSATION_STATE.turns.length /
            2
          );


        if (
          CONVERSATION_STATE.pairIndex <
          totalPairs - 1
        ) {

          CONVERSATION_STATE.pairIndex++;

          CONVERSATION_STATE.helpVisible =
            false;

          renderConversationLesson();
        }
      };
  }


  if (prev) {

    prev.onclick =
      function() {

        if (
          CONVERSATION_STATE.pairIndex >
          0
        ) {

          CONVERSATION_STATE.pairIndex--;

          CONVERSATION_STATE.helpVisible =
            false;

          renderConversationLesson();
        }
      };
  }
}


// SUBBLOCK 1450
// ============================================================
// LESSON START
// ============================================================

function startConversationLesson(
  row
) {

  if (!row) {
    return;
  }


  var turns =
    parseConversationDialogue(
      row.DIALOGUE
    );


  if (!turns.length) {

    console.error(
      '[CONVERSATION] Dialogue parsing failed'
    );

    return;
  }


  CONVERSATION_STATE.row =
    row;

  CONVERSATION_STATE.turns =
    turns;

  CONVERSATION_STATE.help =
    parseConversationHelp(
      row.HELP
    );

  CONVERSATION_STATE.pairIndex =
    0;

  CONVERSATION_STATE.fullPassage =
    false;

  CONVERSATION_STATE.helpVisible =
    false;


  var setup =
    document.getElementById(
      'setupSection'
    );

  var quizMain =
    document.getElementById(
      'quizMain'
    );

  var quizContent =
    document.getElementById(
      'quizContent'
    );

  var progress =
    document.querySelector(
      '.progress-area'
    );


  if (setup) {
    setup.style.display =
      'none';
  }


  if (quizMain) {
    quizMain.style.display =
      'block';
  }


  if (quizContent) {
    quizContent.style.display =
      'block';
  }


  if (progress) {
    progress.style.display =
      'block';
  }


  var title =
    document.querySelector(
      '.sat-title'
    );


  if (title) {
    title.textContent =
      'CONVERSATION';
  }


  installConversationLessonControls();

  renderConversationLesson();


  console.log(
    '[CONVERSATION] Lesson started:',
    row.ID,
    row.LNG,
    turns.length + ' turns'
  );
}
// ============================================================
// BLOCK 1500: conversation-directory.js
// GROUP → CATEGORY → SUBCATEGORY → TITLE
// Folder / Directory Navigation
// ============================================================


// SUBBLOCK 1505
// ============================================================
// DIRECTORY STATE
// ============================================================

const CONVERSATION_LIST_STATE = {

  rows: [],

  level: 'GROUP',

  group: '',

  category: '',

  subcategory: '',

  search: '',

  loading: false
};

window.CONVERSATION_LIST_STATE =
  CONVERSATION_LIST_STATE;


// SUBBLOCK 1510
// ============================================================
// HOME START
// ============================================================

async function startConversationHome() {

  if (
    CONVERSATION_LIST_STATE.loading
  ) {
    return;
  }


  CONVERSATION_LIST_STATE.loading =
    true;


  showConversationDirectoryLoading();


  try {

    await loadConversationPeople();


    // Catalog는 최초 1회만 로딩
    if (
      !CONVERSATION_LIST_STATE.rows.length
    ) {

      CONVERSATION_LIST_STATE.rows =
        await loadConversationCatalog();
    }


    CONVERSATION_LIST_STATE.level =
      'GROUP';

    CONVERSATION_LIST_STATE.group =
      '';

    CONVERSATION_LIST_STATE.category =
      '';

    CONVERSATION_LIST_STATE.subcategory =
      '';

    CONVERSATION_LIST_STATE.search =
      '';


    renderConversationDirectory();


    console.log(
      '[CONVERSATION] DIRECTORY READY:',
      CONVERSATION_LIST_STATE.rows.length
    );


  } catch (error) {

    console.error(
      '[CONVERSATION] DIRECTORY FAILED:',
      error
    );


    showConversationDirectoryError(
      error.message
    );


  } finally {

    CONVERSATION_LIST_STATE.loading =
      false;
  }
}


// SUBBLOCK 1515
// ============================================================
// LOADING
// ============================================================

function showConversationDirectoryLoading() {

  var setup =
    document.getElementById(
      'setupSection'
    );


  var quizMain =
    document.getElementById(
      'quizMain'
    );


  if (setup) {

    setup.style.display =
      'block';
  }


  if (quizMain) {

    quizMain.style.display =
      'none';
  }


  var card =
    document.querySelector(
      '.card-new'
    );


  if (!card) {
    return;
  }


  card.innerHTML = `

    <div style="
      padding:40px 10px;
      text-align:center;
      color:#64748b;
    ">

      <div style="
        font-size:30px;
        margin-bottom:10px;
      ">
        💬
      </div>

      <strong>
        Loading Conversations...
      </strong>

    </div>
  `;
}


// SUBBLOCK 1520
// ============================================================
// ERROR
// ============================================================

function showConversationDirectoryError(
  message
) {

  var card =
    document.querySelector(
      '.card-new'
    );


  if (!card) {
    return;
  }


  card.innerHTML = `

    <div style="
      padding:30px;
      text-align:center;
    ">

      <div style="
        color:#b91c1c;
        font-weight:900;
      ">
        Conversation Load Failed
      </div>

      <div style="
        margin-top:8px;
        color:#64748b;
        font-size:13px;
      ">
        ${esc(message)}
      </div>

    </div>
  `;
}


// SUBBLOCK 1525
// ============================================================
// UNIQUE VALUES
// ============================================================

function uniqueConversationValues(
  rows,
  field
) {

  return Array.from(
    new Set(
      rows
        .map(
          function(row) {

            return String(
              row[field] || ''
            ).trim();
          }
        )
        .filter(Boolean)
    )
  ).sort(
    function(a, b) {

      return a.localeCompare(
        b,
        undefined,
        {
          numeric: true,
          sensitivity: 'base'
        }
      );
    }
  );
}


// SUBBLOCK 1530
// ============================================================
// CURRENT ROWS
// 현재 Directory 위치 기준
// ============================================================

function getConversationDirectoryRows() {

  var rows =
    CONVERSATION_LIST_STATE.rows;


  if (
    CONVERSATION_LIST_STATE.group
  ) {

    rows =
      rows.filter(
        function(row) {

          return (
            String(
              row.GROUP || ''
            ) ===
            CONVERSATION_LIST_STATE.group
          );
        }
      );
  }


  if (
    CONVERSATION_LIST_STATE.category
  ) {

    rows =
      rows.filter(
        function(row) {

          return (
            String(
              row.CATEGORY || ''
            ) ===
            CONVERSATION_LIST_STATE.category
          );
        }
      );
  }


  if (
    CONVERSATION_LIST_STATE.subcategory
  ) {

    rows =
      rows.filter(
        function(row) {

          return (
            String(
              row.SUBCATEGORY || ''
            ) ===
            CONVERSATION_LIST_STATE.subcategory
          );
        }
      );
  }


  return rows;
}


// SUBBLOCK 1535
// ============================================================
// BREADCRUMB
// ============================================================

function renderConversationBreadcrumb() {

  var parts = [];


  parts.push(
    `<button
      type="button"
      data-directory-home="1"
      style="
        border:0;
        background:transparent;
        color:#075ea8;
        font-weight:900;
        cursor:pointer;
        padding:0;
      "
    >
      CONVERSATION
    </button>`
  );


  if (
    CONVERSATION_LIST_STATE.group
  ) {

    parts.push(
      `<button
        type="button"
        data-directory-level="GROUP_SELECTED"
        style="
          border:0;
          background:transparent;
          color:#075ea8;
          font-weight:800;
          cursor:pointer;
          padding:0;
        "
      >
        ${esc(
          CONVERSATION_LIST_STATE.group
        )}
      </button>`
    );
  }


  if (
    CONVERSATION_LIST_STATE.category
  ) {

    parts.push(
      `<button
        type="button"
        data-directory-level="CATEGORY_SELECTED"
        style="
          border:0;
          background:transparent;
          color:#075ea8;
          font-weight:800;
          cursor:pointer;
          padding:0;
        "
      >
        ${esc(
          CONVERSATION_LIST_STATE.category
        )}
      </button>`
    );
  }


  if (
    CONVERSATION_LIST_STATE.subcategory
  ) {

    parts.push(
      `<span style="
        color:#475569;
        font-weight:800;
      ">
        ${esc(
          CONVERSATION_LIST_STATE.subcategory
        )}
      </span>`
    );
  }


  return `
    <div
      id="conversationBreadcrumb"
      style="
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:6px;

        margin-bottom:12px;

        color:#64748b;
        font-size:12px;
      "
    >

      ${parts.join(
        '<span>›</span>'
      )}

    </div>
  `;
}


// SUBBLOCK 1540
// ============================================================
// DIRECTORY MAIN RENDER
// ============================================================

function renderConversationDirectory() {

  var setup =
    document.getElementById(
      'setupSection'
    );


  var quizMain =
    document.getElementById(
      'quizMain'
    );


  var quizContent =
    document.getElementById(
      'quizContent'
    );


  var progress =
    document.querySelector(
      '.progress-area'
    );


  if (setup) {

    setup.style.display =
      'block';
  }


  if (quizMain) {

    quizMain.style.display =
      'none';
  }


  if (quizContent) {

    quizContent.style.display =
      'none';
  }


  if (progress) {

    progress.style.display =
      'none';
  }


  if (
    typeof stopSpeech ===
    'function'
  ) {

    stopSpeech();
  }


  if (
    typeof ANNE_STATE !==
      'undefined' &&
    ANNE_STATE.micMode &&
    typeof turnAnneMicOff ===
      'function'
  ) {

    turnAnneMicOff();
  }


  var title =
    document.querySelector(
      '.sat-title'
    );


  if (title) {

    title.textContent =
      'CONVERSATION';
  }


  var card =
    document.querySelector(
      '.card-new'
    );


  if (!card) {
    return;
  }


  card.innerHTML = `

    <div style="
      width:100%;
      text-align:left;
    ">

      ${renderConversationBreadcrumb()}

      <div
        id="conversationDirectoryTitle"
        style="
          margin-bottom:10px;

          font-size:20px;
          font-weight:900;
          color:#172033;
        "
      >
      </div>


      <div
        id="conversationDirectoryContent"
      >
      </div>

    </div>
  `;


  installConversationBreadcrumb();


  renderConversationDirectoryContent();
}


// SUBBLOCK 1545
// ============================================================
// DIRECTORY CONTENT
// ============================================================

function renderConversationDirectoryContent() {

  var title =
    document.getElementById(
      'conversationDirectoryTitle'
    );


  var host =
    document.getElementById(
      'conversationDirectoryContent'
    );


  if (
    !title ||
    !host
  ) {
    return;
  }


  var level =
    CONVERSATION_LIST_STATE.level;


  var rows =
    getConversationDirectoryRows();


  // ==========================================================
  // GROUP
  // ==========================================================

  if (
    level === 'GROUP'
  ) {

    title.textContent =
      'Choose Level';


    var groups =
      uniqueConversationValues(
        CONVERSATION_LIST_STATE.rows,
        'GROUP'
      );


    host.innerHTML =
      renderConversationFolderList(
        groups,
        'GROUP'
      );


    bindConversationFolderButtons();

    return;
  }


  // ==========================================================
  // CATEGORY
  // ==========================================================

  if (
    level === 'CATEGORY'
  ) {

    title.textContent =
      'Choose Category';


    var categories =
      uniqueConversationValues(
        rows,
        'CATEGORY'
      );


    host.innerHTML =
      renderConversationFolderList(
        categories,
        'CATEGORY'
      );


    bindConversationFolderButtons();

    return;
  }


  // ==========================================================
  // SUBCATEGORY
  // ==========================================================

  if (
    level === 'SUBCATEGORY'
  ) {

    title.textContent =
      'Choose Subcategory';


    var subcategories =
      uniqueConversationValues(
        rows,
        'SUBCATEGORY'
      );


    host.innerHTML =
      renderConversationFolderList(
        subcategories,
        'SUBCATEGORY'
      );


    bindConversationFolderButtons();

    return;
  }


  // ==========================================================
  // TITLES
  // ==========================================================

  title.textContent =
    CONVERSATION_LIST_STATE.subcategory ||
    'Conversations';


  renderConversationTitles(
    rows
  );
}


// SUBBLOCK 1550
// ============================================================
// FOLDER LIST
// ============================================================

function renderConversationFolderList(
  values,
  type
) {

  if (
    !values.length
  ) {

    return `
      <div style="
        padding:25px 5px;
        text-align:center;
        color:#94a3b8;
      ">
        No items found.
      </div>
    `;
  }


  return values.map(
    function(value) {

      var count = 0;


      if (
        type === 'GROUP'
      ) {

        count =
          CONVERSATION_LIST_STATE.rows.filter(
            function(row) {

              return (
                String(
                  row.GROUP || ''
                ) === value
              );
            }
          ).length;

      } else {

        count =
          getConversationDirectoryRows().filter(
            function(row) {

              return (
                String(
                  row[type] || ''
                ) === value
              );
            }
          ).length;
      }


      return `

        <button
          type="button"
          class="conversation-folder"
          data-folder-type="${esc(type)}"
          data-folder-value="${esc(value)}"
          style="
            display:flex;
            width:100%;
            min-height:50px;

            align-items:center;
            gap:10px;

            padding:8px 5px;

            border:0;
            border-bottom:1px solid #e2e8f0;

            background:#ffffff;

            text-align:left;
            cursor:pointer;
          "
        >

          <span style="
            font-size:21px;
            flex:0 0 auto;
          ">
            📁
          </span>


          <span style="
            flex:1;
            min-width:0;

            color:#172033;
            font-size:15px;
            font-weight:850;

            overflow:hidden;
            text-overflow:ellipsis;
          ">
            ${esc(value)}
          </span>


          <span style="
            flex:0 0 auto;

            color:#94a3b8;
            font-size:11px;
            font-weight:800;
          ">
            ${count}
          </span>


          <span style="
            color:#64748b;
            font-weight:900;
          ">
            ›
          </span>

        </button>
      `;

    }
  ).join('');
}


// SUBBLOCK 1555
// ============================================================
// FOLDER CLICK
// ============================================================

function bindConversationFolderButtons() {

  document
    .querySelectorAll(
      '.conversation-folder'
    )
    .forEach(
      function(button) {

        button.onclick =
          function() {

            var type =
              button.dataset.folderType;


            var value =
              button.dataset.folderValue;


            if (
              type === 'GROUP'
            ) {

              CONVERSATION_LIST_STATE.group =
                value;

              CONVERSATION_LIST_STATE.category =
                '';

              CONVERSATION_LIST_STATE.subcategory =
                '';

              CONVERSATION_LIST_STATE.level =
                'CATEGORY';


            } else if (
              type === 'CATEGORY'
            ) {

              CONVERSATION_LIST_STATE.category =
                value;

              CONVERSATION_LIST_STATE.subcategory =
                '';

              CONVERSATION_LIST_STATE.level =
                'SUBCATEGORY';


            } else if (
              type === 'SUBCATEGORY'
            ) {

              CONVERSATION_LIST_STATE.subcategory =
                value;

              CONVERSATION_LIST_STATE.level =
                'TITLE';
            }


            renderConversationDirectory();
          };
      }
    );
}


// SUBBLOCK 1560
// ============================================================
// TITLE LIST
// SUBCATEGORY 안에서 실제 Conversation 표시
// ============================================================

function renderConversationTitles(
  rows
) {

  var host =
    document.getElementById(
      'conversationDirectoryContent'
    );


  if (!host) {
    return;
  }


  var sortedRows =
    rows.slice().sort(
      function(a, b) {

        return Number(
          a.ID || 0
        ) -
        Number(
          b.ID || 0
        );
      }
    );


  host.innerHTML = `

    <div style="
      margin-bottom:8px;
      color:#64748b;
      font-size:12px;
    ">
      ${sortedRows.length}
      Conversations
    </div>


    ${
      sortedRows.map(
        function(row) {

          return `

            <button
              type="button"
              class="conversation-title-item"
              data-conversation-id="${esc(row.ID)}"
              style="
                display:block;
                width:100%;

                padding:12px 5px;

                border:0;
                border-bottom:1px solid #e2e8f0;

                background:#fff;

                text-align:left;
                cursor:pointer;
              "
            >

              <div style="
                display:flex;
                align-items:center;
                gap:8px;
              ">

                <strong style="
                  flex:1;
                  min-width:0;

                  color:#172033;
                  font-size:15px;

                  overflow:hidden;
                  text-overflow:ellipsis;
                ">
                  ${esc(
                    row.DIALOGUE_TITLE ||
                    'Conversation'
                  )}
                </strong>


                <span style="
                  color:#94a3b8;
                  font-size:11px;
                  font-weight:800;
                ">
                  ${esc(row.ID)}
                </span>

              </div>

            </button>
          `;

        }
      ).join('')
    }
  `;


  document
    .querySelectorAll(
      '.conversation-title-item'
    )
    .forEach(
      function(button) {

        button.onclick =
          function() {

            openConversationFromList(
              button.dataset
                .conversationId
            );
          };
      }
    );
}


// SUBBLOCK 1565
// ============================================================
// BREADCRUMB CLICK
// ============================================================

function installConversationBreadcrumb() {

  var home =
    document.querySelector(
      '[data-directory-home]'
    );


  if (home) {

    home.onclick =
      function() {

        CONVERSATION_LIST_STATE.level =
          'GROUP';

        CONVERSATION_LIST_STATE.group =
          '';

        CONVERSATION_LIST_STATE.category =
          '';

        CONVERSATION_LIST_STATE.subcategory =
          '';

        renderConversationDirectory();
      };
  }


  var group =
    document.querySelector(
      '[data-directory-level="GROUP_SELECTED"]'
    );


  if (group) {

    group.onclick =
      function() {

        CONVERSATION_LIST_STATE.level =
          'CATEGORY';

        CONVERSATION_LIST_STATE.category =
          '';

        CONVERSATION_LIST_STATE.subcategory =
          '';

        renderConversationDirectory();
      };
  }


  var category =
    document.querySelector(
      '[data-directory-level="CATEGORY_SELECTED"]'
    );


  if (category) {

    category.onclick =
      function() {

        CONVERSATION_LIST_STATE.level =
          'SUBCATEGORY';

        CONVERSATION_LIST_STATE.subcategory =
          '';

        renderConversationDirectory();
      };
  }
}


// SUBBLOCK 1570
// ============================================================
// TITLE → LESSON
// ============================================================

async function openConversationFromList(
  id
) {

  if (!id) {
    return;
  }


  try {

    var row =
      await loadConversationById(
        id,
        'EN'
      );


    console.log(
      '[CONVERSATION] OPEN:',
      row.ID,
      row.DIALOGUE_TITLE
    );


    startConversationLesson(
      row
    );


  } catch (error) {

    console.error(
      '[CONVERSATION] OPEN FAILED:',
      error
    );


    alert(
      error.message
    );
  }
}


// SUBBLOCK 1575
// ============================================================
// LESSON → 현재 SUBCATEGORY 목록으로 복귀
// ============================================================

function returnConversationHome() {

  if (
    CONVERSATION_LIST_STATE.subcategory
  ) {

    CONVERSATION_LIST_STATE.level =
      'TITLE';

  } else if (
    CONVERSATION_LIST_STATE.category
  ) {

    CONVERSATION_LIST_STATE.level =
      'SUBCATEGORY';

  } else if (
    CONVERSATION_LIST_STATE.group
  ) {

    CONVERSATION_LIST_STATE.level =
      'CATEGORY';

  } else {

    CONVERSATION_LIST_STATE.level =
      'GROUP';
  }


  renderConversationDirectory();
}

window.returnConversationHome =
  returnConversationHome;
