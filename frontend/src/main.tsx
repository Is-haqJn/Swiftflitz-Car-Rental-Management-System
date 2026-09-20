import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './shared/styles/index.css';
import './shared/libs/echo';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

const rootElement = document.getElementById('root')!;
rootElement.setAttribute('data-developer', 'ORDAQ');

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
