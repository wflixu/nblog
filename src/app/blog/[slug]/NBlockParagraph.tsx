



import React from 'react';

import type { IParagraphProps } from './types'
import NRichText from './NRichText';

const NBlockParagraph: React.FC<IParagraphProps > = ({ rich_text }) => {

  return (
    <p className="n-p">
      {rich_text.map((rtext, index) => <NRichText key={index} {...rtext} />)}
    </p>
    
  );
};

export default NBlockParagraph;