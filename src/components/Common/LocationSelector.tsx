'use client';

import { useState } from 'react';

interface LocationSelectorProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  showExactLocation?: boolean;
}

// Mauritanian cities and common international destinations
const MAURITANIAN_CITIES = [
  { name: 'Nouakchott', lat: 18.0735, lng: -15.9582 },
  { name: 'Nouadhibou', lat: 20.9316, lng: -17.0347 },
  { name: 'Rosso', lat: 16.5144, lng: -15.8081 },
  { name: 'Kaédi', lat: 16.1500, lng: -13.5000 },
  { name: 'Zouérat', lat: 22.7500, lng: -12.4667 },
  { name: 'Atar', lat: 20.5167, lng: -13.0500 },
  { name: 'Kiffa', lat: 16.6167, lng: -11.4000 },
  { name: 'Aleg', lat: 17.0500, lng: -13.9167 },
  { name: 'Boutilimit', lat: 17.5500, lng: -14.7000 },
  { name: 'Tidjikja', lat: 18.5667, lng: -11.4333 },
  { name: 'Néma', lat: 16.6167, lng: -7.2500 },
  { name: 'Aioun el Atrouss', lat: 16.6667, lng: -9.6167 },
  { name: 'Sélibaby', lat: 15.1667, lng: -12.1833 },
  { name: 'Akjoujt', lat: 19.7500, lng: -14.3833 },
  { name: 'Bogué', lat: 16.6500, lng: -14.3000 }
];

const INTERNATIONAL_DESTINATIONS = [
  { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  { name: 'Dakar, Senegal', lat: 14.6928, lng: -17.4467 },
  { name: 'Casablanca, Morocco', lat: 33.5731, lng: -7.5898 },
  { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  { name: 'Madrid, Spain', lat: 40.4168, lng: -3.7038 },
  { name: 'Brussels, Belgium', lat: 50.8503, lng: 4.3517 },
  { name: 'Istanbul, Turkey', lat: 41.0082, lng: 28.9784 },
  { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Tunis, Tunisia', lat: 36.8065, lng: 10.1815 },
  { name: 'Algiers, Algeria', lat: 36.7538, lng: 3.0588 },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { name: 'New York, USA', lat: 40.7128, lng: -74.0060 },
  { name: 'Bamako, Mali', lat: 12.6392, lng: -8.0029 },
  { name: 'Abidjan, Ivory Coast', lat: 5.3600, lng: -4.0083 },
  { name: 'Las Palmas, Spain', lat: 28.1248, lng: -15.4300 }
];

export default function LocationSelector({ 
  value, 
  onChange, 
  placeholder = "Choisir une destination...",
  label = "Destination",
  required = false
}: LocationSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedType, setSelectedType] = useState<'mauritanian' | 'international'>('mauritanian');

  const handleLocationSelect = (location: { name: string; lat: number; lng: number }) => {
    onChange(location.name, { lat: location.lat, lng: location.lng });
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange('', undefined);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        🗺️ {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <div 
          onClick={() => setShowDropdown(!showDropdown)}
          className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 cursor-pointer flex items-center justify-between ${
            value ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          <span>{value || placeholder}</span>
          <span className={`transform transition-transform ${showDropdown ? 'rotate-180' : ''}`}>▼</span>
        </div>
        
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Tab selector */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedType('mauritanian')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                selectedType === 'mauritanian' 
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              🇲🇷 Villes Mauritaniennes
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('international')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                selectedType === 'international' 
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              🌍 International
            </button>
          </div>
          
          {/* Location list */}
          <div className="max-h-60 overflow-y-auto">
            {(selectedType === 'mauritanian' ? MAURITANIAN_CITIES : INTERNATIONAL_DESTINATIONS).map((location, index) => (
              <div
                key={index}
                onClick={() => handleLocationSelect(location)}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {selectedType === 'mauritanian' ? '🏙️' : '✈️'}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900">{location.name}</div>
                    {selectedType === 'mauritanian' && (
                      <div className="text-xs text-slate-500">Mauritanie</div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  📍 {location.lat.toFixed(2)}, {location.lng.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected location display */}
      {value && (
        <div className="mt-2 flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-700">📍</span>
            <span className="text-green-800 font-semibold">{value}</span>
          </div>
          <div className="text-xs text-green-600">
            Coordonnées enregistrées ✓
          </div>
        </div>
      )}
    </div>
  );
}