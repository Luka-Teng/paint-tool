import React from 'react';
import Tooltip from '@byted-edu/web-react/lib/Tooltip';

type Props = {
  color?: string;
  onClick?: Function;
  onMouseMove?: Function;
  onMouseLeave?: Function;
  onMouseEnter?: Function;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  hoverDisabled?: boolean;
  Comp: React.Component<any, any>['constructor'];
}

type State = {
  hover: boolean;
}

class Icon extends React.Component<Props, State> {
  state = {
    hover: false
  }

  private onEnter = () => {
    if (this.props.disabled) {
      return;
    }
    this.props.onMouseEnter && this.props.onMouseEnter();
    this.setState({ hover: true });
  }

  private onLeave = () => {
    this.setState({ hover: false });
    if (this.props.disabled) {
      return;
    }
    this.props.onMouseLeave && this.props.onMouseLeave();
  }

  private onClick = () => {
    if (this.props.disabled) {
      return;
    }
    this.props.onClick && this.props.onClick();
  }

  render () {
    const { Comp, active = false, disabled = false, hoverDisabled, title } = this.props;
    let color = this.props.color || '#000000';
    let _styles: Record<string, any> = {};

    if (this.state.hover) {
      color = 'rgba(51,112,255,1)';
      _styles = {
        border: '1px solid rgba(51,112,255,1)'
      };
    }

    if (active) {
      color = '#ffffff';
      _styles = {
        background: 'rgba(51,112,255,1)',
        border: '1px solid rgba(51,112,255,1)'
      };
    }

    if (disabled) {
      color = '#a7a9ae';
      _styles = {
        background: 'rgba(245,245,245,1)',
        border: '1px solid rgba(217,217,217,1)'
      };
    }

    return (
      <div
        style={{...styles.icon, ..._styles}}
        onMouseEnter={this.onEnter}
        onMouseLeave={this.onLeave}
        onMouseMove={() => {this.props.onMouseMove && this.props.onMouseMove();}}
        onClick={this.onClick}
      >
        <Comp color={color} />
        {
          !(disabled || hoverDisabled || !title) &&
          <Tooltip
            content={title || ''}
            position="right"
          >
            <div style={styles.zoom}></div>
          </Tooltip>
        }

      </div>
    );
  }
}

export default Icon;

/* scoped styles */
const styles: Record<string, React.CSSProperties> = {
  icon: {
    padding: '5px',
    borderRadius: '2px',
    border: '1px solid rgba(217,217,217,1)',
    display: 'flex',
    cursor: 'pointer',
    marginBottom: '10px',
    position: 'relative'
  },
  zoom: {
    position: 'absolute',
    left: '0px',
    top: '0px',
    width: '100%',
    height: '100%'
  }
};