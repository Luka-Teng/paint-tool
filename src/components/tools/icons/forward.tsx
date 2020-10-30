import React from 'react';

type PropsType = {
  color?: string;
}

export default (props: PropsType) => {
  const color = props.color || '#000000';
  return (
    <svg width="20px" height="20px" viewBox="0 0 20 20" version="1.1">
      <path d="M13.2827832,3.2531716 L13.8720388,2.66391595 C14.0222405,2.5137143 14.2585868,2.50216033 14.4220414,2.62925403 L14.4612945,2.66391595 L18.2914562,6.49407768 C18.5997649,6.80238633 18.6159916,7.2921714 18.3401365,7.61958283 L18.2914562,7.67258898 L14.4612945,11.5027507 C14.3110928,11.6529524 14.0747466,11.6645063 13.9112919,11.5374126 L13.8720388,11.5027507 L13.2827832,10.9134951 C13.1325815,10.7632934 13.1210276,10.5269471 13.2481213,10.3634925 L13.2827832,10.3242394 L15.6896723,7.91646044 L7.8682858,7.91666667 C6.28475749,7.91666667 3.78798617,9.51175102 3.70380476,11.9561455 L3.70161913,12.0833333 C3.70161913,14.5567927 6.17155099,16.2098595 7.78558178,16.2651851 L7.8682858,16.266618 L11.309422,16.266618 C11.5231036,16.266618 11.6992167,16.4274681 11.7232855,16.6346925 L11.7260887,16.6832846 L11.7260887,17.5 C11.7260887,17.7136816 11.5652386,17.8897947 11.3580142,17.9138634 L11.309422,17.9166667 L7.67258898,17.9166667 C4.45092794,17.9166667 1.83925565,15.3049944 1.83925565,12.0833333 C1.83925565,8.90520825 4.38081914,6.32069713 7.54232022,6.25142585 L7.67258898,6.25 L15.690089,6.24979378 L13.2827832,3.84242725 C13.1325815,3.6922256 13.1210276,3.45587933 13.2481213,3.29242466 L13.2827832,3.2531716 L13.8720388,2.66391595 L13.2827832,3.2531716 Z" id="路径" fill={color}></path>
    </svg>
  );
};