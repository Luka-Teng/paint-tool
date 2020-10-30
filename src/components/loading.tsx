import React, { MouseEvent } from 'react';
import { loadingIcon, repectIcon } from '../config';

interface ILoadingProps {
  isImageLoadFail: boolean;
  width: number;
  height: number;
  tryLoadAgain: (event: MouseEvent<HTMLDivElement>) => void;
}

/**
 * loading icon
 */
export const Loading: React.FC<ILoadingProps> = props => {
  return (
    <div className="component-draw-tools">
      <div className="component-draw-tools-info" style={{ width: props.width, height: props.height }}>
        {props.isImageLoadFail ?
          (
            <div onClick={props.tryLoadAgain}><span><img src={repectIcon} alt="" /></span>加载失败，请点击重试...</div>
          ) :
          (
            <div><span><img className="animate" src={loadingIcon} alt="" /></span>加载中...</div>
          )
        }
      </div>
    </div>
  );
};
