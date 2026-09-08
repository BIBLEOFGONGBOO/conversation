(function(){

  var cards = [
    {
      button:
        document.getElementById(
          'systemButton'
        ),

      card:
        document.getElementById(
          'systemCard'
        )
    },

    {
      button:
        document.getElementById(
          'langButton'
        ),

      card:
        document.getElementById(
          'langCard'
        )
    },

    {
      button:
        document.getElementById(
          'playButton'
        ),

      card:
        document.getElementById(
          'playCard'
        )
    },

    {
      button:
        document.getElementById(
          'micButton'
        ),

      card:
        document.getElementById(
          'micCard'
        )
    },

    {
      button:
        document.getElementById(
          'moreButton'
        ),

      card:
        document.getElementById(
          'moreCard'
        )
    }
  ];


  function closeAllCards(
    exceptCard
  ){

    cards.forEach(
      function(item){

        if(
          !item.card ||
          item.card === exceptCard
        ){
          return;
        }

        item.card.hidden = true;

        if(item.button){
          item.button.setAttribute(
            'aria-expanded',
            'false'
          );

          item.button.classList.remove(
            'is-active'
          );
        }
      }
    );
  }


  function toggleCard(
    button,
    card
  ){

    if(
      !button ||
      !card
    ){
      return;
    }

    var willOpen =
      card.hidden;

    closeAllCards(
      card
    );

    card.hidden =
      !willOpen;

    button.setAttribute(
      'aria-expanded',
      willOpen
        ? 'true'
        : 'false'
    );

    button.classList.toggle(
      'is-active',
      willOpen
    );
  }


  cards.forEach(
    function(item){

      if(
        !item.button ||
        !item.card
      ){
        return;
      }

      item.button.addEventListener(
        'click',
        function(event){

          event.stopPropagation();

          toggleCard(
            item.button,
            item.card
          );
        }
      );

      item.card.addEventListener(
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

      closeAllCards();
    }
  );


  document.addEventListener(
    'keydown',
    function(event){

      if(
        event.key === 'Escape'
      ){
        closeAllCards();
      }
    }
  );


  var psgButton =
    document.getElementById(
      'psgButton'
    );

  var psgExtraTurns =
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

        psgButton.classList.toggle(
          'is-active',
          isOn
        );

        psgExtraTurns.forEach(
          function(turn){

            turn.hidden =
              !isOn;
          }
        );
      }
    );
  }


  var helpButton =
    document.getElementById(
      'helpButton'
    );

  var helpStrip =
    document.getElementById(
      'helpStrip'
    );

  if(
    helpButton &&
    helpStrip
  ){

    helpButton.addEventListener(
      'click',
      function(){

        var isOn =
          helpButton.getAttribute(
            'aria-pressed'
          ) === 'true';

        isOn =
          !isOn;

        helpButton.setAttribute(
          'aria-pressed',
          isOn
            ? 'true'
            : 'false'
        );

        helpButton.classList.toggle(
          'is-active',
          isOn
        );

        helpStrip.hidden =
          !isOn;
      }
    );
  }


  function bindSwitch(
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

        var isOn =
          button.getAttribute(
            'aria-pressed'
          ) === 'true';

        isOn =
          !isOn;

        button.setAttribute(
          'aria-pressed',
          isOn
            ? 'true'
            : 'false'
        );

        button.classList.toggle(
          'is-active',
          isOn
        );

        button.textContent =
          isOn
            ? 'ON'
            : 'OFF';
      }
    );
  }


  bindSwitch(
    'repeatToggle'
  );

  bindSwitch(
    'playAutoToggle'
  );

  bindSwitch(
    'micAutoToggle'
  );


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


  var delayValue =
    document.getElementById(
      'delayValue'
    );

  var delay =
    2.0;

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


  var speedValue =
    document.getElementById(
      'speedValue'
    );

  var speed =
    1.0;

  function renderSpeed(){

    if(!speedValue){
      return;
    }

    speedValue.textContent =
      speed.toFixed(1) +
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
            0.5,
            speed - 0.1
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
            2.0,
            speed + 0.1
          );

        renderSpeed();
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
            function(otherTurn){

              otherTurn.classList.remove(
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
            function(otherButton){

              otherButton.classList.remove(
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


  renderDelay();
  renderSpeed();

})();
