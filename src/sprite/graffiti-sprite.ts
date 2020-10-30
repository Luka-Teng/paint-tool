import Axis from '../axis';
import { IGraffitiSpriteData, IPosition, IRectOptions, IActiveOptions2Sprirte } from '../types';
import { fixNumber } from '../utils';
import { GraffitiSpriteOptions } from '../config';
import { Sprite } from './base';

type GraffitiSpriteProps = {
  points: IPosition[];
  axis: Axis;
  options?: IRectOptions;
}

export class GraffitiSprite extends Sprite {
  constructor ({ points, options, axis }: GraffitiSpriteProps) {
    super(axis);
    if (options) {
      this.options = Object.assign({}, this.options, options);
    }

    this.type = 'graffiti';

    const {
      spriteHeight,
      spriteWidth,
      spriteX,
      spritePonits,
      spriteY
    } = this.initSpritePositionData(points);

    this.x = spriteX;
    this.y = spriteY;
    this.height = spriteHeight;
    this.width = spriteWidth;
    this.points = spritePonits;
  }

  points: IPosition[] = []
  image: HTMLImageElement | null = null
  options: Required<IRectOptions> = GraffitiSpriteOptions.defaultOption

  // 数据初始化
  public initSpritePositionData = (points: IPosition[]) => {
    const { pointCanvas2Sprite } = this.axis;

    // 将points转化为spritePosition
    const spritePonits = points.map(p => pointCanvas2Sprite(p));

    // 根据spritePosition计算出x, y, width, height
    const { x, y, width, height } = this.getPosition(spritePonits);

    return {
      spriteX: x,
      spriteY: y,
      spriteWidth: width,
      spriteHeight: height,
      spritePonits
    };
  }

  // 从绘制点计算出x, y, width, height
  private getPosition = (points: IPosition[]): Required<IPosition> => {
    let minX: number | null = null;
    let minY: number | null = null;
    let maxX: number | null = null;
    let maxY: number | null = null;

    points.forEach(p => {
      if (minX === null || p.x < minX) {
        minX = p.x;
      }
      if (minY === null || p.y < minY) {
        minY = p.y;
      }
      if (maxX === null || p.x > maxX) {
        maxX = p.x;
      }
      if (maxY === null || p.y > maxY) {
        maxY = p.y;
      }
    });

    if (minX !== null && minY !== null && maxX !== null && maxY !== null) {
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }

    return {x: 0, y: 0, width: 0, height: 0};
  }

  // 更新样式
  public updateStyle = (options: IRectOptions) => {
    const { color, width } = options;
    if (color) {
      this.options.color = color;
    }

    if (width) {
      this.options.width = width;
    }
  }

  // 绘制
  public draw = (
    ctx: CanvasRenderingContext2D,
    activeOptions: IActiveOptions2Sprirte
  ) => {
    const { active, options } = this;
    const { pointSprite2Canvas } = this.axis;
    const { red, green, blue, alpha } = options.color;
    const { x, y, width, height } = this.getDrawData();

    ctx.save();
    ctx.lineWidth = options.width;
    ctx.strokeStyle = `rgba(${red},${green},${blue},${alpha})`;

    // 绘制点绘制
    ctx.beginPath();
    this.points.forEach((p, i) => {
      const canvasPoint = pointSprite2Canvas(p);
      if (i === 0) {
        // 起点
        ctx.moveTo(canvasPoint.x, canvasPoint.y);
      } else {
        // 线段
        ctx.lineTo(canvasPoint.x, canvasPoint.y);
      }
    });
    ctx.stroke();

    if (active) {
      const { red, green, blue } = activeOptions.color;
      ctx.fillStyle = `rgba(${red},${green},${blue},0.1)`;
      ctx.strokeStyle = `rgb(${red},${green},${blue})`;

      if (active) {
        ctx.lineWidth = activeOptions.width;
        ctx.fillRect(
          x - options.width / 2,
          y - options.width / 2,
          width + options.width,
          height + options.width
        );
        ctx.strokeRect(
          x - options.width / 2,
          y - options.width / 2,
          width + options.width,
          height + options.width
        );
      }
    }

    ctx.restore();
  }

  // 精灵移动
  move = (distanceX: number, distanceY: number): void => {
    const { lengthCanvas2Sprite, canvasSize } = this.axis;
    const prevX = this.x;
    const prevY = this.y;
    this.x += lengthCanvas2Sprite(distanceX);
    this.y += lengthCanvas2Sprite(distanceY);
    this.reSetPositionIfOverflow({ x: 0, y: 0, ...canvasSize });

    // 更新绘制点位
    this.points = this.points.map(p => ({x: p.x + this.x - prevX, y: p.y + this.y - prevY}));
  }

  // 画笔初始化
  public init = (eventX: number, eventY: number) => {
    // spritePosition转化
    const { pointCanvas2Sprite } = this.axis;
    const { x: spriteEventX, y: spriteEventY } = pointCanvas2Sprite({ x: eventX, y: eventY });
    const { x, y, width, height } = this.getPosition([...this.points, { x: spriteEventX, y: spriteEventY }]);

    // 推入绘制点
    this.points.push({x: spriteEventX, y: spriteEventY});
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public isValid = () => {
    return this.points.length > 1;
  }

  // 是否命中
  public isHit = (eventX: number, eventY: number) => {
    const { x, y, width, height } = this;
    const { width: strokeWidth } = this.options;
    return this.isCanvasPointInSpriteRange(
      { x: eventX, y: eventY },
      {
        x: x - strokeWidth / 2,
        y: y - strokeWidth / 2,
        width: width + strokeWidth,
        height: height + strokeWidth
      }
    );
  }

  // 输出
  public output = (): IGraffitiSpriteData => {
    const { pointSprite2Origin } = this.axis;
    return {
      position: JSON.stringify(this.points.map(p => {
        const point = pointSprite2Origin(p);
        return {
          x: fixNumber(point.x),
          y: fixNumber(point.y)
        };
      })),
      cnf: {
        ...this.options,
        color: {
          ...this.options.color,
          alpha: Math.round(this.options.color.alpha * 255)
        }
      }
    };
  }
}
