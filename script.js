const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score-value');
const finalScoreElement = document.getElementById('final-score-value');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

canvas.width = 800;
canvas.height = 600;

// Game State
let isPlaying = false;
let score = 0;
let animationId;
let frames = 0;

// Entities
let player;
let projectiles = [];
let enemies = [];
let particles = [];

// Input
const keys = {
    left: false,
    right: false,
    shoot: false
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (isPlaying && !keys.shoot) {
            player.shoot();
            keys.shoot = true;
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'Space' || e.code === 'ArrowUp') keys.shoot = false;
});

class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 7;
        this.color = '#ff3333';
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        // Draw ship shape (triangle)
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    update() {
        if (keys.left && this.x > 0) this.x -= this.speed;
        if (keys.right && this.x + this.width < canvas.width) this.x += this.speed;
        this.draw();
    }

    shoot() {
        projectiles.push(new Projectile(this.x + this.width / 2, this.y));
    }
}

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 16;
        this.radius = 8; // kept for collision detection
        this.speed = 10;
        this.color = '#ffaa00'; // Rocket flame color
        this.bodyColor = '#dddddd';
    }

    draw() {
        ctx.save();
        // Rocket body
        ctx.shadowBlur = 0;
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2); // Tip
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x - this.width / 2, this.y);
        ctx.closePath();
        ctx.fill();

        // Rocket exhaust/flame
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 2 + 1, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2 - 1, this.y + this.height / 2);
        ctx.lineTo(this.x, this.y + this.height / 2 + 6 + Math.random() * 6); // Flickering flame
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.y -= this.speed;
        this.draw();
    }
}

class Enemy {
    constructor(x, y) {
        this.width = 30;
        this.height = 30;
        this.x = x;
        this.y = y;
        // Increase speed based on score
        this.speed = 2 + Math.random() * 2 + (score * 0.05);
        this.color = '#aa0000';
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        // Draw enemy shape (diamond)
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.y += this.speed;
        this.draw();
    }
}

class Particle {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 3;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02;
        this.draw();
    }
}

function init() {
    player = new Player();
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreElement.innerText = score;
    frames = 0;
}

function spawnEnemies() {
    // Spawn rate increases with score
    const spawnRate = Math.max(30, 100 - score * 2);
    if (frames % Math.floor(spawnRate) === 0) {
        const x = Math.random() * (canvas.width - 30);
        enemies.push(new Enemy(x, -30));
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(
            x, 
            y, 
            color, 
            {
                x: (Math.random() - 0.5) * (Math.random() * 8),
                y: (Math.random() - 0.5) * (Math.random() * 8)
            }
        ));
    }
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

function animate() {
    if (!isPlaying) return;
    
    animationId = requestAnimationFrame(animate);
    
    // Create a trailing effect
    ctx.fillStyle = 'rgba(10, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    player.update();
    spawnEnemies();
    
    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        if (particle.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            particle.update();
        }
    }
    
    // Update Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();
        
        // Remove off-screen projectiles
        if (p.y + p.radius < 0) {
            projectiles.splice(i, 1);
        }
    }
    
    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update();
        
        // Remove off-screen enemies
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
            continue;
        }
        
        // Collision: Player & Enemy
        if (rectIntersect(player.x, player.y, player.width, player.height, enemy.x, enemy.y, enemy.width, enemy.height)) {
            gameOver();
            return;
        }
        
        // Collision: Projectile & Enemy
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const p = projectiles[j];
            
            // Treat projectile as a small rectangle for collision
            if (rectIntersect(enemy.x, enemy.y, enemy.width, enemy.height, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2)) {
                // Destroy both
                createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color);
                
                setTimeout(() => {
                    enemies.splice(i, 1);
                    projectiles.splice(j, 1);
                }, 0);
                
                score += 10;
                scoreElement.innerText = score;
                break; // One projectile hits one enemy
            }
        }
    }
    
    frames++;
}

function startGame() {
    init();
    isPlaying = true;
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    animate();
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(animationId);
    
    // Final explosion
    createExplosion(player.x + player.width/2, player.y + player.height/2, player.color);
    
    // Draw particles briefly
    const deathAnim = setInterval(() => {
        ctx.fillStyle = 'rgba(10, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            if (particle.alpha <= 0) {
                particles.splice(i, 1);
            } else {
                particle.update();
            }
        }
        
        if (particles.length === 0) {
            clearInterval(deathAnim);
            finalScoreElement.innerText = score;
            gameOverScreen.classList.add('active');
        }
    }, 1000/60);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Draw initial background
ctx.fillStyle = '#0a0000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
