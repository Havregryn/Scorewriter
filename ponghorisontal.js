
/* Pong Javascript*/
/* Silvertweaks 2017 */


var animate = window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationframe ||
function(callback) { window.setTimeout( callback, 1000/60 )};

var canvas = document.createElement( 'canvas' );

//Game settings
var width;
var height;
var paddleWidth=40;
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


var PlayerScore = 0;
var ComputerScore = 0;

var bgColor = "#000000";
var fgColor = "#FFFFFF";
var scoreColor = "999999";
//var score_x = Math.round(width/6 ); //Distance left edge of canvas to left edge of leftmost digit
//var score_y = Math.round( height/4 ); //Distance top of canvas to lower edge of digits
//var scoreSize = Math.round( height/13 );
var score_x;
var score_y;
var scoreSize;


//canvas.width = width;
//canvas.height = height;
var context = canvas.getContext( '2d' );
var keysDown = {};


var scoreFont=[];



//var player = new Player();
//var computer = new Computer();
//var ball = new Ball( width/2, height/2 );
var player;
var computer;
var ball;

//var leftLSScoreDigit = new ScoreDigit( true, true );
//var leftMSScoreDigit = new ScoreDigit( true, false );
//var rightLSScoreDigit = new ScoreDigit( false, true );
//var rightMSScoreDigit = new ScoreDigit( false, false );

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
            //alert( hasPhysicalKeyboard );
            if( deviceAngleBias == 0) {
                deviceAngleBias = - (tilt/2);
                //alert( deviceAngleBias );
            }
            accelerometerTilt = tilt + deviceAngleBias;
            //alert( event.accelerationIncludingGravity.x );
           
        }
        
        
    };
    
    
    
    viewResize();
    
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

var mouseClickedOnCanvas = function(){
    ball.hitPlayerAudio.play();
    ball.hitWallAudio.play();
    ball.outAudio.play();
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
    ballPlayerToPlayerSpeed = Math.round( width/150 );
    if( ballPlayerToPlayerSpeed < 4 ) ballPlayerToPlayerSpeed = 4;
    ballRadius = 5;
    paddleSpeed = Math.round(height/60);
    MaxAutoPaddleSpeed = height/120;
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
    
    
    
};


var step = function () {
    update();
    render();
    animate(step);
};

var update = function() {
    player.update();
    computer.update( ball );
    ball.update( player.paddle, computer.paddle );
    scoreUpdate( true, PlayerScore );
    scoreUpdate( false, ComputerScore );
};

Player.prototype.update = function() {
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
    var y_pos = ball.y;
    var diff = -((this.paddle.y + (this.paddle.width / 2)) - y_pos);
    if( diff < -MaxAutoPaddleSpeed ) { diff = -MaxAutoPaddleSpeed   }
    else if( diff > MaxAutoPaddleSpeed ){ diff = MaxAutoPaddleSpeed };
    
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
        //this.y_speed = 0;
        this.x_speed = (Math.round(Math.random()) - 0.5 ) * 2 * ballPlayerToPlayerSpeed;
        this.x = width/2;
        this.y = height/2;
        
        
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



var render = function() {
    context.fillStyle = bgColor;
    context.fillRect( 0, 0, width, height );
    //Drawing the net
    context.fillStyle = fgColor;
    for ( var y_net = 0; (y_net + 5) < height; y_net+=20 ){
        context.fillRect( (width/2)-2, y_net, 2, 10 );
    }
    
    
    scoreRender( true );
    scoreRender( false );
    player.render();
    computer.render();
    ball.render();
    
};

function Paddle( x, y, thickness, width ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.thickness = thickness;
    this.x_speed = 0;
    this.y_speed = 0;
}

Paddle.prototype.render = function() {
    context.fillStyle = fgColor;
    context.fillRect( this.x, this.y, this.thickness, this.width );
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

Computer.prototype.render = function() {
    this.paddle.render();
};

function Ball( x, y ) {
    this.x = x;
    this.y = y;
    this.x_speed = ballPlayerToPlayerSpeed;
    this.y_speed = Math.floor(( Math.random() * 6) + 1 )-3;
    this. radius = ballRadius;
    
    this.hitPlayerAudio = new Audio("audio/pongplayeraudio.wav");
    this.hitWallAudio = new Audio("audio/pongwallaudio.wav");
    this.outAudio = new Audio("audio/pongoutaudio.wav");
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















