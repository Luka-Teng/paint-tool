import React from 'react';
import {
  IPosition,
  SpriteType,
  ISpriteData,
  ITextOptions,
  IRectOptions,
  TypeImageInfo,
  IActiveOptions,
  IActiveOptions2Sprirte
} from '../types';
import { Sprite, TextSprite, TemplateSprite, ImgSprite, RectSprite, GraffitiSprite } from '../sprite/index';
import Axis from '../axis';

/* eslint-disable camelcase,@typescript-eslint/camelcase */

interface IDrawerProps {
  id: string;
  width: number;
  height: number;
  originImage: HTMLImageElement;
  activeOptions?: IActiveOptions;
  axis: Axis;
}

interface IDrawerState {
  width: number;
  height: number;
  activeOptions: IActiveOptions2Sprirte;
}

export class UpperDrawer extends React.Component<IDrawerProps, IDrawerState> {
  constructor(props: IDrawerProps) {
    super(props);

    const activeOptions = {
      width: 2,
      color: {
        red: 255,
        green: 125,
        blue: 113
      }
    };

    if (props.activeOptions) {
      const { width, color } = props.activeOptions;

      if (width) {
        activeOptions.width = width;
      }

      if (color) {
        activeOptions.color = color;
      }
    }

    this.state = {
      width: props.width,
      height: props.height,
      activeOptions
    };
  }

  ctx: CanvasRenderingContext2D; // canvas context

  canvas: HTMLCanvasElement; // 画布

  drawList: Sprite[] = []; // 当前已绘制的全部精灵

  cache?: ImageData; // 缓存

  static getDerivedStateFromProps(props: IDrawerProps, state: IDrawerState) {
    const activeOptions = state.activeOptions;

    if (props.activeOptions) {
      const { width, color } = props.activeOptions;

      if (width) {
        activeOptions.width = width;
      }

      if (color) {
        activeOptions.color = color;
      }
    }

    return {
      width: props.width,
      height: props.height,
      activeOptions
    };
  }

  get canvasSize(): TypeImageInfo {
    return {
      width: this.state.width,
      height: this.state.height
    } as TypeImageInfo;
  }

  private getCanvas = (canvas: HTMLCanvasElement) => {
    if (canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    }
  }

  // 修改文本值
  public changeTextValue = (key: string, value: string) => {
    const sprite = this.drawList.find(sprite => sprite.key === key);

    if (!sprite || sprite.type !== 'text') {
      return;
    }
    (sprite as TextSprite).updateText(value);
  }

  // 修改文本样式
  public changeTextStyle = (key: string, style: Record<string, any>) => {
    const sprite = this.drawList.find(sprite => sprite.key === key);
    const { fontSize, color } = style;
    if (!sprite || sprite.type !== 'text') {
      return;
    }
    (sprite as TextSprite).updateStyle({ color, font_size: fontSize });
    (sprite as TextSprite).textOutArea();
  }

  // 修改涂鸦样式
  public changeGraffitiStyle = (key: string, style: Record<string, any>) => {
    const sprite = this.drawList.find(sprite => sprite.key === key);

    if (!sprite || sprite.type !== 'graffiti') {
      return;
    }
    (sprite as GraffitiSprite).updateStyle(style);
  }

  // 生成graffiti精灵
  public createGraffitiSprite = (points: IPosition[], graffitiOptions?: IRectOptions) => {
    this.setCache();
    const { activeOptions } = this.state;
    const { axis } = this.props;
    const el = new GraffitiSprite({
      points,
      options: graffitiOptions,
      axis
    });
    el.draw(this.ctx, activeOptions);
    this.drawList.push(el);
    return el;
  }

  // 生成text精灵
  public createTextSprite = (text: string, canvasPosition: IPosition, textOptions?: ITextOptions) => {
    const { activeOptions } = this.state;
    const { axis } = this.props;
    const el = new TextSprite({
      x: canvasPosition.x,
      y: canvasPosition.y,
      text: text.split(/[\n\r]/),
      options: textOptions,
      axis
    });
    el.draw(this.ctx, activeOptions);
    this.drawList.push(el);
    return el;
  }

  // 生成template精灵
  public createTemplateSprite = (name: string, image: HTMLImageElement, canvasPosition: IPosition, createMode: 'leftTop' | 'center' = 'center') => {
    const { activeOptions } = this.state;
    const { axis } = this.props;
    const el = new TemplateSprite({
      name,
      x: canvasPosition.x,
      y: canvasPosition.y,
      width: canvasPosition.width,
      height: canvasPosition.height,
      image,
      createMode,
      axis
    });
    el.draw(this.ctx, activeOptions);
    this.drawList.push(el);
    return el;
  }

  // 生成img精灵
  public createImgSprite = (name: string, image: HTMLImageElement, imageUrl: string, canvasPosition: IPosition, createMode: 'leftTop' | 'center' = 'center') => {
    const { activeOptions } = this.state;
    const { axis } = this.props;
    const el = new ImgSprite({
      name,
      x: canvasPosition.x,
      y: canvasPosition.y,
      width: canvasPosition.width,
      height: canvasPosition.height,
      image,
      imageUrl,
      createMode,
      axis
    });
    el.draw(this.ctx, activeOptions);
    this.drawList.push(el);
    return el;
  }

  // 生成rect精灵
  public createRectSprite = (canvasPosition: IPosition, rectOptions?: IRectOptions) => {
    this.setCache(); // 如果是画框，需要特殊处理
    const { activeOptions } = this.state;
    const { axis } = this.props;
    const el = new RectSprite({
      x: canvasPosition.x,
      y: canvasPosition.y,
      width: canvasPosition.width,
      height: canvasPosition.height,
      options: rectOptions,
      axis
    });
    el.draw(this.ctx, activeOptions);
    this.drawList.push(el);
    return el;
  }

  // 输出数据
  public output = (): ISpriteData => {
    const { drawList } = this;
    const data: ISpriteData = {};
    for (let i = 0, len = drawList.length; i < len; i++) {
      const { type, output } = drawList[i];
      !data[type] && (data[type] = []);
      (data[type] as any).push(output());
    }

    return data;
  }

  // 数据转换
  public data2Sprite = (
    initData: ISpriteData,
    templateMap: Record<string, HTMLImageElement>,
    patchImgs: Record<string, { url: string; img: HTMLImageElement}>
  ) => {
    const { template = [], text = [], patch_img = [], rectangle = [], graffiti = [] } = initData;
    const patchImgEntries = Object.entries(patchImgs);
    const { pointOrigin2Canvas, lengthOrigin2Canvas } = this.props.axis;

    template.forEach(t => {
      this.createTemplateSprite(
        t.name,
        templateMap[t.name],
        {
          ...pointOrigin2Canvas({
            x: t.position.x,
            y: t.position.y
          }),
          width: t.resize && lengthOrigin2Canvas(t.resize.width, 'x'),
          height: t.resize && lengthOrigin2Canvas(t.resize.height, 'y')
        },
        'leftTop'
      );
    });

    patch_img.forEach(p => {
      const patchImg = patchImgEntries.find(([, obj]) => p.img_url === obj.url);
      if (patchImg) {
        this.createImgSprite(
          patchImg[0],
          patchImg[1].img,
          p.img_url,
          {
            ...pointOrigin2Canvas({
              x: p.position.x,
              y: p.position.y
            }),
            width: p.resize && lengthOrigin2Canvas(p.resize.width, 'x'),
            height: p.resize && lengthOrigin2Canvas(p.resize.height, 'y')
          },
          'leftTop'
        );
      }
    });

    text.forEach(t => {
      if (t.cnf && t.cnf.color) {
        t.cnf.color.alpha = t.cnf.color.alpha / 255;
      }

      if (t.cnf && t.cnf.font_size) {
        t.cnf.font_size = lengthOrigin2Canvas(t.cnf.font_size, 'x');
      }

      this.createTextSprite(
        t.content.join('\n'),
        {
          ...pointOrigin2Canvas({
            x: t.position.x,
            y: t.position.y
          })
        },
        t.cnf
      );
    });

    rectangle.forEach(r => {
      if (r.cnf && r.cnf.color) {
        r.cnf.color.alpha = r.cnf.color.alpha / 255;
      }
      this.createRectSprite(
        {
          ...pointOrigin2Canvas({
            x: r.start_pos.x,
          y: r.start_pos.y
          }),
          width: lengthOrigin2Canvas((r.dest_pos.x - r.start_pos.x), 'x'),
          height: lengthOrigin2Canvas((r.dest_pos.y - r.start_pos.y), 'y')
        },
        r.cnf
      );
    });

    graffiti.forEach(g => {
      if (g.cnf && g.cnf.color) {
        g.cnf.color.alpha = g.cnf.color.alpha / 255;
      }
      this.createGraffitiSprite(
        JSON.parse(g.position).map(pointOrigin2Canvas),
        g.cnf
      );
    });
  }

  // 是否命中了精灵
  public isHit = (eventX: number, eventY: number): Sprite | null => {
    const sprites = this.drawList.filter(sprite => sprite.isHit(eventX, eventY));
    return sprites.pop() || null;
  }

  // 清除
  public clear = (actionNames?: SpriteType[], actionKeys?: string[]) => {
    if (actionNames && actionNames.length > 0) {
      if (actionNames.includes('template') || actionNames.includes('patch_img')) {
        const otherTypes = actionNames.filter(t => t !== 'template' && t !== 'patch_img');
        // 如果是template\patch_img，过滤指定id
        this.drawList = this.drawList.filter(
          item =>
            (
              ['template', 'patch_img'].includes(item.type) &&
              (actionKeys && actionKeys.includes(item.name as string))
            ) || otherTypes.includes(item.type)
        );
      } else {
        this.drawList = this.drawList.filter(item => !actionNames.includes(item.type));
      }
    } else {
      this.drawList = [];
    }

    this.paint();
  }

  // 缓存
  public setCache = (currentSprite?: Sprite) => {
    const { ctx, drawList } = this;
    const filterArry = currentSprite ? drawList.filter(item => item.key !== currentSprite.key) : drawList;
    this.paint(currentSprite, filterArry);
    this.cache = ctx.getImageData(0, 0, this.state.width, this.state.height);
  }

  // 重绘缓存
  public paintFromCache = (currentSprite?: Sprite) => {
    const { ctx, drawList, cache } = this;
    const { activeOptions } = this.state;
    cache && ctx.putImageData(cache, 0, 0); // 填充背景
    const el = drawList.find(item => currentSprite && currentSprite.key === item.key); // 过滤操作的精灵
    el && el.draw(ctx, activeOptions);
  }

  // 绘图
  public paint = (currentSprite?: Sprite, list?: Sprite[]) => {
    const { ctx, drawList } = this;
    const { width, height, activeOptions } = this.state;
    const currentList = list || drawList;
    // 清除画布
    ctx.clearRect(0, 0, width, height);

    for (let i = 0, len = currentList.length; i < len; i++) {
      const item = currentList[i];
      // 检测是否有选中状态
      item.active = !!currentSprite && currentSprite.key === item.key;
      item.draw(ctx, activeOptions);
    }
  }

  // 删除某个sprite
  public removeSprite = (sprite: Sprite) => {

    const surviveList = this.drawList.filter(item => item.key !== sprite.key);

    if (surviveList.length !== this.drawList.length) {
      this.drawList = surviveList;
    }
  }

  render() {
    const { width, height } = this.state;
    return (
      <canvas
        width={width}
        height={height}
        className="upper-canvas"
        data-handle-key={this.props.id}
        ref={this.getCanvas}
      />
    );
  }
}