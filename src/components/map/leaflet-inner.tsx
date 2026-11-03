"use client"

import * as React from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import { MapPoint } from "./trip-map"

// Custom SVG-based Pin Icon matching ROVEO's Liquid Glass cyan & champagne palette
const customIcon = L.divIcon({
  className: "custom-leaflet-marker",
  html: `<div style="background: #38bdf8; width: 26px; height: 26px; border-radius: 50%; border: 3px solid #050a10; box-shadow: 0 0 16px rgba(56, 189, 248, 0.8); display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease;">
    <div style="background: #e8d5b5; width: 7px; height: 7px; border-radius: 50%;"></div>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
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
      style={{ height: "100%", width: "100%", zIndex: 1, backgroundColor: "#050a10" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> & CartoDB'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.lat, point.lng]}
          icon={customIcon}
        >
          <Popup>
            <div className="p-1 text-xs font-sans text-slate-900">
              <strong className="block text-sm font-semibold">{point.title}</strong>
              {point.category && (
                <span className="text-[#0284c7] font-semibold uppercase text-[10px] block mt-0.5 tracking-wider">
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
