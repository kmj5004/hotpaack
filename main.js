// 메인 스크립트
let workers = [];
let isRunning = false;
let totalOperations = 0;
let myHeatGenerated = 0; // 내가 생성한 발열량 (칼로리)

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDemoKey123456789",
    authDomain: "cpu-killer-demo.firebaseapp.com",
    databaseURL: "https://cpu-killer-demo-default-rtdb.firebaseio.com",
    projectId: "cpu-killer-demo"
};

// Firebase 초기화
let database = null;
let userRef = null;
let onlineUsersRef = null;
let globalStatsRef = null;
let chatRef = null;
let todayVisitorsRef = null;
let myConnectionId = null;

// Additional heat generators
let memoryStressInterval = null;
let cryptoMiningInterval = null;
let audioContext = null;
let memoryArrays = [];

try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        initializePresence();
        initializeGlobalStats();
        initializeChat();
    } else {
        console.log('Firebase가 로드되지 않았습니다. 오프라인 모드로 실행됩니다.');
    }
} catch (error) {
    console.log('Firebase 초기화 실패. 로컬 모드로 실행됩니다.', error);
}

// Modal handling - MANDATORY AGREEMENT
function initModal() {
    const modal = document.getElementById('warningModal');
    const acceptBtn = document.getElementById('modalAccept');
    const agreeCheckbox = document.getElementById('agreeTerms');

    // Always show modal - no bypass
    modal.classList.remove('hidden');

    // Enable button only when checkbox is checked
    agreeCheckbox.addEventListener('change', () => {
        acceptBtn.disabled = !agreeCheckbox.checked;
    });

    acceptBtn.addEventListener('click', () => {
        if (agreeCheckbox.checked) {
            modal.classList.add('hidden');
        } else {
            alert('사용하시려면 동의 항목에 체크해주세요.');
        }
    });

    // Prevent closing modal with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            e.preventDefault();
            alert('이 웹사이트를 사용하려면 약관에 동의해야 합니다.');
        }
    });

    // Prevent clicking outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            e.preventDefault();
            alert('이 웹사이트를 사용하려면 약관에 동의해야 합니다.');
        }
    });
}

// Initialize modal on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModal);
} else {
    initModal();
}

function initializePresence() {
    try {
        myConnectionId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

        onlineUsersRef = database.ref('onlineUsers');
        userRef = database.ref('onlineUsers/' + myConnectionId);
        todayVisitorsRef = database.ref('stats/todayVisitors');

        // 오늘 날짜
        const today = new Date().toISOString().split('T')[0];
        const dailyVisitorRef = database.ref('stats/dailyVisitors/' + today);

        // 오늘 방문자 수 증가
        dailyVisitorRef.transaction((current) => {
            return (current || 0) + 1;
        });

        // 연결 상태
        const connectedRef = database.ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            if (snapshot.val() === true) {
                userRef.set({
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    online: true,
                    heat: 0
                });

                userRef.onDisconnect().remove();
            }
        });

        // 온라인 사용자 수
        onlineUsersRef.on('value', (snapshot) => {
            const count = snapshot.numChildren();
            document.getElementById('onlineUsers').textContent = count;
        });

        // 오늘 방문자 수
        dailyVisitorRef.on('value', (snapshot) => {
            const count = snapshot.val() || 0;
            document.getElementById('todayVisitors').textContent = count;
        });

    } catch (error) {
        console.log('Presence 초기화 실패:', error);
    }
}

function initializeGlobalStats() {
    try {
        globalStatsRef = database.ref('stats/globalHeat');

        // 전 세계 누적 발열량 실시간 업데이트
        globalStatsRef.on('value', (snapshot) => {
            const heat = snapshot.val() || 0;
            document.getElementById('globalHeat').textContent = formatHeat(heat);
        });

    } catch (error) {
        console.log('Global stats 초기화 실패:', error);
    }
}

function initializeChat() {
    try {
        chatRef = database.ref('chat').limitToLast(50);

        chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            addChatMessage(message.text, message.timestamp);
        });

    } catch (error) {
        console.log('Chat 초기화 실패:', error);
    }
}

function addChatMessage(text, timestamp) {
    const chatMessages = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';

    const time = new Date(timestamp).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageEl.textContent = `[${time}] ${text}`;

    // 첫 메시지 제거
    if (chatMessages.children.length > 0 && chatMessages.children[0].textContent.includes('채팅에서')) {
        chatMessages.children[0].remove();
    }

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 메시지 50개 제한
    while (chatMessages.children.length > 50) {
        chatMessages.removeChild(chatMessages.firstChild);
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();

    if (text && chatRef) {
        chatRef.push({
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        input.value = '';
    }
}

function updateMyHeat(operations) {
    // 연산 1000회당 약 0.01 칼로리로 가정
    const additionalHeat = operations / 100000;
    myHeatGenerated += additionalHeat;

    document.getElementById('myHeat').textContent = formatHeat(myHeatGenerated);

    // Firebase에 내 발열량 업데이트
    if (userRef) {
        userRef.update({ heat: myHeatGenerated });
    }

    // 전 세계 발열량에 추가
    if (globalStatsRef) {
        globalStatsRef.transaction((current) => {
            return (current || 0) + additionalHeat;
        });
    }
}

function formatHeat(heat) {
    if (heat >= 1000) {
        return (heat / 1000).toFixed(2) + ' kcal';
    }
    return heat.toFixed(2) + ' cal';
}

// DOM 요소
const intensitySlider = document.getElementById('intensity');
const intensityValue = document.getElementById('intensityValue');
const startBtn = document.getElementById('startBtn');
const temperatureEl = document.getElementById('temperature');
const warmerDisplay = document.getElementById('warmerDisplay');
const warmerBody = document.querySelector('.warmer-body');
const totalOpsEl = document.getElementById('totalOps');
const chatSend = document.getElementById('chatSend');
const chatInput = document.getElementById('chatInput');

// 온도 레벨 설정
const tempLevels = [
    { temp: 25, label: '미지근', emoji: '😊' },
    { temp: 30, label: '약한 온기', emoji: '🙂' },
    { temp: 35, label: '따뜻함', emoji: '😌' },
    { temp: 40, label: '보통 온기', emoji: '😊' },
    { temp: 45, label: '따끈따끈', emoji: '🤗' },
    { temp: 50, label: '뜨끈함', emoji: '😄' },
    { temp: 55, label: '뜨거움', emoji: '🥵' },
    { temp: 60, label: '아주 뜨거움', emoji: '🔥' },
    { temp: 65, label: '매우 뜨거움', emoji: '🔥🔥' },
    { temp: 70, label: '극한 발열', emoji: '🔥🔥🔥' }
];

// 슬라이더 값 업데이트
intensitySlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    const level = tempLevels[value - 1];
    intensityValue.textContent = `${level.label} ${level.emoji}`;
    temperatureEl.textContent = `${level.temp}°C`;

    // 실행 중이면 워커들의 강도 업데이트
    if (isRunning) {
        workers.forEach(worker => {
            worker.postMessage({ command: 'setIntensity', value: value });
        });

        // GPU 강도도 업데이트
        if (window.GPUWorker) {
            window.GPUWorker.setIntensity(value);
        }
    }
});

// 시작/중지 버튼
startBtn.addEventListener('click', () => {
    if (!isRunning) {
        startWarmer();
    } else {
        stopWarmer();
    }
});

function startWarmer() {
    const intensity = parseInt(intensitySlider.value);
    const workerCount = navigator.hardwareConcurrency || 4;

    isRunning = true;
    startBtn.textContent = '🛑 손난로 끄기';
    startBtn.classList.add('active');
    warmerDisplay.classList.add('active');
    if (warmerBody) warmerBody.classList.add('heating');
    document.body.classList.add('heating');
    totalOperations = 0;

    // CPU 워커 생성 및 시작
    const actualWorkerCount = Math.max(workerCount, 2); // 최소 2개
    for (let i = 0; i < actualWorkerCount; i++) { // 코어 수만큼
        const worker = new Worker('worker.js');

        worker.onmessage = (e) => {
            if (e.data.type === 'progress') {
                totalOperations += e.data.operations;
                updateStats();
                updateMyHeat(e.data.operations);
            }
        };

        worker.onerror = (error) => {
            console.error('워커 에러:', error);
        };

        worker.postMessage({ command: 'start', value: intensity });
        workers.push(worker);
    }

    // GPU 가속 시작
    if (window.GPUWorker) {
        window.GPUWorker.start(intensity);
    }

    // Additional heat generators
    startMemoryStress(intensity);
    startCryptoMining(intensity);
    startAudioProcessing(intensity);

    console.log(`🔥 손난로 시작 - CPU 워커: ${actualWorkerCount}개, 강도: ${intensity}`);
}

function stopWarmer() {
    isRunning = false;
    startBtn.textContent = '🔥 손난로 켜기';
    startBtn.classList.remove('active');
    warmerDisplay.classList.remove('active');
    if (warmerBody) warmerBody.classList.remove('heating');
    document.body.classList.remove('heating');

    // 모든 CPU 워커 중지
    workers.forEach(worker => {
        worker.postMessage({ command: 'stop' });
        worker.terminate();
    });

    workers = [];

    // GPU 가속 중지
    if (window.GPUWorker) {
        window.GPUWorker.stop();
    }

    // Stop additional heat generators
    stopMemoryStress();
    stopCryptoMining();
    stopAudioProcessing();
}

function updateStats() {
    totalOpsEl.textContent = formatNumber(totalOperations);
}

function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
}

// 채팅 전송
chatSend.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

// 페이지 언로드 시 워커 정리
window.addEventListener('beforeunload', () => {
    if (isRunning) {
        stopWarmer();
    }
    if (userRef) {
        userRef.remove();
    }
});

// Memory stress test - allocates and manipulates large arrays
function startMemoryStress(intensity) {
    const interval = Math.max(1000, 3000 - intensity * 150); // 더 긴 간격

    memoryStressInterval = setInterval(() => {
        // requestIdleCallback 사용으로 UI 블로킹 방지
        const runTask = () => {
            // Allocate memory
            const size = intensity * 30000; // 크기 감소
            const arr = new Array(size);

            // Fill with random data
            for (let i = 0; i < size; i++) {
                arr[i] = Math.random() * 1000000;
            }

            // Perform operations
            arr.sort((a, b) => a - b);
            const sum = arr.reduce((acc, val) => acc + val, 0);
            const avg = sum / arr.length;

            // Keep some arrays in memory
            memoryArrays.push(arr);

            // Limit memory usage
            if (memoryArrays.length > intensity) {
                memoryArrays.shift();
            }
        };

        // UI가 한가할 때 실행
        if (window.requestIdleCallback) {
            requestIdleCallback(runTask);
        } else {
            runTask();
        }
    }, interval);
}

function stopMemoryStress() {
    if (memoryStressInterval) {
        clearInterval(memoryStressInterval);
        memoryStressInterval = null;
    }
    memoryArrays = [];
}

// Crypto mining simulation - SHA-256 like operations
function startCryptoMining(intensity) {
    const interval = Math.max(300, 1500 - intensity * 80); // 더 긴 간격

    cryptoMiningInterval = setInterval(() => {
        const iterations = intensity * 300; // 반복 감소

        for (let i = 0; i < iterations; i++) {
            let hash = i.toString();

            // Simulate hash computation
            for (let j = 0; j < 10; j++) {
                let temp = 0;
                for (let k = 0; k < hash.length; k++) {
                    temp = ((temp << 5) - temp) + hash.charCodeAt(k);
                    temp = temp & temp;
                }
                hash = Math.abs(temp).toString(36);
            }

            // Additional computation
            const result = parseInt(hash, 36);
            Math.pow(result % 1000, 3);
        }
    }, interval);
}

function stopCryptoMining() {
    if (cryptoMiningInterval) {
        clearInterval(cryptoMiningInterval);
        cryptoMiningInterval = null;
    }
}

// Audio processing - creates oscillators for CPU load
function startAudioProcessing(intensity) {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Create fewer oscillators to reduce lag
        const oscillatorCount = Math.min(intensity, 5); // 최대 5개로 제한
        for (let i = 0; i < oscillatorCount; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.value = 440 + i * 10;
            gainNode.gain.value = 0; // Silent

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start();
        }
    } catch (e) {
        console.log('Audio processing not available');
    }
}

function stopAudioProcessing() {
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
}

// 초기화
updateStats();
const initialLevel = tempLevels[4];
intensityValue.textContent = `${initialLevel.label} ${initialLevel.emoji}`;
temperatureEl.textContent = `${initialLevel.temp}°C`;
