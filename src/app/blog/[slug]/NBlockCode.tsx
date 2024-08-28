



import React from 'react';

import type { IParagraphProps } from './types'
import NRichText from './NRichText';

const NBlockParagraph: React.FC<IParagraphProps> = ({ rich_text }) => {

  return (
    <div className='code'>
      <pre>
        <code>
          {rich_text.map((rtext, index) => (
            <NRichText key={index} {...rtext} />
          ))}
        </code>
      </pre>
    </div>
  );
};

export default NBlockParagraph;