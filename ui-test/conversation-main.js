// SUBBLOCK 0000 : CONVERSATION CONFIG

(function(){

  var CONVERSATION_CONFIG = {

    restUrl:
      'https://yxudhflyxuztvzaiunva.supabase.co/rest/v1/conversation',

    publishableKey:
      'sb_publishable_9Kg6bvsSqZzOGMavBG3_1w_WO6WGbGB'
  };


// SUBBLOCK 0500 : DB LOAD

  async function loadFirstConversation(){

    var url =
      CONVERSATION_CONFIG.restUrl +
      '?select=' +
      encodeURIComponent(
        'ID,LNG,GROUP,CATEGORY,SUBCATEGORY,DIALOGUE_TITLE,DIALOGUE,HELP'
      ) +
      '&LNG=eq.EN' +
      '&order=ID.asc' +
      '&limit=1';


    var response =
      await fetch(
        url,
        {
          method:'GET',

          headers:{
            'apikey':
              CONVERSATION_CONFIG.publishableKey,

            'Authorization':
              'Bearer ' +
              CONVERSATION_CONFIG.publishableKey,

            'Accept':
              'application/json'
          }
        }
      );


    var text =
      await response.text();


    if(!response.ok){

      throw new Error(
        'Conversation DB Error ' +
        response.status +
        ': ' +
        text
      );
    }


    var rows =
      text
        ? JSON.parse(text)
        : [];


    return rows[0] || null;
  }


// SUBBLOCK 1000 : DIALOGUE PARSER

  function parseConversationDialogue(
    dialogue
  ){

    var source =
      String(
        dialogue || ''
      ).trim();


    if(!source){
      return [];
    }


    var lines =
      source
        .split(
          /<br\s*\/?>|\r?\n/gi
        )
        .map(
          function(line){

            return String(
              line || ''
            ).trim();
          }
        )
        .filter(Boolean);


    var turns = [];


    lines.forEach(
      function(line){

        var colonIndex =
          line.indexOf(':');


        if(colonIndex <= 0){
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


        if(
          !speaker ||
          !text
        ){
          return;
        }


        turns.push({

          speaker:
            speaker,

          text:
            text
        });
      }
    );


    return turns;
  }


// SUBBLOCK 1500 : TURN ELEMENT

  function createConversationTurn(
    turn,
    index
  ){

    var article =
      document.createElement(
        'article'
      );


    article.className =
      'gb-conversation-turn';


    if(index === 0){

      article.classList.add(
        'is-current'
      );
    }


    article.tabIndex =
      0;


    var speaker =
      document.createElement(
        'div'
      );


    speaker.className =
      'gb-speaker';


    speaker.textContent =
      turn.speaker;


    var text =
      document.createElement(
        'div'
      );


    text.className =
      'gb-text';


    text.textContent =
      turn.text;


    article.appendChild(
      speaker
    );


    article.appendChild(
      text
    );


    article.addEventListener(
      'click',
      function(){

        document
          .querySelectorAll(
            '.gb-conversation-turn'
          )
          .forEach(
            function(item){

              item.classList.remove(
                'is-current'
              );
            }
          );


        article.classList.add(
          'is-current'
        );
      }
    );


    return article;
  }


// SUBBLOCK 2000 : SCREEN RENDER

  function renderConversation(
    row
  ){

    var title =
      document.getElementById(
        'conversationTitle'
      );


    var host =
      document.getElementById(
        'conversationTurns'
      );


    if(
      !title ||
      !host
    ){
      return;
    }


    if(!row){

      title.textContent =
        'No Conversation Found';


      host.innerHTML =
        '';

      return;
    }


    title.textContent =
      row.DIALOGUE_TITLE ||
      row.ID ||
      'CONVERSATION';


    var turns =
      parseConversationDialogue(
        row.DIALOGUE
      );


    host.innerHTML =
      '';


    turns.forEach(
      function(turn,index){

        host.appendChild(
          createConversationTurn(
            turn,
            index
          )
        );
      }
    );


    console.log(
      '[CONVERSATION]',
      row.ID,
      turns.length +
      ' turns loaded'
    );
  }


// SUBBLOCK 2500 : ERROR DISPLAY

  function showConversationError(
    error
  ){

    console.error(
      '[CONVERSATION]',
      error
    );


    var title =
      document.getElementById(
        'conversationTitle'
      );


    var host =
      document.getElementById(
        'conversationTurns'
      );


    if(title){

      title.textContent =
        'Conversation Load Failed';
    }


    if(host){

      host.textContent =
        error.message ||
        'Unknown error';
    }
  }


// SUBBLOCK 3000 : STARTUP

  async function startConversation(){

    try{

      var row =
        await loadFirstConversation();


      renderConversation(
        row
      );

    }catch(error){

      showConversationError(
        error
      );
    }
  }


  if(
    document.readyState ===
    'loading'
  ){

    document.addEventListener(
      'DOMContentLoaded',
      startConversation
    );

  }else{

    startConversation();
  }

})();
