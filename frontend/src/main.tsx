import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './shared/styles/index.css';

//! standard rendering
// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

//! optimize for prerendering

const rootElement = document.getElementById('root')!;
rootElement.setAttribute('data-developer', 'ORDAQ');

//! create for normal rendering
if (!rootElement.hasChildNodes()) {
    createRoot(rootElement).render(
        <StrictMode>
            <App />
        </StrictMode>
    );
} else {
    hydrateRoot(
        rootElement,
        <StrictMode>
            <App />
        </StrictMode>
    );
}

//? Dispatch snap event to signal prerendering is complete
setTimeout(() => {
    document.dispatchEvent(new Event('render-snap'));
}, 500);
