/**
 * ── ASSET MANIFEST FOR RIDER, BIKE BUILDER & GARAGE ─────────────────────────
 * Slots that load by ID. Until Penpot exports (Lottie/Rive/SVG/PNG) are supplied,
 * renders high-fidelity labelled grey placeholders with precise dimension tags.
 */

export interface AssetSlotDefinition {
  id: string;
  name: string;
  description: string;
  category: 'RIDER' | 'BIKE_TIER' | 'BIKE_PART' | 'STATE' | 'VEHICLE';
  dimensions: string; // e.g., '512x512'
  format: 'SVG' | 'Lottie' | 'Rive' | 'PNG';
  penpotNodeId?: string;
}

export const ASSET_SLOTS_MANIFEST: Record<string, AssetSlotDefinition> = {
  // ── RIDER POSES (Original Anime Sports Coach) ──
  'rider_idle': {
    id: 'rider_idle',
    name: 'Rider Coach — Idle Pose',
    description: 'Standing poised beside bike, holding sports helmet under arm, friendly confident posture.',
    category: 'RIDER',
    dimensions: '384x512',
    format: 'SVG'
  },
  'rider_ready': {
    id: 'rider_ready',
    name: 'Rider Coach — Ready & Geared',
    description: 'Helmet on, visor up, adjusting riding gloves, leaning forward in focus mode.',
    category: 'RIDER',
    dimensions: '384x512',
    format: 'SVG'
  },
  'rider_riding': {
    id: 'rider_riding',
    name: 'Rider Coach — Highway Cruise',
    description: 'Riding aerodynamic stance on the highway, wind motion lines, deep focus posture.',
    category: 'RIDER',
    dimensions: '512x384',
    format: 'SVG'
  },
  'rider_tired': {
    id: 'rider_tired',
    name: 'Rider Coach — Rest & Recharge',
    description: 'Sitting on roadside milestone, helmet resting beside him, sipping water, peaceful rest.',
    category: 'RIDER',
    dimensions: '384x512',
    format: 'SVG'
  },
  'rider_celebrate': {
    id: 'rider_celebrate',
    name: 'Rider Coach — Victory Celebration',
    description: 'High-five with Veer bird, raising checkered flag, golden spark highlights.',
    category: 'RIDER',
    dimensions: '512x512',
    format: 'SVG'
  },
  'rider_workshop': {
    id: 'rider_workshop',
    name: 'Rider Coach — Workshop Tuner',
    description: 'Holding wrench, inspects engine block in pit lane garage with focused craftsman look.',
    category: 'RIDER',
    dimensions: '384x512',
    format: 'SVG'
  },

  // ── BIKE TIERS ──
  'tier_1_bike': {
    id: 'tier_1_bike',
    name: 'Highway Cruiser 150cc',
    description: 'Low tier foundational commuter motorcycle with upright handlebars.',
    category: 'BIKE_TIER',
    dimensions: '600x400',
    format: 'SVG'
  },
  'tier_2_bike': {
    id: 'tier_2_bike',
    name: 'Gran Canyon Sport 400cc',
    description: 'Mid tier sporty roadster with aerodynamic tank and dual discs.',
    category: 'BIKE_TIER',
    dimensions: '600x400',
    format: 'SVG'
  },
  'tier_3_bike': {
    id: 'tier_3_bike',
    name: 'Apex Velocity 1000cc',
    description: 'High tier race superbike with carbon fairings and track exhaust.',
    category: 'BIKE_TIER',
    dimensions: '600x400',
    format: 'SVG'
  },
  'tier_4_car': {
    id: 'tier_4_car',
    name: 'Highway Grand Tourer (Car)',
    description: 'Season finale GT coupe unlocked after 12 completed weeks of study.',
    category: 'VEHICLE',
    dimensions: '700x380',
    format: 'SVG'
  },

  // ── BIKE PARTS ──
  'part_frame': {
    id: 'part_frame',
    name: 'High-Tensile Steel Frame',
    description: 'Trellis steel motorcycle chassis.',
    category: 'BIKE_PART',
    dimensions: '256x256',
    format: 'SVG'
  },
  'part_wheels': {
    id: 'part_wheels',
    name: 'Alloy Wheels & Radials',
    description: 'Pair of alloy wheels with highway radial tires.',
    category: 'BIKE_PART',
    dimensions: '256x256',
    format: 'SVG'
  },
  'part_engine': {
    id: 'part_engine',
    name: 'Tuned Motor Engine',
    description: 'High-compression motorcycle engine with cooling fins.',
    category: 'BIKE_PART',
    dimensions: '256x256',
    format: 'SVG'
  },
  'part_fuel_tank': {
    id: 'part_fuel_tank',
    name: 'Fuel Reservoir',
    description: 'Sculpted highway fuel tank.',
    category: 'BIKE_PART',
    dimensions: '256x256',
    format: 'SVG'
  },
  'part_seat': {
    id: 'part_seat',
    name: 'Ergonomic Touring Saddle',
    description: 'High-density cushioned saddle.',
    category: 'BIKE_PART',
    dimensions: '256x256',
    format: 'SVG'
  },
  'part_paint': {
    id: 'part_paint',
    name: 'Calm Highway Custom Paint',
    description: 'Reflective twilight road spray finish.',
    category: 'BIKE_PART',
    dimensions: '256x256',
    format: 'SVG'
  },
  'part_helmet_rack': {
    id: 'part_helmet_rack',
    name: 'Helmet & Gear Rack',
    description: 'Coach gear bracket mounted to chassis.',
    category: 'BIKE_PART',
    dimensions: '256x256',
    format: 'SVG'
  },
  'part_trophy': {
    id: 'part_trophy',
    name: 'Mastery Highway Crest',
    description: 'Polished gold crest emblem.',
    category: 'BIKE_PART',
    dimensions: '256x256',
    format: 'SVG'
  },

  // ── STATES ──
  'bike_damaged': {
    id: 'bike_damaged',
    name: 'Damaged Highway Bike',
    description: 'Worn tires, scuffed exhaust, warning amber hazard indicator.',
    category: 'STATE',
    dimensions: '600x400',
    format: 'SVG'
  },
  'bike_workshop': {
    id: 'bike_workshop',
    name: 'Workshop Pit Lane Bay',
    description: 'Bike raised on hydraulic pit paddock stand in workshop for rebuild.',
    category: 'STATE',
    dimensions: '600x400',
    format: 'SVG'
  }
};
