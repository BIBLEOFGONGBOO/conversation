// SUBBLOCK 0300

(function(){

  var cardPairs = [
    ['systemButton','systemCard'],
    ['langButton','langCard'],
    ['playButton','playCard'],
    ['micButton','micCard'],
    ['moreButton','moreCard']
  ];


  /* =========================================================
     CARD OPEN / CLOSE
  ========================================================= */

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


  /* =========================================================
     SIMPLE TOGGLE
  ========================================================= */

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


  /* =========================================================
     PLAY START / STOP
  ========================================================= */

  var playStartButton =
    document.getElementById(
      'playStartButton'
    );

  var playStopButton =
    document.getElementById(
      'playStopButton'
    );

  var playButton =
    document.getElementById(
      'playButton'
    );

  var isPlaying =
    false;


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

    if(playButton){

      playButton.classList.toggle(
        'is-playing',
        isPlaying
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


  /* =========================================================
     MIC START / STOP
  ========================================================= */

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


  /* =========================================================
     SPEED 0.25x ~ 2.00x
  ========================================================= */

  var speedRange =
    document.getElementById(
      'speedRange'
    );

  var speedValue =
    document.getElementById(
      'speedValue'
    );


  if(
    speedRange &&
    speedValue
  ){

    function renderSpeed(){

      speedValue.textContent =
        Number(
          speedRange.value
        ).toFixed(2) +
        '×';
    }

    speedRange.addEventListener(
      'input',
      renderSpeed
    );

    renderSpeed();
  }


  /* =========================================================
     MIC PASS
  ========================================================= */

  var passRange =
    document.getElementById(
      'passRange'
    );

  var passValue =
    document.getElementById(
      'passValue'
    );


  if(
    passRange &&
    passValue
  ){

    function renderPass(){

      passValue.textContent =
        passRange.value +
        '%';
    }

    passRange.addEventListener(
      'input',
      renderPass
    );

    renderPass();
  }


  /* =========================================================
     MIC DELAY 0 ~ 5.0s
  ========================================================= */

  var delayRange =
    document.getElementById(
      'delayRange'
    );

  var delayValue =
    document.getElementById(
      'delayValue'
    );


  if(
    delayRange &&
    delayValue
  ){

    function renderDelay(){

      delayValue.textContent =
        Number(
          delayRange.value
        ).toFixed(1) +
        's';
    }

    delayRange.addEventListener(
      'input',
      renderDelay
    );

    renderDelay();
  }


  /* =========================================================
     MODE
  ========================================================= */

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


  /* =========================================================
     CONVERSATION TURN
  ========================================================= */

  var turns =
    Array.from(
      document.querySelectorAll(
        '.gb-conversation-turn'
      )
    );

  var currentTurnIndex =
    0;


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


  /* =========================================================
     PSG
  ========================================================= */

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


  /* =========================================================
     PREV / NEXT
  ========================================================= */

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

    /*
      PSG ON
      = Passage / Full Scenario Mode
      = NEXT SCENARIO
    */

    if(
      isPsgOn()
    ){

      nextButton.textContent =
        'NEXT SCENARIO ▶';

      return;
    }


    /*
      PSG OFF
      마지막 Turn
      = NEXT SCENARIO
    */

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

    /*
      PSG ON에서는
      실제 시스템 연결 후
      다음 Scenario로 이동
    */

    if(
      isPsgOn()
    ){

      return;
    }


    /*
      마지막 Turn이면
      실제 시스템 연결 후
      다음 Scenario로 이동
    */

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


  /* =========================================================
     KEYBOARD
     LEFT  = PREV
     RIGHT = NEXT
     SPACE = PLAY / STOP
  ========================================================= */

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
        event.code === 'Space'
      ){

        event.preventDefault();

        setPlayState(
          !isPlaying
        );
      }
    }
  );


  /* =========================================================
     INITIAL
  ========================================================= */

  setPlayState(
    false
  );

  setMicState(
    false
  );

  setCurrentTurn(
    0
  );

})();
