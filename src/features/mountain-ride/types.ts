export type BikeId = 'adventure' | 'rally' | 'touring' | 'scrambler' | 'dualsport';

export type RiderId = 
  | 'adventure_touring' 
  | 'casual_traveler' 
  | 'long_distance' 
  | 'sport_adventure' 
  | 'classic_traveler';

export type EnvironmentId = 
  | 'alpine'
  | 'green_valley'
  | 'snow_mountain'
  | 'pine_forest'
  | 'countryside'
  | 'coastal'
  | 'autumn'
  | 'desert'
  | 'misty_hills'
  | 'sunset_valley';

export type WeatherType = 'clear' | 'cloudy' | 'mist' | 'light_snow' | 'light_rain' | 'sunset';

export interface BikeColors {
  primary: string;      // Bodywork / Tank / Beak
  secondary: string;    // Frame / Accents
  seat: string;         // Saddle leather/vinyl
  luggage: string;      // Panniers / Luggage
  wheels: string;       // Rims & Spokes
}

export interface BikeConfig {
  id: BikeId;
  name: string;
  tagline: string;
  description: string;
  stance: 'tall' | 'rally' | 'low' | 'classic' | 'slim';
  colors: BikeColors;
  hasPanniers: boolean;
  hasTopBox: boolean;
  windscreenSize: 'tall' | 'rally_tower' | 'wide' | 'none' | 'small';
  exhaustStyle: 'dual' | 'high_rally' | 'twin_chrome' | 'high_scrambler' | 'enduro';
}

export interface RiderConfig {
  id: RiderId;
  name: string;
  gearTitle: string;
  description: string;
  helmetColor: string;
  helmetStyle: 'peak' | 'matte' | 'expedition' | 'sport' | 'retro';
  jacketColor: string;
  pantsColor: string;
  bootsColor: string;
  glovesColor: string;
  hasBackpack: boolean;
  backpackColor?: string;
}

export interface EnvironmentPreset {
  id: EnvironmentId;
  name: string;
  subtitle: string;
  skyColors: [string, string, string]; // Top, Mid, Horizon
  sunColor: string;
  mountainColors: {
    distant: string;
    body: string;
    snowOrHighlight: string;
    shadow: string;
  };
  hillsColor: string;
  meadowGradient: [string, string, string];
  roadColors: {
    asphaltTop: string;
    asphaltBot: string;
    edgeLine: string;
    centerDash: string;
  };
  propStyles: {
    treeType: 'pine' | 'oak' | 'autumn' | 'cactus' | 'cypress' | 'coastal_palm';
    treeFoliage: string;
    treeTrunk: string;
    cabinRoof: string;
    cabinWall: string;
  };
  hazeColor: string;
  defaultWeather: WeatherType;
  bgImage?: string;
}

export interface RidePreferences {
  bikeId: BikeId;
  bikeColors: BikeColors;
  riderId: RiderId;
  environmentId: EnvironmentId;
  weather: WeatherType;
  speed: number;
  isAudioEnabled: boolean;
}

export const BIKE_PRESETS: Record<BikeId, BikeConfig> = {
  adventure: {
    id: 'adventure',
    name: 'Adventure Touring',
    tagline: 'Continental Explorer',
    description: 'Rugged tall stance with dual aluminum hard cases, boxer engine, and heavy-duty knobby tires.',
    stance: 'tall',
    colors: {
      primary: '#38bdf8', // Alpine Cyan
      secondary: '#0284c7',
      seat: '#1e293b',
      luggage: '#94a3b8',
      wheels: '#0f172a'
    },
    hasPanniers: true,
    hasTopBox: true,
    windscreenSize: 'tall',
    exhaustStyle: 'dual'
  },
  rally: {
    id: 'rally',
    name: 'Rally Adventure',
    tagline: 'Dakar Spirit',
    description: 'Lightweight rally tower, single high-mount titanium pipe, long suspension travel, and soft dry-packs.',
    stance: 'rally',
    colors: {
      primary: '#f97316', // Dakar Orange
      secondary: '#ea580c',
      seat: '#0f172a',
      luggage: '#334155',
      wheels: '#f59e0b'
    },
    hasPanniers: false,
    hasTopBox: true,
    windscreenSize: 'rally_tower',
    exhaustStyle: 'high_rally'
  },
  touring: {
    id: 'touring',
    name: 'Grand Touring',
    tagline: 'Endless Highway',
    description: 'Plush low-slung saddle, aerodynamic fairings, integrated color-matched luggage, and quiet dual chrome exhausts.',
    stance: 'low',
    colors: {
      primary: '#6366f1', // Deep Indigo
      secondary: '#4338ca',
      seat: '#334155',
      luggage: '#475569',
      wheels: '#e2e8f0'
    },
    hasPanniers: true,
    hasTopBox: true,
    windscreenSize: 'wide',
    exhaustStyle: 'twin_chrome'
  },
  scrambler: {
    id: 'scrambler',
    name: 'Alpine Scrambler',
    tagline: 'Rugged Heritage',
    description: 'Classic round curves, ribbed leather bench seat, twin high-slung scrambler pipes, and canvas roll bags.',
    stance: 'classic',
    colors: {
      primary: '#10b981', // Forest Emerald
      secondary: '#047857',
      seat: '#78350f',
      luggage: '#451a03',
      wheels: '#e2e8f0'
    },
    hasPanniers: false,
    hasTopBox: true,
    windscreenSize: 'small',
    exhaustStyle: 'high_scrambler'
  },
  dualsport: {
    id: 'dualsport',
    name: 'Dual Sport',
    tagline: 'Pure Trailcraft',
    description: 'Ultra-narrow agile chassis, perimeter steel frame, aggressive enduro knobbies, and minimalist tail pack.',
    stance: 'slim',
    colors: {
      primary: '#e11d48', // Crimson Red
      secondary: '#be123c',
      seat: '#0f172a',
      luggage: '#1e293b',
      wheels: '#020617'
    },
    hasPanniers: false,
    hasTopBox: false,
    windscreenSize: 'none',
    exhaustStyle: 'enduro'
  }
};

export const RIDER_PRESETS: Record<RiderId, RiderConfig> = {
  adventure_touring: {
    id: 'adventure_touring',
    name: 'Alpine Explorer',
    gearTitle: 'Gore-Tex Pro Armor',
    description: 'Peak visor adventure helmet, technical touring jacket with reflective stripes, and adventure endurance boots.',
    helmetColor: '#f8fafc',
    helmetStyle: 'peak',
    jacketColor: '#334155',
    pantsColor: '#1e293b',
    bootsColor: '#0f172a',
    glovesColor: '#1e293b',
    hasBackpack: false
  },
  casual_traveler: {
    id: 'casual_traveler',
    name: 'Casual Wanderer',
    gearTitle: 'Waxed Canvas & Denim',
    description: 'Matte black open helmet with yellow tinted visor, olive waxed canvas jacket, reinforced denim, and tan leather boots.',
    helmetColor: '#0f172a',
    helmetStyle: 'matte',
    jacketColor: '#365314',
    pantsColor: '#1e3a8a',
    bootsColor: '#92400e',
    glovesColor: '#78350f',
    hasBackpack: true,
    backpackColor: '#451a03'
  },
  long_distance: {
    id: 'long_distance',
    name: 'Trans-Continental',
    gearTitle: 'Desert Expedition Suit',
    description: 'Sand and khaki ventilated touring gear with high-vis accents, hydration bladder pack, and reinforced shin guards.',
    helmetColor: '#fef08a',
    helmetStyle: 'expedition',
    jacketColor: '#d97706',
    pantsColor: '#78350f',
    bootsColor: '#451a03',
    glovesColor: '#d97706',
    hasBackpack: true,
    backpackColor: '#0284c7'
  },
  sport_adventure: {
    id: 'sport_adventure',
    name: 'Apex Nomad',
    gearTitle: 'Carbon Aerodynamic Hybrid',
    description: 'Carbon fiber aerodynamic helmet with iridium visor, sporty articulated jacket with titanium shoulder sliders.',
    helmetColor: '#18181b',
    helmetStyle: 'sport',
    jacketColor: '#dc2626',
    pantsColor: '#18181b',
    bootsColor: '#18181b',
    glovesColor: '#dc2626',
    hasBackpack: false
  },
  classic_traveler: {
    id: 'classic_traveler',
    name: 'Vintage Nomad',
    gearTitle: 'Classic Leather & Brass',
    description: 'Cream retro bubble helmet with gold racing stripe, distressed brown leather jacket with brass hardware.',
    helmetColor: '#fef3c7',
    helmetStyle: 'retro',
    jacketColor: '#5a2d0c',
    pantsColor: '#1c1917',
    bootsColor: '#441c08',
    glovesColor: '#5a2d0c',
    hasBackpack: false
  }
};

export const COLOR_SWATCHES = [
  { name: 'Alpine White', value: '#f8fafc' },
  { name: 'Cyan Blue', value: '#38bdf8' },
  { name: 'Dakar Orange', value: '#f97316' },
  { name: 'Racing Red', value: '#ef4444' },
  { name: 'Forest Green', value: '#10b981' },
  { name: 'Desert Khaki', value: '#d97706' },
  { name: 'Indigo Night', value: '#6366f1' },
  { name: 'Stealth Black', value: '#1e293b' }
];

export const STORAGE_KEY_PREFS = 'mountain_ride_user_prefs_v2';
