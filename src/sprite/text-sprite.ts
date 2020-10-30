import Axis from '../axis';
import {
  ITextOptions,
  ITextSpriteData,
  IActiveOptions2Sprirte,
  IPosition
} from '../types';
import { fontSize, fontFamily } from '../config';
import { fixNumber, getCanvasCtx } from '../utils';
import { Sprite } from './base';

/* eslint-disable @typescript-eslint/camelcase,camelcase */

interface ITextSpriteProps {
  x: number;
  y: number;
  text: string[];
  axis: Axis;
  options?: ITextOptions;
}

/**
 * 文本
 */
export class TextSprite extends Sprite {
  constructor({ x, y, text, options, axis }: ITextSpriteProps) {
    super(axis);

    const { color, font_size, font_space } = options || {};
    if (color) {
      this.options.color = color;
    }
    if (font_size) {
      this.options.font_size = font_size;
    }
    if (font_space) {
      this.options.font_space = font_space;
    }
    const { lengthCanvas2Sprite } = this.axis;
    this.spriteFontSize = lengthCanvas2Sprite(this.options.font_size);
    const {
      spriteHeight,
      spriteWidth,
      spriteX,
      spriteY
    } = this.initSpritePositionData({ x, y, textArray: text });
    this.width = spriteWidth;
    this.height = spriteHeight;
    this.type = 'text';
    this.content = text;
    this.textArray = text;
    this.displayArray = text.map(t => [t]);

    this.x = spriteX;
    this.y = spriteY;

    this.textOutArea();
    this.reSetPositionIfOverflow(this.getSpriteAxisForCanvas());
  }

  canResize = false;

  textArray: string[]; // 输出文字

  displayArray: string[][] = []; // 展示文字

  spriteFontSize: number;

  options = {
    color: {
      red: 255,
      green: 99,
      blue: 55,
      alpha: 1
    },
    font_size: fontSize,
    font_space: 1
  };

  initSpritePositionData = ({x, y, textArray}: IPosition & { textArray: string[] }) => {
    const { pointCanvas2Sprite } = this.axis;
    const { x: spriteX, y: spriteY } = pointCanvas2Sprite({ x, y });
    const spriteWidth = this.getTextWidth(this.findMaxWidthText(textArray));
    const spriteHeight = textArray.length * this.spriteFontSize;
    return {
      spriteX,
      spriteY,
      spriteWidth,
      spriteHeight
    };
  }

  // 更新样式
  public updateStyle = (options: ITextOptions) => {
    const { color, font_size, font_space } = options;
    if (color) {
      this.options.color = color;
    }

    if (font_size) {
      this.spriteFontSize = this.spriteFontSize * font_size / this.options.font_size;
      this.options.font_size = font_size;
    }

    if (font_space) {
      this.options.font_space = font_space;
    }
  }

  // 计算文本在画布上的宽度
  private getTextWidth = (str: string) => {
    const ctx = getCanvasCtx();
    const { lengthCanvas2Sprite, lengthSprite2Canvas } = this.axis;
    ctx.font = `${lengthSprite2Canvas(this.spriteFontSize)}px ${fontFamily}`;
    return lengthCanvas2Sprite(ctx.measureText(str).width);
  }

  // 找出最长的文本
  private findMaxWidthText = (textArray: string[]) => {
    let displayMaxStr = '';
    let maxWidth = 0;

    for (let i = 0, len = textArray.length; i < len; i++) {
      const text = textArray[i];
      const width = this.getTextWidth(text);

      if (maxWidth < width) {
        maxWidth = width;
        displayMaxStr = text;
      }
    }

    return displayMaxStr;
  }

  // 绘画
  public draw = (
    ctx: CanvasRenderingContext2D,
    activeOptions: IActiveOptions2Sprirte
  ) => {
    const { displayArray, active, options } = this;
    const { color } = activeOptions;
    const { red, green, blue, alpha } = options.color;
    const { x, y } = this.getDrawData();
    const { lengthSprite2Canvas } = this.axis;
    const fontSize = lengthSprite2Canvas(this.spriteFontSize);

    ctx.textBaseline = 'bottom';
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

    let rows = 1;
    let maxStr = '';

    for (let i = 0, len = this.displayArray.length; i < len; i++) {
      const strRow = displayArray[i];
      const str = this.findMaxWidthText(strRow);
      maxStr = str.length > maxStr.length ? str : maxStr;
      if (strRow) {
        for (let j = 0, jLen = strRow.length; j < jLen; j++) {
          ctx.fillText(
            strRow[j],
            x,
            y + rows * fontSize
          );
          rows++;
        }
      }
    }

    ctx.fillStyle = `rgba(${color.red},${color.green},${color.blue},0.1)`;
    ctx.strokeStyle = `rgb(${color.red},${color.green},${color.blue})`;

    if (active) {
      ctx.lineWidth = activeOptions.width;
      ctx.fillRect(x, y, lengthSprite2Canvas(this.getTextWidth(maxStr)), (rows - 1) * fontSize);
      ctx.strokeRect(x, y, lengthSprite2Canvas(this.getTextWidth(maxStr)), (rows - 1) * fontSize);
    }
  }

  public isHit = (eventX: number, eventY: number) => {
    const { x, y, width, height } = this;

    return this.isCanvasPointInSpriteRange(
      { x: eventX, y: eventY },
      { x, y, width, height }
    );
  }

  move = (distanceX: number, distanceY: number): void => {
    const { lengthCanvas2Sprite, canvasSize } = this.axis;
    const spriteDistanceX = lengthCanvas2Sprite(distanceX);
    const spriteDistanceY = lengthCanvas2Sprite(distanceY);

    this.x += spriteDistanceX;
    this.y += spriteDistanceY;
    this.textOutArea();
    this.reSetPositionIfOverflow({ x: 0, y: 0, ...canvasSize });
  }

  public output = (): ITextSpriteData => {
    const { options } = this;
    const { x, y } = this.realPosition();
    const { lengthSprite2Origin } = this.axis;
    const content: string[] = [];

    this.displayArray.forEach(arr => {
      content.push(...arr);
    });

    return {
      content,
      position: {
        x: fixNumber(x),
        y: fixNumber(y)
      },
      cnf: {
        ...options,
        color: {
          ...this.options.color,
          alpha: Math.round(this.options.color.alpha * 255)
        },
        font_size: fixNumber(lengthSprite2Origin(this.spriteFontSize, 'x'))
      }
    };
  }

  // 更新文本
  public updateText = (str: string) => {
    const textArray = str.split('\n');
    this.textArray = textArray;
    this.textOutArea();
  }

  // 文本换行
  public textOutArea = () => {
    const { textArray } = this;
    const { width } = this.axis.canvasSize;
    const { x } = this;

    const maxStr = this.findMaxWidthText(textArray);

    // 一行放的下，直接返回
    if (x + this.getTextWidth(maxStr) <= width) {
      this.displayArray = textArray.map(t => [t]);
      this.width = this.getTextWidth(maxStr);
      this.height = this.displayArray.length * this.spriteFontSize;
      return;
    }

    this.displayArray = [];

    // 超出计算
    for (let i = 0, len = textArray.length; i < len; i++) {
      const str = textArray[i];
      this.displayArray[i] = [];

      if (x + this.getTextWidth(str) <= width) {
        // 未超出
        this.displayArray[i] = [str];
        this.width = this.getTextWidth(str);
        this.height = this.displayArray.length * this.spriteFontSize;
        continue;
      }

      const stringArry = str.split('');
      let text = '';
      let start = 0;

      for (let j = 0, jLen = stringArry.length; j < jLen; j++) {
        text += stringArry[j];

        if (x + this.getTextWidth(text) > width - this.spriteFontSize) {
          this.displayArray[i].push(stringArry.slice(start, j + 1).join(''));
          text = '';
          start = j + 1;
        }
      }

      // 最后一行
      if (stringArry.slice(start, stringArry.length).length !== 0) {
        this.displayArray[i].push(stringArry.slice(start, stringArry.length).join(''));
      }
    }

    let rows = 0;
    let displayMaxStr = '';

    for (let i = 0, len = this.displayArray.length; i < len; i++) {
      const strRow = this.displayArray[i];
      const str = this.findMaxWidthText(strRow);
      displayMaxStr = this.getTextWidth(str) > this.getTextWidth(displayMaxStr) ? str : displayMaxStr;
      if (strRow) {
        for (let j = 0, jLen = strRow.length; j < jLen; j++) {
          rows++;
        }
      }
    }

    this.width = this.getTextWidth(displayMaxStr);
    this.height = rows * this.spriteFontSize;
  }
}