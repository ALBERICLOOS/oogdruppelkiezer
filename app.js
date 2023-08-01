// hou bij welke antwoorden zijn ingegeven.
var answers = [];

//houd bij op welke oogdruppels we moeten selecteren. 
var selections = [];
var kiezer;

// hou voor elke vraag bij wat de vorige vraag is
var vorigeVragenNummers = [];

// Function to handle the answer and process the next question
function handleAnswer(jsonArray, currentQuestionIndex, vervolg, antwoord) {

    //add the antwoord to the answers
    answers[currentQuestionIndex-1] = antwoord;

    var newQuestionIndex;

    try{
        if (typeof vervolg == "number"){ // als er alleen een nummer staat springen we direct naar de vraag van het nummer
            newQuestionIndex = vervolg;
            displayQuestionAnswers(jsonArray, newQuestionIndex-1);
        }
        else{
            //evaluate vervolg 
            const replaced = vervolg.replace(/\((.*?)\)/g, (match, group) => {
                const modifiedGroup = group.replace(/\d+/g, (digits) => {
                  const index = parseInt(digits) - 1;
                  if (index >= 0 && index < answers.length) {
                    return `'${answers[index]}'`;
                  }
                  return digits; // If the index is not valid, leave the number unchanged.
                });
                return `(${modifiedGroup})`;
              });

              if(typeof eval(replaced) == 'number'){ // dit is het geval dus wanneer er effectief naar een nieuwe vraag gesprongen wordt
                newQuestionIndex= parseInt(eval(replaced));
                displayQuestionAnswers(jsonArray, newQuestionIndex-1);
              }

              else{ // TODO KLAAR
                if(replaced == 'klaar'){
                    klaar();
                }
                else{
                    showText(eval(replaced))
                    addTerugNaarStartKnop();
                }
              }
        }
    }
    catch(error){ // dit is voor als er iets fout is gelopen.
        showText("Er is iets foutgelopen, gelieve de pagina te herladen.")
     }
}

function updateVragenNummers(nummer){
    // add the number of the question
    if (!vorigeVragenNummers.includes(nummer)){
        vorigeVragenNummers.push(nummer);
    }
    else{
        vorigeVragenNummers.pop();
    }
}

function klaar(){
    const scores = new Object();
    const naamToElement = new Object();
    kiezer.forEach(element=>{
        scores[element.naam] = 0;
        naamToElement[element.naam] = element;
    })
    selections.forEach(selection=>{
        kiezer.forEach(element =>{
            if(element.hasOwnProperty(selection)){
                scores[element.naam] += 1
            }
        })
    })

    // Sort the array based on the values (numbers)
    const entries = Object.entries(scores);
    entries.sort((a, b) => b[1] - a[1]);

    // Display the sorted list
    const container = document.getElementById('questions-container');
    container.innerHTML = ''; // Clear previous content

    const resultaat = document.createElement("h2");
    resultaat.textContent = "Resultaat";
    container.appendChild(resultaat);
    
    // toon alleen de eerste 5
    for (const [name, number] of entries.slice(0,5)) {
        const infoList = document.createElement('li');
        infoList.textContent = name

        const ulMatch = document.createElement('div');
        ulMatch.textContent = "aantal matches: " + number;
        infoList.append(ulMatch);

        const ulFabrikant = document.createElement('div');
        ulFabrikant.textContent = "Fabrikant: " + naamToElement[name].fabrikant;
        infoList.append(ulFabrikant);

        const ulVerpakking = document.createElement('div');
        ulVerpakking.textContent = "Verpakking: " + naamToElement[name].verpakking;
        infoList.append(ulVerpakking);

        const ulInhoud = document.createElement('div');
        ulInhoud.textContent = "Inhoud: " + naamToElement[name].inhoud;
        infoList.append(ulInhoud);

        container.appendChild(infoList);
        }

    addTerugNaarStartKnop();
}

function addTerugNaarStartKnop() {
    const container = document.getElementById('questions-container');
    const terugNaarStartKnop = document.createElement("button");
    terugNaarStartKnop.textContent = "Terug naar start";
    container.appendChild(terugNaarStartKnop);
  
    terugNaarStartKnop.addEventListener('click', () => {
      const startPage = document.getElementById("startPage");
      const questionPage = document.getElementById("questions-container");
      startPage.style.display = "block";
      questionPage.style.display = "none";
      answers = [];
      selections = [];
      vorigeVragenNummers = [];
    });
  }
  


// toont text in h1 formaat en verwijdert al de rest. 
function showText(text){
    const container = document.getElementById('questions-container');
    container.innerHTML = ''; // Clear previous content

    const textDiv = document.createElement('h1');
    textDiv.textContent = text;
    container.appendChild(textDiv);
}

// Function to display the questions and answers
function displayQuestionAnswers(jsonArray, currentQuestionIndex) {
    const container = document.getElementById('questions-container');
    container.innerHTML = ''; // Clear previous content

    // krijg het antwoord via de index, deze is niet per se gelijk aan het nummer van de vraag
    var currentQuestion;
    var currentAnswers = [];

    jsonArray.forEach(element => {
        if (element.nr && element.nr == currentQuestionIndex+1){
            if(element.vraag){
                currentQuestion = element;
                updateVragenNummers(element.nr)
            }
            if(element.antwoord){
                currentAnswers.push(element);
            }
        }
    });
    
    // put the question above
    const questionDiv = document.createElement('h1');
    questionDiv.textContent = currentQuestion.nr + ". " + currentQuestion.vraag;
    container.appendChild(questionDiv);
    
    // put all the answers under the question
    const answerDiv = document.createElement('div');
    currentAnswers.forEach(answer => {
        const answerButton = document.createElement('button');
        answerButton.textContent = answer.antwoord;
        if (answer.selecteer){
            answerButton.addEventListener('click', () => selections.push(answer.selecteer))
        }
        answerButton.addEventListener('click', () => handleAnswer(jsonArray, currentQuestionIndex + 1, answer.vervolg, answer.antwoord));
        answerDiv.appendChild(answerButton);
    });
    container.appendChild(answerDiv);

    // put a back button under the answers
    if (currentQuestion.nr != 1){
        const backButton = document.createElement('button');
        backButton.textContent = "terug naar vorige vraag";
        // neemt voorlaatste element van alle vorige vragen. 
        backButton.addEventListener('click', () => handleAnswer(jsonArray, currentQuestionIndex, vorigeVragenNummers.slice(0,-1).pop(), 'nee'))
        container.appendChild(backButton);
    }
    
}


// Read the Excel file and display questions and answers when the page is loaded
const startButton = document.getElementById("startButton");
startButton.addEventListener("click", () => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "druppelkiezer.xlsx", true);
    xhr.responseType = "arraybuffer";

    xhr.onload = function (e) {
        const data = new Uint8Array(xhr.response);
        const workbook = XLSX.read(data, { type: "array" });

        // alles voor blad2 maw dus alles wat te maken heeft met de vragen
        const worksheet = workbook.Sheets["Blad2"];
        const jsonArray = XLSX.utils.sheet_to_json(worksheet);

        // alles wat te maken heeft met het effectief kiezen van de druppels
        const kiezerSheet = workbook.Sheets["Blad1"];
        kiezer = XLSX.utils.sheet_to_json(kiezerSheet)

        // installeer de antwoorden, zet alles op nee. 
        jsonArray.forEach(element=>{
            if(element.vraag){
                answers.push('nee');
            }
        })
        
        // Hide the start page and display the question page
        const startPage = document.getElementById("startPage");
        const questionPage = document.getElementById("questions-container");
        startPage.style.display = "none";
        questionPage.style.display = "block";

        displayQuestionAnswers(jsonArray, 0); // Start displaying questions from index 0
    };

    xhr.send();
});

