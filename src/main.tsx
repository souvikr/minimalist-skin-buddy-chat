
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add some global error handlers to help with debugging
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('Application starting...');

createRoot(document.getElementById("root")!).render(<App />);

console.log('Application rendered');
