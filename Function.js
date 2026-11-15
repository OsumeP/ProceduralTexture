function configurarIluminacionPhong() {
  // 1. Componente Ambiental
  let amb = sliderAmbient.value();
  ambientLight(amb, amb, amb);

  // 2. Componente Difusa y Especular (Posición de la luz puntual)
  let lx = sliderLightX.value();
  let ly = sliderLightY.value();
  let lz = sliderLightZ.value();
  let dif = sliderDiffuse.value();
  pointLight(dif, dif, dif, lx, ly, lz);

  // 3. Propiedades reflectivas del material (Phong Specular & Shininess)
  let spec = sliderSpecular.value();
  specularMaterial(spec, spec, spec);
  shininess(sliderShininess.value());
}


function dibujarGizmoEnLuz(x, y) {
  push();
  // NOTA: Eliminamos 'resetMatrix()' para que herede la posición real 3D de la bombilla
  translate(x, y, 0); 
  
  let largoEje = 50; // Un poco más largo para que sobresalga de la esfera
  strokeWeight(2);
  
  // Eje X (Rojo) -> Apunta hacia la derecha
  stroke(245, 74, 91);
  line(0, 0, 0, largoEje, 0, 0);
  
  // Eje Y (Verde) -> Apunta hacia arriba en el espacio 3D de p5.js
  stroke(141, 201, 60);
  line(0, 0, 0, 0, -largoEje, 0); 
  
  // Eje Z (Azul) -> Apunta hacia adelante/atrás (profundidad)
  stroke(77, 148, 237);
  line(0, 0, 0, 0, 0, largoEje);
  
  pop();
}



function actualizarTexturaTuring() {
  let alimentacion = float(sliderFeed.value()); 
  let eliminacion = float(sliderKill.value());   
  let tonoSeleccionado = sliderColorPatron.value(); 

  // 1. PASO DE SIMULACIÓN MATEMÁTICA (Gray-Scott) - 8 pasos por fotograma
  for (let paso = 0; paso < 8; paso++) {
    for (let x = 1; x < simNumColumnas - 1; x++) {
      for (let y = 1; y < simNumFilas - 1; y++) {
        let estado = cuadriculaActual[x][y];
        let a = estado.a;
        let b = estado.b;

        let laplaceA = a * -1;
        let laplaceB = b * -1;
        
        laplaceA += cuadriculaActual[x+1][y].a * 0.2 + cuadriculaActual[x-1][y].a * 0.2;
        laplaceA += cuadriculaActual[x][y+1].a * 0.2 + cuadriculaActual[x][y-1].a * 0.2;
        laplaceA += cuadriculaActual[x+1][y+1].a * 0.05 + cuadriculaActual[x-1][y-1].a * 0.05;
        laplaceA += cuadriculaActual[x+1][y-1].a * 0.05 + cuadriculaActual[x-1][y+1].a * 0.05;

        laplaceB += cuadriculaActual[x+1][y].b * 0.2 + cuadriculaActual[x-1][y].b * 0.2;
        laplaceB += cuadriculaActual[x][y+1].b * 0.2 + cuadriculaActual[x][y-1].b * 0.2;
        laplaceB += cuadriculaActual[x+1][y+1].b * 0.05 + cuadriculaActual[x-1][y-1].b * 0.05;
        laplaceB += cuadriculaActual[x+1][y-1].b * 0.05 + cuadriculaActual[x-1][y+1].b * 0.05;

        let sigA = a + (difusionA * laplaceA) - (a * b * b) + (alimentacion * (1 - a));
        let sigB = b + (difusionB * laplaceB) + (a * b * b) - ((eliminacion + alimentacion) * b);

        cuadriculaSiguiente[x][y].a = constrain(sigA, 0, 1);
        cuadriculaSiguiente[x][y].b = constrain(sigB, 0, 1);
      }
    }
    let temporal = cuadriculaActual;
    cuadriculaActual = cuadriculaSiguiente;
    cuadriculaSiguiente = temporal;
  }

  // 2. INYECTAR LOS COLORES DIRECTAMENTE EN EL BUFFER DE PÍXELES (Súper rápido)
  texturaCanvas.loadPixels();
  
  // Recorremos los píxeles del lienzo de la textura (512x512)
  for (let x = 0; x < texturaCanvas.width; x++) {
    for (let y = 0; y < texturaCanvas.height; y++) {
      
      // Mapeamos las coordenadas de la textura (512) a la matriz de simulación (128)
      let simX = floor(map(x, 0, texturaCanvas.width, 0, simNumColumnas));
      let simY = floor(map(y, 0, texturaCanvas.height, 0, simNumFilas));
      
      let bValue = cuadriculaActual[simX][simY].b;
      
      // Calculamos la posición del píxel en el array unidimensional de p5.js
      let index = (x + y * texturaCanvas.width) * 4;
      
      if (bValue > 0.3) {
        // Píxel del Patrón (Color marrón oscuro regulado por tu slider)
        texturaCanvas.pixels[index + 0] = tonoSeleccionado;        // R
        texturaCanvas.pixels[index + 1] = tonoSeleccionado * 0.3;  // G
        texturaCanvas.pixels[index + 2] = 50;                     // B
        texturaCanvas.pixels[index + 3] = 255;                    // Alfa (Opaco)
      } else {
        // Píxel de la Piel Base (Color beige claro)
        texturaCanvas.pixels[index + 0] = 255; // R
        texturaCanvas.pixels[index + 1] = 230; // G
        texturaCanvas.pixels[index + 2] = 180; // B
        texturaCanvas.pixels[index + 3] = 255; // Alfa
      }
    }
  }
  
  // Aplicamos los cambios directamente a la tarjeta gráfica
  texturaCanvas.updatePixels();
}
