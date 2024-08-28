



import React from 'react';

import type { IRichTextProps } from './types'


const NRichText: React.FC<IRichTextProps> = ({ type, href, plain_text, annotations, ...args }) => {

  const cls = (): string => {
    let res = Object.entries(annotations).filter(([key, val]) => {
      return val
    }).map(([key, val]) => {
      return key === 'code' ? val : key;
    });
    return res.join(' ');
  };



  return (
    <>
      {href ? (<a href={href} className={cls()} target="_blank">
        {plain_text}
      </a >) : (
        <span className={cls()}>
          {plain_text}
        </span>
      )
      }
    </>
  );
};

export default NRichText;