// SUBBLOCK 0000 : INIT / WRAPPER

(function(){

  var cardPairs = [
    ['systemButton','systemCard'],
    ['langButton','langCard'],
    ['playButton','playCard'],
    ['micButton','micCard'],
    ['moreButton','moreCard']
  ];


  /* SUBBLOCK 0500 : TOOLTIP TEXT */

  var tooltipMap = {

    systemButton:
      'Select learning system',

    psgButton:
      'Show or hide the full scenario',

    langButton:
      'Language settings',

    playButton:
      'Playback and voice settings',

    micButton:
      'Microphone and pronunciation settings',

    moreButton:
      'More learning tools',

    repeatToggle:
      'Repeat playback',

    playAutoToggle:
      'Automatically continue playback',

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
        document.getElementById(id);

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


  var modeTooltip = {
    LRN:'Learning Mode',
    STD:'Study Mode',
    QZ:'Quiz Mode'
  };


  document.querySelectorAll(
    '.gb-mode-button'
  ).forEach(

    function(button){

      var key =
        button.textContent.trim();

      if(
        modeTooltip[key]
      ){

        button.setAttribute(
          'data-tooltip',
          modeTooltip[key]
        );
      }
    }
  );


  document.querySelectorAll(
    '.gb-system-option'
  ).forEach(

    function(button){

      var name =
        button.querySelector(
          '.gb-system-name'
        );

      if(!name){
        return;
      }

      button.setAttribute(
        'data-tooltip',
        'Open ' +
        name.textContent.trim()
      );
    }
  );


  /* SUBBLOCK 1000 : CARD OPEN / CLOSE */

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

        card.hidden =
          true;

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


  /* SUBBLOCK 1500 : SIMPLE TOGGLE */

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


  /* SUBBLOCK 2000 : PLAY */

  var playStartButton =
    document.getElementById(
      'playStartButton'
    );

  var playStopButton =
    document.getElementById(
      'playStopButton'
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


  /* SUBBLOCK 2500 : MIC START / STOP */

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


  /* SUBBLOCK 3000 : SPEED */

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


  /* SUBBLOCK 3500 : PASS */

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


  /* SUBBLOCK 4000 : DELAY */

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


  /* SUBBLOCK 4500 : PSG */

  var psgButton =
    document.getElementById(
      'psgButton'
    );

  var psgExtra =
    document.querySelectorAll(
      '.gb-psg-extra'
    );


  if(psgButton){

    psgButton.addEventListener(

      'click',

      function(){

        var isOn =
          psgButton.getAttribute(
            'aria-pressed'
          ) === 'true';

        isOn =
          !isOn;

        psgButton.setAttribute(
          'aria-pressed',
          isOn
            ? 'true'
            : 'false'
        );

        psgExtra.forEach(

          function(turn){

            turn.hidden =
              !isOn;
          }
        );
      }
    );
  }


  /* SUBBLOCK 5000 : MODE */

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


  /* SUBBLOCK 5500 : TURN */

  var turns =
    document.querySelectorAll(
      '.gb-conversation-turn'
    );


  turns.forEach(

    function(turn){

      turn.addEventListener(

        'click',

        function(){

          turns.forEach(

            function(item){

              item.classList.remove(
                'is-current'
              );
            }
          );

          turn.classList.add(
            'is-current'
          );
        }
      );
    }
  );


  /* SUBBLOCK 6000 : KEYBOARD / SPACE PLAY-STOP */

  document.addEventListener(

    'keydown',

    function(event){

      var target =
        event.target;

      if(
        target &&
        (
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA'
        )
      ){
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


      if(
        event.key === 'Escape'
      ){

        closeCards();
      }
    }
  );


  // SUBBLOCK 6500 : INITIAL STATE

  setPlayState(
    false
  );

  setMicState(
    false
  );

})();
