import React from 'react';
import { rightIcon, wrongIcon, halfIcon, ScoreImgs } from '../config';

function initIcon(instance: any, key: string, image: HTMLImageElement) {
  if (instance.template[key] && instance.template[key] !== image) {
    console.warn(`[Correct Tool] Duplicate key: '${key}' will replace old one.`);
  }

  instance.template[key] = image;
}

/**
 * 预加载图片
 */
const PreLoad: React.FC<{ instance: any }> = ({ instance }) => {
  const numberNode: React.ReactElement[] = ScoreImgs.map((item, index) => {
    return (
      <img
        key={`number-${index.toString()}`}
        ref={img => (img && initIcon(instance, `Score_${index}`, img))}
        src={item}
        alt=""
      />
    );
  });

  return (
    <div className="pre-load" style={{ display: 'none' }}>
      <img src={rightIcon} alt="" ref={img => (img && initIcon(instance, 'Right_1', img))} />
      <img src={wrongIcon} alt="" ref={img => (img && initIcon(instance, 'Wrong_1', img))} />
      <img src={halfIcon} alt="" ref={img => (img && initIcon(instance, 'HalfRight_1', img))} />
      {numberNode}
    </div>
  );
};

export { PreLoad };
