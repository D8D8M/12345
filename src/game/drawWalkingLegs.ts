type WalkingLegsOptions = {
  phase: number;
  moving: boolean;
  movement?: number;
  legColor: string;
  bootColor: string;
  hipY?: number;
  spacing?: number;
  legWidth?: number;
  legLength?: number;
  bootWidth?: number;
  bootHeight?: number;
  strideScale?: number;
  liftScale?: number;
};

export const drawWalkingLegs = (ctx: CanvasRenderingContext2D, options: WalkingLegsOptions) => {
  const {
    phase,
    moving,
    movement = moving ? 1 : 0,
    legColor,
    bootColor,
    hipY = 5,
    spacing = 7,
    legWidth = 7,
    legLength = 14,
    bootWidth = 9,
    bootHeight = 8,
    strideScale = 1,
    liftScale = 1,
  } = options;
  const upperLegLength = legLength * 0.52;
  const lowerLegLength = legLength * 0.58;
  const gait = moving ? Math.max(0, Math.min(1, movement)) : 0;
  const stride = Math.max(4, legLength * 0.42) * strideScale * gait;
  const stepLift = Math.max(2, legLength * 0.26) * liftScale * gait;
  const cycle = moving ? phase : 0;

  // The body is lowest during each double-support moment and rises while a leg passes.
  if (moving) ctx.translate(0, (1 - Math.cos(cycle * 2)) * 0.38 * gait);

  // Draw the returning leg first, so the planted leg remains readable in front.
  const sides = Math.sin(cycle) >= 0 ? [1, -1] : [-1, 1];
  for (const side of sides) {
    const legPhase = cycle + (side > 0 ? Math.PI : 0);
    const progress = ((legPhase / (Math.PI * 2)) % 1 + 1) % 1;
    // Half a cycle supports the body, half transfers the leg. With opposite
    // phases this prevents both boots from sliding along the ground together.
    const stancePart = 0.62;
    const onGround = progress < stancePart;
    const stepProgress = onGround
      ? progress / stancePart
      : (progress - stancePart) / (1 - stancePart);
    const easedSwing = stepProgress * stepProgress * (3 - 2 * stepProgress);
    const footOffset = !moving
      ? 0
      : onGround
        ? stride * (0.5 - stepProgress)
        : stride * (easedSwing - 0.5);
    const lift = moving && !onGround ? Math.sin(stepProgress * Math.PI) * stepLift : 0;
    const hipX = side * spacing;
    const footX = hipX + footOffset;
    const footY = hipY + legLength - lift;
    const dx = footX - hipX;
    const dy = footY - hipY;
    const distance = Math.min(
      upperLegLength + lowerLegLength - 0.01,
      Math.max(Math.abs(upperLegLength - lowerLegLength) + 0.01, Math.hypot(dx, dy)),
    );
    const baseAngle = Math.atan2(dy, dx);
    const hipBend = Math.acos(
      (upperLegLength ** 2 + distance ** 2 - lowerLegLength ** 2) /
        (2 * upperLegLength * distance),
    );
    // Knees always fold slightly forward. Flipping this bend between legs is
    // what made the old gait look like scissors instead of a walk.
    const thighAngle = baseAngle - hipBend;
    const kneeX = hipX + Math.cos(thighAngle) * upperLegLength;
    const kneeY = hipY + Math.sin(thighAngle) * upperLegLength;

    ctx.save();
    ctx.strokeStyle = legColor;
    ctx.lineWidth = legWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY);
    ctx.stroke();

    ctx.translate(footX, footY - bootHeight * 0.15);
    // The heel lifts before toe-off and settles before the next contact.
    const toeRoll = moving && !onGround ? Math.sin(stepProgress * Math.PI) * -0.18 : 0;
    ctx.rotate(toeRoll);
    ctx.fillStyle = bootColor;
    ctx.fillRect(-bootWidth * 0.35, 0, bootWidth, bootHeight);
    ctx.restore();
  }
};
