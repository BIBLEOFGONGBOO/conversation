// SUBBLOCK 0000 : INIT / CONFIG

(function(){

  var cardPairs = [
    ['systemButton','systemCard'],
    ['langButton','langCard'],
    ['playButton','playCard'],
    ['micButton','micCard'],
    ['moreButton','moreCard']
  ];

  var isPlaying = false;

  var currentTurnIndex = 0;

  var turns =
    Array.from(
      document.querySelectorAll(
        '.gb-conversation-turn'
      )
    );


// SUBBLOCK 0500 : TOOLTIP CONFIG

  var tooltipMap = {

    systemButton:
      'Select learning system',

    psgButton:
      'Show or hide the full scenario',

    langButton:
      'Language settings',

    playButton:
      'Playback settings',

    micButton:
      'Microphone and pronunciation settings',

    moreButton:
      'More learning tools',

    repeatToggle:
      'Repeat playback',

    playAutoToggle:
      'Automatic playback',

    playStartButton:
      'Start playback',

    playStopButton:
      'Stop playback',

    micAutoToggle:
      'Automatically continue after pronunciation',

    micStartButton:
      'Start microphone recognition',

    micStopButton:
      'Stop recognition and score',

    chunkToggle:
      'Show or hide learning chunks',

    peopleButton:
      'Bible people',

    mapButton:
      'Bible map',

    prevButton:
      'Previous turn or scenario',

    nextButton:
      'Next turn or scenario'
  };


  Object.keys(
    tooltipMap
  ).forEach(
    function(id){

      var element =
        document.getElementById(
          id
        );

      if(!element){
        return;
      }

      element.setAttribute(
        'data-tooltip',
        tooltipMap[id]
      );

      element.setAttribute(
        'aria-label',
        tooltipMap[id]
      );
    }
  );


  document.querySelectorAll(
    '.gb-mode-button'
  ).forEach(
    function(button){

      var text =
        button.textContent.trim();

      var labelMap = {
        LRN:'Learning Mode',
        STD:'Study Mode',
        QZ:'Quiz Mode'
      };

      if(
        labelMap[text]
      ){
        button.setAttribute(
          'data-tooltip',
          labelMap[text]
        );
      }
    }
  );


// SUBBLOCK 1000 : CARD OPEN / CLOSE

  function closeCards(
    exceptCard
  ){

    cardPairs.forEach(
      function(pair){

        var button =
          document.getElementById(
            pair[0]
          );

        var card =
          document.getElementById(
            pair[1]
          );

        if(
          !button ||
          !card ||
          card === exceptCard
        ){
          return;
        }

        card.hidden = true;

        button.setAttribute(
          'aria-expanded',
          'false'
        );

        button.classList.remove(
          'is-active'
        );
      }
    );
  }


  cardPairs.forEach(
    function(pair){

      var button =
        document.getElementById(
          pair[0]
        );

      var card =
        document.getElementById(
          pair[1]
        );

      if(
        !button ||
        !card
      ){
        return;
      }

      button.addEventListener(
        'click',
        function(event){

          event.stopPropagation();

          var opening =
            card.hidden;

          closeCards(
            card
          );

          card.hidden =
            !opening;

          button.setAttribute(
            'aria-expanded',
            opening
              ? 'true'
              : 'false'
          );

          button.classList.toggle(
            'is-active',
            opening
          );
        }
      );

      card.addEventListener(
        'click',
        function(event){

          event.stopPropagation();
        }
      );
    }
  );


  document.addEventListener(
    'click',
    function(){

      closeCards();
    }
  );


// SUBBLOCK 1500 : SIMPLE TOGGLE CONTROL

  function bindToggle(
    id
  ){

    var button =
      document.getElementById(
        id
      );

    if(!button){
      return;
    }

    button.addEventListener(
      'click',
      function(){

        var current =
          button.getAttribute(
            'aria-pressed'
          ) === 'true';

        button.setAttribute(
          'aria-pressed',
          current
            ? 'false'
            : 'true'
        );
      }
    );
  }


  bindToggle(
    'repeatToggle'
  );

  bindToggle(
    'playAutoToggle'
  );

  bindToggle(
    'micAutoToggle'
  );

  bindToggle(
    'chunkToggle'
  );


// SUBBLOCK 2000 : PLAY START / STOP STATE

  var playStartButton =
    document.getElementById(
      'playStartButton'
    );

  var playStopButton =
    document.getElementById(
      'playStopButton'
    );


  function setPlayState(
    playing
  ){

    isPlaying =
      !!playing;

    if(playStartButton){

      playStartButton.setAttribute(
        'aria-pressed',
        isPlaying
          ? 'true'
          : 'false'
      );
    }

    if(playStopButton){

      playStopButton.setAttribute(
        'aria-pressed',
        isPlaying
          ? 'false'
          : 'true'
      );
    }
  }


  if(playStartButton){

    playStartButton.addEventListener(
      'click',
      function(){

        setPlayState(
          true
        );
      }
    );
  }


  if(playStopButton){

    playStopButton.addEventListener(
      'click',
      function(){

        setPlayState(
          false
        );
      }
    );
  }


// SUBBLOCK 2500 : MIC START / STOP STATE

  var micStartButton =
    document.getElementById(
      'micStartButton'
    );

  var micStopButton =
    document.getElementById(
      'micStopButton'
    );


  function setMicState(
    running
  ){

    if(micStartButton){

      micStartButton.setAttribute(
        'aria-pressed',
        running
          ? 'true'
          : 'false'
      );
    }

    if(micStopButton){

      micStopButton.setAttribute(
        'aria-pressed',
        running
          ? 'false'
          : 'true'
      );
    }
  }


  if(micStartButton){

    micStartButton.addEventListener(
      'click',
      function(){

        setMicState(
          true
        );
      }
    );
  }


  if(micStopButton){

    micStopButton.addEventListener(
      'click',
      function(){

        setMicState(
          false
        );
      }
    );
  }


// SUBBLOCK 3000 : SPEED SLIDER

  var speedRange =
    document.getElementById(
      'speedRange'
    );

  var speedValue =
    document.getElementById(
      'speedValue'
    );


  function renderSpeed(){

    if(
      !speedRange ||
      !speedValue
    ){
      return;
    }

    speedValue.textContent =
      Number(
        speedRange.value
      ).toFixed(2) +
      '×';
  }


  if(speedRange){

    speedRange.addEventListener(
      'input',
      renderSpeed
    );
  }


// SUBBLOCK 3500 : PASS / DELAY SLIDERS

  var passRange =
    document.getElementById(
      'passRange'
    );

  var passValue =
    document.getElementById(
      'passValue'
    );


  function renderPass(){

    if(
      !passRange ||
      !passValue
    ){
      return;
    }

    passValue.textContent =
      passRange.value +
      '%';
  }


  if(passRange){

    passRange.addEventListener(
      'input',
      renderPass
    );
  }


  var delayRange =
    document.getElementById(
      'delayRange'
    );

  var delayValue =
    document.getElementById(
      'delayValue'
    );


  function renderDelay(){

    if(
      !delayRange ||
      !delayValue
    ){
      return;
    }

    delayValue.textContent =
      Number(
        delayRange.value
      ).toFixed(1) +
      's';
  }


  if(delayRange){

    delayRange.addEventListener(
      'input',
      renderDelay
    );
  }


// SUBBLOCK 4000 : PSG CONTROL

  var psgButton =
    document.getElementById(
      'psgButton'
    );

  var psgExtra =
    document.querySelectorAll(
      '.gb-psg-extra'
    );


  function isPsgOn(){

    return !!(
      psgButton &&
      psgButton.getAttribute(
        'aria-pressed'
      ) === 'true'
    );
  }


  if(psgButton){

    psgButton.addEventListener(
      'click',
      function(){

        var newState =
          !isPsgOn();

        psgButton.setAttribute(
          'aria-pressed',
          newState
            ? 'true'
            : 'false'
        );

        psgExtra.forEach(
          function(turn){

            turn.hidden =
              !newState;
          }
        );

        updateNavigationLabels();
      }
    );
  }


// SUBBLOCK 4500 : MODE CONTROL

  var modeButtons =
    document.querySelectorAll(
      '.gb-mode-button:not(:disabled)'
    );


  modeButtons.forEach(
    function(button){

      button.addEventListener(
        'click',
        function(){

          modeButtons.forEach(
            function(item){

              item.classList.remove(
                'is-active'
              );
            }
          );

          button.classList.add(
            'is-active'
          );
        }
      );
    }
  );


// SUBBLOCK 5000 : TURN SELECTION

  function setCurrentTurn(
    index
  ){

    if(
      index < 0 ||
      index >= turns.length
    ){
      return;
    }

    currentTurnIndex =
      index;

    turns.forEach(
      function(turn,indexNumber){

        turn.classList.toggle(
          'is-current',
          indexNumber === currentTurnIndex
        );
      }
    );

    updateNavigationLabels();
  }


  turns.forEach(
    function(turn,index){

      turn.addEventListener(
        'click',
        function(){

          setCurrentTurn(
            index
          );
        }
      );
    }
  );


// SUBBLOCK 5500 : PREV / NEXT LABEL CONTROL

  var prevButton =
    document.getElementById(
      'prevButton'
    );

  var nextButton =
    document.getElementById(
      'nextButton'
    );


  function updateNavigationLabels(){

    if(!nextButton){
      return;
    }

    if(
      isPsgOn()
    ){
      nextButton.textContent =
        'NEXT SCENARIO ▶';

      return;
    }

    if(
      currentTurnIndex >=
      turns.length - 1
    ){
      nextButton.textContent =
        'NEXT SCENARIO ▶';
    }
    else{
      nextButton.textContent =
        'NEXT ▶';
    }
  }


// SUBBLOCK 6000 : PREV / NEXT ACTION

  function goPrev(){

    if(
      currentTurnIndex > 0
    ){
      setCurrentTurn(
        currentTurnIndex - 1
      );
    }
  }


  function goNext(){

    if(
      isPsgOn()
    ){
      return;
    }

    if(
      currentTurnIndex >=
      turns.length - 1
    ){
      return;
    }

    setCurrentTurn(
      currentTurnIndex + 1
    );
  }


  if(prevButton){

    prevButton.addEventListener(
      'click',
      goPrev
    );
  }


  if(nextButton){

    nextButton.addEventListener(
      'click',
      goNext
    );
  }


// SUBBLOCK 6500 : KEYBOARD TARGET CHECK

  function isTypingTarget(
    target
  ){

    if(!target){
      return false;
    }

    var tag =
      String(
        target.tagName || ''
      ).toUpperCase();

    return (
      tag === 'INPUT' ||
      tag === 'SELECT' ||
      tag === 'TEXTAREA' ||
      target.isContentEditable
    );
  }


// SUBBLOCK 7000 : KEYBOARD CONTROL

  document.addEventListener(
    'keydown',
    function(event){

      if(
        event.key === 'Escape'
      ){
        closeCards();

        return;
      }

      if(
        isTypingTarget(
          event.target
        )
      ){
        return;
      }

      if(
        event.key ===
        'ArrowLeft'
      ){
        event.preventDefault();

        goPrev();

        return;
      }

      if(
        event.key ===
        'ArrowRight'
      ){
        event.preventDefault();

        goNext();

        return;
      }

      if(
        event.code ===
        'Space'
      ){
        event.preventDefault();

        setPlayState(
          !isPlaying
        );
      }
    }
  );


// SUBBLOCK 7500 : INITIAL STATE

  renderSpeed();

  renderPass();

  renderDelay();

  setPlayState(
    false
  );

  setMicState(
    false
  );

  if(
    turns.length > 0
  ){
    setCurrentTurn(
      0
    );
  }
  else{
    updateNavigationLabels();
  }

})();
