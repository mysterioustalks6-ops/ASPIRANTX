import { EnvironmentId, EnvironmentPreset } from './types';

export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentPreset> = {
  alpine: {
    id: 'alpine',
    name: 'Alpine Mountain',
    subtitle: 'High Altitude Glaciers & Valleys',
    bgImage: '/assets/mountain-ride/reference_alpine.jpg',
    skyColors: ['#0284c7', '#38bdf8', '#bae6fd'],
    sunColor: 'rgba(254, 240, 138, 0.45)',
    mountainColors: {
      distant: '#94a3b8',
      body: '#334155',
      snowOrHighlight: '#f8fafc',
      shadow: '#64748b'
    },
    hillsColor: '#1e3a1e',
    meadowGradient: ['#22c55e', '#16a34a', '#15803d'],
    roadColors: {
      asphaltTop: '#475569',
      asphaltBot: '#0f172a',
      edgeLine: 'rgba(248, 250, 252, 0.85)',
      centerDash: 'rgba(251, 191, 36, 0.95)'
    },
    propStyles: {
      treeType: 'pine',
      treeFoliage: '#14532d',
      treeTrunk: '#451a03',
      cabinRoof: '#7f1d1d',
      cabinWall: '#78350f'
    },
    hazeColor: 'rgba(186, 230, 253, 0.4)',
    defaultWeather: 'clear'
  },
  green_valley: {
    id: 'green_valley',
    name: 'Green Valley',
    subtitle: 'Rolling Emerald Meadows & Wildflowers',
    bgImage: '/assets/mountain-ride/env_alpine.jpg',
    skyColors: ['#0ea5e9', '#7dd3fc', '#e0f2fe'],
    sunColor: 'rgba(253, 224, 71, 0.5)',
    mountainColors: {
      distant: '#64748b',
      body: '#1e293b',
      snowOrHighlight: '#86efac',
      shadow: '#334155'
    },
    hillsColor: '#166534',
    meadowGradient: ['#4ade80', '#22c55e', '#15803d'],
    roadColors: {
      asphaltTop: '#334155',
      asphaltBot: '#0f172a',
      edgeLine: 'rgba(255, 255, 255, 0.9)',
      centerDash: 'rgba(250, 204, 21, 0.95)'
    },
    propStyles: {
      treeType: 'oak',
      treeFoliage: '#15803d',
      treeTrunk: '#5a2d0c',
      cabinRoof: '#991b1b',
      cabinWall: '#854d0e'
    },
    hazeColor: 'rgba(224, 242, 254, 0.3)',
    defaultWeather: 'clear'
  },
  snow_mountain: {
    id: 'snow_mountain',
    name: 'Snow Mountain',
    subtitle: 'Winter Wonderland & Glacial Heights',
    bgImage: '/assets/mountain-ride/env_snow.jpg',
    skyColors: ['#3b82f6', '#93c5fd', '#f1f5f9'],
    sunColor: 'rgba(255, 255, 255, 0.4)',
    mountainColors: {
      distant: '#cbd5e1',
      body: '#475569',
      snowOrHighlight: '#ffffff',
      shadow: '#94a3b8'
    },
    hillsColor: '#334155',
    meadowGradient: ['#e2e8f0', '#cbd5e1', '#94a3b8'],
    roadColors: {
      asphaltTop: '#475569',
      asphaltBot: '#1e293b',
      edgeLine: 'rgba(255, 255, 255, 0.95)',
      centerDash: 'rgba(251, 191, 36, 0.9)'
    },
    propStyles: {
      treeType: 'pine',
      treeFoliage: '#334155',
      treeTrunk: '#1e293b',
      cabinRoof: '#f8fafc',
      cabinWall: '#475569'
    },
    hazeColor: 'rgba(241, 245, 249, 0.6)',
    defaultWeather: 'light_snow'
  },
  pine_forest: {
    id: 'pine_forest',
    name: 'Pine Forest',
    subtitle: 'Deep Woodland Canopy & Timber Scent',
    bgImage: '/assets/mountain-ride/env_alpine.jpg',
    skyColors: ['#0369a1', '#0284c7', '#7dd3fc'],
    sunColor: 'rgba(254, 240, 138, 0.35)',
    mountainColors: {
      distant: '#475569',
      body: '#14532d',
      snowOrHighlight: '#4ade80',
      shadow: '#052e16'
    },
    hillsColor: '#052e16',
    meadowGradient: ['#166534', '#14532d', '#052e16'],
    roadColors: {
      asphaltTop: '#334155',
      asphaltBot: '#0f172a',
      edgeLine: 'rgba(226, 232, 240, 0.85)',
      centerDash: 'rgba(251, 191, 36, 0.9)'
    },
    propStyles: {
      treeType: 'pine',
      treeFoliage: '#052e16',
      treeTrunk: '#3f1a04',
      cabinRoof: '#78350f',
      cabinWall: '#451a03'
    },
    hazeColor: 'rgba(186, 230, 253, 0.3)',
    defaultWeather: 'mist'
  },
  countryside: {
    id: 'countryside',
    name: 'Countryside',
    subtitle: 'Golden Fields & Rustic Stone Fences',
    bgImage: '/assets/mountain-ride/env_autumn.jpg',
    skyColors: ['#0284c7', '#38bdf8', '#fed7aa'],
    sunColor: 'rgba(251, 191, 36, 0.55)',
    mountainColors: {
      distant: '#94a3b8',
      body: '#78350f',
      snowOrHighlight: '#fde047',
      shadow: '#451a03'
    },
    hillsColor: '#854d0e',
    meadowGradient: ['#eab308', '#ca8a04', '#a16207'],
    roadColors: {
      asphaltTop: '#475569',
      asphaltBot: '#1e293b',
      edgeLine: 'rgba(255, 255, 255, 0.85)',
      centerDash: 'rgba(254, 240, 138, 0.9)'
    },
    propStyles: {
      treeType: 'oak',
      treeFoliage: '#ca8a04',
      treeTrunk: '#713f12',
      cabinRoof: '#b91c1c',
      cabinWall: '#78350f'
    },
    hazeColor: 'rgba(254, 215, 170, 0.35)',
    defaultWeather: 'clear'
  },
  coastal: {
    id: 'coastal',
    name: 'Coastal Road',
    subtitle: 'Cliffside Ocean Vistas & Salty Breeze',
    bgImage: '/assets/mountain-ride/env_sunset.jpg',
    skyColors: ['#0284c7', '#38bdf8', '#a5f3fc'],
    sunColor: 'rgba(254, 249, 195, 0.5)',
    mountainColors: {
      distant: '#64748b',
      body: '#0f766e',
      snowOrHighlight: '#67e8f9',
      shadow: '#115e59'
    },
    hillsColor: '#134e4a',
    meadowGradient: ['#06b6d4', '#0891b2', '#0e7490'],
    roadColors: {
      asphaltTop: '#334155',
      asphaltBot: '#0f172a',
      edgeLine: 'rgba(255, 255, 255, 0.9)',
      centerDash: 'rgba(253, 224, 71, 0.95)'
    },
    propStyles: {
      treeType: 'coastal_palm',
      treeFoliage: '#0f766e',
      treeTrunk: '#78350f',
      cabinRoof: '#0284c7',
      cabinWall: '#f8fafc'
    },
    hazeColor: 'rgba(165, 243, 252, 0.4)',
    defaultWeather: 'clear'
  },
  autumn: {
    id: 'autumn',
    name: 'Autumn Mountain',
    subtitle: 'Amber Foliage & Crisp Fall Sunlight',
    bgImage: '/assets/mountain-ride/env_autumn.jpg',
    skyColors: ['#0369a1', '#38bdf8', '#fed7aa'],
    sunColor: 'rgba(249, 115, 22, 0.5)',
    mountainColors: {
      distant: '#78350f',
      body: '#9a3412',
      snowOrHighlight: '#fdba74',
      shadow: '#431407'
    },
    hillsColor: '#7c2d12',
    meadowGradient: ['#ea580c', '#c2410c', '#9a3412'],
    roadColors: {
      asphaltTop: '#475569',
      asphaltBot: '#1e293b',
      edgeLine: 'rgba(255, 255, 255, 0.85)',
      centerDash: 'rgba(253, 224, 71, 0.95)'
    },
    propStyles: {
      treeType: 'autumn',
      treeFoliage: '#c2410c',
      treeTrunk: '#451a03',
      cabinRoof: '#78350f',
      cabinWall: '#451a03'
    },
    hazeColor: 'rgba(254, 215, 170, 0.4)',
    defaultWeather: 'clear'
  },
  desert: {
    id: 'desert',
    name: 'Desert Highway',
    subtitle: 'Red Sandstone Canyons & Open Horizon',
    bgImage: '/assets/mountain-ride/env_sunset.jpg',
    skyColors: ['#0284c7', '#60a5fa', '#fed7aa'],
    sunColor: 'rgba(253, 224, 71, 0.65)',
    mountainColors: {
      distant: '#9a3412',
      body: '#c2410c',
      snowOrHighlight: '#fdba74',
      shadow: '#7c2d12'
    },
    hillsColor: '#9a3412',
    meadowGradient: ['#ea580c', '#c2410c', '#9a3412'],
    roadColors: {
      asphaltTop: '#52525b',
      asphaltBot: '#18181b',
      edgeLine: 'rgba(254, 240, 138, 0.9)',
      centerDash: 'rgba(250, 204, 21, 0.95)'
    },
    propStyles: {
      treeType: 'cactus',
      treeFoliage: '#15803d',
      treeTrunk: '#166534',
      cabinRoof: '#78350f',
      cabinWall: '#b45309'
    },
    hazeColor: 'rgba(254, 215, 170, 0.45)',
    defaultWeather: 'clear'
  },
  misty_hills: {
    id: 'misty_hills',
    name: 'Misty Hills',
    subtitle: 'Dreamy Fog Veils & Peaceful Stillness',
    bgImage: '/assets/mountain-ride/env_misty.jpg',
    skyColors: ['#475569', '#64748b', '#94a3b8'],
    sunColor: 'rgba(255, 255, 255, 0.25)',
    mountainColors: {
      distant: '#94a3b8',
      body: '#475569',
      snowOrHighlight: '#cbd5e1',
      shadow: '#334155'
    },
    hillsColor: '#1e3a1e',
    meadowGradient: ['#166534', '#15803d', '#166534'],
    roadColors: {
      asphaltTop: '#334155',
      asphaltBot: '#0f172a',
      edgeLine: 'rgba(241, 245, 249, 0.8)',
      centerDash: 'rgba(251, 191, 36, 0.85)'
    },
    propStyles: {
      treeType: 'pine',
      treeFoliage: '#14532d',
      treeTrunk: '#292524',
      cabinRoof: '#44403c',
      cabinWall: '#292524'
    },
    hazeColor: 'rgba(203, 213, 225, 0.65)',
    defaultWeather: 'mist'
  },
  sunset_valley: {
    id: 'sunset_valley',
    name: 'Sunset Valley',
    subtitle: 'Golden Hour Dusk & Magenta Skies',
    bgImage: '/assets/mountain-ride/env_sunset.jpg',
    skyColors: ['#581c87', '#9333ea', '#fb923c'],
    sunColor: 'rgba(251, 146, 60, 0.65)',
    mountainColors: {
      distant: '#4c1d95',
      body: '#3b0764',
      snowOrHighlight: '#f472b6',
      shadow: '#2e1065'
    },
    hillsColor: '#2e1065',
    meadowGradient: ['#701a75', '#4a044e', '#2e1065'],
    roadColors: {
      asphaltTop: '#3b0764',
      asphaltBot: '#0f051d',
      edgeLine: 'rgba(254, 215, 170, 0.85)',
      centerDash: 'rgba(251, 146, 60, 0.95)'
    },
    propStyles: {
      treeType: 'pine',
      treeFoliage: '#3b0764',
      treeTrunk: '#1e1b4b',
      cabinRoof: '#581c87',
      cabinWall: '#3b0764'
    },
    hazeColor: 'rgba(244, 114, 182, 0.35)',
    defaultWeather: 'sunset'
  }
};
