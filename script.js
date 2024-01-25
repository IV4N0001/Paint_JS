//Algoritmo de Bresenham

function line(x0, y0, x1, y1) {
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;

    while(true) {
        setPixel(x0, y0); // Do what you need to for this
        if ((x0 === x1) && (y0 === y1)) break;
        var e2 = 2*err;
        if (e2 > -dy) { err -= dy; x0  += sx; }
        if (e2 < dx) { err += dx; y0  += sy; }
    }
}

//Dibujar con lapiz
        // Obtener el contexto del lienzo
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');

        // Variables para el seguimiento de eventos del mouse
        var isDrawing = false;
        var lines = [];  // Arreglo para almacenar las líneas
        var straightLineMode = false;

        // Función para establecer un píxel en las coordenadas (x, y)
        function setPixel(x, y) {
            ctx.fillRect(x, y, 1, 1);
        }

        // Algoritmo de Bresenham
        function line(x0, y0, x1, y1) {
            var dx = Math.abs(x1 - x0);
            var dy = Math.abs(y1 - y0);
            var sx = (x0 < x1) ? 1 : -1;
            var sy = (y0 < y1) ? 1 : -1;
            var err = dx - dy;

            while (true) {
                setPixel(x0, y0); // Establecer el píxel en las coordenadas actuales
                if ((x0 === x1) && (y0 === y1)) break;
                var e2 = 2 * err;
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

        // Manejadores de eventos del mouse
        canvas.addEventListener('mousedown', function (e) {
            isDrawing = true;
            lines.push([]);  // Crear un nuevo conjunto de puntos para la nueva línea
        });

        canvas.addEventListener('mousemove', function (e) {
            if (!isDrawing) return;

            var mouseX = e.clientX - canvas.getBoundingClientRect().left;
            var mouseY = e.clientY - canvas.getBoundingClientRect().top;

            // Agregar el punto actual a la última línea en el arreglo
            lines[lines.length - 1].push({ x: mouseX, y: mouseY });

            // Limpiar el canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Dibujar todas las líneas almacenadas
            for (var i = 0; i < lines.length; i++) {
                var linePoints = lines[i];
                if (linePoints.length < 2) continue;  // No dibujar líneas incompletas

                if (straightLineMode) {
                    // Si está en modo de línea recta, dibujar solo la línea recta entre el primer y último punto
                    var startPoint = linePoints[0];
                    var endPoint = linePoints[linePoints.length - 1];
                    line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
                } else {
                    // Si no está en modo de línea recta, dibujar todas las líneas guardadas
                    for (var j = 1; j < linePoints.length; j++) {
                        var startPoint = linePoints[j - 1];
                        var endPoint = linePoints[j];
                        line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
                    }
                }
            }
        });

        canvas.addEventListener('mouseup', function () {
            isDrawing = false;
        });

        // Manejador de evento para el botón de línea recta
        var straightLineBtn = document.getElementById('straightLineBtn');
        straightLineBtn.addEventListener('click', function () {
            straightLineMode = !straightLineMode;
            straightLineBtn.textContent = straightLineMode ? 'Modo Libre' : 'Dibujar Línea Recta';
        });

