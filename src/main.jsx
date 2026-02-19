import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Global error handler for production debugging
window.addEventListener('error', (event) => {
    const errorBox = document.createElement('div');
    errorBox.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#ffecec;color:#d00;padding:20px;z-index:9999;font-family:monospace;border-bottom:2px solid #d00;';
    errorBox.innerHTML = `<strong>Error:</strong> ${event.message}<br><small>${event.filename}:${event.lineno}</small>`;
    document.body.appendChild(errorBox);
});



createRoot(document.getElementById('app')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
