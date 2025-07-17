import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './rippleAnimation.jsx'
import RippleParticles from './rippleAnimation.jsx'
import MQTTWebSocketViewer from './MQTTWebSocketViewer.jsx'
import ScrollList from './components/listScroll.jsx'

createRoot(document.getElementById('root')).render(
    <RippleParticles />
)
