import React from 'react';
import { PlanetarySystem, PlanetType } from './PlanetarySystem';

export interface ProceduralPlanetProps {
  type: PlanetType;
  seed?: number;
  className?: string;
  autoRotate?: boolean;
  showAtmosphere?: boolean;
  showStarfield?: boolean;
  level?: number;
}

/**
 * ProceduralPlanet: Unified wrapper delegating to canonical PlanetarySystem (60FPS WebGL engine).
 */
export const ProceduralPlanet: React.FC<ProceduralPlanetProps> = ({
  type,
  seed = 42,
  className = '',
  autoRotate = true,
  showStarfield = true,
  level = 100,
}) => {
  return (
    <PlanetarySystem
      type={type}
      seed={seed}
      className={className}
      autoRotate={autoRotate}
      showStarfield={showStarfield}
      level={level}
    />
  );
};

export default ProceduralPlanet;
