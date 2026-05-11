/* 
 * Técnica: DOM Manipulation / Caching
 * Por que: Armazenar referências de elementos do DOM evita consultas repetidas
 * na árvore do documento, o que aumenta a performance (crucial em jogos).
 */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = 800;
const HEIGHT = 600;

/*
 * Técnica: Global State Management (Gerenciamento de Estado Global)
 * Por que: Manter variáveis de controle num escopo superior permite que 
 * diferentes funções e classes acessem e modifiquem o estado atual da 
 * aplicação facilmente, sem precisar ficar repassando parâmetros.
 */
let score = 0;
let lives = 3;
let level = 0;
let gameOver = true;
let isPaused = false;

/*
 * Técnica: Entity Pooling / Arrays
 * Por que: Agrupar entidades similares (asteroides, tiros) em arrays dinâmicos
 * facilita a iteração e atualização em massa dentro do game loop.
 */
let ship = null;
let asteroids = [];
let bullets = [];

/*
 * Técnica: Flag Variables
 * Por que: Variáveis booleanas simples para mapear o estado ativado/desativado 
 * de controles, desacoplando o recebimento do input da lógica de movimento.
 */
let virtualLeft = false;
let virtualRight = false;
let virtualThrust = false;
let virtualFire = false;

/*
 * Técnica: Input Mapping (Dicionário/Objeto de Estados)
 * Por que: Em vez de múltiplos event listeners executando lógicas complexas, 
 * armazenamos o estado da tecla (pressionada ou não) num mapa (objeto chave-valor).
 * O game loop consome esse mapa suavemente, permitindo movimentos contínuos e 
 * suporte ao pressionamento de múltiplas teclas simultaneamente.
 */
const keys = {};

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyP') isPaused = !isPaused;
    if (e.code === 'Space' && gameOver) newGame();
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

/*
 * Técnica: Object-Oriented Programming (OOP) / Classes
 * Por que: Modelar as entidades do jogo como objetos permite encapsular
 * propriedades (posição, velocidade) e comportamentos (update, draw) juntos.
 * Facilita a manutenção, o polimorfismo e instâncias independentes.
 */
class Ship {
    constructor() {
        this.radius = 15;
        this.reset();

        /*
         * Técnica: Magic Numbers Extraction / Configuração Baseada em Variáveis
         * Por que: Definir constantes de física (atrito, velocidade) permite
         * balanceamento rápido e fácil do gameplay.
         */
        this.rotation_speed = 0.05;
        this.thrust_accel = 0.05;
        this.friction = 0.995;

        /*
         * Técnica: Cooldown Implementation / Timestamp Delta
         * Por que: Limitar a cadência de tiro e invulnerabilidade usando o tempo 
         * atual (ms) em vez de frames, mantendo a consistência independente de variações no FPS.
         */
        this.shot_cooldown = 200;
        this.invulnerability_duration = 3000;
    }

    /*
     * Técnica: Reset / Reinitialization Method
     * Por que: Centraliza o reset do estado da entidade num método que pode 
     * ser chamado ao recomeçar a vida ou jogo, evitando recriar o objeto inteiro na memória.
     */
    reset() {
        this.x = WIDTH / 2;
        this.y = HEIGHT / 2;
        this.velX = 0;
        this.velY = 0;
        this.angle = 0;

        this.thrust_active = false;
        this.last_shot_time = 0;
        this.invulnerable_until = Date.now() + this.invulnerability_duration;
    }

    rotate(direction) {
        /*
         * Técnica: Circular Constraint (Módulo Aritmético)
         * Por que: Restringir a rotação entre 0 e 2 PI previne estouro numérico 
         * em execuções muito longas e simplifica cálculos trigonométricos.
         */
        this.angle += this.rotation_speed * direction;
        this.angle = (this.angle + Math.PI * 2) % (Math.PI * 2);
    }

    thrust() {
        /*
         * Técnica: Vetores e Trigonometria
         * Por que: Usa Seno e Cosseno para decompor o ângulo em vetores de 
         * aceleração X e Y, permitindo movimento fluido para qualquer direção.
         */
        this.velX += this.thrust_accel * Math.cos(this.angle);
        this.velY -= this.thrust_accel * Math.sin(this.angle);
    }

    update() {
        /*
         * Técnica: Euler Integration (Simulação Física)
         * Por que: Atualizar a velocidade baseando-se em atrito (multiplicação) e
         * somar a velocidade à posição gera uma física contínua e realista de inércia.
         */
        this.velX *= this.friction;
        this.velY *= this.friction;

        this.x += this.velX;
        this.y += this.velY;

        /*
         * Técnica: Toroidal Wrapping (Espaço Infinito/Loop)
         * Por que: Em clássicos como Asteroids, se o objeto sai por uma borda
         * ele reaparece na outra. Usamos checagens e aritmética modular para esse "teletransporte".
         */
        if (this.x < 0) this.x += WIDTH;
        if (this.x >= WIDTH) this.x %= WIDTH;
        if (this.y < 0) this.y += HEIGHT;
        if (this.y >= HEIGHT) this.y %= HEIGHT;
    }

    is_invulnerable() {
        return Date.now() < this.invulnerable_until;
    }

    draw(ctx) {
        if (this.is_invulnerable()) {
            /*
             * Técnica: Temporal Blink Effect (Piscar Temporal)
             * Por que: Utiliza o tempo e a operação módulo para alternar a 
             * renderização frame sim, frame não, criando efeito visual de dano/invulnerabilidade.
             */
            if (Math.floor(Date.now() / 100) % 2 === 0) return;
        }

        /*
         * Técnica: Matrix Transformations (Save/Restore e Translate/Rotate)
         * Por que: No HTML5 Canvas, é mais performático transladar e rotacionar todo o
         * contexto de desenho para o centro da nave e desenhá-la estaticamente, 
         * do que recalcular manualmente todos os vértices baseados na rotação.
         */
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        if (this.thrust_active) {
            ctx.fillStyle = '#ffc000';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff3c3c';
            ctx.beginPath();
            ctx.arc(-this.radius * 1.5, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        /*
         * Técnica: Path Rendering (Immediate Mode GUI)
         * Por que: Redesenhar as formas geométricas a cada frame é a abordagem 
         * padrão e mais flexível em Canvas 2D.
         */
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, this.radius * 0.8);
        ctx.lineTo(-this.radius, -this.radius * 0.8);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, angle) {
        this.radius = 3;
        this.x = x;
        this.y = y;
        this.speed = 8;
        /*
         * Técnica: Object Lifespan (Tempo de Vida)
         * Por que: Definir um limite de duração em frames para destruir projéteis 
         * antigas previne vazamento de memória e sobrecarga do loop de renderização.
         */
        this.lifespan = 90;

        this.velX = this.speed * Math.cos(angle);
        this.velY = -this.speed * Math.sin(angle);
    }

    update() {
        this.x += this.velX;
        this.y += this.velY;
        this.lifespan--;

        if (this.x < 0) this.x += WIDTH;
        if (this.x >= WIDTH) this.x %= WIDTH;
        if (this.y < 0) this.y += HEIGHT;
        if (this.y >= HEIGHT) this.y %= HEIGHT;
    }

    draw(ctx) {
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Asteroid {
    constructor(x, y, radius) {
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.speed = 10 / radius;

        /*
         * Técnica: Randomization (Aleatoriedade Controlada)
         * Por que: Adicionar ângulos e rotações matemáticas aleatórias traz 
         * diversidade aos inimigos e torna o jogo imprevisível e dinâmico.
         */
        const angle = Math.random() * Math.PI * 2;
        this.velX = this.speed * Math.cos(angle);
        this.velY = this.speed * Math.sin(angle);

        this.rotation_speed = (Math.random() * 2 - 1) * 0.05;
        this.current_rotation = Math.random() * Math.PI * 2;

        /*
         * Técnica: Procedural Generation (Geração Procedural)
         * Por que: Criar o formato no momento da instância garante que cada 
         * asteroide tenha uma silhueta única, em vez de carregar imagens estáticas.
         */
        this.points = this.create_shape();
    }

    create_shape() {
        const points = [];
        const num_points = 10;
        for (let i = 0; i < num_points; i++) {
            const jagged_radius = this.radius * (0.7 + Math.random() * 0.6);
            const angle = (Math.PI * 2 / num_points) * i;
            const x = jagged_radius * Math.cos(angle);
            const y = jagged_radius * Math.sin(angle);
            points.push({ x, y });
        }
        return points;
    }

    update() {
        this.x += this.velX;
        this.y += this.velY;
        this.current_rotation += this.rotation_speed;

        if (this.x < 0) this.x += WIDTH;
        if (this.x >= WIDTH) this.x %= WIDTH;
        if (this.y < 0) this.y += HEIGHT;
        if (this.y >= HEIGHT) this.y %= HEIGHT;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.current_rotation);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    split() {
        /*
         * Técnica: Factory Method / Object Instantiation
         * Por que: Quando o asteróide é destruído, ele retorna novas instâncias de si mesmo 
         * divididas, injetando novos objetos na pool existente e ramificando a dificuldade.
         */
        if (this.radius > 20) {
            const new_radius = this.radius / 2;
            return [
                new Asteroid(this.x + new_radius, this.y, new_radius),
                new Asteroid(this.x - new_radius, this.y, new_radius)
            ];
        }
        return [];
    }
}

/*
 * Técnica: Circular Collision Detection / AABB (Math.hypot)
 * Por que: Checar a colisão utilizando a distância entre centros (Teorema de Pitágoras) 
 * contra a soma dos raios é o algoritmo de colisão mais leve e rápido para objetos rotativos.
 */
function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const dist = Math.hypot(dx, dy);
    return dist < (obj1.radius + obj2.radius);
}

/*
 * Técnica: Funções de Controle de Fluxo de Jogo (State Machines Básicas)
 * Por que: Separar a criação de novo jogo e novo nível em funções limpas para 
 * reaproveitamento de código em transições e game-overs.
 */
function newGame() {
    score = 0;
    lives = 3;
    level = 0;
    ship = new Ship();
    asteroids = [];
    bullets = [];
    gameOver = false;
    isPaused = false;
    newLevel();
}

function newLevel() {
    level++;
    const numAsteroids = 3 + level;
    for (let i = 0; i < numAsteroids; i++) {
        let x = Math.random() < 0.5 ? Math.random() * (WIDTH / 4) : WIDTH - Math.random() * (WIDTH / 4);
        let y = Math.random() < 0.5 ? Math.random() * (HEIGHT / 4) : HEIGHT - Math.random() * (HEIGHT / 4);
        asteroids.push(new Asteroid(x, y, 50));
    }
}

/*
 * Técnica: Data Structures for Configuration
 * Por que: Configurar os botões da UI como um objeto centralizado facilita muito 
 * iterar na renderização e checagem de toques depois, promovendo uma arquitetura Data-Driven.
 */
const BTN_SIZE = 70;
const BTN_MARGIN = 10;
const BOTTOM_Y = HEIGHT - 80;

const VControls = {
    left: { x: BTN_MARGIN, y: BOTTOM_Y, w: BTN_SIZE, h: BTN_SIZE, text: 'ROT-E' },
    thrust: { x: BTN_MARGIN + BTN_SIZE + BTN_MARGIN, y: BOTTOM_Y, w: BTN_SIZE, h: BTN_SIZE, text: 'PROP' },
    right: { x: BTN_MARGIN + 2 * (BTN_SIZE + BTN_MARGIN), y: BOTTOM_Y, w: BTN_SIZE, h: BTN_SIZE, text: 'ROT-D' },
    fire: { x: WIDTH - BTN_MARGIN - BTN_SIZE, y: BOTTOM_Y, w: BTN_SIZE, h: BTN_SIZE, text: 'FOGO' },
    pause: { x: WIDTH - BTN_MARGIN - 2 * BTN_SIZE - BTN_MARGIN, y: BOTTOM_Y, w: BTN_SIZE, h: BTN_SIZE, text: 'PAUSAR' }
};

function drawVirtualControls() {
    ctx.font = '14px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const [key, btn] of Object.entries(VControls)) {
        let active = false;
        if (key === 'left') active = virtualLeft;
        if (key === 'right') active = virtualRight;
        if (key === 'thrust') active = virtualThrust;
        if (key === 'fire') active = virtualFire;
        if (key === 'pause') active = isPaused;

        /*
         * Técnica: Conditional Styling (Operador Ternário Duplo)
         * Por que: Definir a cor visual baseada no estado booleano do botão instantaneamente.
         */
        ctx.fillStyle = active ?
            (key === 'fire' ? '#ffc000' : (key === 'pause' ? '#ff3c3c' : '#5e77ff'))
            : 'rgba(50, 50, 50, 0.7)';

        ctx.beginPath();

        /*
         * Técnica: Feature Detection / Polyfill Fallback
         * Por que: Fallback de código garante que o jogo funcione em navegadores 
         * que não suportam bordas arredondadas na API do Canvas (roundRect).
         */
        if (ctx.roundRect) {
            ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 10);
        } else {
            ctx.rect(btn.x, btn.y, btn.w, btn.h);
        }
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.stroke();

        ctx.fillStyle = (key === 'fire' && active) ? '#000' : '#fff';
        ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
    }
}

/*
 * Técnica: AABB Hit Detection para UI (Bounding Box)
 * Por que: Checa se uma coordenada X/Y (mouse/touch) se encontra dentro dos 
 * limites retangulares do botão. Técnica padrão de detecção para botões.
 */
function checkHit(x, y, btn) {
    return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
}

function processInputs(inputs) {
    let l = false, r = false, t = false, f = false;

    /*
     * Técnica: Aggregation of Inputs
     * Por que: Permite processar múltiplos toques ou o ponteiro do mouse 
     * e unificar em flags booleanas para o loop de gameplay ler depois.
     */
    for (const pos of inputs) {
        if (checkHit(pos.x, pos.y, VControls.left)) l = true;
        if (checkHit(pos.x, pos.y, VControls.right)) r = true;
        if (checkHit(pos.x, pos.y, VControls.thrust)) t = true;
        if (checkHit(pos.x, pos.y, VControls.fire)) f = true;
    }

    virtualLeft = l;
    virtualRight = r;
    virtualThrust = t;
    virtualFire = f;
}

/*
 * Técnica: Unified Event Handling e Coordinate Mapping
 * Por que: Mapear coordenadas do dispositivo para o tamanho interno lógico do 
 * canvas com multiplicadores (ScaleX/ScaleY). Lida com touch e mouse de forma agnóstica.
 */
function handlePointers(e) {
    e.preventDefault();
    if (gameOver) {
        if (e.type === 'touchstart' || e.type === 'mousedown') newGame();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const inputs = [];

    if (e.touches) {
        for (let i = 0; i < e.touches.length; i++) {
            inputs.push({
                x: (e.touches[i].clientX - rect.left) * scaleX,
                y: (e.touches[i].clientY - rect.top) * scaleY
            });
        }

        if (e.type === 'touchstart') {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const tx = (e.changedTouches[i].clientX - rect.left) * scaleX;
                const ty = (e.changedTouches[i].clientY - rect.top) * scaleY;
                if (checkHit(tx, ty, VControls.pause)) isPaused = !isPaused;
            }
        }
    }
    else if (isMouseDown) {
        inputs.push({
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        });
    }

    processInputs(inputs);
}

/*
 * Técnica: Listener Registration
 * Por que: Uso de { passive: false } permite chamar e.preventDefault(), 
 * bloqueando o comportamento padrão do navegador de rolar a página em dispositivos móveis.
 */
canvas.addEventListener('touchstart', handlePointers, { passive: false });
canvas.addEventListener('touchmove', handlePointers, { passive: false });
canvas.addEventListener('touchend', handlePointers, { passive: false });
canvas.addEventListener('touchcancel', handlePointers, { passive: false });

let isMouseDown = false;
canvas.addEventListener('mousedown', e => {
    isMouseDown = true;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (!gameOver && checkHit(x, y, VControls.pause)) isPaused = !isPaused;

    handlePointers(e);
});
canvas.addEventListener('mousemove', e => { if (isMouseDown) handlePointers(e); });
canvas.addEventListener('mouseup', e => { isMouseDown = false; handlePointers(e); });

/*
 * Técnica: Logic Step (Fase de Atualização do Modelo)
 * Por que: Separa a resolução de regras (movimento, colisões, spawns, remoções) 
 * da fase visual. O padrão Update/Draw é o alicerce de qualquer engine.
 */
function update() {
    if (gameOver || isPaused) return;

    ship.thrust_active = false;

    if (keys['ArrowLeft'] || keys['KeyA'] || virtualLeft) ship.rotate(1);
    if (keys['ArrowRight'] || keys['KeyD'] || virtualRight) ship.rotate(-1);

    if (keys['ArrowUp'] || keys['KeyW'] || virtualThrust) {
        ship.thrust();
        ship.thrust_active = true;
    }

    if (keys['Space'] || virtualFire) {
        if (!ship.is_invulnerable()) {
            const now = Date.now();
            if (now - ship.last_shot_time > ship.shot_cooldown) {
                ship.last_shot_time = now;
                const bx = ship.x + ship.radius * Math.cos(ship.angle);
                const by = ship.y - ship.radius * Math.sin(ship.angle);
                bullets.push(new Bullet(bx, by, ship.angle));
            }
        }
    }

    ship.update();

    /*
     * Técnica: Reverse Iteration (Iteração Inversa)
     * Por que: Ao deletar elementos do próprio array iterado via "splice", devemos iterar de trás
     * para frente. Caso iterássemos do começo, deletar um índice causaria um pulo de entidade, ignorando colisões.
     */
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].lifespan <= 0) {
            bullets.splice(i, 1);
        }
    }

    for (let ast of asteroids) {
        ast.update();
    }

    /*
     * Técnica: Nested Collision Loop O(N*M)
     * Por que: Checa todo tiro existente contra todo asteróide existente. Em um jogo leve 
     * como este, não é necessário otimizações espaciais como Quadtrees.
     */
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
            if (bullets[i] && checkCollision(bullets[i], asteroids[j])) {
                const ast = asteroids[j];
                score += Math.floor(100 / ast.radius);

                const newAsts = ast.split();
                asteroids.splice(j, 1);
                asteroids.push(...newAsts);

                bullets.splice(i, 1);
                break;
            }
        }
    }

    if (!ship.is_invulnerable()) {
        for (let ast of asteroids) {
            if (checkCollision(ship, ast)) {
                lives--;
                if (lives <= 0) {
                    gameOver = true;
                } else {
                    ship.reset();
                }
                break;
            }
        }
    }

    if (asteroids.length === 0) {
        newLevel();
    }
}

/*
 * Técnica: Render Phase (Fase de Desenho)
 * Por que: Todo o código visual e estético fica isolado aqui. Garante que 
 * se desligarmos isso, o jogo continua rodando invisivelmente na memória de forma perfeita.
 */
function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (gameOver) {
        ctx.fillStyle = '#5e77ff';
        ctx.font = '74px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(level === 0 ? "ASTEROIDES JS" : "FIM DE JOGO!", WIDTH / 2, HEIGHT / 2 - 50);

        ctx.fillStyle = '#ffc000';
        ctx.font = '40px Orbitron';
        ctx.fillText(level === 0 ? "Sobrevivência Espacial" : `Pontuação Final: ${score}`, WIDTH / 2, HEIGHT / 2 + 30);

        ctx.fillStyle = '#fff';
        ctx.font = '24px Orbitron';
        ctx.fillText("Pressione ESPAÇO ou TOQUE na tela para Iniciar", WIDTH / 2, HEIGHT * 0.75);
        return;
    }

    if (isPaused) {
        ctx.fillStyle = '#ffc000';
        ctx.font = '74px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText("PAUSADO", WIDTH / 2, HEIGHT / 2);
        drawVirtualControls();
        return;
    }

    ship.draw(ctx);

    for (let ast of asteroids) {
        ast.draw(ctx);
    }

    for (let bullet of bullets) {
        bullet.draw(ctx);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '30px Orbitron';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`Pontos: ${score}`, WIDTH - 50, 40);

    ctx.textAlign = 'left';
    ctx.fillText(`Nível: ${level}`, 50, 40);

    /*
     * Técnica: UI Rendering Loop
     * Por que: Usar o mesmo sistema de "save/rotate/restore" para desenhar
     * ícones na tela reduz duplicação de lógicas de sprites.
     */
    for (let i = 0; i < lives; i++) {
        ctx.save();
        ctx.translate(65 + i * 35, 75);
        ctx.rotate(-Math.PI / 2);

        ctx.strokeStyle = '#5e77ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-10, 8);
        ctx.lineTo(-10, -8);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    drawVirtualControls();
}

/*
 * Técnica: Fixed Time Step Game Loop / Throttling
 * Por que: requestAnimationFrame executa na taxa do monitor (ex: 60Hz, 144Hz).
 * Utilizar deltaTime garante que computadores mais rápidos limitem as chamadas 
 * para ~60 FPS, mantendo a física consistente com o planejado (e impedindo que 
 * monitores de 144hz rodem o jogo ao dobro da velocidade real).
 */
let lastTime = 0;
const FPS = 60;
const frameDuration = 1000 / FPS;

function loop(timestamp) {
    requestAnimationFrame(loop);

    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;

    if (deltaTime >= frameDuration) {
        lastTime = timestamp - (deltaTime % frameDuration);

        update();
        draw();
    }
}

// Atualiza o ano no footer automaticamente
document.getElementById('current-year').textContent = new Date().getFullYear();

requestAnimationFrame(loop);
