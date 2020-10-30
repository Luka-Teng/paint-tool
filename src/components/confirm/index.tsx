/**
 * confirm组件
 */
import React from 'react';
import Button from '../button';
import { popModalImg, warningImg } from './assets';

type PropsType = {
  title: string;
  onConfirm?: () => void;
  disabled?: boolean;
}

type StateType = {
  visible: boolean;
}

class Confirm extends React.Component<PropsType, StateType> {
  public state: StateType = {
    visible: false
  }

  private buildChildren = () => {
    const { children, onConfirm } = this.props;

    if (children instanceof Array) {
      throw new Error('Confirm只能存在一个子元素');
    }

    if (children === undefined || children === null) {
      throw new Error('Confirm子元素不能为空');
    }

    if (typeof children !== 'object') {
      throw new Error('Confirm子元素不能为TEXT_NODE');
    }

    if (React.isValidElement(children)) {
      const props = {
        onClick: () => {
          if (!this.props.disabled) {
            this.setState({
              visible: true
            });
          } else {
            onConfirm && onConfirm();
          }
        }
      };
      return React.cloneElement(children, props);
    }

    return null;
  }

  private onCancel = () => {
    this.setState({
      visible: false
    });
  }

  private onConfirm = () => {
    const { onConfirm } = this.props;
    this.setState({
      visible: false
    });
    onConfirm && onConfirm();
  }

  render () {
    const { title } = this.props;
    const { visible } = this.state;
    const builtChildren = this.buildChildren();

    return (
      <span style={styles.wrapper}>
        {builtChildren}
        {
          visible &&
          <div style={styles.popup}>
            <div style={styles.titleWrapper}>
              <img style={styles.icon} src={warningImg} />
              <div>{ title }</div>
            </div>
            <div style={styles.buttons}>
              <Button onClick={this.onCancel} style={{marginRight: '12px'}}>取消</Button>
              <Button type="primary" onClick={this.onConfirm}>确认</Button>
            </div>
          </div>
        }
      </span>
    );
  }
}

export default Confirm;

/* scoped styles */
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative'
  },
  popup: {
    position: 'absolute',
    left: '-120px',
    top: '-99px',
    width: '280px',
    height: '111px',
    backgroundImage: `url(${popModalImg})`,
    backgroundSize: '100% 100%'
  },
  buttons: {
    position: 'absolute',
    bottom: '21px',
    right: '16px'
  },
  titleWrapper: {
    marginTop: '22px',
    marginLeft: '23px',
    display: 'flex',
    alignItems: 'center',
    color: 'rgba(65,65,67,1)',
    lineHeight: '22px'
  },
  icon: {
    width: '16px',
    height: '16px',
    marginRight: '3px'
  }
};