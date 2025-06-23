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

const bossImage = new Image();
bossImage.src = 'boss.png';

// Variables globales du jeu
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    maxLevelReached: 1,
    gameRunning: true,
    keys: {},
    gameOver: false,
    finalVictory: false,
    deathMessage: '',
    deathMessageTimer: 0,
    levelChangeMessage: '',
    levelChangeTimer: 0,
    gamePaused: false
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
        this.spacePressed = false;
        this.spaceTimer = 0;
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

        // Système de saut avec poussée continue (comme Mario)
        if (gameState.keys[' ']) {
            if (!this.spacePressed && this.onGround) {
                // Début du saut immédiat avec saut minimal
                this.velocityY = -this.jumpPower * 0.4; // Saut très petit au début
                this.onGround = false;
                this.spacePressed = true;
                this.spaceTimer = 0;
            }
            
            // Poussée supplémentaire tant que la touche est maintenue et qu'on monte
            if (this.spacePressed && this.velocityY < 0 && this.spaceTimer < 25) {
                this.spaceTimer++;
                
                // Première phase: atteindre la hauteur normale (frames 1-15)
                if (this.spaceTimer <= 15) {
                    // Ajouter 0.6x de la puissance pour atteindre la hauteur normale
                    this.velocityY -= this.jumpPower * 0.04; // 0.6 / 15 = 0.04
                }
                // Deuxième phase: atteindre 1.5x la hauteur (frames 16-25)
                else if (this.spaceTimer <= 25) {
                    // Ajouter 0.5x de la puissance pour atteindre 1.5x
                    this.velocityY -= this.jumpPower * 0.05; // 0.5 / 10 = 0.05
                }
            }
        } else {
            // Relâchement de la touche - arrêt de la poussée
            this.spacePressed = false;
            this.spaceTimer = 0;
        }
        
        // Reset du flag de saut quand Bob touche le sol
        if (this.onGround) {
            this.spacePressed = false;
            this.spaceTimer = 0;
        }

        // Gravité
        this.velocityY += 0.8;

        // Mise à jour de la position horizontale
        this.x += this.velocityX;
        
        // Mise à jour de la position verticale
        this.y += this.velocityY;
        this.checkVerticalPlatformCollisions();

        // Limites de l'écran
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        // Sol de base (avec vérification de direction)
        if (this.y + this.height > canvas.height - 50) {
            if (this.velocityY >= 0) { // Seulement si Bob tombe ou est statique
                this.y = canvas.height - 50 - this.height;
                this.velocityY = 0;
                this.onGround = true;
            }
        }
        
        // Vérification de chute hors de l'écran (mort)
        if (this.y > canvas.height + 100) {
            gameState.lives--;
            gameState.deathMessage = "Bob est tombé dans le vide !";
            gameState.deathMessageTimer = 240; // 4 secondes à 60fps
            updateLives();
            if (gameState.lives <= 0) {
                gameOver();
            } else {
                // Respawn du joueur
                this.x = 50;
                this.y = canvas.height - 100;
                this.velocityX = 0;
                this.velocityY = 0;
            }
        }

        // Note: Les collisions avec les plateformes sont maintenant gérées séparément
    }

    // Fonction supprimée : Plus de collision horizontale avec les plateformes
    
    checkVerticalPlatformCollisions() {
        this.onGround = false; // Reset du statut onGround
        
        for (let platform of platforms) {
            // Vérifier collision verticale uniquement
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                if (this.velocityY > 0) {
                    // Bob tombe, collision avec le haut de la plateforme
                    // Vérifier que Bob vient bien du dessus
                    if (this.y < platform.y) {
                        this.y = platform.y - this.height;
                        this.velocityY = 0;
                        this.onGround = true;
                    }
                }
                // Suppression de la collision avec le bas des plateformes
                // Bob peut maintenant passer à travers les plateformes par en dessous
            }
        }
        
        // Vérifier si Bob est toujours sur une plateforme (pour l'état onGround)
        if (!this.onGround) {
            for (let platform of platforms) {
                if (this.x < platform.x + platform.width &&
                    this.x + this.width > platform.x &&
                    this.y + this.height >= platform.y &&
                    this.y + this.height <= platform.y + 5) { // Petite tolérance
                    
                    this.onGround = true;
                    break;
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
        
        // Calculer les dimensions réelles selon le type d'ennemi
        let actualWidth = this.width;
        let actualHeight = this.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (this.type === 'police') {
            actualWidth = this.width * 1.2;
            actualHeight = this.height * 1.2;
            offsetX = (actualWidth - this.width) / 2;
            offsetY = (actualHeight - this.height) / 2;
        } else if (this.type === 'politician') {
            actualWidth = this.width * 1.4;
            actualHeight = this.height * 1.4;
            offsetX = (actualWidth - this.width) / 2;
            offsetY = (actualHeight - this.height) / 2;
        } else if (this.type === 'corporate') {
            actualWidth = this.width * 1.35;
            actualHeight = this.height * 1.35;
            offsetX = (actualWidth - this.width) / 2;
            offsetY = (actualHeight - this.height) / 2;
        } else if (this.type === 'juge') {
            actualWidth = this.width * 1.45;
            actualHeight = this.height * 1.45;
            offsetX = (actualWidth - this.width) / 2;
            offsetY = (actualHeight - this.height) / 2;
        }
        
        // Collision avec le joueur (utiliser les dimensions réelles)
        if (this.alive &&
            player.x < (this.x - offsetX) + actualWidth &&
            player.x + player.width > (this.x - offsetX) &&
            player.y < (this.y - offsetY) + actualHeight &&
            player.y + player.height > (this.y - offsetY)) {
            
            // Si le joueur saute sur l'ennemi
            if (player.velocityY > 0 && player.y < this.y) {
                this.alive = false;
                player.velocityY = -8;
                gameState.score += 200;
                updateScore();
            } else {
                // Le joueur perd une vie
                gameState.lives--;
                gameState.deathMessage = `Touché par ${this.type === 'police' ? 'la police' : 
                                                      this.type === 'politician' ? 'un politicien' :
                                                      this.type === 'corporate' ? 'un banquier' :
                                                      this.type === 'juge' ? 'un juge' : 'un ennemi'}!`;
                gameState.deathMessageTimer = 240; // 4 secondes à 60fps
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

// Classe Boss - Le Roi de Babylone
class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.initialX = x;
        this.initialY = y;
        this.width = 80;
        this.height = 100;
        this.health = 5;
        this.maxHealth = 5;
        this.velocityX = 2;
        this.velocityY = 0;
        this.alive = true;
        this.phase = 1; // 1: Marche, 2: Attaque, 3: Rage
        this.attackTimer = 0;
        this.animationFrame = 0;
        this.hitTimer = 0;
        this.projectiles = [];
        this.isAngry = false;
    }

    update() {
        if (!this.alive) return;
        
        this.animationFrame += 0.1;
        
        // Phases du boss selon sa santé
        if (this.health <= 3 && this.phase < 3) {
            this.phase = 3; // Phase de rage
            this.velocityX = 3;
            this.isAngry = true;
        } else if (this.health <= 6 && this.phase < 2) {
            this.phase = 2; // Phase d'attaque
            this.velocityX = 2.5;
        }
        
        // Mouvement du boss
        this.x += this.velocityX;
        
        // Rebond sur les bords
        if (this.x <= 0 || this.x + this.width >= canvas.width) {
            this.velocityX = -this.velocityX;
        }
        
        // Attaques du boss
        this.attackTimer++;
        if (this.attackTimer > (this.phase === 3 ? 60 : 120)) {
            this.attack();
            this.attackTimer = 0;
        }
        
        // Mise à jour des projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.update();
            if (projectile.x < 0 || projectile.x > canvas.width || 
                projectile.y < 0 || projectile.y > canvas.height) {
                this.projectiles.splice(index, 1);
            }
        });
        
        // Collision avec le joueur
        if (this.alive &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            
            // Si le joueur saute sur le boss
            if (player.velocityY > 0 && player.y < this.y) {
                this.takeDamage();
                player.velocityY = -12;
            } else {
                // Le joueur perd une vie
                gameState.lives--;
                gameState.deathMessage = "Touché par le Roi de Babylone !";
                gameState.deathMessageTimer = 240; // 4 secondes à 60fps
                updateLives();
                if (gameState.lives <= 0) {
                    gameOver();
                } else {
                    // Repousser le joueur
                    player.x = this.x < player.x ? this.x + this.width + 10 : this.x - player.width - 10;
                }
            }
        }
        
        // Collision projectiles avec joueur
        this.projectiles.forEach((projectile, index) => {
            if (player.x < projectile.x + projectile.width &&
                player.x + player.width > projectile.x &&
                player.y < projectile.y + projectile.height &&
                player.y + player.height > projectile.y) {
                
                gameState.lives--;
                gameState.deathMessage = "Touché par un projectile de Babylone !";
                gameState.deathMessageTimer = 240; // 4 secondes à 60fps
                updateLives();
                this.projectiles.splice(index, 1);
                
                if (gameState.lives <= 0) {
                    gameOver();
                } else {
                    // Repousser le joueur
                    player.x = 50;
                    player.y = canvas.height - 100;
                }
            }
        });
        
        if (this.hitTimer > 0) {
            this.hitTimer--;
        }
    }
    
    attack() {
        // Lancer des projectiles (oppression de Babylone)
        let projectileCount = this.phase === 3 ? 3 : (this.phase === 2 ? 2 : 1);
        
        for (let i = 0; i < projectileCount; i++) {
            let angle = this.phase === 3 ? 
                (Math.PI / 4) * (i - 1) : // En éventail en phase 3
                Math.atan2(player.y - this.y, player.x - this.x); // Vers le joueur
                
            this.projectiles.push(new BossProjectile(
                this.x + this.width / 2,
                this.y + this.height / 2,
                Math.cos(angle) * 4,
                Math.sin(angle) * 4
            ));
        }
    }
    
    takeDamage() {
        if (this.hitTimer <= 0) {
            this.health--;
            this.hitTimer = 30; // Invincibilité temporaire
            gameState.score += 500;
            updateScore();
            
            if (this.health <= 0) {
                this.alive = false;
                // Victoire finale !
                setTimeout(() => {
                    showFinalVictory();
                }, 1000);
            }
        }
    }
    
    reset() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.health = this.maxHealth;
        this.velocityX = 2;
        this.alive = true;
        this.phase = 1;
        this.attackTimer = 0;
        this.hitTimer = 0;
        this.projectiles = [];
        this.isAngry = false;
    }
    
    draw() {
        if (!this.alive) return;
        
        // Effet de hit
        if (this.hitTimer > 0 && Math.floor(this.hitTimer / 5) % 2) {
            ctx.save();
            ctx.globalAlpha = 0.5;
        }
        
        if (bossImage.complete) {
            // Flip horizontal selon la direction
            if (this.velocityX < 0) {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(bossImage, -this.x - this.width, this.y, this.width, this.height);
                ctx.restore();
            } else {
                ctx.drawImage(bossImage, this.x, this.y, this.width, this.height);
            }
        } else {
            // Fallback: Dessin du Roi de Babylone
            this.drawBossArt();
        }
        
        if (this.hitTimer > 0) {
            ctx.restore();
        }
        
        // Barre de vie du boss
        this.drawHealthBar();
        
        // Dessiner les projectiles
        this.projectiles.forEach(projectile => projectile.draw());
    }
    
    drawBossArt() {
        // Corps massif du Roi de Babylone
        ctx.fillStyle = this.isAngry ? '#8B0000' : '#4B0082';
        ctx.fillRect(this.x + 10, this.y + 30, 60, 60);
        
        // Cape royale
        ctx.fillStyle = '#800080';
        ctx.fillRect(this.x, this.y + 25, 80, 15);
        
        // Tête imposante
        ctx.fillStyle = '#FDBCB4';
        ctx.fillRect(this.x + 20, this.y + 5, 40, 30);
        
        // Couronne de Babylone
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x + 15, this.y, 50, 10);
        // Pointes de la couronne
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(this.x + 18 + i * 9, this.y - 5, 6, 8);
        }
        
        // Yeux maléfiques
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 28, this.y + 15, 6, 6);
        ctx.fillRect(this.x + 46, this.y + 15, 6, 6);
        
        // Bouche cruelle
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 32, this.y + 25, 16, 3);
        
        // Sceptre du pouvoir
        if (Math.sin(this.animationFrame) > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x + 85, this.y + 10, 4, 40);
            // Tête du sceptre
            ctx.fillRect(this.x + 82, this.y + 8, 10, 8);
        }
        
        // Symboles babyloniens flottants
        ctx.fillStyle = '#FF6600';
        ctx.font = '16px Arial';
        ctx.fillText('$', this.x - 15, this.y + 20);
        ctx.fillText('§', this.x + this.width + 10, this.y + 30);
        ctx.fillText('⚖', this.x - 10, this.y + 50);
        
        // Jambes
        ctx.fillStyle = this.isAngry ? '#8B0000' : '#4B0082';
        ctx.fillRect(this.x + 20, this.y + 85, 15, 15);
        ctx.fillRect(this.x + 45, this.y + 85, 15, 15);
    }
    
    drawHealthBar() {
        // Fond de la barre de vie
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(canvas.width / 2 - 150, 30, 300, 20);
        
        // Barre de vie
        let healthPercent = this.health / this.maxHealth;
        let barColor = healthPercent > 0.6 ? '#00FF00' : 
                      healthPercent > 0.3 ? '#FFFF00' : '#FF0000';
        
        ctx.fillStyle = barColor;
        ctx.fillRect(canvas.width / 2 - 148, 32, (300 - 4) * healthPercent, 16);
        
        // Nom du boss bien visible en dessous
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText('ROI DE BABYLONE', canvas.width / 2, 70);
        ctx.fillText('ROI DE BABYLONE', canvas.width / 2, 70);
    }
}

// Classe pour les projectiles du boss
class BossProjectile {
    constructor(x, y, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
    
    draw() {
        // Projectile d'oppression (dollar sign)
        ctx.fillStyle = '#FF0000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('$', this.x + this.width/2, this.y + this.height);
        
        // Effet de traînée
        ctx.strokeStyle = '#FF6600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, 8, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

// Système de niveaux avec différents parcours
const levelConfigs = {
    1: {
        name: "Ghetto Uprising",
        platforms: [
            new Platform(200, 520, 120, 20, '#FF0000'),
            new Platform(400, 480, 120, 20, '#FFD700'),
            new Platform(600, 440, 120, 20, '#008000'),
            new Platform(150, 400, 120, 20, '#FF0000'),
            new Platform(450, 360, 120, 20, '#FFD700'),
            new Platform(100, 320, 120, 20, '#008000')
        ],
        collectibles: [
            new Collectible(230, 485),
            new Collectible(430, 445),
            new Collectible(630, 405),
            new Collectible(180, 365),
            new Collectible(480, 325),
            new Collectible(130, 285)
        ],
        enemies: [
            new Enemy(300, canvas.height - 82, 'police'),
            new Enemy(500, 418, 'juge')
        ]
    },
    2: {
        name: "Corporate Jungle",
        platforms: [
            new Platform(100, 540, 100, 15, '#FFD700'),
            new Platform(250, 510, 80, 15, '#FF0000'),
            new Platform(380, 480, 100, 15, '#008000'),
            new Platform(530, 450, 80, 15, '#FFD700'),
            new Platform(50, 420, 120, 15, '#FF0000'),
            new Platform(220, 390, 100, 15, '#008000'),
            new Platform(370, 360, 80, 15, '#FFD700'),
            new Platform(500, 330, 120, 15, '#FF0000'),
            new Platform(150, 300, 100, 15, '#008000'),
            new Platform(300, 270, 200, 15, '#FFD700'),
            new Platform(600, 240, 100, 15, '#FF0000')
        ],
        collectibles: [
            new Collectible(130, 505),
            new Collectible(270, 475),
            new Collectible(410, 445),
            new Collectible(550, 415),
            new Collectible(80, 385),
            new Collectible(250, 355),
            new Collectible(390, 325),
            new Collectible(530, 295),
            new Collectible(180, 265),
            new Collectible(380, 235),
            new Collectible(630, 205)
        ],
        enemies: [
            new Enemy(350, canvas.height - 82, 'corporate'),
            new Enemy(450, 408, 'juge')
        ]
    },
    3: {
        name: "System's Stronghold",
        platforms: [
            new Platform(50, 550, 80, 20, '#FF0000'),
            new Platform(200, 520, 60, 20, '#FFD700'),
            new Platform(320, 490, 80, 20, '#008000'),
            new Platform(460, 460, 60, 20, '#FF0000'),
            new Platform(580, 430, 80, 20, '#FFD700'),
            new Platform(680, 400, 60, 20, '#008000'),
            new Platform(30, 370, 100, 20, '#FF0000'),
            new Platform(180, 340, 80, 20, '#FFD700'),
            new Platform(320, 310, 100, 20, '#008000'),
            new Platform(480, 280, 80, 20, '#FF0000'),
            new Platform(620, 250, 100, 20, '#FFD700'),
            new Platform(250, 220, 300, 20, '#008000')
        ],
        collectibles: [
            new Collectible(70, 515),
            new Collectible(220, 485),
            new Collectible(350, 455),
            new Collectible(480, 425),
            new Collectible(610, 395),
            new Collectible(700, 365),
            new Collectible(60, 335),
            new Collectible(210, 305),
            new Collectible(370, 275),
            new Collectible(510, 245),
            new Collectible(650, 215),
            new Collectible(400, 185)
        ],
        enemies: [
            new Enemy(400, canvas.height - 82, 'police'),
            new Enemy(350, 418, 'juge'),
            new Enemy(500, 338, 'corporate')
        ]
    },
    4: {
        name: "Babylon's Heights",
        platforms: [
            new Platform(80, 550, 100, 15, '#FF0000'),
            new Platform(220, 520, 80, 15, '#FFD700'),
            new Platform(340, 490, 100, 15, '#008000'),
            new Platform(480, 460, 80, 15, '#FF0000'),
            new Platform(620, 430, 100, 15, '#FFD700'),
            new Platform(120, 400, 80, 15, '#008000'),
            new Platform(280, 370, 100, 15, '#FF0000'),
            new Platform(420, 340, 80, 15, '#FFD700'),
            new Platform(580, 310, 100, 15, '#008000'),
            new Platform(200, 280, 120, 15, '#FF0000'),
            new Platform(360, 250, 100, 15, '#FFD700'),
            new Platform(520, 220, 120, 15, '#008000'),
            new Platform(300, 190, 200, 15, '#FFD700')
        ],
        collectibles: [
            new Collectible(110, 515),
            new Collectible(250, 485),
            new Collectible(370, 455),
            new Collectible(510, 425),
            new Collectible(650, 395),
            new Collectible(150, 365),
            new Collectible(310, 335),
            new Collectible(450, 305),
            new Collectible(610, 275),
            new Collectible(240, 245),
            new Collectible(390, 215),
            new Collectible(550, 185),
            new Collectible(400, 155)
        ],
        enemies: [
            new Enemy(200, canvas.height - 82, 'police'),
            new Enemy(380, 428, 'corporate'),
            new Enemy(450, 228, 'juge')
        ]
    },
    5: {
        name: "Digital Oppression",
        platforms: [
            new Platform(50, 560, 80, 10, '#FF0000'),
            new Platform(170, 540, 60, 10, '#FFD700'),
            new Platform(270, 520, 80, 10, '#008000'),
            new Platform(390, 500, 60, 10, '#FF0000'),
            new Platform(490, 480, 80, 10, '#FFD700'),
            new Platform(610, 460, 60, 10, '#008000'),
            new Platform(720, 440, 80, 10, '#FF0000'),
            new Platform(80, 420, 60, 10, '#FFD700'),
            new Platform(180, 400, 80, 10, '#008000'),
            new Platform(300, 380, 60, 10, '#FF0000'),
            new Platform(400, 360, 80, 10, '#FFD700'),
            new Platform(520, 340, 60, 10, '#008000'),
            new Platform(620, 320, 80, 10, '#FF0000'),
            new Platform(250, 300, 100, 10, '#FFD700'),
            new Platform(380, 280, 80, 10, '#008000'),
            new Platform(500, 260, 100, 10, '#FF0000'),
            new Platform(350, 240, 150, 10, '#FFD700')
        ],
        collectibles: [
            new Collectible(70, 525),
            new Collectible(190, 505),
            new Collectible(290, 485),
            new Collectible(410, 465),
            new Collectible(510, 445),
            new Collectible(630, 425),
            new Collectible(740, 405),
            new Collectible(100, 385),
            new Collectible(200, 365),
            new Collectible(320, 345),
            new Collectible(420, 325),
            new Collectible(540, 305),
            new Collectible(640, 285),
            new Collectible(280, 265),
            new Collectible(400, 245),
            new Collectible(520, 225),
            new Collectible(420, 205)
        ],
        enemies: [
            new Enemy(300, canvas.height - 82, 'corporate'),
            new Enemy(310, 458, 'juge'),
            new Enemy(440, 218, 'politician'),
            new Enemy(380, 98, 'police')
        ]
    },
    6: {
        name: "Final Liberation",
        platforms: [
            new Platform(40, 570, 60, 8, '#FF0000'),
            new Platform(140, 555, 50, 8, '#FFD700'),
            new Platform(230, 540, 60, 8, '#008000'),
            new Platform(330, 525, 50, 8, '#FF0000'),
            new Platform(420, 510, 60, 8, '#FFD700'),
            new Platform(520, 495, 50, 8, '#008000'),
            new Platform(610, 480, 60, 8, '#FF0000'),
            new Platform(700, 465, 50, 8, '#FFD700'),
            new Platform(60, 450, 50, 8, '#008000'),
            new Platform(150, 435, 60, 8, '#FF0000'),
            new Platform(250, 420, 50, 8, '#FFD700'),
            new Platform(340, 405, 60, 8, '#008000'),
            new Platform(440, 390, 50, 8, '#FF0000'),
            new Platform(530, 375, 60, 8, '#FFD700'),
            new Platform(630, 360, 50, 8, '#008000'),
            new Platform(720, 345, 60, 8, '#FF0000'),
            new Platform(120, 330, 80, 8, '#FFD700'),
            new Platform(240, 315, 60, 8, '#008000'),
            new Platform(340, 300, 80, 8, '#FF0000'),
            new Platform(460, 285, 60, 8, '#FFD700'),
            new Platform(560, 270, 80, 8, '#008000'),
            new Platform(280, 255, 100, 8, '#FF0000'),
            new Platform(420, 240, 80, 8, '#FFD700'),
            new Platform(320, 225, 120, 8, '#008000'),
            new Platform(200, 210, 200, 8, '#FFD700'),
            new Platform(450, 195, 150, 8, '#FF0000'),
            new Platform(300, 180, 250, 8, '#008000')
        ],
        collectibles: [
            new Collectible(60, 535),
            new Collectible(160, 520),
            new Collectible(250, 505),
            new Collectible(350, 490),
            new Collectible(440, 475),
            new Collectible(540, 460),
            new Collectible(630, 445),
            new Collectible(720, 430),
            new Collectible(80, 415),
            new Collectible(170, 400),
            new Collectible(270, 385),
            new Collectible(360, 370),
            new Collectible(460, 355),
            new Collectible(550, 340),
            new Collectible(650, 325),
            new Collectible(740, 310),
            new Collectible(140, 295),
            new Collectible(260, 280),
            new Collectible(360, 265),
            new Collectible(480, 250),
            new Collectible(580, 235),
            new Collectible(320, 220),
            new Collectible(450, 205),
            new Collectible(350, 190),
            new Collectible(270, 175),
            new Collectible(500, 160),
            new Collectible(420, 145)
        ],
        enemies: [
            new Enemy(200, canvas.height - 82, 'police'),
            new Enemy(500, canvas.height - 82, 'corporate'),
            new Enemy(170, 508, 'juge'),
            new Enemy(470, 448, 'politician'),
            new Enemy(380, 168, 'corporate'),
            new Enemy(450, 28, 'juge')
        ]
    },
    7: {
        name: "Roi de Babylone",
        platforms: [
            new Platform(100, 500, 600, 20, '#8B0000'),
            new Platform(50, 400, 150, 15, '#FF0000'),
            new Platform(600, 400, 150, 15, '#FF0000'),
            new Platform(200, 300, 200, 15, '#FFD700'),
            new Platform(450, 300, 200, 15, '#FFD700'),
            new Platform(350, 200, 100, 15, '#008000')
        ],
        collectibles: [
            new Collectible(130, 465),
            new Collectible(630, 365),
            new Collectible(230, 265),
            new Collectible(480, 265),
            new Collectible(380, 165)
        ],
        enemies: [], // Pas d'ennemis normaux, seulement le boss
        boss: new Boss(canvas.width / 2 - 40, canvas.height - 150)
    }
};

// Initialisation des objets du jeu
let player = new Player(50, canvas.height - 100);
let platforms = [];
let collectibles = [];
let enemies = [];
let boss = null;

// Fonction pour charger un niveau
function loadLevel(levelNumber) {
    const config = levelConfigs[levelNumber];
    if (!config) return false;
    
    platforms = [...config.platforms];
    collectibles = [...config.collectibles];
    enemies = [...config.enemies];
    
    // Charger le boss si c'est le niveau final
    if (config.boss) {
        boss = config.boss;
        boss.reset();
    } else {
        boss = null;
    }
    
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
    if (gameState.gameOver || gameState.finalVictory) {
        if (e.key.toLowerCase() === 'r') {
            // Reprendre au niveau maximum atteint
            restart(gameState.maxLevelReached);
        } else if (e.key.toLowerCase() === 't') {
            // Recommencer depuis le niveau 1
            restart(1);
        }
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
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 100);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '24px Arial';
    ctx.fillText('Bob Marley a été vaincu par Babylone !', canvas.width/2, canvas.height/2 - 50);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '24px Arial';
    ctx.fillText('Score Final: ' + gameState.score, canvas.width/2, canvas.height/2 - 10);
    
    // Afficher les options selon le niveau atteint
    if (gameState.maxLevelReached > 1) {
        ctx.fillStyle = '#008000';
        ctx.font = '20px Arial';
        ctx.fillText('Options de redémarrage :', canvas.width/2, canvas.height/2 + 40);
        
        ctx.fillStyle = '#32CD32';
        ctx.font = '18px Arial';
        ctx.fillText(`R - Reprendre au Niveau ${gameState.maxLevelReached}`, canvas.width/2, canvas.height/2 + 70);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px Arial';
        ctx.fillText('T - Recommencer au Niveau 1', canvas.width/2, canvas.height/2 + 100);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px Arial';
        ctx.fillText('JAH BLESS ! Continue la lutte !', canvas.width/2, canvas.height/2 + 130);
    } else {
        ctx.fillStyle = '#008000';
        ctx.font = '18px Arial';
        ctx.fillText('Appuyez sur R pour recommencer', canvas.width/2, canvas.height/2 + 60);
    }
}

// Fonction de victoire
function checkWin() {
    // Pour le niveau boss, vérifier si le boss est vaincu
    if (boss && gameState.level === 7) {
        if (!boss.alive) {
            // Victoire finale déjà gérée dans takeDamage du boss
            return;
        }
        return; // Pas de victoire par collectibles sur le niveau boss
    }
    
    let allCollected = collectibles.every(c => c.collected);
    if (allCollected) {
        gameState.level++;
        // Mettre à jour le niveau maximum atteint
        if (gameState.level > gameState.maxLevelReached) {
            gameState.maxLevelReached = gameState.level;
        }
        updateLevel();
        
        // Vérifier s'il y a un niveau suivant
        if (loadLevel(gameState.level)) {
            // Préparer le message de changement de niveau
            const levelName = levelConfigs[gameState.level]?.name || 'Niveau Inconnu';
            gameState.levelChangeMessage = `NIVEAU ${gameState.level} - ${levelName}`;
            gameState.levelChangeTimer = 360; // 6 secondes à 60fps
            gameState.gamePaused = true;
        } else {
            // Victoire finale (ne devrait pas arriver avec le boss)
            showFinalVictory();
        }
    }
}

// Fonction pour afficher la victoire finale
function showFinalVictory() {
    gameState.gameRunning = false;
    gameState.gameOver = false; // Pas game over, mais victoire
    gameState.finalVictory = true;
}

// Fonction pour dessiner l'écran de victoire finale
function drawFinalVictory() {
    // Fond dégradé triomphant
    let gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0.7)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Titre principal
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText('VICTOIRE !', canvas.width/2, canvas.height/2 - 120);
    ctx.fillText('VICTOIRE !', canvas.width/2, canvas.height/2 - 120);
    
    // Message rastafari
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 36px Arial';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText('JAH RASTAFARI !', canvas.width/2, canvas.height/2 - 70);
    ctx.fillText('JAH RASTAFARI !', canvas.width/2, canvas.height/2 - 70);
    
    // Message de libération
    ctx.fillStyle = '#008000';
    ctx.font = 'bold 28px Arial';
    ctx.strokeText('BABYLONE EST VAINCU !', canvas.width/2, canvas.height/2 - 20);
    ctx.fillText('BABYLONE EST VAINCU !', canvas.width/2, canvas.height/2 - 20);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.strokeText('Le peuple de Jah est libéré !', canvas.width/2, canvas.height/2 + 20);
    ctx.fillText('Le peuple de Jah est libéré !', canvas.width/2, canvas.height/2 + 20);
    
    // Score final
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.strokeText('Score Final: ' + gameState.score, canvas.width/2, canvas.height/2 + 70);
    ctx.fillText('Score Final: ' + gameState.score, canvas.width/2, canvas.height/2 + 70);
    
    // Citation Bob Marley
    ctx.fillStyle = '#FF0000';
    ctx.font = 'italic 20px Arial';
    ctx.strokeText('"Get up, stand up, stand up for your rights!"', canvas.width/2, canvas.height/2 + 110);
    ctx.fillText('"Get up, stand up, stand up for your rights!"', canvas.width/2, canvas.height/2 + 110);
    
    ctx.fillStyle = '#008000';
    ctx.font = '18px Arial';
    ctx.strokeText('- Bob Marley -', canvas.width/2, canvas.height/2 + 135);
    ctx.fillText('- Bob Marley -', canvas.width/2, canvas.height/2 + 135);
    
    // Symboles rastafari
    ctx.fillStyle = '#FFD700';
    ctx.font = '32px Arial';
    ctx.fillText('🌿', canvas.width/2 - 100, canvas.height/2 + 180);
    ctx.fillText('🇯🇲', canvas.width/2, canvas.height/2 + 180);
    ctx.fillText('✊', canvas.width/2 + 100, canvas.height/2 + 180);
    
    // Instructions
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeText('R - Rejouer | T - Recommencer depuis le début', canvas.width/2, canvas.height/2 + 220);
    ctx.fillText('R - Rejouer | T - Recommencer depuis le début', canvas.width/2, canvas.height/2 + 220);
}

// Fonction de redémarrage
function restart(startLevel = 1) {
    // Sauvegarder le niveau maximum atteint
    let savedMaxLevel = gameState.maxLevelReached;
    
    // Remettre l'état du jeu à zéro
    gameState = {
        score: 0,
        lives: 3,
        level: startLevel,
        maxLevelReached: savedMaxLevel,
        gameRunning: true,
        keys: {},
        gameOver: false,
        finalVictory: false,
        deathMessage: '',
        deathMessageTimer: 0,
        levelChangeMessage: '',
        levelChangeTimer: 0,
        gamePaused: false
    };
    
    // Recharger le niveau spécifié
    loadLevel(startLevel);
    
    // Remettre le joueur à sa position d'origine
    player.x = 50;
    player.y = canvas.height - 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.onGround = false;
    player.direction = 'right';
    player.spacePressed = false;
    player.spaceTimer = 0;
    
    // Remettre tous les ennemis à leur position d'origine
    enemies.forEach(enemy => {
        enemy.reset();
    });
    
    // Remettre tous les collectibles à leur état d'origine
    collectibles.forEach(collectible => {
        collectible.reset();
    });
    
    // Remettre le boss à l'état initial s'il existe
    if (boss) {
        boss.reset();
    }
    
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
    
    if (gameState.finalVictory) {
        // Afficher l'écran de victoire finale
        drawFinalVictory();
    } else if (gameState.gameOver) {
        // Afficher l'écran de game over
        drawGameOver();
    } else if (gameState.gameRunning) {
        // Dessiner le fond du jeu
        drawBackground();
        
        // Mettre à jour et dessiner les plateformes
        platforms.forEach(platform => platform.draw());
        
        // Mettre à jour et dessiner les collectibles
        collectibles.forEach(collectible => {
            if (!gameState.gamePaused) {
                collectible.update();
            }
            collectible.draw();
        });
        
        // Mettre à jour et dessiner les ennemis
        enemies.forEach(enemy => {
            if (!gameState.gamePaused) {
                enemy.update();
            }
            enemy.draw();
        });
        
        // Mettre à jour et dessiner le boss s'il existe
        if (boss) {
            if (!gameState.gamePaused) {
                boss.update();
            }
            boss.draw();
        }
        
        // Mettre à jour et dessiner le joueur
        if (!gameState.gamePaused) {
            player.update();
        }
        player.draw();
        
        // Mettre à jour le timer du message de mort
        if (gameState.deathMessageTimer > 0) {
            gameState.deathMessageTimer--;
        }
        
        // Mettre à jour le timer du message de changement de niveau
        if (gameState.levelChangeTimer > 0) {
            gameState.levelChangeTimer--;
            if (gameState.levelChangeTimer <= 0) {
                gameState.gamePaused = false;
                gameState.levelChangeMessage = '';
            }
        }
        
        // Afficher le message de changement de niveau
        if (gameState.levelChangeTimer > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(gameState.levelChangeMessage, canvas.width/2, canvas.height/2 - 60);
            ctx.fillText(gameState.levelChangeMessage, canvas.width/2, canvas.height/2 - 60);
            
            // Message motivant
            ctx.fillStyle = '#32CD32';
            ctx.font = 'bold 28px Arial';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            if (gameState.level === 7) {
                ctx.strokeText('Affronte le Roi de Babylone !', canvas.width/2, canvas.height/2 + 20);
                ctx.fillText('Affronte le Roi de Babylone !', canvas.width/2, canvas.height/2 + 20);
            } else {
                ctx.strokeText('Libère toi du système oppressif de Babylone !', canvas.width/2, canvas.height/2 + 20);
                ctx.fillText('Libère toi du système oppressif de Babylone !', canvas.width/2, canvas.height/2 + 20);
            }
            
            // Message rastafari
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 20px Arial';
            ctx.strokeText('JAH BLESS ! ONE LOVE !', canvas.width/2, canvas.height/2 + 80);
            ctx.fillText('JAH BLESS ! ONE LOVE !', canvas.width/2, canvas.height/2 + 80);
            
            // Compteur de temps restant
            let secondsLeft = Math.ceil(gameState.levelChangeTimer / 60);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '18px Arial';
            ctx.strokeText(`Début dans ${secondsLeft} secondes...`, canvas.width/2, canvas.height/2 + 120);
            ctx.fillText(`Début dans ${secondsLeft} secondes...`, canvas.width/2, canvas.height/2 + 120);
        }
        
        // Afficher le message de mort s'il y en a un
        if (gameState.deathMessageTimer > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(gameState.deathMessage, canvas.width/2, 100);
            ctx.fillText(gameState.deathMessage, canvas.width/2, 100);
        }
        
        // Vérifier la victoire seulement si le jeu n'est pas en pause
        if (!gameState.gamePaused) {
            checkWin();
        }
    }
    
    // Continuer la boucle
    requestAnimationFrame(gameLoop);
}

// Démarrer le jeu
gameLoop(); 