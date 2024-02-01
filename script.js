let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let isDrawing = false;
let startX, startY, mouseX, mouseY;
let figures = [];
let drawMode = 'line'; // Default mode is drawing lines
let currentColor = 'white';
let currentThickness = 1;
let pencilPoints = []; // Array to store pencil points

function changeColor(color) {
    currentColor = color;
}

function changeThickness(thickness) {
    currentThickness = thickness;
}

function pencil(x, y, color = currentColor, thickness = currentThickness) {
    if (!isDrawing) return; // Salir si no se está dibujando
    pencilPoints.push({ x: x, y: y, color: color, thickness: thickness });
    draw(); // Volver a dibujar en cada movimiento del lápiz
}

function line(x0, y0, x1, y1, color = currentColor, thickness = currentThickness) {
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

// Draw square using lines
function square(x0, y0, length, xSign, ySign, color = currentColor, thickness = currentThickness) {
    let x1 = x0 + length * xSign;
    let y1 = y0 + length * ySign;

    line(x0, y0, x1, y0, color, thickness); // Top line
    line(x1, y0, x1, y1, color, thickness); // Right line
    line(x1, y1, x0, y1, color, thickness); // Bottom line
    line(x0, y1, x0, y0, color, thickness); // Left line
}

function rectangle(x0, y0, width, height, color = currentColor, thickness = currentThickness) {
    let x1 = x0 + width;
    let y1 = y0 + height;

    line(x0, y0, x1, y0, color, thickness); // Top line
    line(x1, y0, x1, y1, color, thickness); // Right line
    line(x1, y1, x0, y1, color, thickness); // Bottom line
    line(x0, y1, x0, y0, color, thickness); // Left line
}

function drawCircle(xc, yc, r, color = currentColor ,thickness = currentThickness) {
    let x = 0, y = r;
    let d = 3 - 2 * r;
    while (y >= x) {
        circle(xc, yc, x, y, color, thickness);
        x++;
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 4 * x + 6;
        }
    }
}

function circle(xc, yc, x, y, color, thickness) {
    setPixel(xc + x, yc + y, color, thickness);
    setPixel(xc - x, yc + y, color, thickness);
    setPixel(xc + x, yc - y, color, thickness);
    setPixel(xc - x, yc - y, color, thickness);
    setPixel(xc + y, yc + x, color, thickness);
    setPixel(xc - y, yc + x, color, thickness);
    setPixel(xc + y, yc - x, color, thickness);
    setPixel(xc - y, yc - x, color, thickness);
}

function ellipse(x0, y0, x1, y1, color = currentColor, thickness = currentThickness) {
    let a = Math.abs(x1 - x0);
    let b = Math.abs(y1 - y0);
    let b1 = b & 1; // values of diameter
    let dx = 4 * (1 - a) * b * b;
    let dy = 4 * (b1 + 1) * a * a; // error increment
    let err = dx + dy + b1 * a * a;
    let e2; // error of 1.step

    if (x0 > x1) {
        x0 = x1;
        x1 += a;
    } // if called with swapped points

    if (y0 > y1) y0 = y1; // .. exchange them
    y0 += (b + 1) / 2;
    y1 = y0 - b1; // starting pixel
    a *= 8 * a;
    b1 = 8 * b * b;

    do {
        setPixel(x1, y0, color, thickness); //   I. Quadrant 
        setPixel(x0, y0, color, thickness); //  II. Quadrant 
        setPixel(x0, y1, color, thickness); // III. Quadrant 
        setPixel(x1, y1, color, thickness); //  IV. Quadrant 
        e2 = 2 * err;
        if (e2 <= dy) {
            y0++;
            y1--;
            err += dy += a;
        } // y step 
        if (e2 >= dx || 2 * err > dy) {
            x0++;
            x1--;
            err += dx += b1;
        } // x step 
    } while (x0 <= x1);

    while (y0 - y1 < b) {
        setPixel(x0 - 1, y0, color, thickness); // -> finish tip of ellipse 
        setPixel(x1 + 1, y0++, color, thickness);
        setPixel(x0 - 1, y1, color, thickness);
        setPixel(x1 + 1, y1--, color, thickness);
    } 
}

function setPixel(x, y, color = currentColor, thickness = currentThickness) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, thickness, thickness);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar todas las figuras almacenadas
    for (let i = 0; i < figures.length; i++) {
        let figure = figures[i];
        let color = figure.color;
        let thickness = figure.thickness;

        switch (figure.type) {
            case 'pencil':
                const points = figure.points;
                ctx.strokeStyle = color;
                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let j = 1; j < points.length; j++) {
                    ctx.lineTo(points[j].x, points[j].y);
                }
                ctx.stroke();
                break;
            case 'line':
                line(figure.startX, figure.startY, figure.endX, figure.endY, color, thickness);
                break;
            case 'square':
                square(figure.startX, figure.startY, figure.length, figure.xSign, figure.ySign, color, thickness);
                break;
            case 'rectangle':
                rectangle(figure.startX, figure.startY, figure.width, figure.height, color, thickness);
                break;
            case 'circle':
                drawCircle(figure.xc, figure.yc, figure.radius, color, thickness);
                break;
            case 'ellipse':
                ellipse(figure.x0, figure.y0, figure.x1, figure.y1, color, thickness);
                break
            default:
                break;
        }
    }

    // Dibujar la figura actual que se está dibujando
    if (isDrawing) {
        let color = currentColor;
        let thickness = currentThickness;
        switch (drawMode) {
            case 'pencil':
                if (pencilPoints.length > 1) {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness;
                    ctx.beginPath();
                    ctx.moveTo(pencilPoints[0].x, pencilPoints[0].y);
                    for (let i = 1; i < pencilPoints.length; i++) {
                        ctx.lineTo(pencilPoints[i].x, pencilPoints[i].y);
                    }
                    ctx.stroke();
                }
                break;
            case 'line':
                line(startX, startY, mouseX, mouseY, color, thickness);
                break;
            case 'square':
                const lengthX = Math.abs(mouseX - startX);
                const lengthY = Math.abs(mouseY - startY);
                const length = Math.min(lengthX, lengthY);
                const xSign = Math.sign(mouseX - startX);
                const ySign = Math.sign(mouseY - startY);
                square(startX, startY, length, xSign, ySign, color, thickness);
                break;
            case 'rectangle':
                const width = Math.abs(mouseX - startX);
                const height = Math.abs(mouseY - startY);
                const x = Math.min(mouseX, startX);
                const y = Math.min(mouseY, startY);
                rectangle(x, y, width, height, color, thickness);
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(mouseX - startX, 2) + Math.pow(mouseY - startY, 2));
                drawCircle(startX, startY, radius, color, thickness);
                break;
            case 'ellipse':
                ellipse(startX, startY, mouseX, mouseY, color, thickness);
                break;
            default:
                break;
        }
    }
}

canvas.addEventListener('mousedown', function (e) {
    isDrawing = true;
    startX = e.clientX - canvas.getBoundingClientRect().left;
    startY = e.clientY - canvas.getBoundingClientRect().top;
    if (drawMode === 'pencil') {
        // Limpiar los puntos del lápiz al iniciar un nuevo trazo
        pencilPoints = [];
        pencilPoints.push({ x: startX, y: startY, thickness: currentThickness });
        // Agregar la figura inicial al arreglo de figuras
        figures.push({ type: 'pencil', points: pencilPoints, color: currentColor, thickness: currentThickness });
    }
});

canvas.addEventListener('mousemove', function (e) {
    if (!isDrawing) return;
    mouseX = e.clientX - canvas.getBoundingClientRect().left;
    mouseY = e.clientY - canvas.getBoundingClientRect().top;
    if (drawMode === 'pencil') {
        pencil(mouseX, mouseY);
    } else {
        draw();
    }
});

canvas.addEventListener('mouseup', function () {
    if (isDrawing) {
        isDrawing = false;
        let color = currentColor;
        let thickness = currentThickness;
        switch (drawMode) {
            case 'pencil':
                // No es necesario agregar la figura aquí, ya se agregó en mousedown
                break;
            case 'line':
                figures.push({ type: 'line', startX: startX, startY: startY, endX: mouseX, endY: mouseY, color: color, thickness: thickness });
                break;
            case 'square':
                const lengthX = Math.abs(mouseX - startX);
                const lengthY = Math.abs(mouseY - startY);
                const length = Math.min(lengthX, lengthY);
                const xSign = Math.sign(mouseX - startX);
                const ySign = Math.sign(mouseY - startY);
                figures.push({ type: 'square', startX: startX, startY: startY, length: length, xSign: xSign, ySign: ySign, color: color, thickness: thickness });
                break;
            case 'rectangle':
                const width = Math.abs(mouseX - startX);
                const height = Math.abs(mouseY - startY);
                const x = Math.min(mouseX, startX);
                const y = Math.min(mouseY, startY);
                figures.push({ type: 'rectangle', startX: x, startY: y, width: width, height: height, color: color, thickness: thickness });
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(mouseX - startX, 2) + Math.pow(mouseY - startY, 2));
                figures.push({ type: 'circle', xc: startX, yc: startY, radius: radius, color: color, thickness: thickness });
                break;
            case 'ellipse':
                figures.push({ type: 'ellipse', x0: startX, y0: startY, x1: mouseX, y1: mouseY, color: color, thickness: thickness });
                break;
            default:
                break;
        }
    }
});
