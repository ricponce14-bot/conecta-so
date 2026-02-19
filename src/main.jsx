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

// Check for missing env vars
if (!import.meta.env.VITE_SUPABASE_URL) {
    const warningBox = document.createElement('div');
    warningBox.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;background:#fff3cd;color:#856404;padding:10px;z-index:9999;font-family:sans-serif;text-align:center;border-top:1px solid #ffeeba;';
    warningBox.innerText = '⚠️ VITE_SUPABASE_URL missing in environment variables';
    document.body.appendChild(warningBox);
}

createRoot(document.getElementById('app')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
