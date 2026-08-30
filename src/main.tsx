import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './pwaRegister.ts';
import { initTactileTouchListener } from './lib/haptics.ts';

// Initialize global haptic vibration & tactile touch feedback for mobile & desktop
initTactileTouchListener();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
