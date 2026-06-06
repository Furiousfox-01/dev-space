import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/colors_and_type.css';
import './styles/app.css';
import './styles/views.css';
import { App } from './components/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
