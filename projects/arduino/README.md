# Arduino Random Direction Car

An autonomous robot car powered by **Arduino Nano** and **L298N Dual H-Bridge Motor Driver** that moves in random directions upon power-on.

## Parts List

| Component | Quantity | Notes |
|-----------|----------|-------|
| Arduino Nano | 1 | ATmega328P based |
| L298N Motor Driver | 1 | Dual H-Bridge module |
| DC Geared Motors | 2 | 3V–6V, with wheels |
| Battery Pack | 1 | 7.4V–12V (2S Li-ion or 6×AA) |
| Power Switch | 1 | SPST toggle, inline with battery (+) |
| Chassis | 1 | 2WD robot car chassis kit |
| Jumper Wires | ~10 | Male-to-Female recommended |

## Wiring Diagram

```
┌──────────────────────────────────────────────────┐
│                   L298N MODULE                    │
│                                                   │
│  12V ◄── Battery (+) ──[POWER SWITCH]──►          │
│  GND ◄── Battery (-) ──► Arduino GND              │
│  5V  ──► Arduino 5V (if 5V jumper enabled)        │
│                                                   │
│  ENA ──► Arduino D10  (PWM - Motor A Speed)       │
│  IN1 ──► Arduino D9   (Motor A Direction)         │
│  IN2 ──► Arduino D8   (Motor A Direction)         │
│  IN3 ──► Arduino D7   (Motor B Direction)         │
│  IN4 ──► Arduino D6   (Motor B Direction)         │
│  ENB ──► Arduino D5   (PWM - Motor B Speed)       │
│                                                   │
│  OUT1/OUT2 ──► Motor A (Left Wheel)               │
│  OUT3/OUT4 ──► Motor B (Right Wheel)              │
└──────────────────────────────────────────────────┘
```

> **⚠ CRITICAL:** Remove the ENA and ENB jumpers on the L298N module. These must be driven by PWM signals from the Arduino for variable speed control.

> **⚠ CRITICAL:** Connect the GND of the battery pack to the GND of the Arduino Nano. Without this common ground, signals will not register.

## Pin Mapping

| L298N Pin | Arduino Nano Pin | Type | Purpose |
|-----------|-----------------|------|---------|
| ENA | D10 | PWM | Motor A speed control |
| IN1 | D9 | Digital | Motor A direction |
| IN2 | D8 | Digital | Motor A direction |
| ENB | D5 | PWM | Motor B speed control |
| IN3 | D7 | Digital | Motor B direction |
| IN4 | D6 | Digital | Motor B direction |

## How It Works

1. **Power On** — Flip the physical power switch to energize the circuit
2. **Initialization** — Arduino seeds the random number generator from analog noise on pin A0
3. **Random Movement Loop:**
   - Picks a random direction: Forward, Backward, Left, or Right
   - Picks a random speed: PWM 150–220
   - Picks a random duration: 800ms–2500ms
   - Executes the movement, then pauses 300ms before the next cycle

## Upload Instructions

1. Connect the Arduino Nano to your computer via USB
2. Open `src/random_car.ino` in the Arduino IDE
3. Select **Board:** `Arduino Nano` and **Processor:** `ATmega328P (Old Bootloader)` if needed
4. Select the correct **COM Port**
5. Click **Upload** (→ arrow button)
6. Disconnect USB, connect battery pack, flip power switch

## Troubleshooting

- **Motor spins wrong direction:** Swap the two wires for that motor at the L298N output terminal (OUT1↔OUT2 or OUT3↔OUT4)
- **Motors don't spin at all:** Verify common GND connection and that ENA/ENB jumpers are removed
- **Car only goes straight:** Check that IN1–IN4 wires are connected to the correct Arduino pins

---
*Maintained under the supervision of JARVIS.*
