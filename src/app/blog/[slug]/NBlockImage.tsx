



import React from 'react';

import type { Image } from './types'

const NBlockImage: React.FC<Image> = ({ file }) => {

  return (
    <img src={file.url} alt=""/>
  );
};

export default NBlockImage;