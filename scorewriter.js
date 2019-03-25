/* 
 * Scorewriter
 * Copyright Hallgrim Bratberg 2019
 * */


// Globals:
var canvas;
var context;
var width;
var height;
var spacingPx = 110; // The main zoom level: Spacing between lines in a staff
var padding = 0.3; // The minimum padding between items, as a fraction of spacing.
var emptyBarMinSpace = 16; // Releated to spacing
var staffs = [];
var musicSystem; // The main score, all staffs combined
var imagesCount = 100; // The number of images
var itemImages = [imagesCount]; // All images of the notation items.
var itemImagesInfo = [imagesCount]; // Scaling data etc.
var staffMeasures = [];

window.onload = function(){
	canvas = document.createElement( 'canvas' );
	context = canvas.getContext('2d');
	document.body.appendChild(canvas);
		
	loadImgs();

	var i;
	for(i = 0; i < 8; i++){
		staffMeasures[i] = new Staff_Measure(4,4,4, 50);
	}
	staffMeasures[0].showInitClef = true;
	staffMeasures[0].showInitKey = false;
	staffMeasures[0].showInitTimeSig = true;

	var note = new Note(4, 6, 0, 1, 0);
	staffMeasures[0].addMusic(note, 1, 0, 0);	
	staffMeasures[1].addMusic(new Note(4, 14, 0, 4, 0), 1, 0, 0);


};


var loadImgs = function(){
	var i;
	for(i = 0; i < imagesCount; i++){
		itemImages[i] = new Image();
		itemImagesInfo[i] = new ItemImgInfo(0, 0, 0, 0);
		itemImagesInfo[i].isLoaded = true;
	}
	// Loading the images:
	setImage(0, "images/BlackNotehead.svg", new ItemImgInfo(1, 1.15, 0, 0));
	itemImagesInfo[0].param1 = 0.025; // stemX left offset from note leftX: times spacingPx
	itemImagesInfo[0].param2 = 1; // stemX right offset from note leftX
	itemImagesInfo[0].param3 = 0.6; // stemY left offset from note upperY
	itemImagesInfo[0].param4 = 0; // stemY right offset from note upperY
	setImage(1, "images/WhiteNotehead.svg", new ItemImgInfo(1, 1.15, 0, 0));
	itemImagesInfo[1].param1 = 0.025; // stemX left offset from note leftX
	itemImagesInfo[1].param2 = 1.13; // stemX right offset from note leftX
	itemImagesInfo[1].param3 = 0.6; // stemY left offset from note upperY
	itemImagesInfo[1].param4 = 0.35; // stemY right offset from note upperY
	setImage(2, "images/WholeNote.svg", new ItemImgInfo(1,2, 0, 0));
	setImage(20, "images/Sharp.svg", new ItemImgInfo(2.8, 0.3, 0, 0.6));
	setImage(21, "images/Flat.svg", new ItemImgInfo(2.6, 0.3, 0, 0.2));
	setImage(50, "images/GClef.svg", new ItemImgInfo(8, 0.37, 0, -2));
	setImage(51, "images/FClef.svg", new ItemImgInfo(3.2, 0.9, 0, 0));
	itemImagesInfo[51].param1 = -21; // Offset of steps  compared to g clef 
	itemImagesInfo[51].param2 = -2; // Offset of key notation
	waitForLoaded();

};


var waitForLoaded = function(){
	var allImgLoaded = true;
	for(i = 0; i < imagesCount; i++){
		if(!itemImagesInfo[i].isLoaded){
			allImgLoaded = false;
		}
	}
	var retValue;
	if(!allImgLoaded){ retValue = window.setTimeout(waitForLoaded, 100); }
	else{ viewResize(); }
};


var setImage = function( index, fileName, imgInfo){
	itemImagesInfo[index] = imgInfo;
	itemImages[index].onload = function(){ 
		itemImagesInfo[index].isLoaded = true; 
	}
	itemImages[index].src = fileName;
};

window.onresize = function(event){
	viewResize();
};	

var viewResize = function(){	
	width = window.innerWidth - 20;
	height = window.innerHeight - 20;
	canvas.width = width;
	canvas.height = height;
	render();
};

var render = function(){

	context.strokeStyle = "black";
	context.font = "50px Baskerville";
	context.textAlign = "center";
	context.fillText("My Kind of Music", width/2, height / 7);

	var i, currentX = 50, length;
	for(i = 0; i < staffMeasures.length; i++){
		measure = staffMeasures[i];
		measure.buildGraphic();
		var inner = measure.innerWidth;
		if( inner < emptyBarMinSpace){ inner = emptyBarMinSpace;}
		length = spacingPx * (measure.leftMarginWidth + inner + measure.rightMarginWidth);
		staffMeasures[i].render(currentX, 200, length);
		currentX += length;
	}
};

var renderImage = function(imageNr, leftX, upperY){
	var info = itemImagesInfo[imageNr];
	context.drawImage(itemImages[imageNr], 
					  leftX +(spacingPx * info.xBias), 
					  upperY + (spacingPx * info.yBias), 
					  info.width * spacingPx , 
					  spacingPx * info.scale);
};

// Staff types: 1: regular 5 lines.
var Staff = function(type){
	this.type = type;
	this.measures = [];
};

Staff.prototype.render = function(leftX, rightX, upperY){
	context.strokeStyle = "black";
	context.lineWidth = "1";
	var lineNr;
	var lineX;
	for(lineNr = 0; lineNr < 5; lineNr++){
		context.beginPath();
		context.moveTo(leftX, upperY + (lineNr * spacingPx));
		context.lineTo(rightX, upperY + (lineNr * spacingPx));
		context.stroke();
	}
};


var Staff_Measure = function(topMeter, bottomMeter, key, clefNr){
	this.topMeter = topMeter;
	this.bottomMeter = bottomMeter;
	this.key = key;// in fifths from c
	this.clefNr = clefNr; // The initial clef
	this.pitchOffset = 0;
	this.keyOffset = 0;
	this.showInitClef = false;
	this.showInitKey = false;
	this.showInitTimeSig =false;
	// items stores the music items. Everything that is neccessary for the music to be played.
	this.items = [];
	// graph_items stores all graphical items in the bar and their positioning info:
	this.graph_items = [];
	this.noteItemsCount = 0; // Notes, accidentals demanding horisontal space
	this.leftMarginWidth = 0; 
	this.rightMarginWidth = 0;
	this.innerWidth = 0;
};


// Subdivpos:: 12 = 1st subdiv, 2.sub-sub-div
// subDivPosLength = No of digits in SubDivPos
Staff_Measure.prototype.addMusic = function(note, beatNr, subDivPos, subDivPosLength){

};




Staff_Measure.prototype.addToNoteItemsCount = function(count){
	this.noteItemsCount += count;
};

Staff_Measure.prototype.buildGraphic = function(){
	
	this.pitchOffset = itemImagesInfo[this.clefNr].param1;
	this.keyOffset = itemImagesInfo[this.clefNr].param2;
	this.leftMarginWidth = 0;
	if(this.showInitClef){
		this.graph_items.push(new GraphicItem(this.clefNr, 1, padding, 0));
		this.leftMarginWidth += padding + itemImagesInfo[this.clefNr].width;
	}

	
	//key:
	if(this.showInitKey){
		var clefOffset = - itemImagesInfo[this.clefNr].param2 * 0.5;
		this.leftMarginWidth += padding;
		var keyX = this.leftMarginWidth;
		if(this.key > 0){
			// key is sharp:
			var i, tmpY;
			var sharpWidth = itemImagesInfo[20].width;
			for(i = 0; i < this.key; i++){
				if(i % 2 == 0){
					tmpY =  - 2 - (i * 0.25);
					if(i > 3){ tmpY += 3.5; }
					this.graph_items.push(new GraphicItem(20, 1, keyX + (sharpWidth * i) + (padding * i), tmpY + clefOffset));
					this.leftMarginWidth += (sharpWidth + padding);
				}
				else{ 
					this.graph_items.push(new GraphicItem(20, 1,  keyX + (sharpWidth * i) + (padding * i), -0.25 - (i * 0.25)+ clefOffset ));	
					this.leftMarginWidth += (sharpWidth + padding);
				}
			}
		}
		else{
			// key is flat:
			var i;
			var flatWidth = itemImagesInfo[21].width;
			for(i = 0; i < (-1 * this.key); i++){
				if(i % 2 == 0){
					this.graph_items.push(new GraphicItem(21, 1,  keyX + (flatWidth * i) + (padding * i), i * 0.25 + clefOffset ));	
					this.leftMarginWidth += (flatWidth + padding);
				}
				else{	
					this.graph_items.push(new GraphicItem(21, 1, keyX + (flatWidth * i) + (padding *i), -1.75 + (i * 0.25) + clefOffset ));	
					this.leftMarginWidth += (flatWidth + padding);
				}

			}
		}

	}
	
	if(this.showInitTimeSig){
		this.graph_items.push(new TimeSignature(this.topMeter, this.bottomMeter, 1, 
							  					this.leftMarginWidth + padding * 3, 0));
		this.leftMarginWidth += padding * 7;
	}

	//Notes


	
	
	


};

// leftX,topX indicates the point where the start of the upper staffline is.
Staff_Measure.prototype.render = function(leftX, topY, width){



	// lines:
	context.strokeStyle = "black";
	lineW = spacingPx/50;
	if(lineW < 1){lineW = 1};
	context.lineWidth = lineW;
	var lineNr;
	for(lineNr = 0; lineNr < 5; lineNr++){
		context.beginPath();
		context.moveTo(leftX, topY + (lineNr * spacingPx));
		context.lineTo(leftX + width, topY + (lineNr * spacingPx));
		context.stroke();
	}
	//barline:
	context.beginPath();
	context.moveTo(leftX + width, topY);
	context.lineTo(leftX + width, topY + (4 * spacingPx));
	context.stroke();

	// rendering of items in graph_items
	var i, grItem;
	for(i = 0; i < this.graph_items.length; i++){
		grItem = this.graph_items[i];
		if(grItem.type == "image"){
			if( grItem.posRef == 0){}
			else{
				renderImage(grItem.imgNr, leftX + grItem.leftX * spacingPx, topY + grItem.upperY * spacingPx);
			}
		}
		else if(grItem.type == "time signature"){
			var tsX, tsUppperNrY,tsLowerNrY;
			var fontSizePx = spacingPx * 2.4;
			if( grItem.posRef == 0 ){}
			else{
				tsX = leftX + grItem.leftX * spacingPx;
				tsUpperNrY = topY + grItem.upperY * spacingPx + fontSizePx;
				context.font = "bold " + fontSizePx + "px Times New Roman";
				context.textBaseline = "bottom";
				context.fillText(grItem.topNr,tsX, tsUpperNrY);
				tsLowerNrY = tsUpperNrY - fontSizePx * 0.3;
				context.textBaseline = "top";
				context.fillText(grItem.botNr, tsX, tsLowerNrY);
				this.leftMarginWidth += (2 * padding + (0.5 *fontSizePx / spacingPx)); 
			}
		}
	}
	renderImage(1, leftX + 500, topY);
	var info = itemImagesInfo[1];
	var strW = spacingPx/30;
	if(strW < 1){ strW = 1; };
	context.lineWidth = strW;;
	context.beginPath();
	context.moveTo(leftX + 500 + info.param2 * spacingPx, topY + (info.param4 * spacingPx));
	context.lineTo(leftX + 500 + info.param2 * spacingPx, topY - (3.5 * spacingPx) );
	context.stroke();

};

var ItemImgInfo = function(scale, whFactor, xBias, yBias){
	this.scale = scale;
	// Width based on height:
	this.whFactor = whFactor;
	this.xBias = xBias;
	this.yBias = yBias;
	this.width =  scale * whFactor;
	this.isLoaded = false;
	this.param1 = 0;
	this.param2 = 0;
	this.param3 = 0;
	this.param4 = 0;
};

var GraphicItem = function(imgNr, posRef, leftX, upperY){
	// Represents a graphic item in a measure.
	// posRef = 0: Items x position folllows the notes.
	// posRef = 1. follows the left barline. 2= right barline.
	// Note placement is 0 at the left and 100 at the right. 
	this.imgNr = imgNr;
	this.posRef = posRef;
	this.leftX = leftX;
	this.upperY = upperY;
	this.type = "image";
};

var TimeSignature = function(topNr, botNr, posRef, leftX, upperY){
	this.topNr = topNr;
	this.botNr = botNr;
	this.posRef = posRef;
	this.leftX = leftX;
	this.upperY = upperY;
	this.type = "time signature";
};


var Note = function(octave, step, accidental, value, dotsCount){
	this.octave = octave; // 4 = Middle octave
	this.step = step; // 1 = c
	this.accidental = accidental; // 0 = natural
	this.value = value; // 1 = whole, 2 = half, 4 = quarter etc. 
	this.dotsCount = dotsCount; 
	this.leftX = 0;
	this.upperY = 4.5; // C4 position with a G clef
	this.type = "note";
	this.imgNr;
	this.forcedStemDir = 0;
	this.stemDir;
	this.calcUpperY();
	this.setNoteImg();
	this.setStem();
};

Note.prototype.calcUpperY = function(){ 	
	//Calculating the upperY based on the pitch:
	// Offset from G clef not yet added
	this.upperY -= ((this.octave - 4) * 3.5);
	this.upperY -= (this.step-1) * 0.5;
};

Note.prototype.setNoteImg = function(){
	if(this.value == 2){this.imgNr = 1; }
	else if(this.value > 2){ this.imgNr = 0; }
};

Note.prototype.setStem = function(){
	if(this.upperY > -2){ 
		this.stemDir = 1; 
		this.stemX = this.leftX;
	}
	else{
		this.stemDir = -1; 
		this.stemX = this.leftX + itemImagesInfo[this.imgNr].width;
	}
	this.stemY = this.upperY + 0.5;
};

