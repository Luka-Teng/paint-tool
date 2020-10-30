/**
 * 涂鸦样式弹窗组件
 */
import React from 'react';
import { IGraffitiSpriteOptions, IRectOptions, IPosition } from '../../types';
import { GraffitiSpriteOptions } from '../../config';
import Stroke from './stroke';

type PropsType = {
  onStyleChange?: (config: IRectOptions) => void;
  options?: IGraffitiSpriteOptions;
  position?: IPosition;
  isAbsolute?: boolean;
}

type StateType = {
  config: Required<IRectOptions>;
}

class GraffitiStyleModal extends React.Component<PropsType, StateType> {
  constructor (props: PropsType) {
    super(props);
    const { options = {} } = props;
    this.configs.colors = options.colors || GraffitiSpriteOptions.colors;
    this.configs.width = options.width || GraffitiSpriteOptions.width;
    this.configs.defaultOption = options.defaultOption || GraffitiSpriteOptions.defaultOption;

    this.state = {
      config: this.configs.defaultOption
    };
  }

  configs: Required<IGraffitiSpriteOptions> = {} as Required<IGraffitiSpriteOptions>

  // 画笔改变
  private onStrokeChange = (width: number) => {
    if (width === this.state.config.width) {
      return;
    }
    const { onStyleChange } = this.props;
    const newConfig = {
      ...this.state.config,
      width
    };
    this.setState({
      config: newConfig
    });
    onStyleChange && onStyleChange(newConfig);
  }

  // 颜色改变
  private onColorChange = (color: Required<IRectOptions>['color']) => {
    if (color === this.state.config.color) {
      return;
    }

    const { onStyleChange } = this.props;
    const newConfig = {
      ...this.state.config,
      color
    };
    this.setState({
      config: newConfig
    });
    onStyleChange && onStyleChange(newConfig);
  }

  private renderStrokes = () => {
    return (
      <div style={styles.strokeBlock}>
        <div style={styles.label}>粗细</div>
        <div style={styles.innerWapper}>
          {
            this.configs.width.map(width => {
              return (
                <span style={styles.stroke} key={width}>
                  <Stroke
                    width={width}
                    onClick={() => this.onStrokeChange(width)}
                    active={width === this.state.config.width}
                  />
                </span>
              );
            })
          }
        </div>
      </div>
    );
  }

  private renderColors = () => {
    const { color: { red, blue, green, alpha } } = this.state.config;
    const currentRgba = `rgba(${red},${green},${blue},${alpha})`;
    return (
      <div style={styles.colorBlock}>
        <div style={styles.label}>颜色</div>
        <div style={styles.innerWapper}>
          {
              this.configs.colors.map(color => {
                const { red, green, blue, alpha } = color;
                const rgba = `rgba(${red},${green},${blue},${alpha})`;
                return (
                  <div
                    style={{
                      ...styles.colorIcon,
                      background: rgba
                    }}
                    key={rgba}
                    onClick={() => {this.onColorChange(color);}}
                  >
                    <div
                      style={{
                        ...currentRgba === rgba
                        ? { ...styles.selectedColor, border: `1px solid ${rgba}` }
                        : {}
                      }}
                     />
                  </div>
                );
              })
            }
        </div>
      </div>
    );
  }

  render () {
    const { x, y } = this.props.position || { x: 0, y: 0 };
    const isAbsolute = this.props.isAbsolute === undefined ? true : this.props.isAbsolute;

    return (
      <div style={isAbsolute ? {...styles.wrapper, left: x, top: y} : {...styles.wrapperFlex}}>
        { this.renderStrokes() }
        { this.renderColors() }
      </div>
    );
  }
}

export default GraffitiStyleModal;

/* scoped styles */
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'absolute',
    zIndex: 120,
    background: 'rgba(255,255,255,1)',
    boxShadow: '0px 5px 10px 0px rgba(22,31,49,0.3)',
    borderRadius: '4px',
    minWidth: '250px'
  },
  wrapperFlex: {
    display: 'flex',
    flexDirection: 'column',
    zIndex: 120,
    background: 'rgba(255,255,255,1)',
    borderRadius: '4px',
    minWidth: '250px'
  },
  innerWapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '14px',
    paddingRight: '18px',
    flexGrow: 1
  },
  stroke: {
    marginRight: '10px'
  },
  strokeBlock: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '16px',
    marginTop: '20px'
  },
  colorBlock: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '16px',
    marginBottom: '17px',
    marginTop: '22px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 400,
    color: 'rgba(147,154,163,1)',
    lineHeight: '22px',
    width: '28px'
  },
  colorIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '30px',
    position: 'relative',
    marginRight: '10px'
  },
  selectedColor: {
    width: '36px',
    height: '36px',
    top: '-3px',
    left: '-3px',
    position: 'absolute',
    borderRadius: '36px',
    boxSizing:'border-box'
  }
};