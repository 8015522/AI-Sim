function preload() {
	//soundRev = loadSound('stk_sounds/car_rev.mp3');
	//soundSkid = loadSound('stk_sounds/skid.wav');
	//soundEngine = loadSound('stk_sounds/engine_large.wav');
}

//Buttons
humanStartButton = new Clickable();
aiStartButton = new Clickable();
restartButton = new Clickable();
resetTimeButton = new Clickable();
aboutButton = new Clickable();
clickableDefault = new Clickable();

function setup() {
	createCanvas(document.body.clientWidth, windowHeight * 0.96);

	gameDebug = false; //Toggles debug hud and keys

	//PHYSICS
	// Subtracting x and y by half of width or height makes the game start in the same spot, ignoring screen size.
	startX = 650 - width / 2;
	startY = -100 - height / 2;
	carPos = createVector(startX, startY); // Car position
	vx = 0;
	vy = 0;
	v = 0;
	a = PI / 1000;//no paralels
	maxV = 2350;//2000 2300-2350  //change this to aproach 1 min
	maxVRev = (maxV / 6) * -1;///6
	turnRate = 0;
	brakeFric = 0.85;
	fric = 0.99;
	bounceFriction = 0.55;//0.55
	maxTurnRate = (PI / 81) * (maxV / 30000);
	turnDelta = PI / 10000;//15000

	//TIMER
	timer = 0;

	//OBJECTS
	track = [];
	customTrack();
	//georgesTrack();

	//ghost
	myGhost = [];


	dispGhost = null;


	//Button locations and sizes
	humanStartButton.textScaled = true;
	humanStartButton.resize(width / 5, height / 6);
	humanStartButton.locate(width / 2 - humanStartButton.width / 2, height / 2 - humanStartButton.height / 2);
	aiStartButton.resize(humanStartButton.width, humanStartButton.height);
	aiStartButton.locate(humanStartButton.x, humanStartButton.y + humanStartButton.height * 1.25);
	restartButton.resize(humanStartButton.width / 2, humanStartButton.height / 2);
	aiStartButton.textSize = humanStartButton.textSize;
	resetTimeButton.y = height - resetTimeButton.height;
	humanStartButton.text = "Human Vision";
	aiStartButton.text = "AI Vision";
	startMenu = true;
	victory = false;
	restartButton.text = "🔄";
	restartButton.textScaled = true;
	resetTimeButton.text = "Reset Times";
	about = false;
	aboutButton.textSize = resetTimeButton.textSize;
	aboutButton.locate(width - aboutButton.width, height - aboutButton.height);
	aboutButton.text = "About";



	//Variables for car position
	carX = width / 2 - 10;
	carY = height / 2 - 20;
	carW = 20;
	carH = 40;

	//Sound Settings
	/* soundEngine.setVolume(0.25);
	soundEngine.playMode('untilDone');
	soundSkid.playMode('untilDone'); */

	if (!gameDebug) p5.disableFriendlyErrors = true;


	colorMode(HSB);

	//SETUP BACKGROUND
	rate = 0.25;
	g = -10;
	gPow = 1.2;
	pts = [];
	totalPts = sqrt(width * height) / 40;
	for (i = 0; i < totalPts; i++) {
		pts[pts.length] = new pt();
	}

	//timer starting after gas pressed delay
	start = false;


}

function draw() {
	rainbow = color((frameCount / 5) % 360, 100, 75);
	pulse = 5 + 2*cos(frameCount / 20);
	if (startMenu) {
		background('black');
		//PIN BACKGROUND
		drawPins();
		textStyle(BOLD);
		textSize(humanStartButton.textSize * 3);
		stroke(rainbow);
		strokeWeight(pulse);
		text("AI Racing Simulator", width / 2, height / 4);
		humanStartButton.draw();
		aiStartButton.draw();
		resetTimeButton.draw();
		aboutButton.draw();
		// soundEngine.stop();
		if (gameDebug) text("gameDebug is true", 100, 100);
	}

	else if (about) {
		background('black');
		drawPins();
		textStyle(NORMAL);
		textSize(16);
		fill('white');
		stroke('black')
		rectMode(CENTER);
		//Text will wrap, but \n can be used to force a new line.
		text("The AI Sim is an educational tool to help players understand how neural networks function. In this case, the game that the neural network is playing is a basic racing game. Neural networks connect inputs to neurons or perceptrons to create an algorithm to play the game. You are given limited information, as a neural network would be, to complete the track in the faster time possible. All you know is the distance that the track is in a few directions. \n\nLibraries Used:\n• p5.js\n• p5.sound\n• p5.collide2D\n• p5.clickable", width / 2, height / 4, width * (7 / 8), height * (7 / 8));
		rectMode(CORNER);
		restartButton.locate(width / 2 - restartButton.width / 2, height * (7 / 8) - restartButton.height / 2);
		restartButton.strokeWeight = (1 + cos(frameCount / 20));
		restartButton.stroke = rainbow;
		restartButton.draw();

	}

	else if (victory) {
		background('black');
		//PIN BACKGROUND
		drawPins();
		// soundEngine.stop();
		textSize(90);
		text("Race Complete!", width / 2, height / 2);

		if (aiVision) drawClock("ai");
		else drawClock("human");

		restartButton.locate(width / 2 - restartButton.width / 2, height * 0.75 - restartButton.height / 2);
		restartButton.stroke = rainbow;
		restartButton.strokeWeight = (1 + cos(frameCount / 20));
		restartButton.draw();
	} else if (aiVision) {
		background('snow');
		// Stuff for what the AI would see goes here
		physics();
		collision();
		rayTracing();

		//grid();
		ghost();
		car();

		clock("ai");
		textStyle(NORMAL);
		//if (keyIsDown(SHIFT)) text("DRIFTING", width / 2, height * 0.9);
		restartButton.locate(width * 0.9 - restartButton.width, height * 0.9 - restartButton.height);
		restartButton.stroke = color(0);
		restartButton.strokeWeight = 1;
		restartButton.draw();
	} else { // Human vision
		background('snow');
		/* 
				x += (mouseX - width / 2) / 10;
				y += (mouseY - height / 2) / 10;
	 */

		//Try to put things in functions outside of draw, it makes performance profiling work better

		// soundEngine.play();

		physics();

		collision();


		//DRAW

		rayTracing();

		grid();

		drawTrack();

		ghost();

		minimap();

		car();

		clock("human");

		debugHud();

		restartButton.locate(width * 0.9 - restartButton.width, height * 0.9 - restartButton.height);
		restartButton.stroke = color(0);
		restartButton.strokeWeight = 1;
		restartButton.draw();
	}

}
//INPUT POSITIONS INTO THIS FUNCTION TO DISPLAY!!!
function translateX(ax, ay) {
	ax -= carPos.x;
	ay -= carPos.y;
	aa = getTheta(width / 2, height / 2, ax, ay);
	return width / 2 + dist(width / 2, height / 2, ax, ay) * cos(aa - a);
}
//INPUT POSITIONS INTO THIS FUNCTION TO DISPLAY!!!
function translateY(ax, ay) {
	ax -= carPos.x;
	ay -= carPos.y;
	aa = getTheta(width / 2, height / 2, ax, ay);
	return height / 2 + dist(width / 2, height / 2, ax, ay) * sin(aa - a);
}

function atranslateX(ax, ay) {
	return carPos.x + dist(width / 2, height / 2, ax, ay) * cos(a);
}
function atranslateY(ax, ay) {
	return carPos.y + dist(width / 2, height / 2, ax, ay) * sin(a);
}

//RETURN THE ANGLE BETWEEN TWO POINTS
function getTheta(ax, ay, bx, by) {
	if (bx - ax >= 0) {
		return atan((by - ay) / (bx - ax));
	} else {
		return atan((by - ay) / (bx - ax)) + PI;
	}
}
//RETURN THE DIFFERENCE IN ANGLES
function getDiff(a, b) {
	a = (a + TWO_PI) % (TWO_PI);
	b = (b + TWO_PI) % (TWO_PI);
	minn = b - a;
	if (abs(b - (a + TWO_PI))) {
		minn = b - (a + TWO_PI);
	}
	if (abs(b - (a - TWO_PI))) {
		minn = b - (a - TWO_PI);
	}
	return minn;
}
function getDiffNeg(a, b) {
	a = (a + TWO_PI) % (TWO_PI);
	b = (b + TWO_PI) % (TWO_PI);
	minn = b - a;
	if (abs(b - (a + TWO_PI))) {
		minn = b - (a + TWO_PI);
	}
	if (abs(b - (a - TWO_PI))) {
		minn = b - (a - TWO_PI);
	}
	return minn;
}

//GHOST CAR OBJECT
class GhostPt extends p5.Vector {
	constructor(x, y, a, sco) {
		super(x, y);
		this.a = a;
		this.sco = sco;
	}
}
//ADD KEYS
function keyPressed() {
	if (gameDebug) {
		if (key == 'b') {
			carPos.rotate(QUARTER_PI);
		}
		if (key == 'v') {
			carPos.rotate(PI / 64);
		}
	}
}
function keyReleased() {
	if (key == SHIFT) {
		v = 5 * maxV;
		vx = 5 * maxV * cos(a);
		vy = 5 * maxV * sin(a);
	}
}

function intersect(index, angle) {
	angle += a;
	//console.debug(index + " " + ( (index-1)%(track.length-1))); // Hunting a bug

	let as = tan(getTheta(track[index].x, track[index].y, track[(index + track.length - 2) % (track.length - 1)].x, track[(index + track.length - 2) % (track.length - 1)].y));

	//ray
	let rs = tan(angle % (TWO_PI));

	//find intersection point with ray tracing and math

	return createVector((carPos.y - track[index].y + (as * track[index].x) - (rs * carPos.x)) / (as - rs), rs * (ix - carPos.x) + carPos.y);
}

humanStartButton.onRelease = function () {
	startMenu = false;
	aiVision = false;
	if (getItem("humanBestGhost") != null) bestGhost = getItem("humanBestGhost"); //Load bestGhost from storage if it exists.
	else bestGhost = [];
	// soundRev.play();
}

humanStartButton.onPress = function () {
	humanStartButton.color = rainbow
	//humanStartButton.color = "#0000ff";
}

humanStartButton.onOutside = function () {
	humanStartButton.color = clickableDefault.color;
	humanStartButton.stroke = clickableDefault.stroke;
	humanStartButton.strokeWeight = clickableDefault.strokeWeight;

}

humanStartButton.onHover = function () {
	humanStartButton.color = color('grey');
	humanStartButton.stroke = rainbow;
	humanStartButton.strokeWeight = (pulse);
	//humanStartButton.color = "#faebd7";
}

aiStartButton.onRelease = function () {
	startMenu = false;
	aiVision = true;
	if (getItem("aiBestGhost") != null) bestGhost = getItem("aiBestGhost"); //Load bestGhost from storage if it exists.
	else bestGhost = [];
}

aiStartButton.onPress = function () {
	aiStartButton.color = rainbow;
	//aiStartButton.color = "#0000ff";
}

aiStartButton.onOutside = function () {
	aiStartButton.color = clickableDefault.color;
	aiStartButton.stroke = clickableDefault.stroke;
	aiStartButton.strokeWeight = clickableDefault.strokeWeight;
}

aiStartButton.onHover = function () {
	aiStartButton.color = color('grey');
	aiStartButton.stroke = rainbow;
	aiStartButton.strokeWeight = pulse;
	//aiStartButton.color = "#faebd7";
}

restartButton.onRelease = function () {
	carPos.set(startX, startY);
	v = 0;
	a = PI / 1000;//no paralels
	turnRate = 0;
	timer = 0;
	startMenu = true;
	victory = false;
	myGhost = [];
	dispGhost = null;
	start = false;
	about = false;
}

restartButton.onPress = function () {
	restartButton.color = rainbow;
	//restartButton.color = "#0000ff";
}

restartButton.onOutside = function () {
	restartButton.color = "#ffffff";
}

restartButton.onHover = function () {
	restartButton.color = color('grey');
	//restartButton.color = "#faebd7";
}

resetTimeButton.onRelease = function () {
	clearStorage();
	myGhost = [];
	bestGhost = [];
}

resetTimeButton.onPress = function () {
	resetTimeButton.color = rainbow;
	//resetTimeButton.color = "#0000ff";
}

resetTimeButton.onOutside = function () {
	resetTimeButton.color = clickableDefault.color;
	resetTimeButton.stroke = clickableDefault.stroke;
	resetTimeButton.strokeWeight = clickableDefault.strokeWeight;
}

resetTimeButton.onHover = function () {
	resetTimeButton.color = color('grey');
	resetTimeButton.stroke = rainbow;
	resetTimeButton.strokeWeight = (pulse);
	//resetTimeButton.color = "#faebd7";
}

aboutButton.onRelease = function () {
	startMenu = false;
	about = true;
}

aboutButton.onPress = function () {
	aboutButton.color = rainbow;
	//aboutButton.color = "#0000ff";
}

aboutButton.onOutside = function () {
	aboutButton.color = clickableDefault.color;
	aboutButton.stroke = clickableDefault.stroke;
	aboutButton.strokeWeight = clickableDefault.strokeWeight;
}


aboutButton.onHover = function () {
	aboutButton.color = color('grey');
	aboutButton.stroke = rainbow;
	aboutButton.strokeWeight = (pulse);
	//aboutButton.color = "#faebd7";
}

function physics() {
	//PHYSICS
	if (keyIsDown(87) || keyIsDown(UP_ARROW)) { //w
		if (v > -0.5) { // If the car has too much velocity in the wrong direction, slow down instead of going the other way
			v += (maxV - v) / 64;
		} else {
			v *= brakeFric;
		}
	}
	if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) { //s
		if (v < 0.5) {
			v += (maxVRev - v) / 27;
		} else {
			v *= brakeFric;
		}
	} else {
		v *= fric;
	}
	if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) { //a
		if (turnRate < maxTurnRate) { // Gradually turn faster if the turning speed is below a maximum
			turnRate += turnDelta;
		}
	} else {
		if (turnRate > -0.001) { // Slows the turning back down when key is released
			turnRate *= brakeFric;
		}
	}
	if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) { //d
		if (turnRate > (maxTurnRate * -1)) {
			turnRate -= turnDelta;
		}
	} else {
		if (turnRate < 0.001) {
			turnRate *= brakeFric;
		}
	}
	if (keyIsDown(SHIFT)) {
		if (false && abs(getDiff(getTheta(0, 0, vx, vy), a)) < TWO_PI) {
			a += (turnRate * 1.5 * (v / maxV) * deltaTime);
		} else {
			//a -= (turnRate * 1.5 * (v / maxV) * deltaTime);
			a -= turnRate * deltaTime;
		}
	} else {
		a -= ((turnRate * (norm(v, 0, maxV))) * deltaTime); // Changes amount of turning based on velocity
	}
	if (!keyIsDown(SHIFT)) { // Drifting
		vx = v * cos(a - HALF_PI);
		vy = v * sin(a - HALF_PI);
		// soundSkid.stop();
	} else {
		vx += v * cos(a - HALF_PI) / 70;//80
		vy += v * sin(a - HALF_PI) / 70;//80
		vx *= 0.99;
		vy *= 0.99;
		// if ((v > 0.01 || v < -0.01) && !aiVision)  soundSkid.play();
	}
	let velocity = dist(carPos.x, carPos.y, carPos.x + (vx * deltaTime) / 1500, carPos.y + (vy * deltaTime) / 1500);
	//text(int(velocity / 3), 300, 30);
	carPos.add((vx * deltaTime) / 1500, (vy * deltaTime) / 1500);
}

function clock(prefix) {
	//timer
	//increase
	if (!start && (keyIsDown(87) || keyIsDown(65) || keyIsDown(83) || keyIsDown(68) || keyIsDown(UP_ARROW) || keyIsDown(LEFT_ARROW) || keyIsDown(DOWN_ARROW) || keyIsDown(RIGHT_ARROW))) {
		start = true;
	}

	if (start) {
		timer += deltaTime;
	}
	
	//passing the finish line
	if (collideLineRect(translateX(track[track.length / 2 - 2].x, track[track.length / 2 - 2].y), translateY(track[track.length / 2 - 2].x, track[track.length / 2 - 2].y), translateX(track[track.length - 1].x, track[track.length - 1].y), translateY(track[track.length - 1].x, track[track.length - 1].y), carX, carY, carW, carH)) {
		if (getItem(prefix + "bestTime") == null || getItem(prefix + "bestTime") < 1000 || (timer < getItem(prefix + "bestTime") && timer > 3000)) {
			storeItem(prefix + "bestTime", timer);
			//make ghost of best
			
			bestGhost = [];
			for(i=0; i<myGhost.length; i++) {
				bestGhost[bestGhost.length] = myGhost[i];
			}
			

			storeItem(prefix + "BestGhost", myGhost);
			myGhost = [];
		}
		victory = true;
	}
	drawClock(prefix);
}

function drawClock(prefix) {
	stroke('black');
	strokeWeight(1);
	textStyle(NORMAL);

	//Deals with adding 0s to the time display then shows it
	textSize(30);
	bestTimeM = int(getItem(prefix + "bestTime") / 1000 / 60);
	bestTimeS = int(getItem(prefix + "bestTime") / 1000 % 60);
	bestTimeMS = int(getItem(prefix + "bestTime") % 1000);
	if (getItem(prefix + "bestTime") > 1) {
		if (bestTimeS < 10) bsPrefix = ":0";
		else bsPrefix = ":";
		if (bestTimeMS < 10) bmsPrefix = ":00";
		else if (bestTimeMS < 100) bmsPrefix = ":0";
		else bmsPrefix = ":";
		text("Best Time: " + bestTimeM + bsPrefix + bestTimeS + bmsPrefix + bestTimeMS, width / 2, 130);
	}

	timerM = int(timer / 1000 / 60);
	timerS = int(timer / 1000 % 60);
	timerMS = int(timer % 1000);
	if (timerS < 10) sPrefix = ":0";
	else sPrefix = ":";
	if (timerMS < 10) msPrefix = ":00";
	else if (timerMS < 100) msPrefix = ":0";
	else msPrefix = ":";
	text("Time : " + timerM + sPrefix + timerS + msPrefix + timerMS, width / 2, 100);
}

function collision() {

	for (i = 1; i < track.length; i++) {
		if (collideLineRect(translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), carX, carY, carW, carH)) {
			//Vibrate the device on collision. deltaTime is so it runs until roughly when the next check will be.
			window.navigator.vibrate(deltaTime * 2);
			//trackA goes from -0.5PI to 1.5PI
			let trackA = getTheta(track[i - 1].x, track[i - 1].y, track[i].x, track[i].y);
			trackA = (trackA + TWO_PI) % (TWO_PI);
			// let carA = getTheta(0, 0, vx, vy);


			let diff = (getDiff(trackA, a) + TWO_PI) % (TWO_PI);


			//ANGLE COLLISION
			// a : trackA
			//  agree
			//    a ---> trackA
			//  disagree
			//    a ---> trackA + PI
			//
			//let smooth = 32;

			if (diff < PI) {
				a = trackA + PI / 2;


				//let qwe = getDiff(trackA + PI/2, a);
				//a += PI / smooth * abs(qwe) / qwe;
			} else {
				a = trackA + PI + PI / 2;
				//let qwe = getDiff(trackA + PI + PI/2, a);
				//a -= PI / smooth * abs(qwe) / qwe;
			}


			//VELOCITY COLLISION
			// carA : trackA
			//  carA reflect perpendicular to trackA
			//
			let vel = dist(0, 0, vx, vy) * bounceFriction;
			v * bounceFriction;
			let newA = trackA + getDiff(getTheta(0, 0, vx, vy), trackA);
			vx = vel * cos(newA);
			vy = vel * sin(newA);

			//POSITION COLLISION
			// carA : trackA
			//  VA right trackA
			//    shift left
			//  VA left trackA
			//    shift right
			//
			let shiftBuffer = 5;
			if (HALF_PI < diff && diff < PI * 3 / 2) {
				carPos.x += shiftBuffer * cos(trackA - PI / 2);
				carPos.y += shiftBuffer * sin(trackA - PI / 2);
				vx += shiftBuffer * cos(trackA - PI / 2);
				vy += shiftBuffer * sin(trackA - PI / 2);
			} else if (diff != HALF_PI && diff != PI * 3 / 2) {
				carPos.x += shiftBuffer * cos(trackA + PI / 2);
				carPos.y += shiftBuffer * sin(trackA + PI / 2);
				vx += shiftBuffer * cos(trackA + PI / 2);
				vy += shiftBuffer * sin(trackA + PI / 2);
			}




			if (gameDebug) {
				fill('green');
				stroke('black');
				//same direction
				if (diff < PI) {
					arc(100, 100, 50, 50, PI * 5 / 4, PI * 7 / 4);

					//angle
					let rebA = 0;
					let cosa = getDiffNeg(a, trackA + PI / 2);
					if (cosa > 2 * PI) {
						if (cosa + PI / 32 > TWO_PI)
							a += PI / 64;
						print("up left");
						rebA = trackA + getDiff(a, trackA + PI / 2 - PI / 2);
					} else {
						if (cosa - PI / 32 < TWO_PI)
							a -= PI / 64;
						rebA = trackA + PI + getDiff(a, trackA + PI / 2 + PI / 2);
					}

					// a = trackA + PI / 2;

					//let rebA = getDiff(a, trackA + PI/2);
					//velocity
					vx = vel * cos(rebA);
					vy = vel * sin(rebA);

					//different direction
				} else {
					arc(100, 100, 50, 50, QUARTER_PI, PI * 3 / 4);

					//angle
					let cosa = getDiffNeg(a, trackA + PI + HALF_PI);
					if (cosa > TWO_PI) {
						if (cosa + PI / 32 > TWO_PI)
							a += PI / 64;
					} else {
						if (cosa - PI / 32 < TWO_PI)
							a -= PI / 64;
					}

					if (a < trackA + PI + PI / 2) {
						a += PI / 64;
					} else {
						a -= PI / 64;
					}

					//a = trackA + PI + PI / 2;


					//velocity
					vx = vel * cos(a);
					vy = vel * cos(a);

				}
				//right
				if (HALF_PI < diff && diff < PI * 3 / 2) {
					arc(100, 100, 50, 50, PI * 7 / 4, PI * 9 / 4);

					//position
					x += 10 * cos(trackA - PI / 2);
					y += 10 * sin(trackA - PI / 2);

					//left
				} else {
					arc(100, 100, 50, 50, PI * 3 / 4, PI * 5 / 4);

					//position
					x += 10 * cos(trackA + PI / 2);
					y += 10 * sin(trackA + PI / 2);

				}
				fill('black');
				arc(200, 200, 50, 50, 0, -diff);
				if (getDiff(trackA, a) < HALF_PI) {
					//a = trackA + PI / 2;
					//print("agree");
				} else {
					//a = trackA + PI / 2 + PI;
					//print("dis");
				}
				fill('black');
			}
		}
	}
}

// If you decide to ever implement an ai in this, you need i, r.x, and r.y that are generated by this

function rayTracing() {

	let lines = 16;//16
	strokeWeight(30);

	for (i = 1; i <= track.length; i++) {
		if (i != track.length) {
			if ((dist(carPos.x, carPos.y, track[i].x, track[i].y) <= sqrt(sq(width) * sq(height)) || dist(x, y, track[i - 1].x, track[i - 1].y) <= sqrt(sq(width) * sq(height))) && (i != track.length / 2)) { // Check if track lines are close to car before running collision

				for (j = 0; j < TWO_PI; j += TWO_PI / lines) {
					let r = collideLineLine(width / 2 + width * cos(j), height / 2 + width * sin(j), width / 2, height / 2, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
					if (r.x != false) {
						stroke(map(j, 0, TWO_PI, 0, 360), 50, 100);
						strokeWeight(30);
						point(r.x, r.y);
						stroke('black');
						strokeWeight(0.2);
						line(width / 2, height / 2, r.x, r.y);
						stroke(map(j, 0, TWO_PI, 0, 360, true), 50, 100);
						strokeWeight(30);
					}
				}
			}
		}
		else {
			if ((dist(carPos.x, carPos.y, track[track.length / 2].x, track[track.length / 2].y) <= sqrt(sq(width) * sq(height)) || dist(x, y, track[i - 1].x, track[i - 1].y) <= sqrt(sq(width) * sq(height))) && (i != track.length / 2)) { // Check if track lines are close to car before running collision

				for (j = 0; j < TWO_PI; j += TWO_PI / lines) {
					let r = collideLineLine(width / 2 + width * cos(j), height / 2 + width * sin(j), width / 2, height / 2, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[track.length / 2].x, track[track.length / 2].y), translateY(track[track.length / 2].x, track[track.length / 2].y), true);
					if (r.x != false) {
						stroke(map(j, 0, TWO_PI, 0, 360, true), 50, 100);
						point(r.x, r.y);
					}
				}
			}
		}
	}
}

function grid() {
	gridSpace = 80;
	strokeWeight(0.2);
	stroke('black');
	//Get some points around the car to start and end the grid
	gridYDown = carPos.y - (height * 2 + carPos.y % gridSpace);
	gridYUp = carPos.y + (height * 2 + carPos.y % gridSpace);
	gridXDown = carPos.x - (width * 2 + carPos.x % gridSpace);
	gridXUp = carPos.x + (width * 2 + carPos.x % gridSpace);
	//Draw the grid around the car
	for (i = gridXDown; i < gridXUp; i += gridSpace) {
		line(translateX(i, gridYDown), translateY(i, gridYDown), translateX(i, gridYUp), translateY(i, gridYUp));
	}

	for (i = gridYDown; i < gridYUp; i += gridSpace) {
		line(translateX(gridXDown, i), translateY(gridXDown, i), translateX(gridXUp, i), translateY(gridXUp, i));
	}
}

function drawTrack() {

	//track
	fill('black');
	for (i = 0; i < track.length; i++) {

		if (dist(carPos.x, carPos.y, track[i].x, track[i].y) < 2 * sqrt(sq(width) + sq(height))) {
			let tx = translateX(track[i].x, track[i].y);
			let ty = translateY(track[i].x, track[i].y);

			if (i != 0) {
				stroke('black');
				strokeWeight(3);
				line(tx, ty, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y));
				line(translateX(track[track.length - 2].x, track[track.length - 2].y), translateY(track[track.length - 2].x, track[track.length - 2].y), translateX(track[track.length / 2].x, track[track.length / 2].y), translateY(track[track.length / 2].x, track[track.length / 2].y));
			}
			if (gameDebug) {
				stroke('green');
				textSize(30);
				text(i, translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y));

				stroke('black');
				circle(tx, ty, 5);
				if (i == int(track.length * 1 / 4)) {
					circle(tx, ty, 20);
				}
			}
		}
	}
}

function ghost() {
	//create my ghost
	myGhost[myGhost.length] = new GhostPt(carPos.x, carPos.y, a, timer);
	//display best ghost

	ghostSearch:
	for (i = bestGhost.length - 1; i >= 0; i--) {
		if (abs(bestGhost[i].sco - timer) <= deltaTime) {
			dispGhost = bestGhost[i];
			break ghostSearch;
		}
	}
	if (dispGhost != null) {
		strokeWeight(1);
		fill('lightgrey');
		//minimap
		circle((dispGhost.x + width / 2) / 100 + width - 180, (dispGhost.y + height / 2) / 100 + 30, 5);
		//real
		gx = translateX(dispGhost.x + width / 2, dispGhost.y + height / 2);
		gy = translateY(dispGhost.x + width / 2, dispGhost.y + height / 2);
		//circle(gx, gy, 40);

		quad(
			gx + 25 * cos(dispGhost.a - a + PI / 8 + HALF_PI), gy + 25 * sin(dispGhost.a - a + PI / 8 + HALF_PI),
			gx + 25 * cos(dispGhost.a - a - PI / 8 + HALF_PI), gy + 25 * sin(dispGhost.a - a - PI / 8 + HALF_PI),
			gx + 25 * cos(dispGhost.a - a + PI / 8 + PI + HALF_PI), gy + 25 * sin(dispGhost.a - a + PI / 8 + PI + HALF_PI),
			gx + 25 * cos(dispGhost.a - a - PI / 8 + PI + HALF_PI), gy + 25 * sin(dispGhost.a - a - PI / 8 + PI + HALF_PI)
		);
	}
}

function minimap() {
	strokeWeight(0.5);
	let mapScale = 100;
	let mapShiftX = 180;
	let mapShiftY = 30;
	for (i = 0; i < track.length; i++) {
		line(
			track[i].x / mapScale + width - mapShiftX,
			track[i].y / mapScale + mapShiftY,
			track[(i + 1) % (track.length - 1)].x / mapScale + width - mapShiftX,
			track[(i + 1) % (track.length - 1)].y / mapScale + mapShiftY);
	}
	fill('red');
	circle(
		(carPos.x + width / 2) / mapScale + width - mapShiftX,
		(carPos.y + height / 2) / mapScale + mapShiftY, 5);
	fill('yellow');
	circle(
		(carPos.x + width / 2) / mapScale + width - mapShiftX + 3 * cos(a - HALF_PI),
		(carPos.y + height / 2) / mapScale + mapShiftY + 3 * sin(a - HALF_PI), 4);
	strokeWeight(1);
}

function car() {
	colorMode(RGB);
	fill(255, 255, 0, 100);
	noStroke();
	triangle(width / 2 - 5, height / 2 - 5, width / 2 - 15, height / 2 - 55, width / 2 + 5, height / 2 - 55);
	triangle(width / 2 + 5, height / 2 - 5, width / 2 + 10 - 15, height / 2 - 55, width / 2 + 10 + 5, height / 2 - 55);
	arc(width / 2 + 5, height / 2 - 55, 20, 40, PI, 0);
	arc(width / 2 - 5, height / 2 - 55, 20, 40, PI, 0);
	fill('red');
	noStroke();
	rect(carX, carY, carW, carH);
	fill('black');
	arc(width / 2 - 10, height / 2 - 10, 5, 10, HALF_PI, PI * 3 / 2);
	arc(width / 2 - 10, height / 2 + 10, 5, 10, HALF_PI, PI * 3 / 2);
	arc(width / 2 + 10, height / 2 - 10, 5, 10, -1 * HALF_PI, HALF_PI);
	arc(width / 2 + 10, height / 2 + 10, 5, 10, -1 * HALF_PI, HALF_PI);
	rect(width / 2 - 7.5, height / 2 - 6, 15, 20);
	colorMode(HSB);
}

function debugHud() {
	if (gameDebug) {
		textAlign(LEFT);
		textStyle(NORMAL);
		textFont("monospace");
		textSize(12);
		text("x         = " + int(carPos.x * 100) / 100, 15, 30);
		text("y         = " + int(carPos.y * 100) / 100, 15, 45);
		text("v         = " + int(v * 100) / 100, 15, 15);
		text("a         = " + (int(((a / PI) % -2) * 100) / 100) + "π", 15, 60);
		text("turnRate  = " + int(turnRate * 128 * 100 / PI) / 100 + "/128 π", 15, 75);
		text("frameRate = " + int(frameRate()), 15, 90);
	}
}

function newTrack(x, y) {
	track[track.length] = createVector(track[track.length - 1].x + x, track[track.length - 1].y + y);
}

//DRAWING LINES AND PINS
function drawPins() {
	stroke('white');
	strokeWeight(1);
	/* line(width / 2, height / 2 + 5, width / 2, height / 2 - 5);
	line(width / 2 + 5, height / 2, width / 2 - 5, height / 2); */
	for (i = 0; i < pts.length; i++) {
		pts[i].update();
		for (j = 0; j < pts.length; j++) {
			if (j != i) {
				//LINES
				stroke(rainbow);
				let d = dist(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
				let range = sqrt(width*height/10);
				let maxStroke = 3;
				if (d < range) {
					strokeWeight(-d / (range / maxStroke) + maxStroke);
					line(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
					strokeWeight((-d / (range / maxStroke) + maxStroke) / 2);
					stroke('white');
					line(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
				}
			}
		}
	}
}

//BACKGROUND DISPLAY CLASS
class pt {
	constructor() {
		this.x = random(0, width);
		this.y = random(0, height);
		let v = random(-2, 2);
		let a = getTheta(width / 2, height / 2, this.x, this.y);
		this.vx = v * cos(a + PI / 2);
		this.vy = v * sin(a + PI / 2);
	}
	update() {
		let gx = width / 2;
		let gy = height / 2;
		let d = dist(this.x, this.y, gx, gy);
		let a = getTheta(gx, gy, this.x, this.y);
		//grav
		this.vx += g / pow(d, gPow) * cos(a) * rate;
		this.vy += g / pow(d, gPow) * sin(a) * rate;
		//friction
		if (d > width) {
			this.vx *= 0.95;
			this.vy *= 0.95;
		}
		this.x += this.vx * rate;
		this.y += this.vy * rate;
		noStroke();
		fill('white');
		//circle(this.x, this.y, 10);
	}
}

function customTrack() {
	track[track.length] = createVector(450, 100);
	track[track.length] = createVector(track[track.length - 1].x + 0, track[track.length - 1].y - 150);
	track[track.length] = createVector(track[track.length - 1].x + 0, track[track.length - 1].y - 150);
	track[track.length] = createVector(track[track.length - 1].x + 50, track[track.length - 1].y - 150);
	track[track.length] = createVector(track[track.length - 1].x + 100, track[track.length - 1].y - 250);
	track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y - 200);
	track[track.length] = createVector(track[track.length - 1].x + 200, track[track.length - 1].y - 150);
	track[track.length] = createVector(track[track.length - 1].x + 250, track[track.length - 1].y - 100);
	track[track.length] = createVector(track[track.length - 1].x + 300, track[track.length - 1].y - 50);
	track[track.length] = createVector(track[track.length - 1].x + 300, track[track.length - 1].y - 0);
	track[track.length] = createVector(track[track.length - 1].x + 500, track[track.length - 1].y - 0);
	track[track.length] = createVector(track[track.length - 1].x + 300, track[track.length - 1].y - 50);
	track[track.length] = createVector(track[track.length - 1].x + 300, track[track.length - 1].y - 150);
	track[track.length] = createVector(track[track.length - 1].x + 300, track[track.length - 1].y - 50);
	track[track.length] = createVector(track[track.length - 1].x + 300, track[track.length - 1].y - 0);
	track[track.length] = createVector(track[track.length - 1].x + 300, track[track.length - 1].y + 50);
	track[track.length] = createVector(track[track.length - 1].x + 300, track[track.length - 1].y + 150);
	track[track.length] = createVector(track[track.length - 1].x + 250, track[track.length - 1].y + 250);
	track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y + 300);
	track[track.length] = createVector(track[track.length - 1].x + 50, track[track.length - 1].y + 300);
	track[track.length] = createVector(track[track.length - 1].x + 0, track[track.length - 1].y + 300);
	track[track.length] = createVector(track[track.length - 1].x - 100, track[track.length - 1].y + 300);
	track[track.length] = createVector(track[track.length - 1].x - 150, track[track.length - 1].y + 250);
	track[track.length] = createVector(track[track.length - 1].x - 200, track[track.length - 1].y + 200);
	track[track.length] = createVector(track[track.length - 1].x - 150, track[track.length - 1].y + 150);
	track[track.length] = createVector(track[track.length - 1].x - 250, track[track.length - 1].y + 50);
	track[track.length] = createVector(track[track.length - 1].x - 300, track[track.length - 1].y + 0);

	track[track.length] = createVector(track[track.length - 1].x - 100, track[track.length - 1].y + 10);
	track[track.length] = createVector(track[track.length - 1].x - 90, track[track.length - 1].y + 20);
	track[track.length] = createVector(track[track.length - 1].x - 80, track[track.length - 1].y + 30);
	track[track.length] = createVector(track[track.length - 1].x - 70, track[track.length - 1].y + 40);
	track[track.length] = createVector(track[track.length - 1].x - 60, track[track.length - 1].y + 50);
	track[track.length] = createVector(track[track.length - 1].x - 50, track[track.length - 1].y + 60);
	track[track.length] = createVector(track[track.length - 1].x - 40, track[track.length - 1].y + 70);
	track[track.length] = createVector(track[track.length - 1].x - 30, track[track.length - 1].y + 80);
	track[track.length] = createVector(track[track.length - 1].x - 20, track[track.length - 1].y + 90);
	track[track.length] = createVector(track[track.length - 1].x - 10, track[track.length - 1].y + 100);
	track[track.length] = createVector(track[track.length - 1].x + 0, track[track.length - 1].y + 90);
	track[track.length] = createVector(track[track.length - 1].x + 10, track[track.length - 1].y + 80);
	track[track.length] = createVector(track[track.length - 1].x + 20, track[track.length - 1].y + 70);
	track[track.length] = createVector(track[track.length - 1].x + 30, track[track.length - 1].y + 60);
	track[track.length] = createVector(track[track.length - 1].x + 40, track[track.length - 1].y + 50);
	track[track.length] = createVector(track[track.length - 1].x + 50, track[track.length - 1].y + 40);
	track[track.length] = createVector(track[track.length - 1].x + 60, track[track.length - 1].y + 30);
	track[track.length] = createVector(track[track.length - 1].x + 70, track[track.length - 1].y + 20);
	track[track.length] = createVector(track[track.length - 1].x + 80, track[track.length - 1].y + 10);
	track[track.length] = createVector(track[track.length - 1].x + 90, track[track.length - 1].y + 0);
	track[track.length] = createVector(track[track.length - 1].x + 100, track[track.length - 1].y + 0);

	track[track.length] = createVector(track[track.length - 1].x + 200, track[track.length - 1].y + 0);
	track[track.length] = createVector(track[track.length - 1].x + 200, track[track.length - 1].y + 0);
	track[track.length] = createVector(track[track.length - 1].x + 200, track[track.length - 1].y + 0);

	for (i = 0; i < 5; i++) {
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y - 20);
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y - 40);
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y - 60);
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y - 40);
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y - 20);
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y - 0);
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y + 20);
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y + 40);
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y + 60);
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y + 40);
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y + 20);
		track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y - 0);
	}

	track[track.length] = createVector(track[track.length - 1].x + 300, track[track.length - 1].y + 25);
	track[track.length] = createVector(track[track.length - 1].x + 375, track[track.length - 1].y + 50);
	track[track.length] = createVector(track[track.length - 1].x + 350, track[track.length - 1].y + 75);
	track[track.length] = createVector(track[track.length - 1].x + 325, track[track.length - 1].y + 100);
	track[track.length] = createVector(track[track.length - 1].x + 300, track[track.length - 1].y + 125);
	track[track.length] = createVector(track[track.length - 1].x + 275, track[track.length - 1].y + 150);
	track[track.length] = createVector(track[track.length - 1].x + 250, track[track.length - 1].y + 175);
	track[track.length] = createVector(track[track.length - 1].x + 225, track[track.length - 1].y + 200);
	track[track.length] = createVector(track[track.length - 1].x + 200, track[track.length - 1].y + 225);
	track[track.length] = createVector(track[track.length - 1].x + 175, track[track.length - 1].y + 250);
	track[track.length] = createVector(track[track.length - 1].x + 150, track[track.length - 1].y + 275);
	track[track.length] = createVector(track[track.length - 1].x + 125, track[track.length - 1].y + 300);
	track[track.length] = createVector(track[track.length - 1].x + 100, track[track.length - 1].y + 325);
	track[track.length] = createVector(track[track.length - 1].x + 75, track[track.length - 1].y + 350);
	track[track.length] = createVector(track[track.length - 1].x + 50, track[track.length - 1].y + 375);
	track[track.length] = createVector(track[track.length - 1].x + 25, track[track.length - 1].y + 400);
	track[track.length] = createVector(track[track.length - 1].x + 0, track[track.length - 1].y + 425);

	track[track.length] = createVector(track[track.length - 1].x - 25, track[track.length - 1].y + 400);
	track[track.length] = createVector(track[track.length - 1].x - 50, track[track.length - 1].y + 375);
	track[track.length] = createVector(track[track.length - 1].x - 75, track[track.length - 1].y + 350);
	track[track.length] = createVector(track[track.length - 1].x - 100, track[track.length - 1].y + 325);
	track[track.length] = createVector(track[track.length - 1].x - 125, track[track.length - 1].y + 300);
	track[track.length] = createVector(track[track.length - 1].x - 150, track[track.length - 1].y + 275);
	track[track.length] = createVector(track[track.length - 1].x - 175, track[track.length - 1].y + 250);
	track[track.length] = createVector(track[track.length - 1].x - 200, track[track.length - 1].y + 225);
	track[track.length] = createVector(track[track.length - 1].x - 225, track[track.length - 1].y + 200);
	track[track.length] = createVector(track[track.length - 1].x - 250, track[track.length - 1].y + 175);
	track[track.length] = createVector(track[track.length - 1].x - 275, track[track.length - 1].y + 150);
	track[track.length] = createVector(track[track.length - 1].x - 300, track[track.length - 1].y + 125);
	track[track.length] = createVector(track[track.length - 1].x - 325, track[track.length - 1].y + 100);
	track[track.length] = createVector(track[track.length - 1].x - 350, track[track.length - 1].y + 75);
	track[track.length] = createVector(track[track.length - 1].x - 375, track[track.length - 1].y + 50);
	track[track.length] = createVector(track[track.length - 1].x - 400, track[track.length - 1].y + 25);
	track[track.length] = createVector(track[track.length - 1].x - 425, track[track.length - 1].y + 0);

	for (i = 0; i < 3; i++) {
		track[track.length] = createVector(track[track.length - 1].x - 400, track[track.length - 1].y - 100);
		track[track.length] = createVector(track[track.length - 1].x - 400, track[track.length - 1].y - 100);
		track[track.length] = createVector(track[track.length - 1].x - 400, track[track.length - 1].y - 100);
		track[track.length] = createVector(track[track.length - 1].x - 400, track[track.length - 1].y - 100);
		track[track.length] = createVector(track[track.length - 1].x - 400, track[track.length - 1].y - 100);
		track[track.length] = createVector(track[track.length - 1].x - 400, track[track.length - 1].y + 100);
		track[track.length] = createVector(track[track.length - 1].x - 400, track[track.length - 1].y + 100);
	}

	for (i = 0; i <= 400; i += 25) {
		track[track.length] = createVector(track[track.length - 1].x - 400, track[track.length - 1].y + 200 - i);
	}
	for (i = 0; i <= 400; i += 25) {
		track[track.length] = createVector(track[track.length - 1].x - 400 + i, track[track.length - 1].y - 200);
	}

	for (i = 0; i <= 200; i += 25) {
		track[track.length] = createVector(track[track.length - 1].x + i, track[track.length - 1].y - 200 + i);
	}

	for (i = 0; i < 10; i++) {
		track[track.length] = createVector(track[track.length - 1].x + 400, track[track.length - 1].y - 0);
	}
	for (i = 0; i <= 400; i += 50) {
		track[track.length] = createVector(track[track.length - 1].x + 400 - i, track[track.length - 1].y - i);
	}
	for (i = 0; i < 3; i++) {
		track[track.length] = createVector(track[track.length - 1].x - 50, track[track.length - 1].y - 400);
	}
	for (i = 0; i < 5; i++) {
		track[track.length] = createVector(track[track.length - 1].x + 0, track[track.length - 1].y - 150);
	}
	track[track.length] = createVector(track[track.length - 1].x + 25, track[track.length - 1].y - 125);

	let w = 350;
	let tracklength = track.length - 1;
	for (i = 0; i < tracklength; i++) {
		let trackA = getTheta(track[i].x, track[i].y, track[(i + 1) % (track.length - 1)].x, track[(i + 1) % (track.length - 1)].y) + HALF_PI;
		track[track.length] = createVector(track[i].x + w * cos(trackA), track[i].y + w * sin(trackA));
	}
	track[track.length] = createVector(track[track.length - 1].x, track[track.length - 1].y);
}
/*
function georgesTrack() {
  track[track.length] = createVector(450, 100);
  //change in x, change in y
  for(i = 0; i < 500; i++) {
    newTrack(0, -10);
  }
}*/

