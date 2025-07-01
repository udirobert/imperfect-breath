import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LensProvider } from './providers/LensProvider.tsx'

createRoot(document.getElementById("root")!).render(
  <LensProvider>
    <App />
  </LensProvider>
);
