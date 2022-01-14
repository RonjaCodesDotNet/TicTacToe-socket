window.onload = () => {
  const socket = io();

  const cellElements = document.querySelectorAll("td");
  const playerX = "X";
  const playerO = "O";
  let playerXsTurn;

  document.getElementById("usernameForm").addEventListener("submit", (evt) => {
    evt.preventDefault();

    const usernameInput = document.getElementById("inputUsername").value;

    // Kontrollerar att användarnamnet endast innehåller bokstäver.
    if (
      !/[^a-zA-ZåäöÅÄÖ]/.test(usernameInput) &&
      usernameInput.length >= 2 &&
      usernameInput.length <= 15
    ) {
      socket.emit("new user connected", usernameInput);

      formContent.style.display = "none";

      // Börjar som "display: none" i style.css-filen.
      mainContent.style.display = "block";
    } else if (/[^a-zA-ZåäöÅÄÖ]/.test(usernameInput)) {
      alert(
        "Användarnamnet får endast innehålla tecknena A-Ö. Vänligen försök igen."
      );
    } else if (usernameInput.length < 2 || usernameInput.length > 15) {
      alert(
        "Användarnamnet måste innehålla minst 2 och max 15 tecken. Vänligen försök igen."
      );
    }

    document.getElementById("inputUsername").value = "";
  });

  // Tar emot array med alla användare anslutna (till det aktuella rummet) från servern och postar i webbläsaren.
  socket.on("connected to room", (everyoneHere) => {
    let connectedUsers = "";

    for (item in everyoneHere) {
      connectedUsers += "<li>" + everyoneHere[item] + "</li>";
    }

    usersInRoom.innerHTML = connectedUsers;
  });

  // Ser till att klick-eventet endast avfyras en gång per cell så att varje ruta endast kan väljas en gång per spel.
  cellElements.forEach((cell) => {
    cell.addEventListener("click", whenClicked, { once: true });
  });

  socket.on("mark and turn change", () => {
    cell.target.innerHTML = playerXsTurn ? playerX : playerO;
  });

  function whenClicked(evt) {
    const targetCell = evt.target;
    // Ändra så att byte av "turns" sker på servern.
    const currentPlayer = playerXsTurn ? playerX : playerO;

    socket.emit("cell was clicked");

    targetCell.innerHTML = currentPlayer;
  }
};
