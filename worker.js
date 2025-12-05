let isRunning = false;
let intensity = 5;
let reportCounter = 0; // 보고 빈도 제어

self.onmessage = function (e) {
    const { command, value } = e.data;

    if (command === 'start') {
        isRunning = true;
        intensity = value || 5;
        runCPUIntensiveTask();
    } else if (command === 'stop') {
        isRunning = false;
    } else if (command === 'setIntensity') {
        intensity = value;
    }
};

function runCPUIntensiveTask() {
    let operationCount = 0;

    function loop() {
        if (!isRunning) {
            return;
        }

        // CPU 집약적인 계산 수행 (최적화 방지)
        const iterations = intensity * 100000; // 조정된 반복 횟수

        // 여러 작업을 병렬로 수행
        const tasks = [];

        for (let i = 0; i < iterations; i++) {
            // 1. 복잡한 수학 연산 (최적화 방지)
            let result = Math.sqrt(Math.random() * 1000000);
            result = Math.pow(result, 3); // 제곱에서 세제곱으로
            result = Math.sin(result) * Math.cos(result) * Math.tan(result);
            result = Math.log(Math.abs(result) + 1);
            result = Math.exp(result % 10); // 지수 연산 추가

            // 2. 소수 찾기 (범위 증가)
            const num = Math.floor(Math.random() * 100000);
            if (isPrime(num)) {
                result += Math.sqrt(num);
            }

            // 3. 문자열 연산 (메모리 압박)
            let str = result.toString();
            for (let j = 0; j < 10; j++) {
                str = str + result.toString();
                str = str.slice(0, 50); // 메모리 누수 방지
            }

            // 4. 배열 연산
            const arr = new Array(100).fill(result);
            const sum = arr.reduce((a, b) => a + Math.sin(b), 0);

            // 5. 암호화 유사 연산
            result = hashCompute(result + sum);

            operationCount++;

            // 최적화 방지용 랜덤 분기
            if (Math.random() > 0.95) {
                fibonacci(15); // 피보나치 감소
            }

            // 행렬 연산 감소
            if (i % 500 === 0) {
                matrixMultiply(10);
            }
        }

        // 메인 스레드에 진행 상황 보고 (빈도 감소로 렉 방지)
        reportCounter++;
        if (reportCounter >= 10) { // 10번에 1번만 보고
            self.postMessage({
                type: 'progress',
                operations: operationCount
            });
            operationCount = 0;
            reportCounter = 0;
        }

        // UI 블로킹 방지를 위한 지연 (더 긴 간격)
        setTimeout(loop, 50); // 50ms 대기로 UI 스레드에 여유 제공
    }

    loop();
}

// 소수 판별 함수 (최적화됨)
function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;

    // 더 많은 범위 검사
    const sqrt = Math.sqrt(num);
    for (let i = 5; i <= sqrt; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
    }

    return true;
}

// 피보나치 수열 계산 (CPU 집약적) - 재귀 버전 추가
function fibonacci(n) {
    if (n <= 1) return n;

    // 반복 버전 (더 빠르지만 여전히 CPU 사용)
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        const temp = a + b;
        a = b;
        b = temp;

        // 추가 연산으로 CPU 부하 증가
        Math.sqrt(a * b);
    }
    return b;
}

// 재귀 피보나치 (매우 비효율적, CPU 집약적)
function fibonacciRecursive(n) {
    if (n <= 1) return n;
    return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
}

// 해시 계산 유사 함수 (CPU 집약적)
function hashCompute(value) {
    let hash = 0;
    const str = value.toString();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32비트 정수로 변환
        hash = Math.abs(hash);
    }

    // 추가 연산 (더 많이)
    for (let i = 0; i < 200; i++) {
        hash = Math.sin(hash) * 10000;
        hash = Math.abs(hash);
        hash = Math.pow(hash % 100, 2);
    }

    return hash;
}

// 행렬 곱셈 (추가 CPU 부하)
function matrixMultiply(size) {
    const a = Array(size).fill().map(() => Array(size).fill(Math.random()));
    const b = Array(size).fill().map(() => Array(size).fill(Math.random()));
    const result = Array(size).fill().map(() => Array(size).fill(0));

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            for (let k = 0; k < size; k++) {
                result[i][j] += a[i][k] * b[k][j];
                // 추가 연산
                result[i][j] = Math.sqrt(Math.abs(result[i][j]));
            }
        }
    }

    return result;
}

// 소수 생성 (CPU 집약적)
function generatePrimes(max) {
    const primes = [];
    for (let i = 2; i < max; i++) {
        if (isPrime(i)) {
            primes.push(i);
        }
    }
    return primes;
}

// 복잡한 수학 연산
function complexMath(n) {
    let result = 0;
    for (let i = 0; i < n; i++) {
        result += Math.sin(i) * Math.cos(i * 2) * Math.tan(i * 3);
        result = Math.sqrt(Math.abs(result));
        result = Math.pow(result, 1.5);
    }
    return result;
}
