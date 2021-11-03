function setup() {
	createCanvas(429, 429);

	// Variables for car position
	carX = 0 - 10;
	carY = 0 - 20;
	carW = 20;
	carH = 40;
	lines = 16;
	colorMode(HSB);
  

	// Positioning
	scale(2);
	translate(width / 4, height / 4);
	rotate(PI / 6);

	//Lines around car
	for (i = 0; i < TWO_PI; i += TWO_PI / lines) {
		rX = 100 * cos(i);
		rY = 100 * sin(i);
		stroke('black');
		strokeWeight(1);
		line(0, 0, rX, rY);
		strokeWeight(15);
		stroke(map(i, 0, TWO_PI, 0, 360), 50, 100);
		point(rX, rY);
	}

	car();

	saveCanvas("AI Sim"); // Download the canvas

	noLoop();
}


// Modified car function from game
function car() {
	colorMode(RGB);
	fill(255, 255, 0, 100);
	noStroke();
	triangle(0 - 5, 0 - 5, 0 - 15, 0 - 55, 0 + 5, 0 - 55);
	triangle(0 + 5, 0 - 5, 0 + 10 - 15, 0 - 55, 0 + 10 + 5, 0 - 55);
	arc(0 + 5, 0 - 55, 20, 40, PI, 0);
	arc(0 - 5, 0 - 55, 20, 40, PI, 0);
	fill('red');
	noStroke();
	rect(carX, carY, carW, carH);
	fill('black');
	arc(0 - 10, 0 - 10, 5, 10, HALF_PI, PI * 3 / 2);
	arc(0 - 10, 0 + 10, 5, 10, HALF_PI, PI * 3 / 2);
	arc(0 + 10, 0 - 10, 5, 10, -1 * HALF_PI, HALF_PI);
	arc(0 + 10, 0 + 10, 5, 10, -1 * HALF_PI, HALF_PI);
	rect(0 - 7.5, 0 - 6, 15, 20);
	colorMode(HSB);
}