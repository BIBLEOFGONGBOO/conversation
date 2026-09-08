// SUBBLOCK 0300

(function(){

  var cardPairs = [
    ['systemButton','systemCard'],
    ['langButton','langCard'],
    ['playButton','playCard'],
    ['micButton','micCard'],
    ['moreButton','moreCard']
  ];


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


  document.addEventListener(
    'keydown',
    function(event){

      if(
        event.key === 'Escape'
      ){
        closeCards();
      }
    }
  );


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


  function bindExclusiveToggle(
    firstId,
    secondId
  ){

    var first =
      document.getElementById(
        firstId
      );

    var second =
      document.getElementById(
        secondId
      );

    if(
      !first ||
      !second
    ){
      return;
    }

    first.addEventListener(
      'click',
      function(){

        first.setAttribute(
          'aria-pressed',
          'true'
        );

        second.setAttribute(
          'aria-pressed',
          'false'
        );
      }
    );

    second.addEventListener(
      'click',
      function(){

        second.setAttribute(
          'aria-pressed',
          'true'
        );

        first.setAttribute(
          'aria-pressed',
          'false'
        );
      }
    );
  }


  bindExclusiveToggle(
    'playStartButton',
    'playStopButton'
  );

  bindExclusiveToggle(
    'micStartButton',
    'micStopButton'
  );


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

        isOn = !isOn;

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

})();
