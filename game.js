window.onload = function() {
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
const startScreen = document.querySelector('#startScreen') //Whole game start screen
const playbutton = document.getElementById('playbutton') //Will be used as a determiner to whether the game will start
const finalScore = document.querySelector('#finalScore') //Displayed on the start screen
var score = 0 //Will be increased later, default 0

canvasWidth = 800; //In order to use it throughout the program without having need to write canvas.width and canvas.height over and over again
canvasHeight = 600;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

addEventListener('resize', function(){ //To adjust to the screen resize situation
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
})

function randomIntFromRange(min, max) { //Utility function retrieved from Chris Course
  return Math.floor(Math.random() * (max - min + 1) + min)
}

class Player {
  constructor(x, y, radius, color, distance) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.distance = distance

    this.radians = 0 
    this.velocity = -0.05
  }

  draw() {
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
    c.closePath()
  }

  update(x,y) { 
    //Algorithm to achieve a half circulation effect
    this.radians += this.velocity; //Angle increases by the time
    this.x = x + Math.cos(this.radians) * this.distance; //To make the spinning visible. Goes between 0-1 depending on the cos value 
    this.y = y + Math.sin(this.radians) * this.distance;
    if(this.y >= 600) { //Starts circulating to the other side when reaches to the bottom of the canvas
      this.velocity = -this.velocity;
    } 
    this.draw();
  }
}

class Bullet {
  constructor(x,y,radius,color) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color 
    this.radians = player.radians
    this.dx = Math.cos(this.radians) * player.distance * 0.06 //A bullet will move according to the position(both x and y) of the player
    this.dy = Math.sin(this.radians) * player.distance * 0.06 
  }

  draw() {
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
    c.closePath()
  }

  update() {
    this.draw()
    this.x += this.dx
    this.y += this.dy
    if(this.x + this.radius >= canvasWidth || this.x - this.radius <= 0) { //To bounce the bullets from the left and right "walls"
      this.dx = -this.dx
    }
  }
}

class Enemy {
  constructor(x,y,radius,color,radians, dx ,dy) {
    this.x = x 
    this.y = y
    this.radius = radius
    this.color = color
    this.radians = radians
    this.dx = dx
    this.dy = dy
  }

  draw() {
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
    c.closePath()
  }

  update() {
    this.draw()
    this.x += this.dx
    this.y += this.dy
  }
}

class Particle { //Particles are for the effect when an enemy is shot
  constructor(x,y,radius,color, dx ,dy) {
    this.x = x 
    this.y = y
    this.radius = radius
    this.color = color
    this.dx = dx
    this.dy = dy
    this.alpha = 1 //For the opacity that decreases by the time in the update method
  }

  draw() {
    c.save() //Only calls the code between save and restore(to make particles insivisible by time)
    c.globalAlpha = this.alpha
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
    c.closePath()
    c.restore()
  }

  update() {
    this.draw()
    this.x += this.dx
    this.y += this.dy
   this.alpha -= 0.006
  }
}

let player = new Player(398,590,10,'white',72);
let bullets = [] 
let enemies = []
let particles = []

function init() { //To reset everything for a new game
  score = 0
  document.getElementById('score').innerHTML = score
  player = new Player(398,590,10,'white',72)
  bullets = []
  enemies = []
  particles = []
}

function spawnEnemies() {
  setInterval(() => { //To call every second instead of calling instantly
    const x = randomIntFromRange(20,canvasWidth-20) //From inside the left and right "walls"
    const y = -10 //Outside of the top of the canvas
    const radius = randomIntFromRange(10, 50)
    const color = 'yellow'

    const angle = Math.atan2(canvasHeight - y, canvasWidth/2 - x) //To make enemies aimed to the player fortress
    const dx = Math.cos(angle) * 1.2 //1.2 is to make them a bit faster
    const dy = Math.sin(angle) * 1.2

    enemies.push(new Enemy(x,y,radius,color, 0, dx, dy))
  }, 3000)
}

let animationID //To determine whether start or stop the animation
function animate() {
  animationID = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0,0,0,0.1)'
  c.fillRect(0,0,innerWidth,innerHeight) //To clear the canvas every time animation is called

  c.beginPath() //To make the path effect cooler
  c.arc(398, 600, 88, 0, Math.PI * 2, false)
  c.fillStyle = 'black'
  c.fill()
  c.closePath()

  c.beginPath()
  c.arc(398, 600, 60, 0, Math.PI * 2, false)
  c.fillStyle = '#000066'
  c.fill()
  c.closePath()

  c.beginPath() //Outermost circle, game is terminated when an enemy touches this circle 
  c.arc(398,600,115,0,Math.PI * 2, false)
  c.lineWidth = 5
  c.strokeStyle = '#000066'
  c.stroke()
  c.closePath()
  
  player.update(398,590) //initial x and y coordinate is needed for the update function

  particles.forEach((particle, particleIndex) => {

    if(particle.alpha <= 0) { //Removes a particle by the opacity of it
      particles.splice(particleIndex, 1) //Remove only one particle which is the current one
    }
    else {
      particle.update()
    }
  })

  bullets.forEach((bullet, bulletIndex) => { 

    bullet.update()
    if(bullet.y + bullet.radius <= 0) { //This is to remove the bullets when they are of the screen
      setTimeout(() => { //Without that, there will be flashing on the screen
        bullets.splice(bulletIndex, 1)
      }, 0)   
    }
  });

  enemies.forEach((enemy, index) => {
    enemy.update()

    const dist = Math.hypot(398 - enemy.x, 600 - enemy.y) //Enemy's distance to the outermost circle. Calculated by pythagorian theorem

    if(dist - enemy.radius - 115 <= 1){ //Losing the game
      cancelAnimationFrame(animationID)
      startScreen.style.display = 'block'
      finalScore.innerHTML = score 
    }

    bullets.forEach((bullet, bulletIndex) => {
      const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) //Measures the distance between bullet and enemy

      if(dist - enemy.radius - bullet.radius < 1) { //When an enemy is shot

        score += 60 - enemy.radius //Increases the score by inverse ratio with the enemy size
        document.getElementById('score').innerHTML = score

        for (let i = 0; i < 8; i++) { //8 particles will be displayed on the screen when an enemy is hit
          particles.push(new Particle(bullet.x, bullet.y, 
                                      randomIntFromRange(enemy.radius/10, enemy.radius/5), enemy.color, 
                                      (Math.random() - 0.5) * randomIntFromRange(3,8),
                                      (Math.random() - 0.1) * randomIntFromRange(3,8) ))
        }

        setTimeout(() => { //Without that, there will be flashing on the screen
          enemies.splice(index, 1)
          bullets.splice(bulletIndex, 1)
        }, 0)        

      }
    })
  });
}

var lastMove = 0
addEventListener('keyup', event => {  //Every time spacebar is pressed, a new bullet goes into the bullets array 
  if (event.code === 'Space') {
    if(Date.now() - lastMove > 1000) { //One second should pass in order to fire a bullet
      bullets.push(new Bullet(player.x, player.y, player.radius, player.color))
      lastMove = Date.now()
    }
  }
})

playbutton.addEventListener('click', () => {
  init()
  animate() 
  spawnEnemies()
  startScreen.style.display = 'none'
})

};

