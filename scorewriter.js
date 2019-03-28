/* 
 * Scorewriter
 * Copyright Hallgrim Bratberg 2019
 * */


// Globals:
var canvas;
var context;
var width;
var height;
var Q_NOTE = 30240; // No of ticks in a quarter note
var spacingPx =20; // The main zoom level: Spacing between lines in a staff
var padding = 0.3; // The minimum padding between items, times  spacingPx.
var emptyBarMinSpace = 16; // Releated to spacing
var staffs = [];
var musicSystem; // The main score, all staffs combined
var imagesCount = 100; // The number of images
var itemImages = [imagesCount]; // All images of the notation items.
var itemImagesInfo = [imagesCount]; // Scaling data etc.
var staffMeasures = [];

// Table setting the Y axis offsets of the noteNr´s in a GClef.
//                      C   C#    D    Eb   E    F     F#    G   G#     A     Bb     B
var NOTENR_Y_OFFSET = [ 1, 0.75, 0.5, 0.25, 0, -0.5, -0.75, -1, -1.25, -1.5, -1.75, -2];

//                        Cb                Gb,                  Db                 Ab
var KEYS_Y_OFFSET = [[4, -0.5, 5, -0.75], [11, -2.5, 0, 0.75 ],[6, -1, 7, -1.25],[1, 0.5, 2, 0.25],
//                        Eb                Bb                 F                 C
					 [8, -1.5, 9, -1.75],[3, 0, 4, -0.25],[10, -2, 11, -2.25],[-1, 0, -1, 0  ],
//						  G					D				A 					E
					  [5, -0.25, 6, -0.5],[0, 1.25, 1, 1],[7, -0.75, 8, -1],[2, 0.75, 3, 0.5 ],
//						  B					F#				 C#
					  [9, -1.25, 10, -1.5],[4, 0.25, 5, 0],[11, -1.75, 0, 1.5]];

var SCALE_FROM_CHROM = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6]; 

window.onload = function(){
	canvas = document.createElement( 'canvas' );
	context = canvas.getContext('2d');
	document.body.appendChild(canvas);
		
	loadImgs();

	var i;
	for(i = 0; i < 1; i++){
		staffMeasures[i] = new Staff_Measure(4,4,2, 50);
	}
	staffMeasures[0].showInitClef = true;
	staffMeasures[0].showInitKey = true;
	staffMeasures[0].showInitTimeSig = true;

	staffMeasures[0].addMusic(new NoteRest(true, 59, 0, 0, Q_NOTE));
	staffMeasures[0].addMusic(new NoteRest(true, 62, 0, Q_NOTE, Q_NOTE));		
	staffMeasures[0].addMusic(new NoteRest(true, 63, 0, Q_NOTE*2, Q_NOTE));
	staffMeasures[0].addMusic(new NoteRest(true, 65, 0, Q_NOTE*3, Q_NOTE));	
/*
	staffMeasures[1].addMusic(new NoteRest(true, 67, 0, Q_NOTE));
	staffMeasures[1].addMusic(new NoteRest(true, 69, Q_NOTE , Q_NOTE));		
	staffMeasures[1].addMusic(new NoteRest(true, 71, Q_NOTE*2, Q_NOTE));
	staffMeasures[1].addMusic(new NoteRest(true, 72, Q_NOTE * 3 , Q_NOTE));	

	staffMeasures[2].addMusic(new NoteRest(true, 74, 0, Q_NOTE));
	staffMeasures[2].addMusic(new NoteRest(true, 76, Q_NOTE , Q_NOTE));		
	staffMeasures[2].addMusic(new NoteRest(true, 77, Q_NOTE*2, Q_NOTE));
	staffMeasures[2].addMusic(new NoteRest(true, 79, Q_NOTE * 3 , Q_NOTE));	
	

	staffMeasures[3].addMusic(new NoteRest(true, 81, 0, Q_NOTE));
	staffMeasures[3].addMusic(new NoteRest(true, 83, Q_NOTE , Q_NOTE));		
	staffMeasures[3].addMusic(new NoteRest(true, 84, Q_NOTE*2, Q_NOTE));
	staffMeasures[3].addMusic(new NoteRest(true, 86, Q_NOTE *3  , Q_NOTE));	
	

	staffMeasures[4].addMusic(new NoteRest(true, 88, 0, Q_NOTE * 4));	
*/
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
	setImage(2, "images/WholeNote.svg", new ItemImgInfo(1,1.7, 0, 0));
	setImage(20, "images/Sharp.svg", new ItemImgInfo(2.8, 0.3, 0, -0.8));	
	itemImagesInfo[20].param1 = 1.1; // Distance from Note
	setImage(21, "images/Flat.svg", new ItemImgInfo(2.6, 0.4, 0, -1.3));
	itemImagesInfo[21].param1 = 1.1; // Distance from Note
	setImage(22, "images/natural.svg", new ItemImgInfo(3.52, 0.25, 0, -1.25));
	itemImagesInfo[22].param1 = 1.1; // Distance from Note
	setImage(50, "images/GClef.svg", new ItemImgInfo(8, 0.37, 0, -2));	
	itemImagesInfo[50].param1 = 0; // Y-pos offset compared to G clef
	itemImagesInfo[50].param2 = 0; // Offset of key notation
	setImage(51, "images/FClef.svg", new ItemImgInfo(3.2, 0.9, 0, 0));
	itemImagesInfo[51].param1 = -6; // Y_pos offset compared to G Clef
	itemImagesInfo[51].param2 = -2; // Offset of key notation
	setImage(52, "images/CClef.svg", new ItemImgInfo(4, 1, 0, 0));
	itemImagesInfo[52].param1 = -3; // Y_pos offset compared to G Clef
	itemImagesInfo[52].param2 = -1; // Offset of key notation


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
	this.totalTicks = (4 / bottomMeter) * Q_NOTE * topMeter;  
	this.key = key;// in fifths from c
	this.clefNr = clefNr; // The initial clef
	this.pitchOffset = 0;
	this.keyOffset = 0;
	this.showInitClef = false;
	this.showInitKey = false;
	this.showInitTimeSig =false;
	// musicItems stores the music items which is placed in the music grid.
	this.musicItems = [];
	this.shortestInBarTicks = 0;
	// graph_items stores all graphical items in the bar and their positioning info:
	this.graph_items = [];
	this.leftMarginWidth = 0; 
	this.rightMarginWidth = 0;
	this.innerWidth = 0;
	this.noteToYPos = [12];
	this.cScaleSteps = [7]; // index 0 = C. The chrom nr of each c scale step with acc.
	this.looseAccidentals = [];

	this.updateCScaleSteps();
	this.updateNoteToYPosTable();
};

Staff_Measure.prototype.updateCScaleSteps = function(){
	this.cScaleSteps = [0, 2, 4, 5, 7, 9, 11];
	if(this.key > 0){
		for(i = 0; i < this.key; i++){
			this.cScaleSteps[(((i + 1) * 4) - 1) % 7] += 1;
		}
	}
	else if(this.key < 0){// 064, skal være 0 6 2
		for(i = 0; i < -this.key; i++){
			this.cScaleSteps[(((i + 1) * 3) + 3) % 7] -= 1;
		}
	}
};

Staff_Measure.prototype.updateNoteToYPosTable = function(){
	var i;
	for(i = 0; i < 12; i++){
		this.noteToYPos[i] = NOTENR_Y_OFFSET[i];
	}
	if(this.key > 0){
		for(i = 7; i < this.key + 8; i++){
			var keyOffsets = KEYS_Y_OFFSET[i];
			this.noteToYPos[keyOffsets[0]] = keyOffsets[1];
			this.noteToYPos[keyOffsets[2]] = keyOffsets[3];
		}
	}
	else if(this.key < 0){ 	
		for(i = 7; i > 6 + this.key; i--){
			var keyOffsets = KEYS_Y_OFFSET[i];
			this.noteToYPos[keyOffsets[0]] = keyOffsets[1];
			this.noteToYPos[keyOffsets[2]] = keyOffsets[3];
		}
	}

};


// Inserting a note or rest. ticksFromStart = ticks from start of bar.
// var NoteRest = function(isNote, noteNr, ticksPos, ticksLength){
Staff_Measure.prototype.addMusic = function(noteRest){
	var i;
	if(this.musicItems.length == 0 || noteRest.ticksPos > this.musicItems[this.musicItems.length-1].ticksPos){
		this.musicItems.push(noteRest);
	}
	for(i = 0; i < this.musicItems.lengsth; i++){
		if(noteRest.ticksPos <=  this.musicItems[i].ticksPos){
			this.noteItems.splice(i, 0, noteRest);
		}
	}
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
					tmpY =  -0.5 - (i * 0.25);
					if(i > 3){ tmpY += 3.5; }
					this.graph_items.push(new GraphicItem(20, 1, keyX + (sharpWidth * i) + (padding * i), tmpY + clefOffset));
					this.leftMarginWidth += (sharpWidth + padding);
				}
				else{ 
					this.graph_items.push(new GraphicItem(20, 1,  keyX + (sharpWidth * i) + (padding * i), 1.25 - (i * 0.25)+ clefOffset ));	
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
					this.graph_items.push(new GraphicItem(21, 1,  keyX + (flatWidth * i) + (0.5 * padding * i),
							                              i * 0.25 + clefOffset + 1.5 ));	
					this.leftMarginWidth += (flatWidth + padding * 0.5);
				}
				else{	
					this.graph_items.push(new GraphicItem(21, 1, keyX + (flatWidth * i) + (0.5 *padding *i), -0.25 + (i * 0.25) + clefOffset ));	
					this.leftMarginWidth += (flatWidth + padding * 0.5);
				}

			}
		}

	}
	
	if(this.showInitTimeSig){
		this.graph_items.push(new TimeSignature(this.topMeter, this.bottomMeter, 1, 
							  					this.leftMarginWidth + padding * 3, 0));
	}

	//Notes


	
	
	


};

// leftX,topX indicates the point where the start of the upper staffline is.
Staff_Measure.prototype.render = function(leftX, topY, width){



	// lines:
	context.strokeStyle = "black";
	var lineW = spacingPx/50;
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

	// NoteRest drawing
	var innerLeftX = leftX + this.leftMarginWidth * spacingPx + spacingPx;
	var innerRightX = leftX + width - this.rightMarginWidth * spacingPx - padding * spacingPx - spacingPx;
	var innerWidth = innerRightX - innerLeftX;


	for(itemIx = 0; itemIx < this.musicItems.length; itemIx++){
		var noteRest = this.musicItems[itemIx];
		var notePosX = innerLeftX + (innerWidth / this.totalTicks) * noteRest.ticksPos; 
		// Must calculate Ypos based on pitch here!!
		// Depends on clef, key, signs in the bar..
		var noteOct = Math.floor(noteRest.noteNr / 12); //Middle octave is 5.
		var noteStep = noteRest.noteNr - (noteOct * 12); // C = 0..B = 11
		var noteScaleStep = SCALE_FROM_CHROM[noteStep];
		var notePosY = topY + (this.noteToYPos[noteStep] * spacingPx);
		

		// Calculate accidental
		var noteIsInKey = false;
		for(i = 0; i < 7; i++){
			if(noteStep == this.cScaleSteps[i]){
				noteIsInKey = true;
				break;
			}	
		}
		if(!noteIsInKey){
			// Note is not in key, accidental must be set:
			if(noteRest.blwabv == 0){
				if(noteIsInCScale(noteStep)){
					// Note can be set to natural:
					noteRest.shownAcc = 0;
					if(this.key > 0){ notePosY -= 0.25 * spacingPx; }
					else{ notePosY += 0.25 * spacingPx; }
				}
				else if(this.key > 0){
					noteRest.shownAcc = 1;
					notePosY += 0.25 * spacingPx;
				}
				else{
					noteRest.shownAcc = -1;
					notePosY -= 0.25 * spacingPx;
				}
			}

		}


		notePosY -= ((noteOct - 6) * 3.5 * spacingPx);
		notePosY += itemImagesInfo[this.clefNr].param1 * spacingPx;

		if(noteRest.isNote){
			//Drawing ledger lines:
			var staffLowY = topY + 4 * spacingPx;
			var ledgeDelta = 1.35;
			if(noteRest.ticksLength <= Q_NOTE * 4){ ledgeDelta = 1.73; }
			if(notePosY > staffLowY){
				var noOfLines = 0.5 + ((notePosY - staffLowY) / spacingPx);
				context.lineWidth = lineW;
				context.beginPath();
				for(i = 1; i <= noOfLines; i++){
					context.moveTo(notePosX - spacingPx * 0.15, staffLowY + i * spacingPx);
					context.lineTo(notePosX + spacingPx * ledgeDelta, staffLowY + i * spacingPx);	
				}
				context.stroke();
			}
			else if(notePosY < topY - spacingPx){	
				var noOfLines = ((topY - notePosY) / spacingPx) - 0.5;
				context.lineWidth = lineW;
				context.beginPath();
				for(i = 1; i <= noOfLines; i++){
					context.moveTo(notePosX - spacingPx * 0.15, topY - i * spacingPx);
					context.lineTo(notePosX + spacingPx * ledgeDelta, topY - i * spacingPx);	
				}
				context.stroke();
			}
			renderImage(noteRest.imgNr, notePosX, notePosY);
			// Drawing stem:
			if(noteRest.ticksLength < Q_NOTE * 4){
				var info = itemImagesInfo[1];
				var stemW = spacingPx/30;
				var stemLength = 3 * spacingPx;
				if(notePosY > staffLowY + spacingPx){
					stemLength = notePosY - staffLowY  +  2 * spacingPx;
				}
				else if(notePosY < topY - spacingPx){
					stemLength = topY + spacingPx - notePosY;
				}

				if(stemW < 1){ stemW = 1; };
				context.lineWidth = stemW;;
				context.beginPath();
				if(notePosY > topY + spacingPx){
					context.moveTo(notePosX + info.param2 * spacingPx, notePosY + (info.param4 * spacingPx));
					context.lineTo(notePosX + info.param2 * spacingPx, notePosY - stemLength );
				}
				else{					
					context.moveTo(notePosX + info.param1 * spacingPx, notePosY + (info.param3 * spacingPx));
					context.lineTo(notePosX + info.param1 * spacingPx, notePosY + stemLength + spacingPx );
				}
				context.stroke();
			}
			// accidentals:
			if(noteRest.shownAcc !=  99){
				var accImgNr;
				if(noteRest.shownAcc == - 1){ accImgNr = 21;  }
				else if(noteRest.shownAcc == 0){ accImgNr = 22; }
				else if(noteRest.shownAcc == 1 ){ accImgNr = 20; }	
				renderImage(accImgNr, notePosX - itemImagesInfo[accImgNr].param1 * spacingPx, notePosY);
			}
			

		}
		else{
			
			if(noteRest.ticksLength >= 2 * Q_NOTE){
				
				if(noteRest.ticksLength >= 4 * Q_NOTE){
					context.fillRect(innerLeftX + innerWidth/2 - spacingPx / 2, topY + spacingPx, spacingPx, spacingPx / 2);
				}
				else{
					context.fillRect(notePosX, topY + spacingPx * 1.5, spacingPx, spacingPx / 2);
				}
			}
		}
	}

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


var NoteRest = function(isNote, noteNr, blwabv , ticksPos, ticksLength){
	this.isNote = isNote;
	this.noteNr = noteNr; // Middle c = 60 ( midi standard)
	this.blwabv = blwabv; // -1=if not in scale, note below with sharp/nat. 1: above 0:no opinioni.
	this.forceAcc = false;
	this.shownAcc = 99;
	this.ticksPos = ticksPos;
	this.ticksLength = ticksLength; 
	this.leftX = 0;
	this.upperY;
	this.type = "note";
	this.imgNr;
	this.forcedStemDir = 0;
	this.stemDir;
	this.calcUpperY();
	if(this.isNote){ 
		this.setNoteImg(); 
		this.setStem();
	}
	else{ this.setRestImg(); }
};

NoteRest.prototype.calcUpperY = function(){ 	
	//Calculating the upperY based on the pitch:
	// Offset from G clef not yet added
	this.upperY -= ((this.octave - 4) * 3.5);
	this.upperY -= (this.step-1) * 0.5;
};

NoteRest.prototype.setNoteImg = function(){
	if(this.ticksLength < 2 * Q_NOTE){
		this.imgNr = 0;
	}
	else if(this.ticksLength >= 2 * Q_NOTE && this.ticksLength < 4 * Q_NOTE){
		this.imgNr = 1; 
	}
	else{ 
		this.imgNr = 2; 
	}
};

NoteRest.prototype.setRestImg = function(){
	if(this.ticksLength >= 2 * Q_NOTE && this.ticksLength < 4 *Q_NOTE){
		this.imgNr = -1;
	}
	else{
		this.imgNr = -2;
	}
};

NoteRest.prototype.setStem = function(){
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

var noteIsInCScale = function(noteNr){
	var scaleStep = noteNr % 12;
	if(scaleStep == 1 || scaleStep == 3 || scaleStep == 6 || scaleStep == 8 || scaleStep == 10){
		return false;	
	}
	else { return true; }
};
