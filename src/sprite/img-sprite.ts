import Axis from '../axis';
import { IImgSpriteData, DragIcon, IActiveOptions2Sprirte, IPosition } from '../types';
import { rectSize } from '../config';
import { fixNumber } from '../utils';
import { Sprite } from './base';

/* eslint-disable camelcase,@typescript-eslint/camelcase */

interface IImgSpriteProps {
  name: string;
  x: number;
  y: number;
  height?: number;
  width?: number;
  image: HTMLImageElement;
  imageUrl: string;
  axis: Axis;
  createMode?: 'leftTop' | 'center';
}

/**
 * 自定义图片
 */
export class ImgSprite extends Sprite {
  constructor({ name, x, y, width, height, image, imageUrl, axis, createMode = 'center' }: IImgSpriteProps) {
    super(axis);

    const {
      spriteHeight,
      spriteWidth,
      spriteX,
      spriteY
    } = this.initSpritePositionData({ x, y, image, width, height });
    this.type = 'patch_img';
    this.name = name;
    this.content = image;
    this.imageUrl = imageUrl;
    this.width = spriteWidth;
    this.height = spriteHeight;
    this.ratio = this.width / this.height;

    if (createMode === 'center') {
      this.x = spriteX - this.width / 2;
      this.y = spriteY - this.height / 2;
    } else if (createMode === 'leftTop') {
      this.x = spriteX;
      this.y = spriteY;
    }

    this.reSetPositionIfOverflow(this.getSpriteAxisForCanvas());
  }

  content: HTMLImageElement; // 模版资源
  imageUrl: string; // 图片地址
  canResize = true;
  name: string; // 图片唯一命名
  ratio: number; // 图片宽高比例

  initSpritePositionData = ({ x, y, width, height, image }: IPosition & { image: HTMLImageElement }) => {
    const { pointCanvas2Sprite, lengthCanvas2Sprite } = this.axis;
    const { x: spriteX, y: spriteY } = pointCanvas2Sprite({ x, y });
    const spriteWidth = lengthCanvas2Sprite(width || image.width as number);
    const spriteHeight = lengthCanvas2Sprite(height || image.height as number);
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
    const { content, active } = this;
    const { x, y, width, height } = this.getDrawData();
    const color = activeOptions.color;

    ctx.save();
    ctx.fillStyle = `rgba(${color.red},${color.green},${color.blue},0.1)`;
    ctx.strokeStyle = `rgb(${color.red},${color.green},${color.blue})`;
    ctx.drawImage(content, x, y, width, height);

    if (active) {
      ctx.fillRect(x, y, width, height);
      ctx.lineWidth = activeOptions.width;
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = `rgba(${color.red},${color.green},${color.blue},1)`;
      // 左上
      ctx.beginPath();
      ctx.arc(x, y, rectSize, 0, 2 * Math.PI);
      ctx.closePath();

      // 右下
      ctx.arc(x + width, y + height, rectSize, 0, 2 * Math.PI);
      ctx.closePath();

      // 左下
      ctx.arc(x, y + height, rectSize, 0, 2 * Math.PI);
      ctx.closePath();

      // 右上
      ctx.arc(x + width, y, rectSize, 0, 2 * Math.PI);
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
    const rightX = x + width;
    const bottomY = y + height;
    const { lengthCanvas2Sprite, pointCanvas2Sprite } = this.axis;
    const { x: spriteEventX, y: spriteEventY } = pointCanvas2Sprite({ x: eventX, y: eventY });
    const spriteRectSize = lengthCanvas2Sprite(rectSize);

    if (
      x - spriteRectSize <= spriteEventX &&
      x + spriteRectSize >= spriteEventX &&
      y - spriteRectSize <= spriteEventY &&
      y + spriteRectSize >= spriteEventY
    ) {
      return 'topLeft';
    }

    if (
      rightX - spriteRectSize <= spriteEventX &&
      rightX + spriteRectSize >= spriteEventX &&
      y - spriteRectSize <= spriteEventY &&
      y + spriteRectSize >= spriteEventY
    ) {
      return 'topRight';
    }

    if (
      x - spriteRectSize <= spriteEventX &&
      x + spriteRectSize >= spriteEventX &&
      bottomY - spriteRectSize <= spriteEventY &&
      bottomY + spriteRectSize >= spriteEventY
    ) {
      return 'bottomLeft';
    }

    if (
      rightX - spriteRectSize <= spriteEventX &&
      rightX + spriteRectSize >= spriteEventX &&
      bottomY - spriteRectSize <= spriteEventY &&
      bottomY + spriteRectSize >= spriteEventY
    ) {
      return 'bottomRight';
    }

    return false;
  }

  drag = (type: DragIcon, distanceX: number) => {
    if (!type) {
      return;
    }

    const { lengthCanvas2Sprite } = this.axis;
    const spriteDistanceX = lengthCanvas2Sprite(distanceX);
    const spriteRectSize = lengthCanvas2Sprite(rectSize);
    const prevState = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };

    switch (type) {
      case 'topLeft':
        this.x += spriteDistanceX;
        this.y += spriteDistanceX / this.ratio;
        this.width -= spriteDistanceX;
        this.height -= spriteDistanceX / this.ratio;
        break;
      case 'bottomRight':
        this.width += spriteDistanceX;
        this.height += spriteDistanceX / this.ratio;
        break;
      case 'bottomLeft':
        this.x += spriteDistanceX;
        this.width -= spriteDistanceX;
        this.height -= spriteDistanceX / this.ratio;
        break;
      case 'topRight':
        this.y -= spriteDistanceX / this.ratio;
        this.width += spriteDistanceX;
        this.height += spriteDistanceX / this.ratio;
    }

    // 越界矫正
    if (
      this.width < spriteRectSize * 2
      || this.height < spriteRectSize * 2
      || this.isOutOfBound({ x: this.x, y: this.y })
      || this.isOutOfBound({ x: this.x + this.width, y: this.y + this.height})
    ) {
      this.x = prevState.x;
      this.y = prevState.y;
      this.width = prevState.width;
      this.height = prevState.height;
    }
  }

  output = (): IImgSpriteData => {
    const { x, y, width, height } = this.realPosition();

    return {
      img_url: this.imageUrl,
      position: {
        x: fixNumber(x),
        y: fixNumber(y)
      },
      resize: {
        width: fixNumber(width),
        height: fixNumber(height)
      }
    };
  }
}