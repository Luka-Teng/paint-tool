import { Definition } from './types';

const definition: Definition = {
  'spriteAdd': (type, stage, spriteStore) => {
    if (type === 'back') {
      stage.upperDrawer.removeSprite(spriteStore());
    }
    if (type === 'forward') {
      /**
       * 代优化：
       * el需要插入原始位置
       */
      stage.upperDrawer.drawList.push(spriteStore());
    }
  },
  'spriteRemove': (type, stage, sprite) => {
    if (type === 'back') {
      /**
       * 代优化：
       * el需要插入原始位置
       */
      stage.upperDrawer.drawList.push(sprite);
    }
    if (type === 'forward') {
      stage.upperDrawer.removeSprite(sprite);
    }
  },
  'spriteChange': (type, stage, prevSpriteStore, nextSpriteStore) => {
    if (type === 'back') {
      prevSpriteStore();
    }
    if (type === 'forward') {
      nextSpriteStore();
    }
  },
  'clear': (type, stage, spriteList) => {
    if (type === 'back') {
      stage.upperDrawer.drawList = spriteList;
    }
    if (type === 'forward') {
      stage.upperDrawer.drawList = [];
    }
  },
  'rotate': (type, stage, deg) => {
    if (type === 'back') {
      stage.rotate(-deg, true);
    }
    if (type === 'forward') {
      stage.rotate(deg, true);
    }
  },
  'scale': (type, stage, prev, next) => {
    if (type === 'back') {
      const { x, y, scale } = prev;
      stage.axis.setSpriteScale(scale);
      stage.axis.setSpriteZeroPoint({x, y});
    }
    if (type === 'forward') {
      const { x, y, scale } = next;
      stage.axis.setSpriteScale(scale);
      stage.axis.setSpriteZeroPoint({x, y});
    }
  },
  'translate': (type, stage, prev, next) => {
    if (type === 'back') {
      const { x, y } = prev;
      stage.axis.setSpriteZeroPoint({x, y});
    }
    if (type === 'forward') {
      const { x, y } = next;
      stage.axis.setSpriteZeroPoint({x, y});
    }
  }
};

export default definition;