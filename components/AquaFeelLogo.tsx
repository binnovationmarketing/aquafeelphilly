import React from 'react';

interface AquaFeelLogoProps {
  width?: string;
  className?: string;
  variant?: 'default' | 'white';
}

const AquaFeelLogo: React.FC<AquaFeelLogoProps> = ({ 
  width = "300px", 
  className = "", 
  variant = 'default' 
}) => {
  const mainTextColor = variant === 'white' ? '#FFFFFF' : '#000000';
  const techColor = '#00AEEF';

  return (
    <div className={`flex items-center transition-all duration-500 ${className}`} style={{ width: width }}>
      <svg
        viewBox="0 0 720 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* --- ÍCONE: QUADRADO AZUL TRANSLÚCIDO COM GOTA --- */}
        <g transform="translate(10, 10)">
          {/* Fundo do Quadrado com cantos arredondados e translucidez aplicada */}
          <rect
            x="0"
            y="0"
            width="160"
            height="160"
            rx="40"
            fill={techColor}
            fillOpacity="0.7"
          />
          
          {/* Gota Estilizada (Símbolo central) */}
          <path
            d="M80 30C80 30 40 75 40 105C40 127.1 57.9 145 80 145C102.1 145 120 127.1 120 105C120 75 80 30 80 30Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M80 45C80 45 55 85 55 105C55 118.8 66.2 130 80 130C93.8 130 105 118.8 105 105C105 85 80 45 80 45Z"
            fill={techColor}
            fillOpacity="0.4"
          />
        </g>

        {/* --- TEXTO "AQUAFEEL" --- */}
        <text
          x="190"
          y="95"
          fontFamily="'Montserrat', 'Arial Black', sans-serif"
          fontWeight="900"
          fontSize="82"
          fill={mainTextColor}
          letterSpacing="-2"
        >
          AQUAFEEL
        </text>

        {/* --- TEXTO "SOLUTIONS TECH" COM TRANSLUCIDEZ --- */}
        <text
          x="195"
          y="145"
          fontFamily="'Montserrat', sans-serif"
          fontWeight="600"
          fontSize="42"
          fill={techColor}
          fillOpacity="0.85"
          letterSpacing="6"
        >
          SOLUTIONS TECH
        </text>
      </svg>
    </div>
  );
};

export default AquaFeelLogo;