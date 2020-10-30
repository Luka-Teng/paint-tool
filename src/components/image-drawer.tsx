import React from 'react';
import Axis from '../axis';
import { IColor } from '../types';

interface IDrawerProps {
  width: number;
  height: number;
  image: HTMLImageElement;
  axis: Axis;
  backgroundColor: IColor;
}

interface IDrawerState {
  width: number;
  height: number;
  image: HTMLImageElement;
}

/**
 * 原图canvas
 */
export class ImageDrawer extends React.Component<IDrawerProps, IDrawerState> {
  constructor(props: IDrawerProps) {
    super(props);

    this.state = {
      image: props.image,
      width: props.width,
      height: props.height
    };
  }

  canvas: HTMLCanvasElement; // 画布
  ctx: CanvasRenderingContext2D; // canvas context

  static getDerivedStateFromProps(props: IDrawerProps) {
    return {
      image: props.image,
      width: props.width,
      height: props.height
    };
  }

  private getCanvas = (canvas: HTMLCanvasElement) => {
    if (canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    }
  }

  public paint = () => {
    const { zeroX: spriteZeroX, zeroY: spriteZeroY } = this.props.axis.spriteAxis;
    const { zeroX, zeroY } = this.props.axis.originAxis;
    const { pointSprite2Canvas, lengthOrigin2Canvas, lengthSprite2Canvas, imageSize } = this.props.axis;
    const { x, y } = pointSprite2Canvas({ x: zeroX, y: zeroY });
    const { image, width, height } = this.state;
    const { backgroundColor } = this.props;
    const { red, green, blue, alpha } = backgroundColor;
    if (!image) {
      return;
    }
    this.ctx.clearRect(0, 0, width, height);

    // 背景颜色
    this.ctx.save();
    this.ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
    this.ctx.fillRect(spriteZeroX, spriteZeroY, lengthSprite2Canvas(width), lengthSprite2Canvas(height));
    this.ctx.restore();

    // 绘制原图
    this.ctx.drawImage(image, x, y, lengthOrigin2Canvas(imageSize.width, 'x'), lengthOrigin2Canvas(imageSize.height, 'y'));
  }

  componentDidUpdate() {
    this.paint();
  }

  componentDidMount() {
    this.paint();
  }

  render() {
    const { width, height } = this.state;
    return (
      <canvas width={width} height={height} className="image-canvas" ref={this.getCanvas} />
    );
  }
}