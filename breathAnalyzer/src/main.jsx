import { createRoot } from 'react-dom/client'
import './index.css'
import './rippleAnimation.jsx'
import RippleParticles from './rippleAnimation.jsx'

createRoot(document.getElementById('root')).render(
    <RippleParticles />
)
