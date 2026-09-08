// SUBBLOCK 0300

(function(){

  var cardPairs = [
    ['systemButton','systemCard'],
    ['langButton','langCard'],
    ['playButton','playCard'],
    ['micButton','micCard'],
    ['moreButton','moreCard']
  ];


  function closeCards(exceptCard){

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

          closeCards(card);

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


  function bindToggle(id){

    var button =
      document.getElementById(id);

    if(!button){
      return;
    }

    button.addEventListener(
      'click',
      function(){

        var isOn =
          button.getAttribute(
            'aria-pressed'
          ) === 'true';

        button.setAttribute(
          'aria-pressed',
          isOn
            ? 'false'
            : 'true'
        );
      }
    );
  }


  bindToggle('repeatToggle');
  bindToggle('playAutoToggle');
  bindToggle('micAutoToggle');
  bindToggle('chunkButton');


  var psgButton =
    document.getElementById(
      'psgButton'
    );

  var extraTurns =
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

        extraTurns.forEach(
          function(turn){
            turn.hidden = !isOn;
          }
        );
      }
    );
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
    passRange.addEventListener(
      'input',
      function(){

        passValue.textContent =
          passRange.value +
          '%';
      }
    );
  }


  var speed =
    1.00;

  var speedValue =
    document.getElementById(
      'speedValue'
    );

  function renderSpeed(){

    if(!speedValue){
      return;
    }

    speedValue.textContent =
      speed.toFixed(2) +
      '×';
  }


  var speedMinus =
    document.querySelector(
      '[data-speed-minus]'
    );

  var speedPlus =
    document.querySelector(
      '[data-speed-plus]'
    );

  if(speedMinus){

    speedMinus.addEventListener(
      'click',
      function(){

        speed =
          Math.max(
            0.25,
            speed - 0.25
          );

        renderSpeed();
      }
    );
  }


  if(speedPlus){

    speedPlus.addEventListener(
      'click',
      function(){

        speed =
          Math.min(
            2.00,
            speed + 0.25
          );

        renderSpeed();
      }
    );
  }


  var delay =
    2.0;

  var delayValue =
    document.getElementById(
      'delayValue'
    );

  function renderDelay(){

    if(!delayValue){
      return;
    }

    delayValue.textContent =
      delay.toFixed(1) +
      's';
  }


  var delayMinus =
    document.querySelector(
      '[data-delay-minus]'
    );

  var delayPlus =
    document.querySelector(
      '[data-delay-plus]'
    );

  if(delayMinus){

    delayMinus.addEventListener(
      'click',
      function(){

        delay =
          Math.max(
            0.5,
            delay - 0.5
          );

        renderDelay();
      }
    );
  }


  if(delayPlus){

    delayPlus.addEventListener(
      'click',
      function(){

        delay =
          Math.min(
            5.0,
            delay + 0.5
          );

        renderDelay();
      }
    );
  }


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


  renderSpeed();
  renderDelay();

})();
