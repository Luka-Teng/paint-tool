import {
  DragIcon,
  SpriteType,
  ITextSpriteData,
  IImgSpriteData,
  IRectSpriteData,
  ITempSpriteData,
  IGraffitiSpriteData,
  IActiveOptions2Sprirte,
  IPosition,
  IDrawPostion
} from '../types';
import Axis from '../axis';

type RangeType = IDrawPostion;
type overflowHandleType = 'cut' | 'move';

/**
 * sprite需要承担不同坐标系的互相转化
 * 保证对外使用的时候，外部只需关心canvas坐标系
 * 需要保证的是，在sprite内部所有的计算都要用到sprite坐标
 * 只有output输出需要用到
 */

export abstract class Sprite {
  constructor(axis: Axis) {
    // 唯一key
    this.key = Math.random()
      .toString(36)
      .slice(2);

    // 激活状态
    this.active = false;

    // 记录坐标系
    this.axis = axis;
  }

  key: string; // 唯一key
  x: number; // 在原图上的坐标x
  y: number; // 在原图上的坐标y
  type: SpriteType; // 精灵类型
  active: boolean; // 是否处于激活状态
  width: number; // 在原图上展示的宽度
  height: number; // 在原图上展示的高度
  content: any; // 精灵内容
  canResize: boolean; // 是否可以改变大小
  name?: string; // template、patch_img对应的唯一name
  textArray?: string[]; // text使用
  axis: Axis; // 记录坐标系

  // 绘画
  abstract draw(
    ctx: CanvasRenderingContext2D,
    activeOptions: IActiveOptions2Sprirte
  ): void;

  // 初始化sprite数据，canvas转sprite
  abstract initSpritePositionData(data: Record<string, any>): {
    spriteX: number;
    spriteY: number;
    spriteWidth: number;
    spriteHeight: number;
  }

  // 当前点击事件是否命中精灵
  abstract isHit(eventX: number, eventY: number): boolean;

  // 数据输出
  abstract output(): ITextSpriteData | IImgSpriteData | IRectSpriteData | ITempSpriteData | IGraffitiSpriteData;

  // 返回相对原图的坐标、尺寸
  realPosition() {
    const { x, y, width, height } = this;
    const { pointSprite2Origin, lengthSprite2Origin } = this.axis;

    return {
      ...pointSprite2Origin({ x, y }),
      width: lengthSprite2Origin(width || 0, 'x'),
      height: lengthSprite2Origin(height || 0, 'y')
    };
  }

  // 返回相对于canvas的坐标
  canvasPosition () {
    const { x, y, width, height } = this;
    const { pointSprite2Canvas, lengthSprite2Canvas } = this.axis;

    return {
      ...pointSprite2Canvas({ x, y }),
      width: lengthSprite2Canvas(width || 0),
      height: lengthSprite2Canvas(height || 0)
    };
  }

  // 返回绘制需要要的canvas坐标和宽高
  getDrawData () {
    const { x, y, width, height } = this;
    const { pointSprite2Canvas, lengthSprite2Canvas } = this.axis;
    return {
      ...pointSprite2Canvas({ x, y }),
      width: lengthSprite2Canvas(width),
      height: lengthSprite2Canvas(height)
    };
  }

  // 获取当前canvas画布相对于sprite的坐标
  getSpriteAxisForCanvas () {
    const { pointCanvas2Sprite, lengthCanvas2Sprite, canvasSize } = this.axis;
    return {
      ...pointCanvas2Sprite({ x: 0, y: 0 }),
      width: lengthCanvas2Sprite(canvasSize.width),
      height: lengthCanvas2Sprite(canvasSize.height)
    };
  }

  // 精灵移动
  move = (distanceX: number, distanceY: number): void => {
    const { lengthCanvas2Sprite, canvasSize } = this.axis;
    this.x += lengthCanvas2Sprite(distanceX);
    this.y += lengthCanvas2Sprite(distanceY);
    this.reSetPositionIfOverflow({ x: 0, y: 0, ...canvasSize });
  }

  /**
   * 用于sprite越界的调整
   * 越界调整存在两种策略
   * 一种是裁剪 -- cut 适用于drag等
   * 一种是平移 -- move 使用于move，初始化等
   */
  reSetPositionIfOverflow = (
    spritePosition: IPosition,
    mode: {
      left: overflowHandleType;
      right: overflowHandleType;
      top: overflowHandleType;
      bottom: overflowHandleType;
    } | 'cut' | 'move' = { left: 'move', right: 'move', top: 'move', bottom: 'move' }
  ) => {
    let left: overflowHandleType = 'move';
    let right: overflowHandleType = 'move';
    let top: overflowHandleType = 'move';
    let bottom: overflowHandleType = 'move';

    if (mode === 'cut') {
      left = 'cut';
      right = 'cut';
      top = 'cut';
      bottom = 'cut';
    }

    if (typeof mode === 'object') {
      left = mode.left;
      right = mode.right;
      top = mode.top;
      bottom = mode.bottom;
    }

    if (this.x < spritePosition.x) {
      this.x = spritePosition.x;
      if (left === 'cut') {
        this.width -= spritePosition.x - this.x;
      }
    }

    if (spritePosition.width && (this.x + this.width > spritePosition.x + spritePosition.width)) {
      if (right === 'cut') {
        this.width = spritePosition.x + spritePosition.width - this.x;
      }

      if (right === 'move') {
        this.x = spritePosition.x + spritePosition.width - this.width;
      }
    }

    if (this.y < spritePosition.y) {
      this.y = spritePosition.y;
      if (top === 'cut') {
        this.height -= spritePosition.y - this.y;
      }
    }

    if (spritePosition.height && (this.y + this.height > spritePosition.y + spritePosition.height)) {
      if (bottom === 'cut') {
        this.height = spritePosition.y + spritePosition.height - this.y;
      }

      if (bottom === 'move') {
        this.y = spritePosition.y + spritePosition.height - this.height;
      }
    }
  }

  // 当前的canvas坐标点是否在特定区域内
  isCanvasPointInSpriteRange = (point: IPosition, range: RangeType) => {
    const { pointCanvas2Sprite } = this.axis;
    const { x, y, width, height } = range;
    const { x: px, y: py } = pointCanvas2Sprite(point);
    if ((px > x) && (px < x + width) && (py > y) && (py < y + height)) {
      return true;
    }
    return false;
  }

  // 当前的sprite坐标点是否存在越界
  isOutOfBound = (point: IPosition) => {
    const { width, height } = this.axis.canvasSize;
    const { x: px, y: py } = point;
    if ((px > 0) && (px < width) && (py > 0) && (py < height)) {
      return false;
    }
    return true;
  }

  // 判断一个sprite是否具有意义
  isValid = () => {
    return true;
  }

  // 是否命中拖拽点
  isHitGrow = (eventX: number, eventY: number): DragIcon => {
    console.error(
      '[Correct Tool]' +
      'Call Error: If you can see it, then the inherited class does not implement this method.' +
      `Call Method: 'isHitGrow', ${eventX} ${eventY}`
    );
    return false;
  };

  // 精灵拖拽
  drag = (type: DragIcon, distanceX: number, distanceY: number): void => {
    throw new Error(
      '[Correct Tool]' +
      'Call Error: If you can see it, then the inherited class does not implement this method.\n' +
      `Call Method: 'drag', ${distanceX}, ${distanceY}`
    );
  }

  // 初始化行为，如rect的初始画框，画笔的初始绘画
  init = (...args: any[]): void => {
    throw new Error(
      '[Correct Tool]' +
      'Call Error: If you can see it, then the inherited class does not implement this method.\n' +
      `Call Method: 'init', ${args}`
    );
  }

  // 初始化行为结束，如rect的初始画框结束，画笔的初始绘画结束
  finish = (...args: any[]): void => {
    throw new Error(
      '[Correct Tool]' +
      'Call Error: If you can see it, then the inherited class does not implement this method.\n' +
      `Call Method: 'finish', ${args}`
    );
  }

  // 修改文本，text使用
  updateText = (str: string): void => {
    throw new Error(
      '[Correct Tool]' +
      'Call Error: If you can see it, then the inherited class does not implement this method.\n' +
      `Call Method: 'updateText', ${str}`
    );
  }
}