"use client"

import * as React from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapPoint } from "./trip-map"

// Custom SVG-based Pin Icon to avoid missing asset png problems in bundlers
const customIcon = L.divIcon({
  className: "custom-leaflet-marker",
  html: `<div style="background-color: #64B5A7; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
    <div style="background-color: #172B3A; width: 6px; height: 6px; border-radius: 50%;"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
})

interface LeafletInnerProps {
  points: MapPoint[]
  center: [number, number]
  zoom: number
}

export function LeafletInner({ points, center, zoom }: LeafletInnerProps) {
  const mapCenter = points.length > 0 ? [points[0].lat, points[0].lng] as [number, number] : center

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.lat, point.lng]}
          icon={customIcon}
        >
          <Popup>
            <div className="p-1 text-xs font-sans">
              <strong className="block text-sm font-semibold">{point.title}</strong>
              {point.category && (
                <span className="text-[#64B5A7] font-medium uppercase text-[10px] block mt-0.5">
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

