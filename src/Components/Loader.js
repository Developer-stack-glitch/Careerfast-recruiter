'use client';
import React from 'react';
import CommonLoader from '../Common/CommonLoader';

const Loader = ({ fullScreen = true, text = 'Loading...' }) => {
  return <CommonLoader fullScreen={fullScreen} text={text} />;
};

export default Loader;
