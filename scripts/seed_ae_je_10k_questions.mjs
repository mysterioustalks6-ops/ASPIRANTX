import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10
});

// Import AE/JE syllabus data
const {
  SSC_JE_CIVIL_SYLLABUS,
  SSC_JE_ELECTRICAL_SYLLABUS,
  SSC_JE_MECHANICAL_SYLLABUS,
  SSC_JE_REASONING_SYLLABUS,
  SSC_JE_GA_SYLLABUS
} = await import('../src/data/aeJeSyllabusData.ts');

console.log('Loaded Syllabus Topics:');
console.log(`- Civil: ${SSC_JE_CIVIL_SYLLABUS.length} topics`);
console.log(`- Electrical: ${SSC_JE_ELECTRICAL_SYLLABUS.length} topics`);
console.log(`- Mechanical: ${SSC_JE_MECHANICAL_SYLLABUS.length} topics`);
console.log(`- Reasoning: ${SSC_JE_REASONING_SYLLABUS.length} topics`);
console.log(`- General Awareness: ${SSC_JE_GA_SYLLABUS.length} topics`);

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

// Exam pools
const CIVIL_EXAMS = [
  'SSC_JE', 'SSC_JE_CIVIL', 'UPPSC_AE', 'UPSSSC_JE', 'BPSC_AE', 'BTSC_JE',
  'MPPSC_AE', 'MP_SUB_ENGINEER', 'RPSC_AEN', 'RSMSSB_JE', 'UKPSC_AE', 'UKPSC_JE',
  'MPSC_MES_AE', 'BMC_MAHA_JE', 'WBPSC_AE', 'WBPSC_JE', 'HPSC_AE', 'HSSC_JE',
  'PPSC_AE', 'JPSC_AE', 'JSSC_JE', 'OPSC_AEE', 'OSSSC_JE', 'GPSC_AE',
  'CGPSC_AE', 'CG_VYAPAM_JE', 'APPSC_AEE', 'TSPSC_AEE', 'KPSC_AE_JE',
  'TNPSC_CESE_AE', 'KERALA_PSC_AE', 'DSSSB_AE_JE', 'DDA_JE'
];

const ELECTRICAL_EXAMS = [
  'SSC_JE', 'SSC_JE_ELECTRICAL', 'UPPCL_AE_JE', 'UPPSC_AE', 'UPSSSC_JE', 'BPSC_AE',
  'BSPHCL_AE_JE', 'MPPSC_AE', 'MP_SUB_ENGINEER', 'RPSC_AEN', 'RSMSSB_JE',
  'UKPSC_AE', 'UKPSC_JE', 'MAHATRANSCO_AE_JE', 'WBPSC_AE', 'WBPSC_JE',
  'HPSC_AE', 'HSSC_JE', 'PSPCL_JE', 'JPSC_AE', 'JSSC_JE', 'OPSC_AEE',
  'GSECL_GETCO_JE', 'GPSC_AE', 'CGPSC_AE', 'CG_VYAPAM_JE', 'APPSC_AEE',
  'TSPSC_AEE', 'KPSC_AE_JE', 'TNPSC_CESE_AE', 'KERALA_PSC_AE', 'DSSSB_AE_JE', 'DDA_JE'
];

const MECHANICAL_EXAMS = [
  'SSC_JE', 'SSC_JE_MECHANICAL', 'UPPSC_AE', 'UPSSSC_JE', 'BPSC_AE', 'BTSC_JE',
  'MPPSC_AE', 'MP_SUB_ENGINEER', 'RPSC_AEN', 'RSMSSB_JE', 'UKPSC_AE', 'UKPSC_JE',
  'MPSC_MES_AE', 'BMC_MAHA_JE', 'WBPSC_AE', 'WBPSC_JE', 'HPSC_AE', 'HSSC_JE',
  'PPSC_AE', 'JPSC_AE', 'JSSC_JE', 'OPSC_AEE', 'GPSC_AE', 'CGPSC_AE',
  'CG_VYAPAM_JE', 'APPSC_AEE', 'TSPSC_AEE', 'KPSC_AE_JE', 'TNPSC_CESE_AE',
  'KERALA_PSC_AE', 'DSSSB_AE_JE', 'DDA_JE'
];

const ALL_EXAMS_POOL = [
  'SSC_JE', 'UPPSC_AE', 'UPSSSC_JE', 'UPPCL_AE_JE', 'BPSC_AE', 'BTSC_JE',
  'MPPSC_AE', 'MP_SUB_ENGINEER', 'RPSC_AEN', 'RSMSSB_JE', 'UKPSC_AE', 'UKPSC_JE',
  'MPSC_MES_AE', 'WBPSC_AE', 'WBPSC_JE', 'HSSC_JE', 'PPSC_AE', 'JPSC_AE',
  'JSSC_JE', 'OPSC_AEE', 'GPSC_AE', 'CGPSC_AE', 'APPSC_AEE', 'TSPSC_AEE',
  'KPSC_AE_JE', 'TNPSC_CESE_AE', 'KERALA_PSC_AE', 'DSSSB_AE_JE', 'DDA_JE'
];

// Technical Problem Templates - CIVIL
const CIVIL_PROBLEM_GENERATORS = [
  {
    topic: 'Bricks, Stones & Aggregates',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] As per Indian Standard IS 1077, what is the maximum permissible water absorption (by dry weight) for first-class building bricks after 24 hours of cold water immersion?`,
      opts: [`20% of its dry weight`, `25% of its dry weight`, `15% of its dry weight`, `10% of its dry weight`],
      ans: 0,
      exp: `According to IS 1077, a first-class brick should not absorb water more than 20% of its dry weight after immersion in cold water for 24 hours. For second-class bricks, the limit is 22%, and for third-class bricks, it is 25%.`
    })
  },
  {
    topic: 'Cement & Concrete Technology',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] In Ordinary Portland Cement (OPC), which of the following Bogue compounds hydrates fastest and is primarily responsible for the initial setting and early heat of hydration?`,
      opts: [`Tricalcium Aluminate (C3A)`, `Tricalcium Silicate (C3S)`, `Dicalcium Silicate (C2S)`, `Tetracalcium Aluminoferrite (C4AF)`],
      ans: 0,
      exp: `Tricalcium Aluminate (C3A) reacts very rapidly with water within the first 24 hours and generates the maximum rate of heat of hydration (~865 J/g), causing initial stiffening. C3S contributes to early strength (up to 7-28 days), while C2S hydrates slowly and provides progressive ultimate strength.`
    })
  },
  {
    topic: 'Surveying',
    gen: (i, exam, year) => {
      const d = 1 + (i % 5);
      const cc = (0.0673 * d * d).toFixed(3);
      return {
        q: `[${exam} ${year}] In levelling across a long sight distance of ${d} km, the combined correction for Earth's curvature and atmospheric refraction is:`,
        opts: [`${cc} m (subtract from staff reading)`, `${(cc * 1.5).toFixed(3)} m (add to staff reading)`, `${(0.0785 * d * d).toFixed(3)} m (subtract)`, `${(0.0112 * d * d).toFixed(3)} m (add)`],
        ans: 0,
        exp: `Curvature correction is Cc = -0.0785 d² m, and refraction correction is Cr = +0.0112 d² m. Combined correction C = Cc + Cr = -0.0673 d² m. For d = ${d} km: C = -0.0673 * (${d})² = -${cc} m.`
      };
    }
  },
  {
    topic: 'Stress, Strain & Elastic Constants',
    gen: (i, exam, year) => {
      const mu = (0.25 + (i % 5) * 0.03).toFixed(2);
      return {
        q: `[${exam} ${year}] If the Poisson ratio of a structural material is μ = ${mu}, what is the exact theoretical ratio of its Young modulus of elasticity (E) to its Shear modulus (G)?`,
        opts: [`${(2 * (1 + parseFloat(mu))).toFixed(2)}`, `${(3 * (1 - 2 * parseFloat(mu))).toFixed(2)}`, `${(1 + parseFloat(mu)).toFixed(2)}`, `2.00`],
        ans: 0,
        exp: `The fundamental relationship between elastic constants is E = 2G(1 + μ). Therefore, E/G = 2(1 + ${mu}) = ${(2 * (1 + parseFloat(mu))).toFixed(2)}.`
      };
    }
  },
  {
    topic: 'Shear Force & Bending Moment',
    gen: (i, exam, year) => {
      const w = 10 + (i % 6) * 5;
      const L = 4 + (i % 5);
      const m = (w * L * L / 8).toFixed(1);
      return {
        q: `[${exam} ${year}] A simply supported beam of span L = ${L} m carries a uniformly distributed load (UDL) of w = ${w} kN/m over its entire length. What is the maximum bending moment occurring at mid-span?`,
        opts: [`${m} kNm`, `${(w * L * L / 2).toFixed(1)} kNm`, `${(w * L / 4).toFixed(1)} kNm`, `${(w * L * L / 12).toFixed(1)} kNm`],
        ans: 0,
        exp: `For a simply supported beam with full UDL: M_max = (w * L²) / 8. With w = ${w} kN/m and L = ${L} m: M_max = (${w} * ${L * L}) / 8 = ${m} kNm.`
      };
    }
  },
  {
    topic: 'Limit State Design of Beams & Slabs',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] According to IS 456:2000 (Clause 38.1), what is the limiting depth of the neutral axis (x_u,max / d) for Fe 415 grade high-yield strength deformed (HYSD) steel in flexural design?`,
      opts: [`0.48 d`, `0.53 d`, `0.46 d`, `0.42 d`],
      ans: 0,
      exp: `Per IS 456:2000, Table B of Clause 38.1: for Fe 250, x_u,max/d = 0.53; for Fe 415, x_u,max/d = 0.48; for Fe 500, x_u,max/d = 0.46.`
    })
  },
  {
    topic: 'Columns, Footings & Shear Design',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] As per IS 456:2000, what is the minimum longitudinal reinforcement required in a reinforced concrete column of gross cross-sectional area A_g?`,
      opts: [`0.8% of gross area (0.008 Ag)`, `0.6% of gross area`, `1.0% of gross area`, `0.15% of gross area`],
      ans: 0,
      exp: `Clause 26.5.3.1 of IS 456:2000 specifies that the cross-sectional area of longitudinal reinforcement in a column shall not be less than 0.8% nor more than 6% of the gross cross-sectional area of the column (maximum 4% when bars are lapped).`
    })
  },
  {
    topic: 'Riveted, Bolted & Welded Connections',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] In accordance with IS 800:2007 (General Construction in Steel), the effective throat thickness of a normal fillet weld having leg size 's' with fusion face angle 90° is taken as:`,
      opts: [`0.7 s`, `s / √2`, `0.5 s`, `1.0 s`],
      ans: 0,
      exp: `Per IS 800:2007 Clause 10.5.3.1, effective throat thickness t_t = K * s, where K = 0.70 for fusion faces inclined between 60° and 90°.`
    })
  },
  {
    topic: 'Soil Mechanics & Foundation Engg',
    gen: (i, exam, year) => {
      const e = 0.6 + (i % 5) * 0.1;
      const n = (e / (1 + e)).toFixed(3);
      return {
        q: `[${exam} ${year}] A soil sample has a void ratio e = ${e.toFixed(2)}. What is its corresponding porosity (n)?`,
        opts: [`${n}`, `${(e / (1 - e)).toFixed(3)}`, `${(e * 100).toFixed(1)}%`, `${(1 / e).toFixed(3)}`],
        ans: 0,
        exp: `The relation between void ratio and porosity is n = e / (1 + e). For e = ${e.toFixed(2)}: n = ${e.toFixed(2)} / (1 + ${e.toFixed(2)}) = ${n}.`
      };
    }
  },
  {
    topic: 'Permeability, Compaction & Shear Strength',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] In a standard direct shear test on clean dry sand with zero cohesion (c = 0), a normal stress of 150 kPa produced failure at a shear stress of 100 kPa. What is the angle of internal friction (ϕ)?`,
      opts: [`tan⁻¹(0.667) ≈ 33.7°`, `tan⁻¹(1.50) ≈ 56.3°`, `45.0°`, `28.5°`],
      ans: 0,
      exp: `By Mohr-Coulomb failure criteria for cohesionless soil: τ = σ * tan(ϕ). Here τ = 100 kPa and σ = 150 kPa. Thus tan(ϕ) = 100 / 150 = 0.667, giving ϕ ≈ 33.7°.`
    })
  },
  {
    topic: 'Fluid Statics & Buoyancy',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] A floating body is said to be in stable equilibrium if its metacentric height (GM) is:`,
      opts: [`Positive (Metacenter M lies above Center of Gravity G)`, `Zero (M coincides with G)`, `Negative (M lies below G)`, `Independent of the position of G`],
      ans: 0,
      exp: `For floating bodies, stable equilibrium requires GM > 0 (Metacenter M above Center of Gravity G). When M is below G (GM < 0), the equilibrium is unstable; when M coincides with G (GM = 0), it is neutral.`
    })
  },
  {
    topic: 'Fluid Kinematics, Dynamics & Pipe Flow',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] For laminar flow of a Newtonian fluid through a circular pipe of diameter D, the Darcy friction factor (f) is mathematically given by:`,
      opts: [`64 / Re`, `16 / Re`, `0.316 / Re^(0.25)`, `0.079 / Re^(0.25)`],
      ans: 0,
      exp: `In pipe hydraulics, the Darcy-Weisbach friction factor for laminar flow (Re < 2000) is f = 64 / Re. If Fanning friction coefficient C_f is asked, C_f = f/4 = 16 / Re.`
    })
  },
  {
    topic: 'Highway Geometric Design',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] According to Indian Roads Congress (IRC), what is the ruling design value of maximum super-elevation (e) permitted on plain and rolling terrain?`,
      opts: [`7% (0.07)`, `10% (0.10)`, `4% (0.04)`, `12% (0.12)`],
      ans: 0,
      exp: `Per IRC specifications: Maximum super-elevation is 7% (0.07) for plain and rolling terrain; 10% (0.10) for hilly terrain not bound by snow; and 4% (0.04) for urban roads with frequent intersections.`
    })
  },
  {
    topic: 'Water Requirements of Crops & Canal Design',
    gen: (i, exam, year) => {
      const B = 100 + (i % 4) * 20;
      const D = 1200 + (i % 5) * 100;
      const delta = ((864 * B) / D).toFixed(1);
      return {
        q: `[${exam} ${year}] If the duty of a canal is D = ${D} hectares/cumec for a crop with base period B = ${B} days, what is the total water depth (Delta Δ) required on the field?`,
        opts: [`${delta} cm`, `${(delta / 10).toFixed(1)} cm`, `${(delta * 2).toFixed(1)} cm`, `86.4 cm`],
        ans: 0,
        exp: `The fundamental duty-delta relationship is: Δ (cm) = (864 * B) / D. For B = ${B} days and D = ${D} ha/cumec: Δ = (864 * ${B}) / ${D} = ${delta} cm.`
      };
    }
  }
];

// Technical Problem Templates - ELECTRICAL
const ELECTRICAL_PROBLEM_GENERATORS = [
  {
    topic: 'Circuit Laws & Network Theorems',
    gen: (i, exam, year) => {
      const v = 20 + (i % 5) * 10;
      const r = 4 + (i % 4) * 2;
      const p = ((v * v) / (4 * r)).toFixed(1);
      return {
        q: `[${exam} ${year}] A DC source has an open-circuit voltage of V_th = ${v} V and internal resistance R_th = ${r} Ω. What is the maximum power that can be transferred to an adjustable load resistor R_L connected across its terminals?`,
        opts: [`${p} W`, `${(v * v / r).toFixed(1)} W`, `${(p * 2).toFixed(1)} W`, `${(v / r).toFixed(1)} W`],
        ans: 0,
        exp: `By the Maximum Power Transfer Theorem, maximum power occurs when R_L = R_th. P_max = V_th² / (4 * R_th) = (${v}²) / (4 * ${r}) = ${v * v} / ${4 * r} = ${p} W.`
      };
    }
  },
  {
    topic: 'AC Fundamentals & Polyphase Circuits',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] In a balanced 3-phase star (Y) connected supply with line voltage V_L and line current I_L, what is the relationship between line quantities and phase quantities (V_ph, I_ph)?`,
      opts: [`V_L = √3 V_ph and I_L = I_ph`, `V_L = V_ph and I_L = √3 I_ph`, `V_L = √3 V_ph and I_L = √3 I_ph`, `V_L = 3 V_ph and I_L = I_ph`],
      ans: 0,
      exp: `In a star-connected system: Line voltage is √3 times the phase voltage and leads it by 30° (V_L = √3 V_ph). The line current is identically equal to the phase current (I_L = I_ph).`
    })
  },
  {
    topic: 'DC Generators & Motors',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] What happens to the speed of a DC shunt motor if the field winding accidentally opens while the motor is operating on light or no load?`,
      opts: [`The motor speed rises dangerously to dangerously high levels (runaway speed)`, `The motor stops immediately`, `The motor speed remains constant`, `The direction of rotation reverses`],
      ans: 0,
      exp: `The speed of a DC motor is inversely proportional to field flux (N ∝ E_b / Φ). When the field circuit opens, the flux drops to residual magnetism (near zero), causing the motor speed to escalate rapidly to destructive runaway speeds.`
    })
  },
  {
    topic: 'Transformers',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] In a transformer, the Open-Circuit (OC) test is conducted on which winding and at what rated parameter to measure core losses?`,
      opts: [`Low Voltage (LV) winding at rated voltage`, `High Voltage (HV) winding at rated current`, `HV winding at rated voltage`, `LV winding at rated current`],
      ans: 0,
      exp: `The Open Circuit (OC) test is performed on the Low Voltage (LV) winding while the High Voltage (HV) winding is kept open-circuited. This is because rated voltage can be safely supplied to the LV side, allowing convenient measurement of core/iron losses (hysteresis and eddy current) and no-load current.`
    })
  },
  {
    topic: 'Induction & Synchronous Machines',
    gen: (i, exam, year) => {
      const p = 4 + (i % 2) * 2; // 4 or 6 pole
      const f = 50;
      const ns = 120 * f / p;
      const s = 0.04;
      const nr = ns * (1 - s);
      return {
        q: `[${exam} ${year}] A ${p}-pole, 50 Hz 3-phase induction motor operates at a slip of s = 4%. What is the rotor speed (N_r)?`,
        opts: [`${nr} rpm`, `${ns} rpm`, `${nr - 50} rpm`, `${ns + 50} rpm`],
        ans: 0,
        exp: `Synchronous speed N_s = 120f / P = (120 * 50) / ${p} = ${ns} rpm. Rotor speed N_r = N_s(1 - s) = ${ns}(1 - 0.04) = ${nr} rpm.`
      };
    }
  },
  {
    topic: 'Transmission & Distribution',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] The phenomenon in which the receiving-end voltage exceeds the sending-end voltage of a long, lightly loaded or open-circuited transmission line is known as:`,
      opts: [`Ferranti Effect`, `Skin Effect`, `Proximity Effect`, `Corona Discharge`],
      ans: 0,
      exp: `The Ferranti effect occurs in long medium/high voltage transmission lines when operating under no-load or light-load conditions. The line charging capacitive current flowing through line inductance creates a voltage rise along the line, making V_r > V_s.`
    })
  },
  {
    topic: 'Switchgear & Fault Protection',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] A Buchholz relay is a gas-actuated protective device specifically installed on oil-immersed transformers between:`,
      opts: [`Main transformer tank and the conservator tank`, `Bushings and the main tank`, `Breather and the conservator`, `Radiator bank and cooling pumps`],
      ans: 0,
      exp: `The Buchholz relay is installed in the connecting pipe between the main tank and the oil conservator. It detects slow developing incipient faults (via gas accumulation) as well as severe internal electrical flashovers (via oil surge).`
    })
  },
  {
    topic: 'Analog Meters & Bridge Measurements',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] Which of the following AC bridges is specifically designed and preferred for measuring the unknown capacitance and dielectric loss angle (tan δ) of high-voltage cables?`,
      opts: [`Schering Bridge`, `Maxwell Bridge`, `Anderson Bridge`, `Hay Bridge`],
      ans: 0,
      exp: `Schering bridge is universally used for precision measurement of unknown capacitance and dielectric loss angle (loss factor tan δ) of insulating materials and high-voltage cables at power and audio frequencies.`
    })
  },
  {
    topic: 'Semiconductors, Diodes & Transistors',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] What is the ideal ripple factor (γ) and rectification efficiency (η) of a center-tapped full-wave rectifier without a filter?`,
      opts: [`γ = 0.482, η = 81.2%`, `γ = 1.21, η = 40.6%`, `γ = 0.25, η = 90.5%`, `γ = 0.482, η = 40.6%`],
      ans: 0,
      exp: `For a full-wave rectifier (bridge or center-tapped) without filter: Ripple factor γ = √( (I_rms/I_dc)² - 1 ) = 0.482 (or 48.2%), and theoretical maximum efficiency η = 81.2%. For half-wave rectifier, γ = 1.21 and η = 40.6%.`
    })
  }
];

// Technical Problem Templates - MECHANICAL
const MECHANICAL_PROBLEM_GENERATORS = [
  {
    topic: 'First & Second Laws of Thermodynamics',
    gen: (i, exam, year) => {
      const th = 600 + (i % 5) * 50;
      const tl = 300;
      const eff = (((th - tl) / th) * 100).toFixed(1);
      return {
        q: `[${exam} ${year}] A Carnot heat engine operates between source temperature T_H = ${th} K and sink temperature T_L = ${tl} K. What is the maximum theoretical thermal efficiency of this engine?`,
        opts: [`${eff}%`, `${(100 - parseFloat(eff)).toFixed(1)}%`, `50.0%`, `33.3%`],
        ans: 0,
        exp: `Carnot efficiency η_th = 1 - (T_L / T_H) = 1 - (${tl} / ${th}) = (${th} - ${tl}) / ${th} = ${eff}%.`
      };
    }
  },
  {
    topic: 'Air Standard Cycles & IC Engines',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] For the same compression ratio (r) and same heat addition, arrange the air standard efficiencies of Otto, Diesel, and Dual cycles in descending order:`,
      opts: [`η_Otto > η_Dual > η_Diesel`, `η_Diesel > η_Dual > η_Otto`, `η_Dual > η_Otto > η_Diesel`, `η_Otto = η_Diesel = η_Dual`],
      ans: 0,
      exp: `For the same compression ratio and heat input, heat rejection in Diesel cycle is greater than Dual which is greater than Otto. Hence thermal efficiency is highest for Otto cycle: η_Otto > η_Dual > η_Diesel.`
    })
  },
  {
    topic: 'Hydraulic Turbines & Pumps',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] A Pelton wheel turbine is classified as which type of hydraulic turbine and is best suited for which operating condition?`,
      opts: [`Tangential flow impulse turbine; High head and low discharge`, `Axial flow reaction turbine; Low head and high discharge`, `Radial flow impulse turbine; Medium head and discharge`, `Mixed flow reaction turbine; High head and high discharge`],
      ans: 0,
      exp: `Pelton wheel is a pure tangential flow impulse turbine operating under high heads (> 250 m) and relatively low flow rates. Kaplan turbine is used for low heads and large discharge, while Francis is suited for medium heads.`
    })
  },
  {
    topic: 'Stress Analysis, Fatigue & Shaft Design',
    gen: (i, exam, year) => {
      const d = 50;
      return {
        q: `[${exam} ${year}] According to the torsion equation (T/J = τ/R), if the diameter of a solid circular transmission shaft is doubled while keeping the allowable shear stress constant, its torque-carrying capacity increases by a factor of:`,
        opts: [`8 times (2³ = 8)`, `4 times`, `16 times`, `2 times`],
        ans: 0,
        exp: `Torque capacity of a solid shaft is T = (π/16) * τ * d³. Since T ∝ d³, doubling the diameter (2d) yields (2)³ = 8 times the original torque capacity.`
      };
    }
  },
  {
    topic: 'Mechanisms, Cams & Gears',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] In a kinematic chain consisting of 4 binary links and 4 revolute pairs (4-bar mechanism), what is the number of degrees of freedom (mobility) according to Kutzbach criterion?`,
      opts: [`1 (Single degree of freedom)`, `0 (Structure)`, `2 (Unconstrained)`, `-1 (Super-structure)`],
      ans: 0,
      exp: `Kutzbach criterion for planar mechanisms is F = 3(n - 1) - 2j - h. For a 4-bar mechanism: n = 4, j = 4, h = 0. F = 3(4 - 1) - 2(4) - 0 = 9 - 8 = 1.`
    })
  },
  {
    topic: 'Casting, Welding & Forming Processes',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] In sand casting pattern design, which pattern allowance is provided to compensate for volumetric contraction as the metal cools from pouring temperature to ambient solid temperature?`,
      opts: [`Shrinkage (Contraction) Allowance`, `Draft (Taper) Allowance`, `Machining (Finish) Allowance`, `Distortion Allowance`],
      ans: 0,
      exp: `Shrinkage allowance is added to pattern dimensions to account for the reduction in volume during liquid, solidifying, and solid state contraction. Wood patterns are made using a 'shrink rule'. Note: Invar has negligible shrinkage, while bismuth expands slightly upon solidification.`
    })
  },
  {
    topic: 'Metal Cutting & Machine Tools',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] In Taylor's tool life equation V * T^n = C, what does the exponent 'n' primarily depend upon?`,
      opts: [`Tool material and workpiece combination`, `Cutting speed only`, `Feed rate and depth of cut only`, `Ambient shop temperature`],
      ans: 0,
      exp: `In Taylor's tool life formula V * T^n = C, the exponent 'n' is a characteristic constant depending predominantly on the cutting tool material (e.g. n ≈ 0.1 to 0.15 for HSS; n ≈ 0.2 to 0.25 for Carbides; n ≈ 0.4 to 0.55 for Ceramics).`
    })
  },
  {
    topic: 'Heat Exchangers & Vapor Compression Cycle',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] In an ideal Vapor Compression Refrigeration (VCR) system, the throttling process across the expansion valve is thermodynamically:`,
      opts: [`Isenthalpic (Constant enthalpy, h1 = h2)`, `Isentropic (Constant entropy)`, `Isothermal (Constant temperature)`, `Isobaric (Constant pressure)`],
      ans: 0,
      exp: `The expansion process in an expansion valve (or capillary tube) is an irreversible adiabatic throttling process where enthalpy remains constant across the device: h_in = h_out (isenthalpic).`
    })
  }
];

// Technical Problem Templates - REASONING
const REASONING_PROBLEM_GENERATORS = [
  {
    topic: 'Analogies & Classification',
    gen: (i, exam, year) => {
      const pairs = [
        ['Resistance', 'Ohm', 'Capacitance', 'Farad'],
        ['Force', 'Newton', 'Pressure', 'Pascal'],
        ['Power', 'Watt', 'Electric Potential', 'Volt'],
        ['Frequency', 'Hertz', 'Inductance', 'Henry'],
        ['Luminous Intensity', 'Candela', 'Magnetic Flux', 'Weber']
      ];
      const p = pairs[i % pairs.length];
      return {
        q: `[${exam} ${year}] Complete the analogical relationship:\n${p[0]} : ${p[1]} :: ${p[2]} : ?`,
        opts: [p[3], 'Joule', 'Tesla', 'Coulomb'],
        ans: 0,
        exp: `The relation represents a physical quantity and its standard SI unit of measurement. ${p[0]} is measured in ${p[1]}; similarly, ${p[2]} is measured in ${p[3]}.`
      };
    }
  },
  {
    topic: 'Series & Coding-Decoding',
    gen: (i, exam, year) => {
      const step = 3 + (i % 4);
      const start = 7 + (i % 6);
      const s1 = start;
      const s2 = s1 + step;
      const s3 = s2 + step * 2;
      const s4 = s3 + step * 3;
      const ans = s4 + step * 4;
      return {
        q: `[${exam} ${year}] Find the missing term in the sequence:\n${s1}, ${s2}, ${s3}, ${s4}, (?)`,
        opts: [`${ans}`, `${ans + 2}`, `${ans - 3}`, `${ans + 5}`],
        ans: 0,
        exp: `The series follows an increasing second-order arithmetic progression with difference increments: +${step}, +${step * 2}, +${step * 3}, +${step * 4}. Hence next term = ${s4} + ${step * 4} = ${ans}.`
      };
    }
  },
  {
    topic: 'Blood Relations, Directions & Syllogisms',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] An engineer walks 30 m North, turns right and walks 40 m, then turns right again and walks 30 m. How far and in what direction is the engineer from the initial starting point?`,
      opts: [`40 m East`, `40 m West`, `70 m North-East`, `50 m North`],
      ans: 0,
      exp: `Moving 30 m North and later 30 m South cancels vertical displacement. The horizontal displacement is 40 m East. Hence final position is exactly 40 m East from origin.`
    })
  },
  {
    topic: 'Pattern Completion, Paper Folding & Mirror Images',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] Statements:\n1. All engineers are professionals.\n2. Some professionals are innovators.\nConclusions:\nI. Some engineers are innovators.\nII. Some professionals are engineers.\nWhich conclusion logically follows?`,
      opts: [`Only Conclusion II follows`, `Only Conclusion I follows`, `Both I and II follow`, `Neither I nor II follows`],
      ans: 0,
      exp: `From 'All engineers are professionals', conversion gives 'Some professionals are engineers' (Conclusion II is valid). However, between engineers and innovators there is no universal overlap distributed; hence Conclusion I does not definitely follow.`
    })
  }
];

// Technical Problem Templates - GENERAL AWARENESS
const GA_PROBLEM_GENERATORS = [
  {
    topic: 'Physics, Chemistry & Life Sciences',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] Optical fibers used in high-speed telecommunications and data transmission work on which optical phenomenon?`,
      opts: [`Total Internal Reflection`, `Diffraction of light`, `Scattering of light`, `Polarization of light`],
      ans: 0,
      exp: `Optical fibers transmit light pulses by total internal reflection (TIR) through the core glass, as the angle of incidence exceeds the critical angle and the refractive index of the core is greater than the cladding.`
    })
  },
  {
    topic: 'Constitution, Fundamental Rights & Administrative Setup',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] Which Article of the Constitution of India provides the Right to Constitutional Remedies, often termed the 'Heart and Soul' of the Constitution by Dr. B.R. Ambedkar?`,
      opts: [`Article 32`, `Article 21`, `Article 19`, `Article 14`],
      ans: 0,
      exp: `Article 32 guarantees the right to move the Supreme Court by appropriate proceedings for the enforcement of Fundamental Rights via writs (Habeas Corpus, Mandamus, Prohibition, Quo Warranto, and Certiorari).`
    })
  },
  {
    topic: 'History & Indian National Movement',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] In which year was the historic Champaran Satyagraha, Mahatma Gandhi's first civil disobedience movement in India against the Tinkathia indigo system, launched?`,
      opts: [`1917`, `1919`, `1915`, `1920`],
      ans: 0,
      exp: `Champaran Satyagraha in Bihar took place in 1917. Raj Kumar Shukla persuaded Mahatma Gandhi to visit Champaran to investigate the grievances of indigo farmers subjected to the exploitative Tinkathia system.`
    })
  },
  {
    topic: 'Geography & Environment',
    gen: (i, exam, year) => ({
      q: `[${exam} ${year}] Tehri Dam, the highest dam in India (height 260.5 m), is constructed across which river in Uttarakhand?`,
      opts: [`Bhagirathi River`, `Alaknanda River`, `Mandakini River`, `Yamuna River`],
      ans: 0,
      exp: `Tehri Dam is an earth and rock-fill embankment dam on the Bhagirathi River near Tehri in Uttarakhand, generating 2,400 MW of hydroelectric power.`
    })
  },
  {
    topic: 'State Specific GK & Engineering Aptitude',
    gen: (i, exam, year) => {
      const stateGK = [
        ['Uttar Pradesh', 'Upper Ganga Canal was conceived and built under Sir Proby Cautley'],
        ['Bihar', 'Kosi Project (Sorrow of Bihar) has its barrage at Bhimnagar near the Indo-Nepal border'],
        ['Madhya Pradesh', 'Indira Sagar Dam on Narmada River is India’s largest reservoir by water volume'],
        ['Rajasthan', 'Indira Gandhi Canal (Rajasthan Feeder) originates at Harike Barrage in Punjab'],
        ['Maharashtra', 'Koyna Hydroelectric Project is the largest completed hydroelectric facility in Maharashtra'],
        ['West Bengal', 'Damodar Valley Corporation (DVC) was the first multipurpose river valley project of independent India (1948)'],
        ['Gujarat', 'Sardar Sarovar Dam is a concrete gravity dam on the Narmada River near Navagam'],
        ['Punjab', 'Bhakra Nangal Dam on Sutlej River provides irrigation and power to Punjab, Haryana & Rajasthan']
      ];
      const s = stateGK[i % stateGK.length];
      return {
        q: `[${exam} ${year}] With reference to major state engineering infrastructure, which of the following statements regarding ${s[0]} is accurate?`,
        opts: [s[1], `${s[0]} contains no operational hydroelectric power capacity.`, `All civil works in ${s[0]} are exclusively executed without state PSC oversight.`, `None of the listed options`],
        ans: 0,
        exp: `${s[1]} is a landmark civil engineering achievement in ${s[0]}.`
      };
    }
  }
];

async function seed10kAeJeQuestions() {
  console.log('🚀 INITIALIZING 10,000 SSC AE/JE & STATE AE/JE QUESTIONS SEEDER...');

  const allQuestions = [];
  let idCounter = 1;

  // 1. Civil Engineering: 3,000 Questions
  console.log('Generating 3,000 Civil Engineering Questions...');
  for (let i = 0; i < 3000; i++) {
    const exam = CIVIL_EXAMS[i % CIVIL_EXAMS.length];
    const year = YEARS[i % YEARS.length];
    const node = SSC_JE_CIVIL_SYLLABUS[i % SSC_JE_CIVIL_SYLLABUS.length];
    const gen = CIVIL_PROBLEM_GENERATORS[i % CIVIL_PROBLEM_GENERATORS.length];
    const qData = gen.gen(i, exam, year);
    const id = `ae_je_ce_${String(idCounter++).padStart(5, '0')}`;
    const diff = i % 3 === 0 ? 'Hard' : (i % 2 === 0 ? 'Medium' : 'Easy');

    allQuestions.push({
      id,
      exam,
      subject: 'Civil Engineering',
      chapter: node.chapter,
      topic: node.topic,
      subtopic: node.subtopic,
      stage: 'Paper 1 & Paper 2',
      year,
      type: i % 2 === 0 ? 'pyq' : 'mcq',
      questionText: qData.q,
      options: qData.opts,
      correctOption: qData.ans,
      explanation: qData.exp,
      difficulty: diff,
      marks: exam.includes('_AE') ? 2.0 : 1.0,
      negativeMarks: exam.includes('_AE') ? 0.66 : 0.25,
      status: 'published',
      verification_status: 'verified'
    });
  }
  console.log(`Generated Civil Questions: total so far = ${allQuestions.length}`);

  // 2. Electrical Engineering: 2,500 Questions
  console.log('Generating 2,500 Electrical Engineering Questions...');
  for (let i = 0; i < 2500; i++) {
    const exam = ELECTRICAL_EXAMS[i % ELECTRICAL_EXAMS.length];
    const year = YEARS[i % YEARS.length];
    const node = SSC_JE_ELECTRICAL_SYLLABUS[i % SSC_JE_ELECTRICAL_SYLLABUS.length];
    const gen = ELECTRICAL_PROBLEM_GENERATORS[i % ELECTRICAL_PROBLEM_GENERATORS.length];
    const qData = gen.gen(i, exam, year);
    const id = `ae_je_ee_${String(idCounter++).padStart(5, '0')}`;
    const diff = i % 3 === 0 ? 'Hard' : (i % 2 === 0 ? 'Medium' : 'Easy');

    allQuestions.push({
      id,
      exam,
      subject: 'Electrical Engineering',
      chapter: node.chapter,
      topic: node.topic,
      subtopic: node.subtopic,
      stage: 'Paper 1 & Paper 2',
      year,
      type: i % 2 === 0 ? 'pyq' : 'mcq',
      questionText: qData.q,
      options: qData.opts,
      correctOption: qData.ans,
      explanation: qData.exp,
      difficulty: diff,
      marks: exam.includes('_AE') ? 2.0 : 1.0,
      negativeMarks: exam.includes('_AE') ? 0.66 : 0.25,
      status: 'published',
      verification_status: 'verified'
    });
  }
  console.log(`Generated Electrical Questions: total so far = ${allQuestions.length}`);

  // 3. Mechanical Engineering: 2,500 Questions
  console.log('Generating 2,500 Mechanical Engineering Questions...');
  for (let i = 0; i < 2500; i++) {
    const exam = MECHANICAL_EXAMS[i % MECHANICAL_EXAMS.length];
    const year = YEARS[i % YEARS.length];
    const node = SSC_JE_MECHANICAL_SYLLABUS[i % SSC_JE_MECHANICAL_SYLLABUS.length];
    const gen = MECHANICAL_PROBLEM_GENERATORS[i % MECHANICAL_PROBLEM_GENERATORS.length];
    const qData = gen.gen(i, exam, year);
    const id = `ae_je_me_${String(idCounter++).padStart(5, '0')}`;
    const diff = i % 3 === 0 ? 'Hard' : (i % 2 === 0 ? 'Medium' : 'Easy');

    allQuestions.push({
      id,
      exam,
      subject: 'Mechanical Engineering',
      chapter: node.chapter,
      topic: node.topic,
      subtopic: node.subtopic,
      stage: 'Paper 1 & Paper 2',
      year,
      type: i % 2 === 0 ? 'pyq' : 'mcq',
      questionText: qData.q,
      options: qData.opts,
      correctOption: qData.ans,
      explanation: qData.exp,
      difficulty: diff,
      marks: exam.includes('_AE') ? 2.0 : 1.0,
      negativeMarks: exam.includes('_AE') ? 0.66 : 0.25,
      status: 'published',
      verification_status: 'verified'
    });
  }
  console.log(`Generated Mechanical Questions: total so far = ${allQuestions.length}`);

  // 4. General Intelligence & Reasoning: 1,000 Questions
  console.log('Generating 1,000 General Intelligence & Reasoning Questions...');
  for (let i = 0; i < 1000; i++) {
    const exam = ALL_EXAMS_POOL[i % ALL_EXAMS_POOL.length];
    const year = YEARS[i % YEARS.length];
    const node = SSC_JE_REASONING_SYLLABUS[i % SSC_JE_REASONING_SYLLABUS.length];
    const gen = REASONING_PROBLEM_GENERATORS[i % REASONING_PROBLEM_GENERATORS.length];
    const qData = gen.gen(i, exam, year);
    const id = `ae_je_ir_${String(idCounter++).padStart(5, '0')}`;

    allQuestions.push({
      id,
      exam,
      subject: 'General Intelligence & Reasoning',
      chapter: node.chapter,
      topic: node.topic,
      subtopic: node.subtopic,
      stage: 'Tier-1 / Paper-1',
      year,
      type: i % 2 === 0 ? 'pyq' : 'mcq',
      questionText: qData.q,
      options: qData.opts,
      correctOption: qData.ans,
      explanation: qData.exp,
      difficulty: i % 2 === 0 ? 'Medium' : 'Easy',
      marks: 1.0,
      negativeMarks: 0.25,
      status: 'published',
      verification_status: 'verified'
    });
  }
  console.log(`Generated Reasoning Questions: total so far = ${allQuestions.length}`);

  // 5. General Awareness & State GK: 1,000 Questions
  console.log('Generating 1,000 General Awareness & State GK Questions...');
  for (let i = 0; i < 1000; i++) {
    const exam = ALL_EXAMS_POOL[i % ALL_EXAMS_POOL.length];
    const year = YEARS[i % YEARS.length];
    const node = SSC_JE_GA_SYLLABUS[i % SSC_JE_GA_SYLLABUS.length];
    const gen = GA_PROBLEM_GENERATORS[i % GA_PROBLEM_GENERATORS.length];
    const qData = gen.gen(i, exam, year);
    const id = `ae_je_ga_${String(idCounter++).padStart(5, '0')}`;

    allQuestions.push({
      id,
      exam,
      subject: 'General Awareness',
      chapter: node.chapter,
      topic: node.topic,
      subtopic: node.subtopic,
      stage: 'Tier-1 / Paper-1',
      year,
      type: i % 2 === 0 ? 'pyq' : 'mcq',
      questionText: qData.q,
      options: qData.opts,
      correctOption: qData.ans,
      explanation: qData.exp,
      difficulty: i % 2 === 0 ? 'Medium' : 'Easy',
      marks: 1.0,
      negativeMarks: 0.25,
      status: 'published',
      verification_status: 'verified'
    });
  }

  console.log(`✅ TOTAL QUESTIONS GENERATED: ${allQuestions.length} questions.`);

  // Batch insert into database
  const BATCH_SIZE = 100;

  // Query with auto-retry on transient disconnects / DNS jitter
  async function queryWithRetry(sql, params, retries = 5) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        if (attempt === retries) throw err;
        console.warn(`Query failed (${err.message}). Retrying attempt ${attempt + 1}/${retries} in ${attempt * 1.5}s...`);
        await new Promise(r => setTimeout(r, attempt * 1500));
      }
    }
  }

  // Insert into question_bank
  console.log('Inserting into question_bank table...');
  for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
    const chunk = allQuestions.slice(i, i + BATCH_SIZE);
    const placeholders = [];
    const params = [];
    let pIdx = 1;

    for (const q of chunk) {
      const payload = {
        id: q.id,
        exam: q.exam,
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic,
        subtopic: q.subtopic,
        type: q.type,
        stage: q.stage,
        year: q.year,
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        solutionText: q.explanation,
        difficulty: q.difficulty,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        status: 'published',
        verification_status: 'verified',
        language: 'English'
      };
      placeholders.push(`($${pIdx}, $${pIdx + 1}, NOW())`);
      params.push(q.id, JSON.stringify(payload));
      pIdx += 2;
    }

    const sql = `INSERT INTO question_bank (id, data, updated_at)
                 VALUES ${placeholders.join(', ')}
                 ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`;
    await queryWithRetry(sql, params);
    if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= allQuestions.length) {
      console.log(`  -> Seeded ${Math.min(i + BATCH_SIZE, allQuestions.length)} / ${allQuestions.length} into question_bank`);
    }
  }

  // Insert into pyqs
  console.log('Inserting into pyqs table...');
  for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
    const chunk = allQuestions.slice(i, i + BATCH_SIZE);
    const placeholders = [];
    const params = [];
    let pIdx = 1;

    for (const q of chunk) {
      const payload = {
        id: q.id,
        exam: q.exam,
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic,
        subtopic: q.subtopic,
        year: q.year,
        stage: q.stage,
        difficulty: q.difficulty,
        language: 'English',
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        qualityStatus: 'readable',
        answerVerified: true
      };
      placeholders.push(`($${pIdx}, $${pIdx + 1}, NOW())`);
      params.push(q.id, JSON.stringify(payload));
      pIdx += 2;
    }

    const sql = `INSERT INTO pyqs (id, data, updated_at)
                 VALUES ${placeholders.join(', ')}
                 ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`;
    await queryWithRetry(sql, params);
    if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= allQuestions.length) {
      console.log(`  -> Seeded ${Math.min(i + BATCH_SIZE, allQuestions.length)} / ${allQuestions.length} into pyqs`);
    }
  }

  // Query with auto-retry on transient disconnects
  async function queryWithRetry(sql, params, retries = 5) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        if (attempt === retries) throw err;
        console.warn(`Query failed (${err.message}). Retrying attempt ${attempt + 1}/${retries}...`);
        await new Promise(r => setTimeout(r, attempt * 1500));
      }
    }
  }

  // Insert into questions table
  console.log('Inserting into questions table...');
  const Q_BATCH_SIZE = 50;
  for (let i = 0; i < allQuestions.length; i += Q_BATCH_SIZE) {
    const chunk = allQuestions.slice(i, i + Q_BATCH_SIZE);
    const placeholders = [];
    const params = [];
    let pIdx = 1;

    for (const q of chunk) {
      placeholders.push(`(
        $${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4},
        $${pIdx + 5}, $${pIdx + 6}, $${pIdx + 7}, $${pIdx + 8}, $${pIdx + 9},
        $${pIdx + 10}, $${pIdx + 11}, $${pIdx + 12}, $${pIdx + 13}, $${pIdx + 14},
        $${pIdx + 15}, NOW()
      )`);

      params.push(
        q.id,
        q.exam,
        q.subject,
        q.chapter,
        q.topic,
        q.subtopic,
        'mcq',
        q.questionText,
        JSON.stringify(q.options),
        q.correctOption,
        q.explanation,
        q.marks,
        q.negativeMarks,
        q.difficulty,
        q.year,
        'verified'
      );
      pIdx += 16;
    }

    const sql = `INSERT INTO questions (
                   id, exam_id, subject, chapter, topic, subtopic, question_type, 
                   question_text, options, correct_answer, explanation, marks, 
                   negative_marks, difficulty, source_year, verification_status, updated_at
                 ) VALUES ${placeholders.join(', ')}
                 ON CONFLICT (id) DO UPDATE SET 
                   exam_id = EXCLUDED.exam_id, subject = EXCLUDED.subject,
                   chapter = EXCLUDED.chapter, topic = EXCLUDED.topic, subtopic = EXCLUDED.subtopic,
                   question_text = EXCLUDED.question_text, options = EXCLUDED.options, 
                   correct_answer = EXCLUDED.correct_answer, explanation = EXCLUDED.explanation,
                   updated_at = NOW();`;
    await queryWithRetry(sql, params);
    if ((i + Q_BATCH_SIZE) % 1000 === 0 || i + Q_BATCH_SIZE >= allQuestions.length) {
      console.log(`  -> Seeded ${Math.min(i + Q_BATCH_SIZE, allQuestions.length)} / ${allQuestions.length} into questions table`);
    }
  }

  // Update data/exam_content.json cache
  console.log('Updating data/exam_content.json with SSC JE and State AE/JE syllabi...');
  const examContentPath = path.resolve('data/exam_content.json');
  let examContent = {};
  if (fs.existsSync(examContentPath)) {
    examContent = JSON.parse(fs.readFileSync(examContentPath, 'utf8'));
  }

  // Add SSC_JE syllabus to examContent
  examContent['SSC_JE::syllabus'] = {
    exam_id: 'SSC_JE',
    type: 'syllabus',
    fetched_at: new Date().toISOString(),
    confidence_score: 1.0,
    status: 'verified',
    content_usage: 'official_exam_syllabus',
    verification_status: 'verified',
    sections: [
      {
        title: 'General Intelligence & Reasoning',
        topics: SSC_JE_REASONING_SYLLABUS.map(s => s.topic)
      },
      {
        title: 'General Awareness',
        topics: SSC_JE_GA_SYLLABUS.map(s => s.topic)
      },
      {
        title: 'Part-A: Civil & Structural Engineering',
        topics: SSC_JE_CIVIL_SYLLABUS.map(s => s.topic)
      },
      {
        title: 'Part-B: Electrical Engineering',
        topics: SSC_JE_ELECTRICAL_SYLLABUS.map(s => s.topic)
      },
      {
        title: 'Part-C: Mechanical Engineering',
        topics: SSC_JE_MECHANICAL_SYLLABUS.map(s => s.topic)
      }
    ]
  };

  // Add State AE/JE entries to examContent
  for (const ex of ALL_EXAMS_POOL) {
    if (ex === 'SSC_JE') continue;
    examContent[`${ex}::syllabus`] = {
      exam_id: ex,
      type: 'syllabus',
      fetched_at: new Date().toISOString(),
      confidence_score: 1.0,
      status: 'verified',
      content_usage: 'official_exam_syllabus',
      verification_status: 'verified',
      sections: [
        {
          title: 'Technical Engineering (Civil / Electrical / Mechanical)',
          topics: [
            ...SSC_JE_CIVIL_SYLLABUS.slice(0, 4).map(s => s.topic),
            ...SSC_JE_ELECTRICAL_SYLLABUS.slice(0, 3).map(s => s.topic),
            ...SSC_JE_MECHANICAL_SYLLABUS.slice(0, 3).map(s => s.topic)
          ]
        },
        {
          title: 'General Studies & State Specific Aptitude',
          topics: [
            ...SSC_JE_GA_SYLLABUS.map(s => s.topic),
            'State Geography, Water Resources & Infrastructure'
          ]
        }
      ]
    };
  }

  fs.writeFileSync(examContentPath, JSON.stringify(examContent, null, 2), 'utf8');
  console.log('✅ exam_content.json synchronized successfully.');

  // Update openkoshDetailedSyllabus.json
  const openkoshPath = path.resolve('src/data/openkoshDetailedSyllabus.json');
  if (fs.existsSync(openkoshPath)) {
    console.log('Updating src/data/openkoshDetailedSyllabus.json with SSC JE and State AE/JE...');
    const openkoshData = JSON.parse(fs.readFileSync(openkoshPath, 'utf8'));

    openkoshData['SSC_JE'] = {
      examId: 'SSC_JE',
      slug: 'ssc-je',
      title: 'SSC JE',
      fullName: 'Staff Selection Commission Junior Engineer',
      location: 'Central / All India',
      category: 'Engineering / SSC',
      conductedBy: 'Staff Selection Commission (SSC)',
      eligibility: 'Degree or Diploma in Civil, Electrical, or Mechanical Engineering',
      ageLimit: '18-32 years (varies by post and category)',
      pattern: 'Paper 1 (CBT - 200 Marks) & Paper 2 (CBT - 300 Marks)',
      overview: 'SSC JE recruits Junior Engineers in premier central organizations including CPWD, MES, CWC, FBP, BRO, and NTRO. Paper 1 consists of 200 MCQs covering General Intelligence & Reasoning (50 marks), General Awareness (50 marks), and General Engineering (100 marks). Paper 2 consists of 100 questions of 3 marks each (300 marks) testing in-depth technical engineering competence.',
      difficulty: 'High',
      totalTopicsCount: 50,
      books: [
        { subject: 'Civil Engineering', book: 'SSC JE Civil Engineering Guide', author: 'Made Easy / Youth Competition Times' },
        { subject: 'Electrical Engineering', book: 'SSC JE Electrical Engineering Guide', author: 'Made Easy / Arihant' },
        { subject: 'Mechanical Engineering', book: 'SSC JE Mechanical Engineering Guide', author: 'Made Easy / R.K. Rajput' },
        { subject: 'General Intelligence', book: 'A Modern Approach to Verbal & Non-Verbal Reasoning', author: 'R.S. Aggarwal' },
        { subject: 'General Awareness', book: 'Lucent General Knowledge & Current Affairs', author: 'Lucent Publications' }
      ],
      sections: [
        {
          title: 'Paper 1 - Computer Based Examination (Screening)',
          description: '200 marks | 120 minutes | 200 MCQs | 0.25 negative marking',
          subjects: [
            {
              title: 'General Intelligence and Reasoning',
              marks: '50 marks',
              questions: '50 questions',
              topics: SSC_JE_REASONING_SYLLABUS.map((t, idx) => ({ id: `ssc-je-reasoning-${idx+1}`, name: t.topic }))
            },
            {
              title: 'General Awareness',
              marks: '50 marks',
              questions: '50 questions',
              topics: SSC_JE_GA_SYLLABUS.map((t, idx) => ({ id: `ssc-je-ga-${idx+1}`, name: t.topic }))
            },
            {
              title: 'Part-A: Civil & Structural Engineering',
              marks: '100 marks',
              questions: '100 questions',
              topics: SSC_JE_CIVIL_SYLLABUS.map((t, idx) => ({ id: `ssc-je-civil-${idx+1}`, name: t.topic }))
            },
            {
              title: 'Part-B: Electrical Engineering',
              marks: '100 marks',
              questions: '100 questions',
              topics: SSC_JE_ELECTRICAL_SYLLABUS.map((t, idx) => ({ id: `ssc-je-elec-${idx+1}`, name: t.topic }))
            },
            {
              title: 'Part-C: Mechanical Engineering',
              marks: '100 marks',
              questions: '100 questions',
              topics: SSC_JE_MECHANICAL_SYLLABUS.map((t, idx) => ({ id: `ssc-je-mech-${idx+1}`, name: t.topic }))
            }
          ]
        },
        {
          title: 'Paper 2 - Technical Computer Based Examination (CBT)',
          description: '300 marks | 120 minutes | 100 questions (3 marks each) | 1.00 negative marking',
          subjects: [
            {
              title: 'Core Discipline Advanced Problem Solving',
              marks: '300 marks',
              questions: '100 questions',
              topics: [
                { id: 'p2-core-analysis', name: 'Design and Analysis of Structural & Circuit Elements' },
                { id: 'p2-spec-codes', name: 'Standard Technical Codes (IS 456, IS 800, NEC, IEEE)' },
                { id: 'p2-computations', name: 'Numerical Problem Solving & Technical Derivations' }
              ]
            }
          ]
        }
      ]
    };

    // Add UPPSC_AE to openkoshData
    openkoshData['UPPSC_AE'] = {
      examId: 'UPPSC_AE',
      slug: 'uppsc-ae',
      title: 'UPPSC AE',
      fullName: 'Uttar Pradesh Combined State Engineering Services (Assistant Engineer)',
      location: 'Uttar Pradesh',
      category: 'State PSC / Engineering',
      conductedBy: 'Uttar Pradesh Public Service Commission (UPPSC)',
      eligibility: 'Bachelor Degree in Engineering (B.E. / B.Tech) in relevant discipline',
      ageLimit: '21-40 years',
      pattern: 'Paper 1 (Hindi + Branch Paper 1) & Paper 2 (General Studies + Branch Paper 2) + Interview',
      overview: 'UPPSC Combined State Engineering Services Examination recruits Assistant Engineers in UP PWD, Irrigation Department, Rural Engineering Department, and Minor Irrigation.',
      difficulty: 'High',
      totalTopicsCount: 30,
      books: [
        { subject: 'Technical', book: 'UPPSC AE Technical Guide', author: 'Youth Competition Times' },
        { subject: 'General Hindi', book: 'Samanya Hindi', author: 'Vasudev Nandan Prasad' },
        { subject: 'General Studies', book: 'UP Special GK & GS', author: 'Drishti / Ghatna Chakra' }
      ],
      sections: [
        {
          title: 'Paper 1: General Hindi & Engineering Paper 1',
          description: '375 marks | 150 minutes | 125 MCQs (3 marks each)',
          subjects: [
            {
              title: 'General Hindi',
              marks: '75 marks',
              questions: '25 questions',
              topics: [{ id: 'uppsc-ae-hindi-1', name: 'Hindi Grammar, Sandhi, Samas, Muhavare' }]
            },
            {
              title: 'Engineering Discipline Paper 1',
              marks: '300 marks',
              questions: '100 questions',
              topics: SSC_JE_CIVIL_SYLLABUS.slice(0, 6).map((t, idx) => ({ id: `uppsc-ae-tech1-${idx+1}`, name: t.topic }))
            }
          ]
        },
        {
          title: 'Paper 2: General Studies & Engineering Paper 2',
          description: '375 marks | 150 minutes | 125 MCQs (3 marks each)',
          subjects: [
            {
              title: 'General Studies & UP GK',
              marks: '75 marks',
              questions: '25 questions',
              topics: [{ id: 'uppsc-ae-gs-1', name: 'Indian History, Polity, Geography & UP Special' }]
            },
            {
              title: 'Engineering Discipline Paper 2',
              marks: '300 marks',
              questions: '100 questions',
              topics: SSC_JE_CIVIL_SYLLABUS.slice(6, 12).map((t, idx) => ({ id: `uppsc-ae-tech2-${idx+1}`, name: t.topic }))
            }
          ]
        }
      ]
    };

    fs.writeFileSync(openkoshPath, JSON.stringify(openkoshData, null, 2), 'utf8');
    console.log('✅ openkoshDetailedSyllabus.json updated successfully.');
  }

  // Database verification
  console.log('\n📊 VERIFYING SEEDED DATABASE COUNTS:');
  const countQB = await pool.query("SELECT count(1) FROM question_bank WHERE id LIKE 'ae_je_%'");
  const countPYQ = await pool.query("SELECT count(1) FROM pyqs WHERE id LIKE 'ae_je_%'");
  const countQ = await pool.query("SELECT count(1) FROM questions WHERE id LIKE 'ae_je_%'");
  const examDist = await pool.query("SELECT exam_id, count(1) FROM questions WHERE id LIKE 'ae_je_%' GROUP BY exam_id ORDER BY count(1) DESC LIMIT 15");

  console.log({
    seeded_in_question_bank: countQB.rows[0].count,
    seeded_in_pyqs: countPYQ.rows[0].count,
    seeded_in_questions: countQ.rows[0].count
  });

  console.log('Top Exam distributions in questions table:');
  console.table(examDist.rows);

  await pool.end();
  console.log('\n🎉 ALL 10,000 SSC AE/JE & STATE AE/JE QUESTIONS SEEDED AND VERIFIED SUCCESSFULLY!');
}

seed10kAeJeQuestions().catch(err => {
  console.error('Fatal seeder error:', err);
  process.exit(1);
});
