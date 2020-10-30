/**
 * 裁剪组件的下方操作栏
 */
import React from 'react';
import Button from '../button';
import Confirm from '../confirm';
import { IColor } from '../../types';

type PropsType = {
  initialColor: IColor;
  backgroundColors: IColor[];
  canRestore?: boolean;
  onColorChange?: (color: IColor) => void;
  onCancel?: () => void;
  onRestore?: () => void;
  onFinish?: () => void;
}

type StateType = {
  selectedColor: IColor;
}

class Bar extends React.Component<PropsType, StateType> {
  constructor (props) {
    super(props);
    const { initialColor } = props;

    this.state = {
      selectedColor: initialColor
    };
  }

  onColorChange = (color: IColor) => {
    const { onColorChange } = this.props;
    if (this.state.selectedColor !== color) {
      this.setState({
        selectedColor: color
      });
      onColorChange && onColorChange(color);
    }
  }

  render () {
    const { selectedColor } = this.state;
    const { onCancel, onFinish, onRestore, canRestore, backgroundColors } = this.props;
    return (
      <div style={styles.outerWrapper}>
        <div style={styles.bgFont}>背景色</div>
        <div style={styles.colorBlock}>
          {
            backgroundColors.map(color => {
              const colorStr = `rgba(${color.red},${color.green},${color.blue},${color.alpha})`;
              const selectedColorStr = `rgba(${selectedColor.red},${selectedColor.green},${selectedColor.blue},${selectedColor.alpha})`;
              const isSelected = (colorStr === selectedColorStr);
              return (
                <div
                  onClick={() => {this.onColorChange(color);}}
                  style={{
                    ...colorStr === 'rgba(255,255,255,1)' ? styles.whiteColorIcon : styles.colorIcon,
                    background: colorStr
                  }}
                  key={colorStr}
                >
                  <div style={{...isSelected ? styles.selectedColor : {}}}></div>
                </div>
              );
            })
          }
        </div>
        <div style={styles.gap}></div>
        <div style={styles.buttonBlock}>
          <Confirm
            title="确定放弃本次编辑？"
            onConfirm={onCancel}
          >
            <Button style={{marginRight: '20px'}}>放弃</Button>
          </Confirm>
          <Confirm
            title="确定复原图片原始尺寸？"
            onConfirm={onRestore}
          >
            <Button style={{marginRight: '20px'}} disabled={canRestore}>复原</Button>
          </Confirm>
          <Button type="primary" onClick={onFinish}>完成</Button>
        </div>
      </div>
    );
  }
}

export default Bar;

/* scoped styles */
const styles: Record<string, React.CSSProperties> = {
  outerWrapper: {
    height: '66px',
    boxShadow: '0px 5px 10px 0px rgba(22,31,49,0.3)',
    borderRadius: '4px',
    background: '#fff',
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 201,
    display: 'flex',
    alignItems: 'center'
  },
  bgFont: {
    fontSize: '14px',
    color: 'rgba(147,154,163,1)',
    marginLeft: '16px',
    wordBreak: 'keep-all'
  },
  colorBlock: {
    display: 'flex',
    flexGrow: 2,
    marginLeft: '12px',
    justifyContent: 'space-between'
  },
  colorIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '30px',
    cursor: 'pointer',
    position: 'relative',
    marginRight: '20px'
  },
  whiteColorIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '30px',
    border: '1px solid rgba(151,151,151,1)',
    cursor: 'pointer',
    position: 'relative',
    marginRight: '20px'
  },
  selectedColor: {
    border: '1px solid rgba(0,0,0,1)',
    width: '34px',
    height: '34px',
    position: 'absolute',
    borderRadius: '34px',
    top: '-3px',
    left: '-3px'
  },
  gap: {
    width: '1px',
    height: '31px',
    background: '#979797',
    margin: '0px 19px 0px 0px'
  },
  buttonBlock: {
    marginRight: '17px',
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'space-between'
  }
};