



import React from 'react';

import type { IHeading } from './types'
import NRichText from './NRichText';

const NBlockHeading: React.FC<IHeading & { level: 'heading_1' | 'heading_2' | 'heading_3' }> = ({ rich_text, level }) => {

  return (
    <>
      {level === 'heading_1' && (<h1 >
        {
          rich_text.map((rtext, index) => 
            <NRichText {...rtext}  key={index}></NRichText>
          )
        }

      </h1>)}

      {level === 'heading_2' && (<h2 >
        {
          rich_text.map((rtext, index) => 
            <NRichText {...rtext} key={index} ></NRichText>
          )
        }

      </h2>)}
      {level === 'heading_3' && (<h3 >
        {
          rich_text.map((rtext, index) => 
            <NRichText {...rtext}  key={index}></NRichText>
          )
        }

      </h3>)}
    </>
  );
};

export default NBlockHeading;