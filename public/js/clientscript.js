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
    if (
      !/[^a-zA-ZåäöÅÄÖ]/.test(usernameInput) &&
      usernameInput.length >= 2 &&
      usernameInput.length <= 15
    ) {
      // Skickar att {användarnamn} har anslutit (om användarnamnet godkänns) till servern.
      socket.emit("new user connected", usernameInput);

      // Döljer formulär-div.
      formContent.style.display = "none";

      // Visar rums-div och spel-div. Börjar som "display: none" i style.css-filen.
      roomContent.style.display = "block";
      gameContent.style.display = "block";

      // Varnar användaren ifall användarnamnet innehåller otillåtna tecken eller är för långt/kort.
    } else if (/[^a-zA-ZåäöÅÄÖ]/.test(usernameInput)) {
      alert(
        "Användarnamnet får endast innehålla tecknena A-Ö. Vänligen försök igen."
      );
    } else if (usernameInput.length < 2 || usernameInput.length > 15) {
      alert(
        "Användarnamnet måste innehålla minst 2 och max 15 tecken. Vänligen försök igen."
      );
    }

    // Återställer formulärets inmatningsfält.
    document.getElementById("inputUsername").value = "";
  });

  // Tar emot array med alla anslutna användares användarnamn från servern.
  socket.on("connected to room", (everyoneHere, howManyAreHere) => {
    let connectedUsers = "";

    for (item in everyoneHere) {
      connectedUsers += "<li>" + everyoneHere[item] + "</li>";
    }

    // Postar arrayen i webbläsaren för alla användare.
    document.getElementById("usersInRoom").innerHTML = connectedUsers;

    /* Gör spelet oklickbart om antalet spelare är fler eller färre än två.
    ATT GÖRA: Ändra så att max två användare kan vara anslutna samtidigt, annars kan spelare X bli spelare O när en tredje användare kopplar ifrån. */
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

      // Skickar information om vilken cell som precis klickades till servern.
      socket.emit("cell was clicked", targetCell.cellIndex);
    });
  });

  // Tar emot från servern.
  socket.on("turn change", (targetedCellIndex, currentMark, activeSocket) => {
    const thisCell = document.getElementsByTagName("td")[targetedCellIndex];

    thisCell.innerHTML = currentMark;

    thisCell.classList.add("non-clickable");

    if (activeSocket != usersSocketID) {
      gameBoard.classList.remove("non-clickable");
    }
  });

  // Tar emot från servern.
  socket.on("itsADraw", () => {
    finishedGameMessage.innerText = "Spelet är oavgjort!";

    gameContent.style.display = "none";
    finishedContent.style.display = "block";
  });

  // Tar emot från servern.
  socket.on("PlayerXWon", (usernamePlayerX) => {
    finishedGameMessage.innerText = `${usernamePlayerX} är vinnaren!`;

    gameContent.style.display = "none";
    finishedContent.style.display = "block";
  });

  // Tar emot från servern.
  socket.on("PlayerOWon", (usernamePlayerO) => {
    finishedGameMessage.innerText = `${usernamePlayerO} är vinnaren!`;

    gameContent.style.display = "none";
    finishedContent.style.display = "block";
  });

  playAgainButton.addEventListener("click", () => {
    // Skickar till servern.
    socket.emit("restart game request");
  });

  // Tar emot från servern.
  socket.on("game restarted", () => {
    cellElements.forEach((cell) => {
      cell.classList.remove("non-clickable");
      cell.innerHTML = "";
    });

    finishedGameMessage.innerText = "";
    finishedContent.style.display = "none";
    gameContent.style.display = "block";
  });
};
