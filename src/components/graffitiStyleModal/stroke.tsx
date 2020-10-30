import React from 'react';

type PropsType = {
  width?: number;
  active?: boolean;
  onClick?: Function;
}

export default (props: PropsType) => {
  const { width = 1, active = false, onClick } = props;
  return (
    <div
      onClick={() => {onClick && onClick();}}
      style={{
        width: '30px',
        height: '8px',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          width: '100%',
          background: active ? '#555' : '#aaa',
          height: width + 1 + 'px',
          borderRadius: '5px'
        }}
      ></div>
    </div>
  );
};