// Rasta Mario - Jeu de Plateforme
// Initialisation du canvas et du contexte
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Chargement des images
const bobImage = new Image();
bobImage.src = 'bob.png';

const babylonImage = new Image();
babylonImage.src = 'babylon.png';

const banquierImage = new Image();
banquierImage.src = 'banquier.png';

const politicienImage = new Image();
politicienImage.src = 'politicien.png';

const jugeImage = new Image();
jugeImage.src = 'juge.png';

// Variables globales du jeu
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    gameRunning: true,
    keys: {},
    gameOver: false
};



// Classe Joueur (Rasta Mario)
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 40;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpPower = 15;
        this.onGround = false;
        this.direction = 'right';
    }

    update() {
        // Gestion des contrôles
        if (gameState.keys['ArrowLeft']) {
            this.velocityX = -this.speed;
            this.direction = 'left';
        } else if (gameState.keys['ArrowRight']) {
            this.velocityX = this.speed;
            this.direction = 'right';
        } else {
            this.velocityX = 0;
        }

        // Saut
        if (gameState.keys[' '] && this.onGround) {
            this.velocityY = -this.jumpPower;
            this.onGround = false;
        }

        // Gravité
        this.velocityY += 0.8;

        // Mise à jour de la position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Limites de l'écran
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        // Sol de base
        if (this.y + this.height > canvas.height - 50) {
            this.y = canvas.height - 50 - this.height;
            this.velocityY = 0;
            this.onGround = true;
        }

        // Collision avec les plateformes
        this.checkPlatformCollisions();
    }

    checkPlatformCollisions() {
        for (let platform of platforms) {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                // Collision par le haut
                if (this.velocityY > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                }
            }
        }
    }

    draw() {
        // Dessiner l'image de Bob
        if (bobImage.complete) {
            // Flip horizontal si le personnage va vers la gauche
            if (this.direction === 'left') {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(bobImage, -this.x - this.width, this.y, this.width, this.height);
                ctx.restore();
            } else {
                ctx.drawImage(bobImage, this.x, this.y, this.width, this.height);
            }
        } else {
            // Fallback: rectangle coloré si l'image n'est pas encore chargée
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Classe Plateforme
class Platform {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Bordure rasta
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// Classe Collectible (Ganja)
class Collectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 28;
        this.collected = false;
        this.bounce = 0;
        this.shimmer = 0;
    }
    
    reset() {
        this.collected = false;
        this.bounce = 0;
        this.shimmer = 0;
    }

    update() {
        this.bounce += 0.08;
        this.shimmer += 0.15;
        
        // Collision avec le joueur
        if (!this.collected &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            
            this.collected = true;
            gameState.score += 100;
            updateScore();
        }
    }

    draw() {
        if (!this.collected) {
            let bounceY = this.y + Math.sin(this.bounce) * 2;
            let centerX = this.x + 12;
            let centerY = bounceY + 14;
            
            // Effet de brillance
            let shimmerEffect = Math.sin(this.shimmer) * 0.3 + 0.7;
            
            // Feuille principale de cannabis - forme plus réaliste
            ctx.fillStyle = `rgba(34, 139, 34, ${shimmerEffect})`;
            
            // Feuille centrale (la plus grande)
            ctx.beginPath();
            ctx.ellipse(centerX, centerY - 2, 6, 14, 0, 0, 2 * Math.PI);
            ctx.fill();
            
            // Feuilles latérales (7 segments typiques d'une feuille de cannabis)
            for (let i = 0; i < 6; i++) {
                let angle = (i - 2.5) * 0.4;
                let leafLength = 12 - Math.abs(i - 2.5) * 2;
                let leafWidth = 3 - Math.abs(i - 2.5) * 0.3;
                
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(angle);
                
                // Gradient pour chaque segment
                let gradient = ctx.createLinearGradient(0, -leafLength/2, 0, leafLength/2);
                gradient.addColorStop(0, '#228B22');
                gradient.addColorStop(0.3, '#32CD32');
                gradient.addColorStop(0.7, '#228B22');
                gradient.addColorStop(1, '#006400');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.ellipse(0, -2, leafWidth, leafLength, 0, 0, 2 * Math.PI);
                ctx.fill();
                
                // Nervures de la feuille
                ctx.strokeStyle = '#006400';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(0, -leafLength + 2);
                ctx.lineTo(0, leafLength - 2);
                ctx.stroke();
                
                ctx.restore();
            }
            
            // Détails supplémentaires - nervures principales
            ctx.strokeStyle = '#006400';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - 12);
            ctx.lineTo(centerX, centerY + 8);
            ctx.stroke();
            
            // Tige plus détaillée
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(centerX - 1, centerY + 8, 2, 6);
            
            // Petites feuilles sur la tige
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.ellipse(centerX - 2, centerY + 10, 2, 3, -0.3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(centerX + 2, centerY + 12, 2, 3, 0.3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Effet de brillance/aura
            ctx.strokeStyle = `rgba(255, 215, 0, ${Math.sin(this.shimmer) * 0.5 + 0.5})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, 16, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

// Classe Ennemi (Babylone - Le Système Oppressif)
class Enemy {
    constructor(x, y, type = 'police') {
        this.x = x;
        this.y = y;
        this.initialX = x; // Position initiale X
        this.initialY = y; // Position initiale Y
        this.width = 28;
        this.height = 32;
        this.velocityX = 1.5;
        this.initialVelocityX = 1.5; // Vitesse initiale
        this.alive = true;
        this.type = type; // 'police', 'politician', 'corporate', 'juge'
        this.animationFrame = 0;
    }
    
    reset() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.velocityX = this.initialVelocityX;
        this.alive = true;
        this.animationFrame = 0;
    }

    update() {
        if (!this.alive) return;
        
        this.x += this.velocityX;
        this.animationFrame += 0.1;
        
        // Rebond sur les bords et plateformes
        if (this.x <= 0 || this.x + this.width >= canvas.width) {
            this.velocityX = -this.velocityX;
        }
        
        // Collision avec le joueur
        if (this.alive &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            
            // Si le joueur saute sur l'ennemi
            if (player.velocityY > 0 && player.y < this.y) {
                this.alive = false;
                player.velocityY = -8;
                gameState.score += 200;
                updateScore();
            } else {
                // Le joueur perd une vie
                gameState.lives--;
                updateLives();
                if (gameState.lives <= 0) {
                    gameOver();
                } else {
                    // Respawn du joueur
                    player.x = 50;
                    player.y = canvas.height - 100;
                }
            }
        }
    }

    draw() {
        if (!this.alive) return;
        
        if (this.type === 'police') {
            // Utiliser l'image babylon.png pour les flics
            if (babylonImage.complete) {
                // Augmenter la taille du policier de 20%
                let policerWidth = this.width * 1.2;
                let policerHeight = this.height * 1.2;
                let offsetX = (policerWidth - this.width) / 2;
                let offsetY = (policerHeight - this.height) / 2;
                
                // Flip horizontal selon la direction
                if (this.velocityX < 0) {
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(babylonImage, -this.x - policerWidth + offsetX, this.y - offsetY, policerWidth, policerHeight);
                    ctx.restore();
                } else {
                    ctx.drawImage(babylonImage, this.x - offsetX, this.y - offsetY, policerWidth, policerHeight);
                }
            } else {
                // Fallback si l'image n'est pas chargée
                this.drawPolice();
            }
        } else if (this.type === 'politician') {
            // Utiliser l'image politicien.png pour les politiciens
            if (politicienImage.complete) {
                // Augmenter la taille du politicien de 40%
                let politicienWidth = this.width * 1.4;
                let politicienHeight = this.height * 1.4;
                let offsetX = (politicienWidth - this.width) / 2;
                let offsetY = (politicienHeight - this.height) / 2;
                
                // Flip horizontal selon la direction
                if (this.velocityX < 0) {
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(politicienImage, -this.x - politicienWidth + offsetX, this.y - offsetY, politicienWidth, politicienHeight);
                    ctx.restore();
                } else {
                    ctx.drawImage(politicienImage, this.x - offsetX, this.y - offsetY, politicienWidth, politicienHeight);
                }
            } else {
                // Fallback si l'image n'est pas chargée
                this.drawPolitician();
            }
        } else if (this.type === 'corporate') {
            // Utiliser l'image banquier.png pour les banquiers/corporate
            if (banquierImage.complete) {
                // Augmenter la taille du banquier de 35%
                let banquierWidth = this.width * 1.35;
                let banquierHeight = this.height * 1.35;
                let offsetX = (banquierWidth - this.width) / 2;
                let offsetY = (banquierHeight - this.height) / 2;
                
                // Flip horizontal selon la direction
                if (this.velocityX < 0) {
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(banquierImage, -this.x - banquierWidth + offsetX, this.y - offsetY, banquierWidth, banquierHeight);
                    ctx.restore();
                } else {
                    ctx.drawImage(banquierImage, this.x - offsetX, this.y - offsetY, banquierWidth, banquierHeight);
                }
            } else {
                // Fallback si l'image n'est pas chargée
                this.drawCorporate();
            }
        } else if (this.type === 'juge') {
            // Utiliser l'image juge.png pour les juges
            if (jugeImage.complete) {
                // Augmenter la taille du juge de 45% (plus imposant que les autres)
                let jugeWidth = this.width * 1.45;
                let jugeHeight = this.height * 1.45;
                let offsetX = (jugeWidth - this.width) / 2;
                let offsetY = (jugeHeight - this.height) / 2;
                
                // Flip horizontal selon la direction
                if (this.velocityX < 0) {
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(jugeImage, -this.x - jugeWidth + offsetX, this.y - offsetY, jugeWidth, jugeHeight);
                    ctx.restore();
                } else {
                    ctx.drawImage(jugeImage, this.x - offsetX, this.y - offsetY, jugeWidth, jugeHeight);
                }
            } else {
                // Fallback si l'image n'est pas chargée
                this.drawJuge();
            }
        }
    }
    
    drawPolice() {
        // Corps uniforme bleu foncé
        ctx.fillStyle = '#000080';
        ctx.fillRect(this.x + 6, this.y + 12, 16, 18);
        
        // Tête
        ctx.fillStyle = '#FDBCB4';
        ctx.fillRect(this.x + 8, this.y + 2, 12, 12);
        
        // Casquette de police
        ctx.fillStyle = '#000080';
        ctx.fillRect(this.x + 6, this.y, 16, 6);
        ctx.fillStyle = '#C0C0C0'; // Badge
        ctx.fillRect(this.x + 12, this.y + 1, 4, 2);
        
        // Visière
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 4, this.y + 4, 20, 2);
        
        // Yeux sévères
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 10, this.y + 6, 2, 2);
        ctx.fillRect(this.x + 16, this.y + 6, 2, 2);
        
        // Bouche méchante
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 12, this.y + 10, 4, 1);
        
        // Badge sur la poitrine
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x + 12, this.y + 15, 4, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 13, this.y + 16, 2, 2);
        
        // Ceinturon
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 6, this.y + 22, 16, 3);
        
        // Jambes
        ctx.fillStyle = '#000080';
        ctx.fillRect(this.x + 8, this.y + 25, 5, 7);
        ctx.fillRect(this.x + 15, this.y + 25, 5, 7);
        
        // Chaussures noires
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 8, this.y + 30, 5, 2);
        ctx.fillRect(this.x + 15, this.y + 30, 5, 2);
    }
    
    drawPolitician() {
        // Costume noir
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(this.x + 6, this.y + 12, 16, 18);
        
        // Chemise blanche
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 10, this.y + 12, 8, 12);
        
        // Cravate rouge (couleur du pouvoir)
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(this.x + 12, this.y + 12, 4, 10);
        
        // Tête
        ctx.fillStyle = '#FDBCB4';
        ctx.fillRect(this.x + 8, this.y + 2, 12, 12);
        
        // Cheveux gris (politicien âgé)
        ctx.fillStyle = '#808080';
        ctx.fillRect(this.x + 8, this.y, 12, 4);
        
        // Yeux cupides
        ctx.fillStyle = '#32CD32'; // Vert argent
        ctx.fillRect(this.x + 10, this.y + 6, 2, 2);
        ctx.fillRect(this.x + 16, this.y + 6, 2, 2);
        
        // Sourire hypocrite
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 11, this.y + 10, 6, 1);
        
        // Jambes du costume
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(this.x + 8, this.y + 25, 5, 7);
        ctx.fillRect(this.x + 15, this.y + 25, 5, 7);
        
        // Chaussures de luxe
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 8, this.y + 30, 5, 2);
        ctx.fillRect(this.x + 15, this.y + 30, 5, 2);
        
        // Symbole du dollar flottant (corruption)
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px Arial';
        ctx.fillText('$', this.x + this.width + 5, this.y + 10);
    }
    
    drawCorporate() {
        // Costume de businessman
        ctx.fillStyle = '#1C1C1C';
        ctx.fillRect(this.x + 6, this.y + 12, 16, 18);
        
        // Chemise blanche
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 10, this.y + 12, 8, 12);
        
        // Cravate noire élégante
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 12, this.y + 12, 4, 10);
        
        // Tête
        ctx.fillStyle = '#FDBCB4';
        ctx.fillRect(this.x + 8, this.y + 2, 12, 12);
        
        // Cheveux soignés
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 8, this.y, 12, 4);
        
        // Lunettes (symbole d'intellectuel manipulateur)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 7, 2, 0, 2 * Math.PI);
        ctx.arc(this.x + 16, this.y + 7, 2, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 14, this.y + 7);
        ctx.lineTo(this.x + 14, this.y + 7);
        ctx.stroke();
        
        // Yeux calculateurs
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(this.x + 11, this.y + 6, 2, 2);
        ctx.fillRect(this.x + 15, this.y + 6, 2, 2);
        
        // Sourire condescendant
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 11, this.y + 10, 6, 1);
        
        // Mallette (symbole du capitalisme)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 20, this.y + 18, 6, 4);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(this.x + 20, this.y + 18, 6, 4);
        
        // Jambes du costume
        ctx.fillStyle = '#1C1C1C';
        ctx.fillRect(this.x + 8, this.y + 25, 5, 7);
        ctx.fillRect(this.x + 15, this.y + 25, 5, 7);
        
        // Chaussures italiennes
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 8, this.y + 30, 5, 2);
        ctx.fillRect(this.x + 15, this.y + 30, 5, 2);
    }
    
    drawJuge() {
        // Robe noire de juge
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 4, this.y + 12, 20, 20);
        
        // Col blanc de la robe
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 10, this.y + 12, 8, 4);
        
        // Tête
        ctx.fillStyle = '#FDBCB4';
        ctx.fillRect(this.x + 8, this.y + 2, 12, 12);
        
        // Perruque blanche poudrée (symbole de l'ancien système judiciaire)
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(this.x + 6, this.y, 16, 6);
        // Boucles de la perruque
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y + 3, 3, 0, 2 * Math.PI);
        ctx.arc(this.x + 22, this.y + 3, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Yeux sévères et froids
        ctx.fillStyle = '#4682B4'; // Bleu acier
        ctx.fillRect(this.x + 10, this.y + 6, 2, 2);
        ctx.fillRect(this.x + 16, this.y + 6, 2, 2);
        
        // Sourcils froncés
        ctx.fillStyle = '#808080';
        ctx.fillRect(this.x + 9, this.y + 5, 4, 1);
        ctx.fillRect(this.x + 15, this.y + 5, 4, 1);
        
        // Bouche sévère
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 11, this.y + 10, 6, 1);
        
        // Marteau de juge (symbole du pouvoir judiciaire)
        if (Math.sin(this.animationFrame) > 0) {
            // Manche du marteau
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + 24, this.y + 8, 2, 12);
            
            // Tête du marteau
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x + 22, this.y + 6, 6, 4);
        }
        
        // Balance de la justice (corrompue)
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Bras de la balance
        ctx.moveTo(this.x - 2, this.y + 10);
        ctx.lineTo(this.x + 6, this.y + 10);
        // Plateaux déséquilibrés (justice biaisée)
        ctx.arc(this.x - 2, this.y + 12, 2, 0, Math.PI, true);
        ctx.arc(this.x + 6, this.y + 14, 2, 0, Math.PI, true);
        ctx.stroke();
        
        // Jambes de la robe
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 8, this.y + 25, 5, 7);
        ctx.fillRect(this.x + 15, this.y + 25, 5, 7);
        
        // Chaussures noires formelles
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 8, this.y + 30, 5, 2);
        ctx.fillRect(this.x + 15, this.y + 30, 5, 2);
        
        // Symbole du dollar flottant (corruption du système judiciaire)
        ctx.fillStyle = '#DC143C'; // Rouge sang
        ctx.font = '10px Arial';
        ctx.fillText('§', this.x + this.width + 5, this.y + 8);
    }
}

// Système de niveaux avec différents parcours
const levelConfigs = {
    1: {
        name: "Ghetto Uprising",
        platforms: [
            new Platform(200, 500, 120, 20, '#FF0000'),
            new Platform(400, 450, 120, 20, '#FFD700'),
            new Platform(600, 400, 120, 20, '#008000'),
            new Platform(150, 350, 120, 20, '#FF0000'),
            new Platform(450, 300, 120, 20, '#FFD700'),
            new Platform(100, 200, 120, 20, '#008000')
        ],
        collectibles: [
            new Collectible(230, 465),
            new Collectible(430, 415),
            new Collectible(630, 365),
            new Collectible(180, 315),
            new Collectible(480, 265),
            new Collectible(130, 165)
        ],
        enemies: [
            new Enemy(300, canvas.height - 82, 'police'),
            new Enemy(500, 418, 'juge'),
            new Enemy(650, canvas.height - 82, 'corporate')
        ]
    },
    2: {
        name: "Corporate Jungle",
        platforms: [
            new Platform(100, 520, 100, 15, '#FFD700'),
            new Platform(250, 480, 80, 15, '#FF0000'),
            new Platform(380, 440, 100, 15, '#008000'),
            new Platform(530, 400, 80, 15, '#FFD700'),
            new Platform(50, 360, 120, 15, '#FF0000'),
            new Platform(220, 320, 100, 15, '#008000'),
            new Platform(370, 280, 80, 15, '#FFD700'),
            new Platform(500, 240, 120, 15, '#FF0000'),
            new Platform(150, 200, 100, 15, '#008000'),
            new Platform(300, 160, 200, 15, '#FFD700'),
            new Platform(600, 120, 100, 15, '#FF0000')
        ],
        collectibles: [
            new Collectible(130, 485),
            new Collectible(270, 445),
            new Collectible(410, 405),
            new Collectible(550, 365),
            new Collectible(80, 325),
            new Collectible(250, 285),
            new Collectible(390, 245),
            new Collectible(530, 205),
            new Collectible(180, 165),
            new Collectible(380, 125)
        ],
        enemies: [
            new Enemy(350, canvas.height - 82, 'corporate'),
            new Enemy(150, 488, 'politician'),
            new Enemy(450, 408, 'juge'),
            new Enemy(600, 368, 'corporate')
        ]
    },
    3: {
        name: "System's Stronghold",
        platforms: [
            new Platform(50, 530, 80, 20, '#FF0000'),
            new Platform(200, 490, 60, 20, '#FFD700'),
            new Platform(320, 450, 80, 20, '#008000'),
            new Platform(460, 410, 60, 20, '#FF0000'),
            new Platform(580, 370, 80, 20, '#FFD700'),
            new Platform(680, 330, 60, 20, '#008000'),
            new Platform(30, 290, 100, 20, '#FF0000'),
            new Platform(180, 250, 80, 20, '#FFD700'),
            new Platform(320, 210, 100, 20, '#008000'),
            new Platform(480, 170, 80, 20, '#FF0000'),
            new Platform(620, 130, 100, 20, '#FFD700'),
            new Platform(250, 90, 300, 20, '#008000')
        ],
        collectibles: [
            new Collectible(70, 495),
            new Collectible(220, 455),
            new Collectible(350, 415),
            new Collectible(480, 375),
            new Collectible(610, 335),
            new Collectible(700, 295),
            new Collectible(60, 255),
            new Collectible(210, 215),
            new Collectible(370, 175),
            new Collectible(510, 135),
            new Collectible(650, 95),
            new Collectible(400, 55)
        ],
        enemies: [
            new Enemy(400, canvas.height - 82, 'police'),
            new Enemy(100, 498, 'politician'),
            new Enemy(350, 418, 'juge'),
            new Enemy(500, 338, 'corporate'),
            new Enemy(150, 218, 'juge'),
            new Enemy(600, 288, 'corporate')
        ]
    },
    4: {
        name: "Babylon's Heights",
        platforms: [
            new Platform(80, 540, 100, 15, '#FF0000'),
            new Platform(220, 500, 80, 15, '#FFD700'),
            new Platform(340, 460, 100, 15, '#008000'),
            new Platform(480, 420, 80, 15, '#FF0000'),
            new Platform(620, 380, 100, 15, '#FFD700'),
            new Platform(120, 340, 80, 15, '#008000'),
            new Platform(280, 300, 100, 15, '#FF0000'),
            new Platform(420, 260, 80, 15, '#FFD700'),
            new Platform(580, 220, 100, 15, '#008000'),
            new Platform(200, 180, 120, 15, '#FF0000'),
            new Platform(360, 140, 100, 15, '#FFD700'),
            new Platform(520, 100, 120, 15, '#008000'),
            new Platform(300, 60, 200, 15, '#FFD700')
        ],
        collectibles: [
            new Collectible(110, 505),
            new Collectible(250, 465),
            new Collectible(370, 425),
            new Collectible(510, 385),
            new Collectible(650, 345),
            new Collectible(150, 305),
            new Collectible(310, 265),
            new Collectible(450, 225),
            new Collectible(610, 185),
            new Collectible(240, 145),
            new Collectible(390, 105),
            new Collectible(550, 65),
            new Collectible(400, 25)
        ],
        enemies: [
            new Enemy(200, canvas.height - 82, 'police'),
            new Enemy(120, 508, 'juge'),
            new Enemy(380, 428, 'corporate'),
            new Enemy(520, 388, 'police'),
            new Enemy(180, 308, 'juge'),
            new Enemy(450, 228, 'corporate'),
            new Enemy(330, 108, 'juge'),
            new Enemy(650, 338, 'corporate')
        ]
    },
    5: {
        name: "Digital Oppression",
        platforms: [
            new Platform(50, 550, 80, 10, '#FF0000'),
            new Platform(170, 520, 60, 10, '#FFD700'),
            new Platform(270, 490, 80, 10, '#008000'),
            new Platform(390, 460, 60, 10, '#FF0000'),
            new Platform(490, 430, 80, 10, '#FFD700'),
            new Platform(610, 400, 60, 10, '#008000'),
            new Platform(720, 370, 80, 10, '#FF0000'),
            new Platform(80, 340, 60, 10, '#FFD700'),
            new Platform(180, 310, 80, 10, '#008000'),
            new Platform(300, 280, 60, 10, '#FF0000'),
            new Platform(400, 250, 80, 10, '#FFD700'),
            new Platform(520, 220, 60, 10, '#008000'),
            new Platform(620, 190, 80, 10, '#FF0000'),
            new Platform(250, 160, 100, 10, '#FFD700'),
            new Platform(380, 130, 80, 10, '#008000'),
            new Platform(500, 100, 100, 10, '#FF0000'),
            new Platform(350, 70, 150, 10, '#FFD700')
        ],
        collectibles: [
            new Collectible(70, 515),
            new Collectible(190, 485),
            new Collectible(290, 455),
            new Collectible(410, 425),
            new Collectible(510, 395),
            new Collectible(630, 365),
            new Collectible(740, 335),
            new Collectible(100, 305),
            new Collectible(200, 275),
            new Collectible(320, 245),
            new Collectible(420, 215),
            new Collectible(540, 185),
            new Collectible(640, 155),
            new Collectible(280, 125),
            new Collectible(400, 95),
            new Collectible(520, 65),
            new Collectible(420, 35)
        ],
        enemies: [
            new Enemy(300, canvas.height - 82, 'corporate'),
            new Enemy(600, canvas.height - 82, 'police'),
            new Enemy(90, 518, 'politician'),
            new Enemy(310, 458, 'juge'),
            new Enemy(530, 398, 'corporate'),
            new Enemy(200, 278, 'politician'),
            new Enemy(440, 218, 'juge'),
            new Enemy(380, 98, 'corporate'),
            new Enemy(450, 38, 'juge'),
            new Enemy(650, 318, 'corporate')
        ]
    },
    6: {
        name: "Final Liberation",
        platforms: [
            new Platform(40, 560, 60, 8, '#FF0000'),
            new Platform(140, 540, 50, 8, '#FFD700'),
            new Platform(230, 520, 60, 8, '#008000'),
            new Platform(330, 500, 50, 8, '#FF0000'),
            new Platform(420, 480, 60, 8, '#FFD700'),
            new Platform(520, 460, 50, 8, '#008000'),
            new Platform(610, 440, 60, 8, '#FF0000'),
            new Platform(700, 420, 50, 8, '#FFD700'),
            new Platform(60, 400, 50, 8, '#008000'),
            new Platform(150, 380, 60, 8, '#FF0000'),
            new Platform(250, 360, 50, 8, '#FFD700'),
            new Platform(340, 340, 60, 8, '#008000'),
            new Platform(440, 320, 50, 8, '#FF0000'),
            new Platform(530, 300, 60, 8, '#FFD700'),
            new Platform(630, 280, 50, 8, '#008000'),
            new Platform(720, 260, 60, 8, '#FF0000'),
            new Platform(120, 240, 80, 8, '#FFD700'),
            new Platform(240, 220, 60, 8, '#008000'),
            new Platform(340, 200, 80, 8, '#FF0000'),
            new Platform(460, 180, 60, 8, '#FFD700'),
            new Platform(560, 160, 80, 8, '#008000'),
            new Platform(280, 140, 100, 8, '#FF0000'),
            new Platform(420, 120, 80, 8, '#FFD700'),
            new Platform(320, 100, 120, 8, '#008000'),
            new Platform(200, 80, 200, 8, '#FFD700'),
            new Platform(450, 60, 150, 8, '#FF0000'),
            new Platform(300, 40, 250, 8, '#008000')
        ],
        collectibles: [
            new Collectible(60, 525),
            new Collectible(160, 505),
            new Collectible(250, 485),
            new Collectible(350, 465),
            new Collectible(440, 445),
            new Collectible(540, 425),
            new Collectible(630, 405),
            new Collectible(720, 385),
            new Collectible(80, 365),
            new Collectible(170, 345),
            new Collectible(270, 325),
            new Collectible(360, 305),
            new Collectible(460, 285),
            new Collectible(550, 265),
            new Collectible(650, 245),
            new Collectible(740, 225),
            new Collectible(140, 205),
            new Collectible(260, 185),
            new Collectible(360, 165),
            new Collectible(480, 145),
            new Collectible(580, 125),
            new Collectible(320, 105),
            new Collectible(450, 85),
            new Collectible(350, 65),
            new Collectible(270, 45),
            new Collectible(500, 25),
            new Collectible(420, 5)
        ],
        enemies: [
            new Enemy(200, canvas.height - 82, 'police'),
            new Enemy(500, canvas.height - 82, 'corporate'),
            new Enemy(700, canvas.height - 82, 'politician'),
            new Enemy(70, 528, 'police'),
            new Enemy(170, 508, 'juge'),
            new Enemy(270, 488, 'corporate'),
            new Enemy(370, 468, 'police'),
            new Enemy(470, 448, 'juge'),
            new Enemy(570, 428, 'corporate'),
            new Enemy(80, 368, 'police'),
            new Enemy(180, 348, 'juge'),
            new Enemy(280, 328, 'corporate'),
            new Enemy(380, 308, 'police'),
            new Enemy(480, 288, 'juge'),
            new Enemy(580, 268, 'corporate'),
            new Enemy(160, 208, 'police'),
            new Enemy(380, 168, 'juge'),
            new Enemy(340, 108, 'corporate'),
            new Enemy(380, 68, 'police'),
            new Enemy(450, 28, 'juge'),
            new Enemy(600, 388, 'corporate'),
            new Enemy(720, 268, 'corporate')
        ]
    }
};

// Initialisation des objets du jeu
let player = new Player(50, canvas.height - 100);
let platforms = [];
let collectibles = [];
let enemies = [];

// Fonction pour charger un niveau
function loadLevel(levelNumber) {
    const config = levelConfigs[levelNumber];
    if (!config) return false;
    
    platforms = [...config.platforms];
    collectibles = [...config.collectibles];
    enemies = [...config.enemies];
    
    // Réinitialiser le joueur
    player.x = 50;
    player.y = canvas.height - 100;
    player.velocityX = 0;
    player.velocityY = 0;
    
    return true;
}

// Charger le premier niveau au démarrage
loadLevel(1);

// Initialiser l'interface
updateScore();
updateLives();
updateLevel();

// Gestion des événements clavier
document.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
    
    // Gestion du redémarrage
    if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        restart();
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
});

// Fonctions de mise à jour de l'interface
function updateScore() {
    document.getElementById('score').textContent = gameState.score;
}

function updateLives() {
    document.getElementById('lives').textContent = gameState.lives;
}

function updateLevel() {
    document.getElementById('level').textContent = gameState.level;
    const levelName = levelConfigs[gameState.level]?.name || 'Niveau Inconnu';
    document.getElementById('levelName').textContent = levelName;
}

// Fonction de fin de jeu
function gameOver() {
    gameState.gameRunning = false;
    gameState.gameOver = true;
}

// Fonction pour dessiner l'écran de game over
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FF0000';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 80);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '24px Arial';
    ctx.fillText('Bob Marley a été vaincu par Babylone !', canvas.width/2, canvas.height/2 - 30);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '24px Arial';
    ctx.fillText('Score Final: ' + gameState.score, canvas.width/2, canvas.height/2 + 20);
    
    ctx.fillStyle = '#008000';
    ctx.font = '18px Arial';
    ctx.fillText('Appuyez sur R pour recommencer', canvas.width/2, canvas.height/2 + 60);
}

// Fonction de victoire
function checkWin() {
    let allCollected = collectibles.every(c => c.collected);
    if (allCollected) {
        gameState.level++;
        updateLevel();
        
        // Vérifier s'il y a un niveau suivant
        if (loadLevel(gameState.level)) {
            // Afficher le message de niveau
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFD700';
            ctx.font = '36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('NIVEAU ' + gameState.level + '!', canvas.width/2, canvas.height/2 - 40);
            
            // Afficher le nom du niveau
            const levelName = levelConfigs[gameState.level]?.name || 'Niveau Inconnu';
            ctx.fillStyle = '#32CD32';
            ctx.font = '24px Arial';
            ctx.fillText(levelName, canvas.width/2, canvas.height/2 + 10);
            
            // Message motivant
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '18px Arial';
            ctx.fillText('Libère Jah People du système Babylone !', canvas.width/2, canvas.height/2 + 50);
            
            setTimeout(() => {
                // Continue le jeu après 3 secondes
            }, 3000);
        } else {
            // Victoire finale
            gameState.gameRunning = false;
            ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFD700';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('VICTOIRE !', canvas.width/2, canvas.height/2 - 80);
            
            ctx.fillStyle = '#FF0000';
            ctx.font = '32px Arial';
            ctx.fillText('JAH RASTAFARI !', canvas.width/2, canvas.height/2 - 30);
            
            ctx.fillStyle = '#008000';
            ctx.font = '24px Arial';
            ctx.fillText('Tu as libéré le peuple de Babylone !', canvas.width/2, canvas.height/2 + 20);
            
            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.fillText('Score Final: ' + gameState.score, canvas.width/2, canvas.height/2 + 60);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px Arial';
            ctx.fillText('One Love, One Heart ! 🌈', canvas.width/2, canvas.height/2 + 100);
            ctx.fillText('Appuyez sur R pour recommencer', canvas.width/2, canvas.height/2 + 130);
        }
    }
}

// Fonction de redémarrage
function restart() {
    // Remettre l'état du jeu à zéro
    gameState = {
        score: 0,
        lives: 3,
        level: 1,
        gameRunning: true,
        keys: {},
        gameOver: false
    };
    
    // Recharger le premier niveau
    loadLevel(1);
    
    // Remettre le joueur à sa position d'origine
    player.x = 50;
    player.y = canvas.height - 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.onGround = false;
    player.direction = 'right';
    
    // Remettre tous les ennemis à leur position d'origine
    enemies.forEach(enemy => {
        enemy.reset();
    });
    
    // Remettre tous les collectibles à leur état d'origine
    collectibles.forEach(collectible => {
        collectible.reset();
    });
    
    // Mettre à jour l'interface
    updateScore();
    updateLives();
    updateLevel();
}



// Fonction de rendu du fond
function drawBackground() {
    // Ciel dégradé
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Nuages
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(150, 80, 30, 0, 2 * Math.PI);
    ctx.arc(180, 80, 40, 0, 2 * Math.PI);
    ctx.arc(210, 80, 30, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(550, 120, 35, 0, 2 * Math.PI);
    ctx.arc(580, 120, 45, 0, 2 * Math.PI);
    ctx.arc(615, 120, 35, 0, 2 * Math.PI);
    ctx.fill();
    
    // Sol principal
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    
    // Herbe
    ctx.fillStyle = '#32CD32';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, canvas.height - 55, 3, 10);
        ctx.fillRect(i + 5, canvas.height - 52, 3, 7);
        ctx.fillRect(i + 10, canvas.height - 58, 3, 13);
    }
}

// Boucle principale du jeu
function gameLoop() {
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState.gameOver) {
        // Afficher l'écran de game over
        drawGameOver();
    } else if (gameState.gameRunning) {
        // Dessiner le fond du jeu
        drawBackground();
        
        // Mettre à jour et dessiner les plateformes
        platforms.forEach(platform => platform.draw());
        
        // Mettre à jour et dessiner les collectibles
        collectibles.forEach(collectible => {
            collectible.update();
            collectible.draw();
        });
        
        // Mettre à jour et dessiner les ennemis
        enemies.forEach(enemy => {
            enemy.update();
            enemy.draw();
        });
        
        // Mettre à jour et dessiner le joueur
        player.update();
        player.draw();
        
        // Vérifier la victoire
        checkWin();
    }
    
    // Continuer la boucle
    requestAnimationFrame(gameLoop);
}

// Démarrer le jeu
gameLoop(); 