import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShaderPresetManager } from './components/ShaderPresetManager';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ShaderPresetManager
    onSwitchToStudio={() => {
      window.location.href = '/';
    }}
  />
);
