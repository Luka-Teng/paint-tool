import Axis from '../axis';
import { IRectOptions, IRectSpriteData, IActiveOptions2Sprirte, DragIcon, IPosition } from '../types';
import { rectSize } from '../config';
import { fixNumber } from '../utils';
import { Sprite } from './base';

/* eslint-disable camelcase,@typescript-eslint/camelcase */

interface IRectSpriteProps {
  x: number;
  y: number;
  axis: Axis;
  width?: number;
  height?: number;
  options?: IRectOptions;
}

/**
 * rect
 */
export class RectSprite extends Sprite {
  constructor({ x, y, width, height, options, axis }: IRectSpriteProps) {
    super(axis);

    const {
      spriteHeight,
      spriteWidth,
      spriteX,
      spriteY
    } = this.initSpritePositionData({ x, y, width, height });
    this.type = 'rectangle';
    this.x = spriteX;
    this.y = spriteY;
    this.width = spriteWidth;
    this.height = spriteHeight;

    const { color, width: lineWidth } = options || {};

    if (color) {
      this.options.color = color;
    }

    if (lineWidth) {
      this.options.width = lineWidth;
    }
  }

  canResize = true;

  options = {
    color: {
      red: 255,
      green: 99,
      blue: 55,
      alpha: 1
    },
    width: 2
  }

  initSpritePositionData = ({x, y, width = 1, height = 1}: IPosition) => {
    const { pointCanvas2Sprite, lengthCanvas2Sprite } = this.axis;
    const { x: spriteX, y: spriteY } = pointCanvas2Sprite({ x, y });
    const spriteWidth = lengthCanvas2Sprite(width);
    const spriteHeight = lengthCanvas2Sprite(height);
    return {
      spriteX,
      spriteY,
      spriteWidth,
      spriteHeight
    };
  }

  draw = (
    ctx: CanvasRenderingContext2D,
    activeOptions: IActiveOptions2Sprirte
  ) => {
    const { active, options } = this;
    const { x, y, width, height } = this.getDrawData();
    const { red, green, blue, alpha } = options.color;

    ctx.save();
    ctx.lineWidth = options.width;
    ctx.strokeStyle = `rgba(${red},${green},${blue},${alpha})`;
    ctx.strokeRect(x, y, width, height);
    if (active) {
      const { red, green, blue } = activeOptions.color;
      ctx.lineWidth = activeOptions.width;
      ctx.strokeStyle = `rgb(${red},${green},${blue})`;
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = `rgba(${red},${green},${blue},0.1)`;
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = `rgba(${red},${green},${blue},1)`;

      // 上中
      ctx.beginPath();
      ctx.arc(x + width / 2, y, rectSize, 0, 2 * Math.PI);
      ctx.closePath();

      // 右中
      ctx.arc(x + width, y + height / 2, rectSize, 0, 2 * Math.PI);
      ctx.closePath();

      // 左中
      ctx.arc(x, y + height / 2, rectSize, 0, 2 * Math.PI);
      ctx.closePath();

      // 下中
      ctx.arc(x + width / 2, y + height, rectSize, 0, 2 * Math.PI);
      ctx.closePath();

      ctx.fill();
    }

    ctx.restore();
  }

  isHit = (eventX: number, eventY: number) => {
    const { x, y, width, height } = this;
    const { lengthCanvas2Sprite } = this.axis;
    const spriteRectSize = lengthCanvas2Sprite(rectSize);

    return this.isCanvasPointInSpriteRange(
      { x: eventX, y: eventY },
      {
        x: x - spriteRectSize,
        y: y - spriteRectSize,
        width: width + 2 * spriteRectSize,
        height: height + 2 * spriteRectSize
      }
    );
  }

  isHitGrow = (eventX: number, eventY: number) => {
    const { x, y, width, height } = this;
    const { lengthCanvas2Sprite, pointCanvas2Sprite } = this.axis;
    const { x: spriteEventX, y: spriteEventY } = pointCanvas2Sprite({ x: eventX, y: eventY });
    const spriteRectSize = lengthCanvas2Sprite(rectSize);

    if (
      x + width / 2 - spriteRectSize < spriteEventX &&
      spriteEventX < x + width / 2 + spriteRectSize &&
      y - spriteRectSize < spriteEventY &&
      spriteEventY < y + spriteRectSize * 2
    ) {
      return 'topCenter';
    }

    if (
      x + width - 2 * spriteRectSize < spriteEventX &&
      spriteEventX < x + width + spriteRectSize &&
      y + height / 2 - spriteRectSize < spriteEventY &&
      spriteEventY < y + height / 2 + spriteRectSize
    ) {
      return 'rightCenter';
    }

    if (
      x - spriteRectSize < spriteEventX &&
      spriteEventX < x + spriteRectSize * 2 &&
      y + height / 2 - spriteRectSize < spriteEventY &&
      spriteEventY < y + height / 2 + spriteRectSize
    ) {
      return 'leftCenter';
    }

    if (
      x + width / 2 - spriteRectSize < spriteEventX &&
      spriteEventX < x + width / 2 + spriteRectSize &&
      y + height - spriteRectSize * 2 < spriteEventY &&
      spriteEventY < y + height + spriteRectSize
    ) {
      return 'bottomCenter';
    }

    return false;
  }

  drag = (type: DragIcon, distanceX: number, distanceY: number) => {
    if (!type) {
      return;
    }

    const { lengthCanvas2Sprite, canvasSize } = this.axis;
    const spriteRectSize = lengthCanvas2Sprite(rectSize);
    const spriteDistanceX = lengthCanvas2Sprite(distanceX);
    const spriteDistanceY = lengthCanvas2Sprite(distanceY);
    const prevState = {
      width: this.width,
      height: this.height
    };

    switch (type) {
      case 'topCenter':
        this.y += spriteDistanceY;
        this.height -= spriteDistanceY;
        break;
      case 'bottomCenter':
        this.height += spriteDistanceY;
        break;
      case 'leftCenter':
        this.x += spriteDistanceX;
        this.width -= spriteDistanceX;
        break;
      case 'rightCenter':
        this.width += spriteDistanceX;
        break;
      case 'bottomRight':
        this.width += spriteDistanceX;
        this.height += spriteDistanceY;
        break;
      default: 
      break;
    }

    // 越界矫正
    if (this.width < spriteRectSize * 2 || this.height < spriteRectSize * 2) {
      this.width = prevState.width;
      this.height = prevState.height;
    }
    this.reSetPositionIfOverflow({ x: 0, y: 0, ...canvasSize }, 'cut');
  }

  // 初始画框动作
  init = (eventX: number, eventY: number, lastMouseDownPosition: IPosition) => {
    const { pointCanvas2Sprite, canvasSize } = this.axis;
    const { x: spriteEventX, y: spriteEventY } = pointCanvas2Sprite({ x: eventX, y: eventY });
    const { x: lastMouseDownX, y: lastMouseDownY } = pointCanvas2Sprite(lastMouseDownPosition);

    this.width = Math.abs(spriteEventX - lastMouseDownX);
    this.height = Math.abs(spriteEventY - lastMouseDownY);
    this.x = spriteEventX < lastMouseDownX ? spriteEventX : lastMouseDownX;
    this.y = spriteEventY < lastMouseDownY ? spriteEventY : lastMouseDownY;

    this.reSetPositionIfOverflow({ x: 0, y: 0, ...canvasSize }, 'cut');
  }

  output = (): IRectSpriteData => {
    const { x, y, width, height } = this.realPosition();

    return {
      start_pos: {
        x: fixNumber(x),
        y: fixNumber(y)
      },
      dest_pos: {
        x: fixNumber(x + width),
        y: fixNumber(y + height)
      },
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