/**
 * 裁剪组件
 */
import React from 'react';
import { CURSOR, BackgroundColors } from '../../config';
import { IColor } from '../../types';
import Bar from './bar';

/**
 * 裁剪后的输出信息
 * 1. 调整原图坐标系
 * 2. 调整canvas大小
 */
export type CutReturnType = {
  originX: number;
  originY: number;
  originScale: number;
  backgroundColor: IColor;
  currentCanvasSize: {
    width: number;
    height: number;
  };
}

type StateType = {
  backgroundColor: IColor;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

type PropsType = {
  width: number;
  height: number;
  // 缩放比例
  zoom: number;
  // 展示图片
  imageUrl: string;
  // 完成回调
  onFinish?: (options: CutReturnType) => void;
  // 取消回调
  onCancel?: () => void;
  // 背景颜色
  backgroundColors?: IColor[];
}

class Cut extends React.Component<PropsType, StateType> {
  static defaultProps = {
    zoom: 1,
    width: 0,
    height: 0
  }

  // 外层div引用
  private ref = React.createRef<HTMLDivElement>()

  // 裁剪内部边界
  private innerBorder = {
    left: this.props.width * (1 - this.props.zoom) / 2,
    right: this.props.width * (1 - this.props.zoom) / 2,
    top: this.props.height * (1 - this.props.zoom) / 2,
    bottom: this.props.height * (1 - this.props.zoom) / 2
  }

  /**
   * 初始化背景颜色
   * 初始化缩放框大小
   */
  public state: StateType = {
    backgroundColor: this.props.backgroundColors && this.props.backgroundColors[0] || BackgroundColors[0],
    left: this.innerBorder.left,
    right: this.innerBorder.right,
    top: this.innerBorder.top,
    bottom: this.innerBorder.bottom
  };

  // 控制拖拽方法
  private dragFn: Function | null = null

  private onFinish = () => {
    const { onFinish, width, height, zoom } = this.props;
    const { left, top, right, bottom, backgroundColor } = this.state;
    const cutWidth = width - left - right;
    const cutHeight = height - top - bottom;
    const ratio = width / cutWidth;
    onFinish && onFinish({
      originX: (width / 2 - width * zoom / 2 - left) * ratio,
      originY: (height / 2 - height * zoom / 2 - top) * ratio,
      originScale: zoom * ratio,
      currentCanvasSize: {
        width,
        height: cutHeight * ratio
      },
      backgroundColor
    });
  }

  private onColorChange = (color: IColor) => {
    this.setState({
      backgroundColor: color
    });
  }

  private onRestore = () => {
    this.setState(this.innerBorder);
  }

  /**
   * 注入drag回调
   * 三种情况
   * 1. x，y都可变
   * 2. 仅x可变
   * 3. 仅y可变
   */
  private bindDragEvents = (...controls: ('top' | 'left' | 'bottom' | 'right')[]) => {
    return {
      onMouseDown: () => {
        if (this.ref.current) {
          this.ref.current.style.cursor = CURSOR.move;
        }
        this.dragFn = (movementX, movementY) => {
          if (controls.includes('top')) {
            let newTop = this.state.top + movementY;
            if (newTop < 0) {
              newTop = 0;
            }
            if (newTop > this.innerBorder.top) {
              newTop = this.innerBorder.top;
            }
            this.setState({ top: newTop });
          }

          if (controls.includes('left')) {
            let newLeft = this.state.left + movementX;
            if (newLeft < 0) {
              newLeft = 0;
            }
            if (newLeft > this.innerBorder.left) {
              newLeft = this.innerBorder.left;
            }
            this.setState({ left: newLeft });
          }

          if (controls.includes('bottom')) {
            let newBottom = this.state.bottom - movementY;
            if (newBottom < 0) {
              newBottom = 0;
            }
            if (newBottom > this.innerBorder.bottom) {
              newBottom = this.innerBorder.bottom;
            }
            this.setState({ bottom: newBottom });
          }

          if (controls.includes('right')) {
            let newRight = this.state.right - movementX;
            if (newRight < 0) {
              newRight = 0;
            }
            if (newRight > this.innerBorder.right) {
              newRight = this.innerBorder.right;
            }
            this.setState({ right: newRight });
          }
        };
      }
    };
  }

  // mousemove绑定，拖拽框调整
  private onMouseMove = (e: React.MouseEvent) => {
    // mousemove存在选中的默认行为，需要禁止
    e.preventDefault();

    const { movementX, movementY } = e;
    this.dragFn && this.dragFn(movementX, movementY);
  }

  // mouseup, mouseleave绑定，拖拽状态取消调整
  private onDragEnd = () => {
    // 去除drag回调
    this.dragFn = null;
  }

  // 渲染左上角
  private renderConners = () => {
    return (
      <div ref={this.ref}>
        {/* 左上 */}
        <div
          {...this.bindDragEvents('top', 'left')}
          style={{...styles.xBar, top: '0px', left: '0px', ...styles.conner}}
        ></div>
        <div
          {...this.bindDragEvents('top', 'left')}
          style={{...styles.yBar, top: '0px', left: '0px', ...styles.conner}}
        ></div>

        {/* 上 */}
        <div
          {...this.bindDragEvents('top')}
          style={{...styles.xBar, top: '0px', left: '50%', transform: 'translateX(-50%)', ...styles.conner}}
        ></div>

        {/* 右上 */}
        <div
          {...this.bindDragEvents('top', 'right')}
          style={{...styles.xBar, top: '0px', right: '0px', ...styles.conner}}
        ></div>
        <div
          {...this.bindDragEvents('top', 'right')}
          style={{...styles.yBar, top: '0px', right: '0px', ...styles.conner}}
        ></div>

        {/* 左 */}
        <div
          {...this.bindDragEvents('left')}
          style={{...styles.yBar, top: '50%', left: '0px', transform: 'translateY(-50%)', ...styles.conner}}
        ></div>

        {/* 右 */}
        <div
          {...this.bindDragEvents('right')}
          style={{...styles.yBar, top: '50%', right: '0px', transform: 'translateY(-50%)', ...styles.conner}}
        ></div>

        {/* 左下 */}
        <div
          {...this.bindDragEvents('left', 'bottom')}
          style={{...styles.xBar, bottom: '0px', left: '0px', ...styles.conner}}
        ></div>
        <div
          {...this.bindDragEvents('left', 'bottom')}
          style={{...styles.yBar, bottom: '0px', left: '0px', ...styles.conner}}
        ></div>

        {/* 下 */}
        <div
          {...this.bindDragEvents('bottom')}
          style={{...styles.xBar, bottom: '0px', left: '50%', transform: 'translateX(-50%)', ...styles.conner}}
        ></div>

        {/* 右下 */}
        <div
          {...this.bindDragEvents('right', 'bottom')}
          style={{...styles.xBar, bottom: '0px', right: '0px', ...styles.conner}}
        ></div>
        <div
          {...this.bindDragEvents('right', 'bottom')}
          style={{...styles.yBar, bottom: '0px', right: '0px', ...styles.conner}}
        ></div>
      </div>
    );
  }

  render () {
    const { width, height, imageUrl, zoom, onCancel, backgroundColors } = this.props;
    const { backgroundColor, top, bottom, left, right } = this.state;
    const { red, green, blue, alpha } = backgroundColor;

    // 判断是否裁剪拉伸过
    const notMoved = top === this.innerBorder.top
      && bottom === this.innerBorder.bottom
      && left === this.innerBorder.left
      && right === this.innerBorder.right;

    return (
      <div
        style={{
          width,
          height,
          ...styles.outerWrapper
        }}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onDragEnd}
        onMouseLeave={this.onDragEnd}
      >
        <div
          style={{
            ...styles.innerWrapper,
            top,
            right,
            left,
            bottom,
            backgroundColor: `rgba(${red},${green},${blue},${alpha})`
          }}
        >
          { this.renderConners() }
        </div>
        <div
          style={{
            width: width * zoom,
            height: height * zoom,
            ...styles.imageWrapper
          }}
        >
          <img src={imageUrl} draggable={false} style={styles.img} />
        </div>
        <Bar
          backgroundColors={backgroundColors || BackgroundColors}
          initialColor={backgroundColor}
          canRestore={notMoved}
          onCancel={() => {onCancel && onCancel();}}
          onColorChange={this.onColorChange}
          onFinish={this.onFinish}
          onRestore={this.onRestore}
        />
      </div>
    );
  }
}
export default Cut;

/* scoped styles */
const styles: Record<string, React.CSSProperties> = {
  outerWrapper: {
    position: 'absolute',
    left: '0px',
    top: '0px',
    zIndex: 200,
    backgroundColor: '#646464'
  },
  innerWrapper: {
    position: 'absolute'
  },
  imageWrapper: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)'
  },
  xBar: {
    width: '38px',
    height: '6px',
    backgroundColor: '#1863FB',
    position: 'absolute'
  },
  yBar: {
    width: '6px',
    height: '38px',
    backgroundColor: '#1863FB',
    position: 'absolute'
  },
  conner: {
    zIndex: 201
  },
  img: {
    width: '100%',
    height: '100%'
  }
};