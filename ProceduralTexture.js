
let modelo;
let texturaCanvas;



// PARA TURING
let cuadriculaActual = [];
let cuadriculaSiguiente = [];
let simNumFilas = 128;      // Resolución interna óptima para que no se cuelgue la PC
let simNumColumnas = 128;   // Esta es la variable que te marcaba el error

let difusionA = 1.0;        // Constantes físicas del modelo Gray-Scott
let difusionB = 0.5;


// Sliders de Textura (Variables de reacción-difusión y color)
let sliderFeed, sliderKill, sliderColorPatron;

// Sliders de Iluminación Phong
let sliderAmbient, sliderDiffuse, sliderSpecular, sliderShininess;
let sliderLightX, sliderLightY, sliderLightZ;

// Variable para el checkbox de rotación
let checkTextura;
let checkRotacion;


function preload() {
  // NOTA: Reemplaza con la ruta de tu archivo .obj con mapeo UV
  modelo = loadModel("/cat/cat.obj", true);
}

function setup() {
  // Acoplamos el lienzo al contenedor HTML
  const canvas = createCanvas(800, 600, WEBGL);
  canvas.parent('canvas-container');
  noStroke();

  // 1. CREAR LIENZO SECUNDARIO PARA LA TEXTURA (Simulación Turing)
  texturaCanvas = createGraphics(512, 512);
  texturaCanvas.background(255, 230, 180); // Color base de piel simulado

  // 2. VINCULAR INTERFAZ DE USUARIO (Mapea los controles del HTML)
  crearInterfaz();
  
  // 3. Llenamos las matrices con el químico base "A" al 100%
  for (let x = 0; x < simNumColumnas; x++) {
    cuadriculaActual[x] = [];
    cuadriculaSiguiente[x] = [];
    for (let y = 0; y < simNumFilas; y++) {
      cuadriculaActual[x][y] = { a: 1.0, b: 0.0 };
      cuadriculaSiguiente[x][y] = { a: 1.0, b: 0.0 };
    }
  }

  // 4. Sembramos una pequeña chispa del químico reactivo "B" en el centro para iniciar la reacción
  for (let x = int(simNumColumnas/2) - 8; x < int(simNumColumnas/2) + 8; x++) {
    for (let y = int(simNumFilas/2) - 8; y < int(simNumFilas/2) + 8; y++) {
      cuadriculaActual[x][y].b = 1.0;
    }
  }  
}



function draw() {
  background(200);

  // 1. SIMULACIÓN Y TEXTURA
  if (checkTextura && checkTextura.checked()) {
    actualizarTexturaTuring();
  }  
  
  configurarIluminacionPhong();
  
  // 2. ESCENA 3D CON ORBIT CONTROL (Gato, Foco y Ejes)
  orbitControl();  
  push(); 
    // RENDERIZAR LA BOMBILLA Y SUS EJES ASOCIADOS
    push();
      let lx = sliderLightX.value();
      let ly = sliderLightY.value();
      let lz = sliderLightZ.value();
      
      // Nos trasladamos al punto exacto de la luz
      translate(lx, ly, lz); 
      
      // --- Dibujo de la Bombilla Amarilla ---
      let potenciaDifusa = sliderDiffuse.value();
      let colorIntensidad = map(potenciaDifusa, 0, 255, 100, 255);
      emissiveMaterial(colorIntensidad, colorIntensidad, 0); 
      sphere(15); 
      
      // --- Dibujo de los Ejes X, Y, Z (Acompañan a la Luz) ---
      // Como ya estamos posicionados en (lx, ly, lz), pasamos (0, 0) a la función
      dibujarGizmoEnLuz(0, 0);
    pop();


    push();
    // 1. CONDICIÓN PARA ENLAZAR LA TEXTURA EN VIVO    
      if (checkTextura && checkTextura.checked()) {
        // Si el check está activo, aplicamos la simulación Turing
        texture(texturaCanvas);
      } else {
        // Si está apagado, regresamos al material azul Phong liso original
        ambientMaterial(30, 100, 200);
      }    
    
      // 2. ROTACIÓN AUTOMÁTICA (Si el check correspondiente está activo)
      if (checkRotacion && checkRotacion.checked()) {
        rotateY(frameCount * 0.005);
      }      
      
      // 3. ESCALA Y RENDERIZADO DEL OBJETO
      scale(2, -2, 2);
      if (modelo) { model(modelo); } else { sphere(100); }
    pop();
  pop(); // Fin del bloque afectado por orbitControl
}


function crearInterfaz() {
  sliderFeed        = select('#feed-slider');
  sliderKill        = select('#kill-slider');
  sliderColorPatron = select('#color-patron-slider');
  
  sliderAmbient     = select('#ambient-slider');
  sliderDiffuse     = select('#diffuse-slider');
  sliderSpecular    = select('#specular-slider');
  sliderShininess   = select('#shininess-slider');
  
  sliderLightX      = select('#lightX-slider');
  sliderLightY      = select('#lightY-slider');
  sliderLightZ      = select('#lightZ-slider');

  conectarTexto(sliderFeed, '#feed-val');
  conectarTexto(sliderKill, '#kill-val');
  conectarTexto(sliderColorPatron, '#color-patron-val');
  
  conectarTexto(sliderAmbient, '#ambient-val');
  conectarTexto(sliderDiffuse, '#diffuse-val');
  conectarTexto(sliderSpecular, '#specular-val');
  conectarTexto(sliderShininess, '#shininess-val');
  
  conectarTexto(sliderLightX, '#lightX-val');
  conectarTexto(sliderLightY, '#lightY-val');
  conectarTexto(sliderLightZ, '#lightZ-val');
  checkRotacion = select('#rotacion-check');  
  checkTextura = select('#textura-check');  
}

function conectarTexto(sliderElement, spanId) {
  let spanElement = select(spanId);
  if (sliderElement && spanElement) {
    // Sincronizamos el valor numérico visible inmediatamente al cargar la interfaz
    spanElement.html(sliderElement.value());
    
    sliderElement.input(() => {
      spanElement.html(sliderElement.value());
    });
  }
}
