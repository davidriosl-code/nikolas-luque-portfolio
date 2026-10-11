export type SpringValue = { value: number; velocity: number; target: number };

export function springValue(value = 0): SpringValue {
  return { value, velocity: 0, target: value };
}

/** Fixed substeps keep the same spring stable on slow and fast displays. */
export function advanceSpring(spring: SpringValue, seconds: number, stiffness = 210, damping = 21): boolean {
  const elapsed = Math.max(0, Math.min(seconds, 0.05));
  const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)));
  const dt = elapsed / steps;
  for (let i = 0; i < steps; i++) {
    const acceleration = stiffness * (spring.target - spring.value) - damping * spring.velocity;
    spring.velocity += acceleration * dt;
    spring.value += spring.velocity * dt;
  }
  const moving = Math.abs(spring.velocity) > 0.006 || Math.abs(spring.target - spring.value) > 0.001;
  if (!moving) { spring.value = spring.target; spring.velocity = 0; }
  return moving;
}

export function settleSpring(spring: SpringValue) {
  spring.value = spring.target;
  spring.velocity = 0;
}
