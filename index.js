const { Console } = require("console");
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
const allCells = [0, 1, 2, 3, 4, 5, 6, 7, 8];

// Anropas när någon ansluter till servern.
io.on("connection", (socket) => {
  socket.on("new user connected", (chosenUsername) => {
    socket.user = chosenUsername;

    connectedUsers.push(socket.user);

    console.log(`${socket.user} har anslutit till sidan.`);

    io.emit("connected to room", connectedUsers, connectedUsers.length);
  });

  // ...
  socket.on("cell was clicked", (targetedCellIndex) => {
    let markToAdd;

    allClickedCells.push(targetedCellIndex);

    if (isItADraw(allClickedCells)) {
      console.log("Spelet blev oavgjort!");

      io.emit("itsADraw");
    } else {
      whosTurnItIs == 0 ? (markToAdd = "X") : (markToAdd = "O");

      io.emit("turn change", targetedCellIndex, markToAdd, socket.id);

      if (whosTurnItIs == 0) {
        cellsMarkedX.push(targetedCellIndex);
        whosTurnItIs = 1;
      } else {
        cellsMarkedO.push(targetedCellIndex);
        whosTurnItIs = 0;
      }

      // Kontrollerar vinst!
      if (didSomeoneWin(cellsMarkedX)) {
        console.log("X vann spelet!");

        io.emit("PlayerXWon", socket.user);
      } else if (didSomeoneWin(cellsMarkedO)) {
        console.log("O vann spelet!");

        io.emit("PlayerOWon", socket.user);
      }
    }
  });

  socket.on("restart game request", () => {
    cellsMarkedX = [];
    cellsMarkedO = [];
    allClickedCells = [];
    whosTurnItIs = 0;

    console.log("Spelet startas om!");

    io.emit("game restarted");
  });

  // Anropas när någon kopplar ifrån servern.
  socket.on("disconnect", () => {
    console.log(`${socket.user} har kopplat från sidan.`);

    // Filtrerar arrayen och behåller alla som inte är den aktuella användaren.
    connectedUsers = connectedUsers.filter((item) => item !== socket.user);

    // Skickar array med alla anslutna användare till klienten.
    io.emit("connected to room", connectedUsers, connectedUsers.length);
  });

  function didSomeoneWin(arrayXsOrOs) {
    return winningCombinations.some((combinations) => {
      return combinations.every((winItem) => {
        return arrayXsOrOs.includes(winItem);
      });
    });
  }

  function isItADraw(arrayClickedCells) {
    return allCells.every((drawItem) => {
      return arrayClickedCells.includes(drawItem);
    });
  }
});

server.listen(port, () => console.log(`Listening on *:${port}`));
