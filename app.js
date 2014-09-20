var ROWS = 8, COLS = 8, MINES = 10, BOARD_WIDTH = 400, BOARD_HEIGHT = 400;
var IN_PROGRESS = "In progress...", WINNER = "You win!", LOSER = "You lose!";
var DIGGING = "Dig", FLAGGING = "Flag"; // selector options

var canvas, context, board, gameState, cheatCheckBox;
var cellWidth = BOARD_WIDTH / COLS;
var cellHeight = BOARD_HEIGHT / ROWS;

var clickedColor = "#ddd";
var unclickedColor = "#bbb";

window.addEventListener("load", function() {
  canvas = document.getElementById("gameCanvas");
  context = canvas.getContext("2d");
  cheatCheckBox = document.getElementById("cheatCheckBox");
  initGame();
});

function initGame() {
  MINES = document.getElementById("numMinesSelector").value;
  // add listener for canvas clicks
  canvas.addEventListener('click', clickHandler);
  // 8x8 grid with 40x40 cells
  board = [];
  for (r = 0; r < ROWS; r++) {
    board.push([]);
    for (c = 0; c < COLS; c++) {
      board[r][c] = {
        "beenClicked": false,
        "beenFlagged": false,
        "hasMine": false,
        "numAdjacent" : 0,
        "x": c*cellWidth,
        "y": r*cellHeight
      }
    }
  }
  placeMinesAndUpdateCount();
  gameState = {
    "minesVisible" : cheatCheckBox.checked,
    "status" : IN_PROGRESS,
    "action" : DIGGING
  }

  // add listener for cheats
  cheatCheckBox.onchange = function() {
    if (gameState.status == IN_PROGRESS) {
      gameState.minesVisible = cheatCheckBox.checked;
      if (gameState.minesVisible) {
        clearFlags();
      }
      step();
    }
  };

  step();
}

// Increments game state and animation
function step() {
  validate();
  drawBoard();
  drawStatus();
}

// updates status of game (winner/loser/in progress)
function validate() {
  // check for win/loss simulataneously
  var allCellsClicked = true;
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      var cell = board[r][c];
      if (cell.beenClicked && cell.hasMine) { // clicked cell with a mine
        gameState.status = LOSER;
        gameState.minesVisible = true; // reveal locations
        return;
      }
      if (!cell.beenClicked && !cell.hasMine) { // unclicked cell without a mine
        allCellsClicked = false;
      }
    }
  }
  if (allCellsClicked) {
    gameState.status = WINNER;
    gameState.minesVisible = true; // reveal locations
  } else {
    gameState.status = IN_PROGRESS;
  }
}

function clearFlags() {
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      board[r][c].beenFlagged = false;
    }
  }
}




/**
    Mine placement:
*/
function placeMinesAndUpdateCount() {
  for (var i = 0; i < MINES; i++) {
    var placed = false;
    while (!placed) {
      var mr = Math.floor(Math.random() * ROWS);
      var mc = Math.floor(Math.random() * COLS);
      if (board[mr][mc].hasMine) { // don't place on top of existing mine
        continue;
      } else {
        placed = true;
        board[mr][mc].hasMine = true;
        board[mr][mc].numAdjacent = 9;
      }
    }
  }
  updateAdjacentCount();
}

function updateAdjacentCount() {
  for (r = 0; r < ROWS; r++) {
    for (c = 0; c < COLS; c++) {
      var cell = board[r][c];
      if (cell.hasMine) {
        continue;
      }
      if (r > 0 && c > 0 && board[r-1][c-1].hasMine) {
        cell.numAdjacent++;
      }
      if (r > 0 && c < COLS-1 && board[r-1][c+1].hasMine) {
        cell.numAdjacent++;
      }
      if (r < ROWS-1 && c > 0 && board[r+1][c-1].hasMine) {
        cell.numAdjacent++;
      }
      if (r < ROWS-1 && c < ROWS-1 && board[r+1][c+1].hasMine) {
        cell.numAdjacent++;
      }
      if (r > 0 && board[r-1][c].hasMine) {
        cell.numAdjacent++;
      }
      if (c > 0 && board[r][c-1].hasMine) {
        cell.numAdjacent++;
      }
      if (r < ROWS-1 && board[r+1][c].hasMine) {
        cell.numAdjacent++;
      }
      if (c < COLS-1 && board[r][c+1].hasMine) {
        cell.numAdjacent++;
      }

    }
  }
}




/**
    Click handling:
*/
function clickHandler(e) {
  updateAction();
  if (gameState.status != IN_PROGRESS) { // don't allow interaction after game is over
    return;
  }
  var row = Math.floor(e.y/cellHeight);
  var col = Math.floor(e.x/cellWidth);
  if (gameState.action == DIGGING) {
    clickOnCell(row, col);
  } else { // flagging
    toggleFlag(row, col);
  }
  step();
}

function updateAction() {
  var actionSelector = document.getElementById("actionSelector");
  gameState.action = actionSelector.value;
}

function toggleFlag(row, col) {
  var cell = board[row][col];
  cell.beenFlagged = !cell.beenFlagged;
}

function clickOnCell(row, col) {
  var cell = board[row][col];
  if (cell.beenClicked || cell.beenFlagged) { // already clicked or flagged
    return;
  }
  cell.beenClicked = true;
  var locString = row+","+col; // unique string for hashing
  var visited = {locString: true}; // visited set
  expandClick(row,col, visited);
}

function expandClick(row, col, visited) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
    return;
  }
  var locString = row+","+col;
  if (visited[locString]) {
    return;
  } else {
    visited[locString] = 1;
  }
  var cell = board[row][col];
  if (cell.hasMine) {
    return;
  }
  if (cell.numAdjacent > 0) { // on a mine (9) or adjacent to mine (1-8)
    cell.beenClicked = true;
    return;
  }
  cell.beenClicked = true;

  expandClick(row+1, col, visited);
  expandClick(row-1, col, visited);
  expandClick(row+1, col+1, visited);
  expandClick(row+1, col-1, visited);
  expandClick(row-1, col+1, visited);
  expandClick(row-1, col-1, visited);
  expandClick(row, col+1, visited);
  expandClick(row, col-1, visited);
}



/**
    Animation functions:
*/
function drawStatus() {
  var statusLabel = document.getElementById("statusLabel");
  statusLabel.textContent = gameState.status;
}

function drawBoard() {
  drawCanvas();
  for (r = 0; r < ROWS; r++) {
    for (c = 0; c < COLS; c++) {
      drawCell(board[r][c]);
    }
  }
  drawLines();
}

// Assumption: game has not been lost
function drawCell(cell) {
  if (cell.beenClicked) { // clicked cells have lighter background
    context.fillStyle = clickedColor;
    context.fillRect(cell.x, cell.y, cellWidth, cellHeight);
    var numAdjacent = cell.numAdjacent;
    if (numAdjacent == 0) { // do not draw if 0 adjacent mines
      return;
    }
    switch(numAdjacent) {
      case 1: context.fillStyle = '#00f'; break; // blue
      case 2: context.fillStyle = '#2a2'; break; // green
      case 3: context.fillStyle = '#a22'; break; // red
      case 4: context.fillStyle = '#505'; break; // dark purple
      case 9: context.fillStyle = '#f00'; break; // bright red
      default: context.fillStyle = '#822'; break; // burgundy
    }
    context.font = "40pt Calibri";
    if (numAdjacent != 9) { // cell does not have a mine
      context.fillText(numAdjacent, cell.x + 10, cell.y + 40); // offset is hardcoded for the font
    } else { // cell has a mine
      context.fillText('X', cell.x + 10, cell.y + 40); // offset is hardcoded for the font
    }
  } else { // cell not clicked
    if (cell.beenFlagged) {
      // show flag
      context.font = "40pt Calibri";
      context.fillStyle = '#a22'; // red
      context.fillText('F', cell.x + 10, cell.y + 40); // offset is hardcoded for the font
    } else if (cell.hasMine && gameState.minesVisible) {
      // show mine when cheat is on
      context.font = "40pt Calibri";
      context.fillStyle = '#000'; // black
      context.fillText('X', cell.x + 10, cell.y + 40); // offset is hardcoded for the font
    } else {
      // show unclicked rect
      context.fillStyle = unclickedColor;
      context.fillRect(cell.x, cell.y, cellWidth, cellHeight);
    }
  } 
}

function drawLines() {
  for (r = 0; r <= ROWS; r++) {
    for (c = 0; c <= COLS; c++) {
      context.moveTo(0, r*cellHeight);
      context.lineTo(BOARD_WIDTH, r*cellHeight);
      context.moveTo(c*cellWidth, 0);
      context.lineTo(c*cellWidth, BOARD_HEIGHT);
      context.stroke();
    }
  }
}

function drawCanvas() {
  context.fillStyle = unclickedColor;
  context.fillRect(0, 0, 400, 400); // x, y, width, height
}
