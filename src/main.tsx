import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

console.log('[main] boot');

const rootEl = document.getElementById('root')!;
const root = createRoot(rootEl);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)

console.log('[main] rendered');
