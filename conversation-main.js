// ============================================================================
// 🟥 BLOCK 1000: APPLICATION RUNTIME (W=1 RUNTIME, X=0 ROOT, Y=0 APPLICATION, Z=0 BASE)
// ============================================================================


// ============================================================================
// 🟩 BLOCK 2000: DATA ACCESS (W=2 DATA, X=0 ROOT, Y=0 ACCESS, Z=0 BASE)
// ============================================================================


// ============================================================================
// 🟦 BLOCK 2100: PRIVATE LOCAL CONFIGURATION (W=2 DATA, X=1 CONFIGURATION, Y=0 PRIVATE, Z=0 BASE)
// ============================================================================

const SUPABASE_CONFIG = {
  url: 'https://yxudhflyxuztvzaiunva.supabase.co',
  restUrl: 'https://yxudhflyxuztvzaiunva.supabase.co/rest/v1/conversation',
  publishableKey: 'sb_publishable_9Kg6bvsSqZzOGMavBG3_1w_WO6WGbGB'
};


// ============================================================================
// 🟦 BLOCK 2200: CONVERSATION CACHE AND ROW LOADER (W=2 DATA, X=2 CONVERSATION, Y=0 CACHE/LOAD, Z=0 BASE)
// Purpose: Cache 20 conversations from the selected position by language.
// ============================================================================

const CONVERSATION_V2_CACHE_KEY =
  'gongbooConversationV2CacheV1';


// ============================================================================
// 🟦 BLOCK 2210: CONVERSATION CACHE STATE
// ============================================================================

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


// ============================================================================
// 🟦 BLOCK 2230: CACHED ROW LOOKUP
// ============================================================================

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
// 🟦 BLOCK 2250: CACHE BATCH STORAGE
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


// ============================================================================
// 🟦 BLOCK 2270: BATCH ID RESOLUTION
// ============================================================================

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
// 🟦 BLOCK 2290: SERVER ROW REQUEST AND SINGLE ROW LOAD
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







// SUB BLOCK 2310: SINGLE ROW LOAD

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
// END BLOCK 2200: CONVERSATION CACHE AND ROW LOADER
// ============================================================================

// ============================================================================
// 🟩 BLOCK 3000: DIRECTORY AND LESSON VIEW (W=3 VIEW, X=0 ROOT, Y=0 DIRECTORY/LESSON, Z=0 BASE)
// ============================================================================


// ============================================================================
// 🟦 BLOCK 3100: STATUS AND TURN VIEW (W=3 VIEW, X=1 STATUS/TURNS, Y=0 RENDER, Z=0 BASE)
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
// 🟦 BLOCK 3200: DIRECTORY DATA AND STARTUP (W=3 VIEW, X=2 DIRECTORY, Y=0 DATA/START, Z=0 BASE)
// Purpose: Show LEVEL → CATEGORY → TITLE before loading a conversation.
// ============================================================================

function parseConversationTurns(
  dialogue
) {
  var lines =
    String(dialogue || '')
      .split(
        /<br\s*\/?>|\r?\n/gi
      )
      .map(function(line) {
        return String(line || '').trim();
      })
      .filter(Boolean);

  var turns = [];

  lines.forEach(function(line) {
    var colonIndex =
      line.indexOf(':');

    if (colonIndex <= 0) {
      return;
    }

    var speaker =
      line
        .slice(0, colonIndex)
        .trim();

    var text =
      line
        .slice(colonIndex + 1)
        .trim();

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


function renderConversationTurns(
  turns
) {
  var container =
    document.getElementById(
      'conversationTurns'
    );

  if (!container) {
    throw new Error(
      'Conversation turns element missing'
    );
  }

  container.innerHTML = '';

  turns.forEach(function(turn) {
    var card =
      document.createElement('article');

    card.className =
      'conversation-turn-card';

    card.dataset.turn =
      String(turn.number);

    var speaker =
      document.createElement('strong');

    speaker.className =
      'conversation-turn-speaker';

    speaker.textContent =
      turn.speaker + ':';

    var text =
      document.createElement('span');

    text.className =
      'conversation-turn-text';

    text.textContent =
      turn.text;

    card.appendChild(speaker);
    card.appendChild(text);

    container.appendChild(card);
  });
}







// SUB BLOCK 3205: FIRST ROW RENDER

function renderFirstConversationRow(
  row
) {
  var lesson =
    document.getElementById(
      'conversationLesson'
    );

  var meta =
    document.getElementById(
      'conversationMeta'
    );

  if (!lesson || !meta) {
    throw new Error(
      'Conversation screen elements missing'
    );
  }

  var turns =
    parseConversationTurns(
      row.DIALOGUE
    );

  if (!turns.length) {
    throw new Error(
      'Conversation dialogue has no turns'
    );
  }

  meta.innerHTML = '';

  var group =
    document.createElement('div');

  group.className =
    'conversation-group';

  group.textContent =
    String(row.GROUP || '') +
    (
      row.CATEGORY
        ? ' · ' +
          String(row.CATEGORY)
        : ''
    );

  var title =
    document.createElement('h2');

  title.className =
    'conversation-title';

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
// 🟦 BLOCK 3210: DIRECTORY TEXT AND UNIQUE VALUES
// ============================================================================

function getConversationDirectoryText(
  value
) {
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


// ============================================================================
// 🟦 BLOCK 3230: DIRECTORY ROW LOADING
// ============================================================================

async function loadConversationDirectoryRows() {
  var allRows = [];
  var from = 0;
  var pageSize = 1000;

  while (true) {
    var to =
      from + pageSize - 1;

    var response =
      await fetch(
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

            Range:
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
        'Conversation directory load failed: ' +
        response.status
      );
    }

    var rows =
      text
        ? JSON.parse(text)
        : [];

    allRows =
      allRows.concat(rows);

    if (rows.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return allRows.filter(function(row) {
    return (
      Number.isInteger(
        Number(row.ID)
      ) &&
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
// 🟦 BLOCK 3250: DIRECTORY BREADCRUMB AND ITEM VIEW
// ============================================================================

function renderConversationDirectoryBreadcrumb(
  state
) {
  var breadcrumb =
    document.getElementById(
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

  function appendStep(
    label,
    action
  ) {
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

    category.textContent =
      state.category;

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
// 🟦 BLOCK 3270: DIRECTORY LIST RENDERING
// ============================================================================

function renderConversationDirectory(
  requestedState
) {
  var directory =
    document.getElementById(
      'conversationDirectory'
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
    window.CONVERSATION_V2_DIRECTORY_ROWS ||
    [];

  directory.hidden = false;

  app.classList.add(
    'conversation-directory-open'
  );

  renderConversationDirectoryBreadcrumb(
    state
  );

  list.innerHTML = '';






// SUB BLOCK 3275: LEVEL LIST

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






// SUB BLOCK 3280: CATEGORY LIST

  var levelRows =
    rows.filter(function(row) {
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






// SUB BLOCK 3285: TITLE LIST AND CONVERSATION OPEN

  var titleRows =
    levelRows
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

  if (!titleRows.length) {
    var empty =
      document.createElement('p');

    empty.className =
      'conversation-directory-empty';

    empty.textContent =
      'No conversations found.';

    list.appendChild(empty);
  }
}


// ============================================================================
// 🟦 BLOCK 3290: APPLICATION STARTUP AND BOOT
// ============================================================================

async function startConversationApp() {
  if (
    window.__conversationV2Started
  ) {
    return;
  }

  window.__conversationV2Started =
    true;

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
    window.__conversationV2Started =
      false;

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
// END BLOCK 3200: DIRECTORY DATA AND STARTUP
// ============================================================================


// ============================================================================
// 🟦 BLOCK 3300: DIRECTORY LOADING VIEW (W=3 VIEW, X=3 DIRECTORY, Y=0 LOADING, Z=0 BASE)
// Purpose: Hide lesson navigation and show one loading line at startup.
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
// END BLOCK 3300: DIRECTORY LOADING VIEW
// ============================================================================



// ============================================================================
// 🟦 BLOCK 4000: TOP, PLAY, AND DETAIL MENU CONTROL (W=4 CONTROL, X=0 MENU, Y=0 TOP/DETAIL, Z=0 BASE)
// ============================================================================

// ============================================================================
// 🟦 BLOCK 4010: MENU STATE AND CLOSE HELPERS
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

  var playButton =
    document.getElementById(
      'playButton'
    );

  if (playButton) {
    playButton.disabled = false;

    playButton.setAttribute(
      'aria-disabled',
      'false'
    );
  }
}


// ============================================================================
// 🟦 BLOCK 4030: MENU TOGGLE ACTIONS
// ============================================================================

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

  var playButton =
    document.getElementById(
      'playButton'
    );

  var playMenuOpen =
    targetMenu.panelId ===
    'playMenuPanel' &&
    opening;

  if (playButton) {
    playButton.disabled =
      playMenuOpen;

    playButton.setAttribute(
      'aria-disabled',
      String(playMenuOpen)
    );
  }
}


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
// 🟦 BLOCK 4050: PLAY DETAIL CONTROL INSTALLATION
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







// SUB BLOCK 4060: PLAY DETAIL INSTALL

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
// 🟦 BLOCK 4070: MENU EVENT INSTALLATION AND BOOT
// ============================================================================






// SUB BLOCK 4080: MENU INSTALL AND BOOT

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

      if (!clickedMenu) {
        closeConversationMenus();
      }
    }
  );
}


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
// END BLOCK 4000: TOP, PLAY, AND DETAIL MENU CONTROL
// ============================================================================




// ============================================================================
// 🟦 BLOCK 4100: PSG LOOP CONTROL (W=4 CONTROL, X=1 PSG, Y=0 LOOP, Z=0 BASE)
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
// END BLOCK 4100: PSG LOOP CONTROL
// ============================================================================




// ============================================================================
// 🟦 BLOCK 4200: LANGUAGE OPTIONS (W=4 CONTROL, X=2 LANGUAGE, Y=0 OPTIONS, Z=0 BASE)
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







// SUB BLOCK 4250: LANGUAGE SELECT RENDERING

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
// 🟦 BLOCK 4300: SELECTED LANGUAGE ROW LOADER (W=4 CONTROL, X=3 LANGUAGE, Y=0 ROW LOAD, Z=0 BASE)
// ============================================================================






// SUB BLOCK 4350: SELECTED LANGUAGE LOOKUP

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







// SUB BLOCK 4360: SELECTED LANGUAGE RELOAD

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
// 🟦 BLOCK 4400: CATEGORY NAVIGATION (W=4 CONTROL, X=4 NAVIGATION, Y=0 CATEGORY, Z=0 BASE)
// Purpose: Move inside the selected CATEGORY.
//          Resume only when CONTINUE: NEXT is selected.
// ============================================================================

// ============================================================================
// 🟦 BLOCK 4410: NAVIGATION ROWS AND RESUME STATE
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
        String(row.GROUP || '').trim() === group
      ) && (
        String(row.CATEGORY || '').trim() === category
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


// ============================================================================
// 🟦 BLOCK 4430: DIRECTORY RETURN AND NAVIGATION VIEW
// ============================================================================

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







// SUB BLOCK 4440: NAVIGATION BUTTON RENDERING

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
// 🟦 BLOCK 4470: CONVERSATION LOAD BY ID
// ============================================================================






// SUB BLOCK 4450: NAVIGATION LOAD EXECUTION

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
// 🟦 BLOCK 4490: NAVIGATION EVENT INSTALLATION
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
// END BLOCK 4400: CATEGORY NAVIGATION
// ============================================================================
// ============================================================================
// 🟦 BLOCK 4500: PRIMARY / SECONDARY TURN RENDER (W=4 CONTROL, X=5 RENDER, Y=0 TURN, Z=0 BASE)
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
// 🟩 BLOCK 5000: PLAYBACK AND TTS (W=5 PLAYBACK, X=0 ROOT, Y=0 TTS, Z=0 BASE)
// ============================================================================

// ============================================================================
// 🟦 BLOCK 5100: PSG PLAY SEQUENCE (W=5 PLAYBACK, X=1 PSG, Y=0 SEQUENCE, Z=0 BASE)
// ============================================================================






// SUB BLOCK 5230: CURRENT SCREEN SEQUENCE

function buildCurrentPsgPlaySequence() {
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







// SUB BLOCK 5210: LEGACY SCREEN SEQUENCE REFRESH






// SUB BLOCK 5250: VISIBLE SCREEN SEQUENCE REFRESH

function refreshCurrentPsgPlaySequence() {
  var sequence =
    buildCurrentPsgPlaySequence();

  window.CONVERSATION_V2_PLAY_SEQUENCE =
    sequence;

  return sequence;
}


function inspectCurrentPsgPlaySequence() {
  var sequence =
    refreshCurrentPsgPlaySequence();

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


window.buildCurrentPsgPlaySequence =
  buildCurrentPsgPlaySequence;

window.inspectCurrentPsgPlaySequence =
  inspectCurrentPsgPlaySequence;

// ============================================================================
// END BLOCK 5100: PSG PLAY SEQUENCE
// ============================================================================


// ============================================================================
// 🟦 BLOCK 5200: VISIBLE SCREEN PLAY SEQUENCE (W=5 PLAYBACK, X=2 SCREEN, Y=0 SEQUENCE, Z=0 BASE)
// Purpose: Play visible primary and secondary sentences in reading order.
//          Japanese TTS reads furigana only: 私(わたし) -> わたし.
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


// SUB BLOCK 5260: VISIBLE SEQUENCE BUILD AND REFRESH

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

 






// SUB BLOCK 5270: VISIBLE TURN COLLECTION

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
// END BLOCK 5200: VISIBLE SCREEN PLAY SEQUENCE
// ============================================================================



// ============================================================================
// 🟦 BLOCK 5300: PLAY ADAPTER STATE (W=5 PLAYBACK, X=3 ADAPTER, Y=0 STATE, Z=0 BASE)
// Purpose: Android native TTS plus browser TTS with sentence-reset highlighting.
// ============================================================================

// ============================================================================
// 🟦 BLOCK 5310: PLAY STATE, RATE, AND LOCALE
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
// 🟦 BLOCK 5330: WEB WORD FALLBACK AND WEB ADAPTER
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







// SUB BLOCK 5335: WEB PLAY ADAPTER

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
// 🟦 BLOCK 5350: NATIVE ADAPTER
// ============================================================================

// SUB BLOCK 5350: NATIVE ADAPTER IMPLEMENTATION

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


// ============================================================================
// 🟦 BLOCK 5370: ADAPTER SELECTOR AND STOP
// ============================================================================

function getCurrentPsgPlayAdapter() {
  var nativeAdapter =
    createCurrentPsgNativePlayAdapter();

  if (nativeAdapter) {
    return nativeAdapter;
  }

  return createCurrentPsgWebPlayAdapter();
}


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

// ============================================================================
// END BLOCK 5300: PLAY ADAPTER STATE
// ============================================================================


// ============================================================================
// 🟦 BLOCK 5400: TTS SENTENCE SEQUENCE (W=5 PLAYBACK, X=4 TTS, Y=0 SENTENCE, Z=0 BASE)
// Purpose: Read current PSG and apply CONTINUE OFF / REPEAT / NEXT at finish.
// ============================================================================

// ============================================================================
// 🟦 BLOCK 5410: PLAY CONTINUATION
// ============================================================================

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

  startCurrentPsgPlay();
}


// ============================================================================
// 🟦 BLOCK 5430: TTS SEQUENCE ITEM SPEAKING
// ============================================================================

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
// 🟦 BLOCK 5450: PLAY START AND FINISH
// ============================================================================

function startCurrentPsgPlay(
  skipStartSignal
) {
  var state =
    getCurrentPsgPlayState();

  if (state.running) {
    return;
  }

  if (
    !window.CONVERSATION_V2_ROW ||
    !window.CONVERSATION_V2_ROW.DIALOGUE
  ) {
    var directoryRows =
      window.CONVERSATION_V2_DIRECTORY_ROWS ||
      [];

    var firstRow =
      directoryRows[0];

    if (
      !firstRow ||
      typeof loadConversationById !==
      'function'
    ) {
      setConversationStatus(
        'Select a conversation first'
      );
      return;
    }

    if (state.loadingConversation) {
      return;
    }

    state.loadingConversation = true;

    window.CONVERSATION_V2_ROLE_TARGET_TURN =
      1;

    setConversationStatus(
      'Loading first conversation...'
    );

    loadConversationById(
      Number(firstRow.ID),
      { resume: false }
    ).then(
      function(loaded) {
        state.loadingConversation = false;

        if (loaded && !state.running) {
          startCurrentPsgPlay(
            skipStartSignal
          );
        }
      },
      function(error) {
        state.loadingConversation = false;

        console.error(
          '[PLAY] Conversation load failed:',
          error
        );

        setConversationStatus(
          'Conversation load failed'
        );
      }
    );

    return;
  }

  if (!skipStartSignal) {
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

// ============================================================================
// END BLOCK 5400: TTS SENTENCE SEQUENCE
// ============================================================================

// ============================================================================
// END BLOCK 5400: TTS SENTENCE SEQUENCE
// ============================================================================

// ============================================================================
// 🟦 BLOCK 5500: SPEAKING CARD AND WORD HIGHLIGHT (W=5 PLAYBACK, X=5 VISUAL, Y=0 CARD/WORD, Z=0 BASE)
// Purpose: Highlight the active sentence and prepare its word highlights.
// ============================================================================

// ============================================================================
// 🟦 BLOCK 5510: TTS WORD HIGHLIGHT
// ============================================================================

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







// SUB BLOCK 5515: TTS WORD PREPARATION

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







// SUB BLOCK 5520: WORD RANGE HIGHLIGHT

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


// ============================================================================
// 🟦 BLOCK 5530: CURRENT SPEAKING CARD
// ============================================================================

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
    behavior: 'auto',
    block: 'center',
    inline: 'nearest'
  });
}


// ============================================================================
// 🟦 BLOCK 5550: PLAY ADAPTER AND BUTTON CONNECTION
// ============================================================================

function getCurrentPsgPlayAdapter() {
  var baseAdapter =
    createCurrentPsgNativePlayAdapter() ||
    createCurrentPsgWebPlayAdapter();

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
// END BLOCK 5500: SPEAKING CARD AND WORD HIGHLIGHT
// ============================================================================



// ============================================================================
// 🟩 BLOCK 6000: MICROPHONE RECOGNITION (W=6 MICROPHONE, X=0 ROOT, Y=0 RECOGNITION, Z=0 BASE)

// 🟦 BLOCK 6100: MIC STATE AND NATIVE ADAPTER (W=6 MICROPHONE, X=1 ADAPTER, Y=0 STATE/NATIVE, Z=0 BASE)
// Purpose: APK uses GongbooSpeech. Web uses the V2 webkitSpeechRecognition
//          engine (continuous + interim + delay finalize). Both paths write
//          the final transcript into getCurrentMicState().transcript so that
//          PASS/RETRY and practice blocks need no changes.
// ============================================================================


// ---------------------------------------------------------------------------
// SUB BLOCK 6100: MIC STATE
// ---------------------------------------------------------------------------

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


// ---------------------------------------------------------------------------
// 🟦 BLOCK 6300: WEB SPEECH ENGINE (W=6 MICROPHONE, X=3 WEB, Y=0 ENGINE, Z=0 BASE)
// ---------------------------------------------------------------------------

var CurrentMicSpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


// ---------------------------------------------------------------------------
// SUB BLOCK 6300: WEB ENGINE STATE
// ---------------------------------------------------------------------------

var _currentMicWebRecognition = null;
var _currentMicWebFinalizeTimer = null;
var _currentMicWebLastTranscript = '';
var _currentMicWebResolve = null;
var _currentMicWebReject = null;


// ---------------------------------------------------------------------------
// SUB BLOCK 6100: NATIVE ADAPTER
// ---------------------------------------------------------------------------

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


// ---------------------------------------------------------------------------
// 🟦 BLOCK 6500: WEB MIC ADAPTER (W=6 MICROPHONE, X=5 WEB, Y=0 ADAPTER, Z=0 BASE)
// continuous + interimResults + delay finalize.
// ---------------------------------------------------------------------------

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


// SUB BLOCK 6550: WEB MIC ADAPTER IMPLEMENTATION

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






// SUB BLOCK 6555: WEB MIC CLEANUP AND COMPLETION

        function cleanup() {
          if (_currentMicWebFinalizeTimer) {
            clearTimeout(_currentMicWebFinalizeTimer);
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
          var resolveFn = _currentMicWebResolve;

          var transcript =
            String(_currentMicWebLastTranscript || '').trim();

          cleanup();

          if (resolveFn) {
            resolveFn({
              matches: transcript ? [transcript] : []
            });
          }
        }

        function fail(error) {
          var rejectFn = _currentMicWebReject;

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






// SUB BLOCK 6565: WEB MIC RESULT AND ERROR EVENTS

        recognition.onresult = function(event) {
          var transcript = '';

          for (var i = 0; i < event.results.length; i++) {
            if (event.results[i] && event.results[i][0]) {
              transcript +=
                event.results[i][0].transcript + ' ';
            }
          }

          transcript = transcript.trim();

          if (!transcript) {
            return;
          }

          _currentMicWebLastTranscript = transcript;

          if (_currentMicWebFinalizeTimer) {
            clearTimeout(_currentMicWebFinalizeTimer);
          }

          _currentMicWebFinalizeTimer = setTimeout(
            function() {
              if (_currentMicWebRecognition === recognition) {
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
            event.error === 'service-not-allowed'
          ) {
            fail(new Error('Microphone permission denied.'));
            return;
          }

          fail(new Error('Web speech error: ' + event.error));
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


// ---------------------------------------------------------------------------
// 🟦 BLOCK 6700: MIC ADAPTER LIFECYCLE (W=6 MICROPHONE, X=7 LIFECYCLE, Y=0 START/STOP, Z=0 BASE)
// Native first (APK), then web.
// ---------------------------------------------------------------------------






// SUB BLOCK 6700: MIC ADAPTER SELECTOR AND LIFECYCLE

function getCurrentMicAdapter() {
  var nativeAdapter = createCurrentMicNativeAdapter();

  if (nativeAdapter) {
    return nativeAdapter;
  }

  return createCurrentMicWebAdapter();
}


// ---------------------------------------------------------------------------
// SUB BLOCK 6750: PUBLIC API
// ---------------------------------------------------------------------------

function startCurrentMicRecognition(options) {
  var config = options || {};

  var adapter = getCurrentMicAdapter();
  var state = getCurrentMicState();

  if (!adapter) {
    return Promise.reject(
      new Error('Microphone is unavailable on this device.')
    );
  }

  var row = window.CONVERSATION_V2_ROW || {};

  var language =
    config.language ||
    getCurrentPsgPlayLocale(row.LNG || 'EN');

  state.runId += 1;

  var runId = state.runId;

  state.running = true;
  state.transcript = '';
  state.matches = [];

  console.log('[MIC] Adapter:', adapter.type, language);

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
        Array.isArray(result.matches) ? result.matches : [];

      state.transcript =
        String(state.matches[0] || '').trim();

      console.log('[MIC] recognized:', state.transcript);

      return state;
    },
    function(error) {
      if (state.runId === runId) {
        state.running = false;
      }

      console.error('[MIC] recognition failed:', error);

      throw error;
    }
  );
}


function stopCurrentMicRecognition() {
  var adapter = getCurrentMicAdapter();
  var state = getCurrentMicState();

  state.runId += 1;
  state.running = false;

  if (!adapter || typeof adapter.stop !== 'function') {
    return Promise.resolve();
  }

  return adapter.stop();
}


window.startCurrentMicRecognition =
  startCurrentMicRecognition;

window.stopCurrentMicRecognition =
  stopCurrentMicRecognition;

// ============================================================================
// END BLOCK 6700: MIC ADAPTER LIFECYCLE
// ============================================================================


// ============================================================================
// 🟦 BLOCK 6900: MIC PASS / RETRY CHECK (W=6 MICROPHONE, X=9 EVALUATION, Y=0 PASS/RETRY, Z=0 BASE)
// Purpose: Compare spoken English with one turn using the PASS slider value.
// ============================================================================

// ============================================================================
// 🟦 BLOCK 6910: MIC TEXT NORMALIZATION
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


// ============================================================================
// 🟦 BLOCK 6930: MIC TARGET AND PASS THRESHOLD
// ============================================================================

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


function getCurrentMicPassThreshold() {
  var input =
    document.getElementById(
      'passRange'
    );

  var percent =
    Number(input ? input.value : 1);

  return Math.max(
    0.01,
    Math.min(1, percent / 100)
  );
}


// ============================================================================
// 🟦 BLOCK 6950: MIC SIMILARITY AND WORD MATCHES
// ============================================================================

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

  return matchedCount / expectedWords.length;
}


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
// 🟦 BLOCK 6970: MIC PASS / RETRY RESULT VIEW
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
// 🟦 BLOCK 6990: MIC ANSWER EVALUATION AND START
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
// END BLOCK 6900: MIC PASS / RETRY CHECK
// ============================================================================



// ============================================================================
// 🟩 BLOCK 7000: PRACTICE ENGINE (W=7 PRACTICE, X=0 ROOT, Y=0 ENGINE, Z=0 BASE)

// ============================================================================
// 🟦 BLOCK 7100: ROLE PLAY TARGET SENTENCE
// Purpose: Yellow box selects the sentence to start role play.
// Default: first sentence.
// ============================================================================

function selectCurrentRoleTurn(turnNumber) {
  var cards =
    Array.from(
      document.querySelectorAll(
        '.conversation-turn-card'
      )
    );

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

function getCurrentRoleTargetTurn() {
  var selectedCard =
    document.querySelector(
      '.conversation-turn-card.is-role-target'
    );

  if (selectedCard) {
    return Number(selectedCard.dataset.turn) || 1;
  }

  return 1;
}


// SUB BLOCK 7170: ROLE TARGET INSTALLATION

function installCurrentRoleTurnSelection() {
  var container =
    document.getElementById(
      'conversationTurns'
    );

  if (!container) {
    return;
  }

  container.addEventListener(
    'click',
    function(event) {
      var card =
        event.target.closest(
          '.conversation-turn-card'
        );

      if (!card || !container.contains(card)) {
        return;
      }

      selectCurrentRoleTurn(
        card.dataset.turn
      );
    }
  );

  var applyDefaultTarget = function() {
    var cards =
      Array.from(
        container.querySelectorAll(
          '.conversation-turn-card'
        )
      );

    if (!cards.length) {
      return;
    }

    var savedTurn =
      Number(
        window.CONVERSATION_V2_ROLE_TARGET_TURN
      );

    var savedCard =
      cards.find(function(card) {
        return Number(card.dataset.turn) ===
          savedTurn;
      });

    selectCurrentRoleTurn(
      savedCard
        ? savedCard.dataset.turn
        : cards[0].dataset.turn
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
// END BLOCK 7100: ROLE PLAY TARGET SENTENCE
// ============================================================================






// SUB BLOCK 7170: ROLE TARGET INSTALLATION

function installCurrentRoleTurnSelection() {
  var container =
    document.getElementById(
      'conversationTurns'
    );

  if (!container) {
    return;
  }

  container.addEventListener(
    'click',
    function(event) {
      var card =
        event.target.closest(
          '.conversation-turn-card'
        );

      if (!card || !container.contains(card)) {
        return;
      }

      selectCurrentRoleTurn(
        card.dataset.turn
      );
    }
  );

  var applyDefaultTarget = function() {
    var cards =
      container.querySelectorAll(
        '.conversation-turn-card'
      );

    if (!cards.length) {
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
// END BLOCK 7100: ROLE PLAY TARGET SENTENCE
// ============================================================================


// ============================================================================
// 🟦 BLOCK 7300: PRACTICE MODE AND START / STOP CONTROL (W=7 PRACTICE, X=3 EXECUTION, Y=0 ROLE/FOLLOW UP, Z=0 BASE)
// Purpose: ROLE PLAY / FOLLOW UP plus CONTINUE REPEAT / NEXT.
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
    Number(input ? input.value : 0.5) * 1000
  );
}







// SUB BLOCK 7320: PRACTICE RESULT RESET AND CONTROL VIEW

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
    typeButton.textContent = followUp
      ? 'FOLLOW UP'
      : 'ROLE PLAY';

    typeButton.disabled = state.running;

    typeButton.setAttribute(
      'aria-pressed',
      String(followUp)
    );
  }
}







// SUB BLOCK 7340: PRACTICE TURN ORDER AND CONTINUE TARGET

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


function stopCurrentRolePlay() {
// ============================================================================
// 🟦 BLOCK 7350: PRACTICE STOP AND FINISH (W=7 PRACTICE, X=3 EXECUTION, Y=5 LIFECYCLE, Z=0 BASE)
// ============================================================================
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







// SUB BLOCK 7350: PRACTICE FINISH AND RETRY

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
        state.continueToken !== continueToken ||
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
  window.CONVERSATION_V2_ROLE_TARGET_TURN = 1;

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


function retryCurrentPracticeTurn() {
// ============================================================================
// 🟦 BLOCK 7370: PRACTICE TURN EXECUTION (W=7 PRACTICE, X=3 EXECUTION, Y=7 TURNS, Z=0 BASE)
// ============================================================================
  window.setTimeout(
    runCurrentPracticeTurn,
    getCurrentRolePlayDelay()
  );
}







// SUB BLOCK 7375: PRACTICE MIC TURN

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
      listenCurrentPracticeTurn(state);
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







// SUB BLOCK 7380: PRACTICE TURN RUNNER

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
    listenCurrentPracticeTurn(state);
    return;
  }

  speakCurrentPracticeTurn(
    state,
    text,
    false
  );
}







// ============================================================================
// 🟦 BLOCK 7390: PRACTICE START AND BUTTON INSTALL (W=7 PRACTICE, X=3 EXECUTION, Y=9 START/INSTALL, Z=0 BASE)
// ============================================================================

// SUB BLOCK 7395: PRACTICE START

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
          state.continueToken !== signalToken
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







// SUB BLOCK 7397: PRACTICE BUTTON INSTALLATION

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
      if (getCurrentRolePlayState().running) {
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
      if (getCurrentRolePlayState().running) {
        stopCurrentRolePlay();
        return;
      }

      startCurrentRolePlay();
    };
  }

  renderCurrentPracticeControls();
}


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
// END BLOCK 7300: PRACTICE MODE AND START / STOP CONTROL
// ============================================================================



// ============================================================================
// 🟦 BLOCK 7500: CONTINUE MODE CONTROL (W=7 PRACTICE, X=5 CONTINUE, Y=0 MODE, Z=0 BASE)
// Purpose: CONTINUE button cycles OFF -> REPEAT -> NEXT -> OFF.
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
// END BLOCK 7500: CONTINUE MODE CONTROL
// ============================================================================



// ============================================================================
// 🟦 BLOCK 5600: PLAY AND EXTERNAL STOP BUTTON CONNECTION (W=5 PLAYBACK, X=6 CONTROL, Y=0 PLAY/STOP, Z=0 BASE)
// Purpose: PLAY begins clean playback with one moving yellow speaking box.
//          STOP cancels playback, role play, and microphone recognition.
// ============================================================================

function renderCurrentPsgPlayButton() {
  var button =
    document.getElementById(
      'playButton'
    );

  if (!button) {
    return;
  }

  button.textContent = 'PLAY';

  button.setAttribute(
    'aria-pressed',
    'false'
  );
}


window.renderCurrentPsgPlayButton =
  renderCurrentPsgPlayButton;


// SUB BLOCK 5650: PLAY VISUAL RESET AND STOP

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
// END BLOCK 5600: PLAY AND EXTERNAL STOP BUTTON CONNECTION
// ============================================================================


// ============================================================================
// 🟦 BLOCK 4600: SELECTED TURN CHUNK VIEW (W=4 CONTROL, X=6 CHUNK, Y=0 VIEW, Z=0 BASE)
// Purpose: Show only the selected 2ND language chunk below the yellow turn.
// ============================================================================

function getCurrentSelectedChunkState() {
  if (!window.CONVERSATION_V2_SELECTED_CHUNK) {
    window.CONVERSATION_V2_SELECTED_CHUNK = {
      open: false
    };
  }

  return window.CONVERSATION_V2_SELECTED_CHUNK;
}







// SUB BLOCK 4620: CHUNK PARSING AND CLEAR

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


function clearCurrentSelectedChunks() {
  document
    .querySelectorAll(
      '.conversation-selected-chunks'
    )
    .forEach(function(element) {
      element.remove();
    });
}







// SUB BLOCK 4640: CHUNK RENDERING

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


// SUB BLOCK 4650: CHUNK BUTTON AND INSTALL






// SUB BLOCK 4660: CHUNK BUTTON AND INSTALL

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
// END BLOCK 4600: SELECTED TURN CHUNK VIEW
// ============================================================================



// ============================================================================
// 🟦 BLOCK 7600: I FIRST SIGNAL CUE (W=7 PRACTICE, X=6 SIGNAL, Y=0 I FIRST, Z=0 BASE)
// Purpose: Play one short cue before I FIRST begins Role Play.
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


// SUB BLOCK 7650: I FIRST SIGNAL STATE AND INSTALL

function getCurrentIStartSignalState() {
  if (!window.CONVERSATION_V2_I_START_SIGNAL) {
    window.CONVERSATION_V2_I_START_SIGNAL = {
      pending: false
    };
  }

  return window.CONVERSATION_V2_I_START_SIGNAL;
}


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
// END BLOCK 7600: I FIRST SIGNAL CUE
// ============================================================================


// ============================================================================
// 🟩 BLOCK 8000: INTEGRATION AND USER SUPPORT (W=8 SUPPORT, X=0 ROOT, Y=0 INTEGRATION, Z=0 BASE)

// 🟦 BLOCK 8100: LOCAL USER SETTINGS (W=8 SUPPORT, X=1 SETTINGS, Y=0 LOCAL USER, Z=0 BASE)
// Purpose: Restore all user-configurable settings on app start.
// ============================================================================

const CONVERSATION_V2_SETTINGS_KEY =
  'gongbooConversationV2SettingsV2';


function getConversationSettings() {
// ============================================================================
// 🟦 BLOCK 8150: SETTINGS PERSISTENCE (W=8 SUPPORT, X=1 SETTINGS, Y=5 PERSISTENCE, Z=0 BASE)
// ============================================================================
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


// ============================================================================
// 🟦 BLOCK 8170: SETTINGS SAVE
// ============================================================================

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
// 🟦 BLOCK 8190: SETTINGS RESTORE
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


// SUB BLOCK 8195: SETTINGS RESTORE AND STORAGE INSTALL

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
// 🟦 BLOCK 8180: SETTINGS STORAGE INSTALL
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
// END BLOCK 8100: LOCAL USER SETTINGS
// ============================================================================


// ============================================================================
// 🟦 BLOCK 8200: SPEAKER TO BIBLE PERSON LINK (W=8 SUPPORT, X=2 BIBLE, Y=0 SPEAKER LINK, Z=0 BASE)
// Purpose: Open verified Bible person details without changing Role Play.
// ============================================================================

const CONVERSATION_V2_BIBLE_LINKS_URL =
  'https://yxudhflyxuztvzaiunva.supabase.co/rest/v1/' +
  'conversation_name_bible_links';

const CONVERSATION_V2_BIBLE_BASE_URL =
  'https://bibleofgongboo.github.io/biblenew/';


// ============================================================================
// 🟦 BLOCK 8210: BIBLE LINK KEY AND SPEAKER NAME
// ============================================================================

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
// 🟦 BLOCK 8250: BIBLE LINK LOADING
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
// 🟦 BLOCK 8270: BIBLE SPEAKER DECORATION
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
// 🟦 BLOCK 8290: BIBLE PERSON OPEN AND INSTALL
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
// END BLOCK 8200: SPEAKER TO BIBLE PERSON LINK
// ============================================================================


// ============================================================================
// 🟦 BLOCK 8300: ANDROID TTS WORD BOUNDARY LISTENER (W=8 SUPPORT, X=3 ANDROID, Y=0 TTS BOUNDARY, Z=0 BASE)
// Purpose: Receive Android native TTS word positions for the active sentence.
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
// END BLOCK 8300: ANDROID TTS WORD BOUNDARY LISTENER
// ============================================================================



// ============================================================================
// 🟦 BLOCK 8400: SYSTEM URL SETTINGS (W=8 SUPPORT, X=4 EXTERNAL, Y=0 SYSTEM URL, Z=0 BASE)
// Purpose: Change every external system URL only in this one object.
// ============================================================================

const CONVERSATION_V2_SYSTEM_URLS = {
  conversation:
    'https://bibleofgongboo.github.io/conversation/',

  bible:
    'https://bibleofgongboo.github.io/biblenew/',

  easyLearning:
    'https://bibleofgongboo.github.io/anne/',

  license:
    'https://biblegongboo.github.io/license/app/'
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
// END BLOCK 8400: SYSTEM URL SETTINGS
// ============================================================================


// ============================================================================
// 🟦 BLOCK 8500: KEYBOARD AND CONTROL SUPPORT (W=8 SUPPORT, X=5 INPUT, Y=0 KEYBOARD, Z=0 BASE)

// SUB BLOCK 8500: SPACE PLAY / STOP TOGGLE
// Purpose: SPACE toggles normal PLAY and STOP outside input controls.
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
// END BLOCK 8500: SPACE PLAY / STOP TOGGLE
// ============================================================================


// ============================================================================
// 🟦 BLOCK 8600: LEFT / RIGHT CONVERSATION NAVIGATION (W=8 SUPPORT, X=6 INPUT, Y=0 ARROW NAV, Z=0 BASE)
// Purpose: ArrowLeft = PREV, ArrowRight = NEXT outside input controls.
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
        document.getElementById(buttonId);

      if (!button || button.disabled) {
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
// END BLOCK 8600: LEFT / RIGHT CONVERSATION NAVIGATION
// ============================================================================

// ============================================================================
// 🟦 BLOCK 7700: PRACTICE RESET (W=7 PRACTICE, X=7 RESET, Y=0 SESSION, Z=0 BASE)
// Purpose: Clear PASS / RETRY / MIC results and keep the selected yellow turn.
// ============================================================================

function resetCurrentPracticeSession() {
  var targetTurn =
    getCurrentRoleTargetTurn();

  stopCurrentPsgPlay();
  stopCurrentRolePlay();
  stopCurrentMicRecognition();

  resetCurrentRolePlayResults();
  clearCurrentSpeakingCard();

  selectCurrentRoleTurn(targetTurn);

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
// END BLOCK 7700: PRACTICE RESET
// ============================================================================



// ============================================================================
// 🟦 BLOCK 8700: CONTROL TOOLTIP AND LEGACY LOOP DISABLE (W=8 SUPPORT, X=7 UI, Y=0 TOOLTIP/LOOP, Z=0 BASE)
// Purpose: Show short hover help and disable the old LOOP control.
// ============================================================================

function setCurrentControlTooltip(
  id,
  message
) {
  var button =
    document.getElementById(id);

  if (!button) {
    return;
  }

  button.setAttribute(
    'title',
    message
  );

  button.setAttribute(
    'aria-label',
    message
  );
}


function disableCurrentLegacyLoopControl() {
  var button =
    document.getElementById(
      'playLoopToggle'
    );

  window.CONVERSATION_V2_LOOP_PLAY =
    false;

  if (!button) {
    return;
  }

  button.disabled = true;

  button.setAttribute(
    'aria-disabled',
    'true'
  );

  button.setAttribute(
    'title',
    'Use CONTINUE: REPEAT instead.'
  );

  button.textContent =
    '↻ OFF';
}


function installCurrentControlTooltips() {
  setCurrentControlTooltip(
    'playModeToggleButton',
    'Choose who begins Role Play: COMPUTER or I FIRST.'
  );

  setCurrentControlTooltip(
    'practiceStartStopButton',
    'Start or stop the selected practice.'
  );

  setCurrentControlTooltip(
    'practiceModeToggleButton',
    'Choose ROLE PLAY or FOLLOW UP practice.'
  );

  setCurrentControlTooltip(
    'continueNextButton',
    'Choose OFF, REPEAT, or NEXT after the final sentence.'
  );

  setCurrentControlTooltip(
    'practiceResetButton',
    'Clear PASS, RETRY, and microphone results.'
  );

  setCurrentControlTooltip(
    'chunkButton',
    'Show or hide the selected sentence chunk.'
  );

  disableCurrentLegacyLoopControl();
}


if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    installCurrentControlTooltips,
    { once: true }
  );
} else {
  installCurrentControlTooltips();
}

// ============================================================================
// END BLOCK 8700: CONTROL TOOLTIP AND LEGACY LOOP DISABLE
// ============================================================================
