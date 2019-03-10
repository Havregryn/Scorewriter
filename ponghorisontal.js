
/* Pong Javascript*/
/* Hallgrim 2017-2019 */


var animate = window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationframe ||
function(callback) { window.setTimeout( callback, 1000/60 )};

var canvas = document.createElement( 'canvas' );

//Game settings
var width;
var height;
var defaultPaddleWidth = 40;
var paddleWidth = defaultPaddleWidth;
var paddleThickness = 5;
var paddleDistanceFromEdge = 10;
var ballPlayerToPlayerSpeed = 3;
var ballRadius = 5;
var paddleSpeed = 6;
var MaxAutoPaddleSpeed = 4;
var deviceAngleBias = 0; // Compensating for the mobile device default angle when playing
var accelerometerTilt = 0;
var hasAccelereometer = true;
var hasPhysicalKeyboard = false;
var orientation;

var gameMode = 0; 
// Modes: 0: pre-game, 1 = Wait for ball, 2 = game in action, 3 = game over.
var gameLevel = 1;
var bgMustBeRendered = true;
var waitShowGameOver = false;
var waitingForBall = false;
var PlayerScore = 0;
var ComputerScore = 0;

var bgColor = "#000000";
var fgColor = "#FFFFFF";
var scoreColor = "#999999";

var score_x;
var score_y;
var scoreSize;

var context = canvas.getContext( '2d' );
var keysDown = {};

var scoreFont=[];

var net;
var player;
var computer;
var ball;
var preGamePanel;
var gameOverPanel;

var leftLSScoreDigit;
var leftMSScoreDigit;
var rightLSScoreDigit;
var rightMSScoreDigit;


window.onload = function() {
    
    orientation = window.orientation;
    
    window.addEventListener("keydown", function( event ) {
                            keysDown[ event.keyCode ] = true;
                            });
    
    window.addEventListener("keyup", function( event ) {
                            delete keysDown[event.keyCode]; });
    
    window.addEventListener("orientationchange", function( event ){
                            orientation = window.orientation;
                       
                            });
    
    canvas.addEventListener("mousedown", mouseClickedOnCanvas, false );
    
    
    
    if( window.DeviceMotionEvent == undefined ){
        hasAccelereometer = false;
    }
    
    
    window.ondevicemotion = function( event ){
        
        if( orientation ==-90){
            var tilt = Math.round( event.accelerationIncludingGravity.x * 10 );
        }
        else if ( orientation == 90 ){
            var tilt = Math.round( event.accelerationIncludingGravity.x * -10 );
        }
        else{
            var tilt = Math.round( event.accelerationIncludingGravity.y * -10 );
        }
        if ( hasPhysicalKeyboard == false && tilt != accelerometerTilt ){

            if( deviceAngleBias == 0) {
                deviceAngleBias = - (tilt/2);
            }
            accelerometerTilt = tilt + deviceAngleBias;
        }
        
        
    };
    
    
    
    viewResize();
   	
	net = new Net;
	preGamePanel = new PreGamePanel();
	gameOverPanel = new GameOverPanel();
    player = new Player();
    computer = new Computer();
    ball = new Ball( width/2, height/2 );
    
    leftLSScoreDigit = new ScoreDigit( true, true );
    leftMSScoreDigit = new ScoreDigit( true, false );
    rightLSScoreDigit = new ScoreDigit( false, true );
    rightMSScoreDigit = new ScoreDigit( false, false );
    
    document.body.appendChild( canvas );
    animate( step );
    
};

var mouseClickedOnCanvas = function(event){	
	var rect = canvas.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;
	preGamePanel.clicked(x, y);
}

var viewResize = function(){
    width = window.innerWidth - 20;
    height = window.innerHeight - 20;
    //width = 600;
    //height = 400;
    canvas.width = width;
    canvas.height = height;
    paddleWidth = Math.round( height/10 );
    if( paddleWidth > 60 ) paddleWidth = 60;
    paddleThickness = 5;
    paddleDistanceFromEdge = Math.round(width/50);
    ballRadius = 5;
	setGameLevel();
    paddleSpeed = Math.round(height/60);
    score_x = Math.round(width/6 ); //Distance left edge of canvas to left edge of leftmost digit
    score_y = Math.round( height/4 ); //Distance top of canvas to lower edge of digits
    scoreSize = Math.round( height/13 );
    
    if( computer != undefined ){ //If viewResize is not called from onLoad
        computer.paddle.x = width - paddleDistanceFromEdge;
        player.paddle.x = paddleDistanceFromEdge;
        player.paddle.width = paddleWidth;
        computer.paddle.width = paddleWidth;
        
        leftMSScoreDigit.setSizeAndPosition();
        leftLSScoreDigit.setSizeAndPosition();
        rightMSScoreDigit.setSizeAndPosition();
        rightLSScoreDigit.setSizeAndPosition();
        
    }
	if( preGamePanel != undefined){
		preGamePanel.updatePosition();
	}
	if( gameOverPanel != undefined){
		gameOverPanel.updatePosition();
	}
};

// Adjusts settings based on schosen game level:
var setGameLevel = function(){
    ballPlayerToPlayerSpeed = Math.round((gameLevel/2) *  width/150 );
    if( ballPlayerToPlayerSpeed < 4 ) ballPlayerToPlayerSpeed = 4;	
    MaxAutoPaddleSpeed = (gameLevel/2) * height/120;
	if(gameLevel == 1){
		MaxAutoPaddleSpeed = MaxAutoPaddleSpeed * 1.4;
	}
	else if(gameLevel ==2){	
		MaxAutoPaddleSpeed = MaxAutoPaddleSpeed * 1.4;
	}
	if(gameLevel == 3){
		ballPlayerToPlayerSpeed * ballPlayerToPlayerSpeed * 1.2;
		MaxAutoPaddleSpeed = MaxAutoPaddleSpeed * 1.4;
	}
};



// Main animation loop!
var step = function () {
	if(gameMode == 1 && !waitingForBall){
		waitingForBall = true;
		setTimeout(newBall, 3000);
	}
	if(gameMode == 3 && !waitShowGameOver){
		waitShowGameOver = true;
		setTimeout(newGame, 4000);
	}
    update();
    render();
    animate(step);
};

var newBall = function(){
	waitingForBall = false;
	gameMode = 2;
};

var startGame = function(){
	clearInterval(preGamePanel.startBlinkerTimer);
	preGamePanel.startButtonWhite = false;
	preGamePanel.unrender();
	gameMode = 1;
};

var newGame = function(){
	waitShowGameOver = false;
	gameOverPanel.unrender();
	gameMode = 0;
	PlayerScore = 0;
	ComputerScore = 0;
};



var preGameStartBlinker = function(){
	preGamePanel.startButtonWhite = !preGamePanel.startButtonWhite;	
};



// Updating the positions and the scores
var update = function() {
    player.update();
    computer.update( ball );
	if(gameMode == 2){
    	ball.update( player.paddle, computer.paddle );
	}
    scoreUpdate( true, PlayerScore );
    scoreUpdate( false, ComputerScore );
	net.update();
};

Player.prototype.update = function() {
	this.paddle.old_x = this.paddle.x;
	this.paddle.old_y = this.paddle.y;
    this.paddle.move( 0, 0 );
    for( var key in keysDown ){
        var value = Number( key);
        if(value == 38 ){ //up arrow
            this.paddle.move( 0, -paddleSpeed );
            hasPhysicalKeyboard = true;
            //alert( hasPhysicalKeyboard );
        }
        else if( value == 40 ){ // down arrow
            this.paddle.move( 0, paddleSpeed );
            hasPhysicalKeyboard = true;
        }
        
    }
    
    //Movement based on accelerometer in mobile devices
    if( accelerometerTilt != 0 && hasPhysicalKeyboard == false ){
        //alert( accelerometerTilt );
        if( accelerometerTilt < -2 ){
            this.paddle.move( 0, accelerometerTilt/4 );
        }
        else if( accelerometerTilt > 2 ){
            this.paddle.move( 0, accelerometerTilt/4 );
        }
    }
};

Computer.prototype.update = function( ball ){ // Automation
	this.paddle.old_y = this.paddle.y;
	this.paddle.old_x = this.paddle.x;
	var y_pos = ball.y;
    var diff = -((this.paddle.y + (this.paddle.width / 2)) - y_pos);
    if( diff < -MaxAutoPaddleSpeed ) { diff = -MaxAutoPaddleSpeed   }
    else if( diff > MaxAutoPaddleSpeed ){ diff = MaxAutoPaddleSpeed };

	if(gameMode == 1){ diff = diff / MaxAutoPaddleSpeed };
    
    //Randomly screw the ball if ball y-speed = 0;
    if (ball.y_speed == 0 && diff == 0 && this.paddle.x - ball.x - ballRadius < ball.x_speed ){
        //alert(ball.x - this.paddle.x);
        diff = (Math.round( Math.random()) - 0.5) * 2 * MaxAutoPaddleSpeed;
    }
     
    
    this.paddle.move( 0, diff );
    if( this.paddle.y < 0){
        this.paddle.y = 0
    }
    else if( this.paddle.y + this.paddle.width > height ){
        this.paddle.y = width - this.paddle.width;
            }
    
};


Paddle.prototype.move = function( x, y ){
    this.x += x;
    this.y += y;
    this.x_speed = x;
    this.y_speed = y;
    if( this.y < 0 ){
        this.y = 0;
        this.y_speed = 0;
    }
    else if( this.y + paddleWidth > height ){
        this.y = height - paddleWidth;
        this.y_speed = 0;
    }
};

Ball.prototype.update = function( paddle1, paddle2) {
    this.old_x = this.x;
	this.old_y = this.y;
	if( this.x_speed > 0 ){
        this.x_speed = ballPlayerToPlayerSpeed;
    }
    else{
        this.x_speed = - ballPlayerToPlayerSpeed;
    }
    this.x += this.x_speed;
    this.y += this.y_speed;
    var left_x = this.x - ballRadius;
    var top_y = this.y - ballRadius;
    var right_x = this.x + ballRadius;
    var bottom_y = this.y + ballRadius;
    
    
    
    
    // hitting the upper or lower wall
    if( (this.y - ballRadius) < 0 )
    {
        this.hitWallAudio.play();
        this.y = ballRadius;
        this.y_speed = -this.y_speed;
    }
    else if( (this.y + ballRadius) > height )
    {
        this.hitWallAudio.play();
        this.y = height - ballRadius;
        this.y_speed = -this.y_speed;
    }
    
    if( this.x < 0 || this.x > width ) // scoring a point
    {
        this.outAudio.play();
        if( this.x < 0 ){
            ComputerScore += 1;
        }
        else{
            PlayerScore +=1;
        }
        this.y_speed = Math.floor(( Math.random() * 6) + 1 ) - 3;
        this.x_speed = (Math.round(Math.random()) - 0.5 ) * 2 * ballPlayerToPlayerSpeed;
        this.x = width/2;
        this.y = height/2;
		if(PlayerScore == 11 || ComputerScore == 11){
			gameMode = 3;  
			net.unrender();
		}
    	else{ gameMode = 1; }
		
    }
    
    //Check if hitting the Players paddle
    if( left_x < ( paddle1.x + paddleThickness ) && right_x > paddle1.x
       && bottom_y > paddle1.y && top_y < (paddle1.y + paddleWidth )){
        this.hitPlayerAudio.play();
        this.x_speed = -this.x_speed;
        this.y_speed += ( paddle1.y_speed / 2 );
        this.x += this.x_speed;
    }
    
    //Check if hitting the Computer paddle
    if( right_x > paddle2.x && left_x < (paddle2.x + paddleThickness) &&
       bottom_y > paddle2.y && top_y < (paddle2.y + paddleWidth) ){
        this.hitPlayerAudio.play();
        this.x_speed = -this.x_speed;
        this.y_speed += (paddle2.y_speed / 2 );
        this.x += this.x_speed;
    } 
};


// The main drawing routine:
var render = function() {
	player.unrender();
    player.render();
	computer.unrender();
    computer.render();
	ball.unrender();
	if(gameMode != 0 && gameMode != 3){ net.render(); }
	scoreUnrender();
    scoreRender( true );
    scoreRender( false );
	if(gameMode == 0){
		preGamePanel.render();
	}
	else if(gameMode == 3){
		gameOverPanel.render();	
	}
    else if(gameMode == 2){
		ball.render();
	}
    
};

function PreGamePanel(){	
	this.text = ["*************************",
				"*        P O N G        *",
				"*                       *",
				"*     Select Level:     *",
				"*                       *",
				"*    [1]   [2]   [3]    *",
				"*                       *",
				"*                       *",
				"*                       *",
				"*************************"];
	this.txtLineCount = 10;
	this.rowWidth = 25;
	this.pxPrLetter = 15.6;
	this.left_x = (width / 2) - (this.pxPrLetter * this.rowWidth / 2);
	this.top_y = (height/2) - (this.txtLineCount * 28/2);
	this.levelMarkerBlinkOn = false;
	this.startButtonWhite = false;
	this.gameLevelBlinkTimer = setInterval(this.levelBlink, 300);
	this.startBlinkerTimer;
}

PreGamePanel.prototype.updatePosition = function(){	
	this.left_x = (width / 2) - (this.pxPrLetter * this.rowWidth / 2);
	this.top_y = (height/2) - (this.txtLineCount * 28/2);
};

PreGamePanel.prototype.levelBlink = function(){
	preGamePanel.levelMarkerBlinkOn = !(preGamePanel.levelMarkerBlinkOn);
	//alert("I blinkef: " + this.levelUnderScoreShow);
};

PreGamePanel.prototype.clicked = function(mouseX, mouseY){
	if(gameMode == 0){
		if(mouseY > this.top_y + (3.5 * 28) && mouseY < this.top_y + (5.5 * 28)){
			if(mouseX > this.left_x + (5 * this.pxPrLetter) && mouseX < this.left_x + (8 * this.pxPrLetter)){
				ball.hitPlayerAudio.play();
				this.unrenderLevelMarker();
				gameLevel = 1;
				this.renderLevelMarker()
			}
			else if(mouseX > this.left_x + (11 * this.pxPrLetter) && mouseX < this.left_x + (14 * this.pxPrLetter)){	
				ball.hitPlayerAudio.play();
				this.unrenderLevelMarker();
				gameLevel = 2;
				this.renderLevelMarker()
			}
			else if(mouseX > this.left_x + (17 * this.pxPrLetter) && mouseX < this.left_x + (20 * this.pxPrLetter)){
				ball.hitPlayerAudio.play();
				this.unrenderLevelMarker();
				gameLevel = 3;
				this.renderLevelMarker()
			}
		}
		if(mouseY > this.top_y + (6 *28) && mouseY < this.top_y + (8 *28) && 
			mouseX > this.left_x + (6 * this.pxPrLetter) && mouseX < this.left_x + (19 * this.pxPrLetter)){
			ball.hitPlayerAudio.play();
			ball.hitWallAudio.play();
			ball.outAudio.play();
			gameOverPanel.loserAudio.play();
			gameOverPanel.winnerAudio.play();
			this.startBlinkerTimer = setInterval(preGameStartBlinker, 100);
			setGameLevel();
			setTimeout(startGame, 2000);
		}
	}
};


PreGamePanel.prototype.render = function(){
	context.font = "26px Courier New";
	context.fillStyle = "grey";
	for(var i = 0; i < this.txtLineCount; i++){
		context.fillText(this.text[i], this.left_x, this.top_y + i * 28);	
	}
	if(this.levelMarkerBlinkOn == true) {
		this.renderLevelMarker();
	}
	else{
		this.unrenderLevelMarker();
	}

	this.renderStartButton();
};

PreGamePanel.prototype.unrender = function(){
	context.clearRect(this.left_x, this.top_y - 26, this.rowWidth * this.pxPrLetter, 28 * this.txtLineCount);
};

PreGamePanel.prototype.renderLevelMarker = function(){
	context.fillStyle = "grey";
	context.fillRect(this.left_x + (6 * gameLevel) * this.pxPrLetter, this.top_y + 5 * 28 + 6, this.pxPrLetter, 5);
};

PreGamePanel.prototype.unrenderLevelMarker = function(){
	context.clearRect(this.left_x + (6 * gameLevel) * this.pxPrLetter - 1, this.top_y + 5 * 28 + 6, this.pxPrLetter + 2, 5);
};

PreGamePanel.prototype.renderStartButton = function(){
	context.font = "26px Courier New";
	if(this.startButtonWhite){ context.fillStyle = "white"; }
	else{ context.fillStyle = "grey";  }
	context.fillText("[Start Game]", this.left_x + (6 * this.pxPrLetter), this.top_y + (7 * 28));
};


function GameOverPanel(){
	this.loserAudio = new Audio("audio/ponglooser.wav");
	this.winnerAudio = new Audio("audio/pongwinner.wav");
	this.loserAudio.preload = "auto";
	this.winnerAudio.preload = "auto";
	this.loserAudio.loop = false;
	this.winnerAudio.loop = false;
	this.text = ["*************************",
				"*                       *",
				"*                       *",		
				"*                       *",
				"*************************"];
	this.txtLineCount = 5;
	this.rowWidth = 25;
	this.pxPrLetter = 15.6;
	this.left_x = (width / 2) - (this.pxPrLetter * this.rowWidth / 2);
	this.top_y = (height/2) - (this.txtLineCount * 28/2);
}

GameOverPanel.prototype.updatePosition = function(){	
	this.left_x = (width / 2) - (this.pxPrLetter * this.rowWidth / 2);
	this.top_y = (height/2) - (this.txtLineCount * 28/2);
};


GameOverPanel.prototype.render = function(){
	var message;
	if(PlayerScore > ComputerScore){
		this.message = "YOU WON!"; 
		this.winnerAudio.play();
	}	 
	else{ 
		this.message = "YOU LOST!";
		this.loserAudio.play();
	} 
	context.font = "26px Courier New";
	context.fillStyle = "grey";
	for(var i = 0; i < this.txtLineCount; i++){
		context.fillText(this.text[i], this.left_x, this.top_y + i * 28);	
	}	
	context.fillText(this.message, this.left_x + (8 * this.pxPrLetter), this.top_y + (2 * 28));
};

GameOverPanel.prototype.unrender = function(){
	context.clearRect(this.left_x, this.top_y - 26, this.rowWidth * this.pxPrLetter, 28 * this.txtLineCount);
};







function Paddle( x, y, thickness, width ) {
    this.x = x;
    this.y = y;
	this.old_x = x;
	this.old_y = y;
    this.width = width;
    this.thickness = thickness;
    this.x_speed = 0;
    this.y_speed = 0;
}

Paddle.prototype.render = function() {
    context.fillStyle = fgColor;
    context.fillRect( this.x, this.y, this.thickness, this.width );
};

Paddle.prototype.unrender = function(){
	context.clearRect(this.old_x - 1, this.old_y - 1, this.thickness + 2, this.width + 2);	
};

function Player() {
    this.paddle = new Paddle( paddleDistanceFromEdge,
                             height/2 - paddleWidth/2,
                             paddleThickness,
                             paddleWidth );
    
}

function Computer() {
    this.paddle = new Paddle( width - paddleDistanceFromEdge - paddleThickness,
                             height/2 - paddleThickness/2,
                             paddleThickness,
                             paddleWidth);
}

Player.prototype.render = function() {
    this.paddle.render();
};

Player.prototype.unrender = function(){
	this.paddle.unrender();
};

Computer.prototype.render = function() {
    this.paddle.render();
};

Computer.prototype.unrender = function(){
	this.paddle.unrender();
};

function Ball( x, y ) {
    this.x = x;
    this.y = y;
	this.old_x = x;
	this.old_y = y;
    this.x_speed = ballPlayerToPlayerSpeed;
    this.y_speed = Math.floor(( Math.random() * 6) + 1 )-3;
    this. radius = ballRadius;
    
    this.hitPlayerAudio = new Audio("audio/pongplayeraudio.wav");
    this.hitWallAudio = new Audio("audio/pongwallaudio.wav");
    this.outAudio = new Audio("audio/pongoutnew.wav");
    this.hitPlayerAudio.preload = "auto";
    this.hitWallAudio.preload = "auto";
    this.outAudio.preload = "auto";

}

Ball.prototype.render = function() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
    context.fillStyle = fgColor;
    context.fill();
};

Ball.prototype.unrender = function(){
	//context.beginPath();
	//context.arc(this.old_x, this.old_y, this.radius, 2 * Math.PI, false);
	//context.fillStyle = bgColor;
	//context.fill();
	context.clearRect(this.old_x - this.radius - 1, this.old_y - this.radius - 1 , (this.radius * 2) + 2, (this.radius * 2) + 2);
}

// Updates the scoreboard of one player
var scoreUpdate = function( isLeftPlayer, score ){
    var LSDigitValue = 0;
    var MSDigitValue = 0;
    
    //Calculating the value of each digit
    if( score > 9){
        MSDigitValue = Math.floor( score/10 );
        LSDigitValue = score - (MSDigitValue * 10);
    }
    else{
        LSDigitValue = score;
    }
    
    //Updating the digit objects
    if( isLeftPlayer){
        leftLSScoreDigit.update( LSDigitValue );
        leftMSScoreDigit.update( MSDigitValue );
    }
    else{
        rightLSScoreDigit.update( LSDigitValue );
        rightMSScoreDigit.update( MSDigitValue );
    }
    
};

// Main rendering function for the scoreboard
var scoreRender = function( isLeftPlayer ){
    if( isLeftPlayer ){
        leftLSScoreDigit.render();
        leftMSScoreDigit.render();
    }
    else{
        rightLSScoreDigit.render();
        rightMSScoreDigit.render();
    }
};

var scoreUnrender = function(){
	leftLSScoreDigit.unrender();
	leftMSScoreDigit.unrender();
	rightLSScoreDigit.unrender();
	rightMSScoreDigit.unrender();
};

//Score digit object, represents one digit on the score board
function ScoreDigit( isLeftPlayer, isLSDigit ){
    this.value = 0;
    this.isLeftPlayer = isLeftPlayer;
    this.isLSDigit = isLSDigit;
    this.isVisible = false;
    this.x_lowerLeftCorner = 0;
    this.y_lowerLeftCorner = score_y;
    this.digitSize = scoreSize;
    this.digitBoldness = scoreSize / 5;
    this.segments = [];
    
    //Finding digit x-position
    if( this.isLeftPlayer ){
        if( !this.isLSDigit ){
            this.x_lowerLeftCorner = score_x;
        }
        else{
            this.x_lowerLeftCorner = score_x + scoreSize + ( scoreSize/5 );
        }
    }
    else if( !this.isLSDigit ){ //Right player
        this.x_lowerLeftCorner = width - (2 * scoreSize ) - (scoreSize/5 ) - score_x;
        
    }
    else{
        this.x_lowerLeftCorner = width - scoreSize - score_x;
    }
    
    
    
    /*
     SEGMENTS:
     
      __2_
    0|    |5
     |__3_|
    1|    |6
     |____|
        4
     
     */
    
    //Calculating the positions of the segments
    this.y_top = this.y_lowerLeftCorner - ( this.digitSize * 2);
    this.y_topOfMidBridge = this.y_lowerLeftCorner - this.digitSize - this.digitBoldness;
    this.y_topOfBottom = this.y_lowerLeftCorner - this.digitBoldness;
    this.x_rightPillar = this.x_lowerLeftCorner + this.digitSize - this.digitBoldness;
    
    
    //Inserting the segments into segments array
    this.segments[ 0 ] = new Segment( this.x_lowerLeftCorner, this.y_top, this.digitBoldness, this.digitSize );
    this.segments[ 1 ] = new Segment( this.x_lowerLeftCorner, this.y_topOfMidBridge,
                                     this.digitBoldness, this.digitSize + this.digitBoldness );
    this.segments[ 2 ] = new Segment( this.x_lowerLeftCorner, this.y_top, this.digitSize, this.digitBoldness );
    this.segments[ 3 ] = new Segment( this.x_lowerLeftCorner, this.y_topOfMidBridge, this.digitSize, this.digitBoldness);
    this.segments[ 4 ] = new Segment( this.x_lowerLeftCorner, this.y_topOfBottom, this.digitSize, this.digitBoldness );
    this.segments[ 5 ] = new Segment( this.x_rightPillar, this.y_top, this.digitBoldness, this.digitSize );
    this.segments[ 6 ] = new Segment( this.x_rightPillar, this.y_topOfMidBridge,
                                     this.digitBoldness, this.digitSize + this.digitBoldness );
        
}


ScoreDigit.prototype.update = function( value ){
    this.value = value;
    if( this.value > 0 ) this.isVisible = true; else this.isVisible = false;
    
    for( var i = 0; i < 7; i++){
        this.segments[ i ].isOn = false;
    }
    
    if( this.isLSDigit || this.value > 0 ){
        
        if( this.value == 0 || this.value == 4 || this.value == 5 || this.value == 6 || this.value == 8 || this.value == 9 ){
            this.segments[ 0 ].isOn = true;
        }
        if( this.value == 0 || this.value == 2 || this.value == 6 || this.value == 8 ){
            this.segments[ 1 ].isOn = true;
        }
        if( this.value != 1 && this.value != 4 ){
            this.segments[ 2 ].isOn = true;
        }
        if( this.value > 1 && this.value != 7 ){
            this.segments[ 3 ].isOn = true;
        }
        if( this.value != 1 && this.value != 4 && this.value != 7 ){
            this.segments[ 4 ].isOn = true;
        }
        if( this.value != 5 && this.value != 6 ){
            this.segments[ 5 ].isOn = true;
        }
        if( this.value != 2 ){
            this.segments[ 6 ].isOn = true;
        }
        
    
    }
    
    
    
    
};



ScoreDigit.prototype.render = function(){
    
    for( i = 0; i < this.segments.length; i++ ){
        this.segments[ i ].render();
    }
};

ScoreDigit.prototype.unrender = function(){
	context.clearRect(this.x_lowerLeftCorner - 1, this.y_top - 1, this.digitSize + 2, (this.digitSize * 2) + 2);  
};

//This function is called when resizing the output window
ScoreDigit.prototype.setSizeAndPosition = function(){
    this.y_lowerLeftCorner = score_y;
    this.digitSize = scoreSize;
    this.digitBoldness = scoreSize / 5;
    
    
    //Finding digit x-position
    if( this.isLeftPlayer ){
        if( !this.isLSDigit ){
            this.x_lowerLeftCorner = score_x;
        }
        else{
            this.x_lowerLeftCorner = score_x + scoreSize + ( scoreSize/5 );
        }
    }
    else if( !this.isLSDigit ){ //Right player
        this.x_lowerLeftCorner = width - (2 * scoreSize ) - (scoreSize/5 ) - score_x;
        
    }
    else{
        this.x_lowerLeftCorner = width - scoreSize - score_x;
    }
    
    
    //Calculating the positions of the segments
    this.y_top = this.y_lowerLeftCorner - ( this.digitSize * 2);
    this.y_topOfMidBridge = this.y_lowerLeftCorner - this.digitSize - this.digitBoldness;
    this.y_topOfBottom = this.y_lowerLeftCorner - this.digitBoldness;
    this.x_rightPillar = this.x_lowerLeftCorner + this.digitSize - this.digitBoldness;
    
    //Changing the positions of the segments in the Array
    this.segments[ 0 ].setSizeAndPosition(
                                          this.x_lowerLeftCorner,
                                          this.y_top,
                                          this.digitBoldness,
                                          this.digitSize );
    
    this.segments[ 1 ].setSizeAndPosition( this.x_lowerLeftCorner,
                                          this.y_topOfMidBridge,
                                          this.digitBoldness,
                                          this.digitSize + this. digitBoldness );
    
    this.segments[ 2 ].setSizeAndPosition( this.x_lowerLeftCorner,
                                          this.y_top,
                                          this.digitSize,
                                          this.digitBoldness );
    
    this.segments[ 3 ].setSizeAndPosition( this.x_lowerLeftCorner,
                                          this.y_topOfMidBridge,
                                          this.digitSize,
                                          this.digitBoldness );
    
    this.segments[ 4 ].setSizeAndPosition( this.x_lowerLeftCorner,
                                          this.y_topOfBottom,
                                          this.digitSize,
                                          this.digitBoldness );
    
    this.segments[ 5 ].setSizeAndPosition( this.x_rightPillar,
                                          this.y_top,
                                          this.digitBoldness,
                                          this.digitSize );
    
    this.segments[ 6 ].setSizeAndPosition( this.x_rightPillar,
                                          this.y_topOfMidBridge,
                                          this.digitBoldness,
                                          this.digitSize + this.digitBoldness );
    
    
    
};



//Segment object, represents one segment of the score digit
function Segment( segment_x, segment_y, segment_width, segment_height ){
    this.x = segment_x;
    this.y = segment_y;
    this.width = segment_width;
    this.height = segment_height;
    this.isOn = false;
}

Segment.prototype.update = function( isOn ){
    this.isOn = isOn;
};

Segment.prototype.render = function(){
    if( this.isOn ){
        context.fillStyle = scoreColor;
        context.fillRect( this.x, this.y, this.width, this.height );
    }
};

Segment.prototype.setSizeAndPosition =function( segment_x, segment_y, segment_width, segment_height ){
    this.x = segment_x;
    this.y = segment_y;
    this.width = segment_width;
    this.height = segment_height;
    
};

var Net = function(){
	this.netWidth = 2;
	this.segmentLength = 10;
	this.x_pos = (width / 2) - (this.netWidth / 2);
	
};

Net.prototype.render = function(){
	context.fillStyle = fgColor;
	for ( var y_net = 0; (y_net + 5) < height; y_net+=20 ){
	    context.fillRect(this.x_pos, y_net, 2, 10 );
	}
};

Net.prototype.unrender = function(){
	context.clearRect(this.x_pos - 1, 0, this.netWidth + 2, height);
}

Net.prototype.update = function(){	
	this.x_pos = (width / 2) - (this.netWidth / 2);
}

