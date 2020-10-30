/**
 * 按钮组件
 */
import React from 'react';

type Props = {
  disabled?: boolean;
  type?: 'default' | 'primary' | 'danger' | 'dis';
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

const Button: React.FunctionComponent<Props> = React.forwardRef<any, Props>((props, ref) => {
  // props初始化
  const {
    disabled = false,
    type = 'default',
    children,
    onClick,
    style = {}
  } = props;

  return (
    <button
      ref={ref}
      onClick={e => {onClick && onClick(e);}}
      className={`correct-button ${type} ${disabled ? 'disabled' : ''}`}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
});

export default Button;