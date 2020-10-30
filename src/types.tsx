/* eslint-disable camelcase */

/**
 * 拖拽点描述
 */
export type DragIcon =
  'topCenter' |
  'rightCenter' |
  'leftCenter' |
  'bottomCenter' |
  'topLeft' |
  'topRight' |
  'bottomLeft' |
  'bottomRight' |
  false;

/**
 * 画布宽高
 */
export interface TypeImageInfo {
  width: number;
  height: number;
}

/**
 * 坐标
 */
export interface IPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/**
 * 画布偏移量
 */
export interface IOffsetPostion {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * 绘画坐标
 */
export interface IDrawPostion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 自定义图片数据结构
 */
export interface IImgSpriteData {
  img_url: string;
  position: IPosition;
  resize?: {
    width: number;
    height: number;
  };
}

export interface IColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

/**
 * 文本配置
 */
export interface ITextOptions {
  color?: IColor;
  font_size?: number;
  font_space?: number; // @TODO 这个字段表示为 line-height 二期支持
}

/**
 * 文本数据结构
 */
export interface ITextSpriteData {
  content: string[];
  position: IPosition;
  cnf?: ITextOptions;
}

/**
 * 框选、涂鸦配置
 */
export interface IRectOptions {
  color?: IColor;
  width?: number;
}

/**
 * 框选数据结构
 */
export interface IRectSpriteData {
  start_pos: IPosition;
  dest_pos: IPosition;
  cnf?: IRectOptions;
}

/**
 * 模版数据结构
 */
export interface ITempSpriteData {
  name: string;
  position: IPosition;
  resize?: {
    width: number;
    height: number;
  };
}

/**
 * 涂鸦数据结构
 */
export interface IGraffitiSpriteData {
  position: string;
  cnf?: IRectOptions;
}

/**
 * 涂鸦配置
 */
export interface IGraffitiSpriteOptions {
  colors?: IColor[];
  width?: number[];
  defaultOption?: {
    color: IColor;
    width: number;
  };
}

/**
 * 精灵被选中时样式
 */
export interface IActiveOptions {
  width?: number;
  color?: {
    red: number;
    green: number;
    blue: number;
  };
}

/**
 * 精灵被选中时样式(精灵中使用)
 */
export type IActiveOptions2Sprirte = Required<IActiveOptions>;

/**
 * 输入输出sprite数据结构
 */
export interface ISpriteData {
  patch_img?: IImgSpriteData[];
  rectangle?: IRectSpriteData[];
  text?: ITextSpriteData[];
  template?: ITempSpriteData[];
  graffiti?: IGraffitiSpriteData[];
}

/**
 * 画布相关信息数据结构
 */
export interface IStageData {
  bg_src_ops?: ({
    bg_canvas?: {
      bg_size: number;
      start_pos: IPosition;
      bg_color: IColor;
    };
  } | {
    bg_src_rotate?: {
      angle: number;
    };
  })[];
}

// 精灵类型 & 操作类型
export type SpriteType = keyof ISpriteData;

/**
 * 老版本数据结构
 */
export interface IOldSpriteData {
  x: number;
  y: number;
  width: number;
  height: number;
  content: {
    type: string;
    [key: string]: any;
  };
}