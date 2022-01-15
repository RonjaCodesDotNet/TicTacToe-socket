window.onload = () => {
  const socket = io();

  const cellElements = document.querySelectorAll("td");
  let usersSocketID;

  socket.on("connect", () => {
    usersSocketID = socket.id;
  });

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

  cellElements.forEach((cell) => {
    cell.addEventListener("click", (cell) => {
      const targetCell = cell.target;

      socket.emit("cell was clicked", targetCell.cellIndex);

      document.getElementById("gameBoard").classList.add("non-clickable");
    });
  });

  socket.on("turn change", (targetedCellIndex, currentTurn, activeSocket) => {
    const thisCell = document.getElementsByTagName("td")[targetedCellIndex];

    if (currentTurn == 0) {
      thisCell.innerHTML = "X";
    } else if (currentTurn == 1) {
      thisCell.innerHTML = "O";
    }

    thisCell.classList.add("non-clickable");

    //if () {};

    if (activeSocket != usersSocketID) {
      document.getElementById("gameBoard").classList.remove("non-clickable");
    }
  });
};
