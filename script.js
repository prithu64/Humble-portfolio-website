console.log('game.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');

    // Modal setup
    const modal = document.getElementById('gameModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    const playButton = document.getElementById('playButton');
    if (!playButton) {
        console.error('Play button not found');
        return;
    }
    const closeButton = document.querySelector('.close');
    if (!closeButton) {
        console.error('Close button not found');
        return;
    }

    playButton.addEventListener('click', () => {
        console.log('Play button clicked');
        modal.style.display = 'flex';
        console.log('Modal opened');
        initializeGame();
    });

    closeButton.addEventListener('click', () => {
        console.log('Close button clicked');
        modal.style.display = 'none';
        console.log('Modal closed');
        resetGame();
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            console.log('Clicked outside modal');
            modal.style.display = 'none';
            console.log('Modal closed by clicking outside');
            resetGame();
        }
    });

    // Game setup
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Canvas context not initialized');
        return;
    }
    console.log('Canvas and context initialized');

    // Detect if the user is on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('Is mobile device:', isMobile);

    // Set canvas size dynamically
    function resizeCanvas() {
        const maxWidth = window.innerWidth * 0.8;
        const maxHeight = window.innerHeight * 0.7;
        const aspectRatio = 400 / 600;

        if (maxWidth / maxHeight > aspectRatio) {
            canvas.height = Math.min(maxHeight, 600);
            canvas.width = canvas.height * aspectRatio;
        } else {
            canvas.width = Math.min(maxWidth, 400);
            canvas.height = canvas.width / aspectRatio;
        }
        console.log(`Canvas resized to ${canvas.width}x${canvas.height}`);

        // Update bird and pipe properties
        bird.x = canvas.width * 0.125;
        bird.y = canvas.height * 0.5;
        bird.width = canvas.width * 0.05;
        bird.height = canvas.height * 0.033;
        pipeWidth = canvas.width * 0.125;
        pipeGap = canvas.height * 0.25;

        // Log bird's initial position
        console.log(`Bird initial position: x=${bird.x}, y=${bird.y}, width=${bird.width}, height=${bird.height}`);
    }

    // Bird properties
    const bird = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        gravity: 0.4,
        lift: isMobile ? -8 : -6, // Higher jump on mobile (-8) vs desktop (-6)
        velocity: -3
    };

    // Pipe properties
    let pipeWidth = 0;
    let pipeGap = 0;
    const pipes = [];
    let frameCount = 0;
    const pipeFrequency = 90;

    let score = 0;
    let gameRunning = false;
    let canJump = true; // To prevent rapid jumps

    // Initialize game
    function initializeGame() {
        console.log('Initializing game');
        resizeCanvas();
        window.addEventListener('resize', () => {
            resizeCanvas();
            if (!gameRunning) resetGame();
        });
        resetGame();
    }

    // Jump function with debounce
    function jump() {
        if (!gameRunning) {
            gameRunning = true;
            gameLoop();
            console.log('Game started');
        }
        if (canJump) {
            bird.velocity = bird.lift;
            canJump = false;
            setTimeout(() => {
                canJump = true;
            }, 200); // 200ms debounce
        }
    }

    // Event listeners for game controls
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && modal.style.display === 'flex') {
            event.preventDefault();
            jump();
        }
    });
    document.addEventListener('keyup', (event) => {
        if (event.code === 'Space') {
            canJump = true; // Allow jump on key release
        }
    });
    canvas.addEventListener('touchstart', (event) => {
        if (modal.style.display === 'flex') {
            event.preventDefault();
            jump();
        }
    });

    // Pipe constructor
    function Pipe() {
        this.x = canvas.width;
        this.top = Math.random() * (canvas.height - pipeGap - canvas.height * 0.166) + canvas.height * 0.083;
        this.bottom = this.top + pipeGap;
        this.counted = false;
    }

    // Game loop (reverted to original, without delta time for now)
    function gameLoop() {
        if (!gameRunning) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update bird
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;

        // Keep bird in bounds
        if (bird.y + bird.height > canvas.height) {
            bird.y = canvas.height - bird.height;
            bird.velocity = 0;
            endGame();
            return;
        }
        if (bird.y < 0) {
            bird.y = 0;
            bird.velocity = 0;
        }

        // Draw bird
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
        console.log(`Drawing bird at x=${bird.x}, y=${bird.y}, width=${bird.width}, height=${bird.height}`);

        // Generate pipes
        if (frameCount % pipeFrequency === 0) {
            pipes.push(new Pipe());
        }
        frameCount++;

        // Update and draw pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= 2;

            ctx.fillStyle = 'green';
            ctx.fillRect(pipes[i].x, 0, pipeWidth, pipes[i].top);
            ctx.fillRect(pipes[i].x, pipes[i].bottom, pipeWidth, canvas.height - pipes[i].bottom);

            if (
                bird.x + bird.width > pipes[i].x &&
                bird.x < pipes[i].x + pipeWidth &&
                (bird.y < pipes[i].top || bird.y + bird.height > pipes[i].bottom)
            ) {
                endGame();
                return;
            }

            if (!pipes[i].counted && bird.x > pipes[i].x + pipeWidth) {
                score++;
                pipes[i].counted = true;
            }

            if (pipes[i].x + pipeWidth < 0) {
                pipes.splice(i, 1);
            }
        }

        // Draw score
        ctx.fillStyle = 'black';
        ctx.font = `${canvas.width * 0.05}px Arial`;
        ctx.fillText(`Score: ${score}`, canvas.width * 0.025, canvas.height * 0.05);

        requestAnimationFrame(gameLoop);
    }

    // End game and show "Game Over"
    function endGame() {
        gameRunning = false;
        console.log('Game over');

        // Draw "Game Over" text
        ctx.fillStyle = 'red';
        ctx.font = `${canvas.width * 0.1}px Arial`;
        const gameOverText = 'Game Over';
        const textWidth = ctx.measureText(gameOverText).width;
        ctx.fillText(gameOverText, (canvas.width - textWidth) / 2, canvas.height * 0.4);
        console.log('Game Over text drawn');

        // Draw final score
        ctx.fillStyle = 'black';
        ctx.font = `${canvas.width * 0.05}px Arial`;
        const scoreText = `Score: ${score}`;
        const scoreTextWidth = ctx.measureText(scoreText).width;
        ctx.fillText(scoreText, (canvas.width - scoreTextWidth) / 2, canvas.height * 0.5);
        console.log('Final score drawn');

        // Reset after a delay
        setTimeout(() => {
            resetGame();
            console.log('Game reset after delay');
        }, 2000);
    }

    // Reset game to start screen
    function resetGame() {
        console.log('Resetting game');
        bird.y = canvas.height * 0.5;
        bird.velocity = -3;
        pipes.length = 0;
        score = 0;
        frameCount = 0;
        gameRunning = false;
        canJump = true;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log('Canvas cleared');

        ctx.fillStyle = 'yellow';
        ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
        console.log(`Drawing bird at x=${bird.x}, y=${bird.y}, width=${bird.width}, height=${bird.height} (reset)`);

        ctx.fillStyle = 'black';
        ctx.font = `${canvas.width * 0.05}px Arial`;
        const text = 'Tap or Space to Start';
        const textWidth = ctx.measureText(text).width;
        ctx.fillText(text, (canvas.width - textWidth) / 2, canvas.height * 0.5);
        console.log('Start text drawn');
    }
});