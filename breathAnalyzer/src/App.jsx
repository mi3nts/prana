import './assets/circle.svg'
import { useState, useEffect } from 'react'
import ParticleCircle from './components/ParticleCircle'

function App() {
  const [scale, setScale] = useState(1)
  // rgb values are directly related to scale
  const color = `rgb(${Math.min(255, scale * 85)}, 0, ${255 - Math.min(255, scale * 85)})`
  
  // retrieve data from the python server
  useEffect(() => {
    fetch('http://localhost:5000/readCO2')
      .then((res) => res.json())
      .then((data) => setValue(data.value))
      .catch((err) => console.error('Error fetching:', err))
  }, [])

  return (
    <>
      <div>
        <ParticleCircle/>
        <ParticleCircle/>
        <ParticleCircle/>
        <ParticleCircle/>
        <ParticleCircle/>
        <ParticleCircle/>
      </div>
      
      <div
      style={{    //flex box breaks everything don't even try it just use absolute
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'  //needed to keep it centered
      }}>
        <svg
          width={200}
          height={200}
          viewBox="0 0 100 100"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            fill: color,
            transition: 'transform 0.3s, fill 0.3s'
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="40" />
        </svg>
      </div>
      <input
        type="range"
        min="0.5"
        max="3"
        step="0.01"
        value={scale}
        onChange={(e) => setScale(Number(e.target.value))}
      />
      <p>Scale: {scale.toFixed(2)}</p>
      <p>Color: {color}</p>
    </>
  )
}

export default App
