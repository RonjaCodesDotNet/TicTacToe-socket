window.onload = () => {
  const socket = io();

  const usernameForm = document.getElementById("usernameForm");
  const cellElements = document.querySelectorAll("td");
  const gameBoard = document.getElementById("gameBoard");
  const finishedGameMessage = document.getElementById("finishedGameMessage");
  const playAgainButton = document.getElementById("playAgainButton");
  let usersSocketID;

  // Sparar användarens socket-ID i en variabel vid anslutning.
  socket.on("connect", () => {
    usersSocketID = socket.id;
  });

  // Lyssnar efter inlämning av användarnamnsformuläret (i framtiden även rums-ID).
  usernameForm.addEventListener("submit", (evt) => {
    // Hindrar sidan från att uppdateras.
    evt.preventDefault();

    const usernameInput = document.getElementById("inputUsername").value;

    // Kontrollerar att användarnamnet endast innehåller bokstäver och är tillräckligt långt/kort.
    if (usernameTest(usernameInput)) {
      // Skickar information till servern om att {användarnamn} har anslutit (om användarnamnet godkänns).
      socket.emit("new user connected", usernameInput);

      // Döljer formulär-div.
      formContent.style.display = "none";

      // Visar rums-div och spel-div. Börjar som "display: none" i style.css-filen.
      roomContent.style.display = "flex";
      gameContent.style.display = "block";

      // Varnar användaren ifall användarnamnet innehåller otillåtna tecken eller är för långt/kort.
    } else if (!usernameTest(usernameInput)) {
      alert(
        "Användarnamnet får endast innehålla tecknena A-Ö samt måste vara minst 3 och max 15 tecken långt. Vänligen försök igen."
      );
    }

    // Återställer formulärets inmatningsfält.
    document.getElementById("inputUsername").value = "";
  });

  // Tar emot array från servern med alla anslutna användares användarnamn.
  socket.on("connected to room", (everyoneHere, howManyAreHere) => {
    let connectedUsers = "";

    for (item in everyoneHere) {
      connectedUsers += "<li>" + everyoneHere[item] + "</li>";
    }

    // Postar arrayen i webbläsaren för alla användare.
    document.getElementById("usersInRoom").innerHTML = connectedUsers;

    // Gör spelet oklickbart om antalet spelare är fler eller färre än två.
    if (howManyAreHere == 2) {
      gameBoard.classList.remove("non-clickable");
    } else if (howManyAreHere > 2) {
      gameBoard.classList.add("non-clickable");

      alert("Max två användare kan spela samtidigt.");
    }
  });

  // Lyssnar efter en klick-händelse för varje individuell table cell.
  cellElements.forEach((cell) => {
    cell.addEventListener("click", (cell) => {
      const targetCell = cell.target;

      // Gör spelet oklickbart för samtliga spelare (tills servern har svarat, se socket.on("turn change") här nedan).
      gameBoard.classList.add("non-clickable");

      // Skickar information till servern om vilken cell som precis klickades.
      socket.emit("cell was clicked", targetCell.cellIndex);
    });
  });

  // Tar emot information från servern om vilken cell som har klickats, om X eller O ska placeras där, och vilken användare som klickade.
  socket.on("turn change", (targetedCellIndex, currentMark, activeSocket) => {
    const thisCell = document.getElementsByTagName("td")[targetedCellIndex];

    // Placerar ett X eller O i den klickade cellen.
    thisCell.innerHTML = "<p>" + currentMark + "</p>";

    // Gör cellen oklickbar tills spelet ev. startas om.
    thisCell.classList.add("non-clickable");

    // Gör spelet klickbart igen för spelaren som inte skickade senaste klick-eventet till servern.
    if (activeSocket != usersSocketID) {
      gameBoard.classList.remove("non-clickable");
    }
  });

  // Tar emot information från servern om att alla celler är klickade men ingen har vunnit.
  socket.on("itsADraw", () => {
    // Informerar spelarna om resultatet.
    finishedGameMessage.innerText = "Spelet är oavgjort!";

    // Döljer spelet och visar rutan som ger möjlighet att starta om spelet.
    gameContent.style.display = "none";
    finishedContent.style.display = "flex";
  });

  // Tar emot information från servern om att spelare X har vunnit.
  socket.on("PlayerXWon", (usernamePlayerX) => {
    // Informerar spelarna om resultatet.
    finishedGameMessage.innerText = `${usernamePlayerX} är vinnaren!`;

    // Döljer spelet och visar rutan som ger möjlighet att starta om spelet.
    gameContent.style.display = "none";
    finishedContent.style.display = "flex";
  });

  // Tar emot information från servern om att spelare O har vunnit.
  socket.on("PlayerOWon", (usernamePlayerO) => {
    // Informerar spelarna om resultatet.
    finishedGameMessage.innerText = `${usernamePlayerO} är vinnaren!`;

    // Döljer spelet och visar rutan som ger möjlighet att starta om spelet.
    gameContent.style.display = "none";
    finishedContent.style.display = "flex";
  });

  // Lyssnar efter en klick-händelse för "Spela igen"-knappen.
  playAgainButton.addEventListener("click", () => {
    // Skickar information till servern om att spelet ska startas om.
    socket.emit("restart game request");
  });

  // Tar emot information från servern om att spelet har startats om (nollställts) på serversidan.
  socket.on("game restarted", () => {
    // Nollställer spelet på klientsidan.
    cellElements.forEach((cell) => {
      cell.classList.remove("non-clickable");
      cell.innerHTML = "";
    });
    gameBoard.classList.remove("non-clickable");

    // Döljer rutan som ger möjlighet att starta om spelet och visar spelet.
    finishedGameMessage.innerText = "";
    finishedContent.style.display = "none";
    gameContent.style.display = "block";
  });

  // Returnerar "true" eller "false" beroende på om användarnamnet uppfyller villkoren om tillåtna tecken och min-/maxlängd eller inte.
  function usernameTest(userInput) {
    if (
      !/[^a-zA-ZåäöÅÄÖ]/.test(userInput) &&
      userInput.length >= 3 &&
      userInput.length <= 15
    ) {
      return true;
    } else if (/[^a-zA-ZåäöÅÄÖ]/.test(userInput)) {
      return false;
    } else if (userInput.length < 3 || userInput.length > 15) {
      return false;
    }
  }
};
