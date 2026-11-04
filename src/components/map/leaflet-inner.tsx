"use client"

import * as React from "react"
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import { MapPoint } from "./trip-map"

// Custom SVG-based Pin Icon matching AERIS's Liquid Glass cyan & champagne palette
const customIcon = L.divIcon({
  className: "custom-leaflet-marker",
  html: `<div style="background: #38bdf8; width: 26px; height: 26px; border-radius: 50%; border: 3px solid #050a10; box-shadow: 0 0 16px rgba(56, 189, 248, 0.8); display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease;">
    <div style="background: #e8d5b5; width: 7px; height: 7px; border-radius: 50%;"></div>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
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

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 1, backgroundColor: "#050a10" }}
    >
      {/* 100% Free Worldwide High-Performance OpenStreetMap (Zero API key required, zero watermarks) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="aeris-dark-tiles"
        maxZoom={19}
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
          {/* Permanent high-contrast sightseeing name badge directly on map */}
          <Tooltip
            permanent
            direction="top"
            offset={[0, -16]}
            className="aeris-map-tooltip"
          >
            <span className="aeris-pin-label">{point.title}</span>
          </Tooltip>

          {/* Interactive detail popup on click */}
          <Popup className="aeris-custom-popup">
            <div className="p-2 font-sans space-y-1.5 min-w-[160px]">
              {point.category && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
                  {point.category}
                </span>
              )}
              <strong className="block text-sm font-semibold text-white tracking-wide leading-snug">
                {point.title}
              </strong>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
