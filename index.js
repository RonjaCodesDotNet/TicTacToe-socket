const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const path = require("path");
const { Server } = require("socket.io");
const io = new Server(server);
const port = process.env.PORT || 3000;

// Servar statiska tillgångar från "public"-mappen.
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

let connectedUsers = new Array();
let cellsMarkedX = new Array();
let cellsMarkedO = new Array();
let allClickedCells = new Array();
let whosTurnItIs = 0;
const allCells = 9;
const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [6, 4, 2],
];

// Anropas när någon ansluter till servern.
io.on("connection", (socket) => {
  // Tar emot information från klienten om vilket användarnamn denna socket valt.
  socket.on("new user connected", (chosenUsername) => {
    socket.user = chosenUsername;

    // Sparar socketens valda användarnamn i en array.
    connectedUsers.push(socket.user);

    console.log(`${socket.user} har anslutit till sidan.`);

    // Skickar array med alla anslutna sockets användarnamn och hur många sockets som för närvarande är anslutna till samtliga klienter.
    io.emit("connected to room", connectedUsers, connectedUsers.length);
  });

  // Tar emot information från klienten om att en cell precis har klickats.
  socket.on("cell was clicked", (targetedCellIndex) => {
    let markToAdd;

    // Lägger till cellens ID i en array för att ha koll på vilka celler som har klickats denna spelomgång.
    allClickedCells.push(targetedCellIndex);

    // Kontrollerar ifall alla tillgängliga celler har klickats på eller inte.
    if (isItADraw(allClickedCells)) {
      console.log("Spelet blev oavgjort!");

      // Informerar samtliga klienter om att spelet blev oavgjort.
      io.emit("itsADraw");
    } else {
      // Avgör ifall ett X eller O ska placeras på den klickade cellen.
      whosTurnItIs == 0 ? (markToAdd = "X") : (markToAdd = "O");

      // Skickar information till klienterna om vilken cell som har klickats, om X eller O ska placeras där, och vilken socket som klickade.
      io.emit("turn change", targetedCellIndex, markToAdd, socket.id);

      // Byter vems tur det är (0 = X, 1 = O) i sparad variabel.
      if (whosTurnItIs == 0) {
        cellsMarkedX.push(targetedCellIndex);
        whosTurnItIs = 1;
      } else {
        cellsMarkedO.push(targetedCellIndex);
        whosTurnItIs = 0;
      }

      // Kontrollerar ifall X har vunnit.
      if (didSomeoneWin(cellsMarkedX)) {
        console.log("X vann spelet!");

        // Skickar information till klienterna ifall spelare X har vunnit med användarnamnet på den socket som för närvarande är spelare X.
        io.emit("PlayerXWon", socket.user);
        // Kontrollerar ifall O har vunnit.
      } else if (didSomeoneWin(cellsMarkedO)) {
        console.log("O vann spelet!");

        // Skickar information till klienterna ifall spelare O har vunnit med användarnamnet på den socket som för närvarande är spelare O.
        io.emit("PlayerOWon", socket.user);
      }
    }
  });

  // Tar emot en förfrågan från klienten om att starta om spelet.
  socket.on("restart game request", () => {
    // Nollställer alla spelvariabler på serversidan för att kunna starta ett nytt spel.
    cellsMarkedX = [];
    cellsMarkedO = [];
    allClickedCells = [];
    whosTurnItIs = 0;

    console.log("Spelet startas om!");

    // Skickar information till samtliga klienter om att spelet har nollställts på serversidan.
    io.emit("game restarted");
  });

  // Anropas när någon kopplar ifrån servern.
  socket.on("disconnect", () => {
    console.log(`${socket.user} har kopplat från sidan.`);

    // Filtrerar arrayen och behåller alla som inte är den aktuella socketens användarnamn.
    connectedUsers = connectedUsers.filter((item) => item !== socket.user);

    // Skickar array med alla anslutna sockets användarnamn och hur många sockets som för närvarande är anslutna till klienten.
    io.emit("connected to room", connectedUsers, connectedUsers.length);
  });

  // Returnerar "true" ifall någon av de sparade arraysen i winningCombinations-arrayen matchar den inmatade array med celler som markerats med antingen X eller O.
  function didSomeoneWin(arrayXsOrOs) {
    return winningCombinations.some((combinations) => {
      return combinations.every((winItem) => {
        return arrayXsOrOs.includes(winItem);
      });
    });
  }

  // Returnerar "true" ifall antalet celler som har klickats är lika med det totala antalet tillgängliga celler.
  function isItADraw(arrayClickedCells) {
    return arrayClickedCells.length == allCells;
  }
});

server.listen(port, () => console.log(`Listening on *:${port}`));
