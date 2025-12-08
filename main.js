// 메인 스크립트
let workers = [];
let isRunning = false;
let totalOperations = 0;
let myHeatGenerated = 0; // 내가 생성한 발열량 (칼로리)

// 서버 설정
// @ts-ignore - Vite env variables
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';
// @ts-ignore - Vite env variables
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8000';

// WebSocket 연결
let socket = null;
let myUserId = null;
let heatUpdateQueue = 0;
let lastHeatUpdate = 0;

// Additional heat generators
let memoryStressInterval = null;
let cryptoMiningInterval = null;
let audioContext = null;
let memoryArrays = [];

// 서버 연결 초기화
try {
    if (typeof io !== 'undefined') {
        socket = io(SERVER_URL);
        initializeConnection();
        initializeEventHandlers();
        loadInitialData();
    } else {
        console.log('Socket.io가 로드되지 않았습니다. 오프라인 모드로 실행됩니다.');
    }
} catch (error) {
    console.log('서버 연결 실패. 로컬 모드로 실행됩니다.', error);
}

// Modal handling - MANDATORY AGREEMENT
function initModal() {
    const modal = document.getElementById('warningModal');
    const acceptBtn = document.getElementById('modalAccept');
    const agreeCheckbox = document.getElementById('agreeTerms');

    // 이전에 동의한 적이 있는지 확인
    const hasAgreed = localStorage.getItem('hotpack_terms_agreed');
    
    if (hasAgreed === 'true') {
        // 이미 동의한 경우 모달을 표시하지 않음
        modal.classList.add('hidden');
        return;
    }

    // 동의하지 않은 경우 모달 표시
    modal.classList.remove('hidden');

    // Enable button only when checkbox is checked
    agreeCheckbox.addEventListener('change', () => {
        acceptBtn.disabled = !agreeCheckbox.checked;
    });

    acceptBtn.addEventListener('click', () => {
        if (agreeCheckbox.checked) {
            // localStorage에 동의 상태 저장
            localStorage.setItem('hotpack_terms_agreed', 'true');
            localStorage.setItem('hotpack_terms_agreed_date', new Date().toISOString());
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

function initializeConnection() {
    socket.on('connect', () => {
        console.log('✅ 서버 연결 성공');
        myUserId = socket.id;
    });

    socket.on('disconnect', () => {
        console.log('❌ 서버 연결 끊김');
    });

    socket.on('connect_error', (error) => {
        console.error('연결 오류:', error);
    });
}

function initializeEventHandlers() {
    // 온라인 사용자 수 업데이트
    socket.on('stats:online-users', (data) => {
        document.getElementById('onlineUsers').textContent = data.count;
    });

    // 전 세계 발열량 업데이트
    socket.on('stats:global-heat', (data) => {
        document.getElementById('globalHeat').textContent = formatHeat(data.globalHeat);
    });

    // 새 채팅 메시지
    socket.on('chat:new-message', (data) => {
        addChatMessage(data.text, data.timestamp);
    });
}

async function loadInitialData() {
    try {
        // 전체 통계 로드
        const statsResponse = await fetch(`${SERVER_URL}/api/stats/all`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            const { onlineUsers, todayVisitors, totalUsers, globalHeat } = statsData.data;
            document.getElementById('onlineUsers').textContent = onlineUsers;
            document.getElementById('todayVisitors').textContent = todayVisitors;
            document.getElementById('totalUsers').textContent = formatNumber(totalUsers);
            document.getElementById('globalHeat').textContent = formatHeat(globalHeat);
        }

        // 최근 채팅 메시지 로드
        const chatResponse = await fetch(`${SERVER_URL}/api/chat/recent?limit=50`);
        const chatData = await chatResponse.json();
        
        if (chatData.success) {
            // 기존 메시지 제거
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';
            
            // 메시지 추가
            chatData.data.messages.forEach(msg => {
                addChatMessage(msg.text, msg.timestamp);
            });
            
            if (chatData.data.messages.length === 0) {
                addChatMessage('채팅에서 따뜻한 메시지를 나눠보세요!', Date.now());
            }
        }
    } catch (error) {
        console.error('초기 데이터 로드 실패:', error);
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

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();

    if (text && socket && socket.connected) {
        try {
            const response = await fetch(`${SERVER_URL}/api/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: myUserId,
                    text: text,
                    timestamp: Date.now()
                })
            });

            const data = await response.json();
            if (data.success) {
                input.value = '';
            }
        } catch (error) {
            console.error('채팅 전송 실패:', error);
        }
    }
}

function updateMyHeat(operations) {
    // 연산 1000회당 약 0.01 칼로리로 가정
    const additionalHeat = operations / 100000;
    myHeatGenerated += additionalHeat;
    heatUpdateQueue += additionalHeat;

    document.getElementById('myHeat').textContent = formatHeat(myHeatGenerated);

    // 1초에 한 번씩만 서버에 전송 (네트워크 부하 감소)
    const now = Date.now();
    if (now - lastHeatUpdate >= 1000 && heatUpdateQueue > 0) {
        sendHeatUpdate(heatUpdateQueue, operations);
        heatUpdateQueue = 0;
        lastHeatUpdate = now;
    }
}

async function sendHeatUpdate(heat, operations) {
    if (!socket || !socket.connected) return;

    try {
        await fetch(`${SERVER_URL}/api/heat/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: myUserId,
                heatGenerated: heat,
                operations: operations
            })
        });
    } catch (error) {
        console.error('발열량 업데이트 실패:', error);
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

    // GPU 가속 시작 (제거됨)
    // if (window.GPUWorker) {
    //     window.GPUWorker.start(intensity);
    // }

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

    // GPU 가속 중지 (제거됨)
    // if (window.GPUWorker) {
    //     window.GPUWorker.stop();
    // }

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
    
    // 남은 발열량 전송
    if (heatUpdateQueue > 0 && socket && socket.connected) {
        sendHeatUpdate(heatUpdateQueue, totalOperations);
    }
    
    if (socket) {
        socket.disconnect();
    }
});

// Memory stress test - allocates and manipulates large arrays
function startMemoryStress(intensity) {
    const interval = Math.max(2000, 5000 - intensity * 200); // 더 긴 간격으로 변경

    memoryStressInterval = setInterval(() => {
        // requestIdleCallback 사용으로 UI 블로킹 방지
        const runTask = () => {
            // 낮은 강도에서는 스킵
            if (intensity < 5) return;
            
            // Allocate memory (크기 더 감소)
            const size = Math.min(intensity * 10000, 100000); // 최대 크기 제한
            const arr = new Array(size);

            // Fill with random data (청크로 나눠서 처리)
            const chunkSize = 1000;
            let index = 0;
            
            const fillChunk = () => {
                const end = Math.min(index + chunkSize, size);
                for (let i = index; i < end; i++) {
                    arr[i] = Math.random() * 1000000;
                }
                index = end;
                
                if (index < size) {
                    // 다음 청크는 다음 프레임에
                    requestAnimationFrame(fillChunk);
                } else {
                    // 정렬은 생략 (너무 무거움)
                    const sum = arr.reduce((acc, val) => acc + val, 0);
                    const avg = sum / arr.length;
                }
            };
            
            fillChunk();

            // Keep some arrays in memory
            memoryArrays.push(arr);

            // Limit memory usage
            if (memoryArrays.length > Math.min(intensity, 3)) {
                memoryArrays.shift();
            }
        };

        // UI가 한가할 때 실행
        if (window.requestIdleCallback) {
            requestIdleCallback(runTask, { timeout: 1000 });
        } else {
            setTimeout(runTask, 0);
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
    const interval = Math.max(500, 2000 - intensity * 100); // 더 긴 간격

    cryptoMiningInterval = setInterval(() => {
        // 낮은 강도에서는 스킵
        if (intensity < 5) return;
        
        // requestAnimationFrame으로 프레임 단위 처리
        requestAnimationFrame(() => {
            const iterations = Math.min(intensity * 100, 500); // 반복 더 감소

            for (let i = 0; i < iterations; i++) {
                let hash = i.toString();

                // Simulate hash computation (라운드 감소)
                for (let j = 0; j < 5; j++) { // 10 → 5로 감소
                    let temp = 0;
                    for (let k = 0; k < hash.length; k++) {
                        temp = ((temp << 5) - temp) + hash.charCodeAt(k);
                        temp = temp & temp;
                    }
                    hash = Math.abs(temp).toString(36);
                }

                // Additional computation
                const result = parseInt(hash, 36);
                Math.pow(result % 1000, 2); // 제곱 감소 (3 → 2)
            }
        });
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
        // 강도 5 이하에서는 오디오 생략
        if (intensity < 5) return;
        
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Create fewer oscillators to reduce lag
        const oscillatorCount = Math.min(Math.floor(intensity / 2), 3); // 더 적게 생성
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
