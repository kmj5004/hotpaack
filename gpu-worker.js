// GPU 가속 워커 - WebGL을 사용하여 GPU에 부하를 줌
let gpuCanvas = null;
let gl = null;
let isGPURunning = false;
let animationFrameId = null;
let intensity = 5;

// 다중 캔버스로 GPU 부하 증가
let additionalCanvases = [];
let additionalContexts = [];

// GPU 초기화
function initGPU() {
    gpuCanvas = document.getElementById('gpuCanvas');
    if (!gpuCanvas) {
        console.log('GPU 캔버스를 찾을 수 없습니다.');
        return false;
    }

    // 메인 캔버스 크기 설정
    gpuCanvas.width = 4096;
    gpuCanvas.height = 4096;

    // WebGL 컨텍스트 생성
    gl = gpuCanvas.getContext('webgl2', {
        powerPreference: 'high-performance', // 고성능 GPU 사용
        antialias: false, // 안티앨리어싱 끄기 (성능 향상)
        depth: true,
        stencil: true,
        preserveDrawingBuffer: false
    }) || gpuCanvas.getContext('webgl') || gpuCanvas.getContext('experimental-webgl');

    if (!gl) {
        console.log('WebGL을 지원하지 않는 브라우저입니다.');
        return false;
    }

    // 추가 캔버스 생성 (더 많은 GPU 부하)
    for (let i = 0; i < 3; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 2048;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('webgl2', {
            powerPreference: 'high-performance'
        }) || canvas.getContext('webgl');

        if (ctx) {
            additionalCanvases.push(canvas);
            additionalContexts.push(ctx);
        }
    }

    console.log('GPU 가속 초기화 완료 - 캔버스 개수:', 1 + additionalContexts.length);
    return true;
}

// 셰이더 컴파일
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('셰이더 컴파일 오류:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// 프로그램 생성
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('프로그램 링크 오류:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

// GPU 집약적인 프로그램 설정
function setupGPUProgram() {
    // Vertex Shader (정점 셰이더)
    const vertexShaderSource = `
        attribute vec4 a_position;
        void main() {
            gl_Position = a_position;
        }
    `;

    // Fragment Shader (프래그먼트 셰이더) - 복잡한 계산으로 GPU 부하 증가
    const fragmentShaderSource = `
        precision highp float;
        uniform float u_time;
        uniform float u_intensity;
        uniform vec2 u_resolution;
        
        // 복잡한 수학 함수들
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            
            // 고정된 반복 횟수 사용
            for(int i = 0; i < 12; i++) {
                value += amplitude * noise(p * frequency);
                frequency *= 2.0;
                amplitude *= 0.5;
            }
            
            return value;
        }
        
        // 레이마칭을 위한 거리 함수
        float sphere(vec3 p, float r) {
            return length(p) - r;
        }
        
        float scene(vec3 p) {
            float t = u_time * 0.5;
            vec3 pos = p;
            pos.x += sin(t) * 0.5;
            pos.y += cos(t * 0.7) * 0.5;
            return sphere(pos, 1.0);
        }
        
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            vec2 p = (uv - 0.5) * 2.0;
            p.x *= u_resolution.x / u_resolution.y;
            
            // 복잡한 패턴 생성 (반복 감소로 렉 방지)
            float n = 0.0;
            int maxIterations = int(u_intensity * 3.0); // 5에서 3으로 감소
            
            for(int i = 0; i < 30; i++) { // 50에서 30으로 감소
                if(i >= maxIterations) break;
                float fi = float(i);
                float t = u_time * 0.1 + fi * 10.0;
                vec2 pos = uv * fi + vec2(cos(t), sin(t));
                n += fbm(pos * 8.0 + u_time * 0.3) / (fi + 1.0);
            }
            
            // 만델브로트 집합 (반복 감소)
            vec2 c = (uv - 0.5) * 4.0;
            vec2 z = vec2(0.0);
            float iterations = 0.0;
            
            for(int i = 0; i < 100; i++) { // 200에서 100으로 감소
                if(length(z) > 4.0) break;
                z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c + sin(u_time * 0.1) * 0.3;
                iterations += 1.0;
            }
            
            // 레이마칭 (스텝 감소)
            vec3 rayOrigin = vec3(0.0, 0.0, -3.0);
            vec3 rayDir = normalize(vec3(p, 1.0));
            float depth = 0.0;
            
            for(int i = 0; i < 32; i++) { // 64에서 32로 감소
                vec3 pos = rayOrigin + rayDir * depth;
                float dist = scene(pos);
                if(dist < 0.001) break;
                depth += dist;
                if(depth > 10.0) break;
            }
            
            // 색상 계산
            vec3 col = vec3(n) + vec3(iterations / 100.0); // 200에서 100으로
            col = mix(col, vec3(1.0, 0.5, 0.2), 0.5);
            
            // 추가 색상 효과 (반복 감소)
            for(int i = 0; i < 3; i++) { // 5에서 3으로 감소
                float t = u_time + float(i) * 2.0;
                col *= vec3(
                    0.5 + 0.5 * cos(t + uv.x + float(i)),
                    0.5 + 0.5 * cos(t + uv.y + float(i) + 2.0),
                    0.5 + 0.5 * cos(t + uv.x + float(i) + 4.0)
                );
            }
            
            // 레이마칭 결과
            col += vec3(1.0 - smoothstep(0.0, 10.0, depth)) * 0.5;
            
            // 추가 연산 제거 (렉 방지)
            
            gl_FragColor = vec4(col, 1.0);
        }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = createProgram(gl, vertexShader, fragmentShader);

    if (!program) return null;

    // 버퍼 설정
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return {
        program: program,
        positionBuffer: positionBuffer,
        positionLocation: gl.getAttribLocation(program, 'a_position'),
        timeLocation: gl.getUniformLocation(program, 'u_time'),
        intensityLocation: gl.getUniformLocation(program, 'u_intensity'),
        resolutionLocation: gl.getUniformLocation(program, 'u_resolution')
    };
}

let programInfo = null;
let startTime = 0;

// GPU 렌더링 루프
function renderGPU() {
    if (!isGPURunning || !gl || !programInfo) return;

    const currentTime = (Date.now() - startTime) * 0.001;

    // 메인 캔버스 렌더링
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.positionBuffer);
    gl.enableVertexAttribArray(programInfo.positionLocation);
    gl.vertexAttribPointer(programInfo.positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(programInfo.timeLocation, currentTime);
    gl.uniform1f(programInfo.intensityLocation, intensity);
    gl.uniform2f(programInfo.resolutionLocation, gl.canvas.width, gl.canvas.height);

    // 여러 번 그리기
    for (let i = 0; i < intensity; i++) {
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // 추가 캔버스들도 렌더링
    additionalContexts.forEach((ctx, index) => {
        if (!ctx) return;

        ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.clearColor(0, 0, 0, 1);
        ctx.clear(ctx.COLOR_BUFFER_BIT);

        // 간단한 셰이더 프로그램 실행 (추가 부하)
        try {
            ctx.useProgram(programInfo.program);
            ctx.bindBuffer(ctx.ARRAY_BUFFER, programInfo.positionBuffer);
            ctx.enableVertexAttribArray(programInfo.positionLocation);
            ctx.vertexAttribPointer(programInfo.positionLocation, 2, ctx.FLOAT, false, 0, 0);

            ctx.uniform1f(programInfo.timeLocation, currentTime + index);
            ctx.uniform1f(programInfo.intensityLocation, intensity);
            ctx.uniform2f(programInfo.resolutionLocation, ctx.canvas.width, ctx.canvas.height);

            for (let i = 0; i < Math.ceil(intensity / 2); i++) {
                ctx.drawArrays(ctx.TRIANGLES, 0, 6);
            }
        } catch (e) {
            // 에러 무시
        }
    });

    // 계속 렌더링 (즉시 다음 프레임)
    animationFrameId = requestAnimationFrame(renderGPU);
}

// GPU 시작
function startGPU(intensityValue) {
    if (isGPURunning) return;

    intensity = intensityValue || 5;

    if (!gl) {
        if (!initGPU()) {
            console.log('GPU 초기화 실패');
            return;
        }
    }

    if (!programInfo) {
        programInfo = setupGPUProgram();
        if (!programInfo) {
            console.log('GPU 프로그램 설정 실패');
            return;
        }
    }

    isGPURunning = true;
    startTime = Date.now();
    console.log('GPU 가속 시작 - 강도:', intensity);
    renderGPU();
}

// GPU 중지
function stopGPU() {
    isGPURunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 추가 캔버스 정리
    additionalCanvases.forEach(canvas => {
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    });
    additionalCanvases = [];
    additionalContexts = [];

    console.log('GPU 가속 중지');
}

// GPU 강도 조절
function setGPUIntensity(value) {
    intensity = value;
    console.log('GPU 강도 변경:', intensity);
}

// 외부에서 접근 가능하도록 export
window.GPUWorker = {
    start: startGPU,
    stop: stopGPU,
    setIntensity: setGPUIntensity
};

// DOM 로드 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGPU);
} else {
    initGPU();
}
