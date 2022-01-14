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
let whosTurnItIs = 0;

// Anropas när någon ansluter till servern.
io.on("connection", (socket) => {
  socket.on("new user connected", (chosenUsername) => {
    socket.user = chosenUsername;

    connectedUsers.push(socket.user);

    console.log(`${socket.user} has connected.`);

    io.emit("connected to room", connectedUsers);
  });

  // ...
  socket.on("cell was clicked", (targetedCellsCellIndex) => {
    console.log(targetedCellsCellIndex);
    io.emit("turn change", targetedCellsCellIndex, whosTurnItIs);

    if (whosTurnItIs == 0) {
      whosTurnItIs = 1;
    } else if (whosTurnItIs == 1) {
      whosTurnItIs = 0;
    }
  });

  // Anropas när någon kopplar ifrån servern.
  socket.on("disconnect", () => {
    console.log(`${socket.user} has disconnected.`);

    // Filtrerar arrayen och behåller alla som inte är den aktuella användaren.
    connectedUsers = connectedUsers.filter((item) => item !== socket.user);

    // Skickar array med alla anslutna användare till klienten.
    io.emit("connected to room", connectedUsers);
  });
});

server.listen(port, () => console.log(`Listening on *:${port}`));
