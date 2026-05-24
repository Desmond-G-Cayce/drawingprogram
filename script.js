
// Create drawing canvas
const drawingCanvas = document.getElementById('drawingCanvas');
drawingCanvas.width = 800;
drawingCanvas.height = 800;
drawingCanvas.id = 'drawingCanvas';
var drawingCtx = drawingCanvas.getContext("2d");

// Get undo button variable and disable it (nothing to undo yet)
var undoButton = document.getElementById('undoButton');
undoButton.disabled = true;

// Reset canvas to start
resetCanvas();

var customCursor = document.getElementById('customCursor');
document.getElementById('canvasDiv').appendChild(customCursor);

// Set up drawing info
var drawingInfo = {
    isMouseDown: false,
    brushSize: 25,
    oldX: null, 
    oldY: null,
    palette: [
        '#FFFFFF',
        '#C0C0C0',
        '#808080',
        '#404040',
        '#1A1A2E',
        '#FFF8E7',
        '#E63946',
        '#F4841E',
        '#F9C22E',
        '#FF6B6B',
        '#D64161',
        '#C9A84C',
        '#48CAE4',
        '#264FC4',
        '#5C4BA8',
        '#9B59B6',
        '#52D9B8',
        '#14747C',
        '#D4A574',
        '#A0522D',
        '#3A7D44',
        '#7C8B47',
        '#B7410E',
        '#8AAE92',
        '#39FF14',
        '#FF10A4',
        '#1B7DFF',
        '#CAEF45',
        '#C71585',
        '#00FFFF',
        '#C9B8E8',
        '#FFCAD4',
        '#B0D4F1',
        '#ACE1AF',
        '#FFCBA4',
        '#DDA0DD',
    ],
    savedStates: [],
};


// Create palette buttons
var paletteButtons = [];
for (var i = 0; i < drawingInfo.palette.length; i++) {
    paletteButtons.push(document.createElement('button'));
    paletteButtons[i].setAttribute('class', 'colorButton');
    paletteButtons[i].style = 'background-color: ' + drawingInfo.palette[i];
    paletteButtons[i].setAttribute('onclick', 'changeColor(' + i + ')');
    document.getElementById('paletteButtons').appendChild(paletteButtons[i]);
}

// Select first color by default
changeColor(0);

function changeColor(id) {
    for (var b of paletteButtons) {
        // Reset other buttons
        b.setAttribute('class', 'colorButton');
    }
    drawingCtx.strokeStyle = drawingInfo.palette[id];
    paletteButtons[id].setAttribute('class', 'colorButton selectedColor');
}

// Drawing functions 
function drawBrush(newX, newY) {
    // If oldX or oldY are null, we don't draw bc the mouse moved out of the canvas. But we still want to set them to non null values bc the mouse is in now
    if (drawingInfo.oldY !== null || drawingInfo.oldX !== null) {
        drawingCtx.lineWidth = drawingInfo.brushSize;
        drawingCtx.lineCap = 'round';
        drawingCtx.beginPath();
        drawingCtx.moveTo(drawingInfo.oldX, drawingInfo.oldY);
        drawingCtx.lineTo(newX, newY);
        drawingCtx.stroke();
        drawingCtx.closePath();
    }
    drawingInfo.oldX = newX;
    drawingInfo.oldY = newY;
}


function drawStart(x, y) {
    drawingInfo.oldX = x;
    drawingInfo.oldY = y;
    drawingCtx.lineWidth = drawingInfo.brushSize;
    drawingCtx.beginPath();
    drawingCtx.moveTo(x, y);
    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
    drawingCtx.closePath();
}

// Undo/redo stuff

// saves canvas state to drawingInfo.savedStates
function saveCState() {
    drawingCanvas.toBlob(function(blob) {
        drawingInfo.savedStates.push(createImageBitmap(blob));

        if (drawingInfo.savedStates.length >= 2) {
            undoButton.disabled = false; // there's something to undo now, enable the button
        }
    }, 'image/png'); // This will push a Promise, not an ImageBitmap. We can resolve the Promise using .then() in loadCState()
}

// loads promise to canvas. Returns whether it succeeded.
function loadCState(imagePromise) {
    imagePromise.then((resultImage) => {drawingCtx.drawImage(resultImage, 0, 0); return true;}, () => {return false;}); // Resolve the promise and draw to canvas
}

// Resets previous canvas states and then saves the current one.
function resetCState() {
    //drawingInfo.savedStates = [];
    saveCState();
}

// Undoes the last stroke
function undoStroke() {
    /*
    We need to load the second to last saved state, because the last saved state is just the current state.
    */
    var secondToLastSavedState = drawingInfo.savedStates[drawingInfo.savedStates.length - 2];
    loadCState(secondToLastSavedState);
    drawingInfo.savedStates.pop();
    if (drawingInfo.savedStates.length <= 1) {
        // We only have the current state saved, meaning there's nothing to undo. So we should disable the undo button
        undoButton.disabled = true;
    }
}

function saveLocal(drawingKey) {
    var dataURL = drawingCanvas.toDataURL('image/png');
    localStorage.setItem(drawingKey, dataURL);
}

function loadLocal(drawingKey) {
    var dataURL = localStorage.getItem(drawingKey);
    if (!dataURL) {
        console.warn('loadLocal: no data found for key', drawingKey);
        return false;
    }

    // Convert the stored data URL into an ImageBitmap, draw it, and push to savedStates (so undo works)
    var imagePromise = fetch(dataURL)
        .then(function(resp) { return resp.blob(); })
        .then(function(blob) { return createImageBitmap(blob); });

    imagePromise.then(function(imageBitmap) {
        drawingCtx.drawImage(imageBitmap, 0, 0);
    });

    resetCState();
}

function resetCanvas() {
    drawingCtx.fillStyle = 'white';
    drawingCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    resetCState();
}

function promptReset() {
    // Make user confirm if they want to reset
    if (confirm('Are you sure you want to reset?')) {
        resetCanvas();
    }
}

// Event listeners
drawingCanvas.addEventListener("pointerdown", function(e) {
    drawingInfo.isMouseDown = true;
    drawStart(e.offsetX, e.offsetY);
})

window.addEventListener('pointerdown', function(e){
    drawingInfo.isMouseDown = true;
})

window.addEventListener("pointerup", function(e) {
    drawingInfo.isMouseDown = false;
})

drawingCanvas.addEventListener('pointerup', function(e) {
    saveCState(); // stroke is done, so we save
})

drawingCanvas.addEventListener("pointermove", function(e) {
    if (drawingInfo.isMouseDown) {
        drawBrush(e.offsetX, e.offsetY);
    }
    
    customCursor.style.left = e.offsetX - drawingInfo.brushSize/2 + 'px';
    customCursor.style.top = e.offsetY - drawingInfo.brushSize/2 + 'px';
    customCursor.style.display = 'block';
})

drawingCanvas.addEventListener('pointerout', function(e) {
    drawingInfo.oldX = null;
    drawingInfo.oldY = null;
    // Prevents weirdness if mouse exits and re enters at a different spot

    // Hide custom cursor 
    customCursor.style.display = 'none';
})

// Brush size slider
var slider = document.getElementById('sizeSlider');
slider.value = drawingInfo.brushSize;
slider.addEventListener('input', function(e) {
    drawingInfo.brushSize = slider.value;
    customCursor.style.width = slider.value - 4 + 'px';
    customCursor.style.height = slider.value - 4 + 'px';
})