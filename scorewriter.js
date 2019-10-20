/* 
 * Scorewriter
 * Copyright Hallgrim Bratberg 2019
 * */

// Set TAB = 4 spaces for comment alignment

// Globals:
var canvas;
var context;
var width;
var height;
var Q_NOTE = 30240; // No of ticks in a quarter note
var spacingPx =30; // The main zoom level: Spacing between lines in a staff
var systemSpacing = 10;
var drawScale = 1; // The canvas scaling factor
var padding = 0.3; // The minimum padding between items, times  spacingPx.
var emptyBarMinSpace = 32; // Releated to spacing
var restsMaxNrDots = 2; // The maximum nr of dots on a rest.
var stemW = spacingPx/30;
var staffs = [];
var musicSystem; // The main score, all staffs combined
var imagesCount = 100; // The number of images
var itemImages = [imagesCount]; // All images of the notation items.
var itemImagesInfo = [imagesCount]; // Scaling data etc.
var systemMeasures = []; // All system measures
var score; // The current active score

// Table setting the Y axis offsets of the noteNr´s in a GClef.(noteRest.topY against top line in staff)
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

var C_SCALE_FROM_CHROM = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6]; 

window.onload = function(){
	canvas = document.createElement( 'canvas' );
	context = canvas.getContext('2d');
	document.body.appendChild(canvas);
		
	loadImgs();


	// TESTING OF PURE MUSIC CONCEPT, all music kept in staff object, no bars/keys etc.
	// Separation between pure music and visual elements
	// Keysig, clef, timeSig, key are visual elements, do note change actual music.
	score = new Score();
	score.masterStaff = new MasterStaff();

	score.masterStaff.insertKey(new Key(0, 0, 0)); // Key, QnotePos, ticksPos
	score.masterStaff.insertTimeSignature(new TimeSignature(4,4, 0, 0)); // topNr, botNr, qNotePos, ticksPos
	score.masterStaff.timeSigs[0].beamGroups = [Q_NOTE * 2, Q_NOTE * 2];

	score.staffs[0] = new Staff(this.masterStaff);
	score.staffs[0].insertClef(new Clef(50, 0, 0)); // clefNr, qNotePos, ticksPos
	
	/*
	score.appendMusic(new PureNoteRest([60], 1, 0),0); // noteNrArray, qNoteLength, ticksLength
	score.appendMusic(new PureNoteRest([62], 1, 0),0);
	score.appendMusic(new PureNoteRest([64], 1, 0),0);
	score.appendMusic(new PureNoteRest([67], 1, 0),0);
	score.appendMusic(new PureNoteRest([72], 4, 0),0);
	*/

	score.appendMeasures(33);

	//NoteRest(isNote, noteNr, blwabv , ticksPos, ticksLength)
	score.insertMusic(new NoteRest(true, 60, 0 , Q_NOTE * 0.5, Q_NOTE/2), 0, 0 );//noteRest, staffNr, measNr 
	//score.insertMusic(new NoteRest(true, 62, 0 , Q_NOTE * 1, Q_NOTE), 0, 0 );
	score.insertMusic(new NoteRest(true, 64, 0 , Q_NOTE * 2, Q_NOTE * 2), 0, 0 );
	score.insertMusic(new NoteRest(true, 72, 0 , Q_NOTE * 0, Q_NOTE / 2), 0, 1 );
	score.insertMusic(new NoteRest(true, 67, 0 , Q_NOTE * 0.5, Q_NOTE / 2), 0, 1 );
	//score.insertMusic(new NoteRest(true, 69, 0 , Q_NOTE * 1, Q_NOTE / 2), 0, 1 );
	score.insertMusic(new NoteRest(true, 71, 0 , Q_NOTE * 1.5,Q_NOTE / 2), 0, 1 );
	score.insertMusic(new NoteRest(true, 72, 0 , Q_NOTE * 2,Q_NOTE / 2), 0, 1 );
	score.insertMusic(new NoteRest(true, 74, 0 , Q_NOTE * 2.5,Q_NOTE / 2), 0, 1 );
	score.insertMusic(new NoteRest(true, 76, 0 , Q_NOTE * 3,Q_NOTE / 2), 0, 1 );
	score.insertMusic(new NoteRest(true, 84, 0 , Q_NOTE * 3.50,Q_NOTE / 4), 0, 1 );
	score.insertMusic(new NoteRest(true, 86, 0 , Q_NOTE * 3.75,Q_NOTE / 8), 0, 1 );
	
	
	score.insertMusic(new NoteRest(true, 78, 0 , Q_NOTE * 0, Q_NOTE * 4), 0, 3 );

	score.insertMusic(new NoteRest(false, 71, 0 , Q_NOTE * 0,Q_NOTE / 2), 0, 4 );



	score.addPart();
	score.parts[0].addPage();
	for(var i = 0; i < score.systemMeasures.length; i++){
		score.sendSysMeasureToParts(score.systemMeasures[i], 0);
	}

	score.updateMeasures(0, Q_NOTE * 100);
	score.buildGraphic();


	




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
	itemImagesInfo[0].param1 = 0.026; // stemX left offset from note leftX: times spacingPx
	itemImagesInfo[0].param2 = 1.11; // stemX right offset from note leftX
	itemImagesInfo[0].param3 = 0.6; // stemY left offset from note upperY
	itemImagesInfo[0].param4 = 0.4; // stemY right offset from note upperY
	setImage(1, "images/WhiteNotehead.svg", new ItemImgInfo(1, 1.15, 0, 0));
	itemImagesInfo[1].param1 = 0.025; // stemX left offset from note leftX
	itemImagesInfo[1].param2 = 1.13; // stemX right offset from note leftX
	itemImagesInfo[1].param3 = 0.6; // stemY left offset from note upperY
	itemImagesInfo[1].param4 = 0.35; // stemY right offset from note upperY
	setImage(2, "images/WholeNote.svg", new ItemImgInfo(1,1.7, 0, 0));
	setImage(4, "images/Crotchet_rest_alt_plain-svg.svg", new ItemImgInfo(3, 0.32, 0.3, -1.5));
	//setImage(10, "images/UpSingleFlag.svg", new ItemImgInfo(3,0.3 , 1.1,0.4));
	//setImage(11, "images/DownSingleFlag.svg", new ItemImgInfo(3, 0.3, 0, -2 ));
	setImage(20, "images/Sharp.svg", new ItemImgInfo(2.8, 0.3, 0, -0.8));	
	itemImagesInfo[20].param1 = 0.9; // Distance from Note
	setImage(21, "images/Flat.svg", new ItemImgInfo(2.6, 0.4, 0, -1.3));
	itemImagesInfo[21].param1 = 0.9; // Distance from Note
	setImage(22, "images/natural.svg", new ItemImgInfo(3.52, 0.25, 0, -1.25));
	itemImagesInfo[22].param1 = 0.9; // Distance from Note
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
	else{ viewResize(false); }
};


var setImage = function( index, fileName, imgInfo){
	itemImagesInfo[index] = imgInfo;
	itemImages[index].onload = function(){ 
		itemImagesInfo[index].isLoaded = true; 
	}
	itemImages[index].src = fileName;
};

window.onresize = function(event){
	viewResize(true);
};	

var viewResize = function(redraw){	
	width = window.innerWidth - 20;
	height = window.innerHeight - 20;
	//width = spacingPx * 100;
	//height = width * Math.sqrt(2);
	canvas.width = width;
	canvas.height = height;
	render(redraw);
};

var render = function(redraw){
	context.scale(drawScale, drawScale);
	score.render();
	context.strokeStyle = "black";
	context.font = "50px Baskerville";
	context.textAlign = "left";
	context.fillText(score.title, 50, 50);
	
};

var renderImage = function(imageNr, leftX, upperY){
	var info = itemImagesInfo[imageNr];
	context.drawImage(itemImages[imageNr], 
					  leftX +(spacingPx * info.xBias), 
					  upperY + (spacingPx * info.yBias), 
					  info.width * spacingPx , 
					  spacingPx * info.scale);
};


var Score = function(){
	// Container class for all data related to one score:
	// Score settings, music, graphic details.
	//
	// What about parts?
	// Need one main score file with all neccessary details for the parts and score
	// The parts are different views of the same data.
	
	this.systemMeasures = [];
	this.masterStaff; 
	this.staffs = [];
	this.parts = [];
	this.qNoteEndPureMusic = 0;
	this.ticksEndPureMusic = 0;

	this.title = "Some Music";
	this.composer = "W. A. Mozart";
}

Score.prototype.appendMusic = function(pureNoteRest, staffNr){
	var stAtIx = this.staffs[staffNr];
	stAtIx.appendMusic(pureNoteRest);

	// Adjusting the total length accordingly:
	var stAtIxEnd = stAtIx.qNoteEnd * Q_NOTE + stAtIx.ticksEnd;
	if(stAtIxEnd > this.qNoteEndPureMusic * Q_NOTE + this.ticksEndPureMusic){
		this.qNoteEndPureMusic = stAtIx.qNoteEnd;
		this.ticksEndPureMusic = stAtIx.ticksEnd;
	}
	//alert("Length: " + this.qNoteEndPureMusic + " , " + this.ticksEndPureMusic);
};

Score.prototype.insertMusic = function(noteRest, staffNr, measureNr){
	//Ny metode for musikk innsetting.
	//Går inn til riktig staff_measure og setter inn.
	//Vi glemmer Pure Music!!
	this.systemMeasures[measureNr].insertMusic(noteRest, staffNr); 
	
};

Score.prototype.appendMeasures = function(numberOfMeasures){ 
	var qNoteStartingPoint = 0, ticksStartingPoint = 0;
	// Finding the startpoint for the first measure added:
	for(var i = 0; i < numberOfMeasures; i++){
		// Finding the startpoint of the new Sys Measyre
		if(this.systemMeasures.length > 0){
		var lastMeas = this.systemMeasures[this.systemMeasures.length - 1];
		qNoteStartingPoint = lastMeas.qNoteStartingPoint + Math.floor(lastMeas.totalTicksLength / Q_NOTE);
		ticksStartingPoint = lastMeas.ticksStartingPoint + (lastMeas.totalTicksLength % Q_NOTE);
		qNoteStartingPoint += Math.floor(ticksStartingPoint / Q_NOTE);
		ticksStartingPoint = ticksStartingPoint % Q_NOTE; 
		//alert(qNoteStartingPoint + " " + ticksStartingPoint);
	}

		var newSysMes = new SystemMeasure(this.masterStaff, qNoteStartingPoint, ticksStartingPoint);
		this.systemMeasures.push(newSysMes);
		if(this.systemMeasures.length == 1){
			this.systemMeasures[0].showInitTimeSig = true;
		}
		for(var i2 = 0; i2 < this.staffs.length; i2++){
			newSysMes.staffMeasures.push(this.staffs[i2].appendMeasure(newSysMes));			
		
		}
	}	
};

Score.prototype.updateMeasures = function(ticksFrom, ticksTo){
	
	// This function updates the content of the measures in the given range
	// If to = 0 : Updating everythin after qNote/ticks from.
	
	// 1) Calculate the first affected measures
	// 3) Call the SystemMeasure.update(qNote/ticksStart, lastqNote/tick of prev measure, )
	//    of the relevant measuresi. Append Systemmeasures if neccessary.
	var sysMeasFirstIx, SysMeasLastIx, sysMeasAtIx, sysMeasAtIxStartingTick, sysMeasAtIxLastTick;
	for(var i = 0; i < this.systemMeasures.length; i++){
		sysMeasAtIx = this.systemMeasures[i];
		sysMeasAtIxStartingTick = sysMeasAtIx.qNoteStartingPoint * Q_NOTE + sysMeasAtIx.ticksStartingPoint;
		sysMeasAtIxLastTick = sysMeasAtIxStartingTick + sysMeasAtIx.qNoteLength * Q_NOTE + sysMeasAtIx.ticksLength;
		//Hvis takten er i intervall:
	
	}
	
};

Score.prototype.sendSysMeasureToParts = function(sysMeasure, sysMeasureNr){
		this.parts[0].receiveSysMeasure(sysMeasure, sysMeasureNr);
};


Score.prototype.addPart = function(){
	this.parts.push(new Part);
};

Score.prototype.buildGraphic = function(){
	this.parts[0].buildGraphic();
};


Score.prototype.render = function(){
	this.parts[0].render();
}


var Part = function(){
	// A Part object represents a part OR the full score.
	this.pages = [];
};

Part.prototype.addPage = function(){
	this.pages.push(new Page());
};

Part.prototype.receiveSysMeasure = function(sysMeasure, sysMeasureNr){
	this.pages[0].receiveSysMeasure(sysMeasure, sysMeasureNr);
};

Part.prototype.buildGraphic = function(){
	this.pages[0].buildGraphic();
};

Part.prototype.render = function(){
	this.pages[0].render(0, 0 , 100 * spacingPx, false);
};

var Page = function(){
	// 	A page object represents one page in the score
	// 	In panorama view there is only one page with adaptive size
	this.widthPx;
	this.heightPx;
	this.leftMargin = 0.06; // 1 is full page width, 0.1 is 1/10 of page width
	this.rightMargin = 0.06;
	this.topMargin = 0.08;
	this.bottomMargin = 0.07;
	this.systems = [];

};

Page.prototype.receiveSysMeasure = function(sysMeasure, sysMeasureNr){
	if(this.systems.length == 0){
		this.systems.push(new System(this));
		this.systems[0].receiveSysMeasure(sysMeasure, sysMeasureNr);
	}
	else{
		if(!this.systems[this.systems.length - 1].receiveSysMeasure(sysMeasure, sysMeasureNr)){
			this.systems.push(new System(this));
			this.systems[this.systems.length - 1].receiveSysMeasure(sysMeasure, sysMeasureNr);
		}
	}
};

Page.prototype.buildGraphic = function(){
	for(var i = 0; i < this.systems.length; i++){
		this.systems[i].buildGraphic();	
	}
};

Page.prototype.render = function(leftXPx, topYPx, widthPx, redraw){
	var heightPx = Math.floor(widthPx * Math.sqrt(2));
	var leftMarginPx = leftXPx + widthPx * this.leftMargin;
	var innerWidthPx = widthPx * (1 - this.leftMargin - this.rightMargin);
	var topMarginPx = topYPx + heightPx * this.topMargin;
	var innerHeightPx = heightPx * (1 - this.topMargin - this.bottomMargin);

	// Drawing outline:
	context.strokeStyle = "black";
	context.beginPath();
	context.rect(leftXPx, topYPx, widthPx, heightPx);
	context.stroke();
	
	// Drawing the margins
	context.setLineDash([5, 5]);
	context.strokeStyle = "#B0B0B0";
	context.beginPath();
	context.rect(leftMarginPx, topMarginPx, innerWidthPx, innerHeightPx);
	context.stroke();
	context.setLineDash([]);
	

	for(var i = 0; i < this.systems.length; i++){
		this.systems[i].render(leftMarginPx, topMarginPx + (i * spacingPx * systemSpacing), innerWidthPx, innerHeightPx); 
	}



};


var System = function(page){
	// A system object represents one system of staffs on the page.	
	this.page = page;
	this.systemMeasures = [];
};

System.prototype.receiveSysMeasure = function(sysMeasure, sysMeasureNr){
	if(this.systemMeasures.length < 4){
		this.systemMeasures.push(sysMeasure);
		if(this.systemMeasures.length == 1){
			this.systemMeasures[this.systemMeasures.length - 1].setShowInitKey(true);	
			this.systemMeasures[this.systemMeasures.length - 1].setShowInitClef(true); 
		}
		return true;
	}
	return false;
};

System.prototype.buildGraphic = function(){
	for(var i = 0; i < this.systemMeasures.length; i++){
		this.systemMeasures[i].buildGraphic();
	}
};

System.prototype.render = function(leftXPx, topYPx, widthPx, redraw){
	var measLeftXPx, measWidthPx;
	measWidthPx = widthPx / this.systemMeasures.length;
	measLeftXPx = leftXPx;
	for(var i = 0; i < this.systemMeasures.length; i++){
		this.systemMeasures[i].render(measLeftXPx, topYPx, measWidthPx, redraw);
		measLeftXPx += measWidthPx;
	}	
};



// Measure stores all the staffMeasures in a bar. It keeps track of horizontal spacing of the music
// and all System items connected to one single bar.
var SystemMeasure = function(masterStaff, qNoteStartingPoint, ticksStartingPoint){
	this.masterStaff = masterStaff;
	this.qNoteStartingPoint = qNoteStartingPoint;
	this.ticksStartingPoint = ticksStartingPoint;
	this.totalTicksLength = 0;
	this.staffMeasures = [];
	this.ticks = []; //Stores info about specific ticks: width
	this.leftMarginWidth = 0; // no of spacings.
	this.rightMarginWidth =0; // no of spacings
	this.initClefWidth = 0;
	this.initKeyWidth = 0;
	this.initTimeWidth = 0;
	this.timeSignature;
	this.key;

	this.showInitTimeSig = false;
	this.showInitKey = false;
	this.showInitClef = false;

	this.updateTimeSig();
	this.updateKey();
}

SystemMeasure.prototype.updateTimeSig = function(){
	//alert(this.masterStaff.timeSigs.length);
	this.timeSignature = this.masterStaff.getTimeSignatureAt(this.qNoteStartingPoint, this.ticksStartingPoint);	
	this.totalTicksLength = 4 * Q_NOTE * this.timeSignature.topNr / this.timeSignature.botNr;
};

SystemMeasure.prototype.updateKey = function(){
	this.key = this.masterStaff.getKeyAt(this.qNoteStartingPoint, this.ticksStartingPoint);
	//this.key = new Key(6, 0,0);
};

SystemMeasure.prototype.setShowInitKey = function(showBool){
	this.showInitKey = showBool;
	for(var i = 0; i < this.staffMeasures.length; i++){
		this.staffMeasures[i].showInitKey = showBool;
	}
};

SystemMeasure.prototype.setShowInitTimeSig = function(showBool){
	this.showInitTimeSig = showBool;
	for(var i = 0; i < this.staffMeasures.length; i++){
		this.staffMeasures[i].showInitTimeSig = showBool;
	}
};

SystemMeasure.prototype.setShowInitClef = function(showBool){
	this.showInitClef = showBool;
	for(var i = 0; i < this.staffMeasures.length; i++){
		this.staffMeasures[i].showInitClef = showBool;
	}
};


SystemMeasure.prototype.updateTick = function(ticksPos, width){
	var exists = false;
	for(var i = 0; i < this.ticks.length; i++){
		if(this.ticks[i].ticksPos == ticksPos){
			this.ticks[i].width = width;
			exists = true;
			break;
		}
	}
	if(!exists){
		this.ticks.push(new Tick(ticksPos, width));	
	}
};

SystemMeasure.prototype.buildGraphic = function(){
	//alert("Building sys mes graphic");
	var staffMeas;
	// Calculating space needed for starting clef, key sign and time sign.
	for(var i = 0; i < this.staffMeasures.length; i++){
		staffMeas = this.staffMeasures[i];
		if(staffMeas.showInitClef){
			var staffInitClefWidth = itemImagesInfo[staffMeas.clefNr].width + (padding * 2);
			if(	staffInitClefWidth > this.initClefWidth ){
				this.initClefWidth = staffInitClefWidth;
			}
		}
		if(staffMeas.showInitKey){
			var accWidth;
			if(staffMeas > 0){
				accWidth = itemImagesInfo[20].width;
			}
			else{
				accWidth = itemImagesInfo[21].width;
			}
			var staffInitKeyWidth = Math.abs(staffMeas.key) * (accWidth + padding); 
			if(staffInitKeyWidth > this.initKeyWidth){
				this.initKeyWidth = staffInitKeyWidth;;
			}
		}
		if(staffMeas.showInitTimeSig){
			this.initTimeWidth = 1;
			if(staffMeas.topMeter > 9 || staffMeas.bottomMeter > 9){
				this.initTimeWidth += 0.5;
			}
		}
	}
	this.leftMarginWidth = this.initClefWidth + this.initKeyWidth + this.initTimeWidth;
	
	for(var i = 0; i < this.staffMeasures.length; i++){
		staffMeas = this.staffMeasures[i];
		staffMeas.buildGraphic();
	}

};

SystemMeasure.prototype.render = function(leftX, topY, width, redraw){
		for(var i = 0; i < this.staffMeasures.length; i++){
		this.staffMeasures[i].render(leftX, topY, width, redraw);
	}
};

SystemMeasure.prototype.insertMusic = function(noteRest, staffNr){
	this.staffMeasures[staffNr].addMusic(noteRest);
};


// Masterstaff contains System info: tempo, repeat, timeSigs, time signature.
var MasterStaff = function(){
	this.keys = [];
	this.timeSigs = [];
	
};

MasterStaff.prototype.insertTimeSignature = function(newTimeSignature){
	var newTimeSigTotalTicks = newTimeSignature.qNotePos * Q_NOTE + newTimeSignature.ticksPos;  
	if(this.timeSigs.length == 0 || 
	   this.timeSigs[this.timeSigs.length-1].qNotePos * Q_NOTE + this.timeSigs[this.timeSigs.length-1].ticksPos < newTimeSigTotalTicks){
		this.timeSigs.push(newTimeSignature); 
	}
	else{
		for(var i = 0; i < this.timeSigs.length; i++){ 
			var timeSigAtIx = this.timeSigs[i];
			if(timeSigAtIx.qNotePos * Q_NOTE + timeSigAtIx.ticksPos == newTimeSigTotalTicks){
				this.timeSigs.splice(i, 1, newTimeSignature);
				break;
			}
			else if(timeSigAtIx.qNotePos * Q_NOTE + timeSigAtIx.ticksPos > newTimeSigTotalTicks){
				this.timeSigs.splice(i, 0, newTimeSignature);
				break;	
			}
		}
	}
};

MasterStaff.prototype.getTimeSignatureAt = function(qNotePos, ticksPos){
	var totalTicksPos = qNotePos * Q_NOTE + ticksPos;
	if(this.timeSigs.length == 0){ return null; }
	else{
		var tmpTimeSig;
		for(var i = 0; i < this.timeSigs.length; i++){
			tmpTimeSig = this.timeSigs[i];
			if(totalTicksPos == (tmpTimeSig.qNotePos * Q_NOTE) + tmpTimeSig.ticksPos){
				return tmpTimeSig;
			}
			if(totalTicksPos > (tmpTimeSig.qNotePos * Q_NOTE) + tmpTimeSig.ticksPos){
				if(i == this.timeSigs.length - 1){ return tmpTimeSig; }
				else if(this.timeSigs[i+1].qNotePos * Q_NOTE + this.timeSigs[i+1].ticksPos > totalTicksPos){
					return tmpTimeSig;		
				}
			}
		}
	}
};

MasterStaff.prototype.insertKey = function(newKey){
	var newKeyTotalTicks = newKey.qNotePos * Q_NOTE + newKey.ticksPos;  
	if(this.keys.length == 0 || 
	   this.keys[this.keys.length-1].qNotePos * Q_NOTE + this.keys[this.keys.length-1].ticksPos < newKeyTotalTicks){
		this.keys.push(newKey); 
	}
	else{
		for(var i = 0; i < this.keys.length; i++){ 
			var keyAtIx = this.keys[i];
			if(keyAtIx.qNotePos * Q_NOTE + keyAtIx.ticksPos == newKeyTotalTicks){
				this.keys.splice(i, 1, newKey);
				break;
			}
			else if(keyAtIx.qNotePos * Q_NOTE + keyAtIx.ticksPos > newKeyTotalTicks){
				this.keys.splice(i, 0, newKey);
				break;	
			}
		}
	}
};

MasterStaff.prototype.getKeyAt = function(qNotePos, ticksPos){
	var totalTicksPos = (qNotePos * Q_NOTE) + ticksPos;
	if(this.keys.length == 0){ return null; }
	else{
		var tmpKey;
		for(var i = 0; i < this.keys.length; i++){
			tmpKey = this.keys[i];
			if(totalTicksPos == (tmpKey.qNotePos * Q_NOTE) + tmpKey.ticksPos){
				return tmpKey;
			}
			if(totalTicksPos > (tmpKey.qNotePos * Q_NOTE) + tmpKey.ticksPos){
				if(i == this.keys.length - 1){ return tmpKey; }
				else if(this.keys[i+1].qNotePos * Q_NOTE + this.keys[i+1].ticksPos > totalTicksPos){
					return tmpKey;		
				}
			}
		}
	}
};



// Staff contains staff-related info: pureMusic,clefs and other elements which relates to a range of bars.
var Staff = function(masterStaff){
	this.masterStaff = masterStaff;
	this.pureMusic = [];
	this.staffMeasures = [];
	this.clefs = [];
	this.qNoteEnd = 0; //last qNote + tick of pureMusic (or rest)
	this.ticksEnd = 0;
};

Staff.prototype.appendMusic = function(pureNoteRest){
	this.pureMusic.push(pureNoteRest);
	this.qNoteEnd += pureNoteRest.qNoteLength;
	this.qnoteEnd += Math.floor((this.ticksEnd + pureNoteRest.ticksLength) / Q_NOTE);
	this.ticksEnd = (this.ticksEnd + pureNoteRest.ticksLength) % Q_NOTE;
	//alert("Musikk lengde: " + this.qNoteEnd + ", " + this.ticksEnd);
};

Staff.prototype.overwriteMusic = function(pureNoteRest, qNotePos, ticksPos){
	
};

Staff.prototype.insertMusic = function(pureNoterest, qNotePos, ticksPos){
	
};

Staff.prototype.appendMeasure = function(systemMeasure){
	//alert(systemMeasure.timeSignature.topNr);
	var topMeter = systemMeasure.timeSignature.topNr;
	var bottomMeter = systemMeasure.timeSignature.botNr;
	var keyNr = systemMeasure.key.keyNr;
	var newStM = new Staff_Measure(topMeter, bottomMeter, keyNr, 50, this, systemMeasure);
	this.staffMeasures.push(newStM);
	return newStM;
};

Staff.prototype.getClefAtPos = function(qNotePos, ticksPos){
	var totalTicksPos = qNotePos * Q_NOTE + ticksPos; 
	var clef, clefTotalTicksPos;
	for(var i = 0; i < this.clefs.length; i++){
		clefTotalTicksPos = this.clefs[i].qNotePos * Q_NOTE + this.clefs[i].ticksPos;
		if(i = this.clefs.length - 1 || clefTotalTicksPos > totalTicksPos){
			clef = this.clefs[i - 1];
			break;
		} 
	}
	return clef
};



Staff.prototype.insertClef = function(newClef){
	var newClefTotalTicks = newClef.qNotePos * Q_NOTE + newClef.ticksPos;  
	if(this.clefs.length == 0 || 
	   this.clefs[this.clefs.length-1].qNotePos * Q_NOTE + this.clefs[this.clefs.length-1].ticksPos < newClefTotalTicks){
		this.clefs.push(newClef); 
	}
	else{
		for(var i = 0; i < this.clefs.length; i++){ 
			var clefAtIx = this.clefs[i];
			if(clefAtIx.qNotePos * Q_NOTE + clefAtIx.ticksPos == newClefTotalTicks){
				this.clefs.splice(i, 1, newClef);
				break;
			}
			else if(clefAtIx.qNotePos * Q_NOTE + clefAtIx.ticksPos > newClefTotalTicks){
				this.clefs.splice(i, 0, newClef);
				break;	
			}
		}
	}
};

var Staff_Measure = function(topMeter, bottomMeter, key, clefNr, staff, systemMeasure){
	//alert("opprettelse av Staff_Measure");
	this.systemMeasure = systemMeasure;
	this.topMeter = topMeter;
	this.bottomMeter = bottomMeter;
	this.totalTicks = (4 / bottomMeter) * Q_NOTE * topMeter;  
	this.key = key;// in fifths from c
	this.clefNr = clefNr; // The initial clef
	this.staff = staff; // To get access to clef list etc.
	//this.systemMeasure = systemMeasure; 
	this.pitchOffset = 0;
	this.keyOffset = 0;
	this.showInitClef = this.systemMeasure.showInitClef;
	this.showInitKey = this.systemMeasure.showInitKey;
	this.showInitTimeSig = this.systemMeasure.showInitTimeSig;
	// musicItems stores the music items which is placed in the music grid.
	this.musicItems = [];
	this.shortestInBarTicks = 0;
	// graph_items stores all graphical items in the bar and their positioning info:
	this.graph_items = [];
	this.leftMarginWidth = 0; 
	this.rightMarginWidth = 0;
	this.innerWidth = 0;
	this.noteToYPos = [12];
	this.initCScaleSteps = [7]; // index 0 = C. The chrom nr of each c scale step with acc.
	this.tmpCScaleSteps = []; // Modified scales as a result of temporary accidentals.
	this.tmpAccidentals = []; 

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
	else if(this.key < 0){
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
	else{
		for(i = 0; i < this.musicItems.length; i++){
			if(noteRest.ticksPos <=  this.musicItems[i].ticksPos){
				this.musicItems.splice(i, 0, noteRest);
				break;
			}
		}
	}
};

Staff_Measure.prototype.addTmpAcc = function(tmpA){
	if(this.tmpAccidentals.length == 0 || tmpA.ticksPos >= this.tmpAccidentals[this.tmpAccidentals.length-1].ticksPos){
		this.tmpAccidentals.push(tmpA);	
	}
	else{
		var i;
		for(i = 0; i < this.tmpAccidentals.length; i++){
			if(tmpA.ticksPos <= this.tmpAccidentals[i].ticksPos){
				this.tmpAccidentals.splice(i, 0, tmpA);
			}
		}
	}
}

//Method to be called when a staff measure has been created or edited:
Staff_Measure.prototype.buildGraphic = function(){
	this.pitchOffset = itemImagesInfo[this.clefNr].param1;
	this.keyOffset = itemImagesInfo[this.clefNr].param2;

	// Adding initial clef
	if(this.showInitClef){
		this.graph_items.push(new GraphicItem(this.clefNr, 1, padding, 0));
	}

	
	//Intial key signature:
	if(this.showInitKey){
		var clefOffset = - itemImagesInfo[this.clefNr].param2 * 0.5;
		var keyX = this.systemMeasure.initClefWidth;
		if(this.key > 0){
			// key is sharp:
			var i, tmpY;
			var sharpWidth = itemImagesInfo[20].width;
			for(i = 0; i < this.key; i++){
				if(i % 2 == 0){
					tmpY =  -0.5 - (i * 0.25);
					if(i > 3){ tmpY += 3.5; }
					this.graph_items.push(new GraphicItem(20, 1, keyX + (sharpWidth * i) + (padding * i), tmpY + clefOffset));
				}
				else{ 
					this.graph_items.push(new GraphicItem(20, 1,  keyX + (sharpWidth * i) + (padding * i), 1.25 - (i * 0.25)+ clefOffset ));	
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
				}
				else{	
					this.graph_items.push(new GraphicItem(21, 1, keyX + (flatWidth * i) + (0.5 *padding *i), -0.25 + (i * 0.25) + clefOffset ));	
				}

			}
		}

	}
	
	if(this.showInitTimeSig){
		var timeSigX = this.systemMeasure.initClefWidth + this.systemMeasure.initKeyWidth;
		this.graph_items.push(new GraphicTimeSignature(this.topMeter, this.bottomMeter, 1, timeSigX, 0));
	}

	//musicItems

	for(itemIx = 0; itemIx < this.musicItems.length; itemIx++){
		var noteRest = this.musicItems[itemIx];
		if(noteRest.isNote){
			// Is a note, not a rest
			if(noteRest.ticksLength < Q_NOTE * 2){
				noteRest.imgNr = 0;
			}
			else if(noteRest.ticksLength < Q_NOTE * 4){
				noteRest.imgNr = 1; 
			}
			else{ noteRest.imgNr = 2; }
		}
		else{
			
		}

		var noteOct = Math.floor(noteRest.noteNr / 12); //Middle octave is 5.
		var noteStep = noteRest.noteNr - (noteOct * 12); // C = 0..B = 11
		var noteScaleStep = C_SCALE_FROM_CHROM[noteStep];// 0 - 6, Semitones has value *.5
		noteRest.Ypos = this.noteToYPos[noteStep];
		// Notes between scale steps is has notPosValue of *.5.
		// Actual step is beeing calculated along with accidentals below
		

		// *** HER MÅ DET VÆRE EN KLAR STRUKTUR:
		// 			Dersom ingen ønsker i noteRest:
		//			Hva med ranking av nærmeste trinn? 
		//			Eks: skal sette inn F etter E og F#(løst fortegn)
		//			Finner at current closest er E og F#, velger en av de. 
		//			Dersom noteRest er i opprinnelig toneart velges trinn deretter
		//			Siden F er i opprinnelig toneart velges den.
		//			utover det velges iht gjelden toneart, # eller b-toneart.
		
		// Calculate accidental
		// Sjekker nærmeste toner og rangerer etter hvor langt unna de er:
	

		var noteNeedNoAcc = false;
		var accNeeded = 99;
		for(i = 0; i < 7; i++){
			if(noteStep == this.cScaleSteps[i]){
				var i2;
				noteNeedNoAcc = true;
				for(i2 = this.tmpAccidentals.length - 1; i2 >= 0; i2--){
					var tmpA = this.tmpAccidentals[i2];
					if(tmpA.ticksPos <= noteRest.ticksPos && i == tmpA.cScaleStep){
						noteNeedNoAcc = false;
						alert("Scalestep " + i +" has prev loose acc");
						break;
					}
				}
				break;
			}	
		}


		if(!noteNeedNoAcc){
			//notePosX += (padding * spacingPx);
			// Note is not in key, accidental must be set:
			if(noteRest.blwabv == 0){
				if(noteIsInCScale(noteStep)){
					// Note can be set to natural:
					noteRest.shownAcc = 0;
					//this.addTmpAcc(new TmpAcc(noteRest.ticksPos, noteScaleStep, 0));
					if(this.key > 0){ noteRest.Ypos -= 0.25; }
					else{ noteRest.Ypos += 0.25; }
				}
				else if(this.key > 0){
					noteRest.shownAcc = 1;
					//this.addTmpAcc(new TmpAcc(noteRest.ticksPos, noteScaleStep - 0.5 , 1));
					noteRest.Ypos += 0.25;
				}
				else{
					noteRest.shownAcc = -1;
					//this.addTmpAcc(new TmpAcc(noteRest.ticksPos, noteScaleStep + 0.5, -1));
					noteRest.Ypos -= 0.25;
				}
			}
		}

		noteRest.Ypos -= ((noteOct - 6) * 3.5);
		noteRest.Ypos += itemImagesInfo[this.clefNr].param1;

		if(noteRest.isNote){

					// Calculating stem:
			if(noteRest.ticksLength < Q_NOTE * 4){
				var info = itemImagesInfo[0];
				noteRest.stemLength = -3;
				if(noteRest.Ypos <= 1.5){ noteRest.stemLength = 4; }
				if(noteRest.Ypos > 4.5 || noteRest.Ypos < -1.5){
					noteRest.stemLength = 2 - noteRest.Ypos;
				}
				//alert("Stem length = " + noteRest.stemLength);
				
				//Setting startpoint of stem (as offset from note pos)
				if(noteRest.stemLength > 0){
					noteRest.stemXoffset = itemImagesInfo[noteRest.imgNr].param1;
					noteRest.stemYoffset = itemImagesInfo[noteRest.imgNr].param3;
				}
				else{
					noteRest.stemXoffset = itemImagesInfo[noteRest.imgNr].param2;
					noteRest.stemYoffset = itemImagesInfo[noteRest.imgNr].param4;
				}
				noteRest.stemLength -= noteRest.stemYoffset;
			}
		}
		else{
			
			if(noteRest.ticksLength >= 2 * Q_NOTE){	}
		}
	}
	//END MusicItems
};




// leftX,topX indicates the point where the start of the upper staffline is.

// Method to be called if a bar needs to be redrawn: 
// It is new, it has been edited or the view  has been changed..
Staff_Measure.prototype.render = function(leftX, topY, width, redraw){
	// Redraw is true if Staff_Measure is has been drawn before
	// lines:
	//
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
			var tsX, tsUpperNrY,tsLowerNrY;
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
			}
		}
	}

	
	// NoteRest drawing
	var innerLeftX = leftX + this.systemMeasure.leftMarginWidth * spacingPx + spacingPx;
	var innerRightX = leftX + width - this.systemMeasure.rightMarginWidth * spacingPx - spacingPx;
	var innerWidth = innerRightX - innerLeftX;
	var prevNoteRest, ticksGap, ticksGapPosX;

	for(var itemIx = 0; itemIx < this.musicItems.length; itemIx++){
		var noteRest = this.musicItems[itemIx];

		
		// Filling in with rests if gap in music:
		ticksGap = 0
		if(itemIx == 0){
			// Rendering of initial rest in measure:
			ticksGap = noteRest.ticksPos;
			if(ticksGap > 0){
				var ticksRemainingRest = this.renderRest(ticksGap, innerLeftX, topY + 2* spacingPx);
			}			
		}
		else{
			// Rendering of in-between rests in measure:
			ticksGap = noteRest.ticksPos - (prevNoteRest.ticksPos + prevNoteRest.ticksLength); 
			if(ticksGap > 0){
				ticksGapPosX = prevNoteRest.ticksPos + prevNoteRest.ticksLength;
				var restPosXPx = innerLeftX + (innerWidth / this.totalTicks) * ticksGapPosX;	
				var ticksRemainingrest = this.renderRest(ticksGap, restPosXPx, topY + 2 * spacingPx);
			}
		}
		
		if(itemIx == this.musicItems.length - 1){
			// Rendering of ending rests in measure:
			ticksGap = this.totalTicks - (noteRest.ticksPos + noteRest.ticksLength);	 
			if(ticksGap > 0){
				//alert("Ticksgap fra siste note: " + ticksGap);
				ticksGapPosX = noteRest.ticksPos + noteRest.ticksLength;
				var restPosXPx = innerLeftX + (innerWidth / this.totalTicks) * ticksGapPosX;
				var remainingRest = this.renderRest(ticksGap, restPosXPx, topY + 2 * spacingPx);
			}
		}

		var notePosX = innerLeftX + (innerWidth / this.totalTicks) * noteRest.ticksPos; 

		// NEW rendering: Using params already defined in noteRest:
		var notePosY = topY + (noteRest.Ypos * spacingPx);	
		// Notes between scale steps is has notPosValue of *.5.
		// Actual step is beeing calculated along with accidentals below
		if(noteRest.isNote){
			// noteRest is a note, NOT a rest:
			// Rendering the stem:
			var info = itemImagesInfo[noteRest.imgNr];
			if(stemW < 1){ stemW = 1; };
			var stemXpx = notePosX + (noteRest.stemXoffset * spacingPx);
			var stemYstartPx = notePosY + (noteRest.stemYoffset * spacingPx);
			context.lineWidth = stemW;
			context.beginPath();
			context.moveTo(stemXpx, stemYstartPx);
			context.lineTo(stemXpx, stemYstartPx + (noteRest.stemLength * spacingPx));
			context.stroke();
			
			// Flags and beams:
			// Temporary: Flags only
			if(noteRest.ticksLength < Q_NOTE * 2){
				this.renderFlags(noteRest.ticksLength, stemXpx, stemYstartPx, noteRest.stemLength * spacingPx);
			}

			//Drawing ledger lines:
			var staffLowY = topY + 4 * spacingPx;
			var ledgeDelta = 1.35;
			if(noteRest.ticksLength <= Q_NOTE * 4){ ledgeDelta = 1.73; }
			if(notePosY > staffLowY){
				var noOfLines = 0.5 + ((notePosY - staffLowY) / spacingPx);
				context.lineWidth = lineW;
				context.beginPath();
				for(i = 1; i <= noOfLines; i++){
					context.moveTo(notePosX - info.param1 * spacingPx - spacingPx * 0.4,  staffLowY + i * spacingPx);
					context.lineTo(notePosX + spacingPx * ledgeDelta, staffLowY + i * spacingPx);	
				}
				context.stroke();
			}
			else if(notePosY < topY - spacingPx){	
				var noOfLines = ((topY - notePosY) / spacingPx) - 0.5;
				context.lineWidth = lineW;
				context.beginPath();
				for(i = 1; i <= noOfLines; i++){
					context.moveTo(notePosX - info.param1 * spacingPx - spacingPx * 0.4, topY - i * spacingPx);
					context.lineTo(notePosX + spacingPx * ledgeDelta, topY - i * spacingPx);	
				}
				context.stroke();
			}







			renderImage(noteRest.imgNr, notePosX, notePosY);
			
			
			//dot testing only
			/*
			context.beginPath();
			//alert("PosY = " + noteRest.Ypos);
			var deltaDotPosY = spacingPx * 0.5;
			if(noteRest.Ypos != Math.floor(noteRest.Ypos)){ deltaDotPosY = 0; }
			var dotPosX = notePosX + itemImagesInfo[noteRest.imgNr].width * spacingPx + spacingPx * 0.5;
			context.arc(dotPosX, notePosY + deltaDotPosY, spacingPx/6, 0, 2 * Math.PI);
			context.fill();
			context.stroke();
			*/
		}
		else{
			// noteRest is a rest:
			if(noteRest.ticksLength >= 2 * Q_NOTE){
				if(noteRest.ticksLength >= 4 * Q_NOTE){
					context.fillRect(innerLeftX + innerWidth/2 - spacingPx / 2, topY + spacingPx, spacingPx, spacingPx / 2);
				}
				else{
					context.fillRect(notePosX, topY + spacingPx * 1.5, spacingPx, spacingPx / 2);
				}
			}
		}

		var prevNoteRest = noteRest;
	}
	
	// Filling in with bar rests:
	if(this.musicItems.length == 0){
		context.fillRect(innerLeftX + innerWidth/2 - spacingPx / 2, topY + spacingPx, spacingPx, spacingPx / 2);
	}
};

Staff_Measure.prototype.renderFlags = function(ticksLength, stemRootXPx, stemRootYPx, stemLengthPx){
	// Settings: 
	var EIGHT_FLAG_WIDTH = spacingPx;
	var SUB_FLAG_WIDTH = spacingPx * 0.75;

	// Calculating how many flags:
	// FORENKLE MED LOG2!!!
	var noOfFlags = 1;
	for(var divisor = Q_NOTE / 4; divisor >= Q_NOTE / 32; divisor = divisor / 2){
		//alert(divisor + " " + ticksLength);
		if(divisor / ticksLength < 1){ break; }
		noOfFlags++;
	} 
	//alert("Antall flagg: " + noOfFlags);


	var direction = 1;
	if( stemLengthPx < 0 ){ direction = -1; };
	var flagOuterRootXPx = stemRootXPx, flagOuterRootYPx, flagTipXPx, flagTipYPx;
	var outerConcaveXPx, outerConcaveYPx, outerConvexXPx,outerConvexYPx;
	var innerConcaveXPx, innerConcaveYPx;
	if(noOfFlags == 1){
		// Rendering of 8th note flag:
		flagOuterRootYPx = stemRootYPx + stemLengthPx;
		flagTipXPx = stemRootXPx + spacingPx * 0.8;
		flagTipYPx = flagOuterRootYPx -  (spacingPx * 3.2 * direction);
		outerConcaveXPx = flagOuterRootXPx + spacingPx * 1.6;
		outerConcaveYPx = flagOuterRootYPx - (spacingPx * 1.0 * direction);
		outerConvexXPx = stemRootXPx + spacingPx * 0.1;
		outerConvexYPx = flagOuterRootYPx - (spacingPx * 1 * direction);
		innerConcaveXPx = stemRootXPx + spacingPx * 1.5;
		innerConcaveYPx = flagOuterRootYPx - (spacingPx * 0.9 * direction);

		context.beginPath();
		context.moveTo(flagOuterRootXPx, flagOuterRootYPx);
		context.bezierCurveTo(outerConvexXPx, outerConvexYPx,
							  outerConcaveXPx, outerConcaveYPx,
							  flagTipXPx, flagTipYPx);
		context.bezierCurveTo(flagTipXPx, flagTipYPx,
							  innerConcaveXPx, innerConcaveYPx,
							  flagOuterRootXPx, flagOuterRootYPx - EIGHT_FLAG_WIDTH * direction);
		context.fill();
		context.stroke();
	}
	else{
		// Rendering the innermost of multiple flags:
		flagOuterRootYPx = stemRootYPx + stemLengthPx - spacingPx * 0.5 * direction;
		flagTipXPx = stemRootXPx + spacingPx * 0.8;
		flagTipYPx = flagOuterRootYPx -  (spacingPx * 2.7 * direction);
		outerConcaveXPx = flagOuterRootXPx + spacingPx * 1.4;
		outerConcaveYPx = flagOuterRootYPx - (spacingPx * 1.0 * direction);
		outerConvexXPx = stemRootXPx + spacingPx * 0.3;
		outerConvexYPx = flagOuterRootYPx - (spacingPx * 0.8 * direction);
		innerConcaveXPx = stemRootXPx + spacingPx * 1.4;
		innerConcaveYPx = flagOuterRootYPx - (spacingPx * 1.0 * direction);

		context.beginPath();
		context.moveTo(flagOuterRootXPx, flagOuterRootYPx);
		context.bezierCurveTo(outerConvexXPx, outerConvexYPx,
							  outerConcaveXPx, outerConcaveYPx,
							  flagTipXPx, flagTipYPx);
		context.bezierCurveTo(flagTipXPx, flagTipYPx,
							  innerConcaveXPx, innerConcaveYPx,
							  flagOuterRootXPx, flagOuterRootYPx - (SUB_FLAG_WIDTH * direction));
		context.fill();
		context.stroke();
		for(var flagNr = 2; flagNr <= noOfFlags; flagNr++){
			flagOuterRootYPx = flagOuterRootYPx + (SUB_FLAG_WIDTH * direction);
			flagTipXPx = stemRootXPx + spacingPx * 0.9;
			flagTipYPx = flagOuterRootYPx -  (spacingPx * 2.0 * direction);
			outerConcaveXPx = flagOuterRootXPx + spacingPx * 1.4;
			outerConcaveYPx = flagOuterRootYPx - (spacingPx * 1.0 * direction);
			outerConvexXPx = stemRootXPx + spacingPx * 0.3;
			outerConvexYPx = flagOuterRootYPx - (spacingPx * 0.8 * direction);
			innerConcaveXPx = stemRootXPx + spacingPx * 1.4;
			innerConcaveYPx = flagOuterRootYPx - (spacingPx * 1.0 * direction);

			context.beginPath();
			context.moveTo(flagOuterRootXPx, flagOuterRootYPx);
			context.bezierCurveTo(outerConvexXPx, outerConvexYPx,
								  outerConcaveXPx, outerConcaveYPx,
								  flagTipXPx, flagTipYPx);
			context.bezierCurveTo(flagTipXPx, flagTipYPx,
								  innerConcaveXPx, innerConcaveYPx,
								  flagOuterRootXPx, flagOuterRootYPx - (SUB_FLAG_WIDTH * direction));
			context.lineTo(stemRootXPx, flagOuterRootYPx);
			context.fill();
			context.stroke();
	

		}

	
		// Loop gjennom alle flagg i tillegg til det innerste
	
	}
};

Staff_Measure.prototype.renderRest = function(ticksLength, posXPx, posYPx){
	// The function attempts to get as close as possible to the received length value.
	// If the rest musit be written as two separate rests the function returns the
	// excess value.
	//alert("Setter inn pause med lengde: " + (ticksLength/Q_NOTE) + " Xp: x" + posXPx + " Ypx: " + posYPx );

	// 1) Find the resolution level of the rest(128? 64?)
	// 2) Find the length of the base rest
	// 3) Find the length vs resoultion ratio. = nr of dots.

	// Finding the base rest value
	var baseLength, remainingLength;
	//alert(ticksLength);
	for(var i = Q_NOTE * 8; i >= Q_NOTE / 32; i = i / 2){
		if(Math.floor(ticksLength / i) == 1){
			baseLength = i;
			remainingLength = ticksLength - baseLength;
			break;
		}
	}
	if(baseLength == Q_NOTE * 4){
		context.fillRect(posXPx, topY + spacingPx, spacingPx, spacingPx / 2);
	}
	else if(baseLength == Q_NOTE * 2){
		context.fillRect(posXPx, posYPx, spacingPx, spacingPx / 2);	
	}
	else if(baseLength == Q_NOTE){
		renderImage(4, posXPx, posYPx);
	}
	else{
		// 8th note rest or smaller:
		//alert("small rest detected)";
		
		//Calculating the number of ellipses to be drawn:
		posYPx -= spacingPx * 0.5;
		var nrOfEllipses = Math.log2(Q_NOTE / baseLength);
		//alert(nrOfEllipses);
		if(Math.floor(posYPx) == posYPx){ posYPx -= 0.5 * spacingPx; }
		var ellipseXPx = posXPx;
		var ellipseYPx = posYPx;
		var stemTiltFactor = 3; // The rising factorial of the stem
		var stemRootTiltFactorLeft = stemTiltFactor - 0.5;
		var stemLengthYAxisPx = nrOfEllipses * spacingPx;
		var stemWidthXPx = spacingPx * 0.07;
		var stemRootLengthYAxisPx = spacingPx * 0.70;
		var stemTopLeftXPx = posXPx + spacingPx * 0.7;
		var stemTopLeftYPx = posYPx - spacingPx * 0.2;
		var stemBotLeftXPx = stemTopLeftXPx - stemLengthYAxisPx /stemTiltFactor;
		var stemBotLeftYPx = stemTopLeftYPx + stemLengthYAxisPx;
		var stemTopRightXPx = stemTopLeftXPx + stemWidthXPx;
		var stemTopRightYPx = stemTopLeftYPx + stemWidthXPx / stemTiltFactor;
		

		// Drawing the stem:
		context.beginPath();
		context.moveTo(stemTopLeftXPx, stemTopLeftYPx);
		context.lineTo(stemBotLeftXPx, stemBotLeftYPx);
		context.lineTo(stemBotLeftXPx + stemWidthXPx, stemBotLeftYPx);
		context.lineTo(stemTopRightXPx, stemTopRightYPx);
		context.lineTo(stemTopLeftXPx, stemTopLeftYPx);
		context.fill();
		context.stroke();
	
		// Drawing the stem root:
		context.moveTo(stemBotLeftXPx, stemBotLeftYPx);
		context.lineTo(stemBotLeftXPx - stemRootLengthYAxisPx * (1 / stemRootTiltFactorLeft),
					   stemBotLeftYPx + stemRootLengthYAxisPx);
		context.lineTo(stemBotLeftXPx - spacingPx * 0.12,
					   stemBotLeftYPx + stemRootLengthYAxisPx);
		context.lineTo(stemBotLeftXPx + stemWidthXPx, stemBotLeftYPx);
		context.fill();
		context.stroke();



		var ellipseBranchUpperXPx = stemTopLeftXPx;
		var ellipseBranchUpperYPx = stemTopLeftYPx;
		for(var ellipseIx = 0; ellipseIx < nrOfEllipses; ellipseIx++){
			context.beginPath()
			context.ellipse(ellipseXPx, ellipseYPx, spacingPx * 0.26, spacingPx * 0.28, Math.PI * 0.10, 0, 2 * Math.PI);
			context.fill();
			context.stroke();
		 

					// Drawing the connection between ellipse and stem:
			context.moveTo(ellipseXPx + spacingPx * 0.26, ellipseYPx + spacingPx * 0.1);
			context.bezierCurveTo(ellipseXPx + spacingPx * 0.26, ellipseYPx + spacingPx * 0.1,
								  ellipseXPx + spacingPx * 0.5, ellipseYPx + spacingPx * 0.16,
								  ellipseBranchUpperXPx, ellipseBranchUpperYPx);

			context.lineTo(ellipseBranchUpperXPx - spacingPx * 0.2  * (1 / stemTiltFactor) , ellipseBranchUpperYPx + spacingPx * 0.2);
			context.bezierCurveTo(ellipseBranchUpperXPx - spacingPx * 0.2  * (1 / stemTiltFactor) , ellipseBranchUpperYPx + spacingPx * 0.2,
								  ellipseXPx + spacingPx * 0.4, ellipseYPx + spacingPx * 0.3,
								  ellipseXPx, ellipseYPx + spacingPx * 0.28);
			
			//context.lineTo(stemTopLeftXPx, stemTopLeftYPx);
			context.fill();
			context.stroke();


			//context.lineTo(stemTopL
			ellipseBranchUpperXPx -= spacingPx * (1 / stemTiltFactor);;
			ellipseBranchUpperYPx += spacingPx;
			ellipseXPx -= spacingPx * (1/stemTiltFactor);
			ellipseYPx += spacingPx;
		
		}

	}


	return remainingLength;
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

var GraphicTimeSignature = function(topNr, botNr, posRef, leftX, upperY){
	this.topNr = topNr;
	this.botNr = botNr;
	this.posRef = posRef;
	this.leftX = leftX;
	this.upperY = upperY;
	this.type = "time signature";
};

var TimeSignature = function(topNr, botNr, qNotePos, ticksPos){
	this.topNr = topNr;
	this.botNr = botNr;
	this.qNotePos = qNotePos;
	this.ticksPos = ticksPos;
	this.beamGroups = []; //An array of the tick length of the separate beamGroups
};

var Key = function(keyNr, qNotePos, ticksPos){
	this.keyNr = keyNr;
	this.qNotePos = qNotePos;
	this.ticksPos = ticksPos;
};

var Clef = function(clefNr, qNoteNr, ticksPos){
	this.clefNr = clefNr;
	this.qNoteNr = qNoteNr;
	this.ticksPos = ticksPos;
};


var NoteRest = function(isNote, noteNr, blwabv , ticksPos, ticksLength){
	this.isNote = isNote;
	this.noteNr = noteNr; // Middle c = 60 ( midi standard)
	this.blwabv = blwabv; // -1=if not in scale, note below with sharp/nat. 1: above 0:no opinioni.
	this.forceAcc = false;
	this.shownAcc = 99;
	this.ticksPos = ticksPos;
	this.ticksLength = ticksLength;
	this.Xpos;
	this.Ypos;
	this.imgNr;
	this.forcedStemDir = 0;
	this.stemLength = 0;
	this.stemXoffset;
	this.stemYoffset;
	this.type = "noteRest";
};

var PureNoteRest = function(noteNrArray, qNoteLength, ticksLength){
		this.noteNrArray = noteNrArray;
		this.qNoteLength = qNoteLength;
		this.ticksLength = ticksLength;
};



// Function to tell if a noteNr is a natural:
var noteIsInCScale = function(noteNr){
	var scaleStep = noteNr % 12;
	if(scaleStep == 1 || scaleStep == 3 || scaleStep == 6 || scaleStep == 8 || scaleStep == 10){
		return false;	
	}
	else { return true; }
};

// Object to store scalesteps resulting from temporary accidentals.
var CScaleVersion = new function(ticksPos){
	//this.steps = stepsArray;
	this.ticksPos = ticksPos;
}; 

/*
CScaleVersion.prototype.buildScale = function(prevScale, stepWithAcc, acc){
	this.steps = prevScale.steps;
	var cScale = [0, 2, 4, 5, 7, 9, 11];
	this.steps[stepWithAcc] = cScaleStep + acc;

};
*/

// Accidental object stored by staff measure to keep track of temp accidentals
var TmpAcc = function(ticksPos, cScaleStep, accValue){
	this.ticksPos = ticksPos;
	this.cScaleStep = cScaleStep;
	this.accValue = accValue;
}

//  a StaffTick is stored in the Staff everytime a tick has special needs: More width
// One width = spacing between staff lines.
var Tick = function(ticksPos, width){
	this.ticksPos = ticksPos;
	this.width = width;
}
