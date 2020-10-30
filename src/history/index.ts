import Stage from '../stage';
import { convertDefinitionToStack } from './types';

/**
 * 历史记录存储器
 */
type OptionsType = {
  maxStacks?: number;
}

// 历史记录监听类型
type ListenerOptionsType<T> = {
  stacks: convertDefinitionToStack<T>[][];
  canForward: boolean;
  canBack: boolean;
}
type ListenerType<T> = (options: ListenerOptionsType<T>) => void

class History<T extends Record<string, any>> {
  private historyStacks: convertDefinitionToStack<T>[][] = []
  private maxStacks = 20
  private currentIndex = 0
  private definition: T
  private stage: Stage
  private listeners: ListenerType<T>[] = []

  constructor (definition: T, stage: Stage, options?: OptionsType) {
    this.definition = definition;
    this.stage = stage;
    // options初始化
    if (options) {
      const { maxStacks } = options;
      if (maxStacks) {
        this.maxStacks = maxStacks;
      }
    }
  }

  /**
   * 推入历史记录
   * 推入数组将形成联合记录
   * 联合历史记录表示一个记录支持多个definition操作
   */
  public push = (stackItems: convertDefinitionToStack<T> | convertDefinitionToStack<T>[]) => {
    if (this.maxStacks === 0) {
      return;
    }

    if (this.currentIndex === this.maxStacks) {
      this.historyStacks.shift();
      this.currentIndex--;
    }

    this.historyStacks.splice(
      this.currentIndex,
      this.historyStacks.length - this.currentIndex,
      stackItems instanceof Array ? stackItems : [stackItems]
    );

    this.currentIndex++;
    this.execHistorylisteners();
  }

  // 前进
  public forward = () => {
    if (this.canForward()) {
      this.exec(this.currentIndex, 'forward');
      this.currentIndex++;
      this.execHistorylisteners();
    }
  }

  // 后退
  public back = () => {
    if (this.canBack()) {
      this.exec(this.currentIndex - 1, 'back');
      this.currentIndex--;
      this.execHistorylisteners();
    }
  }

  // clear
  public clear = () => {
    this.currentIndex = 0;
    this.historyStacks = [];
    this.execHistorylisteners();
  }

  // 执行definition
  private exec = (index: number, type: 'back' | 'forward') => {
    const stack = this.historyStacks[index];
    stack.forEach(def => {
      if (this.definition[def.type]) {
        this.definition[def.type].call(this, type, this.stage, ...def.payload);
      }
    });
    this.stage.upperDrawer.paint();
    this.stage.imageDrawer.paint();
    this.stage.callback();
    this.stage.currentSprite = null;
  }

  // 是否能前进
  public canForward = () => {
    return this.currentIndex < this.historyStacks.length;
  }

  // 是否能后退
  public canBack = () => {
    return this.currentIndex <= this.historyStacks.length && this.currentIndex > 0;
  }

  // 推入历史记录改变时的监听
  public onHistoryChange = (fn: ListenerType<T>) => {
    this.listeners.push(fn);
  }

  // 执行历史记录的监听
  private execHistorylisteners = () => {
    this.listeners.forEach(listener => {
      listener({
        stacks: this.historyStacks,
        canBack: this.canBack(),
        canForward: this.canForward()
      });
    });
  }

  // 取消历史记录的监听
  public removeHistorylistener = fn => {
    const index = this.listeners.findIndex(listener => listener === fn);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }
}

export default History;