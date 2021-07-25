const canvas = document.createElement('canvas')
const w = canvas.width = 700
const h = canvas.height = 500
document.body.appendChild(canvas)
const ctx = canvas.getContext('2d')

const board = () => {
    ctx.beginPath()
    ctx.arc(w/2,h/2,w/10,0,2*Math.PI)
    ctx.moveTo(w/2,0)
    ctx.lineTo(w/2,h)
    ctx.rect(0, h/4, w/10, h/2)
    ctx.rect(w - w/10, h/4, w/10, h/2)
    ctx.font = '48px serif';
    ctx.fillText(player1.score, w/30, h/10)
	ctx.fillText(player2.score, 14 * w/15, h/10)
    ctx.stroke()
}

var socket = new WebSocket('ws://' + window.location.host + '/ws/draw');
var url = window.location.href
const url2 = new URL(url)



class Player {
    constructor() {
        this.x = undefined
        this.y = undefined
        this.prevX = undefined
        this.prevY = undefined
        this.dx = undefined
        this.dy = undefined
        this.score = 0
		this.color = undefined
		this.gamma = 0
		this.beta = 0
    }

	setting(x, y, color) {
		this.x = x
		this.y = y
		this.color = color
	}

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y , w*.05 ,0 ,2*Math.PI)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.stroke()
    }

    update() {
        this.dx = this.x - this.prevX
        this.dy = this.y - this.prevY
        this.prevX = this.x
        this.prevY = this.y
    }

}

class Puck {

    constructor() {
        this.x = w/2
        this.y = h/2
        this.dx = 1
        this.dy = 1
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y , w*.04 ,0 ,2*Math.PI)
        ctx.fillStyle = "black"
        ctx.fill()
        ctx.stroke()
    }

    update() {
        this.x += this.dx
        this.y += this.dy

		//Winnig Goals
        if(this.x - w*.04 < 0) {
            if(this.y > h/4 && this.y < 3*h/4) {
                player2.score++
                resetPuck()
            } 
        } else if (this.x + w*.04 > w) {
            if(this.y > h/4 && this.y < 3*h/4) {
                player1.score++
                resetPuck()
            } 
        }

		//Bounce back if it hits the wall
        if(this.x + w*.04 > w || this.x - w*.04 < 0) {
            this.dx *= -1
        }
        if(this.y + w*.04 > h || this.y - w*.04 < 0) {
            this.dy *= -1
        }

        //vS + vP = vS' + vP' => VP' = vS + vP - cS'
		//Collision Detection

		const Pa = Math.abs(this.x - player1.x)
        const Pb = Math.abs(this.y - player1.y)
        const Pc = Math.sqrt(Pa**2 + Pb**2)
        const Ca = Math.abs(this.x - player2.x)
        const Cb = Math.abs(this.y - player2.y)
        const Cc = Math.sqrt(Ca**2 + Cb**2)

        if(Pc < w * 0.1) {
			if(player1.dx == 0) {
				this.dx = this.dx * -1
			} else {
				this.dx = this.dx + player1.dx * 0.5
			}
			if(player1.dy == 0) {
				this.dy = this.dy * -1
			} else {
				this.dy = this.dy + player1.dy * 0.5
			}
        } else if (Cc < w * 0.1) {
            if(player2.dx == 0) {
				this.dx = this.dx * -1
			} else {
				this.dx = this.dx + player2.dx * 0.5
			}
			if(player2.dy == 0) {
				this.dy = this.dy * -1
			} else {
				this.dy = this.dy + player2.dy * 0.5
			}
        }

		//Frictions
        Math.sign(this.dx) === 1 ? this.dx -= .3 : this.dx += .3
        Math.sign(this.dy) === 1 ? this.dy -= .3 : this.dy += .3
    }

}

function resetPuck() {
	puck.x = w/2
	puck.y = h/2
	puck.dx = 0
	puck.dy = 0
}

const player1 = new Player
player1.setting(w/10, h/2, "red")
const player2 = new Player
player2.setting(w * 9/10, h/2, "blue")
const puck = new Puck

function animate() {
    ctx.clearRect(0,0,w,h)

    board()

    player1.draw()
    player1.update()

    puck.draw()
    puck.update()

    player2.draw()
    player2.update()
    
    requestAnimationFrame(animate)
}

function panimate() {
    ctx.clearRect(0,0,w,h)

    board()

    player1.update()

    puck.update()

    player2.update()
    
    requestAnimationFrame(panimate)
}

var gyroscope = true

if(url2.searchParams.get('type') == 'player1'){
	
	if(gyroscope){
		window.addEventListener('deviceorientation', (event) => {
			var x = event.gamma
			var y = event.beta
			var leftmargin = (window.innerWidth - w)/2
			console.log('x : ' + player1.x + ', y : ' + player1.y + ", xx : " + x + ", yy : " + y)
	
			if(0 < player1.x && player1.x < w/2 && 0 < player1.y && player1.y < h){
				if(player1.gamma != x){
					player1.x = player1.x + x
					player1.gamma = x
				}
				if(player1.beta != y){
					player1.y = player1.y + y
					player1.beta = y
				}
				socket.send("{\"x\" : " + player1.x + ", \"y\" : " + player1.y + ", \"px\" : " + puck.x + ", \"py\" : " + puck.y + ", \"p1s\" : " + player1.score + ", \"p2s\" : " + player2.score + ", \"uid\" : " + 1 + "}" )
			}
	
			if(player1.x <= 0){
				player1.x = 1
			} else if(player1.x >= w/2){
				player1.x = w/2 - 1
			}
	
			if(player1.y <= 0){
				player1.y = 1
			} else if(player1.y >= h){
				player1.y = h - 1
			}
		})
	} else {
		window.addEventListener('mousemove', (event) => {
			//Need to keep track of the mouse relative to canvas size, not the whole html mouse point
			var leftmargin = (window.innerWidth - w)/2
			if((leftmargin < event.x && event.x < (window.innerWidth - leftmargin)) && (30 < event.y && event.y < h + 30) && event.x < window.innerWidth / 2){
				player1.x = event.x - leftmargin
				player1.y = event.y - 30
				socket.send("{\"x\" : " + player1.x + ", \"y\" : " + player1.y + ", \"px\" : " + puck.x + ", \"py\" : " + puck.y + ", \"p1s\" : " + player1.score + ", \"p2s\" : " + player2.score + ", \"uid\" : " + 1 + "}" )
			}
		})
	}
	
	socket.onmessage = function(receivedMessage) {
        var received = JSON.parse(receivedMessage.data);
        console.log("Received: " + JSON.stringify(received));
		if(received.uid == 2){
			player2.x = received.x
			player2.y = received.y
			puck.x = received.px
			puck.y = received.py
			player1.score = received.p1s
			player2.score = received.p2s
		}
    }
	
	panimate()
}

if(url2.searchParams.get('type') == 'player2'){

	if(gyroscope){
		window.addEventListener('deviceorientation', (event) => {
			var x = event.gamma
			var y = event.beta
			var leftmargin = (window.innerWidth - w)/2
			console.log('x : ' + player2.x + ', y : ' + player2.y + ", xx : " + x + ", yy : " + y)
	
			if(w/2 < player2.x && player2.x < w && 0 < player2.y && player2.y < h){
				if(player2.gamma != x){
					player2.x = player2.x + x
					player2.gamma = x
				}
				if(player2.beta != y){
					player2.y = player2.y + y
					player2.beta = y
				}
				socket.send("{\"x\" : " + player2.x + ", \"y\" : " + player2.y + ", \"px\" : " + puck.x + ", \"py\" : " + puck.y + ", \"p1s\" : " + player1.score + ", \"p2s\" : " + player2.score + ", \"uid\" : " + 2 + "}" )
			}
	
			if(player2.x <= w/2){
				player2.x = w/2 + 1
			} else if(player2.x >= w){
				player2.x = w - 1
			}
	
			if(player2.y <= 0){
				player2.y = 1
			} else if(player2.y >= h){
				player2.y = h - 1
			}
		})
	} else {
		window.addEventListener('mousemove', (event) => {
			//Need to keep track of the mouse relative to canvas size, not the whole html mouse point
			var leftmargin = (window.innerWidth - w)/2
			if((leftmargin < event.x && event.x < (window.innerWidth - leftmargin)) && (30 < event.y && event.y < h + 30) && event.x < window.innerWidth / 2){
				player2.x = event.x - leftmargin
				player2.y = event.y - 30
				socket.send("{\"x\" : " + player2.x + ", \"y\" : " + player2.y + ", \"px\" : " + puck.x + ", \"py\" : " + puck.y + ", \"p1s\" : " + player1.score + ", \"p2s\" : " + player2.score + ", \"uid\" : " + 2 + "}" )
			}
		})
	}
	
	
	

	socket.onmessage = function(receivedMessage) {
        var received = JSON.parse(receivedMessage.data);
        console.log("Received: " + JSON.stringify(received));
        if(received.uid == 1){
			player1.x = received.x
			player1.y = received.y
			puck.x = received.px
			puck.y = received.py
			player1.score = received.p1s
			player2.score = received.p2s
		}
    }
	panimate()
}	

if(url2.searchParams.get('type') == 'large'){
	
	socket.onmessage = function(receivedMessage) {
        var received = JSON.parse(receivedMessage.data);
        console.log("Received: " + JSON.stringify(received));
        if(received.uid == 1){
			player1.x = received.x
			player1.y = received.y
			puck.x = received.px
			puck.y = received.py
			player1.score = received.p1s
			player2.score = received.p2s
		}
		if(received.uid == 2){
			player2.x = received.x
			player2.y = received.y
			puck.x = received.px
			puck.y = received.py
			player1.score = received.p1s
			player2.score = received.p2s
		}
    }
	animate()
}