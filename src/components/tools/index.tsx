import React, { Component } from 'react';
import Slider from '@byted-edu/web-react/lib/Slider';
import Popover from '@byted-edu/web-react/lib/Popover';
import Stage from '../../stage';
import GraffitiStyleModal from '../graffitiStyleModal/index';
import { throttleRun, toast } from '../../utils';
import Confirm from '../confirm/index';
import Icon from './Icon';
import Back from './icons/back';
import Clear from './icons/clear';
import Cut from './icons/cut';
import Forward from './icons/forward';
import Graffiti from './icons/pen';
import RotateLeft from './icons/rotateLeft';
import RotateRight from './icons/rotateRight';
import Zoom from './icons/zoom';

/**
 * 画布旁边的toolbar
 */
type PropsType = {
  stage: Stage;
  disabled?: boolean;
  exclude?: string[];
  eventOverwrite?: {
    onRotateRight?: Function;
    onRotateLeft?: Function;
  };
}

type StateType = {
  selectedIcon: string;
  isGraffitiHover: boolean;
  isZoomHover: boolean;
  prevState: {
    selectedIcon: string;
    isGraffitiActive: boolean;
    isCutShow: boolean;
  } | null;
  callbacks: [string, 'active' | 'mute'][];
  canForward: boolean;
  canBack: boolean;
}

class Tools extends Component<PropsType, StateType> {
  state: StateType = {
    selectedIcon: '',
    prevState: null,
    callbacks: [],
    isGraffitiHover: false,
    isZoomHover: false,
    canBack: false,
    canForward: false
  }

  private throttleRunForGraffiti = throttleRun(100);
  private throttleRunForZoom = throttleRun(100);
  private toast: ReturnType<typeof toast> | null = null;

  private triggerListener = (type: string, status: 'active' | 'mute') => {
    const listener = this.props.stage.props.onToolbarStatusChange;
    listener && listener({ type, status });
  }

  static getDerivedStateFromProps (props: PropsType, state: StateType) {
    const { selectedIcon, prevState } = state;
    const { isGraffitiActive, isCutShow } = props.stage.state;
    const callbacks: StateType['callbacks'] = [];

    if (prevState) {
      // zoom的mute状态
      if (selectedIcon !== 'zoom' && prevState.selectedIcon === 'zoom') {
        callbacks.push(['zoom', 'mute']);
      }

      // 画笔状态
      if (isGraffitiActive !== prevState.isGraffitiActive) {
        callbacks.push(['graffiti', isGraffitiActive ? 'active' : 'mute']);
      }

      // 裁剪状态
      if (isCutShow !== prevState.isCutShow) {
        callbacks.push(['cut', isCutShow ? 'active' : 'mute']);
      }
    }

    return {
      prevState: {
        selectedIcon,
        isGraffitiActive,
        isCutShow
      },
      callbacks
    };
  }

  private onHistoryChange = (options: any) => {
    const { canForward, canBack } = options;
    if (canBack !== this.state.canBack || canForward !== this.state.canForward) {
      this.setState({
        canForward,
        canBack
      });
    }
  }

  componentDidMount () {
    this.props.stage.history.onHistoryChange(this.onHistoryChange);
    this.toast = toast(document.getElementById(`drawer-wrapper-${this.props.stage.id}`), 1000);
  }

  componentWillUnmount () {
    this.props.stage.history.removeHistorylistener(this.onHistoryChange);
    this.toast && this.toast.release();
  }

  componentDidUpdate () {
    // 回调
    this.state.callbacks.forEach(callback => {
      this.triggerListener(callback[0], callback[1]);
    });
  }

  private selectIcon = (icon: string) => {
    if (icon !== this.state.selectedIcon) {
      this.setState({
        selectedIcon: icon
      });
    }
  }

  // 点击有旋转按钮
  private clickRotateRight = () => {
    const { stage, eventOverwrite} = this.props;
    if (eventOverwrite && eventOverwrite.onRotateRight) {
      eventOverwrite.onRotateRight();
    } else {
      stage.rotate(90);
    }
    this.selectIcon('rotateRight');
    this.triggerListener('rotateRight', 'active');
  }

  // 点击左旋转按钮
  private clickRotateLeft = () => {
    const { stage, eventOverwrite } = this.props;
    if (eventOverwrite && eventOverwrite.onRotateLeft) {
      eventOverwrite.onRotateLeft();
    } else {
      stage.rotate(-90);
    }
    this.selectIcon('rotateLeft');
    this.triggerListener('rotateLeft', 'active');
  }

  // 点击放大缩小
  private clickZoom = () => {
    const { selectedIcon } = this.state;
    if (selectedIcon === 'zoom') {
      this.selectIcon('');
    } else {
      this.selectIcon('zoom');
      this.props.stage.muteGraffiti();
      this.triggerListener('zoom', 'active');
    }
  }

  // 点击画笔
  private clickGraffiti = () => {
    const { stage } = this.props;
    const isGraffitiActive = stage.state.isGraffitiActive;

    if (!isGraffitiActive) {
      stage.activeGraffifi();
    } else {
      stage.muteGraffiti();
    }

    this.selectIcon('');
  }

  // 点击裁剪
  private clickCut = () => {
    const stage = this.props.stage;
    const isCutShow = stage.state.isCutShow;

    if (isCutShow) {
      stage.closeCutMode();
    } else {
      stage.openCutMode();
      stage.muteGraffiti();
    }

    this.selectIcon('');
  }

  // 点击前进
  private clickForward = () => {
    const { stage } = this.props;
    this.selectIcon('forward');
    stage.forward();
    this.triggerListener('forward', 'active');
  }

  // 点击后退
  private clickBack = () => {
    const { stage } = this.props;
    this.selectIcon('back');
    stage.back();
    this.triggerListener('back', 'active');
  }

  // 点击清除
  private clickClear = () => {
    const { stage } = this.props;
    this.selectIcon('clear');
    stage.clear();
    this.triggerListener('clear', 'active');
  }

  // 进入画笔modal显示区域
  private graffitiEnter = () => {
    this.throttleRunForGraffiti(() => this.setState({ isGraffitiHover: true }));
  }

  // 离开画笔modal显示区域
  private graffitiLeave = () => {
    this.throttleRunForGraffiti(() => this.setState({ isGraffitiHover: false }));
  }

  // 进入画笔modal显示区域
  private zoomEnter = () => {
    this.throttleRunForZoom(() => this.setState({ isZoomHover: true }));
  }

  // 离开画笔modal显示区域
  private zoomLeave = () => {
    this.throttleRunForZoom(() => this.setState({ isZoomHover: false }));
  }

  // 缩放
  private zoom = (num: number) => {
    const currentScale = this.props.stage.axis.spriteAxis.scale;
    const scale = num / 100 / currentScale;
    this.toast && this.toast.show(num + '%');
    this.props.stage.zoom(scale);
  }

  // eslint-disable-next-line complexity
  render () {
    const { disabled = false, stage, exclude = [] } = this.props;
    const { isGraffitiActive, isCutShow } = stage.state;
    const { selectedIcon, isGraffitiHover, canForward, canBack, isZoomHover } = this.state;
    const canClear = stage.upperDrawer && stage.upperDrawer.drawList.length > 0;
    const scale = this.props.stage.axis.spriteAxis.scale;

    return (
      <div style={styles.outerWrapper}>
        {
          !exclude.includes('rotateRight') &&
          <Icon
            disabled={disabled || isCutShow}
            Comp={RotateRight}
            onClick={this.clickRotateRight}
            title="右旋90度，会清除所有内容"
          />
        }
        {
          !exclude.includes('rotateLeft') &&
          <Icon
            disabled={disabled || isCutShow}
            Comp={RotateLeft}
            onClick={this.clickRotateLeft}
            title="左旋90度，会清除所有内容"
          />
        }
        {
          !exclude.includes('zoom') &&
          <Popover
            popupVisible={(selectedIcon === 'zoom' && isZoomHover)}
            position="right"
            trigger="manual"
            unmountOnExit={false}
            content={
              selectedIcon === 'zoom' && isZoomHover &&
              <div
                style={styles.zoom}
                onMouseEnter={this.zoomEnter}
                onMouseLeave={this.zoomLeave}
              >
                <Slider
                  min={100}
                  max={300}
                  step={5}
                  value={scale * 100}
                  formatTooltip={val => {
                    return <span>{val + '%'}</span>;
                  }}
                  onChange={val => {
                    this.zoom(val as number);
                  }}
                />
              </div> || null
            }
          >
            <Icon
              disabled={disabled || isCutShow}
              Comp={Zoom}
              onClick={this.clickZoom}
              active={selectedIcon === 'zoom'}
              onMouseEnter={this.zoomEnter}
              onMouseLeave={this.zoomLeave}
              title="放大工具，可通过滚轮缩放"
              hoverDisabled={disabled || isCutShow || selectedIcon === 'zoom'}
            />
          </Popover>
        }
        {
          !exclude.includes('graffiti') &&
          <Popover
            popupVisible={(isGraffitiActive && isGraffitiHover)}
            className="graffitiPop"
            position="right"
            trigger="manual"
            unmountOnExit={false}
            content={
              <div
                onMouseEnter={this.graffitiEnter}
                onMouseLeave={this.graffitiLeave}
              >
                <GraffitiStyleModal
                  isAbsolute={false}
                  onStyleChange={options => {this.props.stage.setGraffitiOptions(options);}}
                  options={stage.props.graffitiOptions}
                />
              </div>
            }
          >
            <Icon
              disabled={disabled || isCutShow}
              hoverDisabled={disabled || isCutShow || isGraffitiActive}
              Comp={Graffiti}
              onClick={this.clickGraffiti}
              active={isGraffitiActive}
              onMouseEnter={this.graffitiEnter}
              onMouseLeave={this.graffitiLeave}
              title="画笔工具"
            />
          </Popover>
        }
        {
          !exclude.includes('cut') &&
          <Confirm
            title="再次裁剪会恢复初始状态!"
            onConfirm={this.clickCut}
            disabled={disabled || isCutShow || !stage.hasCut}
          >
            <Icon
              disabled={disabled}
              Comp={Cut}
              active={isCutShow}
              title="图片扩展剪裁"
            />
          </Confirm>
        }
        {
          !exclude.includes('back') &&
          <Icon
            disabled={disabled || isCutShow || !canBack}
            Comp={Back}
            onClick={this.clickBack}
            title="上一步"
          />
        }
        {
          !exclude.includes('forward') &&
          <Icon
            disabled={disabled || isCutShow || !canForward}
            Comp={Forward}
            onClick={this.clickForward}
            title="下一步"
          />
        }
        {
          !exclude.includes('clear') &&
          <Icon
            disabled={disabled || isCutShow || !canClear}
            Comp={Clear}
            onClick={this.clickClear}
            title="清除所有内容"
          />
        }
      </div>
    );
  }
}

export default Tools;

/* scoped styles */
const styles: Record<string, React.CSSProperties> = {
  outerWrapper: {
    position: 'absolute',
    right: '0px',
    top: '0px',
    transform: 'translateX(100%)',
    width: '65px',
    display: 'flex',
    flexDirection: 'column',
    marginTop: '15px',
    alignItems: 'center',
    zIndex: 10
  },
  graffitiModal: {
    position: 'absolute',
    top: '85px',
    left: '50px',
    width: '260px',
    height: '111px'
  },
  zoomWrapper: {
    position: 'absolute',
    left: '44px',
    paddingLeft: '10px',
    top: '78px'
  },
  zoom: {
    width: '186px'
  }
};

