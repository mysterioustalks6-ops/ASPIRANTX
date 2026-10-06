/**
 * ── BIKE BUILDER CONFIGURATION ──────────────────────────────────────────────
 * Config-driven rules for the Highway Bike Builder & Focus Engine.
 */

export interface BikePartConfig {
  id: string; // 'frame' | 'wheels' | 'engine' | 'fuel_tank' | 'seat' | 'paint' | 'helmet_rack' | 'trophy'
  name: string;
  category: 'CHASSIS' | 'POWERTRAIN' | 'FINISHING' | 'MASTERY';
  unlockPercent: number; // 12.5%, 25%, 37.5%, 50%, 62.5%, 75%, 87.5%, 100%
  description: string;
}

export interface VehicleTierConfig {
  tierNumber: number; // 1, 2, 3, 4
  type: 'bike' | 'car';
  id: string;
  name: string;
  subtitle: string;
  engineDisplacement: string;
  parts: BikePartConfig[];
}

export interface BikeEngineConfig {
  seasonWeeks: number;              // 12 weeks per season
  sessionCapMinutes: number;        // 120 minutes max counted per session
  dayCapHours: number;              // 8 hours max counted per calendar day
  minStopwatchSeconds: number;      // 600s (10 min)
  minPomodoroCompletionPercent: number; // 0.60 (60%)
  restDaysAllowedPerWeek: number;   // 1 rest day allowed per week without miss
  pauseDaysAllowedPerMonth: number; // 3 days max for sick/travel
  workshopRebuildMinutes: number;   // 60 minutes counted focus to restore from Workshop
  defaultWeeklyTargetHours: number | null; // default null (EMPTY)
  minWeeklyTargetHours: number;     // 5h
  maxWeeklyTargetHours: number;     // 56h
  tiers: VehicleTierConfig[];
}

export const STANDARD_BIKE_PARTS: BikePartConfig[] = [
  { id: 'frame', name: 'High-Tensile Steel Frame', category: 'CHASSIS', unlockPercent: 12.5, description: 'Rigid backbone forged on the early highway miles.' },
  { id: 'wheels', name: 'Alloy Wheels & Radials', category: 'CHASSIS', unlockPercent: 25.0, description: 'Dual front and rear alloy rims built for long endurance.' },
  { id: 'engine', name: 'Tuned Single-Cylinder Engine', category: 'POWERTRAIN', unlockPercent: 37.5, description: 'High-compression motor for continuous rhythm.' },
  { id: 'fuel_tank', name: 'Tear-Drop Fuel Reservoir', category: 'POWERTRAIN', unlockPercent: 50.0, description: 'Aerodynamic tank carrying focus stamina.' },
  { id: 'seat', name: 'Ergonomic Touring Saddle', category: 'FINISHING', unlockPercent: 62.5, description: 'Plush saddle engineered for deep, pain-free study rides.' },
  { id: 'paint', name: 'Calm Highway Custom Paint', category: 'FINISHING', unlockPercent: 75.0, description: 'Matte twilight & amber reflective livery.' },
  { id: 'helmet_rack', name: 'Rider Gear & Helmet Rack', category: 'FINISHING', unlockPercent: 87.5, description: 'Mounting rack for the sports coach helmet & gloves.' },
  { id: 'trophy', name: 'Highway Mastery Emblem', category: 'MASTERY', unlockPercent: 100.0, description: 'Crown jewel emblem awarded for hitting 100% weekly target.' }
];

export const CAR_PARTS: BikePartConfig[] = [
  { id: 'frame', name: 'Monocoque Aerodynamic Chassis', category: 'CHASSIS', unlockPercent: 12.5, description: 'High-rigidity lightweight body frame.' },
  { id: 'wheels', name: '19-Inch Forged Highway Wheels', category: 'CHASSIS', unlockPercent: 25.0, description: 'All-weather performance radials.' },
  { id: 'engine', name: 'Twin-Turbo Endurance V6', category: 'POWERTRAIN', unlockPercent: 37.5, description: 'Silky smooth power for long-distance master milestones.' },
  { id: 'fuel_tank', name: 'Long-Range Hybrid Battery & Tank', category: 'POWERTRAIN', unlockPercent: 50.0, description: 'Extended reservoir for continental journeys.' },
  { id: 'seat', name: 'Cockpit Bucket Sport Seats', category: 'FINISHING', unlockPercent: 62.5, description: 'Alcantara upholstered cockpit.' },
  { id: 'paint', name: 'Midnight Aurora Pearlescent Finish', category: 'FINISHING', unlockPercent: 75.0, description: 'Dual-tone ceramic coated reflective paint.' },
  { id: 'helmet_rack', name: 'Dual Helmet & Gear Compartment', category: 'FINISHING', unlockPercent: 87.5, description: 'Rear trunk compartment for coach & co-driver gear.' },
  { id: 'trophy', name: 'Season 1 Grand Champion Crest', category: 'MASTERY', unlockPercent: 100.0, description: 'Gold leaf emblem celebrating 12 weeks of unbroken focus.' }
];

export const DEFAULT_BIKE_CONFIG: BikeEngineConfig = {
  seasonWeeks: 12,
  sessionCapMinutes: 120,
  dayCapHours: 8,
  minStopwatchSeconds: 600,
  minPomodoroCompletionPercent: 0.60,
  restDaysAllowedPerWeek: 1,
  pauseDaysAllowedPerMonth: 3,
  workshopRebuildMinutes: 60,
  defaultWeeklyTargetHours: null,
  minWeeklyTargetHours: 5,
  maxWeeklyTargetHours: 56,
  tiers: [
    {
      tierNumber: 1,
      type: 'bike',
      id: 'highway_cruiser_150',
      name: 'Highway Cruiser 150',
      subtitle: 'Low Tier — Built for foundational rhythm and early chapters',
      engineDisplacement: '150cc Air-Cooled',
      parts: STANDARD_BIKE_PARTS
    },
    {
      tierNumber: 2,
      type: 'bike',
      id: 'gran_canyon_sport_400',
      name: 'Gran Canyon Sport 400',
      subtitle: 'Mid Tier — Agile roadster for deep practice and high-yield drills',
      engineDisplacement: '399cc Liquid-Cooled Parallel Twin',
      parts: STANDARD_BIKE_PARTS
    },
    {
      tierNumber: 3,
      type: 'bike',
      id: 'apex_velocity_1000',
      name: 'Apex Velocity 1000',
      subtitle: 'High Tier — Superbike forged for full mocks and syllabus mastery',
      engineDisplacement: '998cc Inline-Four Track Monster',
      parts: STANDARD_BIKE_PARTS
    },
    {
      tierNumber: 4,
      type: 'car',
      id: 'highway_grand_tourer_car',
      name: 'Highway Grand Tourer',
      subtitle: 'Season Finale Car — Unlocked upon completing 12 weeks of focus',
      engineDisplacement: 'Twin-Turbo V6 Hybrid GT',
      parts: CAR_PARTS
    }
  ]
};
