let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d', { willReadFrequently: true });
let isDrawing = false;
let startX, startY, mouseX, mouseY;
let figures = [];
let drawMode = 'line';
let currentColor = 'white';
let currentThickness = 1;
let pencilPoints = [];
let eraserPoints = []; 
let eraserColor = 'rgb(29, 30, 30)';
let sidesInput = document.getElementById('polygon-sides');
let sides = parseInt(sidesInput.value);
let undoButton = document.getElementById('undoButton');
let redoButton = document.getElementById('redoButton');
let undoStack = [];
let redoStack = [];

// Variables para seguir el estado del arrastre
let isDragging = false;
let dragStartX, dragStartY;
let draggedElementIndex = -1; // Índice del elemento que se está arrastrando
let handButton = document.getElementById('hand');
let fillButton = document.getElementById('fill');

function saveAsPNG() {
    let nameFile = document.getElementById('namePNG').value;
    // Obtener la URL de la imagen del canvas
    var imgURL = canvas.toDataURL('image/png');

    // Crear un enlace temporal para descargar la imagen
    var link = document.createElement('a');
    link.href = imgURL;
    link.download = nameFile + '.png'; // Nombre de archivo a descargar
    link.click();
}

fillButton.addEventListener('click', function() {
    // Cambiar el modo de dibujo a relleno
    changeDrawMode('fill');
});

// Agregar evento click al lienzo para manejar el relleno
canvas.addEventListener('click', function(e) {
    // Obtener las coordenadas del clic en el lienzo
    let rect = canvas.getBoundingClientRect(); // Get canvas bounding rect
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    // Verificar si el modo de dibujo es relleno
    if (drawMode === 'fill') {
        // Obtener el color seleccionado para el relleno
        let fillColor = currentColor; // Utiliza el color actual
        // Llamar a la función de relleno con las coordenadas del clic y el color seleccionado
        floodFill(mouseX, mouseY, fillColor);
    }
});

// Función para el relleno por inundación
function floodFill(x, y, color) {
    // Obtener el color del píxel en las coordenadas dadas
    let targetColor = ctx.getImageData(x, y, 1, 1).data;

    // Verificar si el color de destino es igual al color de relleno
    if (colorsMatch(targetColor, color)) {
        return;
    }

    // Crear una pila para almacenar los píxeles por visitar
    let stack = [{x: x, y: y}];

    // Función para verificar si dos colores son iguales
    function colorsMatch(color1, color2) {
        return color1[0] === color2[0] && color1[1] === color2[1] && color1[2] === color2[2] && color1[3] === color2[3];
    }

    // Lógica de relleno
    function fill() {
        // Mientras la pila no esté vacía
        while (stack.length) {
            let current = stack.pop();
            let cx = current.x;
            let cy = current.y;

            // Obtener el color del píxel actual
            let currentColor = ctx.getImageData(cx, cy, 1, 1).data;

            // Verificar si el color del píxel actual es igual al color de destino
            if (colorsMatch(currentColor, targetColor)) {
                // Establecer el color del píxel actual
                ctx.fillStyle = color;

                // Expandir el relleno horizontalmente hacia la izquierda
                let leftBound = cx;
                while (leftBound >= 0 && colorsMatch(ctx.getImageData(leftBound, cy, 1, 1).data, targetColor)) {
                    leftBound--;
                }

                // Expandir el relleno horizontalmente hacia la derecha
                let rightBound = cx + 1;
                while (rightBound < canvas.width && colorsMatch(ctx.getImageData(rightBound, cy, 1, 1).data, targetColor)) {
                    rightBound++;
                }

                // Rellenar la fila completa con el color
                ctx.fillRect(leftBound + 1, cy, rightBound - leftBound - 1, 1);

                // Explorar hacia arriba y hacia abajo desde la fila rellenada
                if (cy > 0) {
                    for (let i = leftBound + 1; i < rightBound; i++) {
                        if (colorsMatch(ctx.getImageData(i, cy - 1, 1, 1).data, targetColor)) {
                            stack.push({x: i, y: cy - 1});
                        }
                    }
                }
                if (cy < canvas.height - 1) {
                    for (let i = leftBound + 1; i < rightBound; i++) {
                        if (colorsMatch(ctx.getImageData(i, cy + 1, 1, 1).data, targetColor)) {
                            stack.push({x: i, y: cy + 1});
                        }
                    }
                }
            }
        }
    }

    // Llamar a la función de relleno
    fill();
}

// Agregar evento click al botón de la mano para activar el modo de arrastrar y soltar
handButton.addEventListener('click', function() {
    changeDrawMode('drag');
});

// Actualiza el número de lados del polígono cuando cambia el input
sidesInput.addEventListener('input', function() {
    sides = parseInt(sidesInput.value);
});

undoButton.addEventListener('click', function() {
    if (figures.length > 0) {
        let lastFigure = figures.pop();
        undoStack.push(lastFigure);
        draw();
    }
});

redoButton.addEventListener('click', function() {
    if (undoStack.length > 0) {
        let lastUndoneFigure = undoStack.pop();
        redoStack.push(lastUndoneFigure);
        figures.push(lastUndoneFigure);
        draw();
    }
});

function changeColor(color) {
    currentColor = color;
}

function changeThickness(thickness) {
    currentThickness = thickness;
}

function pencil(x, y, color = currentColor, thickness = currentThickness) {
    if (!isDrawing) return; // Exit if not drawing
    pencilPoints.push({ x: x, y: y, color: color, thickness: thickness });
    draw(); // Redraw on each pencil movement
}

function eraser(x, y, color = eraserColor, thickness = currentThickness) {
    if (!isDrawing) return; // Exit if not drawing
    eraserPoints.push({ x: x, y: y, color: color, thickness: thickness });
    draw(); // Redraw on each pencil movement
}

function line(x0, y0, x1, y1, color = currentColor, thickness = currentThickness) {
    ctx.strokeStyle = color;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        setPixel(x0, y0, color, thickness);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
        if ((sx > 0 && x0 > x1) || (sx < 0 && x0 < x1) || (sy > 0 && y0 > y1) || (sy < 0 && y0 < y1)) {
            // Verificar si hemos pasado el punto final
            return;
        }
    }
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
    let b1 = b & 1; // valores del diametro
    let dx = 4 * (1 - a) * b * b;
    let dy = 4 * (b1 + 1) * a * a; // incremento de error
    let err = dx + dy + b1 * a * a;
    let e2; // error del paso 1

    if (x0 > x1) {
        x0 = x1;
        x1 += a;
    } // si se llama con puntos intercambiados

    if (y0 > y1) y0 = y1; // .. intercambiarlos
    y0 += (b + 1) / 2;
    y1 = y0 - b1; // pixel inicial
    a *= 8 * a;
    b1 = 8 * b * b;

    do {
        setPixel(x1, y0, color, thickness); //   I. cuadrante 
        setPixel(x0, y0, color, thickness); //  II. cuadrante 
        setPixel(x0, y1, color, thickness); // III. cuadrante 
        setPixel(x1, y1, color, thickness); //  IV. cuadrante 
        e2 = 2 * err;
        if (e2 <= dy) {
            y0++;
            y1--;
            err += dy += a;
        } // paso y 
        if (e2 >= dx || 2 * err > dy) {
            x0++;
            x1--;
            err += dx += b1;
        } // paso x
    } while (x0 <= x1);

    while (y0 - y1 < b) {
        setPixel(x0 - 1, y0, color, thickness); // -> terminar la punta de la elipse
        setPixel(x1 + 1, y0++, color, thickness);
        setPixel(x0 - 1, y1, color, thickness);
        setPixel(x1 + 1, y1--, color, thickness);
    } 
}

function polygone(centerX, centerY, sides, radius, color = currentColor, thickness = currentThickness) {
    const angleStep = (2 * Math.PI) / sides;
    let x0 = centerX + radius;
    let y0 = centerY;
    let x1, y1;
    
    for (let i = 1; i <= sides; i++) {
        x1 = centerX + radius * Math.cos(i * angleStep);
        y1 = centerY + radius * Math.sin(i * angleStep);
        line(x0, y0, x1, y1, color, thickness); // Utiliza el algoritmo de Bresenham para trazar la línea
        x0 = x1;
        y0 = y1;
    }
}

function rhombus(x0, y0, x1, y1, color = currentColor, thickness = currentThickness) {
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;

    line(midX, y0, x1, midY, color, thickness); // lado de arriba
    line(x1, midY, midX, y1, color, thickness); // lado de la derecha
    line(midX, y1, x0, midY, color, thickness); // lado del fondo
    line(x0, midY, midX, y0, color, thickness); // lado izquierdo
}

function trapezoid(startX, startY, endX, endY, color = currentColor, thickness = currentThickness) {
    // Calcular las coordenadas de los vértices del trapecio
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const x0 = Math.min(startX, endX);
    const y0 = Math.min(startY, endY);
    const x1 = x0 + width;
    const y1 = y0;
    const x2 = x0 + width * 0.2;
    const y2 = y0 + height;
    const x3 = x1 - width * 0.2;
    const y3 = y0 + height;

    // Dibujar el trapecio usando la función de línea
    line(x0, y0, x2, y2, color, thickness); // Línea CA
    line(x1, y1, x3, y3, color, thickness); // Línea BD
    line(x2, y2, x3, y3, color, thickness); // Línea DC
    line(x0, y0, x1, y1, color, thickness); // Línea AB
}

function setPixel(x, y, color = currentColor, thickness = currentThickness) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, thickness, thickness);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibuja todas las figuras almacenadas
    for (let i = 0; i < figures.length; i++) {
        let figure = figures[i];
        let color = figure.color;
        let thickness = figure.thickness;

        switch (figure.type) {
            case 'eraser':
                const pointsEraser = figure.points;
                ctx.strokeStyle = eraserColor;
                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.moveTo(pointsEraser[0].x, pointsEraser[0].y);
                for (let j = 1; j < pointsEraser.length; j++) {
                    ctx.lineTo(pointsEraser[j].x, pointsEraser[j].y);
                }
                ctx.stroke();
                break;
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
                break;
            case 'polygone':
                polygone(figure.centerX, figure.centerY, figure.sides, figure.radius, color, thickness);
                break;
            case 'rhombus':
                rhombus(figure.startX, figure.startY, figure.endX, figure.endY, color, thickness);
                break;
            case 'trapezoid':
                trapezoid(figure.startX, figure.startY, figure.endX, figure.endY, color, thickness);
                break;    
            default:
                break;
        }
    }

    // Dibuja la figura que actualmente se esta dibujando valgame la redundancia
    if (isDrawing) {
        let color = currentColor;
        let thickness = currentThickness;
        switch (drawMode) {
            case 'eraser':
                if (eraserPoints.length > 1) {
                    ctx.strokeStyle = eraserColor;
                    ctx.lineWidth = thickness;
                    ctx.beginPath();
                    ctx.moveTo(eraserPoints[0].x, eraserPoints[0].y);
                    for (let i = 1; i < eraserPoints.length; i++) {
                        ctx.lineTo(eraserPoints[i].x, eraserPoints[i].y);
                    }
                    ctx.stroke();
                }
                break;
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
            case 'polygone':
                const radiusPolygone = Math.sqrt(Math.pow(mouseX - startX, 2) + Math.pow(mouseY - startY, 2));
                polygone(startX, startY, sides, radiusPolygone, color, thickness);
                break;
            case 'rhombus':
                const width0 = Math.abs(mouseX - startX);
                const height0 = Math.abs(mouseY - startY);
                const x0 = Math.min(mouseX, startX);
                const y0 = Math.min(mouseY, startY);
                rhombus(x0, y0, x0 + width0, y0 + height0, color, thickness);
                break;
            case 'trapezoid':
                const baseWidth = Math.abs(mouseX - startX);
                const height_ = Math.abs(mouseY - startY);
                const x_0 = Math.min(mouseX, startX);
                const y_0 = Math.min(mouseY, startY); 
                const x1 = x_0 + baseWidth; 
                const y1 = y_0 + height_; 
                trapezoid(x_0, y_0, x1, y1, color, thickness);
                break;
            default:
                break;
        }
    }

}

canvas.addEventListener('mousedown', function (e) {
    mouseX = e.clientX - canvas.getBoundingClientRect().left;
    mouseY = e.clientY - canvas.getBoundingClientRect().top;

    // Revisa si se dio click en un elemento cercano para iniciar el arrastre
    draggedElementIndex = -1; // Resetear index del elemento a arrastrar
    for (let i = figures.length - 1; i >= 0; i--) {
        if (isPointCloseToElement(mouseX, mouseY, figures[i])) {
            draggedElementIndex = i;
            break;
        }
    }

    // Si hay un elemento cerca que arrastre
    if (draggedElementIndex !== -1 ) {
        isDragging = true;
        dragStartX = mouseX;
        dragStartY = mouseY;
    } else {
        // Si no se hizo clic en ningún elemento existente, comenzar un nuevo dibujo
        isDrawing = true;
        startX = mouseX;
        startY = mouseY;
        if (drawMode === 'pencil') {
            pencilPoints = [];
            pencilPoints.push({ x: startX, y: startY, thickness: currentThickness });
            figures.push({ type: 'pencil', points: pencilPoints, color: currentColor, thickness: currentThickness });
        } else if (drawMode === 'eraser') {
            eraserPoints = [];
            eraserPoints.push({ x: startX, y: startY, thickness: currentThickness });
            figures.push({ type: 'eraser', points: eraserPoints, color: eraserColor, thickness: currentThickness });
        }
    }
});

canvas.addEventListener('mousemove', function (e) {
    mouseX = e.clientX - canvas.getBoundingClientRect().left;
    mouseY = e.clientY - canvas.getBoundingClientRect().top;

    if (isDragging) {
        // Calcula la diferencia de la posición desde que empezo el arrastre
        const deltaX = mouseX - dragStartX;
        const deltaY = mouseY - dragStartY;

        // Actualiza coordenadas del elemento
        const draggedElement = figures[draggedElementIndex];
        if (draggedElement) {
            switch (draggedElement.type) {
                case 'pencil':
                    for (let i = 0; i < draggedElement.points.length; i++) {
                        draggedElement.points[i].x += deltaX;
                        draggedElement.points[i].y += deltaY;
                    }
                    break;
                case 'line':
                    draggedElement.startX += deltaX;
                    draggedElement.startY += deltaY;
                    draggedElement.endX += deltaX;
                    draggedElement.endY += deltaY;
                    break;
                case 'square':
                    draggedElement.startX += deltaX;
                    draggedElement.startY += deltaY;
                    draggedElement.endX += deltaX;
                    draggedElement.endY += deltaY;
                    break;
                case 'rectangle':
                    draggedElement.startX += deltaX;
                    draggedElement.startY += deltaY;
                    draggedElement.endX += deltaX;
                    draggedElement.endY += deltaY;
                    break;
                case 'circle':
                    draggedElement.xc += deltaX;
                    draggedElement.yc += deltaY;
                    break;
                case 'ellipse':
                    draggedElement.x0 += deltaX;
                    draggedElement.y0 += deltaY;
                    draggedElement.x1 += deltaX;
                    draggedElement.y1 += deltaY;
                    break;
                case 'polygone':
                    draggedElement.centerX += deltaX;
                    draggedElement.centerY += deltaY;
                    break;
                case 'rhombus':
                    draggedElement.startX += deltaX;
                    draggedElement.startY += deltaY;
                    draggedElement.endX += deltaX;
                    draggedElement.endY += deltaY;
                    break;
                case 'trapezoid':
                    draggedElement.startX += deltaX;
                    draggedElement.startY += deltaY;
                    draggedElement.endX += deltaX;
                    draggedElement.endY += deltaY;
                    break;    
                default:
                    break;
            }
        }

        // Redibuja el canvas con los elementos arrastrados
        draw();

        dragStartX = mouseX;
        dragStartY = mouseY;
    } else if (isDrawing) {
        if (drawMode === 'pencil') {
            pencil(mouseX, mouseY);
        } else if (drawMode === 'eraser') {
            eraser(mouseX, mouseY);
        } else {
            draw();
        }
    }
});


canvas.addEventListener('mouseup', function () {
    if (isDragging) {
        isDragging = false; // Detener el arrastre
    } else if (isDrawing) {
        isDrawing = false; // Detener el dibujo
        let color = currentColor;
        let thickness = currentThickness;

        // Agregar la figura dibujada al arreglo de figuras
        switch (drawMode) {
            // Agregar casos para otros tipos de figuras si es necesario
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
            case 'polygone':
                const radiusPolygone = Math.sqrt(Math.pow(mouseX - startX, 2) + Math.pow(mouseY - startY, 2));
                figures.push({ type: 'polygone', centerX: startX, centerY: startY, sides: sides, radius: radiusPolygone, color: color, thickness: thickness });
                break;
            case 'rhombus':
                const width0 = Math.abs(mouseX - startX);
                const height0 = Math.abs(mouseY - startY);
                const x0 = Math.min(mouseX, startX);
                const y0 = Math.min(mouseY, startY);
                const x1 = x0 + width0; // Top right corner X coordinate
                const y1 = y0 + height0; // Center Y coordinate
                figures.push({ type: 'rhombus', startX: x0, startY: y0, endX: x1, endY: y1, color: color, thickness: thickness });
                break;
                case 'trapezoid':
                    figures.push({ type: 'trapezoid', startX: startX, startY: startY, endX: mouseX, endY: mouseY, color: color, thickness: thickness });
                    break;
            default:
                break;
        }
    }
});

function isPointCloseToElement(x, y, element) {
    switch (element.type) {
        case 'line':
            return isPointCloseToLine(x, y, element);
        case 'square':
            return isPointCloseToSquare(x, y, element);
        case 'rectangle':
            return isPointCloseToRectangle(x, y, element);
        case 'circle':
            return isPointCloseToCircle(x, y, element);
        case 'ellipse':
            return isPointCloseToEllipse(x, y, element);
        case 'polygone':
            return isPointCloseToPolygone(x, y, element);
        case 'rhombus':
            return isPointCloseToRhombus(x, y, element);
        case 'trapezoid':
            return isPointCloseToTrapezoid(x, y, element);
        default:
            return false;
    }
}

function isPointCloseToLine(x, y, line) {
    const { startX, startY, endX, endY } = line;
    const distanceToPoint = Math.abs((endY - startY) * x - (endX - startX) * y + endX * startY - endY * startX) / Math.sqrt(Math.pow(endY - startY, 2) + Math.pow(endX - startX, 2));
    return distanceToPoint <= line.thickness / 2;
}

function isPointCloseToSquare(x, y, square) {
    const { startX, startY, length } = square;

    const distLeft = Math.abs(x - startX);
    const distRight = Math.abs(x - (startX + length));
    const distTop = Math.abs(y - startY);
    const distBottom = Math.abs(y - (startY + length));

    const margin = 5;
    return (
        (distLeft <= margin || distRight <= margin) && y >= startY && y <= startY + length ||
        (distTop <= margin || distBottom <= margin) && x >= startX && x <= startX + length
    );
}

function isPointCloseToRectangle(x, y, rectangle) {
    const { startX, startY, width, height } = rectangle;
    return x >= startX - 5 && x <= startX + width + 5 && y >= startY - 5 && y <= startY + height + 5;
}

function isPointCloseToCircle(x, y, circle) {
    const { xc, yc, radius } = circle;
    return Math.pow(x - xc, 2) + Math.pow(y - yc, 2) <= Math.pow(radius + 5, 2);
}

function isPointCloseToEllipse(x, y, ellipse) {
    const { x0, y0, x1, y1 } = ellipse;
    const a = Math.abs(x1 - x0) / 2;
    const b = Math.abs(y1 - y0) / 2;
    const centerX = (x0 + x1) / 2;
    const centerY = (y0 + y1) / 2;
    return Math.pow((x - centerX) / a, 2) + Math.pow((y - centerY) / b, 2) <= 1 + 0.05;
}

function isPointCloseToPolygone(x, y, polygone) {
    const { centerX, centerY, sides, radius } = polygone;
    const angleStep = (2 * Math.PI) / sides;
    let x0 = centerX + radius;
    let y0 = centerY;
    let x1, y1;
    let minDistance = Infinity;

    for (let i = 1; i <= sides; i++) {
        x1 = centerX + radius * Math.cos(i * angleStep);
        y1 = centerY + radius * Math.sin(i * angleStep);
        const distance = distanceToSegment(x, y, x0, y0, x1, y1);
        minDistance = Math.min(minDistance, distance);
        x0 = x1;
        y0 = y1;
    }

    return minDistance <= 5;
}

function distanceToSegment(x, y, x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const t = ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy);
    const closestX = x0 + t * dx;
    const closestY = y0 + t * dy;

    if (t < 0) return Math.sqrt((x - x0) * (x - x0) + (y - y0) * (y - y0));
    if (t > 1) return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));

    return Math.sqrt((x - closestX) * (x - closestX) + (y - closestY) * (y - closestY));
}

function isPointCloseToRhombus(x, y, rhombus) {
    const { startX, startY, endX, endY } = rhombus;

    const lines = [
        { x1: startX, y1: (startY + endY) / 2, x2: (startX + endX) / 2, y2: endY },
        { x1: (startX + endX) / 2, y1: endY, x2: endX, y2: (startY + endY) / 2 },
        { x1: endX, y1: (startY + endY) / 2, x2: (startX + endX) / 2, y2: startY },
        { x1: (startX + endX) / 2, y1: startY, x2: startX, y2: (startY + endY) / 2 }
    ];

    // Utiliza el algoritmo de punto en polígono para comprobar si el punto está dentro del rombo
    let inside = false;
    for (let i = 0, j = lines.length - 1; i < lines.length; j = i++) {
        const xi = lines[i].x1, yi = lines[i].y1;
        const xj = lines[j].x1, yj = lines[j].y1;
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

function isPointCloseToTrapezoid(x, y, trapezoid) {
    const { startX, startY, endX, endY } = trapezoid;

    const lines = [
        { x1: startX, y1: startY, x2: endX, y2: startY }, // Line AB
        { x1: endX, y1: startY, x2: endX - (endX - startX) * 0.2, y2: endY }, // Line BD
        { x1: endX - (endX - startX) * 0.2, y1: endY, x2: startX + (endX - startX) * 0.2, y2: endY }, // Line CD
        { x1: startX + (endX - startX) * 0.2, y1: endY, x2: startX, y2: startY } // Line CA
    ];

    let inside = false;
    for (let i = 0, j = lines.length - 1; i < lines.length; j = i++) {
        const xi = lines[i].x1, yi = lines[i].y1;
        const xj = lines[j].x1, yj = lines[j].y1;
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

// Función para limpiar el lienzo
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    figures = [];
    undoStack = []; // Limpiar la pila de deshacer
    redoStack = []; // Limpiar la pila de rehacer
}

// Función para cambiar el modo de dibujo
function changeDrawMode(mode) {
    drawMode = mode;
}

//Si quieres añadir otra funcionalidad como transformaciones de figuras revisa los eventos mousedown, mousemove, mouseup

//Las ultimas funciones son para verificar si un punto pertenece a una figura y se utiliza en la transformación de arrastre (botón 'hand')

//Todas las funciones para dibujar figuras (excepto circulos, elipses y pencil) llaman a la función 'line' que es una implementación 
//del algoritmo de bresenham para dibujar lineas rectas

//Todo lo que se dibuje en el canvas va al arreglo Figures

//El borrador (eraser) es una mexicanada que no sirve, solo raya a mano libre pero del mismo color del canvas.

//La función floodFill es una mala implementación del algoritmo de relleno de inundación pero tiene detalles, 
//es lento porque consume muchos recursos y no almacena los pixeles de la region rellenada, de modo que si 
//mueves una figura con relleno este se elimina

//Autores: IV4N0001 - ChatGPT. 20/03/2024 - 07:57