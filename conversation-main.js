// ============================================================================
// 🟥 BLOCK 3000: CONVERSATION APPLICATION LOGIC / NUMBERING RULES
// ============================================================================
//
// BLOCK numbers are always exactly 4 digits: 0000 ~ 9999.
// Normal COMMON BLOCK spacing: 50.
//
// xxx0 = COMMON / Controller
// xxx1 = PC Chrome
// xxx2 = Android Chrome
// xxx3 = Android APK
// xxx4 = iOS Safari
// xxx5 = macOS Safari
// xxx6 = Reserved
// xxx7 = Reserved
// xxx8 = Reserved
// xxx9 = PATCH / Exceptional fallback
//
// One BLOCK should normally stay within about 120 lines.
// Split only at logical / functional boundaries.
// Do not change executable code merely for BLOCK organization.
// ============================================================================


// ============================================================================
// 🟦 BLOCK 3050: SUPABASE PRIVATE LOCAL CONFIGURATION
// ============================================================================

const SUPABASE_CONFIG = {
  url: 'https://yxudhflyxuztvzaiunva.supabase.co',
  restUrl: 'https://yxudhflyxuztvzaiunva.supabase.co/rest/v1/conversation',
  publishableKey: 'sb_publishable_9Kg6bvsSqZzOGMavBG3_1w_WO6WGbGB'
};


// ============================================================================
// 🟦 BLOCK 3100: LOCAL CONVERSATION CACHE CORE
// ============================================================================

const CONVERSATION_V2_CACHE_KEY =
  'gongbooConversationV2CacheV1';


function getConversationCache() {
  try {
    var saved =
      localStorage.getItem(
        CONVERSATION_V2_CACHE_KEY
      );

    var cache =
      saved
        ? JSON.parse(saved)
        : null;

    if (
      !cache ||
      typeof cache !== 'object'
    ) {
      return {
        languages: {}
      };
    }

    if (
      !cache.languages ||
      typeof cache.languages !== 'object'
    ) {
      cache.languages = {};
    }

    return cache;

  } catch (error) {
    console.warn(
      '[CONVERSATION V2] Cache read failed:',
      error
    );

    return {
      languages: {}
    };
  }
}


function saveConversationCache(
  cache
) {
  try {
    localStorage.setItem(
      CONVERSATION_V2_CACHE_KEY,
      JSON.stringify(cache)
    );

  } catch (error) {
    console.warn(
      '[CONVERSATION V2] Cache save failed:',
      error
    );
  }
}


function getCachedConversationRow(
  id,
  languageCode
) {
  var cache =
    getConversationCache();

  var language =
    String(languageCode || '')
      .trim()
      .toUpperCase();

  return (
    cache.languages[language] &&
    cache.languages[language][String(id)]
  ) || null;
}


// ============================================================================
// 🟦 BLOCK 3150: LOCAL CONVERSATION BATCH CACHE
// ============================================================================

function saveConversationBatch(
  languageCode,
  rows
) {
  var language =
    String(languageCode || '')
      .trim()
      .toUpperCase();

  if (!language || !rows.length) {
    return;
  }

  var cache =
    getConversationCache();

  cache.languages[language] = {};

  rows.forEach(function(row) {
    cache.languages[language][
      String(row.ID)
    ] = row;
  });

  saveConversationCache(cache);
}


function getConversationBatchIds(
  targetId
) {
  var target =
    Number(targetId);

  var directoryRows =
    window.CONVERSATION_V2_DIRECTORY_ROWS ||
    [];

  var current =
    directoryRows.find(function(row) {
      return Number(row.ID) === target;
    });

  if (!current) {
    return [target];
  }

  var group =
    String(current.GROUP || '').trim();

  var category =
    String(current.CATEGORY || '').trim();

  var sameCategoryRows =
    directoryRows
      .filter(function(row) {
        return (
          String(row.GROUP || '').trim() ===
          group
        ) && (
          String(row.CATEGORY || '').trim() ===
          category
        );
      })
      .sort(function(left, right) {
        return Number(left.ID) - Number(right.ID);
      });

  var startIndex =
    sameCategoryRows.findIndex(
      function(row) {
        return Number(row.ID) === target;
      }
    );

  if (startIndex < 0) {
    return [target];
  }

  return sameCategoryRows
    .slice(startIndex, startIndex + 20)
    .map(function(row) {
      return Number(row.ID);
    });
}


// ============================================================================
// 🟦 BLOCK 3200: SERVER CONVERSATION ROW REQUEST
// ============================================================================

async function requestConversationRows(
  ids,
  languageCode
) {
  var language =
    String(languageCode || '')
      .trim()
      .toUpperCase();

  var response =
    await fetch(
      SUPABASE_CONFIG.restUrl +
        '?select=' +
        encodeURIComponent(
          'ID,LNG,GROUP,CATEGORY,DIALOGUE_TITLE,DIALOGUE,HELP'
        ) +
        '&ID=in.' +
        encodeURIComponent(
          '(' + ids.join(',') + ')'
        ) +
        '&LNG=eq.' +
        encodeURIComponent(language) +
        '&order=ID.asc',
      {
        headers: {
          apikey:
            SUPABASE_CONFIG.publishableKey,

          Authorization:
            'Bearer ' +
            SUPABASE_CONFIG.publishableKey
        }
      }
    );

  var text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      'Conversation batch load failed: ' +
      response.status
    );
  }

  return text
    ? JSON.parse(text)
    : [];
}


// ============================================================================
// 🟦 BLOCK 3250: CONVERSATION ROW LOADER
// ============================================================================

async function loadConversationRow(
  id,
  languageCode
) {
  var target =
    Number(id);

  var language =
    String(languageCode || '')
      .trim()
      .toUpperCase();

  var cached =
    getCachedConversationRow(
      target,
      language
    );

  if (cached) {
    console.log(
      '[CONVERSATION V2] Local row:',
      target,
      language
    );

    return cached;
  }

  var batchIds =
    getConversationBatchIds(target);

  var rows =
    await requestConversationRows(
      batchIds,
      language
    );

  if (!rows.length) {
    throw new Error(
      'Conversation row not found: ' +
      target +
      ' / ' +
      language
    );
  }

  saveConversationBatch(
    language,
    rows
  );

  var row =
    rows.find(function(item) {
      return Number(item.ID) === target;
    });

  if (!row) {
    throw new Error(
      'Conversation row not found: ' +
      target +
      ' / ' +
      language
    );
  }

  console.log(
    '[CONVERSATION V2] Server batch:',
    batchIds.length,
    language
  );

  return row;
}


// ============================================================================
// 🟦 BLOCK 3300: STATUS VIEW
// ============================================================================

function setConversationStatus(
  message
) {
  var element =
    document.getElementById(
      'conversationStatus'
    );

  if (element) {
    element.textContent = message;
  }
}


// ============================================================================
// 🟦 BLOCK 3350: DIALOGUE NORMALIZATION AND PARSING
// ============================================================================

function normalizeConversationDialogueText(dialogue) {
  return String(dialogue || '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n|\\r/g, '\n');
}


function parseConversationTurns(dialogue) {
  var lines = normalizeConversationDialogueText(dialogue)
    .split(/<br\s*\/?>|\r?\n/gi)
    .map(function(line) {
      return String(line || '').trim();
    })
    .filter(Boolean);

  var turns = [];

  lines.forEach(function(line) {
    var colonIndex = line.indexOf(':');

    if (colonIndex <= 0) {
      return;
    }

    var speaker = line.slice(0, colonIndex).trim();
    var text = line.slice(colonIndex + 1).trim();

    if (!speaker || !text) {
      return;
    }

    turns.push({
      number: turns.length + 1,
      speaker: speaker,
      text: text
    });
  });

  return turns;
}


// ============================================================================
// 🟦 BLOCK 3400: CONVERSATION TURN RENDERING
// ============================================================================

function renderConversationTurns(turns) {
  var container = document.getElementById(
    'conversationTurns'
  );

  if (!container) {
    throw new Error(
      'Conversation turns element missing'
    );
  }

  container.innerHTML = '';

  turns.forEach(function(turn) {
    var card = document.createElement('article');
    var speaker = document.createElement('strong');
    var text = document.createElement('span');

    card.className =
      'conversation-turn-card';

    card.dataset.turn =
      String(turn.number);

    speaker.className =
      'conversation-turn-speaker';

    speaker.textContent =
      turn.speaker + ':';

    text.className =
      'conversation-turn-text';

    text.textContent =
      turn.text;

    card.appendChild(speaker);
    card.appendChild(text);
    container.appendChild(card);
  });
}


function renderFirstConversationRow(row) {
  var lesson = document.getElementById(
    'conversationLesson'
  );

  var meta = document.getElementById(
    'conversationMeta'
  );

  if (!lesson || !meta) {
    throw new Error(
      'Conversation screen elements missing'
    );
  }

  var turns = parseConversationTurns(
    row.DIALOGUE
  );

  if (!turns.length) {
    throw new Error(
      'Conversation dialogue has no turns'
    );
  }

  meta.innerHTML = '';

  var group = document.createElement('div');
  var title = document.createElement('h2');

  group.className = 'conversation-group';

  group.textContent =
    String(row.GROUP || '') +
    (
      row.CATEGORY
        ? ' · ' + String(row.CATEGORY)
        : ''
    );

  title.className = 'conversation-title';

  title.textContent =
    row.DIALOGUE_TITLE ||
    'Conversation';

  meta.appendChild(group);
  meta.appendChild(title);

  renderConversationTurns(turns);

  lesson.hidden = false;

  console.log(
    '[CONVERSATION V2] Turns:',
    turns.length
  );
}


// ============================================================================
// 🟦 BLOCK 3450: DIRECTORY VALUE HELPERS
// ============================================================================

function getConversationDirectoryText(value) {
  return String(value || '').trim();
}


function getConversationDirectoryUniqueValues(
  rows,
  fieldName
) {
  return Array.from(
    new Set(
      rows
        .map(function(row) {
          return getConversationDirectoryText(
            row[fieldName]
          );
        })
        .filter(Boolean)
    )
  ).sort(function(left, right) {
    return left.localeCompare(right);
  });
}


function getConversationDirectoryRows() {
  return window.CONVERSATION_V2_DIRECTORY_ROWS ||
    [];
}


// ============================================================================
// 🟦 BLOCK 3500: DIRECTORY DATA LOADING
// ============================================================================

async function loadConversationDirectoryRows() {
  var allRows = [];
  var from = 0;
  var pageSize = 1000;

  while (true) {
    var to = from + pageSize - 1;

    var response = await fetch(
      SUPABASE_CONFIG.restUrl +
        '?select=' +
        encodeURIComponent(
          'ID,GROUP,CATEGORY,DIALOGUE_TITLE'
        ) +
        '&LNG=eq.EN' +
        '&order=GROUP.asc,CATEGORY.asc,ID.asc',
      {
        headers: {
          apikey:
            SUPABASE_CONFIG.publishableKey,

          Authorization:
            'Bearer ' +
            SUPABASE_CONFIG.publishableKey,

          Range: from + '-' + to,

          'Range-Unit': 'items'
        }
      }
    );

    var text = await response.text();

    if (!response.ok) {
      throw new Error(
        'Conversation directory load failed: ' +
        response.status
      );
    }

    var rows = text
      ? JSON.parse(text)
      : [];

    allRows = allRows.concat(rows);

    if (rows.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return allRows.filter(function(row) {
    return (
      Number.isInteger(Number(row.ID)) &&
      getConversationDirectoryText(
        row.GROUP
      ) &&
      getConversationDirectoryText(
        row.CATEGORY
      ) &&
      getConversationDirectoryText(
        row.DIALOGUE_TITLE
      )
    );
  });
}


// ============================================================================
// 🟦 BLOCK 3550: DIRECTORY BREADCRUMB / ITEM RENDERING
// ============================================================================

function renderConversationDirectoryBreadcrumb(
  state
) {
  var breadcrumb = document.getElementById(
    'conversationDirectoryBreadcrumb'
  );

  if (!breadcrumb) {
    return;
  }

  breadcrumb.innerHTML = '';

  function appendSeparator() {
    var separator =
      document.createElement('span');

    separator.textContent = '›';

    breadcrumb.appendChild(separator);
  }

  function appendStep(label, action) {
    var button =
      document.createElement('button');

    button.type = 'button';
    button.textContent = label;
    button.onclick = action;

    breadcrumb.appendChild(button);
  }

  appendStep(
    'LEVEL',
    function() {
      renderConversationDirectory({
        level: '',
        category: ''
      });
    }
  );

  if (state.level) {
    appendSeparator();

    appendStep(
      state.level,
      function() {
        renderConversationDirectory({
          level: state.level,
          category: ''
        });
      }
    );
  }

  if (state.category) {
    appendSeparator();

    var category =
      document.createElement('strong');

    category.textContent = state.category;

    breadcrumb.appendChild(category);
  }
}


function renderConversationDirectoryItem(
  container,
  label,
  isTitle,
  onClick
) {
  var button =
    document.createElement('button');

  button.type = 'button';

  button.className =
    'conversation-directory-item' +
    (
      isTitle
        ? ' is-directory-title'
        : ''
    );

  button.textContent = label;
  button.onclick = onClick;

  container.appendChild(button);
}


// ============================================================================
// 🟦 BLOCK 3600: DIRECTORY LEVEL / CATEGORY NAVIGATION
// ============================================================================

function renderConversationDirectory(
  requestedState
) {
  var directory = document.getElementById(
    'conversationDirectory'
  );

  var list = document.getElementById(
    'conversationDirectoryList'
  );

  var app = document.getElementById(
    'conversationApp'
  );

  if (!directory || !list || !app) {
    throw new Error(
      'Conversation directory elements missing'
    );
  }

  var state = {
    level: getConversationDirectoryText(
      requestedState?.level
    ),
    category: getConversationDirectoryText(
      requestedState?.category
    )
  };

  var rows =
    getConversationDirectoryRows();

  directory.hidden = false;

  app.classList.add(
    'conversation-directory-open'
  );

  renderConversationDirectoryBreadcrumb(
    state
  );

  list.innerHTML = '';

  if (!state.level) {
    getConversationDirectoryUniqueValues(
      rows,
      'GROUP'
    ).forEach(function(level) {
      renderConversationDirectoryItem(
        list,
        level,
        false,
        function() {
          renderConversationDirectory({
            level: level,
            category: ''
          });
        }
      );
    });

    return;
  }

  var levelRows = rows.filter(function(row) {
    return (
      getConversationDirectoryText(
        row.GROUP
      ) === state.level
    );
  });

  if (!state.category) {
    getConversationDirectoryUniqueValues(
      levelRows,
      'CATEGORY'
    ).forEach(function(category) {
      renderConversationDirectoryItem(
        list,
        category,
        false,
        function() {
          renderConversationDirectory({
            level: state.level,
            category: category
          });
        }
      );
    });

    return;
  }

  renderConversationDirectoryTitles(
    levelRows,
    state,
    list,
    directory,
    app
  );
}


// ============================================================================
// 🟦 BLOCK 3650: DIRECTORY TITLE SELECTION
// ============================================================================

function renderConversationDirectoryTitles(
  levelRows,
  state,
  list,
  directory,
  app
) {
  var titleRows = levelRows
    .filter(function(row) {
      return (
        getConversationDirectoryText(
          row.CATEGORY
        ) === state.category
      );
    })
    .sort(function(left, right) {
      return Number(left.ID) - Number(right.ID);
    });

  titleRows.forEach(function(row) {
    renderConversationDirectoryItem(
      list,
      getConversationDirectoryText(
        row.DIALOGUE_TITLE
      ),
      true,
      async function() {
        directory.hidden = true;

        app.classList.remove(
          'conversation-directory-open'
        );

        await loadConversationById(
          Number(row.ID)
        );
      }
    );
  });

  if (titleRows.length) {
    return;
  }

  var empty = document.createElement('p');

  empty.className =
    'conversation-directory-empty';

  empty.textContent =
    'No conversations found.';

  list.appendChild(empty);
}


// ============================================================================
// 🟦 BLOCK 3700: APPLICATION STARTUP
// ============================================================================

async function startConversationApp() {
  if (window.__conversationV2Started) {
    return;
  }

  window.__conversationV2Started = true;

  try {
    setConversationStatus(
      'Loading directory...'
    );

    window.CONVERSATION_V2_DIRECTORY_ROWS =
      await loadConversationDirectoryRows();

    if (
      !window.CONVERSATION_V2_DIRECTORY_ROWS.length
    ) {
      throw new Error(
        'Conversation directory is empty'
      );
    }

    renderConversationDirectory({
      level: '',
      category: ''
    });

    setConversationStatus(
      'Directory loaded'
    );

    console.log(
      '[CONVERSATION V2] Directory rows:',
      window.CONVERSATION_V2_DIRECTORY_ROWS.length
    );

  } catch (error) {
    window.__conversationV2Started = false;

    console.error(
      '[CONVERSATION V2] Directory start failed:',
      error
    );

    setConversationStatus(
      'Conversation directory failed'
    );
  }
}


function bootConversationApp() {
  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      startConversationApp,
      { once: true }
    );

    return;
  }

  startConversationApp();
}


bootConversationApp();


// ============================================================================
// 🟦 BLOCK 3750: DIRECTORY LOADING VIEW
// ============================================================================

function renderConversationDirectoryLoading() {
  var directory =
    document.getElementById(
      'conversationDirectory'
    );

  var breadcrumb =
    document.getElementById(
      'conversationDirectoryBreadcrumb'
    );

  var list =
    document.getElementById(
      'conversationDirectoryList'
    );

  var app =
    document.getElementById(
      'conversationApp'
    );

  if (!directory || !list || !app) {
    return;
  }

  directory.hidden = false;

  app.classList.add(
    'conversation-directory-open'
  );

  if (breadcrumb) {
    breadcrumb.innerHTML = '';
  }

  list.innerHTML = '';

  var loading =
    document.createElement('p');

  loading.className =
    'conversation-directory-loading';

  loading.textContent =
    'LOADING DIRECTORY…';

  list.appendChild(loading);
}


function bootConversationDirectoryLoading() {
  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      renderConversationDirectoryLoading,
      { once: true }
    );

    return;
  }

  renderConversationDirectoryLoading();
}


bootConversationDirectoryLoading();


// ============================================================================
// 🟩 4000 — MENU / UI STATE + LANGUAGE / LOADING
// ============================================================================


// ============================================================================
// 🟦 BLOCK 4000: CONVERSATION MENU STATE
// ============================================================================

function getConversationMenus() {
  return [
    {
      buttonId: 'systemMenuButton',
      panelId: 'systemMenuPanel'
    },
    {
      buttonId: 'playMenuButton',
      panelId: 'playMenuPanel'
    },
    {
      buttonId: 'settingsButton',
      panelId: 'settingsPanel'
    }
  ];
}


function closePlayMorePanel() {
  var button =
    document.getElementById(
      'playMoreButton'
    );

  var panel =
    document.getElementById(
      'playMorePanel'
    );

  if (panel) {
    panel.hidden = true;
  }

  if (button) {
    button.setAttribute(
      'aria-expanded',
      'false'
    );
  }
}


function syncPlayButtonWithPlayMenu() {
  var playButton =
    document.getElementById(
      'playButton'
    );

  var playMenuPanel =
    document.getElementById(
      'playMenuPanel'
    );

  if (!playButton || !playMenuPanel) {
    return;
  }

  var menuOpen =
    !playMenuPanel.hidden;

  playButton.disabled = menuOpen;

  playButton.setAttribute(
    'aria-disabled',
    String(menuOpen)
  );
}


// ============================================================================
// 🟦 BLOCK 4050: MENU CLOSE / TOGGLE
// ============================================================================

function closeConversationMenus() {
  getConversationMenus().forEach(
    function(menu) {
      var button =
        document.getElementById(
          menu.buttonId
        );

      var panel =
        document.getElementById(
          menu.panelId
        );

      if (panel) {
        panel.hidden = true;
      }

      if (button) {
        button.setAttribute(
          'aria-expanded',
          'false'
        );
      }
    }
  );

  closePlayMorePanel();
  syncPlayButtonWithPlayMenu();
}


function toggleConversationMenu(
  targetButtonId
) {
  var targetMenu =
    getConversationMenus().find(
      function(menu) {
        return menu.buttonId ===
          targetButtonId;
      }
    );

  if (!targetMenu) {
    return;
  }

  var targetButton =
    document.getElementById(
      targetMenu.buttonId
    );

  var targetPanel =
    document.getElementById(
      targetMenu.panelId
    );

  if (!targetButton || !targetPanel) {
    return;
  }

  var opening =
    targetPanel.hidden;

  closeConversationMenus();

  if (opening) {
    targetPanel.hidden = false;

    targetButton.setAttribute(
      'aria-expanded',
      'true'
    );
  }

  syncPlayButtonWithPlayMenu();
}


// ============================================================================
// 🟦 BLOCK 4100: PLAY MENU VALUE CONTROLS
// ============================================================================

function togglePlayMorePanel() {
  var button =
    document.getElementById(
      'playMoreButton'
    );

  var panel =
    document.getElementById(
      'playMorePanel'
    );

  if (!button || !panel) {
    return;
  }

  var opening = panel.hidden;

  panel.hidden = !opening;

  button.setAttribute(
    'aria-expanded',
    String(opening)
  );
}


function updatePlayRangeValue(
  rangeId,
  outputId,
  suffix
) {
  var range =
    document.getElementById(rangeId);

  var output =
    document.getElementById(outputId);

  if (!range || !output) {
    return;
  }

  output.textContent =
    Number(range.value).toFixed(
      rangeId === 'delayRange'
        ? 1
        : 0
    ) + suffix;
}


// ============================================================================
// 🟦 BLOCK 4150: PLAY MODE TOGGLE
// ============================================================================

function installPlayModeToggle() {
  var button =
    document.getElementById(
      'playModeToggleButton'
    );

  if (!button) {
    return;
  }

  if (!window.CONVERSATION_V2_PLAY_MODE) {
    window.CONVERSATION_V2_PLAY_MODE =
      'computer';
  }

  button.textContent =
    window.CONVERSATION_V2_PLAY_MODE ===
    'i-start'
      ? 'I FIRST'
      : 'COMPUTER';

  button.setAttribute(
    'aria-pressed',
    String(
      window.CONVERSATION_V2_PLAY_MODE ===
        'i-start'
    )
  );

  button.onclick = function() {
    window.CONVERSATION_V2_PLAY_MODE =
      window.CONVERSATION_V2_PLAY_MODE ===
      'computer'
        ? 'i-start'
        : 'computer';

    button.textContent =
      window.CONVERSATION_V2_PLAY_MODE ===
      'i-start'
        ? 'I FIRST'
        : 'COMPUTER';

    button.setAttribute(
      'aria-pressed',
      String(
        window.CONVERSATION_V2_PLAY_MODE ===
          'i-start'
      )
    );
  };
}


// ============================================================================
// 🟦 BLOCK 4200: PLAY DETAIL CONTROLS
// ============================================================================

function installPlayDetails() {
  var moreButton =
    document.getElementById(
      'playMoreButton'
    );

  var autoButton =
    document.getElementById(
      'micAutoToggle'
    );

  if (moreButton) {
    moreButton.onclick = function() {
      togglePlayMorePanel();
    };
  }

  if (autoButton) {
    autoButton.onclick = function() {
      var enabled =
        autoButton.getAttribute(
          'aria-pressed'
        ) !== 'true';

      autoButton.setAttribute(
        'aria-pressed',
        String(enabled)
      );

      window.CONVERSATION_V2_AUTO_PLAY =
        enabled;

      closePlayMorePanel();
    };
  }

  [
    {
      rangeId: 'passRange',
      outputId: 'passValue',
      suffix: '%'
    },
    {
      rangeId: 'delayRange',
      outputId: 'delayValue',
      suffix: 's'
    }
  ].forEach(function(config) {
    var range =
      document.getElementById(
        config.rangeId
      );

    if (!range) {
      return;
    }

    updatePlayRangeValue(
      config.rangeId,
      config.outputId,
      config.suffix
    );

    range.addEventListener(
      'input',
      function() {
        updatePlayRangeValue(
          config.rangeId,
          config.outputId,
          config.suffix
        );
      }
    );

    range.addEventListener(
      'change',
      closePlayMorePanel
    );
  });

  [
    'primaryLanguageSelect',
    'secondaryLanguageSelect',
    'speechSpeedRange'
  ].forEach(function(id) {
    var control =
      document.getElementById(id);

    if (!control) {
      return;
    }

    control.addEventListener(
      'change',
      closePlayMorePanel
    );
  });
}


// ============================================================================
// 🟦 BLOCK 4250: MENU PROTECTION / EVENT INSTALLATION
// ============================================================================

function isCurrentPlayMenuProtectedClick(
  event
) {
  if (!event.target || !event.target.closest) {
    return false;
  }

  return Boolean(
    event.target.closest(
      '#conversationTurns .conversation-turn-card'
    )
  );
}


function installConversationMenus() {
  var menus = getConversationMenus();

  menus.forEach(function(menu) {
    var button =
      document.getElementById(
        menu.buttonId
      );

    if (!button) {
      return;
    }

    button.onclick = function() {
      toggleConversationMenu(
        menu.buttonId
      );
    };
  });

  installPlayModeToggle();
  installPlayDetails();

  var exitButton =
    document.getElementById(
      'playExitButton'
    );

  if (exitButton) {
    exitButton.onclick = function() {
      closeConversationMenus();
    };
  }

  document.addEventListener(
    'click',
    function(event) {
      var clickedMenu = menus.some(
        function(menu) {
          var button =
            document.getElementById(
              menu.buttonId
            );

          var panel =
            document.getElementById(
              menu.panelId
            );

          return (
            (button &&
              button.contains(event.target)) ||
            (panel &&
              panel.contains(event.target))
          );
        }
      );

      if (
        clickedMenu ||
        isCurrentPlayMenuProtectedClick(
          event
        )
      ) {
        return;
      }

      closeConversationMenus();
    }
  );
}


// ============================================================================
// 🟦 BLOCK 4300: MENU BOOTSTRAP
// ============================================================================

function bootConversationMenus() {
  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      installConversationMenus,
      { once: true }
    );

    return;
  }

  installConversationMenus();
}


bootConversationMenus();


// ============================================================================
// 🟦 BLOCK 4350: CURRENT PSG LOOP TOGGLE
// ============================================================================

function renderPlayLoopToggle() {
  var button =
    document.getElementById(
      'playLoopToggle'
    );

  if (!button) {
    return;
  }

  var enabled =
    window.CONVERSATION_V2_LOOP_PLAY ===
    true;

  button.textContent =
    enabled
      ? '↻ ON'
      : '↻ OFF';

  button.setAttribute(
    'aria-pressed',
    String(enabled)
  );
}


function installPlayLoopToggle() {
  var button =
    document.getElementById(
      'playLoopToggle'
    );

  if (!button) {
    return;
  }

  if (
    typeof window.CONVERSATION_V2_LOOP_PLAY !==
    'boolean'
  ) {
    window.CONVERSATION_V2_LOOP_PLAY =
      false;
  }

  renderPlayLoopToggle();

  button.onclick = function() {
    window.CONVERSATION_V2_LOOP_PLAY =
      !window.CONVERSATION_V2_LOOP_PLAY;

    renderPlayLoopToggle();

    closePlayMorePanel();
  };
}


function bootPlayLoopToggle() {
  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      installPlayLoopToggle,
      { once: true }
    );

    return;
  }

  installPlayLoopToggle();
}


bootPlayLoopToggle();


// ============================================================================
// 🟦 BLOCK 4400: LEVEL0 LANGUAGE CODE LOADER
// ============================================================================

async function loadV2LanguageCodes() {
  var allRows = [];
  var from = 0;
  var pageSize = 1000;

  while (true) {
    var to =
      from + pageSize - 1;

    var response =
      await fetch(
        SUPABASE_CONFIG.restUrl +
          '?select=LNG' +
          '&GROUP=eq.LEVEL0' +
          '&order=LNG.asc',
        {
          headers: {
            apikey:
              SUPABASE_CONFIG.publishableKey,

            Authorization:
              'Bearer ' +
              SUPABASE_CONFIG.publishableKey,

            Range:
              from + '-' + to,

            'Range-Unit':
              'items'
          }
        }
      );

    var text = await response.text();

    if (!response.ok) {
      throw new Error(
        'Language list failed: ' +
        response.status
      );
    }

    var rows =
      text
        ? JSON.parse(text)
        : [];

    allRows = allRows.concat(rows);

    if (rows.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return Array.from(
    new Set(
      allRows
        .map(function(row) {
          return String(
            row.LNG || ''
          ).trim().toUpperCase();
        })
        .filter(Boolean)
    )
  ).sort();
}


// ============================================================================
// 🟦 BLOCK 4450: LANGUAGE SELECT BUILDER
// ============================================================================

function fillV2LanguageSelect(
  selectId,
  languageCodes,
  allowNone
) {
  var select =
    document.getElementById(selectId);

  if (!select) {
    return;
  }

  var previousValue =
    String(select.value || '')
      .trim()
      .toUpperCase();

  select.innerHTML = '';

  if (allowNone) {
    var noneOption =
      document.createElement('option');

    noneOption.value = 'NONE';
    noneOption.textContent = 'NONE';

    select.appendChild(noneOption);
  }

  languageCodes.forEach(
    function(languageCode) {
      var option =
        document.createElement('option');

      option.value = languageCode;
      option.textContent = languageCode;

      select.appendChild(option);
    }
  );

  if (
    previousValue === 'NONE' &&
    allowNone
  ) {
    select.value = 'NONE';

  } else if (
    languageCodes.includes(previousValue)
  ) {
    select.value = previousValue;

  } else if (
    languageCodes.includes('EN')
  ) {
    select.value = 'EN';
  }
}


// ============================================================================
// 🟦 BLOCK 4500: LANGUAGE OPTIONS INSTALLATION
// ============================================================================

async function installV2LanguageOptions() {
  try {
    var languageCodes =
      await loadV2LanguageCodes();

    window.CONVERSATION_V2_LANGUAGES =
      languageCodes;

    fillV2LanguageSelect(
      'primaryLanguageSelect',
      languageCodes,
      false
    );

    fillV2LanguageSelect(
      'secondaryLanguageSelect',
      languageCodes,
      true
    );

    console.log(
      '[CONVERSATION V2] Languages:',
      languageCodes
    );

  } catch (error) {
    console.error(
      '[CONVERSATION V2] Language list failed:',
      error
    );
  }
}


installV2LanguageOptions();


// ============================================================================
// 🟦 BLOCK 4550: SELECTED LANGUAGE HELPERS
// ============================================================================

function getV2SelectedLanguage(
  selectId,
  fallback
) {
  var select =
    document.getElementById(selectId);

  var value =
    String(
      select
        ? select.value
        : fallback
    )
    .trim()
    .toUpperCase();

  return value || fallback;
}


async function loadV2PrimaryRow(
  id,
  languageCode
) {
  try {
    return await loadConversationRow(
      id,
      languageCode
    );

  } catch (error) {
    if (languageCode === 'EN') {
      throw error;
    }

    console.warn(
      '[CONVERSATION V2] PRIMARY missing; using EN:',
      languageCode
    );

    return loadConversationRow(
      id,
      'EN'
    );
  }
}

// ============================================================================
// 🟩 5000 — CATEGORY NAVIGATION / TURN RENDER + PLAY / TTS
// ============================================================================


// ============================================================================
// 🟦 BLOCK 5000: SELECTED LANGUAGE RELOAD
// ============================================================================

async function reloadV2SelectedLanguages() {
  var currentId =
    window.CONVERSATION_V2_ROW?.ID ||
    1;

  var primaryLanguage =
    getV2SelectedLanguage(
      'primaryLanguageSelect',
      'EN'
    );

  var secondaryLanguage =
    getV2SelectedLanguage(
      'secondaryLanguageSelect',
      'NONE'
    );

  setConversationStatus(
    'Loading selected languages...'
  );

  var primaryRow =
    await loadV2PrimaryRow(
      currentId,
      primaryLanguage
    );

  var secondaryRow = null;

  if (
    secondaryLanguage !== 'NONE' &&
    secondaryLanguage !== primaryRow.LNG
  ) {
    try {
      secondaryRow =
        await loadConversationRow(
          currentId,
          secondaryLanguage
        );

    } catch (error) {
      console.warn(
        '[CONVERSATION V2] SECONDARY missing:',
        secondaryLanguage
      );
    }
  }

  window.CONVERSATION_V2_ROW =
    primaryRow;

  window.CONVERSATION_V2_SECONDARY_ROW =
    secondaryRow;

  renderFirstConversationRow(
    primaryRow
  );

  if (
    typeof window.renderV2SecondaryTurns ===
    'function'
  ) {
    window.renderV2SecondaryTurns();
  }

  setConversationStatus(
    'Selected languages loaded'
  );

  console.log(
    '[CONVERSATION V2] Selected rows:',
    {
      primary: primaryRow.LNG,
      secondary: secondaryRow
        ? secondaryRow.LNG
        : 'NONE'
    }
  );
}


// ============================================================================
// 🟦 BLOCK 5050: LANGUAGE ROW LOADER INSTALLATION
// ============================================================================

function installV2LanguageRowLoader() {
  var primary =
    document.getElementById(
      'primaryLanguageSelect'
    );

  var secondary =
    document.getElementById(
      'secondaryLanguageSelect'
    );

  if (primary) {
    primary.onchange =
      reloadV2SelectedLanguages;
  }

  if (secondary) {
    secondary.onchange =
      reloadV2SelectedLanguages;
  }
}


installV2LanguageRowLoader();


// ============================================================================
// 🟦 BLOCK 5100: CATEGORY NAVIGATION ROWS / RESUME STATE
// ============================================================================

function getCurrentCategoryNavigationRows() {
  var currentRow =
    window.CONVERSATION_V2_ROW;

  var directoryRows =
    window.CONVERSATION_V2_DIRECTORY_ROWS ||
    [];

  if (!currentRow || !directoryRows.length) {
    return [];
  }

  var group =
    String(currentRow.GROUP || '').trim();

  var category =
    String(currentRow.CATEGORY || '').trim();

  return directoryRows
    .filter(function(row) {
      return (
        String(row.GROUP || '').trim() ===
        group
      ) && (
        String(row.CATEGORY || '').trim() ===
        category
      );
    })
    .sort(function(left, right) {
      return Number(left.ID) - Number(right.ID);
    });
}


function getCurrentNavigationResumeState() {
  var playState =
    getCurrentPsgPlayState();

  var roleState =
    getCurrentRolePlayState();

  return {
    play: playState.running === true,
    rolePlay: roleState.running === true,
    playMode:
      window.CONVERSATION_V2_PLAY_MODE ||
      'computer',
    practiceType:
      getCurrentPracticeType()
  };
}


// ============================================================================
// 🟦 BLOCK 5150: NAVIGATION RESUME / CATEGORY DIRECTORY
// ============================================================================

function resumeCurrentNavigationActivity(
  resumeState
) {
  if (!resumeState) {
    return;
  }

  window.CONVERSATION_V2_PLAY_MODE =
    resumeState.playMode;

  window.CONVERSATION_V2_PRACTICE_TYPE =
    resumeState.practiceType;

  renderCurrentPracticeControls();

  if (resumeState.rolePlay) {
    startCurrentRolePlay();
    return;
  }

  if (resumeState.play) {
    startCurrentPsgPlay();
  }
}


function openCurrentCategoryDirectory() {
  var currentRow =
    window.CONVERSATION_V2_ROW;

  if (!currentRow) {
    return;
  }

  stopCurrentPsgPlay();
  stopCurrentRolePlay();

  renderConversationDirectory({
    level: String(
      currentRow.GROUP || ''
    ).trim(),

    category: String(
      currentRow.CATEGORY || ''
    ).trim()
  });

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


// ============================================================================
// 🟦 BLOCK 5200: NAVIGATION BUTTON STATE / RENDER
// ============================================================================

function setConversationNavigationDisabled(
  disabled
) {
  [
    'previousButton',
    'nextButton'
  ].forEach(function(id) {
    var button =
      document.getElementById(id);

    if (button) {
      button.disabled = disabled;
    }
  });
}


function renderConversationNavigation() {
  var previousButton =
    document.getElementById(
      'previousButton'
    );

  var nextButton =
    document.getElementById(
      'nextButton'
    );

  var currentRow =
    window.CONVERSATION_V2_ROW;

  var rows =
    getCurrentCategoryNavigationRows();

  if (
    !previousButton ||
    !nextButton ||
    !currentRow ||
    !rows.length
  ) {
    return;
  }

  var currentIndex =
    rows.findIndex(function(row) {
      return Number(row.ID) ===
        Number(currentRow.ID);
    });

  if (currentIndex < 0) {
    return;
  }

  var isFirst =
    currentIndex === 0;

  var isLast =
    currentIndex === rows.length - 1;

  previousButton.disabled = false;
  nextButton.disabled = false;

  previousButton.textContent =
    isFirst
      ? '◀ LIST'
      : '◀ PREV';

  nextButton.textContent =
    isLast
      ? 'BACK TO LIST'
      : 'NEXT ▶';

  previousButton.onclick = function() {
    if (isFirst) {
      openCurrentCategoryDirectory();
      return;
    }

    loadConversationById(
      Number(rows[currentIndex - 1].ID)
    );
  };

  nextButton.onclick = function() {
    if (isLast) {
      openCurrentCategoryDirectory();
      return;
    }

    loadConversationById(
      Number(rows[currentIndex + 1].ID)
    );
  };
}


// ============================================================================
// 🟦 BLOCK 5250: CONVERSATION ID NAVIGATION LOADER
// ============================================================================

async function loadConversationById(
  targetId,
  options
) {
  options = options || {};

  var currentRow =
    window.CONVERSATION_V2_ROW;

  var target =
    Number(targetId);

  if (!Number.isInteger(target) || target < 1) {
    return false;
  }

  if (
    currentRow &&
    Number(currentRow.ID) === target
  ) {
    return false;
  }

  var currentContinueMode =
  typeof getCurrentContinueMode === 'function'
    ? getCurrentContinueMode()
    : 'off';

var currentContinueMode =
  typeof getCurrentContinueMode === 'function'
    ? getCurrentContinueMode()
    : 'off';

var shouldResume =
  options.resume === true ||
  (
    options.resume !== false &&
    currentContinueMode === 'next'
  );

  var resumeState =
    shouldResume
      ? getCurrentNavigationResumeState()
      : null;

  setConversationNavigationDisabled(true);

  try {
    stopCurrentPsgPlay();
    stopCurrentRolePlay();

    setConversationStatus(
      'Loading conversation...'
    );

    window.CONVERSATION_V2_ROW = {
      ID: target
    };

    await reloadV2SelectedLanguages();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    setConversationStatus(
      'Conversation loaded'
    );

    resumeCurrentNavigationActivity(
      resumeState
    );

    return true;

  } catch (error) {
    console.error(
      '[CONVERSATION V2] Navigation failed:',
      error
    );

    window.CONVERSATION_V2_ROW =
      currentRow;

    setConversationStatus(
      'No conversation found'
    );

    return false;

  } finally {
    renderConversationNavigation();
  }
}


// ============================================================================
// 🟦 BLOCK 5300: NAVIGATION INSTALLATION / PUBLIC API
// ============================================================================

function installConversationNavigation() {
  renderConversationNavigation();
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installConversationNavigation,
    { once: true }
  );
} else {
  installConversationNavigation();
}


window.loadConversationById =
  loadConversationById;


// ============================================================================
// 🟦 BLOCK 5350: PRIMARY / SECONDARY TURN RENDER
// ============================================================================

function renderV2SecondaryTurns() {
  var secondaryRow =
    window.CONVERSATION_V2_SECONDARY_ROW;

  var cards =
    Array.from(
      document.querySelectorAll(
        '.conversation-turn-card'
      )
    );

  cards.forEach(function(card) {
    var existing =
      card.querySelector(
        '.conversation-secondary-line'
      );

    if (existing) {
      existing.remove();
    }
  });

  if (!secondaryRow || !cards.length) {
    return;
  }

  var secondaryTurns =
    parseConversationTurns(
      secondaryRow.DIALOGUE
    );

  cards.forEach(function(card) {
    var turnNumber =
      Number(card.dataset.turn);

    var secondaryTurn =
      secondaryTurns[
        turnNumber - 1
      ];

    if (!secondaryTurn) {
      return;
    }

    var line =
      document.createElement('div');

    line.className =
      'conversation-secondary-line';

    var speaker =
      document.createElement('strong');

    speaker.className =
      'conversation-secondary-speaker';

    speaker.textContent =
      secondaryTurn.speaker + ':';

    var text =
      document.createElement('span');

    text.className =
      'conversation-secondary-text';

    text.textContent =
      secondaryTurn.text;

    line.appendChild(speaker);
    line.appendChild(text);

    card.appendChild(line);
  });
}


window.renderV2SecondaryTurns =
  renderV2SecondaryTurns;


// ============================================================================
// 🟦 BLOCK 5400: LEGACY ROW PLAY SEQUENCE
// ============================================================================

function buildLegacyRowPsgPlaySequence() {
  var row =
    window.CONVERSATION_V2_ROW;

  if (!row || !row.DIALOGUE) {
    return [];
  }

  var turns =
    parseConversationTurns(
      row.DIALOGUE
    );

  return turns.map(function(turn) {
    return {
      turnNumber: turn.number,
      speaker: turn.speaker,
      speechText: turn.text,
      language: row.LNG || 'EN'
    };
  });
}


function inspectLegacyRowPsgPlaySequence() {
  var sequence =
    buildLegacyRowPsgPlaySequence();

  console.table(
    sequence.map(function(item) {
      return {
        turn: item.turnNumber,
        speaker: item.speaker,
        text: item.speechText,
        language: item.language
      };
    })
  );

  return sequence;
}


window.buildLegacyRowPsgPlaySequence =
  buildLegacyRowPsgPlaySequence;

window.inspectLegacyRowPsgPlaySequence =
  inspectLegacyRowPsgPlaySequence;


// ============================================================================
// 🟦 BLOCK 5450: JAPANESE / CURRENT SPEECH TEXT
// ============================================================================

function getCurrentJapaneseSpeechText(value) {
  return String(value || '')
    .replace(
      /[\u4E00-\u9FFF々〆〤]+[（(]([^）)]+)[）)]/g,
      '$1'
    )
    .replace(
      /[\u4E00-\u9FFF々〆〤]+/g,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}


function getCurrentPsgSpeechText(
  text,
  language
) {
  if (
    String(language || '')
      .toUpperCase() !== 'JA'
  ) {
    return String(text || '').trim();
  }

  return getCurrentJapaneseSpeechText(
    text
  );
}


// ============================================================================
// 🟦 BLOCK 5500: VISIBLE SCREEN PLAY SEQUENCE
// ============================================================================

function buildCurrentPsgPlaySequence() {
  var primaryRow =
    window.CONVERSATION_V2_ROW || {};

  var secondaryRow =
    window.CONVERSATION_V2_SECONDARY_ROW || {};

  var primaryLanguage =
    primaryRow.LNG || 'EN';

  var secondaryLanguage =
    secondaryRow.LNG ||
    primaryLanguage;

  var sequence = [];
    var startTurn =
    getCurrentRoleTargetTurn();

  function addItem(
    text,
    language,
    turnNumber,
    kind
  ) {
    var speechText =
      getCurrentPsgSpeechText(
        text,
        language
      );

    if (!speechText) {
      return;
    }

    sequence.push({
      turnNumber: turnNumber,
      speaker: '',
      speechText: speechText,
      language: language,
      kind: kind
    });
  }

 

  Array.from(
    document.querySelectorAll(
      '.conversation-turn-card'
    )
  ).forEach(function(card, index) {
    var turnNumber =
      Number(card.dataset.turn) ||
      index + 1;

          if (turnNumber < startTurn) {
      return;
    }

    var primaryText =
      card.querySelector(
        '.conversation-turn-text'
      );

    var secondaryText =
      card.querySelector(
        '.conversation-secondary-text'
      );

    if (primaryText) {
      addItem(
        primaryText.textContent,
        primaryLanguage,
        turnNumber,
        'primary'
      );
    }

    if (secondaryText) {
      addItem(
        secondaryText.textContent,
        secondaryLanguage,
        turnNumber,
        'secondary'
      );
    }
  });

  return sequence;
}


// ============================================================================
// 🟦 BLOCK 5550: PLAY SEQUENCE REFRESH / INSPECTION
// ============================================================================

function refreshCurrentPsgPlaySequence() {
  var sequence =
    buildCurrentPsgPlaySequence();

  window.CONVERSATION_V2_PLAY_SEQUENCE =
    sequence;

  return sequence;
}


function inspectCurrentPsgPlaySequence() {
  var sequence =
    window.CONVERSATION_V2_PLAY_SEQUENCE ||
    refreshCurrentPsgPlaySequence();

  console.table(
    sequence.map(function(item) {
      return {
        turn: item.turnNumber,
        kind: item.kind,
        text: item.speechText,
        language: item.language
      };
    })
  );

  return sequence;
}


window.buildCurrentPsgPlaySequence =
  buildCurrentPsgPlaySequence;

window.refreshCurrentPsgPlaySequence =
  refreshCurrentPsgPlaySequence;

window.inspectCurrentPsgPlaySequence =
  inspectCurrentPsgPlaySequence;


// ============================================================================
// 🟦 BLOCK 5600: SHARED PLAY STATE / RATE / LOCALE
// ============================================================================

function getCurrentPsgPlayState() {
  if (!window.CONVERSATION_V2_PLAY) {
    window.CONVERSATION_V2_PLAY = {
      runId: 0,
      running: false,
      adapter: null
    };
  }

  return window.CONVERSATION_V2_PLAY;
}


function getCurrentPsgPlayRate() {
  var speedRange =
    document.getElementById(
      'speechSpeedRange'
    );

  var rate = speedRange
    ? Number(speedRange.value)
    : 1;

  return rate > 0
    ? rate
    : 1;
}


function getCurrentPsgPlayLocale(language) {
  var locales = {
    AR: 'ar-SA',
    EN: 'en-US',
    ES: 'es-ES',
    FR: 'fr-FR',
    HI: 'hi-IN',
    ID: 'id-ID',
    JA: 'ja-JP',
    KM: 'km-KH',
    KO: 'ko-KR',
    LO: 'lo-LA',
    MS: 'ms-MY',
    MY: 'my-MM',
    NE: 'ne-NP',
    PT: 'pt-PT',
    RU: 'ru-RU',
    TH: 'th-TH',
    TL: 'fil-PH',
    VI: 'vi-VN',
    'ZH-CN': 'zh-CN',
    'ZH-TW': 'zh-TW'
  };

  return locales[language] || 'en-US';
}


// ============================================================================
// 🟦 BLOCK 5650: NATIVE SPEECH LOOKUP
// ============================================================================

function getCurrentPsgNativeSpeech() {
  var capacitor = window.Capacitor;

  if (!capacitor) {
    return null;
  }

  var isNative =
    typeof capacitor.isNativePlatform ===
    'function'
      ? capacitor.isNativePlatform()
      : typeof capacitor.getPlatform ===
          'function' &&
        capacitor.getPlatform() !== 'web';

  if (!isNative) {
    return null;
  }

  if (
    capacitor.Plugins &&
    capacitor.Plugins.GongbooSpeech
  ) {
    return capacitor.Plugins.GongbooSpeech;
  }

  if (
    typeof capacitor.registerPlugin ===
    'function'
  ) {
    if (
      !window.CONVERSATION_V2_GONGBOO_SPEECH
    ) {
      window.CONVERSATION_V2_GONGBOO_SPEECH =
        capacitor.registerPlugin(
          'GongbooSpeech'
        );
    }

    return window.CONVERSATION_V2_GONGBOO_SPEECH;
  }

  return null;
}


// ============================================================================
// 🟦 BLOCK 5652: ANDROID CHROME PLATFORM DETECTOR
// Purpose: S26 Android Chrome only. APK is excluded first.
// ============================================================================

function isCurrentAndroidChrome_2() {
  var capacitor = window.Capacitor;

  var isNative =
    capacitor &&
    typeof capacitor.isNativePlatform ===
      'function' &&
    capacitor.isNativePlatform();

  if (isNative) {
    return false;
  }

  var userAgent =
    String(navigator.userAgent || '');

  return (
    /Android/i.test(userAgent) &&
    /Chrome\//i.test(userAgent) &&
    !/; wv\)/i.test(userAgent)
  );
}


// ============================================================================
// 🟦 BLOCK 5700: WEB WORD HIGHLIGHT FALLBACK
// ============================================================================

function startCurrentPsgWebWordFallback() {
  var data =
    window.CONVERSATION_V2_TTS_WORD_DATA;

  if (
    !data ||
    !data.words ||
    !data.words.length
  ) {
    return null;
  }

  var index = 0;

  var delay = Math.max(
    160,
    Math.round(
      340 / getCurrentPsgPlayRate()
    )
  );

  highlightCurrentTtsWordAt(
    Number(data.words[0].start)
  );

  return window.setInterval(function() {
    index += 1;

    if (index >= data.words.length) {
      return;
    }

    highlightCurrentTtsWordAt(
      Number(data.words[index].start)
    );
  }, delay);
}



// ============================================================================
// 🟦 BLOCK 5702: ANDROID CHROME PERSISTENT DIAGNOSTIC TRACE
// Purpose: Save S26 PLAY/MIC state before DevTools connection changes runtime.
// ============================================================================

var CONVERSATION_V2_ANDROID_TRACE_KEY_2 =
  'CONVERSATION_V2_ANDROID_TRACE_2';


function writeCurrentAndroidTrace_2(
  eventName,
  detail
) {
  if (!isCurrentAndroidChrome_2()) {
    return;
  }

  try {
    var entries = JSON.parse(
      localStorage.getItem(
        CONVERSATION_V2_ANDROID_TRACE_KEY_2
      ) || '[]'
    );

    entries.push({
      time: new Date().toISOString(),
      event: eventName,
      detail: detail || {}
    });

    if (entries.length > 80) {
      entries = entries.slice(-80);
    }

    localStorage.setItem(
      CONVERSATION_V2_ANDROID_TRACE_KEY_2,
      JSON.stringify(entries)
    );
  } catch (error) {
    // Diagnostics must never affect PLAY or MIC.
  }
}


function getCurrentAndroidTraceSnapshot_2() {
  var synthesis = window.speechSynthesis;
  var micState =
    window.CONVERSATION_V2_MIC || {};

  return {
    visible: document.visibilityState,
    focused: document.hasFocus(),
    row: Boolean(window.CONVERSATION_V2_ROW),
    cards: document.querySelectorAll(
      '.conversation-turn-card'
    ).length,
    sequence:
      typeof buildCurrentPsgPlaySequence ===
      'function'
        ? buildCurrentPsgPlaySequence().length
        : -1,
    tts: Boolean(synthesis),
    paused: synthesis ? synthesis.paused : null,
    pending: synthesis ? synthesis.pending : null,
    speaking: synthesis ? synthesis.speaking : null,
    voices: synthesis
      ? synthesis.getVoices().length
      : 0,
    micClass: Boolean(
      window.SpeechRecognition ||
      window.webkitSpeechRecognition
    ),
    micRunning: Boolean(micState.running)
  };
}


function installCurrentAndroidTrace_2() {
  if (!isCurrentAndroidChrome_2()) {
    return;
  }

  writeCurrentAndroidTrace_2(
    'boot',
    getCurrentAndroidTraceSnapshot_2()
  );

  window.addEventListener(
    'pageshow',
    function() {
      writeCurrentAndroidTrace_2(
        'pageshow',
        getCurrentAndroidTraceSnapshot_2()
      );
    }
  );

  document.addEventListener(
    'visibilitychange',
    function() {
      writeCurrentAndroidTrace_2(
        'visibilitychange',
        getCurrentAndroidTraceSnapshot_2()
      );
    }
  );

  document.addEventListener(
    'click',
    function(event) {
      var button =
        event.target.closest('button');

      if (!button) {
        return;
      }

      var watched =
        button.id === 'playButton' ||
        button.id ===
          'practiceStartStopButton';

      if (!watched) {
        return;
      }

      writeCurrentAndroidTrace_2(
        'tap:' + button.id,
        getCurrentAndroidTraceSnapshot_2()
      );

      window.setTimeout(function() {
        writeCurrentAndroidTrace_2(
          'after-0ms:' + button.id,
          getCurrentAndroidTraceSnapshot_2()
        );
      }, 0);

      window.setTimeout(function() {
        writeCurrentAndroidTrace_2(
          'after-1800ms:' + button.id,
          getCurrentAndroidTraceSnapshot_2()
        );
      }, 1800);
    },
    true
  );

  if (
    navigator.permissions &&
    typeof navigator.permissions.query ===
      'function'
  ) {
    navigator.permissions.query({
      name: 'microphone'
    }).then(
      function(permission) {
        writeCurrentAndroidTrace_2(
          'microphone-permission',
          { state: permission.state }
        );
      },
      function() {
        // Some Android Chrome versions do not expose it.
      }
    );
  }
}


installCurrentAndroidTrace_2();



// ============================================================================
// 🟦 BLOCK 5750: WEB PLAY ADAPTER
// ============================================================================

function createCurrentPsgWebPlayAdapter() {
  if (
    !window.speechSynthesis ||
    typeof SpeechSynthesisUtterance !==
      'function'
  ) {
    return null;
  }

  return {
    type: 'web',

    speak: function(item) {
      return new Promise(function(resolve, reject) {
        var settled = false;
        var fallbackTimer = null;
        var boundaryReceived = false;

        function clearFallback() {
          if (fallbackTimer !== null) {
            window.clearInterval(
              fallbackTimer
            );

            fallbackTimer = null;
          }
        }

        function finish(callback, value) {
          if (settled) {
            return;
          }

          settled = true;
          clearFallback();
          callback(value);
        }

        var utterance =
          new SpeechSynthesisUtterance(
            item.speechText
          );

        utterance.lang =
          getCurrentPsgPlayLocale(
            item.language
          );

        utterance.rate =
          getCurrentPsgPlayRate();

        utterance.onstart = function() {
          if (!boundaryReceived) {
            fallbackTimer =
              startCurrentPsgWebWordFallback();
          }
        };

        utterance.onboundary = function(event) {
          var charIndex =
            Number(event.charIndex);

          if (!Number.isInteger(charIndex)) {
            return;
          }

          boundaryReceived = true;
          clearFallback();

          highlightCurrentTtsWordAt(
            charIndex
          );
        };

        utterance.onend = function() {
          finish(resolve);
        };

        utterance.onerror = function(error) {
          finish(reject, error);
        };

        try {
          window.speechSynthesis.speak(
            utterance
          );

          window.setTimeout(function() {
            window.speechSynthesis.resume();
          }, 100);

        } catch (error) {
          finish(reject, error);
        }
      });
    },

    stop: function() {
      window.speechSynthesis.cancel();

      return Promise.resolve();
    }
  };
}



// ============================================================================
// 🟦 BLOCK 5752: ANDROID CHROME PLAY ADAPTER
// Purpose: S26 cold-start TTS recovery. PC and APK do not enter here.
// ============================================================================

function createCurrentPsgAndroidChromeAdapter_2() {
  var synthesis = window.speechSynthesis;

  if (
    !synthesis ||
    typeof SpeechSynthesisUtterance !==
      'function'
  ) {
    return null;
  }

  return {
    type: 'android-chrome',

    speak: function(item) {
      return new Promise(function(resolve, reject) {
        var settled = false;
        var attemptId = 0;
        var fallbackTimer = null;
        var startTimer = null;

        function clearTimers() {
          if (fallbackTimer !== null) {
            window.clearInterval(fallbackTimer);
            fallbackTimer = null;
          }

          if (startTimer !== null) {
            window.clearTimeout(startTimer);
            startTimer = null;
          }
        }

        function finish(callback, value) {
          if (settled) {
            return;
          }

          settled = true;
          attemptId += 1;
          clearTimers();
          callback(value);
        }

        function speakAttempt(retry) {
          var myAttempt = attemptId + 1;
          var started = false;

          attemptId = myAttempt;

          var utterance =
            new SpeechSynthesisUtterance(
              item.speechText
            );

          utterance.lang =
            getCurrentPsgPlayLocale(
              item.language
            );

          utterance.rate =
            getCurrentPsgPlayRate();

          utterance.onstart = function() {
            if (
              settled ||
              myAttempt !== attemptId
            ) {
              return;
            }

            started = true;

            if (startTimer !== null) {
              window.clearTimeout(startTimer);
              startTimer = null;
            }

            fallbackTimer =
              startCurrentPsgWebWordFallback();
          };

          utterance.onboundary = function(event) {
            if (
              settled ||
              myAttempt !== attemptId
            ) {
              return;
            }

            var charIndex =
              Number(event.charIndex);

            if (!Number.isInteger(charIndex)) {
              return;
            }

            if (fallbackTimer !== null) {
              window.clearInterval(fallbackTimer);
              fallbackTimer = null;
            }

            highlightCurrentTtsWordAt(charIndex);
          };

          utterance.onend = function() {
            if (
              !settled &&
              myAttempt === attemptId
            ) {
              finish(resolve);
            }
          };

          utterance.onerror = function(error) {
            if (
              settled ||
              myAttempt !== attemptId
            ) {
              return;
            }

            if (!started && !retry) {
              speakAttempt(true);
              return;
            }

            finish(reject, error);
          };

          try {
            synthesis.cancel();
            synthesis.resume();
            synthesis.speak(utterance);

            window.setTimeout(function() {
              if (
                !settled &&
                myAttempt === attemptId &&
                synthesis.paused
              ) {
                synthesis.resume();
              }
            }, 100);

            startTimer = window.setTimeout(
              function() {
                if (
                  !settled &&
                  myAttempt === attemptId &&
                  !started &&
                  !retry
                ) {
                  speakAttempt(true);
                }
              },
              1500
            );
          } catch (error) {
            finish(reject, error);
          }
        }

        speakAttempt(false);
      });
    },

    stop: function() {
      synthesis.cancel();
      synthesis.resume();

      return Promise.resolve();
    }
  };
}




// ============================================================================
// 🟦 BLOCK 5800: COMMON PLAY ADAPTER SELECTOR
// Purpose: Keep APK and PC paths unchanged; send only S26 Chrome to 5752.
// ============================================================================

function createCurrentPsgNativePlayAdapter() {
  var nativeSpeech =
    getCurrentPsgNativeSpeech();

  if (
    !nativeSpeech ||
    typeof nativeSpeech.speak !== 'function' ||
    typeof nativeSpeech.stopSpeaking !==
      'function'
  ) {
    return null;
  }

  return {
    type: 'android-native',

    speak: function(item) {
      return nativeSpeech.speak({
        text: item.speechText,
        language: getCurrentPsgPlayLocale(
          item.language
        ),
        rate: getCurrentPsgPlayRate()
      });
    },

    stop: function() {
      return nativeSpeech.stopSpeaking();
    }
  };
}


function getCurrentPsgBaseAdapter() {
  if (isCurrentAndroidChrome_2()) {
    return createCurrentPsgAndroidChromeAdapter_2();
  }

  var nativeAdapter =
    createCurrentPsgNativePlayAdapter();

  if (nativeAdapter) {
    return nativeAdapter;
  }

  // Existing PC Chrome path: unchanged.
  return createCurrentPsgWebPlayAdapter();
}



// ============================================================================
// 🟦 BLOCK 5850: PLAY STOP / CONTINUE NEXT TARGET
// ============================================================================

function stopCurrentPsgPlay() {
  var state = getCurrentPsgPlayState();

  state.runId += 1;
  state.running = false;

  var adapter = state.adapter;

  state.adapter = null;

  if (
    adapter &&
    typeof adapter.stop === 'function'
  ) {
    try {
      adapter.stop();
    } catch (error) {
      console.error(
        '[PLAY] Stop error:',
        error
      );
    }
  }

  renderCurrentPsgPlayButton();
}


window.stopCurrentPsgPlay =
  stopCurrentPsgPlay;

window.stopCurrentPsgWebPlay =
  stopCurrentPsgPlay;


function getCurrentContinueNextTargetId() {
  var currentRow =
    window.CONVERSATION_V2_ROW;

  var rows =
    getCurrentCategoryNavigationRows();

  if (!currentRow || !rows.length) {
    return null;
  }

  var currentIndex =
    rows.findIndex(function(row) {
      return Number(row.ID) ===
        Number(currentRow.ID);
    });

  if (
    currentIndex < 0 ||
    currentIndex >= rows.length - 1
  ) {
    return null;
  }

  return Number(
    rows[currentIndex + 1].ID
  );
}


// ============================================================================
// 🟦 BLOCK 5900: PLAY CONTINUE / SEQUENCE EXECUTION
// ============================================================================

async function continueCurrentPsgAfterFinish(
  completedRunId
) {
  var state =
    getCurrentPsgPlayState();

  if (
    state.running ||
    state.runId !== completedRunId
  ) {
    return;
  }

  var mode =
    getCurrentContinueMode();

  if (mode === 'repeat') {
    resetCurrentPlayVisualState();
    startCurrentPsgPlay();
    return;
  }

  if (mode !== 'next') {
    return;
  }

  var nextId =
    getCurrentContinueNextTargetId();

  if (!nextId) {
    return;
  }

  window.CONVERSATION_V2_ROLE_TARGET_TURN = 1;

  var loaded =
    await loadConversationById(
      nextId,
      { resume: false }
    );

  if (!loaded || state.running) {
    return;
  }

  resetCurrentPlayVisualState();
  startCurrentPsgPlay();
}


function speakCurrentPsgSequenceItem(
  sequence,
  index,
  runId
) {
  var state = getCurrentPsgPlayState();

  if (
    !state.running ||
    state.runId !== runId
  ) {
    return;
  }

  if (index >= sequence.length) {
    var continueMode =
      getCurrentContinueMode();

    if (
      continueMode === 'off' &&
      window.CONVERSATION_V2_LOOP_PLAY ===
      true
    ) {
      speakCurrentPsgSequenceItem(
        sequence,
        0,
        runId
      );

      return;
    }

    state.running = false;
    state.adapter = null;

    renderCurrentPsgPlayButton();

    continueCurrentPsgAfterFinish(runId);

    return;
  }

  var adapter = state.adapter;
  var item = sequence[index];

  if (!adapter) {
    state.running = false;

    renderCurrentPsgPlayButton();

    console.error(
      '[PLAY] No TTS adapter is available'
    );

    return;
  }

  adapter.speak(item).then(
    function() {
      speakCurrentPsgSequenceItem(
        sequence,
        index + 1,
        runId
      );
    },

    function(error) {
      if (state.runId !== runId) {
        return;
      }

      state.running = false;
      state.adapter = null;

      renderCurrentPsgPlayButton();

      console.error(
        '[PLAY] TTS error:',
        error
      );
    }
  );
}


// ============================================================================
// 🟦 BLOCK 5950: PLAY START / SPEAKING CARD CONNECTION
// ============================================================================

function startCurrentPsgPlay(
  skipStartSignal
) {
  var state =
    getCurrentPsgPlayState();

  if (state.running) {
    return;
  }

  if (!skipStartSignal) {
    if (isCurrentAndroidChrome_2()) {
  startCurrentPsgPlay(true);
  return;
}

    var startRunId =
      state.runId;

    playCurrentIStartSignal().then(
      function() {
        if (
          state.running ||
          state.runId !== startRunId
        ) {
          return;
        }

        startCurrentPsgPlay(true);
      }
    );

    return;
  }

  var sequence =
    refreshCurrentPsgPlaySequence();

  if (!sequence.length) {
    console.error(
      '[PLAY] No current PSG sentences'
    );

    return;
  }

  var adapter =
    getCurrentPsgPlayAdapter();

  if (!adapter) {
    console.error(
      '[PLAY] No native or web TTS is available'
    );

    return;
  }

  state.runId += 1;
  state.running = true;
  state.adapter = adapter;

  console.log(
    '[PLAY] Adapter:',
    adapter.type
  );

  renderCurrentPsgPlayButton();

  speakCurrentPsgSequenceItem(
    sequence,
    0,
    state.runId
  );
}


window.startCurrentPsgPlay =
  startCurrentPsgPlay;

window.startCurrentPsgWebPlay =
  startCurrentPsgPlay;


function clearCurrentTtsWordHighlight() {
  document
    .querySelectorAll(
      '.conversation-tts-word.is-tts-current-word'
    )
    .forEach(function(word) {
      word.classList.remove(
        'is-tts-current-word'
      );
    });

  window.CONVERSATION_V2_TTS_WORD_DATA =
    null;
}


function prepareCurrentTtsWordHighlight(
  item,
  card
) {
  clearCurrentTtsWordHighlight();

  if (!card || !item) {
    return;
  }

  var text =
    card.querySelector(
      '.conversation-turn-text'
    );

  if (!text) {
    return;
  }

  var displayText =
    String(text.textContent || '');

  var speechText =
    String(item.speechText || '');

  if (
    !displayText ||
    !speechText ||
    displayText !== speechText
  ) {
    return;
  }

  var fragment =
    document.createDocumentFragment();

  var words = [];
  var cursor = 0;
  var match;
  var wordPattern = /\S+/g;

  while (
    (match = wordPattern.exec(displayText)) !==
    null
  ) {
    if (match.index > cursor) {
      fragment.appendChild(
        document.createTextNode(
          displayText.slice(
            cursor,
            match.index
          )
        )
      );
    }

    var word =
      document.createElement('span');

    word.className =
      'conversation-tts-word';

    word.textContent =
      match[0];

    word.dataset.start =
      String(match.index);

    word.dataset.end =
      String(
        match.index + match[0].length
      );

    fragment.appendChild(word);

    words.push({
      element: word,
      start: match.index,
      end:
        match.index + match[0].length
    });

    cursor =
      match.index + match[0].length;
  }

  if (cursor < displayText.length) {
    fragment.appendChild(
      document.createTextNode(
        displayText.slice(cursor)
      )
    );
  }

  if (!words.length) {
    return;
  }

  text.replaceChildren(fragment);

  window.CONVERSATION_V2_TTS_WORD_DATA = {
    card: card,
    words: words
  };
}


function highlightCurrentTtsWordAt(
  charIndex
) {
  var data =
    window.CONVERSATION_V2_TTS_WORD_DATA;

  if (
    !data ||
    !Number.isInteger(charIndex)
  ) {
    return;
  }

  data.words.forEach(function(word) {
    var current =
      charIndex >= word.start &&
      charIndex < word.end;

    word.element.classList.toggle(
      'is-tts-current-word',
      current
    );
  });
}


function clearCurrentSpeakingCard() {
  document
    .querySelectorAll(
      '.conversation-turn-card.is-speaking'
    )
    .forEach(function(card) {
      card.classList.remove(
        'is-speaking'
      );
    });

  clearCurrentTtsWordHighlight();
}


function setCurrentSpeakingCard(item) {
  clearCurrentSpeakingCard();

  if (
    !item ||
    !item.turnNumber
  ) {
    return;
  }

  var card =
    document.querySelector(
      '.conversation-turn-card[data-turn="' +
      item.turnNumber +
      '"]'
    );

  if (!card) {
    return;
  }

  card.classList.add(
    'is-speaking'
  );

  prepareCurrentTtsWordHighlight(
    item,
    card
  );

  card.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  });
}


function getCurrentPsgPlayAdapter() {
  var baseAdapter =
    getCurrentPsgBaseAdapter();

  if (!baseAdapter) {
    return null;
  }

  return {
    type: baseAdapter.type,

    speak: function(item) {
      setCurrentSpeakingCard(item);

      return baseAdapter.speak(item);
    },

    stop: function() {
      clearCurrentSpeakingCard();

      return baseAdapter.stop();
    }
  };
}


function renderCurrentPsgPlayButton() {
  var button =
    document.getElementById(
      'playButton'
    );

  var state =
    getCurrentPsgPlayState();

  if (!state.running) {
    clearCurrentSpeakingCard();
  }

  if (!button) {
    return;
  }

  button.textContent =
    state.running
      ? 'STOP'
      : 'PLAY';

  button.setAttribute(
    'aria-pressed',
    String(state.running)
  );
}




// ============================================================================
// 🟩 6000 — MICROPHONE / PRONUNCIATION + ROLE PRACTICE / PRACTICE MODE
// ============================================================================


// ============================================================================
// 🟦 BLOCK 6000: MICROPHONE STATE
// ============================================================================

function getCurrentMicState() {
  if (!window.CONVERSATION_V2_MIC) {
    window.CONVERSATION_V2_MIC = {
      runId: 0,
      running: false,
      transcript: '',
      matches: []
    };
  }

  return window.CONVERSATION_V2_MIC;
}


// ============================================================================
// 🟦 BLOCK 6050: WEB SPEECH RECOGNITION CLASS / ENGINE STATE
// ============================================================================

var CurrentMicSpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


var _currentMicWebRecognition = null;
var _currentMicWebFinalizeTimer = null;
var _currentMicWebLastTranscript = '';
var _currentMicWebResolve = null;
var _currentMicWebReject = null;


// ============================================================================
// 🟦 BLOCK 6100: NATIVE MICROPHONE ADAPTER
// ============================================================================

function createCurrentMicNativeAdapter() {
  var nativeSpeech =
    getCurrentPsgNativeSpeech();

  if (
    !nativeSpeech ||
    typeof nativeSpeech.start !== 'function' ||
    typeof nativeSpeech.stop !== 'function'
  ) {
    return null;
  }

  return {
    type: 'android-native',

    start: function(options) {
      return nativeSpeech.start({
        language: options.language,
        onDevice: true,
        maxResults: options.maxResults || 3
      }).then(function(result) {
        return {
          matches:
            Array.isArray(result.matches)
              ? result.matches
              : []
        };
      });
    },

    stop: function() {
      return nativeSpeech.stop();
    }
  };
}


// ============================================================================
// 🟦 BLOCK 6150: WEB MICROPHONE DELAY
// ============================================================================

function getCurrentMicWebDelayMs() {
  var input =
    document.getElementById(
      'delayRange'
    );

  var seconds =
    Number(input ? input.value : 0.5);

  if (
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    seconds = 0.5;
  }

  return Math.max(
    500,
    seconds * 1000
  );
}



// ============================================================================
// 🟦 BLOCK 6152: ANDROID CHROME MICROPHONE ENGINE STATE
// Purpose: S26 recognition state is never shared with PC Chrome.
// ============================================================================

var CurrentMicAndroidChromeRecognition_2 =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

var _currentMicAndroidRecognition_2 = null;
var _currentMicAndroidFinalizeTimer_2 = null;
var _currentMicAndroidTranscript_2 = '';


function getCurrentMicAndroidDelayMs_2() {
  return getCurrentMicWebDelayMs();
}



// ============================================================================
// 🟦 BLOCK 6200: WEB MICROPHONE ADAPTER
// ============================================================================

function createCurrentMicWebAdapter() {
  if (!CurrentMicSpeechRecognition) {
    return null;
  }

  return {
    type: 'web-speech',

    start: function(options) {
      return new Promise(function(resolve, reject) {
        var recognition =
          new CurrentMicSpeechRecognition();

        _currentMicWebRecognition = recognition;
        _currentMicWebResolve = resolve;
        _currentMicWebReject = reject;
        _currentMicWebLastTranscript = '';

        function cleanup() {
          if (_currentMicWebFinalizeTimer) {
            clearTimeout(
              _currentMicWebFinalizeTimer
            );

            _currentMicWebFinalizeTimer = null;
          }

          try {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            recognition.abort();
          } catch (error) {
            // Ignore.
          }

          _currentMicWebRecognition = null;
          _currentMicWebResolve = null;
          _currentMicWebReject = null;
        }

        function finish() {
          var resolveFn =
            _currentMicWebResolve;

          var transcript =
            String(
              _currentMicWebLastTranscript || ''
            ).trim();

          cleanup();

          if (resolveFn) {
            resolveFn({
              matches:
                transcript
                  ? [transcript]
                  : []
            });
          }
        }

        function fail(error) {
          var rejectFn =
            _currentMicWebReject;

          cleanup();

          if (rejectFn) {
            rejectFn(error);
          }
        }

        recognition.lang =
          options.language || 'en-US';

        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.maxAlternatives =
          options.maxResults || 3;

        recognition.onresult = function(event) {
          var transcript = '';

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
                event.results[i][0].transcript +
                ' ';
            }
          }

          transcript = transcript.trim();

          if (!transcript) {
            return;
          }

          _currentMicWebLastTranscript =
            transcript;

          if (_currentMicWebFinalizeTimer) {
            clearTimeout(
              _currentMicWebFinalizeTimer
            );
          }

          _currentMicWebFinalizeTimer =
            setTimeout(
              function() {
                if (
                  _currentMicWebRecognition ===
                  recognition
                ) {
                  try {
                    recognition.stop();
                  } catch (error) {
                    // Ignore.
                  }
                }
              },
              getCurrentMicWebDelayMs()
            );
        };

        recognition.onerror = function(event) {
          if (
            event.error === 'no-speech' ||
            event.error === 'aborted'
          ) {
            finish();
            return;
          }

          if (
            event.error === 'not-allowed' ||
            event.error ===
              'service-not-allowed'
          ) {
            fail(
              new Error(
                'Microphone permission denied.'
              )
            );

            return;
          }

          fail(
            new Error(
              'Web speech error: ' +
              event.error
            )
          );
        };

        recognition.onend = function() {
          finish();
        };

        try {
          recognition.start();
        } catch (error) {
          fail(error);
        }
      });
    },

    stop: function() {
      if (_currentMicWebRecognition) {
        try {
          _currentMicWebRecognition.stop();
        } catch (error) {
          // Ignore.
        }
      }

      return Promise.resolve();
    }
  };
}


// ============================================================================
// 🟦 BLOCK 6202: ANDROID CHROME MICROPHONE ADAPTER
// Purpose: S26 only. Clean one-session recognition prevents stale mic sessions.
// ============================================================================

function createCurrentMicAndroidChromeAdapter_2() {
  if (!CurrentMicAndroidChromeRecognition_2) {
    return null;
  }

  return {
    type: 'android-chrome-speech',

    start: function(options) {
      return new Promise(function(resolve, reject) {
        if (_currentMicAndroidRecognition_2) {
          try {
            _currentMicAndroidRecognition_2.abort();
          } catch (error) {
            // Ignore stale recognition session.
          }
        }

        var recognition =
          new CurrentMicAndroidChromeRecognition_2();

        var settled = false;

        _currentMicAndroidRecognition_2 =
          recognition;

        _currentMicAndroidTranscript_2 = '';

        function cleanup() {
          if (_currentMicAndroidFinalizeTimer_2) {
            window.clearTimeout(
              _currentMicAndroidFinalizeTimer_2
            );

            _currentMicAndroidFinalizeTimer_2 =
              null;
          }

          recognition.onresult = null;
          recognition.onerror = null;
          recognition.onend = null;

          if (
            _currentMicAndroidRecognition_2 ===
            recognition
          ) {
            _currentMicAndroidRecognition_2 =
              null;
          }
        }

        function finish() {
          if (settled) {
            return;
          }

          settled = true;

          var transcript =
            String(
              _currentMicAndroidTranscript_2 || ''
            ).trim();

          cleanup();

          resolve({
            matches: transcript
              ? [transcript]
              : []
          });
        }

        function fail(error) {
          if (settled) {
            return;
          }

          settled = true;
          cleanup();
          reject(error);
        }

        recognition.lang =
          options.language || 'en-US';

        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.maxAlternatives =
          options.maxResults || 3;

        recognition.onresult = function(event) {
          var transcript = '';

          for (
            var i = event.resultIndex;
            i < event.results.length;
            i += 1
          ) {
            if (event.results[i][0]) {
              transcript +=
                event.results[i][0].transcript +
                ' ';
            }
          }

          transcript = transcript.trim();

          if (!transcript) {
            return;
          }

          _currentMicAndroidTranscript_2 =
            transcript;

          if (_currentMicAndroidFinalizeTimer_2) {
            window.clearTimeout(
              _currentMicAndroidFinalizeTimer_2
            );
          }

          _currentMicAndroidFinalizeTimer_2 =
            window.setTimeout(function() {
              try {
                recognition.stop();
              } catch (error) {
                // onend completes the session.
              }
            }, getCurrentMicAndroidDelayMs_2());
        };

        recognition.onerror = function(event) {
          if (
            event.error === 'no-speech' ||
            event.error === 'aborted'
          ) {
            finish();
            return;
          }

          fail(
            new Error(
              'Android Chrome mic error: ' +
              event.error
            )
          );
        };

        recognition.onend = function() {
          finish();
        };

        try {
          recognition.start();
        } catch (error) {
          fail(error);
        }
      });
    },

    stop: function() {
      if (_currentMicAndroidRecognition_2) {
        try {
          _currentMicAndroidRecognition_2.stop();
        } catch (error) {
          // Ignore.
        }
      }

      return Promise.resolve();
    }
  };
}




// ============================================================================
// 🟦 BLOCK 6250: COMMON MICROPHONE ADAPTER SELECTOR
// Purpose: Only S26 Chrome enters BLOCK 6202.
// ============================================================================

function getCurrentMicAdapter() {
  if (isCurrentAndroidChrome_2()) {
    return createCurrentMicAndroidChromeAdapter_2();
  }

  var nativeAdapter =
    createCurrentMicNativeAdapter();

  if (nativeAdapter) {
    return nativeAdapter;
  }

  // Existing PC Chrome path: unchanged.
  return createCurrentMicWebAdapter();
}


// ============================================================================
// 🟦 BLOCK 6300: MICROPHONE START API
// ============================================================================

function startCurrentMicRecognition(options) {
  var config = options || {};

  var adapter =
    getCurrentMicAdapter();

  var state =
    getCurrentMicState();

  if (!adapter) {
    return Promise.reject(
      new Error(
        'Microphone is unavailable on this device.'
      )
    );
  }

  var row =
    window.CONVERSATION_V2_ROW || {};

  var language =
    config.language ||
    getCurrentPsgPlayLocale(
      row.LNG || 'EN'
    );

  state.runId += 1;

  var runId = state.runId;

  state.running = true;
  state.transcript = '';
  state.matches = [];

  console.log(
    '[MIC] Adapter:',
    adapter.type,
    language
  );

  return adapter.start({
    language: language,
    maxResults: 3
  }).then(
    function(result) {
      if (state.runId !== runId) {
        return state;
      }

      state.running = false;

      state.matches =
        Array.isArray(result.matches)
          ? result.matches
          : [];

      state.transcript =
        String(
          state.matches[0] || ''
        ).trim();

      console.log(
        '[MIC] recognized:',
        state.transcript
      );

      return state;
    },

    function(error) {
      if (state.runId === runId) {
        state.running = false;
      }

      console.error(
        '[MIC] recognition failed:',
        error
      );

      throw error;
    }
  );
}


// ============================================================================
// 🟦 BLOCK 6350: MICROPHONE STOP API / PUBLIC CONNECTION
// ============================================================================

function stopCurrentMicRecognition() {
  var adapter =
    getCurrentMicAdapter();

  var state =
    getCurrentMicState();

  state.runId += 1;
  state.running = false;

  if (
    !adapter ||
    typeof adapter.stop !== 'function'
  ) {
    return Promise.resolve();
  }

  return adapter.stop();
}


window.startCurrentMicRecognition =
  startCurrentMicRecognition;

window.stopCurrentMicRecognition =
  stopCurrentMicRecognition;


// ============================================================================
// 🟦 BLOCK 6400: MICROPHONE TEXT NORMALIZATION / TARGET CARD
// ============================================================================

function normalizeCurrentMicText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\byou're\b/g, 'you are')
    .replace(/\bwe're\b/g, 'we are')
    .replace(/\bthey're\b/g, 'they are')
    .replace(/\bhe's\b/g, 'he is')
    .replace(/\bshe's\b/g, 'she is')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/n't\b/g, ' not')
    .replace(/'ll\b/g, ' will')
    .replace(/'ve\b/g, ' have')
    .replace(/'d\b/g, ' would')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function getCurrentMicTargetCard(turnNumber) {
  if (turnNumber) {
    return document.querySelector(
      '.conversation-turn-card[data-turn="' +
      Number(turnNumber) +
      '"]'
    );
  }

  return document.querySelector(
    '.conversation-turn-card.is-speaking'
  ) || document.querySelector(
    '.conversation-turn-card'
  );
}


// ============================================================================
// 🟦 BLOCK 6450: MICROPHONE PASS THRESHOLD / SIMILARITY
// ============================================================================

function getCurrentMicPassThreshold() {
  var input =
    document.getElementById(
      'passRange'
    );

  var percent =
    Number(input ? input.value : 1);

  return Math.max(
    0.01,
    Math.min(
      1,
      percent / 100
    )
  );
}


function getCurrentMicSimilarity(
  expected,
  spoken
) {
  var expectedWords =
    normalizeCurrentMicText(expected)
      .split(' ')
      .filter(Boolean);

  var spokenWords =
    normalizeCurrentMicText(spoken)
      .split(' ')
      .filter(Boolean);

  var matchedCount =
    expectedWords.filter(function(word) {
      return spokenWords.indexOf(word) >= 0;
    }).length;

  if (!expectedWords.length) {
    return 0;
  }

  return matchedCount /
    expectedWords.length;
}


// ============================================================================
// 🟦 BLOCK 6500: MICROPHONE WORD MATCH RENDER
// ============================================================================

function renderCurrentMicWordMatches(
  card,
  spoken
) {
  if (!card) {
    return;
  }

  var text =
    card.querySelector(
      '.conversation-turn-text'
    );

  if (!text) {
    return;
  }

  var originalText =
    text.textContent;

  var spokenWords =
    normalizeCurrentMicText(spoken)
      .split(' ')
      .filter(Boolean);

  var fragment =
    document.createDocumentFragment();

  originalText
    .split(/(\s+)/)
    .forEach(function(token) {
      if (!token) {
        return;
      }

      if (/^\s+$/.test(token)) {
        fragment.appendChild(
          document.createTextNode(token)
        );

        return;
      }

      var tokenWords =
        normalizeCurrentMicText(token)
          .split(' ')
          .filter(Boolean);

      var matched =
        tokenWords.length > 0 &&
        tokenWords.every(function(word) {
          return spokenWords.indexOf(word) >= 0;
        });

      if (!matched) {
        fragment.appendChild(
          document.createTextNode(token)
        );

        return;
      }

      var mark =
        document.createElement('mark');

      mark.className =
        'conversation-mic-word-match';

      mark.textContent = token;

      fragment.appendChild(mark);
    });

  text.replaceChildren(fragment);
}


// ============================================================================
// 🟦 BLOCK 6550: MICROPHONE CHECK RESULT
// ============================================================================

function showCurrentMicCheckResult(
  card,
  passed,
  score,
  spoken
) {
  if (!card) {
    return;
  }

  card.classList.remove(
    'is-mic-pass',
    'is-mic-retry'
  );

  card.classList.add(
    passed
      ? 'is-mic-pass'
      : 'is-mic-retry'
  );

  renderCurrentMicWordMatches(
    card,
    spoken
  );

  var oldResult =
    card.querySelector(
      '.conversation-mic-result'
    );

  if (oldResult) {
    oldResult.remove();
  }

  var result =
    document.createElement('div');

  result.className =
    'conversation-mic-result';

  result.textContent =
    (
      passed
        ? 'PASS '
        : 'RETRY '
    ) +
    Math.round(score * 100) +
    '%';

  card.appendChild(result);

  console.log(
    '[MIC CHECK]',
    passed ? 'PASS' : 'RETRY',
    Math.round(score * 100) + '%',
    spoken
  );
}


// ============================================================================
// 🟦 BLOCK 6600: MICROPHONE ANSWER EVALUATION
// ============================================================================

function evaluateCurrentMicAnswer(options) {
  var config =
    options || {};

  var card =
    getCurrentMicTargetCard(
      config.turnNumber
    );

  var expected =
    card
      ? card.querySelector(
          '.conversation-turn-text'
        ).textContent
      : '';

  var state =
    getCurrentMicState();

  var spoken =
    state.transcript;

  var score =
    getCurrentMicSimilarity(
      expected,
      spoken
    );

  var passed =
    score >=
    getCurrentMicPassThreshold();

  showCurrentMicCheckResult(
    card,
    passed,
    score,
    spoken
  );

  return {
    passed: passed,
    score: score,
    expected: expected,
    spoken: spoken
  };
}


function startAndCheckCurrentMicAnswer(
  options
) {
  var config =
    options || {};

  return startCurrentMicRecognition(
    config
  ).then(function() {
    return evaluateCurrentMicAnswer(
      config
    );
  });
}


window.evaluateCurrentMicAnswer =
  evaluateCurrentMicAnswer;

window.startAndCheckCurrentMicAnswer =
  startAndCheckCurrentMicAnswer;


// ============================================================================
// 🟦 BLOCK 6650: ROLE TARGET CARD / TURN SELECTION
// ============================================================================

function getCurrentRoleTargetCards() {
  return Array.from(
    document.querySelectorAll(
      '#conversationTurns .conversation-turn-card'
    )
  );
}


function selectCurrentRoleTurn(turnNumber) {
  var cards =
    getCurrentRoleTargetCards();

  var target =
    cards.find(function(card) {
      return Number(card.dataset.turn) ===
        Number(turnNumber);
    });

  if (!target) {
    return null;
  }

  cards.forEach(function(card) {
    card.classList.remove(
      'is-role-target'
    );
  });

  target.classList.add(
    'is-role-target'
  );

  window.CONVERSATION_V2_ROLE_TARGET_TURN =
    Number(target.dataset.turn);

  return target;
}


// ============================================================================
// 🟦 BLOCK 6700: CURRENT ROLE TARGET LOOKUP
// ============================================================================

function getCurrentRoleTargetTurn() {
  var yellowCard =
    document.querySelector(
      '#conversationTurns ' +
      '.conversation-turn-card.is-role-target'
    );

  var yellowTurn =
    Number(
      yellowCard &&
      yellowCard.dataset.turn
    );

  if (yellowTurn > 0) {
    window.CONVERSATION_V2_ROLE_TARGET_TURN =
      yellowTurn;

    return yellowTurn;
  }

  return Number(
    window.CONVERSATION_V2_ROLE_TARGET_TURN ||
    1
  );
}


function getCurrentRoleTargetConversationId() {
  var row =
    window.CONVERSATION_V2_ROW;

  return row && row.ID
    ? String(row.ID)
    : '';
}


// ============================================================================
// 🟦 BLOCK 6750: ROLE TURN SELECTION INSTALLATION
// ============================================================================

function installCurrentRoleTurnSelection() {
  var container =
    document.getElementById(
      'conversationTurns'
    );

  if (!container) {
    return;
  }

  document.addEventListener(
    'click',
    function(event) {
      var card =
        event.target &&
        event.target.closest
          ? event.target.closest(
              '#conversationTurns ' +
              '.conversation-turn-card'
            )
          : null;

      if (
        !card ||
        !container.contains(card)
      ) {
        return;
      }

      selectCurrentRoleTurn(
        card.dataset.turn
      );
    },
    true
  );

  var applyDefaultTarget = function() {
    var cards =
      container.querySelectorAll(
        '.conversation-turn-card'
      );

    if (!cards.length) {
      return;
    }

    var selectedCard =
      container.querySelector(
        '.conversation-turn-card.is-role-target'
      );

    if (selectedCard) {
      window.CONVERSATION_V2_ROLE_TARGET_TURN =
        Number(
          selectedCard.dataset.turn
        );

      return;
    }

    selectCurrentRoleTurn(
      window.CONVERSATION_V2_ROLE_TARGET_TURN ||
      cards[0].dataset.turn
    );
  };

  new MutationObserver(
    applyDefaultTarget
  ).observe(
    container,
    { childList: true }
  );

  applyDefaultTarget();
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installCurrentRoleTurnSelection,
    { once: true }
  );
} else {
  installCurrentRoleTurnSelection();
}


window.selectCurrentRoleTurn =
  selectCurrentRoleTurn;

window.getCurrentRoleTargetTurn =
  getCurrentRoleTargetTurn;


// ============================================================================
// 🟦 BLOCK 6800: PRACTICE STATE / TYPE / DELAY
// ============================================================================

function getCurrentRolePlayState() {
  if (!window.CONVERSATION_V2_ROLE_PLAY) {
    window.CONVERSATION_V2_ROLE_PLAY = {
      running: false,
      startTurn: 1,
      currentTurn: 1,
      adapter: null,
      continueToken: 0
    };
  }

  return window.CONVERSATION_V2_ROLE_PLAY;
}


function getCurrentPracticeType() {
  return window.CONVERSATION_V2_PRACTICE_TYPE ||
    'role-play';
}


function getCurrentRolePlayDelay() {
  var input =
    document.getElementById(
      'delayRange'
    );

  return Math.max(
    500,
    Number(
      input ? input.value : 0.5
    ) * 1000
  );
}


// ============================================================================
// 🟦 BLOCK 6850: PRACTICE RESULT RESET
// ============================================================================

function resetCurrentRolePlayResults() {
  document
    .querySelectorAll(
      '.conversation-turn-card'
    )
    .forEach(function(card) {
      card.classList.remove(
        'is-mic-pass',
        'is-mic-retry',
        'is-speaking',
        'is-role-target'
      );

      var result =
        card.querySelector(
          '.conversation-mic-result'
        );

      if (result) {
        result.remove();
      }
    });
}


// ============================================================================
// 🟦 BLOCK 6900: PRACTICE CONTROL RENDER
// ============================================================================

function renderCurrentPracticeControls() {
  var orderButton =
    document.getElementById(
      'playModeToggleButton'
    );

  var startButton =
    document.getElementById(
      'practiceStartStopButton'
    );

  var typeButton =
    document.getElementById(
      'practiceModeToggleButton'
    );

  var state =
    getCurrentRolePlayState();

  var followUp =
    getCurrentPracticeType() ===
    'follow-up';

  if (orderButton) {
    orderButton.textContent =
      window.CONVERSATION_V2_PLAY_MODE ===
      'i-start'
        ? 'I FIRST'
        : 'COMPUTER';

    orderButton.disabled =
      state.running || followUp;

    orderButton.setAttribute(
      'aria-pressed',
      String(
        window.CONVERSATION_V2_PLAY_MODE ===
        'i-start'
      )
    );
  }

  if (startButton) {
    startButton.disabled = false;

    startButton.textContent =
      state.running
        ? 'STOP'
        : 'START';

    startButton.setAttribute(
      'aria-pressed',
      String(state.running)
    );
  }

  if (typeButton) {
    typeButton.textContent =
      followUp
        ? 'FOLLOW UP'
        : 'ROLE PLAY';

    typeButton.disabled =
      state.running;

    typeButton.setAttribute(
      'aria-pressed',
      String(followUp)
    );
  }
}


// ============================================================================
// 🟦 BLOCK 6950: USER TURN / NEXT PRACTICE TARGET
// ============================================================================

function isCurrentRolePlayUserTurn(
  turnNumber
) {
  var state =
    getCurrentRolePlayState();

  var offset =
    Number(turnNumber) -
    Number(state.startTurn);

  return window.CONVERSATION_V2_PLAY_MODE ===
    'i-start'
      ? offset % 2 === 0
      : offset % 2 !== 0;
}


function getCurrentPracticeContinueNextTargetId() {
  var currentRow =
    window.CONVERSATION_V2_ROW;

  var rows =
    getCurrentCategoryNavigationRows();

  if (!currentRow || !rows.length) {
    return null;
  }

  var currentIndex =
    rows.findIndex(function(row) {
      return Number(row.ID) ===
        Number(currentRow.ID);
    });

  if (
    currentIndex < 0 ||
    currentIndex >= rows.length - 1
  ) {
    return null;
  }

  return Number(
    rows[currentIndex + 1].ID
  );
}


// ============================================================================
// 🟩 7000 — PRACTICE EXECUTION / CONTINUE CONTROL
// ============================================================================


// ============================================================================
// 🟦 BLOCK 7000: ROLE PLAY STOP
// ============================================================================

function stopCurrentRolePlay() {
  var state =
    getCurrentRolePlayState();

  state.continueToken += 1;
  state.running = false;

  if (
    state.adapter &&
    typeof state.adapter.stop === 'function'
  ) {
    state.adapter.stop();
  }

  state.adapter = null;

  stopCurrentMicRecognition();
  clearCurrentSpeakingCard();

  renderCurrentPracticeControls();
}


// ============================================================================
// 🟦 BLOCK 7050: ROLE PLAY FINISH / CONTINUE
// ============================================================================

function finishCurrentRolePlay() {
  var state =
    getCurrentRolePlayState();

  stopCurrentRolePlay();

  document
    .querySelectorAll(
      '.conversation-turn-card.is-role-target'
    )
    .forEach(function(card) {
      card.classList.remove(
        'is-role-target'
      );
    });

  var continueToken =
    state.continueToken;

  var continueMode =
    getCurrentContinueMode();

  if (continueMode === 'repeat') {
    window.setTimeout(function() {
      if (
        state.continueToken !==
          continueToken ||
        state.running
      ) {
        return;
      }

      startCurrentRolePlay();
    }, getCurrentRolePlayDelay());

    return;
  }

  if (continueMode !== 'next') {
    return;
  }

  var nextId =
    getCurrentPracticeContinueNextTargetId();

  if (!nextId) {
    return;
  }

  window.CONVERSATION_V2_ROLE_TARGET_TURN =
    1;

  loadConversationById(
    nextId,
    { resume: false }
  ).then(function(loaded) {
    if (!loaded || state.running) {
      return;
    }

    startCurrentRolePlay();
  });
}


// ============================================================================
// 🟦 BLOCK 7100: PRACTICE RETRY / LISTEN
// ============================================================================

function retryCurrentPracticeTurn() {
  window.setTimeout(
    runCurrentPracticeTurn,
    getCurrentRolePlayDelay()
  );
}


function listenCurrentPracticeTurn(
  state
) {
  startAndCheckCurrentMicAnswer({
    turnNumber: state.currentTurn,
    language: 'en-US'
  }).then(function(result) {
    if (!state.running) {
      return;
    }

    if (result.passed) {
      state.currentTurn += 1;
      runCurrentPracticeTurn();
      return;
    }

    retryCurrentPracticeTurn();

  }).catch(function(error) {
    console.warn(
      '[PRACTICE] MIC retry:',
      error
    );

    if (state.running) {
      retryCurrentPracticeTurn();
    }
  });
}


// ============================================================================
// 🟦 BLOCK 7150: PRACTICE SPEAK TURN
// ============================================================================

function speakCurrentPracticeTurn(
  state,
  text,
  followUp
) {
  state.adapter.speak({
    speechText: text.textContent,
    language: 'EN',
    turnNumber: state.currentTurn
  }).then(function() {
    if (!state.running) {
      return;
    }

    if (followUp) {
      listenCurrentPracticeTurn(
        state
      );

      return;
    }

    state.currentTurn += 1;

    runCurrentPracticeTurn();

  }, function(error) {
    console.error(
      '[PRACTICE] TTS failed:',
      error
    );

    stopCurrentRolePlay();
  });
}


// ============================================================================
// 🟦 BLOCK 7200: PRACTICE TURN EXECUTION
// ============================================================================

function runCurrentPracticeTurn() {
  var state =
    getCurrentRolePlayState();

  if (!state.running) {
    return;
  }

  var card =
    getCurrentMicTargetCard(
      state.currentTurn
    );

  if (!card) {
    finishCurrentRolePlay();
    return;
  }

  var text =
    card.querySelector(
      '.conversation-turn-text'
    );

  if (!text) {
    finishCurrentRolePlay();
    return;
  }

  card.classList.remove(
    'is-role-target'
  );

  setCurrentSpeakingCard({
    turnNumber: state.currentTurn
  });

  var followUp =
    getCurrentPracticeType() ===
    'follow-up';

  if (followUp) {
    speakCurrentPracticeTurn(
      state,
      text,
      true
    );

    return;
  }

  if (
    isCurrentRolePlayUserTurn(
      state.currentTurn
    )
  ) {
    listenCurrentPracticeTurn(
      state
    );

    return;
  }

  speakCurrentPracticeTurn(
    state,
    text,
    false
  );
}


// ============================================================================
// 🟦 BLOCK 7250: ROLE PLAY START
// ============================================================================

function startCurrentRolePlay(
  skipStartSignal
) {
  var state =
    getCurrentRolePlayState();

  if (state.running) {
    return;
  }

  if (!skipStartSignal) {
    var signalToken =
      state.continueToken;

    playCurrentIStartSignal().then(
      function() {
        if (
          state.running ||
          state.continueToken !==
            signalToken
        ) {
          return;
        }

        startCurrentRolePlay(true);
      }
    );

    return;
  }

  state.continueToken += 1;

  state.startTurn =
    getCurrentRoleTargetTurn();

  resetCurrentRolePlayResults();

  state.running = true;

  state.currentTurn =
    state.startTurn;

  state.adapter =
    getCurrentPsgPlayAdapter();

  if (!state.adapter) {
    stopCurrentRolePlay();
    return;
  }

  renderCurrentPracticeControls();

  runCurrentPracticeTurn();
}


// ============================================================================
// 🟦 BLOCK 7300: PRACTICE BUTTON INSTALLATION
// ============================================================================

function installCurrentRolePlayButton() {
  var orderButton =
    document.getElementById(
      'playModeToggleButton'
    );

  var startButton =
    document.getElementById(
      'practiceStartStopButton'
    );

  var typeButton =
    document.getElementById(
      'practiceModeToggleButton'
    );

  if (!window.CONVERSATION_V2_PLAY_MODE) {
    window.CONVERSATION_V2_PLAY_MODE =
      'computer';
  }

  if (orderButton) {
    orderButton.onclick = function() {
      if (
        getCurrentRolePlayState().running ||
        getCurrentPracticeType() ===
        'follow-up'
      ) {
        return;
      }

      window.CONVERSATION_V2_PLAY_MODE =
        window.CONVERSATION_V2_PLAY_MODE ===
        'computer'
          ? 'i-start'
          : 'computer';

      renderCurrentPracticeControls();
    };
  }

  if (typeButton) {
    typeButton.onclick = function() {
      if (
        getCurrentRolePlayState().running
      ) {
        return;
      }

      window.CONVERSATION_V2_PRACTICE_TYPE =
        getCurrentPracticeType() ===
        'role-play'
          ? 'follow-up'
          : 'role-play';

      renderCurrentPracticeControls();
    };
  }

  if (startButton) {
    startButton.onclick = function() {
      if (
        getCurrentRolePlayState().running
      ) {
        stopCurrentRolePlay();
        return;
      }

      startCurrentRolePlay();
    };
  }

  renderCurrentPracticeControls();
}


// ============================================================================
// 🟦 BLOCK 7350: PRACTICE BOOT / PUBLIC API
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installCurrentRolePlayButton,
    { once: true }
  );
} else {
  installCurrentRolePlayButton();
}


window.startCurrentRolePlay =
  startCurrentRolePlay;

window.stopCurrentRolePlay =
  stopCurrentRolePlay;


// ============================================================================
// 🟦 BLOCK 7400: CONTINUE MODE STATE / RENDER
// ============================================================================

function getCurrentContinueMode() {
  return window.CONVERSATION_V2_CONTINUE_MODE ||
    'off';
}


function renderCurrentContinueMode() {
  var button =
    document.getElementById(
      'continueNextButton'
    );

  if (!button) {
    return;
  }

  var mode =
    getCurrentContinueMode();

  button.textContent =
    mode === 'repeat'
      ? 'CONTINUE: REPEAT'
      : mode === 'next'
        ? 'CONTINUE: NEXT'
        : 'CONTINUE: OFF';

  button.setAttribute(
    'aria-pressed',
    String(mode !== 'off')
  );
}


// ============================================================================
// 🟦 BLOCK 7450: CONTINUE MODE BUTTON INSTALLATION
// ============================================================================

function installCurrentContinueModeButton() {
  var button =
    document.getElementById(
      'continueNextButton'
    );

  if (!button) {
    return;
  }

  button.onclick = function() {
    var mode =
      getCurrentContinueMode();

    window.CONVERSATION_V2_CONTINUE_MODE =
      mode === 'off'
        ? 'repeat'
        : mode === 'repeat'
          ? 'next'
          : 'off';

    renderCurrentContinueMode();
  };

  renderCurrentContinueMode();
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installCurrentContinueModeButton,
    { once: true }
  );
} else {
  installCurrentContinueModeButton();
}


// ============================================================================
// 🟦 BLOCK 7500: PLAY / EXTERNAL STOP VISUAL RESET
// ============================================================================

function resetCurrentPlayVisualState() {
  resetCurrentRolePlayResults();

  document
    .querySelectorAll(
      '.conversation-turn-card'
    )
    .forEach(function(card) {
      card.classList.remove(
        'is-speaking',
        'is-role-target'
      );
    });
}


function stopCurrentConversationActivity() {
  stopCurrentPsgPlay();
  stopCurrentRolePlay();
  stopCurrentMicRecognition();

  closeConversationMenus();
}


// ============================================================================
// 🟦 BLOCK 7550: PLAY / EXTERNAL STOP BUTTON CONNECTION
// ============================================================================

function installCurrentPsgPlayButton() {
  var playButton =
    document.getElementById(
      'playButton'
    );

  var stopButton =
    document.getElementById(
      'stopButton'
    );

  var playMenuPanel =
    document.getElementById(
      'playMenuPanel'
    );

  if (!playButton) {
    return;
  }

  renderCurrentPsgPlayButton();

  playButton.onclick = function() {
    var state =
      getCurrentPsgPlayState();

    if (state.running) {
      return;
    }

    if (
      playMenuPanel &&
      !playMenuPanel.hidden
    ) {
      return;
    }

    resetCurrentPlayVisualState();

    startCurrentPsgPlay();
  };

  if (stopButton) {
    stopButton.onclick = function() {
      stopCurrentConversationActivity();
    };
  }
}


// ============================================================================
// 🟦 BLOCK 7600: PLAY BUTTON BOOT
// ============================================================================

function bootCurrentPsgPlayButton() {
  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      installCurrentPsgPlayButton,
      { once: true }
    );

    return;
  }

  installCurrentPsgPlayButton();
}


bootCurrentPsgPlayButton();



// ============================================================================
// 🟩 8000 — CHUNK / SIGNAL / SETTINGS / EXTERNAL / KEYBOARD
// ============================================================================


// ============================================================================
// 🟦 BLOCK 8000: SELECTED CHUNK STATE / PARSING
// ============================================================================

function getCurrentSelectedChunkState() {
  if (!window.CONVERSATION_V2_SELECTED_CHUNK) {
    window.CONVERSATION_V2_SELECTED_CHUNK = {
      open: false
    };
  }

  return window.CONVERSATION_V2_SELECTED_CHUNK;
}


function parseCurrentTurnChunks(helpText) {
  var chunks = {};

  String(helpText || '')
    .split('||')
    .map(function(part) {
      return part.trim();
    })
    .filter(Boolean)
    .forEach(function(part) {
      var match = part.match(
        /^T(\d+)\s*=\s*(.+)$/i
      );

      if (!match) {
        return;
      }

      chunks[Number(match[1])] =
        match[2]
          .split('|')
          .map(function(item) {
            return item.trim();
          })
          .filter(Boolean);
    });

  return chunks;
}


// ============================================================================
// 🟦 BLOCK 8050: SELECTED CHUNK RENDER
// ============================================================================

function clearCurrentSelectedChunks() {
  document
    .querySelectorAll(
      '.conversation-selected-chunks'
    )
    .forEach(function(element) {
      element.remove();
    });
}


function renderCurrentSelectedChunks() {
  var state =
    getCurrentSelectedChunkState();

  clearCurrentSelectedChunks();

  if (!state.open) {
    return;
  }

  var turnNumber =
    getCurrentRoleTargetTurn();

  var card =
    document.querySelector(
      '.conversation-turn-card[data-turn="' +
      turnNumber +
      '"]'
    );

  if (!card) {
    return;
  }

  var chunks =
    parseCurrentTurnChunks(
      window.CONVERSATION_V2_SECONDARY_ROW?.HELP
    );

  var items =
    chunks[turnNumber];

  if (!items || !items.length) {
    return;
  }

  var container =
    document.createElement('div');

  container.className =
    'conversation-selected-chunks';

  var line =
    document.createElement('div');

  line.className =
    'conversation-selected-chunk-line';

  var title =
    document.createElement('strong');

  title.textContent = 'CHUNK:';

  var content =
    document.createElement('span');

  content.textContent =
    items.join(' · ');

  line.appendChild(title);
  line.appendChild(content);
  container.appendChild(line);
  card.appendChild(container);
}


// ============================================================================
// 🟦 BLOCK 8100: CHUNK BUTTON STATE
// ============================================================================

function renderCurrentChunkButton() {
  var button =
    document.getElementById(
      'chunkButton'
    );

  if (!button) {
    return;
  }

  var state =
    getCurrentSelectedChunkState();

  button.textContent =
    state.open
      ? 'CHUNK ON'
      : 'CHUNK';

  button.setAttribute(
    'aria-pressed',
    String(state.open)
  );
}


// ============================================================================
// 🟦 BLOCK 8150: CHUNK VIEW INSTALLATION
// ============================================================================

function installCurrentSelectedChunkView() {
  var button =
    document.getElementById(
      'chunkButton'
    );

  var turns =
    document.getElementById(
      'conversationTurns'
    );

  if (button) {
    button.onclick = function() {
      var state =
        getCurrentSelectedChunkState();

      state.open = !state.open;

      renderCurrentChunkButton();
      renderCurrentSelectedChunks();
    };
  }

  if (turns) {
    turns.addEventListener(
      'click',
      function() {
        window.setTimeout(
          renderCurrentSelectedChunks,
          0
        );
      }
    );

    new MutationObserver(
      function() {
        renderCurrentSelectedChunks();
      }
    ).observe(
      turns,
      { childList: true }
    );
  }

  [
    'primaryLanguageSelect',
    'secondaryLanguageSelect'
  ].forEach(function(id) {
    var select =
      document.getElementById(id);

    if (!select) {
      return;
    }

    select.addEventListener(
      'change',
      function() {
        window.setTimeout(
          renderCurrentSelectedChunks,
          300
        );
      }
    );
  });

  renderCurrentChunkButton();
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installCurrentSelectedChunkView,
    { once: true }
  );
} else {
  installCurrentSelectedChunkView();
}


// ============================================================================
// 🟦 BLOCK 8200: I FIRST SIGNAL CUE
// ============================================================================

function playCurrentIStartSignal() {
  return new Promise(function(resolve) {
    var AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      window.setTimeout(resolve, 180);
      return;
    }

    var context =
      new AudioContextClass();

    var oscillator =
      context.createOscillator();

    var gain =
      context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;

    gain.gain.setValueAtTime(
      0.0001,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.12,
      context.currentTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.16
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();

    oscillator.stop(
      context.currentTime + 0.17
    );

    oscillator.onended = function() {
      context.close().finally(resolve);
    };
  });
}


function getCurrentIStartSignalState() {
  if (!window.CONVERSATION_V2_I_START_SIGNAL) {
    window.CONVERSATION_V2_I_START_SIGNAL = {
      pending: false
    };
  }

  return window.CONVERSATION_V2_I_START_SIGNAL;
}


// ============================================================================
// 🟦 BLOCK 8250: I FIRST SIGNAL INSTALLATION
// ============================================================================

function installCurrentIStartSignal() {
  var startButton =
    document.getElementById(
      'practiceStartStopButton'
    );

  if (!startButton) {
    return;
  }

  startButton.addEventListener(
    'click',
    function(event) {
      var roleState =
        getCurrentRolePlayState();

      var iStart =
        window.CONVERSATION_V2_PLAY_MODE ===
        'i-start';

      var rolePlay =
        getCurrentPracticeType() ===
        'role-play';

      var signalState =
        getCurrentIStartSignalState();

      if (
        roleState.running ||
        !iStart ||
        !rolePlay ||
        signalState.pending
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      signalState.pending = true;

      playCurrentIStartSignal().then(
        function() {
          signalState.pending = false;

          if (
            !getCurrentRolePlayState().running
          ) {
            startCurrentRolePlay(true);
          }
        },

        function() {
          signalState.pending = false;
          startCurrentRolePlay(true);
        }
      );
    },
    true
  );
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installCurrentIStartSignal,
    { once: true }
  );
} else {
  installCurrentIStartSignal();
}


// ============================================================================
// 🟦 BLOCK 8300: LOCAL SETTINGS READ / SAVE
// ============================================================================

const CONVERSATION_V2_SETTINGS_KEY =
  'gongbooConversationV2SettingsV2';


function getConversationSettings() {
  try {
    var saved =
      localStorage.getItem(
        CONVERSATION_V2_SETTINGS_KEY
      );

    return saved
      ? JSON.parse(saved)
      : {};

  } catch (error) {
    console.warn(
      '[CONVERSATION V2] Settings read failed:',
      error
    );

    return {};
  }
}


function saveConversationSettings() {
  var settings = {
    pass:
      document.getElementById(
        'passRange'
      )?.value || '0',

    delay:
      document.getElementById(
        'delayRange'
      )?.value || '0.5',

    speed:
      document.getElementById(
        'speechSpeedRange'
      )?.value || '1',

    primaryLanguage:
      document.getElementById(
        'primaryLanguageSelect'
      )?.value || 'EN',

    secondaryLanguage:
      document.getElementById(
        'secondaryLanguageSelect'
      )?.value || 'NONE',

    loop:
      window.CONVERSATION_V2_LOOP_PLAY ===
      true,

    chunk:
      getCurrentSelectedChunkState().open ===
      true,

    playMode:
      window.CONVERSATION_V2_PLAY_MODE ||
      'computer',

    practiceType:
      getCurrentPracticeType(),

    continueMode:
      getCurrentContinueMode()
  };

  try {
    localStorage.setItem(
      CONVERSATION_V2_SETTINGS_KEY,
      JSON.stringify(settings)
    );

  } catch (error) {
    console.warn(
      '[CONVERSATION V2] Settings save failed:',
      error
    );
  }
}


// ============================================================================
// 🟦 BLOCK 8350: SETTINGS SELECT RESTORE
// ============================================================================

function restoreConversationSelectValue(
  selectId,
  value
) {
  var select =
    document.getElementById(selectId);

  if (!select || !value) {
    return;
  }

  var exists =
    Array.from(select.options).some(
      function(option) {
        return option.value === value;
      }
    );

  if (exists) {
    select.value = value;
  }
}


// ============================================================================
// 🟦 BLOCK 8400: SETTINGS RESTORE
// ============================================================================

function restoreConversationSettings() {
  var settings =
    getConversationSettings();

  [
    {
      inputId: 'passRange',
      outputId: 'passValue',
      value: settings.pass,
      suffix: '%'
    },
    {
      inputId: 'delayRange',
      outputId: 'delayValue',
      value: settings.delay,
      suffix: 's'
    },
    {
      inputId: 'speechSpeedRange',
      outputId: '',
      value: settings.speed,
      suffix: ''
    }
  ].forEach(function(item) {
    var input =
      document.getElementById(
        item.inputId
      );

    if (
      !input ||
      item.value === undefined ||
      item.value === null
    ) {
      return;
    }

    input.value = item.value;

    if (item.outputId) {
      updatePlayRangeValue(
        item.inputId,
        item.outputId,
        item.suffix
      );
    }
  });

  restoreConversationSelectValue(
    'primaryLanguageSelect',
    settings.primaryLanguage
  );

  restoreConversationSelectValue(
    'secondaryLanguageSelect',
    settings.secondaryLanguage
  );

  if (
    typeof settings.loop === 'boolean'
  ) {
    window.CONVERSATION_V2_LOOP_PLAY =
      settings.loop;

    renderPlayLoopToggle();
  }

  if (
    typeof settings.chunk === 'boolean'
  ) {
    getCurrentSelectedChunkState().open =
      settings.chunk;

    renderCurrentChunkButton();

    if (
      typeof renderCurrentSelectedChunks ===
      'function'
    ) {
      renderCurrentSelectedChunks();
    }
  }

  if (
    settings.playMode === 'computer' ||
    settings.playMode === 'i-start'
  ) {
    window.CONVERSATION_V2_PLAY_MODE =
      settings.playMode;
  }

  if (
    settings.practiceType === 'role-play' ||
    settings.practiceType === 'follow-up'
  ) {
    window.CONVERSATION_V2_PRACTICE_TYPE =
      settings.practiceType;
  }

  if (
    settings.continueMode === 'off' ||
    settings.continueMode === 'repeat' ||
    settings.continueMode === 'next'
  ) {
    window.CONVERSATION_V2_CONTINUE_MODE =
      settings.continueMode;

    renderCurrentContinueMode();
  }

  renderCurrentPracticeControls();
}


// ============================================================================
// 🟦 BLOCK 8450: SETTINGS STORAGE INSTALLATION
// ============================================================================

function installConversationSettingsStorage() {
  restoreConversationSettings();

  [
    'passRange',
    'delayRange',
    'speechSpeedRange',
    'primaryLanguageSelect',
    'secondaryLanguageSelect'
  ].forEach(function(id) {
    var control =
      document.getElementById(id);

    if (!control) {
      return;
    }

    control.addEventListener(
      'change',
      saveConversationSettings
    );

    control.addEventListener(
      'input',
      saveConversationSettings
    );
  });

  [
    'playLoopToggle',
    'chunkButton',
    'playModeToggleButton',
    'practiceModeToggleButton',
    'continueNextButton'
  ].forEach(function(id) {
    var button =
      document.getElementById(id);

    if (!button) {
      return;
    }

    button.addEventListener(
      'click',
      function() {
        window.setTimeout(
          saveConversationSettings,
          0
        );
      }
    );
  });

  [
    'primaryLanguageSelect',
    'secondaryLanguageSelect'
  ].forEach(function(id) {
    var select =
      document.getElementById(id);

    if (!select) {
      return;
    }

    new MutationObserver(
      restoreConversationSettings
    ).observe(
      select,
      { childList: true }
    );
  });
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installConversationSettingsStorage,
    { once: true }
  );
} else {
  installConversationSettingsStorage();
}


// ============================================================================
// 🟦 BLOCK 8500: BIBLE PERSON LINK CONFIGURATION / LOOKUP
// ============================================================================

const CONVERSATION_V2_BIBLE_LINKS_URL =
  'https://yxudhflyxuztvzaiunva.supabase.co/rest/v1/' +
  'conversation_name_bible_links';

const CONVERSATION_V2_BIBLE_BASE_URL =
  'https://bibleofgongboo.github.io/biblenew/';


function getConversationV2BibleLinkKey(
  speaker
) {
  return String(speaker || '')
    .trim()
    .toLowerCase();
}


function getConversationV2SpeakerName(
  speakerElement
) {
  return String(
    speakerElement
      ? speakerElement.textContent
      : ''
  )
    .replace(/:$/, '')
    .trim();
}


// ============================================================================
// 🟦 BLOCK 8550: BIBLE PERSON LINK LOADER
// ============================================================================

async function loadConversationV2BibleLinks() {
  try {
    var response =
      await fetch(
        CONVERSATION_V2_BIBLE_LINKS_URL +
          '?select=' +
          encodeURIComponent(
            'NAME,BIBLE_ORIGIN,BIBLE_PERSON_ID'
          ),
        {
          headers: {
            apikey:
              SUPABASE_CONFIG.publishableKey,

            Authorization:
              'Bearer ' +
              SUPABASE_CONFIG.publishableKey
          }
        }
      );

    var text =
      await response.text();

    if (!response.ok) {
      throw new Error(
        'Bible links load failed: ' +
        response.status
      );
    }

    var links = {};

    (
      text
        ? JSON.parse(text)
        : []
    ).forEach(function(row) {
      var name =
        String(row.NAME || '').trim();

      var personId =
        String(
          row.BIBLE_PERSON_ID ||
          row.BIBLE_ORIGIN ||
          ''
        ).trim();

      if (!name || !personId) {
        return;
      }

      links[
        getConversationV2BibleLinkKey(name)
      ] = personId;
    });

    window.CONVERSATION_V2_BIBLE_LINKS =
      links;

    decorateConversationV2BibleSpeakers();

    console.log(
      '[CONVERSATION V2] Bible links:',
      Object.keys(links).length
    );

  } catch (error) {
    window.CONVERSATION_V2_BIBLE_LINKS = {};

    console.error(
      '[CONVERSATION V2] Bible links failed:',
      error
    );
  }
}


// ============================================================================
// 🟦 BLOCK 8600: BIBLE SPEAKER DECORATION
// ============================================================================

function decorateConversationV2BibleSpeakers() {
  var links =
    window.CONVERSATION_V2_BIBLE_LINKS ||
    {};

  document
    .querySelectorAll(
      '.conversation-turn-speaker'
    )
    .forEach(function(speakerElement) {
      var speaker =
        getConversationV2SpeakerName(
          speakerElement
        );

      var personId =
        links[
          getConversationV2BibleLinkKey(
            speaker
          )
        ];

      speakerElement.classList.toggle(
        'is-bible-person-link',
        Boolean(personId)
      );

      if (personId) {
        speakerElement.dataset.biblePersonId =
          personId;

        speakerElement.setAttribute(
          'role',
          'link'
        );

        speakerElement.setAttribute(
          'tabindex',
          '0'
        );

        speakerElement.setAttribute(
          'aria-label',
          'Open Bible information for ' +
          speaker
        );

      } else {
        delete speakerElement.dataset.biblePersonId;

        speakerElement.removeAttribute(
          'role'
        );

        speakerElement.removeAttribute(
          'tabindex'
        );

        speakerElement.removeAttribute(
          'aria-label'
        );
      }
    });
}


// ============================================================================
// 🟦 BLOCK 8650: BIBLE PERSON OPEN / EVENT CONNECTION
// ============================================================================

function openConversationV2BiblePerson(
  personId
) {
  if (!personId) {
    return;
  }

  var targetUrl =
    CONVERSATION_V2_BIBLE_BASE_URL +
    '?personId=' +
    encodeURIComponent(personId);

  window.open(
    targetUrl,
    '_blank',
    'noopener,noreferrer'
  );
}


function installConversationV2BibleSpeakerLinks() {
  var turns =
    document.getElementById(
      'conversationTurns'
    );

  if (!turns) {
    return;
  }

  turns.addEventListener(
    'click',
    function(event) {
      var speakerElement =
        event.target.closest(
          '.conversation-turn-speaker' +
          '.is-bible-person-link'
        );

      if (
        !speakerElement ||
        !turns.contains(speakerElement)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      openConversationV2BiblePerson(
        speakerElement.dataset.biblePersonId
      );
    },
    true
  );

  turns.addEventListener(
    'keydown',
    function(event) {
      if (
        event.key !== 'Enter' &&
        event.key !== ' '
      ) {
        return;
      }

      var speakerElement =
        event.target.closest(
          '.conversation-turn-speaker' +
          '.is-bible-person-link'
        );

      if (!speakerElement) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      openConversationV2BiblePerson(
        speakerElement.dataset.biblePersonId
      );
    }
  );

  new MutationObserver(
    decorateConversationV2BibleSpeakers
  ).observe(
    turns,
    { childList: true }
  );

  loadConversationV2BibleLinks();
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installConversationV2BibleSpeakerLinks,
    { once: true }
  );
} else {
  installConversationV2BibleSpeakerLinks();
}


// ============================================================================
// 🟦 BLOCK 8700: ANDROID TTS WORD BOUNDARY LISTENER
// ============================================================================

function installCurrentAndroidTtsWordListener() {
  var nativeSpeech =
    getCurrentPsgNativeSpeech();

  if (
    !nativeSpeech ||
    typeof nativeSpeech.addListener !==
    'function'
  ) {
    return;
  }

  if (
    window.CONVERSATION_V2_TTS_WORD_LISTENER_READY
  ) {
    return;
  }

  window.CONVERSATION_V2_TTS_WORD_LISTENER_READY =
    true;

  nativeSpeech.addListener(
    'wordBoundary',
    function(payload) {
      highlightCurrentTtsWordAt(
        Number(payload.start)
      );
    }
  );

  console.log(
    '[CONVERSATION V2] Android TTS word listener ready'
  );
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installCurrentAndroidTtsWordListener,
    { once: true }
  );
} else {
  installCurrentAndroidTtsWordListener();
}


// ============================================================================
// 🟦 BLOCK 8750: SYSTEM URL SETTINGS
// ============================================================================

const CONVERSATION_V2_SYSTEM_URLS = {
  conversation:
    'https://bibleofgongboo.github.io/conversation/',

  bible:
    'https://bibleofgongboo.github.io/biblenew/',

  easyLearning:
    'https://bibleofgongboo.github.io/anne/',

  license:
    ''
};


function installConversationSystemExternalLinks() {
  document
    .querySelectorAll(
      '[data-system-key]'
    )
    .forEach(function(button) {
      button.onclick = function() {
        var systemKey =
          String(
            button.dataset.systemKey || ''
          ).trim();

        var url =
          CONVERSATION_V2_SYSTEM_URLS[
            systemKey
          ];

        if (!url) {
          return;
        }

        window.open(
          url,
          '_blank',
          'noopener,noreferrer'
        );
      };
    });
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installConversationSystemExternalLinks,
    { once: true }
  );
} else {
  installConversationSystemExternalLinks();
}


// ============================================================================
// 🟦 BLOCK 8800: SPACE PLAY / STOP TOGGLE
// ============================================================================

function isCurrentSpaceShortcutBlocked(
  target
) {
  if (!target || !target.closest) {
    return false;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, button, [contenteditable="true"]'
    )
  );
}


function installCurrentSpacePlayToggle() {
  document.addEventListener(
    'keydown',
    function(event) {
      var playButtonFocused =
        event.target &&
        event.target.id === 'playButton';

      if (
        event.code !== 'Space' ||
        event.repeat ||
        (
          isCurrentSpaceShortcutBlocked(
            event.target
          ) &&
          !playButtonFocused
        )
      ) {
        return;
      }

      var playMenuPanel =
        document.getElementById(
          'playMenuPanel'
        );

      if (
        playMenuPanel &&
        !playMenuPanel.hidden
      ) {
        return;
      }

      event.preventDefault();

      var playState =
        getCurrentPsgPlayState();

      if (playState.running) {
        stopCurrentPsgPlay();
        return;
      }

      resetCurrentPlayVisualState();
      startCurrentPsgPlay();
    }
  );
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installCurrentSpacePlayToggle,
    { once: true }
  );
} else {
  installCurrentSpacePlayToggle();
}


// ============================================================================
// 🟦 BLOCK 8850: LEFT / RIGHT CONVERSATION NAVIGATION
// ============================================================================

function installCurrentArrowNavigation() {
  document.addEventListener(
    'keydown',
    function(event) {
      if (
        event.repeat ||
        isCurrentSpaceShortcutBlocked(
          event.target
        )
      ) {
        return;
      }

      var buttonId =
        event.code === 'ArrowLeft'
          ? 'previousButton'
          : event.code === 'ArrowRight'
            ? 'nextButton'
            : '';

      if (!buttonId) {
        return;
      }

      var button =
        document.getElementById(
          buttonId
        );

      if (
        !button ||
        button.disabled
      ) {
        return;
      }

      event.preventDefault();
      button.click();
    }
  );
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installCurrentArrowNavigation,
    { once: true }
  );
} else {
  installCurrentArrowNavigation();
}


// ============================================================================
// 🟦 BLOCK 8900: PRACTICE RESET
// ============================================================================

function resetCurrentPracticeSession() {
  var targetTurn =
    getCurrentRoleTargetTurn();

  stopCurrentPsgPlay();
  stopCurrentRolePlay();
  stopCurrentMicRecognition();

  resetCurrentRolePlayResults();
  clearCurrentSpeakingCard();

  selectCurrentRoleTurn(
    targetTurn
  );

  renderCurrentPracticeControls();
}


function installCurrentPracticeResetButton() {
  var button =
    document.getElementById(
      'practiceResetButton'
    );

  if (!button) {
    return;
  }

  button.onclick = function() {
    resetCurrentPracticeSession();
  };
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installCurrentPracticeResetButton,
    { once: true }
  );
} else {
  installCurrentPracticeResetButton();
}


// ============================================================================
// 8950–9899 RESERVED FOR FUTURE BLOCKS
// ============================================================================


// ============================================================================
// 🟩 9900 — HELP
// ============================================================================


// ============================================================================
// 🟦 BLOCK 9900: BUTTON HOVER HELP
// IMPORTANT: HELP remains ONE block even when longer than 120 lines.
// ============================================================================

function getCurrentButtonHoverHelp(button) {
  var helpById = {
    systemMenuButton:
      '시스템 메뉴 열기',

    playButton:
      '현재 선택 문장부터 재생',

    playMenuButton:
      'PLAY 옵션 열기 또는 닫기',

    stopButton:
      '재생, 역할 연습, 마이크를 중지',

    settingsButton:
      '재생 및 언어 설정 열기',

    playModeToggleButton:
      'COMPUTER와 I FIRST 순서 전환',

    practiceStartStopButton:
      '선택한 연습 시작 또는 중지',

    practiceModeToggleButton:
      'ROLE PLAY 연습 모드 전환',

    continueNextButton:
      '재생 후 반복 또는 다음 대화 진행 설정',

    practiceResetButton:
      '연습 결과와 선택 상태 초기화',

    playLoopToggle:
      '현재 대화 반복 재생 설정',

    chunkButton:
      '선택 문장의 세부 구간 표시',

    previousButton:
      '이전 대화로 이동',

    nextButton:
      '다음 대화로 이동'
  };

  var systemHelpByKey = {
    conversation:
      '대화 첫 화면 열기',

    license:
      '라이선스 안내 열기',

    bible:
      '성경 관련 화면 열기',

    easyLearning:
      'Easy Learning 열기'
  };

  if (helpById[button.id]) {
    return helpById[button.id];
  }

  var systemKey =
    String(
      button.dataset.systemKey || ''
    ).trim();

  if (systemHelpByKey[systemKey]) {
    return systemHelpByKey[systemKey];
  }

  var ariaLabel =
    String(
      button.getAttribute(
        'aria-label'
      ) || ''
    ).trim();

  if (ariaLabel) {
    return ariaLabel;
  }

  return String(
    button.textContent || ''
  )
    .replace(/\s+/g, ' ')
    .trim();
}


function applyCurrentButtonHoverHelp(root) {
  var scope =
    root || document;

  scope
    .querySelectorAll('button')
    .forEach(function(button) {
      if (
        button.hasAttribute('title') &&
        button.title.trim()
      ) {
        return;
      }

      var help =
        getCurrentButtonHoverHelp(
          button
        );

      if (help) {
        button.title = help;
      }
    });
}


function bootCurrentButtonHoverHelp() {
  var install = function() {
    applyCurrentButtonHoverHelp(
      document
    );

    new MutationObserver(
      function(records) {
        records.forEach(
          function(record) {
            record.addedNodes.forEach(
              function(node) {
                if (
                  !node ||
                  node.nodeType !== 1
                ) {
                  return;
                }

                if (
                  node.matches('button')
                ) {
                  var help =
                    getCurrentButtonHoverHelp(
                      node
                    );

                  if (help) {
                    node.title = help;
                  }
                }

                applyCurrentButtonHoverHelp(
                  node
                );
              }
            );
          }
        );
      }
    ).observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );
  };

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      install,
      { once: true }
    );

    return;
  }

  install();
}


bootCurrentButtonHoverHelp();


// ============================================================================
// END: BUTTON HOVER HELP
// ============================================================================