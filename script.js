let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let isDrawing = false;
let startX, startY, mouseX, mouseY;
let figures = [];
let drawMode = 'line'; // Default mode is drawing lines
let currentColor = 'white';

function changeColor(color) {
    currentColor = color;
}
// Bresenham's line algorithm
function line(x0, y0, x1, y1, color = currentColor) {
    ctx.strokeStyle = color;
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        setPixel(x0, y0, color);
        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
}

// Draw square using lines
function square(x0, y0, length, xSign, ySign, color = currentColor) {
    let x1 = x0 + length * xSign;
    let y1 = y0 + length * ySign;

    line(x0, y0, x1, y0, color); // Top line
    line(x1, y0, x1, y1, color); // Right line
    line(x1, y1, x0, y1, color); // Bottom line
    line(x0, y1, x0, y0, color); // Left line
}

function rectangle(x0, y0, width, height, color = currentColor) {
    let x1 = x0 + width;
    let y1 = y0 + height;

    line(x0, y0, x1, y0, color); // Top line
    line(x1, y0, x1, y1, color); // Right line
    line(x1, y1, x0, y1, color); // Bottom line
    line(x0, y1, x0, y0, color); // Left line
}

function drawCircle(xc, yc, x, y, color = currentColor) {
    setPixel(xc + x, yc + y, color);
    setPixel(xc - x, yc + y, color);
    setPixel(xc + x, yc - y, color);
    setPixel(xc - x, yc - y, color);
    setPixel(xc + y, yc + x, color);
    setPixel(xc - y, yc + x, color);
    setPixel(xc + y, yc - x, color);
    setPixel(xc - y, yc - x, color);
}

function circle(xc, yc, r, color = currentColor) {
    let x = 0, y = r;
    let d = 3 - 2 * r;
    drawCircle(xc, yc, x, y, color);
    while (y >= x) {
        x++;
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 4 * x + 6;
        }
        drawCircle(xc, yc, x, y, color);
    }
}

function setPixel(x, y, color = currentColor) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibuja todas las figuras almacenadas
    for (let i = 0; i < figures.length; i++) {
        let figure = figures[i];
        let color = figure.color; // Obtiene el color de la figura
        ctx.fillStyle = color; // Establece el color para dibujar la figura

        // Dibuja la figura según su tipo
        if (figure.type === 'line') {
            line(figure.startX, figure.startY, figure.endX, figure.endY, color);
        } else if (figure.type === 'square') {
            let length = figure.length;
            let xSign = figure.xSign;
            let ySign = figure.ySign;
            square(figure.startX, figure.startY, length, xSign, ySign, color);
        } else if (figure.type === 'rectangle') {
            let width = figure.width;
            let height = figure.height;
            rectangle(figure.startX, figure.startY, width, height, color);
        } else if (figure.type === 'circle') {
            circle(figure.xc, figure.yc, figure.radius, color);
        }
    }

    // Dibuja la figura actual que se está dibujando
    if (isDrawing) {
        let color = currentColor; // Usa el color actual
        ctx.fillStyle = color;
        if (drawMode === 'line') {
            line(startX, startY, mouseX, mouseY, color);
        } else if (drawMode === 'square') {
            let lengthX = Math.abs(mouseX - startX);
            let lengthY = Math.abs(mouseY - startY);
            let length = Math.min(lengthX, lengthY);
            let xSign = Math.sign(mouseX - startX);
            let ySign = Math.sign(mouseY - startY);
            square(startX, startY, length, xSign, ySign, color);
        } else if (drawMode === 'rectangle') {
            let width = Math.abs(mouseX - startX);
            let height = Math.abs(mouseY - startY);
            let x = Math.min(mouseX, startX);
            let y = Math.min(mouseY, startY);
            rectangle(x, y, width, height, color);
        } else if (drawMode === 'circle') {
            let radius = Math.sqrt(Math.pow(mouseX - startX, 2) + Math.pow(mouseY - startY, 2));
            circle(startX, startY, radius, color);
        }
    }
}

canvas.addEventListener('mousedown', function (e) {
    isDrawing = true;
    startX = e.clientX - canvas.getBoundingClientRect().left;
    startY = e.clientY - canvas.getBoundingClientRect().top;
});

canvas.addEventListener('mousemove', function (e) {
    if (!isDrawing) return;
    mouseX = e.clientX - canvas.getBoundingClientRect().left;
    mouseY = e.clientY - canvas.getBoundingClientRect().top;
    draw();
});

canvas.addEventListener('mouseup', function () {
    if (isDrawing) {
        isDrawing = false;
        let color = currentColor; // Almacena el color actual
        if (drawMode === 'line') {
            figures.push({ type: 'line', startX: startX, startY: startY, endX: mouseX, endY: mouseY, color: color });
        } else if (drawMode === 'square') {
            let lengthX = Math.abs(mouseX - startX);
            let lengthY = Math.abs(mouseY - startY);
            let length = Math.min(lengthX, lengthY);
            let xSign = Math.sign(mouseX - startX);
            let ySign = Math.sign(mouseY - startY);
            figures.push({ type: 'square', startX: startX, startY: startY, length: length, xSign: xSign, ySign: ySign, color: color });
        } else if (drawMode === 'rectangle') {
            let width = Math.abs(mouseX - startX);
            let height = Math.abs(mouseY - startY);
            let x = Math.min(mouseX, startX);
            let y = Math.min(mouseY, startY);
            figures.push({ type: 'rectangle', startX: x, startY: y, width: width, height: height, color: color });
        } else if (drawMode === 'circle') {
            let radius = Math.sqrt(Math.pow(mouseX - startX, 2) + Math.pow(mouseY - startY, 2));
            figures.push({ type: 'circle', xc: startX, yc: startY, radius: radius, color: color });
        }
    }
});
