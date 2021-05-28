// Create the agent. Runs when the page opens.
function createAgent () {
  // Setup participant and get node id
  dallinger.createAgent()
  .done(function (resp) {
    my_node_id = resp.node.id;
    store.set("my_node_id", my_node_id);
    my_network_id = resp.node.network_id;
    dallinger.storage.set("my_network_id", my_network_id);
    numTransmissions = 0; // Set to 0. Once its 5, move on.
    Score = 0; // Updated throughout and saved as a cookie for later
    scoreShown = 0; // Determines whether advanceExperiment shows the score or advances at the end of the game
    advanceExperiment();
  })
  .fail(function (rejection) {
    dallinger.allowExit();
    dallinger.error(rejection);
  });
}

function Questionaire() {
  dallinger.allowExit();
  dallinger.goToPage('survey');
}

// Function for response submission. Works for both PGG and spite choices
function submitResponse(response, type) {
  myDonation = response;
  dallinger.createInfo(my_node_id, {
    contents: response,
    info_type: type
  }).done(function(resp) {
    if(type == "Donation"){
      hideExperiment();
      setTimeout(function(){
        checkTransmit();
      }, 1500); // This code is a little risky. Watch to see if this causes trouble. Better solution would be some sort of check which recalls the function if it doesn't find anything
    } else {
      dallinger.allowExit();
      dallinger.goToPage('followup');
    }
  }).fail(function (rejection) {
    Questionaire();
  });
}

// Hide the experiment
function hideExperiment(){
  $("#headerone").hide();
  $("#Waiting").show();
  $("#PGGrow").hide();
  $("#Submitbutton").hide(); 
}

// Check for transmissions from the pog
function checkTransmit (){
  dallinger.getTransmissions(my_node_id, {
    status: "pending"
  }) 
  .done(function (resp){
    transmissions = resp.transmissions;
    if(transmissions.length > 0){
      processTransmit(transmissions);
    } else {
      setTimeout(function(){
        checkTransmit();
      }, 1000);
    }
  });
}

function processTransmit(transmissions){
  numTransmissions = numTransmissions + 1;
  summary_id = transmissions[0].info_id;
  dallinger.getInfo(my_node_id, summary_id)
  .done(function(resp) {
    summary = JSON.parse(resp.info.contents);
    pot = summary.total_earnings;
    donation = summary.pog_donation;
    totalScore = summary.score_in_pgg;
    showResults(pot, donation);
  });
}

function showResults(pot, donation){
  Score = Score + parseInt(pot); 
  $("#Waiting").hide();
  $("#you").html("From your 10 points, you sent: " + myDonation);
  $("#you").show();
  $("#partner").html("The bot returned: " + donation);
  $("#partner").show();
  $("#earnings").html("This round, you scored: "+ pot);
  $("#earnings").show();
  $("#OK").show();
}

// // Generates a random number within the specified range
// function getRndInteger(minimum, maximum) {
// return Math.floor(Math.random() * (maximum - minimum)) + minimum;
// }

function advanceExperiment() {
  $("#partner").hide();
  $("#earnings").hide();
  $("#OK").hide();
  $("#you").hide();
  $("#Waiting").show();
  if(numTransmissions < 6){
    $("#Waiting").hide(); 
    $("#headerone").show();
    $("#PGGrow").show();
    $("#Submitbutton").show();
  } else {
    if(scoreShown == 0){
      $("#Waiting").hide();
      dallinger.storage.set("Score", Score);
      showScore();
    } else {
      $("#Waiting").html("Waiting for your partner to finish...");
      $("#Waiting").show();
      setTimeout(function(){
        dallinger.goToPage('instructions/Interim');
      }, 6000);
    }  
  }
}

function showScore(){
  $("#OK").show();
  $("#earnings").html("Your total score is: " + Score);
  $("#earnings").show();
  scoreShown = 1;
}

// Interim page code
function randomiseCondition() {
  my_node_id = dallinger.storage.get("my_node_id");
  conditions = new Array (
    "Asocial",
    "Conspite",
    "Conalt",
    "Connothing",
    "Topspite",
    "Topalt",
    "Topnothing"
  );
  selection = conditions[Math.floor(Math.random() * conditions.length)];
  dallinger.createInfo(my_node_id, {
    contents: selection,
    info_type: 'Condition'
  });
  return selection;
}

function allocatePartners(condition){
  $("#Allocate").hide();
  $("#Instructions").hide();
  $("#Waiting").show();
  setTimeout(function(){
    $("#Txt").html("You will act as the decider.");
    $("#Decider").show();
    $("#Next").show();
    $("#Sliderrow").show();
    $("#Scorerow").show();
    if(condition !== "Asocial"){
      $("#social").show();
    }
  }, 4000)
}

function showNothing(){
  $("#Whatdo").html("Not change their partner’s score");
  $("#Whatdo").show();
  $("#OK").show();
}

function showReduce(){
  $("#Whatdo").html("Reduce their partner’s score");
  $("#Whatdo").show();
  $("#OK").show();
}

function showAlt() {
  $("#Whatdo").html("Increase their partner’s score");
  $("#Whatdo").show();
  $("#OK").show();
}

function advanceSpite() {
  $("#Socialinfo").hide();
  $("#spitecont").show();
  $("#OK").hide();
  $("#Whatdo").hide();
}

function startSpite(condition) {
  my_node_id = dallinger.storage.get("my_node_id");
  Score = parseInt($("#Score").html());
  $("#YourScore").html(dallinger.storage.get("Score"));
  yourScore = parseInt($("#YourScore").html());

  if(condition.includes("Con")){
    $("#Socialinfo").html("The majority of previous participants in this game chose to:")
    if(condition.includes("spite")){
      showReduce();
    } else if(condition.includes("alt")){
      showAlt();
    } else if(condition.includes("nothing")){
      showNothing();
    }

  } else if(condition.includes("Top")){
    $("#Socialinfo").html("The highest scoring participant in previous games chose to:")
    if(condition.includes("spite")){
      showReduce();
    } else if(condition.includes("alt")){
      showAlt();
    } else if(condition.includes("nothing")){
      showNothing();
    }

  } else {
    $("#Socialinfo").hide();
    $("#spitecont").show();
  }
}

function updatePoints(value) {
  // Code for slider to update points displayed
  value = parseInt(value);
  if(value > 0){
    $("#Change").html("Your partner's score will increase by:")
  } else if(value < 0){
    $("#Change").html("Your partner's score will decrease by:")
  } else if(value == 0){
    $("#Change").html("Your partner's score will not change")
  }
  $("#Score").html(Score + (Math.abs(value) * 3));
  $("#YourScore").html(yourScore - Math.abs(value));
}

function removeMe(){
  // Removes participants from the experiment
  my_node_id = dallinger.storage.get("my_node_id");
  dallinger.createInfo(my_node_id, {
    contents: "Remove me please",
    info_type: 'Drop'
  }).done(function(resp){
    self.close();
  })
}

function submitFeedback(){
  // Submits participants responses on the followup page
  $("#submission").hide();
  my_node_id = dallinger.storage.get("my_node_id");
  var resps = {
    "Change" : $("#Change").val(),
    "Decide" :  $("#Decide").val(),
    "Others" :  $("#Others").val()
 };
 resps = JSON.stringify(resps); 
  dallinger.createInfo(my_node_id, {
    contents: resps,
    info_type: 'Feedback'
  }).done(function(resp){
    dallinger.goToPage("debrief")
  })
}