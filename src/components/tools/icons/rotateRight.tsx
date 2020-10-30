import React from 'react';

type PropsType = {
  color?: string;
}

export default (props: PropsType) => {
  const color = props.color || '#000000';
  return (
    <svg width="20px" height="20px" viewBox="0 0 20 20" version="1.1">
      <title>旋转90度</title>
      <desc>Created with Sketch.</desc>
      <g id="页面-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="1、界面调整说明" transform="translate(-1018.000000, -173.000000)">
          <g id="画布工具栏" transform="translate(1013.000000, 168.000000)">
            <g id="旋转90度" transform="translate(15.000000, 15.000000) scale(-1, 1) translate(-15.000000, -15.000000) translate(5.000000, 5.000000)">
              <rect id="矩形复制-52" fillRule="nonzero" transform="translate(10.000000, 10.000000) scale(-1, -1) translate(-10.000000, -10.000000) " x="0" y="0" width="20" height="20"></rect>
              <path d="M17.9178373,9.16666667 L17.0845039,9.16666667 C16.8708223,9.16666667 16.6947093,9.00581659 16.6706405,8.79859214 L16.6678373,8.75 L16.6678373,8.33333333 C16.6678373,6.52711906 15.2312382,5.05644047 13.4383287,5.00158618 L13.3345039,5 L10.4170039,5 L10.4166667,5.83333333 C10.4166667,6.06345198 10.2301186,6.25 10,6.25 C9.90984574,6.25 9.8221234,6.22075922 9.75,6.16666667 L7.52777778,4.5 C7.34368286,4.36192881 7.30637326,4.10076158 7.44444444,3.91666667 C7.46813372,3.88508097 7.49619208,3.8570226 7.52777778,3.83333333 L9.75,2.16666667 C9.93409492,2.02859548 10.1952621,2.06590508 10.3333333,2.25 C10.3874259,2.3221234 10.4166667,2.40984574 10.4166667,2.5 L10.4170039,3.33333333 L13.3345039,3.33333333 C16.0534443,3.33333333 18.2655009,5.50356016 18.3329207,8.20626051 L18.3345039,8.33333333 L18.3345039,8.75 C18.3345039,8.9636816 18.1736539,9.13979465 17.9664294,9.16386345 L17.9178373,9.16666667 Z M2.5,18.3333333 C2.03976271,18.3333333 1.66666667,17.9602373 1.66666667,17.5 L1.66666667,8.75 C1.66666667,8.28976271 2.03976271,7.91666667 2.5,7.91666667 L12.9166667,7.91666667 C13.376904,7.91666667 13.75,8.28976271 13.75,8.75 L13.75,17.5 C13.75,17.9602373 13.376904,18.3333333 12.9166667,18.3333333 L2.5,18.3333333 Z M12.0833333,16.6666667 L12.0833333,9.58333333 L3.33333333,9.58333333 L3.33333333,16.6666667 L12.0833333,16.6666667 Z" id="形状" fill={color}></path>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};