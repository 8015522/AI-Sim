

function preload() {
	// STK sounds are borrowed from SuperTuxKart, published under GPL.
	soundRev = loadSound('stk_sounds/car_rev.mp3');
	soundSkid = loadSound('stk_sounds/skid.wav');
	soundEngine = loadSound('stk_sounds/engine_large.wav');
}

//Buttons
humanStartButton = new Clickable();
humanStartButton.text = "Human Vision";
aiStartButton = new Clickable();
aiStartButton.text = "AI Vision";
startMenu = true;
victory = false;
humanStartButton.textScaled = true;
restartButton = new Clickable();
restartButton.text = "🔄";
restartButton.textScaled = true;
resetTimeButton = new Clickable();
resetTimeButton.text = "Reset Times";

function setup() {
	createCanvas(document.body.clientWidth, windowHeight * 0.96);

	gameDebug = false; //Toggles debug hud and keys

	//PHYSICS
	// Subtracting x and y by half of width or height makes the game start in the same spot, ignoring screen size.
	startX = 650 - width / 2;
	startY = 0 - height / 2;
	x = startX;
	y = startY;
	vx = 0;
	vy = 0;
	v = 0;
	maxV = 2000;//850
	maxVRev = (maxV / 6) * -1;///6
	a = 0;
	turnRate = 0;
	brakeFric = 0.85;
	fric = 0.99;
	bounceFriction = 0.95;
	maxTurnRate = (PI / 81) * (maxV / 30000);
	turnDelta = PI / 10000;//15000

	//TIMER
	timer = 0;

	//OBJECTS
	track = [];
	customTrack();

	//ghost
	myGhost = [];
	if (getItem("bestGhost") != null) bestGhost = getItem("bestGhost"); //Load bestGhost from storage if it exists.
	else bestGhost = [];


	//Button locations and sizes
	humanStartButton.resize(width / 5, height / 6);
	humanStartButton.locate(width / 2 - humanStartButton.width / 2, height / 2 - humanStartButton.height / 2);
	aiStartButton.resize(humanStartButton.width, humanStartButton.height);
	aiStartButton.locate(humanStartButton.x, humanStartButton.y + humanStartButton.height * 1.25);
	restartButton.resize(humanStartButton.width / 2, humanStartButton.height / 2);
	aiStartButton.textSize = humanStartButton.textSize;
	resetTimeButton.y = height - resetTimeButton.height;
	//Variables for car position
	carX = width / 2 - 10;
	carY = height / 2 - 20;
	carW = 20;
	carH = 40;

	//Sound Settings
	soundEngine.setVolume(0.1);
	soundEngine.playMode('untilDone');
	soundSkid.playMode('untilDone');

	if (!gameDebug) p5.disableFriendlyErrors = true;

	gridSpace = 80;
}

function draw() {
	background(221);
	if (startMenu) {
		textStyle(BOLD);
		textSize(humanStartButton.textSize * 2);
		text("AI Racing Simulator", width / 2, height / 4);
		humanStartButton.draw();
		aiStartButton.draw();
		resetTimeButton.draw();
		soundEngine.stop();
		if (gameDebug) text("gameDebug is true", 100, 100);
	} else if (victory) {
		text("Race Complete!", width / 2, height / 2);

		if (aiVision) drawClock("ai");
		else drawClock("human");

		restartButton.locate(width / 2 - restartButton.width / 2, height * 0.75 - restartButton.height / 2);
		restartButton.draw();
	} else if (aiVision) {
		// Stuff for what the AI would see goes here
		physics();
		collision();
		rayTracing();
		clock("ai");
		textStyle(NORMAL);
		if (keyIsDown(SHIFT)) text("DRIFTING", width / 2, height * 0.9);
		restartButton.locate(width * 0.9 - restartButton.width, height * 0.9 - restartButton.height);
		restartButton.draw();
	} else { // Human vision
		/* 
				x += (mouseX - width / 2) / 10;
				y += (mouseY - height / 2) / 10;
	 */

		//Try to put things in functions outside of draw, it makes performance profiling work better

		soundEngine.play();

		physics();

		collision();

		clock("human");

		//DRAW

		rayTracing();

		grid();

		drawTrack();

		ghost();

		minimap();

		car();

		debugHud();

		restartButton.locate(width * 0.9 - restartButton.width, height * 0.9 - restartButton.height);
		restartButton.draw();
	}

}
//INPUT POSITIONS INTO THIS FUNCTION TO DISPLAY!!!
function translateX(ax, ay) {
	ax -= x;
	ay -= y;
	aa = getTheta(width / 2, height / 2, ax, ay);
	ba = aa - a;
	ad = dist(width / 2, height / 2, ax, ay);
	bx = width / 2 + ad * cos(ba);
	return bx;
}
//INPUT POSITIONS INTO THIS FUNCTION TO DISPLAY!!!
function translateY(ax, ay) {
	ax -= x;
	ay -= y;
	aa = getTheta(width / 2, height / 2, ax, ay);
	ba = aa - a;
	ad = dist(width / 2, height / 2, ax, ay);
	by = height / 2 + ad * sin(ba);
	return by;
}

function atranslateX(ax, ay) {
	ad = dist(width / 2, height / 2, ax, ay);
	bx = x + ad * cos(a);
	return bx;
}
function atranslateY(ax, ay) {
	ad = dist(width / 2, height / 2, ax, ay);
	by = y + ad * sin(a);
	return by;
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
//TRACK POINT OBJECT
class pt {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}
//GHOST CAR OBJECT
class ghostPt {
	constructor(x, y, a, sco) {
		this.x = x;
		this.y = y;
		this.a = a;
		this.sco = sco;
	}
}
//ADD KEYS
function keyPressed() {
	if (gameDebug) {
		if (key == 'b') {
			a += QUARTER_PI;
		}
		if (key == 'v') {
			a += PI / 64;
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


	//line 1
	let ax = track[index].x;
	let ay = track[index].y;
	let aax = track[(index + 1) % (track.length)].x;
	let aay = track[(index + 1) % (track.length)].y;


	//let aa = 0;

	aa = getTheta(track[index].x, track[index].y, track[(index + track.length - 2) % (track.length - 1)].x, track[(index + track.length - 2) % (track.length - 1)].y);

	let as = tan(aa);

	//ray
	let rx = x;
	let ry = y;
	let ra = angle;
	let rs = tan(angle % (TWO_PI));

	//find intersection point with ray tracing and math

	let ix = (ry - ay + (as * ax) - (rs * rx)) / (as - rs);
	let iy = rs * (ix - rx) + ry;


	return new pt(ix, iy);
}

humanStartButton.onRelease = function () {
	startMenu = false;
	aiVision = false;
	soundRev.play();
}

humanStartButton.onPress = function () {
	humanStartButton.color = "#0000ff";
}

humanStartButton.onOutside = function () {
	humanStartButton.color = "#ffffff";
}

humanStartButton.onHover = function () {
	humanStartButton.color = "#faebd7";
}

aiStartButton.onRelease = function () {
	startMenu = false;
	aiVision = true;
}

aiStartButton.onPress = function () {
	aiStartButton.color = "#0000ff";
}

aiStartButton.onOutside = function () {
	aiStartButton.color = "#ffffff";
}

aiStartButton.onHover = function () {
	aiStartButton.color = "#faebd7";
}

restartButton.onRelease = function () {
	x = startX;
	y = startY;
	v = 0;
	a = 0;
	turnRate = 0;
	timer = 0;
	startMenu = true;
	victory = false;
	myGhost = [];
}

restartButton.onPress = function () {
	restartButton.color = "#0000ff";
}

restartButton.onOutside = function () {
	restartButton.color = "#ffffff";
}

restartButton.onHover = function () {
	restartButton.color = "#faebd7";
}

resetTimeButton.onRelease = function () {
	clearStorage();
	myGhost = [];
	bestGhost = [];
}

resetTimeButton.onPress = function () {
	resetTimeButton.color = "#0000ff";
}

resetTimeButton.onOutside = function () {
	resetTimeButton.color = "#ffffff";
}

resetTimeButton.onHover = function () {
	resetTimeButton.color = "#faebd7";
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
		a -= (turnRate * (norm(v, 0, maxV))) * deltaTime; // Changes amount of turning based on velocity
	}
	if (!keyIsDown(SHIFT)) { // Drifting
		vx = v * cos(a - HALF_PI);
		vy = v * sin(a - HALF_PI);
		soundSkid.stop();
	} else {
		vx += v * cos(a - HALF_PI) / 80;//100
		vy += v * sin(a - HALF_PI) / 80;//100
		vx *= 0.99;
		vy *= 0.99;
		if ((v > 0.01 || v < -0.01) && !aiVision) soundSkid.play();
	}
	let velocity = dist(x, y, x + (vx * deltaTime) / 1500, y + (vy * deltaTime) / 1500);
	text(int(velocity / 3), 300, 30);
	x += (vx * deltaTime) / 1500;
	y += (vy * deltaTime) / 1500;
}

function clock(prefix) {
	//timer
	//increase
	timer += deltaTime;
	//passing the finish line
	if (collideLineRect(translateX(track[track.length / 2 - 1].x, track[track.length / 2 - 1].y), translateY(track[track.length / 2 - 1].x, track[track.length / 2 - 1].y), translateX(track[track.length / 2].x, track[track.length / 2].y), translateY(track[track.length / 2].x, track[track.length / 2].y), carX, carY, carW, carH)) {
		if (getItem(prefix + "bestTime") == null || getItem(prefix + "bestTime") < 1000 || (timer < getItem(prefix + "bestTime") && timer > 3000)) {
			storeItem(prefix + "bestTime", timer);
			//make ghost of best
			/*
			bestGhost = [];
			for(i=0; i<myGhost.length; i++) {
				bestGhost[bestGhost.length] = myGhost[i];
			}
			*/


			if (!aiVision) {
				bestGhost = [];
				for (i = 0; i < myGhost.length; i++) {
					bestGhost[i] = myGhost[i];
				}
				storeItem("bestGhost", bestGhost);
				myGhost = [];
			}
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
		if (i != track.length / 2) {
			if (collideLineRect(translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), carX, carY, carW, carH)) {
				//trackA goes from -0.5PI to 1.5PI
        let trackA = getTheta(track[i - 1].x, track[i - 1].y, track[i].x, track[i].y);
        trackA = (trackA + 2 * PI) % (2 * PI);
				let carA = getTheta(0, 0, vx, vy);
				//MAYBE CAUSING LAG
				/*
				if (0 < getDiff(trackA, carA) && getDiff(trackA, carA) < PI) {
					print("left");
				} else {
					print("right");
				}
				print("---");
				*/
        /*
				let vel = dist(0, 0, vx, vy) * bounceFriction;
				trackA = getTheta(track[i - 1].x, track[i - 1].y, track[i].x, track[i].y);
				carA = getTheta(0, 0, vx, vy);
				let minRebA = getDiff(trackA - PI / 2, carA);
				if (getDiff(trackA + PI / 2, carA) < minRebA) {
					minRebA = getDiff(trackA + PI / 2, carA)
				}
				let rebA = carA + minRebA * 2;
				vx = vel * cos(rebA);
				vy = vel * sin(rebA);
				x += -10 * cos(trackA + PI / 2);
				y += -10 * sin(trackA + PI / 2);
				a = rebA;
        */

        //USING PUSH OF VELOCITY IN THE DIRECTION OF THE TRACK TO GET IT

        /*
        let v1 = createVector(vx, vy);
        let v2 = createVector(track[i].x - track[i-1].x, track[i].y - track[i-1].y);

        let newV = (v1.dot(v2)/v2.dot(v2))*v2;
        vx = newV.x;
        vy = newV.y;
        a = newV.a;
        */
        /*
        let v2x = track[i].x - track[i-1].x;
        let v2y = track[i].y - track[i-1].y;

        let multiplee = (vx*v2x + vy.v2y)/(v2x*v2x + v2y*v2y);
        vx = vx * multiplee;
        vy = vy * multiplee;
        */

        
        //x += 10 * cos(carA);
        //y += 10 * sin(carA);
        //vx = 10 * cos(carA);
        //vy = 10 * sin(carA);

        let diff = (getDiff(trackA, a) + 2 * PI) % (2 * PI);
        let vel = dist(0, 0, vx, vy);
        vel = abs(vel * cos(diff));
        if(diff < PI) {
          fill(0, 255, 0);
          //angle
          if(a < trackA + PI / 2) {
            a += PI/64;
          } else {
            a -= PI/64;
          }
          //a = trackA + PI / 2;
          //velocity
          vx = vel * cos(a);
          vy = vel * sin(a);
          //position
          x += 10 * cos(trackA - PI / 2);
          y += 10 * sin(trackA - PI / 2);
        } else {
          //angle
          fill(255, 0, 0);
          if(a < trackA + PI + PI / 2) {
            a += PI/64;
          } else {
            a -= PI/64;
          }
          //a = trackA + PI + PI / 2;
          //velocity
          vx = vel * cos(a);
          vy = vel * cos(a);
          //position
          x += 10 * cos(trackA + PI / 2);
          y += 10 * sin(trackA + PI / 2);
        }
        arc(150, 150, 50, 50, 0, -diff);
        print(trackA/PI + " PI");
				if(getDiff(trackA, a) < PI / 2) {
					//a = trackA + PI / 2;
          //print("agree");
				} else {
					//a = trackA + PI / 2 + PI;
          //print("dis");
				}
        fill(0);
        
			}
		}
	}
}
/*
function rayTracing() {
	//ray tracing
	//go through each ray
	let lines = 8;
	let ix = 0;
	let iy = 0;
	for (i = 0; i < TWO_PI; i += TWO_PI / (lines)) {
		//set ray length to the edge of the screen
		let minn = width / 2 * Math.SQRT2;
		//go through each track point
		for (j = 0; j < track.length; j++) {
			//find intersect point between the ray and track

 
			ix = intersect(j,i).x;
			iy = intersect(j,i).y;
     // if (frameCount % 100 == 0 )
     //  console.debug(ix + " " + iy);

			//if within the screen
			if (dist(ix, iy, x, y) < width / 2 * Math.SQRT2) {
				//if the intesect is within the domain and range
				let tx = track[j].x;
				let ty = track[j].y;
				let ttx = track[(j + track.length - 2) % (track.length - 1)].x;
				let tty = track[(j + track.length - 2) % (track.length - 1)].y;
				if (
					//pinched horozontaly in either order
					((tx < ix && ix < ttx) || (tx > ix && ix > ttx))
					&&
					//pinched verticaly in either order
					((ty < iy && iy < tty) || (ty > iy && iy > tty))
				) {
					//if less than min
					if (minn > dist(ix, iy, x, y)) {
						minn = dist(ix, iy, x, y);
					}
				}
			}
		}
		//find the distance between the car and line intersection
		//need to know point (check both lines around it) and the angle from the center so it can find the intersection and return the dist from the center
		let d = minn;
		//draw a line out at the decided length
		if (!aiVision) {
			strokeWeight(1);
			stroke('black');
			//line(width / 2, height / 2, width / 2 + d * cos(i), height / 2 + d * sin(i));
			//line(atranslateX(x, y), atranslateY(x, y), atranslateX(ix, iy), atranslateY(ix, iy));
			ellipse(width / 2 + d * cos(i), height / 2 + d * sin(i), 15);
		}
	}
}
*/
function rayTracing() {

	for (i = 1; i < track.length; i++) {

		if ((dist(x, y, track[i].x, track[i].y) <= sqrt(sq(width) * sq(height)) || dist(x, y, track[i - 1].x, track[i - 1].y) <= sqrt(sq(width) * sq(height))) && (i != track.length / 2)) { // Check if track lines are close to car before running collision

			//ELI MULTIPLE RAYS
			/*
			let lines = 16;
			strokeWeight(2);
			stroke('black');
			for(j = 0; j < PI * 2 / lines; j++) {
				let r = collideLineLine(int(width/2+width*cos(j)), int(height/2+width*sin(j)), width / 2, height / 2, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if(r.x != false) {
					strokeWeight(30);
					point(r.x, r.y);
				}
			} */
			strokeWeight(30);

			if (i != track.length - 1) {

				ray1 = collideLineLine(0, 0, width / 2, height / 2, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray1.x != false) {
					stroke('indianred');
					point(ray1.x, ray1.y);
				}

				ray2 = collideLineLine(0, height / 2, width / 2, height / 2, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray2.x != false) {
					stroke('red');
					point(ray2.x, ray2.y);
				}

				ray3 = collideLineLine(0, height, width / 2, height / 2, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray3.x != false) {
					stroke('darkred');
					point(ray3.x, ray3.y);
				}

				ray4 = collideLineLine(width / 2, height, width / 2, height / 2, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray4.x != false) {
					stroke('black');
					point(ray4.x, ray4.y);
				}

				ray5 = collideLineLine(width, height, width / 2, height / 2, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray5.x != false) {
					stroke('darkgreen');
					point(ray5.x, ray5.y);
				}

				ray6 = collideLineLine(width, height / 2, width / 2, height / 2, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray6.x != false) {
					stroke('green');
					point(ray6.x, ray6.y);
				}

				ray7 = collideLineLine(width, 0, width / 2, height / 2, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray7.x != false) {
					stroke('lightgreen');
					point(ray7.x, ray7.y);
				}

				ray8 = collideLineLine(width / 2, 0, width / 2, height / 2, translateX(track[i - 1].x, track[i - 1].y), translateY(track[i - 1].x, track[i - 1].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray8.x != false) {
					stroke('yellow');
					point(ray8.x, ray8.y);
				}
			}
			else {
				ray1 = collideLineLine(0, 0, width / 2, height / 2, translateX(track[track.length / 2].x, track[track.length / 2].y), translateY(track[track.length / 2].x, track[track.length / 2].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray1.x != false) {
					stroke('indianred');
					point(ray1.x, ray1.y);
				}

				ray2 = collideLineLine(0, height / 2, width / 2, height / 2, translateX(track[track.length / 2].x, track[track.length / 2].y), translateY(track[track.length / 2].x, track[track.length / 2].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray2.x != false) {
					stroke('red');
					point(ray2.x, ray2.y);
				}

				ray3 = collideLineLine(0, height, width / 2, height / 2, translateX(track[track.length / 2].x, track[track.length / 2].y), translateY(track[track.length / 2].x, track[track.length / 2].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray3.x != false) {
					stroke('darkred');
					point(ray3.x, ray3.y);
				}

				ray4 = collideLineLine(width / 2, height, width / 2, height / 2, translateX(track[track.length / 2].x, track[track.length / 2].y), translateY(track[track.length / 2].x, track[track.length / 2].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray4.x != false) {
					stroke('black');
					point(ray4.x, ray4.y);
				}

				ray5 = collideLineLine(width, height, width / 2, height / 2, translateX(track[track.length / 2].x, track[track.length / 2].y), translateY(track[track.length / 2].x, track[track.length / 2].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray5.x != false) {
					stroke('darkgreen');
					point(ray5.x, ray5.y);
				}

				ray6 = collideLineLine(width, height / 2, width / 2, height / 2, translateX(track[track.length / 2].x, track[track.length / 2].y), translateY(track[track.length / 2].x, track[track.length / 2].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray6.x != false) {
					stroke('green');
					point(ray6.x, ray6.y);
				}

				ray7 = collideLineLine(width, 0, width / 2, height / 2, translateX(track[track.length / 2].x, track[track.length / 2].y), translateY(track[track.length / 2].x, track[track.length / 2].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray7.x != false) {
					stroke('lightgreen');
					point(ray7.x, ray7.y);
				}

				ray8 = collideLineLine(width / 2, 0, width / 2, height / 2, translateX(track[track.length / 2].x, track[track.length / 2].y), translateY(track[track.length / 2].x, track[track.length / 2].y), translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y), true);
				if (ray8.x != false) {
					stroke('yellow');
					point(ray8.x, ray8.y);
				}
			}
		}
	}
}

function grid() {
	strokeWeight(0.2);
	stroke('black');
	//Get some points around the car to start and end the grid
	gridYDown = y - (windowHeight * 2 + y % gridSpace);
	gridYUp = y + (windowHeight * 2 + y % gridSpace);
	gridXDown = x - (windowWidth * 2 + x % gridSpace);
	gridXUp = x + (windowWidth * 2 + x % gridSpace);
	//Draw the grid around the car
	for (i = gridXDown; i < gridXUp; i += gridSpace) {
		let ax = translateX(i, gridYDown);
		let ay = translateY(i, gridYDown);
		let bx = translateX(i, gridYUp);
		let by = translateY(i, gridYUp);
		line(ax, ay, bx, by);
	}

	for (i = gridYDown; i < gridYUp; i += gridSpace) {
		let ax = translateX(gridXDown, i);
		let ay = translateY(gridXDown, i);
		let bx = translateX(gridXUp, i);
		let by = translateY(gridXUp, i);
		line(ax, ay, bx, by);
	}
}

function drawTrack() {
	strokeWeight(1);
	//track
	fill('black');
	for (i = 0; i < track.length; i++) {
		if (gameDebug) {
			stroke('green');
			text(i, translateX(track[i].x, track[i].y), translateY(track[i].x, track[i].y));
		}
		if (dist(x + width / 2, y + width / 2, track[i].x, track[i].y) < width) {
			let tx = translateX(track[i].x, track[i].y);
			let ty = translateY(track[i].x, track[i].y);
			circle(tx, ty, 5);
			if (i == int(track.length * 1 / 4)) {
				circle(tx, ty, 20);
			}
			if (i != 0) {
				let ttx = translateX(track[i - 1].x, track[i - 1].y);
				let tty = translateY(track[i - 1].x, track[i - 1].y);
				//Red is to make the finish line easier to see
				if (i == track.length / 2) stroke('red');
				else stroke('black');
				if (i - 1 != track.length / 2 - 1 && i - 1 != track.length - 2)
					line(tx, ty, ttx, tty);

				let zx = translateX(track[track.length - 2].x, track[track.length - 2].y);
				let zy = translateY(track[track.length - 2].x, track[track.length - 2].y);
				let vx = translateX(track[track.length / 2].x, track[track.length / 2].y);
				let vy = translateY(track[track.length / 2].x, track[track.length / 2].y);
				line(zx, zy, vx, vy);
				//line l/2-1 to l/2 and l-2 to l-2 shouldnt be drawn
				//line l-2 to l/2 should be drawn
			}
		}
	}
}

function ghost() {
		//create my ghost
		myGhost[myGhost.length] = new ghostPt(x, y, a, timer);
		//display best ghost

		for (i = 0; i < bestGhost.length; i++) {
			if (int(bestGhost[i].sco/1000 * frameRate()) == int(timer/1000 * frameRate())) {

				fill(150, 150, 150);
				//minimap
				circle((bestGhost[i].x + width / 2) / 100 + width - 180, (bestGhost[i].y + height / 2) / 100 + 30, 5);
				//real
				gx = translateX(bestGhost[i].x + width / 2, bestGhost[i].y + height / 2);
				gy = translateY(bestGhost[i].x + width / 2, bestGhost[i].y + height / 2);
				//circle(gx, gy, 40);

				quad(
					gx + 25 * cos(bestGhost[i].a - a + PI / 8 + HALF_PI), gy + 25 * sin(bestGhost[i].a - a + PI / 8 + HALF_PI),
					gx + 25 * cos(bestGhost[i].a - a - PI / 8 + HALF_PI), gy + 25 * sin(bestGhost[i].a - a - PI / 8 + HALF_PI),
					gx + 25 * cos(bestGhost[i].a - a + PI / 8 + PI + HALF_PI), gy + 25 * sin(bestGhost[i].a - a + PI / 8 + PI + HALF_PI),
					gx + 25 * cos(bestGhost[i].a - a - PI / 8 + PI + HALF_PI), gy + 25 * sin(bestGhost[i].a - a - PI / 8 + PI + HALF_PI)
				);
				//i+=5;
				//break;
			}
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
		(x + width / 2) / mapScale + width - mapShiftX,
		(y + height / 2) / mapScale + mapShiftY, 5);
	fill('yellow');
	circle(
		(x + width / 2) / mapScale + width - mapShiftX + 3 * cos(a - HALF_PI),
		(y + height / 2) / mapScale + mapShiftY + 3 * sin(a - HALF_PI), 4);
	strokeWeight(1);
}

function car() {
	fade = 85 + 15 * cos(frameCount / 10);
	fill(255, 255, 0, fade);
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
}

function debugHud() {
	if (gameDebug) {
		textAlign(LEFT);
		textStyle(NORMAL);
		textFont("monospace");
		textSize(12);
		text("x         = " + int(x * 100) / 100, 15, 30);
		text("y         = " + int(y * 100) / 100, 15, 45);
		text("v         = " + int(v * 100) / 100, 15, 15);
		text("a         = " + (int(((a / PI) % -2) * 100) / 100) + "π", 15, 60);
		text("turnRate  = " + int(turnRate * 128 * 100 / PI) / 100 + "/128 π", 15, 75);
		text("frameRate = " + int(frameRate()), 15, 90);
	}
}

function customTrack() {
	track[track.length] = new pt(450, 100);
	track[track.length] = new pt(track[track.length - 1].x + 0, track[track.length - 1].y - 150);
	track[track.length] = new pt(track[track.length - 1].x + 0, track[track.length - 1].y - 150);
	track[track.length] = new pt(track[track.length - 1].x + 50, track[track.length - 1].y - 150);
	track[track.length] = new pt(track[track.length - 1].x + 100, track[track.length - 1].y - 250);
	track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y - 200);
	track[track.length] = new pt(track[track.length - 1].x + 200, track[track.length - 1].y - 150);
	track[track.length] = new pt(track[track.length - 1].x + 250, track[track.length - 1].y - 100);
	track[track.length] = new pt(track[track.length - 1].x + 300, track[track.length - 1].y - 50);
	track[track.length] = new pt(track[track.length - 1].x + 300, track[track.length - 1].y - 0);
	track[track.length] = new pt(track[track.length - 1].x + 500, track[track.length - 1].y - 0);
	track[track.length] = new pt(track[track.length - 1].x + 300, track[track.length - 1].y - 50);
	track[track.length] = new pt(track[track.length - 1].x + 300, track[track.length - 1].y - 150);
	track[track.length] = new pt(track[track.length - 1].x + 300, track[track.length - 1].y - 50);
	track[track.length] = new pt(track[track.length - 1].x + 300, track[track.length - 1].y - 0);
	track[track.length] = new pt(track[track.length - 1].x + 300, track[track.length - 1].y + 50);
	track[track.length] = new pt(track[track.length - 1].x + 300, track[track.length - 1].y + 150);
	track[track.length] = new pt(track[track.length - 1].x + 250, track[track.length - 1].y + 250);
	track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y + 300);
	track[track.length] = new pt(track[track.length - 1].x + 50, track[track.length - 1].y + 300);
	track[track.length] = new pt(track[track.length - 1].x + 0, track[track.length - 1].y + 300);
	track[track.length] = new pt(track[track.length - 1].x - 100, track[track.length - 1].y + 300);
	track[track.length] = new pt(track[track.length - 1].x - 150, track[track.length - 1].y + 250);
	track[track.length] = new pt(track[track.length - 1].x - 200, track[track.length - 1].y + 200);
	track[track.length] = new pt(track[track.length - 1].x - 150, track[track.length - 1].y + 150);
	track[track.length] = new pt(track[track.length - 1].x - 250, track[track.length - 1].y + 50);
	track[track.length] = new pt(track[track.length - 1].x - 300, track[track.length - 1].y + 0);

	track[track.length] = new pt(track[track.length - 1].x - 100, track[track.length - 1].y + 10);
	track[track.length] = new pt(track[track.length - 1].x - 90, track[track.length - 1].y + 20);
	track[track.length] = new pt(track[track.length - 1].x - 80, track[track.length - 1].y + 30);
	track[track.length] = new pt(track[track.length - 1].x - 70, track[track.length - 1].y + 40);
	track[track.length] = new pt(track[track.length - 1].x - 60, track[track.length - 1].y + 50);
	track[track.length] = new pt(track[track.length - 1].x - 50, track[track.length - 1].y + 60);
	track[track.length] = new pt(track[track.length - 1].x - 40, track[track.length - 1].y + 70);
	track[track.length] = new pt(track[track.length - 1].x - 30, track[track.length - 1].y + 80);
	track[track.length] = new pt(track[track.length - 1].x - 20, track[track.length - 1].y + 90);
	track[track.length] = new pt(track[track.length - 1].x - 10, track[track.length - 1].y + 100);
	track[track.length] = new pt(track[track.length - 1].x + 0, track[track.length - 1].y + 90);
	track[track.length] = new pt(track[track.length - 1].x + 10, track[track.length - 1].y + 80);
	track[track.length] = new pt(track[track.length - 1].x + 20, track[track.length - 1].y + 70);
	track[track.length] = new pt(track[track.length - 1].x + 30, track[track.length - 1].y + 60);
	track[track.length] = new pt(track[track.length - 1].x + 40, track[track.length - 1].y + 50);
	track[track.length] = new pt(track[track.length - 1].x + 50, track[track.length - 1].y + 40);
	track[track.length] = new pt(track[track.length - 1].x + 60, track[track.length - 1].y + 30);
	track[track.length] = new pt(track[track.length - 1].x + 70, track[track.length - 1].y + 20);
	track[track.length] = new pt(track[track.length - 1].x + 80, track[track.length - 1].y + 10);
	track[track.length] = new pt(track[track.length - 1].x + 90, track[track.length - 1].y + 0);
	track[track.length] = new pt(track[track.length - 1].x + 100, track[track.length - 1].y + 0);

	track[track.length] = new pt(track[track.length - 1].x + 200, track[track.length - 1].y + 0);
	track[track.length] = new pt(track[track.length - 1].x + 200, track[track.length - 1].y + 0);
	track[track.length] = new pt(track[track.length - 1].x + 200, track[track.length - 1].y + 0);

	for (i = 0; i < 5; i++) {
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y - 20);
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y - 40);
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y - 60);
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y - 40);
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y - 20);
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y - 0);
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y + 20);
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y + 40);
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y + 60);
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y + 40);
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y + 20);
		track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y - 0);
	}

	track[track.length] = new pt(track[track.length - 1].x + 300, track[track.length - 1].y + 25);
	track[track.length] = new pt(track[track.length - 1].x + 375, track[track.length - 1].y + 50);
	track[track.length] = new pt(track[track.length - 1].x + 350, track[track.length - 1].y + 75);
	track[track.length] = new pt(track[track.length - 1].x + 325, track[track.length - 1].y + 100);
	track[track.length] = new pt(track[track.length - 1].x + 300, track[track.length - 1].y + 125);
	track[track.length] = new pt(track[track.length - 1].x + 275, track[track.length - 1].y + 150);
	track[track.length] = new pt(track[track.length - 1].x + 250, track[track.length - 1].y + 175);
	track[track.length] = new pt(track[track.length - 1].x + 225, track[track.length - 1].y + 200);
	track[track.length] = new pt(track[track.length - 1].x + 200, track[track.length - 1].y + 225);
	track[track.length] = new pt(track[track.length - 1].x + 175, track[track.length - 1].y + 250);
	track[track.length] = new pt(track[track.length - 1].x + 150, track[track.length - 1].y + 275);
	track[track.length] = new pt(track[track.length - 1].x + 125, track[track.length - 1].y + 300);
	track[track.length] = new pt(track[track.length - 1].x + 100, track[track.length - 1].y + 325);
	track[track.length] = new pt(track[track.length - 1].x + 75, track[track.length - 1].y + 350);
	track[track.length] = new pt(track[track.length - 1].x + 50, track[track.length - 1].y + 375);
	track[track.length] = new pt(track[track.length - 1].x + 25, track[track.length - 1].y + 400);
	track[track.length] = new pt(track[track.length - 1].x + 0, track[track.length - 1].y + 425);

	track[track.length] = new pt(track[track.length - 1].x - 25, track[track.length - 1].y + 400);
	track[track.length] = new pt(track[track.length - 1].x - 50, track[track.length - 1].y + 375);
	track[track.length] = new pt(track[track.length - 1].x - 75, track[track.length - 1].y + 350);
	track[track.length] = new pt(track[track.length - 1].x - 100, track[track.length - 1].y + 325);
	track[track.length] = new pt(track[track.length - 1].x - 125, track[track.length - 1].y + 300);
	track[track.length] = new pt(track[track.length - 1].x - 150, track[track.length - 1].y + 275);
	track[track.length] = new pt(track[track.length - 1].x - 175, track[track.length - 1].y + 250);
	track[track.length] = new pt(track[track.length - 1].x - 200, track[track.length - 1].y + 225);
	track[track.length] = new pt(track[track.length - 1].x - 225, track[track.length - 1].y + 200);
	track[track.length] = new pt(track[track.length - 1].x - 250, track[track.length - 1].y + 175);
	track[track.length] = new pt(track[track.length - 1].x - 275, track[track.length - 1].y + 150);
	track[track.length] = new pt(track[track.length - 1].x - 300, track[track.length - 1].y + 125);
	track[track.length] = new pt(track[track.length - 1].x - 325, track[track.length - 1].y + 100);
	track[track.length] = new pt(track[track.length - 1].x - 350, track[track.length - 1].y + 75);
	track[track.length] = new pt(track[track.length - 1].x - 375, track[track.length - 1].y + 50);
	track[track.length] = new pt(track[track.length - 1].x - 400, track[track.length - 1].y + 25);
	track[track.length] = new pt(track[track.length - 1].x - 425, track[track.length - 1].y + 0);

	for (i = 0; i < 3; i++) {
		track[track.length] = new pt(track[track.length - 1].x - 400, track[track.length - 1].y - 100);
		track[track.length] = new pt(track[track.length - 1].x - 400, track[track.length - 1].y - 100);
		track[track.length] = new pt(track[track.length - 1].x - 400, track[track.length - 1].y - 100);
		track[track.length] = new pt(track[track.length - 1].x - 400, track[track.length - 1].y - 100);
		track[track.length] = new pt(track[track.length - 1].x - 400, track[track.length - 1].y - 100);
		track[track.length] = new pt(track[track.length - 1].x - 400, track[track.length - 1].y + 100);
		track[track.length] = new pt(track[track.length - 1].x - 400, track[track.length - 1].y + 100);
	}

	for (i = 0; i <= 400; i += 25) {
		track[track.length] = new pt(track[track.length - 1].x - 400, track[track.length - 1].y + 200 - i);
	}
	for (i = 0; i <= 400; i += 25) {
		track[track.length] = new pt(track[track.length - 1].x - 400 + i, track[track.length - 1].y - 200);
	}

	for (i = 0; i <= 200; i += 25) {
		track[track.length] = new pt(track[track.length - 1].x + i, track[track.length - 1].y - 200 + i);
	}

	for (i = 0; i < 10; i++) {
		track[track.length] = new pt(track[track.length - 1].x + 400, track[track.length - 1].y - 0);
	}
	for (i = 0; i <= 400; i += 50) {
		track[track.length] = new pt(track[track.length - 1].x + 400 - i, track[track.length - 1].y - i);
	}
	for (i = 0; i < 3; i++) {
		track[track.length] = new pt(track[track.length - 1].x - 50, track[track.length - 1].y - 400);
	}
	for (i = 0; i < 5; i++) {
		track[track.length] = new pt(track[track.length - 1].x + 0, track[track.length - 1].y - 150);
	}
	track[track.length] = new pt(track[track.length - 1].x + 25, track[track.length - 1].y - 125);

	let w = 350;
	let tracklength = track.length - 1;
	for (i = 0; i < tracklength; i++) {
		let trackA = getTheta(track[i].x, track[i].y, track[(i + 1) % (track.length - 1)].x, track[(i + 1) % (track.length - 1)].y) + HALF_PI;
		track[track.length] = new pt(track[i].x + w * cos(trackA), track[i].y + w * sin(trackA));
	}
	track[track.length] = new pt(track[track.length - 1].x, track[track.length - 1].y);
}