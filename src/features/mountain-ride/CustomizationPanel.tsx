import React, { useState } from 'react';
import { 
  X, Check, Compass, Sparkles, Sliders, Shield, Palette, 
  User, Mountain, Cloud, Sun, CloudRain, Snowflake, Wind, Flame
} from 'lucide-react';
import { 
  BikeId, RiderId, EnvironmentId, WeatherType, BikeColors,
  BIKE_PRESETS, RIDER_PRESETS, COLOR_SWATCHES 
} from './types';
import { ENVIRONMENTS } from './environments';

export interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBikeId: BikeId;
  onSelectBike: (id: BikeId) => void;
  bikeColors: BikeColors;
  onUpdateBikeColors: (colors: Partial<BikeColors>) => void;
  selectedRiderId: RiderId;
  onSelectRider: (id: RiderId) => void;
  selectedEnvironmentId: EnvironmentId;
  onSelectEnvironment: (id: EnvironmentId) => void;
  selectedWeather: WeatherType;
  onSelectWeather: (weather: WeatherType) => void;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  isOpen,
  onClose,
  selectedBikeId,
  onSelectBike,
  bikeColors,
  onUpdateBikeColors,
  selectedRiderId,
  onSelectRider,
  selectedEnvironmentId,
  onSelectEnvironment,
  selectedWeather,
  onSelectWeather
}) => {
  const [activeTab, setActiveTab] = useState<'bike' | 'rider' | 'environment'>('bike');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in select-none">
      {/* Modal Dialog Card */}
      <div className="relative w-full sm:max-w-xl md:max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden backdrop-blur-2xl">
        
        {/* Header with Title & Tab Navigation */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                Mountain Ride Customizer
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                Live updates • Journey continues seamlessly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons (BIKE / RIDER / ENVIRONMENT) */}
        <div className="grid grid-cols-3 p-1.5 mx-4 mt-3 rounded-2xl bg-slate-950 border border-slate-800">
          {[
            { id: 'bike' as const, label: 'Motorcycle', icon: Compass },
            { id: 'rider' as const, label: 'Rider Gear', icon: User },
            { id: 'environment' as const, label: 'Scenery', icon: Mountain },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-2 px-3 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === id
                  ? 'bg-sky-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">

          {/* ─────────────────────────────────────────────────────────────
              TAB 1: MOTORCYCLE & COLORS
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'bike' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
                  Select Motorcycle Class
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(BIKE_PRESETS).map((bike) => {
                    const isSelected = selectedBikeId === bike.id;
                    return (
                      <button
                        key={bike.id}
                        onClick={() => onSelectBike(bike.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-400 shadow-md ring-1 ring-sky-400'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{bike.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-sky-400 border border-slate-700 uppercase">
                            {bike.tagline}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                          {bike.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Color Swatches */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
                  Primary Paint Finish
                </span>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.value}
                      onClick={() => onUpdateBikeColors({ primary: swatch.value })}
                      title={swatch.name}
                      className={`w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-sm ${
                        bikeColors.primary === swatch.value
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-slate-700/80 hover:border-slate-500'
                      }`}
                      style={{ backgroundColor: swatch.value }}
                    >
                      {bikeColors.primary === swatch.value && (
                        <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Luggage Finish */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Luggage & Cases
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'Brushed Aluminum', color: '#94a3b8' },
                    { name: 'Matte Stealth', color: '#1e293b' },
                    { name: 'Desert Khaki', color: '#78350f' }
                  ].map((lug) => (
                    <button
                      key={lug.color}
                      onClick={() => onUpdateBikeColors({ luggage: lug.color })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        bikeColors.luggage === lug.color
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {lug.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: RIDER APPAREL & GEAR
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'rider' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Rider Outfit & Gear
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {Object.values(RIDER_PRESETS).map((rider) => {
                  const isSelected = selectedRiderId === rider.id;
                  return (
                    <button
                      key={rider.id}
                      onClick={() => onSelectRider(rider.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-400 shadow-md ring-1 ring-sky-400'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{rider.name}</span>
                          <span className="text-[10px] font-bold text-sky-400 uppercase">
                            • {rider.gearTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {rider.description}
                        </p>
                      </div>

                      {/* Swatch chips previewing outfit colors */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span 
                          className="w-4 h-4 rounded-full border border-slate-700 shadow-sm" 
                          style={{ backgroundColor: rider.helmetColor }}
                          title="Helmet"
                        />
                        <span 
                          className="w-4 h-4 rounded-full border border-slate-700 shadow-sm" 
                          style={{ backgroundColor: rider.jacketColor }}
                          title="Jacket"
                        />
                        <span 
                          className="w-4 h-4 rounded-full border border-slate-700 shadow-sm" 
                          style={{ backgroundColor: rider.bootsColor }}
                          title="Boots"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 3: ENVIRONMENT SCENERY & WEATHER
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'environment' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
                  Select Scenic Environment (10 Locations)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(ENVIRONMENTS).map((env) => {
                    const isSelected = selectedEnvironmentId === env.id;
                    return (
                      <button
                        key={env.id}
                        onClick={() => onSelectEnvironment(env.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 relative overflow-hidden ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400 shadow-md ring-1 ring-sky-400'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{env.name}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {env.subtitle}
                        </span>

                        {/* Visual Color Palette Strip */}
                        <div className="h-1.5 w-full rounded-full overflow-hidden flex mt-1">
                          <span className="flex-1" style={{ backgroundColor: env.skyColors[0] }} />
                          <span className="flex-1" style={{ backgroundColor: env.mountainColors.body }} />
                          <span className="flex-1" style={{ backgroundColor: env.meadowGradient[0] }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weather / Atmosphere Selector */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
                  Weather & Atmosphere
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'clear' as const, label: 'Clear', icon: Sun },
                    { id: 'cloudy' as const, label: 'Cloudy', icon: Cloud },
                    { id: 'mist' as const, label: 'Misty', icon: Wind },
                    { id: 'light_snow' as const, label: 'Snow', icon: Snowflake },
                    { id: 'light_rain' as const, label: 'Rain', icon: CloudRain },
                    { id: 'sunset' as const, label: 'Sunset', icon: Flame },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => onSelectWeather(id)}
                      className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        selectedWeather === id
                          ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer with Done button */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Selections saved automatically
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg active:scale-95"
          >
            DONE
          </button>
        </div>

      </div>
    </div>
  );
};
