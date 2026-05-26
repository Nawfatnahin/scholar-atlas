/*
 * ============================================================
 *  JARVIS — Arduino Nano Random Direction Car
 *  Motor Driver: L298N Dual H-Bridge
 *  Behavior: Powers on via physical switch, immediately begins
 *            moving in random directions with variable speed
 *            and duration.
 * ============================================================
 *
 *  Pin Mapping (Sir's original configuration — preserved exactly):
 *    ENA = D10 (PWM)   — Motor A speed
 *    IN1 = D9           — Motor A direction
 *    IN2 = D8           — Motor A direction
 *    ENB = D5  (PWM)   — Motor B speed
 *    IN3 = D7           — Motor B direction
 *    IN4 = D6           — Motor B direction
 *
 *  Wiring Notes:
 *    - Remove ENA/ENB jumpers on L298N for PWM speed control
 *    - Common GND between battery pack and Arduino is MANDATORY
 *    - Power switch wired inline between battery (+) and L298N 12V input
 *
 * ============================================================
 */

// ─── Pin Definitions (Sir's Original — Do Not Modify) ───────
#define ENA 10
#define IN1 9
#define IN2 8
#define ENB 5
#define IN3 7
#define IN4 6

// ─── Speed Boundaries ───────────────────────────────────────
#define SPEED_MIN 150    // Minimum PWM value (gentler movement)
#define SPEED_MAX 220    // Maximum PWM value (aggressive movement)

// ─── Timing Boundaries (milliseconds) ───────────────────────
#define MOVE_TIME_MIN 800    // Shortest movement burst
#define MOVE_TIME_MAX 2500   // Longest movement burst
#define PAUSE_TIME    300    // Brief pause between direction changes

// ─── Movement Function Prototypes ───────────────────────────
void moveForward(int speed);
void moveBackward(int speed);
void turnLeft(int speed);
void turnRight(int speed);
void stopMotors();

// ═════════════════════════════════════════════════════════════
//  SETUP — Runs once on power-on
// ═════════════════════════════════════════════════════════════
void setup() {
  // Configure all motor control pins as outputs
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  // Seed the random number generator using noise from
  // an unconnected analog pin for true entropy
  randomSeed(analogRead(A0));

  // Ensure motors are stopped at initialization
  stopMotors();
}

// ═════════════════════════════════════════════════════════════
//  LOOP — Continuous random direction cycle
// ═════════════════════════════════════════════════════════════
void loop() {
  // 1. Select a random direction (0 = Forward, 1 = Backward, 2 = Left, 3 = Right)
  int direction = random(0, 4);

  // 2. Select a random speed within defined boundaries
  int speed = random(SPEED_MIN, SPEED_MAX + 1);

  // 3. Select a random duration for this movement
  int duration = random(MOVE_TIME_MIN, MOVE_TIME_MAX + 1);

  // 4. Execute the chosen movement
  switch (direction) {
    case 0:
      moveForward(speed);
      break;
    case 1:
      moveBackward(speed);
      break;
    case 2:
      turnLeft(speed);
      break;
    case 3:
      turnRight(speed);
      break;
  }

  // 5. Hold the movement for the random duration
  delay(duration);

  // 6. Stop motors and pause briefly before the next cycle
  stopMotors();
  delay(PAUSE_TIME);
}

// ═════════════════════════════════════════════════════════════
//  MOVEMENT FUNCTIONS
// ═════════════════════════════════════════════════════════════

/*
 * moveForward — Both motors rotate forward
 * Motor A: IN1=HIGH, IN2=LOW
 * Motor B: IN3=HIGH, IN4=LOW
 */
void moveForward(int speed) {
  analogWrite(ENA, speed);
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  analogWrite(ENB, speed);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

/*
 * moveBackward — Both motors rotate in reverse
 * Motor A: IN1=LOW, IN2=HIGH
 * Motor B: IN3=LOW, IN4=HIGH
 */
void moveBackward(int speed) {
  analogWrite(ENA, speed);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  analogWrite(ENB, speed);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
}

/*
 * turnLeft — Differential steering
 * Motor A reverses, Motor B drives forward
 * This causes the car to pivot left
 */
void turnLeft(int speed) {
  analogWrite(ENA, speed);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  analogWrite(ENB, speed);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

/*
 * turnRight — Differential steering
 * Motor A drives forward, Motor B reverses
 * This causes the car to pivot right
 */
void turnRight(int speed) {
  analogWrite(ENA, speed);
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  analogWrite(ENB, speed);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
}

/*
 * stopMotors — All direction pins LOW, PWM to 0
 * Complete electrical stop on both channels
 */
void stopMotors() {
  analogWrite(ENA, 0);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);

  analogWrite(ENB, 0);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}
