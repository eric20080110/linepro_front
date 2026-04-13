import { useState } from 'react'

export default function Icon({ name, fallback, size = 24, className = '', style = {} }) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <span 
        className={className} 
        style={{ 
          fontSize: size, 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          lineHeight: 1,
          ...style 
        }}
      >
        {fallback}
      </span>
    )
  }

  return (
    <img
      src={`/icons/${name}.png`}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{ 
        objectFit: 'contain', 
        display: 'inline-block', 
        verticalAlign: 'middle',
        ...style 
      }}
      onError={() => setError(true)}
    />
  )
}
