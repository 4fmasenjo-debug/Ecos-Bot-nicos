const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const music = document.getElementById('music');
const startButton = document.getElementById('startButton');
const loading = document.getElementById('loading');
let handDetector = null;
const imageSources = [
  'flor 1.png',
  'flor 2.png',
  'flor 3.png',
  'flor 4.png',
  'flor 5.png',
  'flor 6.png',
  'flor 7.png',
  'flor 8.png',
  'flor 9.png',
  'flor 10.png',
  'flor 11.png',
  'flor 12.png'

];
const flowerImages = [];
let loadedCount = 0;

// ======================================================
// CARGAR FLORES
// ======================================================

imageSources.forEach((src) => {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    loadedCount++;
    console.log(
      `Cargada: ${src}`
    );
  };
  img.onerror = () => {
    console.error(
      `ERROR: No se pudo cargar ${src}`
    );
  };
  flowerImages.push(img);
});

// ======================================================
// CONFIGURAR CÁMARA
// ======================================================
async function setupCamera() {
  try {
    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          width: {
            ideal: 1280
          },
          height: {
            ideal: 720
          },
          facingMode: 'user'
        },
        audio: false
      });
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();

        // ----------------------------------------------
        // TAMAÑO DEL CANVAS
        // ----------------------------------------------

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(
          `Cámara iniciada: ${video.videoWidth} x ${video.videoHeight}`
        );
        resolve();
      };
    });
  } catch (error) {
    console.error(
      'Error al acceder a la cámara:',
      error
    );
    alert(
      'No se pudo acceder a la cámara. Comprueba los permisos del navegador.'
    );
  }
}

// ======================================================
// CARGAR MODELO DE MANOS
// ======================================================

async function initModels() {
  try {
    console.log(
      'Preparando TensorFlow...'
    );
    await tf.ready();
    console.log(
      'TensorFlow listo'
    );

    // ----------------------------------------------
    // MODELO
    // ----------------------------------------------

    const model =
      handPoseDetection.SupportedModels.MediaPipeHands;

    // ----------------------------------------------
    // CONFIGURACIÓN
    // ----------------------------------------------
    const detectorConfig = {
      runtime: 'mediapipe',
      solutionPath:
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands',

      modelType: 'full',
      maxHands: 2
    };

    // ----------------------------------------------
    // CREAR DETECTOR
    // ----------------------------------------------
    handDetector =
      await handPoseDetection.createDetector(
        model,
        detectorConfig
      );
    console.log(
      'Detector de manos listo'
    );
  } catch (error) {
    console.error(
      'Error cargando el detector:',
      error
    );
  }
}

// ======================================================
// DETECCIÓN DE MANOS
// ======================================================

async function detect() {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // ----------------------------------------------
  // DIBUJAR CÁMARA
  // ----------------------------------------------

  ctx.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // ----------------------------------------------
  // COMPROBAR QUE TODO ESTÁ LISTO
  // ----------------------------------------------

  if (
    loadedCount === imageSources.length &&
    handDetector !== null
  ) {
    try {
      const hands =
        await handDetector.estimateHands(
          video,
          {
            flipHorizontal: false
          }
        );
      hands.forEach((hand) => {
        const keypoints =
          hand.keypoints;
        if (
          !keypoints ||
          keypoints.length < 21
        ) {
          return;
        }
        const wrist =
          keypoints[0];
        const palmCenter =
          keypoints[9];
        const dist =
          Math.sqrt(

            Math.pow(
              palmCenter.x - wrist.x,
              2
            )
            +
            Math.pow(
              palmCenter.y - wrist.y,
              2
            )

          );
        const size =
          dist * 0.35;
        keypoints.forEach(
          (kp, index) => {

            const img =
              flowerImages[
                index %
                flowerImages.length
              ];
            drawFlower(
              img,
              kp.x,
              kp.y,
              size
            );

          }
        );
        const bases = [

          5,
          9,
          13,
          17

        ];
        bases.forEach(
          (baseIdx, i) => {

            const baseKp =
              keypoints[baseIdx];
            const midX =
              (wrist.x + baseKp.x) / 2;
            const midY =
              (wrist.y + baseKp.y) / 2;
            const img =
              flowerImages[
                (i + 20) %
                flowerImages.length
              ];
            drawFlower(
              img,
              midX,
              midY,
              size
            );
          }
        );
      });
    } catch (error) {
      console.error(
        'Error durante la detección:',
        error
      );
    }
  }
  requestAnimationFrame(
    detect
  );
}

// ======================================================
// DIBUJAR FLOR
// ======================================================

function drawFlower(
  img,
  x,
  y,
  size
) {
  if (!img.complete) {
    return;
  }
  ctx.save();

  // ----------------------------------------------
  // POSICIÓN
  // ----------------------------------------------
  ctx.translate(
    x,
    y
  );

  // ----------------------------------------------
  // DIBUJAR
  // ----------------------------------------------

  ctx.drawImage(
    img,
    -size / 2,
    -size / 2,
    size,
    size
  );
  ctx.restore();
}

// ======================================================
// INICIAR
// ======================================================

startButton.addEventListener(
  'click',
  async () => {
    console.log(
      'Iniciando experiencia...'
    );
    startButton.style.display =
      'none';
    // ----------------------------------------------
    // MOSTRAR CARGANDO
    // ----------------------------------------------
    loading.style.display =
      'block';
    // ==================================================
    // MÚSICA
    // ==================================================

    try {
      music.currentTime = 0;
      await music.play();
      console.log(
        'Arabesque No. 1 iniciada 🎵'
      );
    } catch (error) {
      console.error(
        'No se pudo reproducir la música:',
        error
      );
    }

    // ==================================================
    // CÁMARA
    // ==================================================

    await setupCamera();

    // ==================================================
    // MODELO
    // ==================================================

    await initModels();

    // ==================================================
    // COMPROBAR FLORES
    // ==================================================

    if (
      loadedCount !== imageSources.length
    ) {
      console.warn(
        'Todavía no se han cargado todas las flores.'
      );
    }
    loading.style.display =
      'none';
    detect();
  }
);
