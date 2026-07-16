type WalkingLegsOptions = {
  phase: number;
  moving: boolean;
  legColor: string;
  bootColor: string;
  hipY?: number;
  spacing?: number;
  legWidth?: number;
  legLength?: number;
  bootWidth?: number;
  bootHeight?: number;
};

export const drawWalkingLegs = (ctx: CanvasRenderingContext2D, options: WalkingLegsOptions) => {
  const {
    phase,
    moving,
    legColor,
    bootColor,
    hipY = 5,
    spacing = 7,
    legWidth = 7,
    legLength = 14,
    bootWidth = 9,
    bootHeight = 8,
  } = options;
  const stride = moving ? Math.sin(phase) * 0.55 : 0;

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * spacing, hipY);
    ctx.rotate(stride * side);
    ctx.fillStyle = legColor;
    ctx.fillRect(-legWidth / 2, 0, legWidth, legLength);
    ctx.translate(0, legLength - 1);
    ctx.rotate(-stride * side * 0.35);
    ctx.fillStyle = bootColor;
    ctx.fillRect(-bootWidth / 2, 0, bootWidth, bootHeight);
    ctx.restore();
  }
};
