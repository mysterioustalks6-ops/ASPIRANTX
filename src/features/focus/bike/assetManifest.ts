/**
 * ── 52-ASSET MASTER MANIFEST FOR RIDER, BIKE BUILDER & GARAGE ────────────────
 * Standardized asset slots for Calm Highway Focus & Garage.
 * When real SVGs/Lotties are supplied, place them in public/assets/... and they load automatically.
 * Missing assets render high-fidelity labelled grey placeholders.
 */

export interface AssetSlotDefinition {
  id: string;
  name: string;
  description: string;
  category: 'RIDER' | 'BIKE_TIER' | 'BIKE_PART' | 'PROP' | 'OVERLAY' | 'RELAX' | 'VEHICLE';
  tier?: number;
  slot?: string;
  dimensions: string; // e.g., '512x512'
  format: 'SVG' | 'Lottie' | 'Rive' | 'PNG';
  expectedPath: string;
  penpotNodeId?: string;
}

const TIER_NAMES = ['Cruiser 150cc', 'Gran Canyon 400cc', 'Apex Velocity 1000cc', 'Grand Tourer Car'] as const;
const PART_SLOTS = [
  { slot: 'frame', name: 'Frame Chassis', desc: 'High-tensile tubular motorcycle frame' },
  { slot: 'wheels', name: 'Alloy Wheels', desc: 'Pair of alloy wheels with radial highway tires' },
  { slot: 'engine', name: 'Engine Block', desc: 'Tuned high-compression motor with cooling fins' },
  { slot: 'fuel_tank', name: 'Fuel Tank', desc: 'Aerodynamic highway fuel reservoir' },
  { slot: 'seat', name: 'Touring Saddle', desc: 'Ergonomic cushioned high-density saddle' },
  { slot: 'paint', name: 'Custom Paint', desc: 'Reflective twilight road spray finish' },
  { slot: 'helmet_rack', name: 'Helmet Rack', desc: 'Chassis-mounted helmet and utility gear rack' },
  { slot: 'trophy', name: 'Mastery Crest', desc: 'Polished gold highway milestone crest' }
] as const;

export const ASSET_SLOTS_MANIFEST: Record<string, AssetSlotDefinition> = {
  // ── 1. RIDER POSES (5 ASSETS) ──
  'rider_idle': {
    id: 'rider_idle',
    name: 'Rider Coach — Idle Pose',
    description: 'Standing poised beside bike, holding sports helmet under arm, friendly confident posture.',
    category: 'RIDER',
    slot: 'pose_idle',
    dimensions: '384x512',
    format: 'SVG',
    expectedPath: '/assets/rider/rider_idle.svg'
  },
  'rider_ready': {
    id: 'rider_ready',
    name: 'Rider Coach — Ready & Geared',
    description: 'Helmet on, visor up, adjusting riding gloves, leaning forward in focus mode.',
    category: 'RIDER',
    slot: 'pose_ready',
    dimensions: '384x512',
    format: 'SVG',
    expectedPath: '/assets/rider/rider_ready.svg'
  },
  'rider_riding': {
    id: 'rider_riding',
    name: 'Rider Coach — Highway Cruise',
    description: 'Riding aerodynamic stance on the highway, wind motion lines, deep focus posture.',
    category: 'RIDER',
    slot: 'pose_riding',
    dimensions: '512x384',
    format: 'SVG',
    expectedPath: '/assets/rider/rider_riding.svg'
  },
  'rider_tired': {
    id: 'rider_tired',
    name: 'Rider Coach — Rest & Recharge',
    description: 'Sitting on roadside milestone, helmet resting beside him, sipping water, peaceful rest.',
    category: 'RIDER',
    slot: 'pose_tired',
    dimensions: '384x512',
    format: 'SVG',
    expectedPath: '/assets/rider/rider_tired.svg'
  },
  'rider_celebrate': {
    id: 'rider_celebrate',
    name: 'Rider Coach — Victory Celebration',
    description: 'High-five with companion bird, raising checkered flag, golden spark highlights.',
    category: 'RIDER',
    slot: 'pose_celebrate',
    dimensions: '512x512',
    format: 'SVG',
    expectedPath: '/assets/rider/rider_celebrate.svg'
  },

  // ── 2. RIDER ACCESSORIES & PROPS (3 ASSETS) ──
  'rider_prop_helmet': {
    id: 'rider_prop_helmet',
    name: 'Rider Prop — Full Helmet',
    description: 'Aerodynamic full-face helmet with tinted visor and safety chin guard.',
    category: 'PROP',
    slot: 'prop_helmet',
    dimensions: '256x256',
    format: 'SVG',
    expectedPath: '/assets/rider/props/helmet.svg'
  },
  'rider_prop_visor': {
    id: 'rider_prop_visor',
    name: 'Rider Prop — Open Visor',
    description: 'Raised clear visor revealing determined rider eyes.',
    category: 'PROP',
    slot: 'prop_visor',
    dimensions: '256x256',
    format: 'SVG',
    expectedPath: '/assets/rider/props/visor.svg'
  },
  'rider_prop_wrench': {
    id: 'rider_prop_wrench',
    name: 'Rider Prop — Workshop Wrench',
    description: 'Chrome vanadium combination wrench held in hand for garage tuning.',
    category: 'PROP',
    slot: 'prop_wrench',
    dimensions: '256x256',
    format: 'SVG',
    expectedPath: '/assets/rider/props/wrench.svg'
  },

  // ── 3. FULL BIKE & VEHICLE TIERS (4 ASSETS) ──
  'tier_1_bike': {
    id: 'tier_1_bike',
    name: 'Highway Cruiser 150cc',
    description: 'Low tier foundational commuter motorcycle with upright handlebars.',
    category: 'BIKE_TIER',
    tier: 1,
    slot: 'full_bike',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/bike/tier1/full_bike.svg'
  },
  'tier_2_bike': {
    id: 'tier_2_bike',
    name: 'Gran Canyon Sport 400cc',
    description: 'Mid tier sporty roadster with aerodynamic tank and dual discs.',
    category: 'BIKE_TIER',
    tier: 2,
    slot: 'full_bike',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/bike/tier2/full_bike.svg'
  },
  'tier_3_bike': {
    id: 'tier_3_bike',
    name: 'Apex Velocity 1000cc',
    description: 'High tier race superbike with carbon fairings and track exhaust.',
    category: 'BIKE_TIER',
    tier: 3,
    slot: 'full_bike',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/bike/tier3/full_bike.svg'
  },
  'tier_4_car': {
    id: 'tier_4_car',
    name: 'Highway Grand Tourer (Car)',
    description: 'Season finale GT coupe unlocked after 12 completed weeks of study.',
    category: 'VEHICLE',
    tier: 4,
    slot: 'full_vehicle',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/bike/tier4/full_car.svg'
  },

  // ── 4. BIKE PARTS (32 ASSETS: 8 PER TIER x 4 TIERS) ──
  ...Object.fromEntries(
    [1, 2, 3, 4].flatMap((tier) =>
      PART_SLOTS.map(({ slot, name, desc }) => {
        const id = `t${tier}_part_${slot}`;
        return [
          id,
          {
            id,
            name: `Tier ${tier} ${name} (${TIER_NAMES[tier - 1]})`,
            description: `${desc} calibrated for Tier ${tier} ${TIER_NAMES[tier - 1]}.`,
            category: 'BIKE_PART' as const,
            tier,
            slot,
            dimensions: '512x512',
            format: 'SVG' as const,
            expectedPath: `/assets/bike/tier${tier}/parts/${slot}.svg`
          }
        ];
      })
    )
  ),

  // ── 5. ROAD / HIGHWAY OVERLAYS (4 ASSETS) ──
  'overlay_road_day': {
    id: 'overlay_road_day',
    name: 'Road Overlay — Calm Daylight',
    description: 'Clear daylight highway horizon, gentle cyan sky, crisp yellow center lines.',
    category: 'OVERLAY',
    slot: 'overlay_day',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/highway/overlays/road_day.svg'
  },
  'overlay_road_golden': {
    id: 'overlay_road_golden',
    name: 'Road Overlay — Golden Hour',
    description: 'Warm sunset casting elongated road shadows, amber asphalt highlights.',
    category: 'OVERLAY',
    slot: 'overlay_golden',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/highway/overlays/road_golden.svg'
  },
  'overlay_road_twilight': {
    id: 'overlay_road_twilight',
    name: 'Road Overlay — Deep Twilight',
    description: 'Indigo dusk sky, illuminated reflective cat-eyes on road curbs.',
    category: 'OVERLAY',
    slot: 'overlay_twilight',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/highway/overlays/road_twilight.svg'
  },
  'overlay_road_night': {
    id: 'overlay_road_night',
    name: 'Road Overlay — Starry Night Highway',
    description: 'Dark midnight tarmac, bike headlight beam cutting into the quiet distance.',
    category: 'OVERLAY',
    slot: 'overlay_night',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/highway/overlays/road_night.svg'
  },

  // ── 6. RELAX SCENES (4 ASSETS) ──
  'relax_milestone_bench': {
    id: 'relax_milestone_bench',
    name: 'Relax Scene — Roadside Milestone Bench',
    description: 'Wooden rest bench next to a kilometer milestone marker shaded by roadside neem tree.',
    category: 'RELAX',
    slot: 'scene_milestone',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/highway/relax/milestone_bench.svg'
  },
  'relax_dhaba_tea': {
    id: 'relax_dhaba_tea',
    name: 'Relax Scene — Highway Dhaba Tea Stall',
    description: 'Steaming glass tumbler of chai on a rustic wooden table with gentle evening warmth.',
    category: 'RELAX',
    slot: 'scene_dhaba',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/highway/relax/dhaba_tea.svg'
  },
  'relax_scenic_overlook': {
    id: 'relax_scenic_overlook',
    name: 'Relax Scene — Mountain Ghat Overlook',
    description: 'Scenic highway ridge overlook looking down upon winding mountain valley roads.',
    category: 'RELAX',
    slot: 'scene_overlook',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/highway/relax/scenic_overlook.svg'
  },
  'relax_night_camp': {
    id: 'relax_night_camp',
    name: 'Relax Scene — Starlit Roadside Camp',
    description: 'Campfire beside the parked motorcycle under a clear canopy of twinkling stars.',
    category: 'RELAX',
    slot: 'scene_camp',
    dimensions: '1024x1024',
    format: 'SVG',
    expectedPath: '/assets/highway/relax/night_camp.svg'
  }
};

export const TOTAL_MANIFEST_ASSETS_COUNT = Object.keys(ASSET_SLOTS_MANIFEST).length;
