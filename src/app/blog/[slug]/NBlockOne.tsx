



import React from 'react';

import type { INBlockProps } from './types'

import NBlockHeading from './NBlockHeading'
import NBlockParagraph from './NBlockParagraph';
import NBlockImage from './NBlockImage';
import NBlockCode from './NBlockCode';

const NBlockOne: React.FC<INBlockProps> = ({ id, type, ...args }) => {

  const isHeading = () => {
    return type.startsWith("heading_")
  }
  const headingProps = () => {
    return args[type] as any
  }


  return (
    <>
    {isHeading() && <NBlockHeading {...headingProps()} level={type} key={id}></NBlockHeading> }
    {args.paragraph && <NBlockParagraph {...args.paragraph} key={id}></NBlockParagraph>}
    {args.code && <NBlockCode {...args.code} key={id}></NBlockCode>}
    {args.image && <NBlockImage {...args.image} key={id}></NBlockImage>}
    </>
  );
};

export default NBlockOne;