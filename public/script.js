const video = document.getElementById('qr-video');
const canvas = document.getElementById('qr-canvas');
const resultText = document.getElementById('result-text');
const resultLink = document.getElementById('result-link');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const fileBtn = document.getElementById('file-btn');
const fileInput = document.getElementById('file-input');

let stream = null;
let scanning = false;

// Запуск камеры
startBtn.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        video.srcObject = stream;
        video.play();
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        fileBtn.disabled = true;
        
        scanning = true;
        scanFrame();
    } catch (err) {
        console.error("Ошибка камеры:", err);
        resultText.textContent = `Ошибка: ${err.message}`;
    }
});

// Остановка камеры
stopBtn.addEventListener('click', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        fileBtn.disabled = false;
        
        scanning = false;
    }
});

// Загрузка изображения
fileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        const file = e.target.files[0];
        const img = new Image();
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
            
            const code = jsQR(
                ctx.getImageData(0, 0, canvas.width, canvas.height).data,
                canvas.width,
                canvas.height
            );
            
            if (code) {
                showResult(code.data);
            } else {
                resultText.textContent = "QR-код не найден";
                resultLink.style.display = 'none';
            }
        };
        
        img.src = URL.createObjectURL(file);
    }
});

// Сканирование кадров
function scanFrame() {
    if (!scanning) return;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const code = jsQR(
            ctx.getImageData(0, 0, canvas.width, canvas.height).data,
            canvas.width,
            canvas.height
        );
        
        if (code) {
            showResult(code.data);
        }
    }
    
    requestAnimationFrame(scanFrame);
}

// Отображение результата
function showResult(data) {
    resultText.textContent = data;
    
    if (data.startsWith('http://') || data.startsWith('https://')) {
        resultLink.href = data;
        resultLink.style.display = 'inline-block';
    } else {
        resultLink.style.display = 'none';
    }
}

// Проверка поддержки API
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    resultText.textContent = "Ваш браузер не поддерживает доступ к камере";
    startBtn.disabled = true;
}