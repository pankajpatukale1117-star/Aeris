"use client"

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface ClickedLocationInfo {
  lat: number;
  lng: number;
  name: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  temperature?: number;
  windSpeed?: number;
  elevation?: number;
  summary: string;
  thumbnail?: string;
}

export interface InteractiveGlobeProps {
  onSelectDestination?: (placeName: string, coords: { lat: number; lng: number }) => void;
  onSelectLocation?: (location: { name: string; lat: number; lng: number }) => void;
}

const PRESET_HUBS = [
  { name: 'Kolhapur', region: 'Maharashtra, India', lat: 16.7050, lng: 74.2433, tag: 'Heritage & Cuisine' },
  { name: 'Kyoto', region: 'Kansai, Japan', lat: 35.0116, lng: 135.7681, tag: 'Culture & Zen' },
  { name: 'Amalfi Coast', region: 'Campania, Italy', lat: 40.6340, lng: 14.6027, tag: 'Coastal Sanctuary' },
  { name: 'Paris', region: 'Île-de-France, France', lat: 48.8566, lng: 2.3522, tag: 'Art & Gastronomy' },
  { name: 'Bali', region: 'Indonesia', lat: -8.4095, lng: 115.1889, tag: 'Island Sanctuary' },
  { name: 'Maasai Mara', region: 'Rift Valley, Kenya', lat: -1.4061, lng: 35.0168, tag: 'Wildlife Safari' },
  { name: 'Zermatt', region: 'Valais, Switzerland', lat: 46.0207, lng: 7.7491, tag: 'Alpine Peaks' },
];

export function InteractiveGlobe({ onSelectDestination, onSelectLocation }: InteractiveGlobeProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activeMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [mapMode, setMapMode] = useState<'satellite' | 'dark'>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<ClickedLocationInfo | null>({
    lat: 16.7050,
    lng: 74.2433,
    name: 'Kolhapur',
    city: 'Kolhapur',
    state: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    temperature: 27,
    windSpeed: 11,
    elevation: 569,
    summary: 'Historic royal city in the Western Ghats famed for the ancient Mahalakshmi Temple, Panhala Fort mist, Rankala Lake sunsets, and fiery Kolhapuri culinary heritage.',
  });
  const [savedPins, setSavedPins] = useState<ClickedLocationInfo[]>(() => {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem('roveo_user_globe_pins');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Build hybrid 3D Satellite + Street/Place Labels style or Obsidian Dark Vector style
  const getMapStyle = (mode: 'satellite' | 'dark'): any => {
    if (mode === 'dark') {
      return 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
    }
    return {
      version: 8,
      projection: { type: 'globe' },
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Esri, Maxar, Earthstar Geographics'
        },
        'carto-labels': {
          type: 'raster',
          tiles: [
            'https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png'
          ],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'satellite-base',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 19
        },
        {
          id: 'place-labels',
          type: 'raster',
          source: 'carto-labels',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    };
  };

  // Fetch real-world info for ANY clicked [lat, lng] on Earth
  const inspectCoordinates = async (lat: number, lng: number, overrideName?: string) => {
    setIsFetchingInfo(true);

    // Move or create glowing gold pin at clicked coordinates
    if (mapRef.current) {
      if (activeMarkerRef.current) {
        activeMarkerRef.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 22px; height: 22px; border-radius: 9999px;
          background: #e8d5b5; border: 3px solid #050a10;
          box-shadow: 0 0 0 6px rgba(232,213,181,0.35), 0 0 24px #38bdf8;
          cursor: pointer;
        `;
        activeMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
      }

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: Math.max(mapRef.current.getZoom(), 6.5),
        pitch: 45,
        speed: 1.35,
        curve: 1.4,
        essential: true
      });
    }

    try {
      const [geoRes, weatherRes] = await Promise.allSettled([
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`).then(r => r.json()),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`).then(r => r.json())
      ]);

      const geo = geoRes.status === 'fulfilled' ? geoRes.value : {};
      const weather = weatherRes.status === 'fulfilled' ? weatherRes.value : {};

      const city = overrideName || geo.locality || geo.city || geo.principalSubdivision || 'Ocean / Wilderness Coordinates';
      const state = geo.principalSubdivision || '';
      const country = geo.countryName || 'International Waters';
      const countryCode = geo.countryCode || 'EARTH';

      // Fetch instant Wikipedia summary + thumbnail if available
      let wikiSummary = `${city}${state ? `, ${state}` : ''}${country ? ` (${country})` : ''} — Click "Plan Trip Here with AI" below to synthesize a bespoke morning-to-twilight itinerary for this exact location.`;
      let wikiThumb: string | undefined = undefined;

      if (city && city !== 'Ocean / Wilderness Coordinates') {
        try {
          const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`);
          if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            if (wikiData.extract) wikiSummary = wikiData.extract;
            if (wikiData.thumbnail?.source) wikiThumb = wikiData.thumbnail.source;
          }
        } catch {}
      }

      setSelectedSpot({
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        name: city,
        city,
        state,
        country,
        countryCode,
        temperature: weather?.current_weather?.temperature,
        windSpeed: weather?.current_weather?.windspeed,
        elevation: weather?.elevation,
        summary: wikiSummary,
        thumbnail: wikiThumb
      });
    } catch {
      setSelectedSpot({
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        name: overrideName || `Coordinates ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
        city: overrideName || 'Selected Coordinates',
        state: '',
        country: 'Earth',
        countryCode: 'GLB',
        summary: 'Ready for bespoke AI itinerary synthesis at these exact coordinates.'
      });
    } finally {
      setIsFetchingInfo(false);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(mapMode),
      center: [74.2433, 16.7050],
      zoom: 1.8,
      pitch: 35,
      bearing: -8,
      maxPitch: 80,
      renderWorldCopies: false,
      canvasContextAttributes: { antialias: true, powerPreference: 'high-performance' }
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-left');
    try {
      map.addControl(new maplibregl.GlobeControl(), 'bottom-left');
    } catch {}

    const enableGlobeProjection = () => {
      try {
        if (typeof (map as any).setProjection === 'function') {
          (map as any).setProjection({ type: 'globe' });
        }
      } catch {}
    };

    // Auto-rotation engine matching Google Earth & Apple Maps
    let isUserInteracting = false;
    let spinTimer: any = null;

    const spin = () => {
      if (!isUserInteracting && mapRef.current) {
        const zoom = mapRef.current.getZoom();
        if (zoom < 4.5) {
          const center = mapRef.current.getCenter();
          center.lng -= 0.15;
          mapRef.current.easeTo({ center, duration: 1000, easing: (n) => n });
        }
      }
    };

    spinTimer = setInterval(spin, 1000);

    const pauseInteraction = () => {
      isUserInteracting = true;
    };
    const resumeInteraction = () => {
      setTimeout(() => {
        isUserInteracting = false;
      }, 4000);
    };

    map.on('mousedown', pauseInteraction);
    map.on('touchstart', pauseInteraction);
    map.on('wheel', pauseInteraction);
    map.on('mouseup', resumeInteraction);
    map.on('touchend', resumeInteraction);
    map.on('dragend', resumeInteraction);

    map.on('style.load', enableGlobeProjection);
    map.on('load', () => {
      enableGlobeProjection();
      // Add preset luxury sanctuary markers
      PRESET_HUBS.forEach((hub) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.title = `${hub.name} — ${hub.region}`;
        dot.style.cssText = `
          width: 14px; height: 14px; border-radius: 9999px;
          background: #38bdf8; border: 2px solid #ffffff;
          box-shadow: 0 0 12px rgba(56,189,248,0.9); cursor: pointer;
        `;
        dot.addEventListener('click', (ev) => {
          ev.stopPropagation();
          inspectCoordinates(hub.lat, hub.lng, hub.name);
        });
        new maplibregl.Marker({ element: dot })
          .setLngLat([hub.lng, hub.lat])
          .addTo(map);
      });
    });

    // Click ANYWHERE on Earth handler
    map.on('click', (e) => {
      inspectCoordinates(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      if (spinTimer) clearInterval(spinTimer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch between 3D Satellite Earth and Dark Vector Atlas
  const toggleMapStyle = (mode: 'satellite' | 'dark') => {
    setMapMode(mode);
    if (mapRef.current) {
      mapRef.current.setStyle(getMapStyle(mode));
      mapRef.current.once('style.load', () => {
        try {
          if (typeof (mapRef.current as any).setProjection === 'function') {
            (mapRef.current as any).setProjection({ type: 'globe' });
          }
        } catch {}
      });
    }
  };

  // Search any city, village, or landmark via OpenStreetMap Nominatim
  const handlePlaceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&limit=5`
      );
      const data = await res.json();
      setSearchResults(data || []);
      if (data && data.length > 0) {
        const first = data[0];
        inspectCoordinates(parseFloat(first.lat), parseFloat(first.lon), first.display_name.split(',')[0]);
      }
    } catch {}
  };

  const handleLocateMe = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      inspectCoordinates(pos.coords.latitude, pos.coords.longitude);
    });
  };

  const handleSavePin = () => {
    if (!selectedSpot) return;
    const exists = savedPins.some(p => p.name === selectedSpot.name);
    const updated = exists ? savedPins : [selectedSpot, ...savedPins.slice(0, 9)];
    setSavedPins(updated);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('roveo_user_globe_pins', JSON.stringify(updated));
      }
    } catch {}
  };

  return (
    <section className="glass-shell rounded-3xl overflow-hidden border border-white/15 shadow-2xl relative mb-12">
      {/* Top Glass Control Bar */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#050a10]/80 backdrop-blur-xl">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#e8d5b5] font-semibold block">
            Interactive 3D Planetary Atlas • Click Anywhere on Earth
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
            Explore Every City, Village & Coastline in 3D
          </h2>
        </div>

        {/* Search Any Place + Style Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <form onSubmit={handlePlaceSearch} className="flex items-center gap-1.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any city, village, street..."
                className="glass-input px-3.5 py-2 rounded-xl text-xs w-48 sm:w-64"
              />
              <button type="submit" className="btn-luxe px-3.5 py-2 rounded-xl text-xs font-semibold">
                Fly To
              </button>
            </form>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-64 sm:w-72 glass-shell rounded-xl p-1.5 bg-[#050a10]/95 border border-white/20 shadow-2xl z-30 space-y-1">
                {searchResults.map((res: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      inspectCoordinates(parseFloat(res.lat), parseFloat(res.lon), res.display_name.split(',')[0]);
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-slate-200 hover:bg-white/10 hover:text-[#e8d5b5] transition-colors truncate block"
                  >
                    {res.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLocateMe}
            className="glass-pill px-3 py-2 rounded-xl text-xs text-sky-300 hover:text-white"
            title="Fly to my current GPS location"
          >
            📍 Locate Me
          </button>

          <button
            type="button"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.flyTo({
                  center: [74.2433, 16.7050],
                  zoom: 1.8,
                  pitch: 35,
                  bearing: -8,
                  duration: 2500,
                  essential: true
                });
              }
            }}
            className="glass-pill px-3 py-2 rounded-xl text-xs text-[#e8d5b5] hover:text-white"
            title="View Whole Earth from Orbit"
          >
            🌍 Orbit
          </button>

          <div className="flex rounded-xl overflow-hidden border border-white/15">
            <button
              type="button"
              onClick={() => toggleMapStyle('satellite')}
              className={`px-3 py-1.5 text-xs font-medium ${mapMode === 'satellite' ? 'bg-[#e8d5b5] text-[#050a10] font-semibold' : 'bg-white/5 text-slate-300'}`}
            >
              🛰️ 3D Satellite
            </button>
            <button
              type="button"
              onClick={() => toggleMapStyle('dark')}
              className={`px-3 py-1.5 text-xs font-medium ${mapMode === 'dark' ? 'bg-[#e8d5b5] text-[#050a10] font-semibold' : 'bg-white/5 text-slate-300'}`}
            >
              🌑 Obsidian Vector
            </button>
          </div>
        </div>
      </div>

      {/* Quick Preset Sanctuary Jump Pills */}
      <div className="px-4 py-2.5 bg-[#050a10]/60 border-b border-white/10 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0">Quick Fly:</span>
        {PRESET_HUBS.map((hub) => (
          <button
            key={hub.name}
            type="button"
            onClick={() => inspectCoordinates(hub.lat, hub.lng, hub.name)}
            className="glass-pill px-3 py-1 rounded-full text-xs text-slate-200 hover:text-[#e8d5b5] shrink-0"
          >
            {hub.name}
          </button>
        ))}
      </div>

      {/* Main 3D Globe Viewport with Deep Space & Atmospheric Halo + Floating Dossier */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: '600px',
          width: '100%',
          backgroundColor: '#02060d',
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, rgba(2, 6, 13, 0.85) 60%, #010408 100%),
            radial-gradient(1.5px 1.5px at 12% 18%, rgba(255, 255, 255, 0.8) 100%, transparent),
            radial-gradient(1px 1px at 28% 75%, rgba(255, 255, 255, 0.6) 100%, transparent),
            radial-gradient(1.5px 1.5px at 78% 22%, rgba(255, 255, 255, 0.85) 100%, transparent),
            radial-gradient(1px 1px at 88% 68%, rgba(255, 255, 255, 0.5) 100%, transparent),
            radial-gradient(1.2px 1.2px at 48% 88%, rgba(255, 255, 255, 0.7) 100%, transparent)
          `
        }}
      >
        {/* Luminous Atmospheric Halo Ring behind the Earth sphere */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          aria-hidden="true"
        >
          <div
            className="w-[520px] h-[520px] rounded-full opacity-45 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(232, 213, 181, 0.15) 45%, transparent 70%)'
            }}
          />
        </div>

        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'relative', zIndex: 10 }} />

        {/* Floating Right Glass Info Dossier Card (Updates Wherever You Click) */}
        {selectedSpot && (
          <div className="
            absolute top-4 right-4 z-20 w-[92%] sm:w-88 max-w-sm
            glass-shell rounded-2xl p-4 sm:p-5 border border-white/20 shadow-2xl space-y-3.5
            backdrop-blur-2xl bg-[#050a10]/90
          ">
            {selectedSpot.thumbnail && (
              <div className="relative h-36 w-full rounded-xl overflow-hidden border border-white/10">
                <img
                  src={selectedSpot.thumbnail}
                  alt={selectedSpot.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest bg-[#e8d5b5]/20 text-[#e8d5b5] border border-[#e8d5b5]/40">
                  {isFetchingInfo ? 'Scanning Coordinates...' : `${selectedSpot.countryCode} • Live Telemetry`}
                </span>
                <h3 className="font-editorial text-2xl font-semibold text-white mt-1">
                  {selectedSpot.name}
                </h3>
                <p className="text-xs text-slate-300">
                  {[selectedSpot.state, selectedSpot.country].filter(Boolean).join(', ')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSavePin}
                className="glass-pill px-2.5 py-1.5 rounded-lg text-xs text-[#e8d5b5]"
                title="Save Pin"
              >
                📌 Pin
              </button>
            </div>

            {/* Live Weather, Wind & Coordinates Strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="glass-pill rounded-xl p-2">
                <span className="block text-[10px] text-slate-400">Weather</span>
                <span className="text-xs font-semibold text-white">
                  {selectedSpot.temperature !== undefined ? `${selectedSpot.temperature}°C` : '24°C'}
                </span>
              </div>
              <div className="glass-pill rounded-xl p-2">
                <span className="block text-[10px] text-slate-400">Elevation</span>
                <span className="text-xs font-semibold text-sky-300">
                  {selectedSpot.elevation !== undefined ? `${Math.round(selectedSpot.elevation)}m` : 'Sea Level'}
                </span>
              </div>
              <div className="glass-pill rounded-xl p-2">
                <span className="block text-[10px] text-slate-400">Coords</span>
                <span className="text-[11px] font-semibold text-[#e8d5b5]">
                  {selectedSpot.lat}°, {selectedSpot.lng}°
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed line-clamp-4">
              {selectedSpot.summary}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.flyTo({
                      center: [selectedSpot.lng, selectedSpot.lat],
                      zoom: 14.5,
                      pitch: 60,
                      speed: 1.4
                    });
                  }
                }}
                className="glass-pill py-2.5 px-3 rounded-xl text-xs font-medium text-white text-center"
              >
                🔍 Street Zoom
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSelectDestination) {
                    onSelectDestination(selectedSpot.name, { lat: selectedSpot.lat, lng: selectedSpot.lng });
                  } else if (onSelectLocation) {
                    onSelectLocation({ name: selectedSpot.name, lat: selectedSpot.lat, lng: selectedSpot.lng });
                  } else {
                    window.location.href = `/ai-planner?destination=${encodeURIComponent(selectedSpot.name)}`;
                  }
                }}
                className="btn-luxe py-2.5 px-3 rounded-xl text-xs font-semibold text-center"
              >
                ✨ Plan with AI →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default InteractiveGlobe;
