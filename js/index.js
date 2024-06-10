// écran de début
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }
    preload() {
        this.load.image('start', 'img/start.jpg');
    }
    create() {
        this.add.image(0, 0, 'start').setOrigin(0);
        const windowWidth = this.sys.game.config.width;
        const windowHeight = this.sys.game.config.height;

        const backgroundImage = this.add.image(windowWidth / 2, windowHeight / 2, 'start');
        
        const scaleX = windowWidth / backgroundImage.width;
        const scaleY = windowHeight / backgroundImage.height;
        const scale = Math.max(scaleX, scaleY);

        backgroundImage.setScale(scale);

        this.add.text(50, 150, 'Jeu lancer de poids \nMaintenir "espace" puis lacher pour lancer le poids.\nPlus la jauge est élévée plus le poids ira loin', { fontSize: '20px', fill: '#fff' });

        var startButton = this.add.text(700, 370, 'Start', { fontSize: '32px', fill: '#fff', backgroundColor: '#0000ff', padding: 10});
        startButton.setInteractive();

        startButton.on('pointerdown', () => {
            this.scene.start('MainScene');
        });
    }
}

var espaceEstPresse = false;
var animationLancee = false;
var animationJaugeLancee = false;
var enterEstPresseFin = false;

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.points = 0;
        this.delayStarted = false;
        this.balleDeplacee = false;
    }

    preload() {
        this.load.image('stade', 'img/stade.png');
        this.load.image('balle', 'img/balle.png');
        this.load.spritesheet('joueur', 'img/joueur.png', { frameWidth: 32, frameHeight: 47 });
        this.load.spritesheet('jauge', 'img/jauge.png', { frameWidth: 53, frameHeight: 233 });
    }

    create() {
        var _this = this;
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
    
        var imageX = windowWidth / 2;
        var imageY = windowHeight / 2;
    
        this.add.image(imageX, imageY, 'stade');
    
        this.scale.resize(windowWidth, windowHeight);
    
        this.joueur = this.add.sprite(400, 400, 'joueur');
        this.joueur.setScale(3);
    
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('joueur', { start: 0, end: 4 }),
            frameRate: 10,
            repeat: 0
        });
    
        this.joueur.on('animationcomplete', function () {
            this.joueur.anims.stop();
            animationLancee = false; 
        }, this);
    
        this.balle = this.add.image(500, 600, 'balle');
        this.balle.setScale(0.2);
        this.balle.setVisible(false);   
    
        // début animation de la jauge
        this.anims.create({
            key: 'jauge_anim_forward',
            frames: this.anims.generateFrameNumbers('jauge', { start: 0, end: 5 }), 
            frameRate: 11,
            repeat: 0 
        });
    
        this.anims.create({
            key: 'jauge_anim_backward',
            frames: this.anims.generateFrameNumbers('jauge', { start: 5, end: 0 }), 
            frameRate: 11,
            repeat: 0 
        });
    
        this.jauge = this.add.sprite(180, 170, 'jauge');
        this.jauge.setScale(1.2);
        this.jauge.play('jauge_anim_forward');
    
        this.jauge.on('animationcomplete', function (animation, frame) {
            if (animation.key === 'jauge_anim_forward') {
                this.jauge.play('jauge_anim_backward'); 
            } else if (animation.key === 'jauge_anim_backward') {
                this.jauge.play('jauge_anim_forward'); 
            }
        }, this);
  
        // faire avancer la balle
        var score = [
            { frame: '0', pixels: 330, points: '20' },
            { frame: '1', pixels: 455, points: '40'},
            { frame: '2', pixels: 575, points: '60'},
            { frame: '3', pixels: 700, points: '80'},
            { frame: '4', pixels: 760, points: '90'},
            { frame: '5', pixels: 820, points: '100'}
        ];

        function getPixels(frameIndex) {
            return score[frameIndex].pixels;
        } 
        
        function getPoints(frameIndex) {
            return score[frameIndex].points;
        }

        this.input.keyboard.on('keydown-SPACE', function (event) {
            console.log('Espace est pressé');
            espaceEstPresse = true;
        });

        this.input.keyboard.on('keyup-SPACE', function (event) {
            console.log('Espace est relaché');
            espaceEstPresse = false;
        
            var pixelsToMove = getPixels(_this.jauge.frame.name);
            console.log("px to move :", pixelsToMove);
            _this.balle.x += pixelsToMove;
        
            var pts = getPoints(_this.jauge.frame.name);
            console.log("points :", pts);
            _this.points = pts;

            _this.updateBalleDeplacee();
        });
    }

    update() {
        console.log("joueur : ", this.joueur.anims.isPlaying);

        if (espaceEstPresse) {
            this.joueur.setFrame(1);
            if (!animationLancee) {
                this.joueur.setFrame(2);
                this.joueur.anims.play('walk');
                animationLancee = true;
            }
            
            if (!animationJaugeLancee) {
                animationJaugeLancee = true;
                if (this.jauge.anims.currentAnim.key === 'jauge_anim_backward') {
                    this.jauge.play('jauge_anim_forward');
                } else {
                    this.jauge.play('jauge_anim_backward');
                }
            }
            var numeroSprite = this.jauge.frame.name;
            console.log("sprite jauge :", numeroSprite);
        } else {
            animationJaugeLancee = false;
            this.jauge.anims.stop();
            
            
            this.balle.setVisible(true);
            // if(animationLancee == false){
            //     if (this.joueur.frame === 4) {
            //         this.balle.setVisible(true);
            //     } else {
            //         this.balle.setVisible(false);
            //     }       
            // }
        }

        if (this.balleDeplacee && !this.delayStarted) {
            this.delayStarted = true;
            var points = this.points;
            console.log("Points avant le changement de scène :", points);
    
            // délai 1 seconde avant de changer de scène
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScreen', { points: points });
            });
        }       
    }
    updateBalleDeplacee() {
        this.balleDeplacee = true;
    }
}


// écran de fin
class GameOverScreen extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScreen' });
    }
    preload() {
        this.load.image('end', 'img/end.jpg');
    }
    create(data) {
        const points = data.points;
        console.log("points :", points);

        this.add.image(0, 0, 'end').setOrigin(0);
        const windowWidth = this.sys.game.config.width;
        const windowHeight = this.sys.game.config.height;

        const backgroundImage = this.add.image(windowWidth / 3, windowHeight / 3, 'end');
        
        const scaleX = windowWidth / backgroundImage.width;
        const scaleY = windowHeight / backgroundImage.height;
        const scale = Math.max(scaleX, scaleY);

        backgroundImage.setScale(scale);
        this.add.text(900, 100, 'Bravo\nScore:' + points, { fontSize: '32px', fill: '#fff', backgroundColor: '#32CD32', padding: 10});

        var startButton = this.add.text(900, 200, 'Rejouer ?', { fontSize: '32px', fill: '#fff', backgroundColor: '#000', padding: 10});
        startButton.setInteractive();
        startButton.on('pointerdown', () => {
            this.scene.start('StartScene');
        });
    }
}

var config = {
    type: Phaser.AUTO,
    width: 1930,
    height: 1080,
    scene: [ StartScene, MainScene, GameOverScreen ],
    input: {
        keyboard: true
    }
};
var game = new Phaser.Game(config);