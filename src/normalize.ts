import { ISpriteData, IOldSpriteData } from './types';
import { ICON, fontSize, fontFamily } from './config';

/* eslint-disable camelcase,@typescript-eslint/camelcase */

const acitonMap = {
  'Score_0': 'number0',
  'Score_1': 'number1',
  'Score_2': 'number2',
  'Score_3': 'number3',
  'Score_4': 'number4',
  'Score_5': 'number5',
  'Score_6': 'number6',
  'Score_7': 'number7',
  'Score_8': 'number8',
  'Score_9': 'number9',
  'Score_10': 'number10',
  'Score_11': 'number11',
  'Score_12': 'number12',
  'Score_13': 'number13',
  'Score_14': 'number14',
  'Score_15': 'number15',
  'Score_16': 'number16',
  'Score_17': 'number17',
  'Score_18': 'number18',
  'Score_19': 'number19',
  'Score_20': 'number20',
  'Right_1': 'right',
  'HalfRight_1': 'half',
  'Wrong_1': 'wrong'
};

/**
 * 新template name 转 老template name
 */
export function newAction2old(actionName: string) {
  return acitonMap[actionName];
}

/**
 * 老template name 转 新template name
 */
export function oldAction2new(actionName: string) {
  const res = Object.entries(acitonMap).find(([, value]) => value === actionName);
  return res ? res[0] : undefined;
}

/**
 * 新数据结构转老数据结构
 */
export function newData2old(data: ISpriteData): IOldSpriteData[] {
  const { template = [], text = [], rectangle = [] } = data;
  const result: IOldSpriteData[] = [];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  function getTextWidth(str: string, fontSize: number) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    return ctx.measureText(str).width;
  }

  template.forEach(t => {
    result.push({
      x: t.position.x,
      y: t.position.y,
      width: t.resize ? t.resize.width : ICON.width,
      height: t.resize ? t.resize.height : ICON.height,
      content: {
        type: newAction2old(t.name)
      }
    });
  });

  text.forEach(t => {
    const size = t.cnf ? (t.cnf.font_size || fontSize) : fontSize;
    result.push({
      x: t.position.x,
      y: t.position.y,
      width: getTextWidth(t.content.join(''), size),
      height: size,
      content: {
        type: 'text',
        text: t.content.join('')
      }
    });
  });

  rectangle.forEach(r => {
    result.push({
      x: r.start_pos.x,
      y: r.start_pos.y,
      width: r.dest_pos.x - r.start_pos.x,
      height: r.dest_pos.y - r.start_pos.y,
      content: {
        type: 'rect'
      }
    });
  });

  return result;
}

/**
 * 老数据结构转新数据结构
 */
export function oldData2new(oldData: IOldSpriteData[]): ISpriteData {
  const result: ISpriteData = {};

  oldData.forEach(data => {
    const { x, y, width, height, content } = data;

    if (content.type === 'text') {
      !result.text && (result.text = []);
      result.text.push({
        position: {
          x,
          y
        },
        content: content.text.split('\n')
      });
      return;
    }

    if (content.type === 'rect') {
      !result.rectangle && (result.rectangle = []);
      result.rectangle.push({
        start_pos: {
          x,
          y
        },
        dest_pos: {
          x: x + width,
          y: y + height
        }
      });
      return;
    }

    !result.template && (result.template = []);
    result.template.push({
      name: oldAction2new(content.type) as string,
      position: {
        x,
        y
      },
      resize: {
        width,
        height
      }
    });
  });

  return result;
}