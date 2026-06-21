import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { StoreProvider } from './store';

function App(props) {
  useEffect(() => {});

  useDidShow(() => {});

  useDidHide(() => {});

  return (
    <StoreProvider>
      {props.children}
    </StoreProvider>
  );
}

export default App;
