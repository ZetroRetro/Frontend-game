const MARK_SYMB = "(¤)";
const MINE_SYMB = "}x{";

const Menu = document.getElementById("menu");
const Game = document.getElementById("game");

const muteButton = document.getElementById("muteButton");
const backgroundAudio = document.getElementById("backgroundAudio");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const difficultyGroup = document.getElementsByName("difficulty_g");

const gameBoard = document.getElementById("gameBoard");

let board = [];
let gameValues = {
  gameEnded: false,
  firstMine: true,
  curDifficulty: "d1",

  numRows: 8,
  numCols: 8,
  numMines: 10,
  clearCellRemain: 54,

  board: [],
};

const difficultyValues = {
  d1: {
    // easy
    numRows: 8,
    numCols: 8,
    numMines: 10,
  },
  d2: {
    // normal
    numRows: 16,
    numCols: 10,
    numMines: 30,
  },
  d3: {
    // hard
    numRows: 24,
    numCols: 16,
    numMines: 50,
  },
  d4: {
    // impossible
    numRows: 24,
    numCols: 16,
    numMines: 70,
  },
};

function clearValues() {
  gameValues.gameEnded = false;
  gameValues.firstMine = true;
  gameValues.curDifficulty = "d1";

  gameValues.numRows = 8;
  gameValues.numCols = 8;
  gameValues.numMines = 10;
  gameValues.clearCellRemain = 54;
  gameValues.board = [];
}

function build_default_mute() {
  mutedByDefault = true;

  backgroundAudio.muted = mutedByDefault;
  muteButton.classList.add(mutedByDefault ? "sound-muted" : "sound-unmuted");
}

function initializeBoard() {
  gameValues.clearCellRemain =
    gameValues.numCols * gameValues.numRows - gameValues.numMines;

  for (let i = 0; i < gameValues.numRows; i++) {
    board[i] = [];
    for (let j = 0; j < gameValues.numCols; j++) {
      board[i][j] = {
        isMine: false,
        marked: false,
        revealed: false,
        count: 0,
      };
    }
  }

  console.log(board);

  // Place mines randomly
  let minesPlaced = 0;
  while (minesPlaced < gameValues.numMines) {
    const row = Math.floor(Math.random() * gameValues.numRows);
    const col = Math.floor(Math.random() * gameValues.numCols);
    if (!board[row][col].isMine) {
      board[row][col].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate counts
  for (let i = 0; i < gameValues.numRows; i++) {
    for (let j = 0; j < gameValues.numCols; j++) {
      if (!board[i][j].isMine) {
        let count = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const ni = i + dx;
            const nj = j + dy;
            if (
              ni >= 0 &&
              ni < gameValues.numRows &&
              nj >= 0 &&
              nj < gameValues.numCols &&
              board[ni][nj].isMine
            ) {
              count++;
            }
          }
        }
        board[i][j].count = count;
      }
    }
  }
}

function revealCell(row, col) {
  if (
    row < 0 ||
    row >= gameValues.numRows ||
    col < 0 ||
    col >= gameValues.numCols ||
    board[row][col].revealed ||
    gameValues.gameEnded
  ) {
    return;
  }
  if (board[row][col].marked) {
    markCell(row, col);
    return;
  }

  board[row][col].revealed = true;

  if (board[row][col].isMine) {
    // Handle game over
    endGame();
    return;
  }
  gameValues.clearCellRemain -= 1;
  if (gameValues.clearCellRemain == 0) {
    endGame();
  } else if (board[row][col].count === 0) {
    // If cell has no mines nearby,
    // Reveal adjacent cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        revealCell(row + dx, col + dy);
      }
    }
  }

  renderBoard();
}

function markCell(row, col) {
  if (
    row < 0 ||
    row >= gameValues.numRows ||
    col < 0 ||
    col >= gameValues.numCols ||
    board[row][col].revealed ||
    gameValues.gameEnded
  ) {
    return;
  }

  board[row][col].marked = !board[row][col].marked;

  renderBoard();
}

function revealMines() {
  for (let i = 0; i < gameValues.numRows; i++) {
    for (let j = 0; j < gameValues.numCols; j++) {
      if (board[i][j].isMine) {
        board[i][j].revealed = true;
      }
    }
  }

  renderBoard();
}

function renderBoard() {
  gameBoard.innerHTML = "";

  for (let i = 0; i < gameValues.numRows; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < gameValues.numCols; j++) {
      const cell = document.createElement("td");
      cell.classList.add("cell");
      if (board[i][j].revealed) {
        cell.classList.add("revealed");
        if (board[i][j].isMine) {
          cell.classList.add("mine");
          cell.textContent = MINE_SYMB;
        } else if (board[i][j].count > 0) {
          cell.textContent = board[i][j].count;
        }
      } else if (board[i][j].marked) {
        cell.classList.add("marked");
        cell.textContent = MARK_SYMB;
      } else {
        cell.classList.add("unrevealed");
      }
      cell.addEventListener("click", () => revealCell(i, j));
      cell.addEventListener("contextmenu", function (e) {
        markCell(i, j);
        e.preventDefault();
      });
      row.appendChild(cell);
    }
    gameBoard.appendChild(row);
  }
}

function swapScene(id_name) {
  Menu.classList.remove("hidden");
  Game.classList.remove("hidden");

  if (Menu.id != id_name) {
    Menu.classList.add("hidden");
  }
  if (Game.id != id_name) {
    Game.classList.add("hidden");
  }
}

function fetchDifficulty() {
  let selected_difficulty = difficultyGroup[0].id;
  for (var i = 0; i < difficultyGroup.length; i++) {
    if (difficultyGroup[i].checked) {
      selected_difficulty = difficultyGroup[i].id;
    }
  }

  selected_difficulty = difficultyValues[selected_difficulty];

  gameValues.numCols = selected_difficulty.numCols;
  gameValues.numRows = selected_difficulty.numRows;
  gameValues.numMines = selected_difficulty.numMines;
}

function startGame() {
  clearValues();
  fetchDifficulty();
  swapScene("game");
  initializeBoard();
  renderBoard();
}

function checkWin() {
  return gameValues.clearCellRemain == 0;
}

function endGame() {
  gameValues.gameEnded = true;

  if (checkWin()) {
    let name = prompt(
      "Congratulations TOVARISCH! You found all traitors. \nWrite your name:",
      "_anonymous_"
    );
  } else {
    revealMines();

    let name = prompt(
      "Games are OVER! You will pay for you mistakes. \nWrite your name:",
      "_anonymous_"
    );
  }
}

startButton.addEventListener("click", () => startGame());
restartButton.addEventListener("click", () => startGame());
muteButton.addEventListener("click", function () {
  if (backgroundAudio.paused) {
    backgroundAudio.play();
  }
  muteButton.classList.remove("sound-muted");
  muteButton.classList.remove("sound-unmuted");
  if (backgroundAudio.muted) {
    muteButton.classList.add("sound-unmuted");
    backgroundAudio.muted = false;
  } else {
    muteButton.classList.add("sound-muted");
    backgroundAudio.muted = true;
  }
});

build_default_mute();
