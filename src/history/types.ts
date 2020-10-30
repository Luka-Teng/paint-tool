import { Sprite } from '../sprite';
import Stage from '../stage';
import { ObjectStoreType } from '../utils';
/**
 * 转化函数
 * {
 *  a: (a: Sprite, b: string) => void;
 *  b: (a: Sprite) => void;
 * }
 * =>
 * {
 *  type: 'a';
 *  payload: [Sprite, string];
 * } | {
 *  type: 'b';
 *  payload: [Sprite];
 * }
 */
type Parameters<
  T extends (...args: any) => any
> = T extends (type: 'forward' | 'back', stage: Stage, ...args: infer P) => any ? P : never;
export type convertDefinitionToStack<T extends Record<string, any>, K = keyof T> = K extends keyof T ? {
  type: K;
  payload: Parameters<T[K]>;
} : never

// 定义类型
type SpriteAddType = {
  spriteAdd: (type: 'forward' | 'back', stage: Stage, spriteStore: ObjectStoreType<Sprite>) => void;
}

type SpriteRemove = {
  spriteRemove: (type: 'forward' | 'back', stage: Stage, sprite: Sprite) => void;
}

type SpriteChange = {
  spriteChange: (
    type: 'forward' | 'back',
    stage: Stage,
    prevSpriteStore: ObjectStoreType<Sprite>,
    nextSpriteStore: ObjectStoreType<Sprite>
  ) => void;
}

type Clear = {
  clear: (type: 'forward' | 'back', stage: Stage, spriteList: Sprite[]) => void;
}

type Rotate = {
  rotate: (type: 'forward' | 'back', stage: Stage, deg: number) => void;
}

type AxisState = {
  x: number;
  y: number;
  scale: number;
}
type Scale = {
  scale: (
    type: 'forward' | 'back',
    stage: Stage,
    prev: AxisState,
    next: AxisState
  ) => void;
}

type Translate = {
  translate: (
    type: 'forward' | 'back',
    stage: Stage,
    prev: Omit<AxisState, 'scale'>,
    next: Omit<AxisState, 'scale'>
    ) => void;
}

export type Definition = SpriteAddType & SpriteRemove & SpriteChange & Clear & Rotate & Scale & Translate
