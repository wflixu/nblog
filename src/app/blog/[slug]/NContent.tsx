



import React from 'react';

import NBlockOne from './NBlockOne';
interface NContentProps {
  results: any[] ;
}

const NContent: React.FC<NContentProps> = ({ results }) => {
  return (
    <section className="n-section">
       {results.map((block, index) => (
          <NBlockOne {...block} key={block.id}></NBlockOne> 
       ))}
       
    </section>
  );
};

export default NContent;