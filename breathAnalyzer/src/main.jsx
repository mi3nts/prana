import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './rippleAnimation.jsx'
import RippleParticles from './rippleAnimation.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RippleParticles/>
  </StrictMode>,
)
