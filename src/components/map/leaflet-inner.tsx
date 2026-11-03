"use client"

import * as React from "react"
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import { MapPoint } from "./trip-map"

// Custom SVG-based Pin Icon matching AERIS's Liquid Glass cyan & champagne palette
const customIcon = L.divIcon({
  className: "custom-leaflet-marker",
  html: `<div style="background: #38bdf8; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #050a10; box-shadow: 0 0 18px rgba(56, 189, 248, 0.9); display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease;">
    <div style="background: #e8d5b5; width: 8px; height: 8px; border-radius: 50%;"></div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
})

// Component to dynamically fit bounds when points or routes change
function MapAutoBounds({
  points,
  routeCoordinates,
}: {
  points: MapPoint[]
  routeCoordinates?: Array<[number, number]>
}) {
  const map = useMap()

  React.useEffect(() => {
    if (points.length === 0 && (!routeCoordinates || routeCoordinates.length === 0)) return

    const bounds = L.latLngBounds([])
    points.forEach((p) => bounds.extend([p.lat, p.lng]))
    if (routeCoordinates) {
      routeCoordinates.forEach((c) => bounds.extend(c))
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }, [points, routeCoordinates, map])

  return null
}

interface LeafletInnerProps {
  points: MapPoint[]
  center: [number, number]
  zoom: number
  routeCoordinates?: Array<[number, number]>
}

export function LeafletInner({ points, center, zoom, routeCoordinates }: LeafletInnerProps) {
  const mapCenter = points.length > 0 ? ([points[0].lat, points[0].lng] as [number, number]) : center
  const cartoApiKey =
    process.env.NEXT_PUBLIC_CARTO_API_KEY || "cb1_51fd_1_16d18214c776b92dc87311e9"

  const tileUrl = cartoApiKey
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`
    : "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 1, backgroundColor: "#050a10" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &amp; CartoDB'
        url={tileUrl}
        subdomains="abcd"
        maxZoom={20}
      />
      <MapAutoBounds points={points} routeCoordinates={routeCoordinates} />

      {/* Render road network polyline if available */}
      {routeCoordinates && routeCoordinates.length > 1 && (
        <Polyline
          positions={routeCoordinates}
          pathOptions={{
            color: "#38bdf8",
            weight: 4,
            opacity: 0.85,
            dashArray: "1, 6",
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      {points.map((point) => (
        <Marker key={point.id} position={[point.lat, point.lng]} icon={customIcon}>
          {/* Permanent high-contrast badge visible directly on the map */}
          <Tooltip
            permanent={true}
            direction="top"
            offset={[0, -16]}
            className="aeris-map-label"
          >
            <div className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shrink-0 inline-block"></span>
              <span className="truncate max-w-[200px] text-white font-sans">{point.title}</span>
            </div>
          </Tooltip>

          {/* Detailed rich popup on click */}
          <Popup className="aeris-map-popup">
            <div className="p-2 text-xs font-sans text-white">
              <strong className="block text-sm font-bold text-white tracking-wide mb-1">
                {point.title}
              </strong>
              {point.category && (
                <span className="text-[#38bdf8] font-bold uppercase text-[10px] inline-block tracking-wider bg-[#38bdf8]/15 border border-[#38bdf8]/35 px-2.5 py-0.5 rounded-full">
                  {point.category}
                </span>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
