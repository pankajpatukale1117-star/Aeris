"use client"

import * as React from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import ThreeGlobe from "three-globe"
import {
  Compass,
  MapPin,
  Search,
  Sparkles,
  Plus,
  X,
  ArrowRight,
  Globe,
  RotateCcw,
  Navigation,
} from "lucide-react"

export interface GlobePin {
  id: string
  name: string
  region: string
  lat: number
  lng: number
  category: string
  isUserCreated?: boolean
}

export const SIGNATURE_SANCTUARIES: GlobePin[] = [
  { id: "kyoto", name: "Kyoto", region: "Kansai, Japan", lat: 35.0116, lng: 135.7681, category: "Culture" },
  { id: "bali", name: "Bali", region: "Ubud & Coast, Indonesia", lat: -8.3405, lng: 115.092, category: "Beach" },
  { id: "paris", name: "Paris", region: "Île-de-France, France", lat: 48.8566, lng: 2.3522, category: "City" },
  { id: "maasai-mara", name: "Maasai Mara", region: "Rift Valley, Kenya", lat: -1.5061, lng: 35.1437, category: "Adventure" },
  { id: "amalfi", name: "Amalfi Coast", region: "Campania, Italy", lat: 40.634, lng: 14.6027, category: "Coastal" },
  { id: "kolhapur", name: "Kolhapur", region: "Maharashtra, India", lat: 16.705, lng: 74.2433, category: "Heritage" },
]

const SANCTUARY_ARCS = [
  { startLat: 35.0116, startLng: 135.7681, endLat: -8.3405, endLng: 115.092, color: ["#38bdf8", "#e8d5b5"] },
  { startLat: 48.8566, startLng: 2.3522, endLat: 40.634, endLng: 14.6027, color: ["#e8d5b5", "#38bdf8"] },
  { startLat: 16.705, startLng: 74.2433, endLat: 48.8566, endLng: 2.3522, color: ["#38bdf8", "#e8d5b5"] },
  { startLat: -1.5061, startLng: 35.1437, endLat: 40.634, endLng: 14.6027, color: ["#e8d5b5", "#34d399"] },
]

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

function vector3ToLatLng(v: THREE.Vector3, radius: number): { lat: number; lng: number } {
  const phi = Math.acos(Math.max(-1, Math.min(1, v.y / radius)))
  const theta = Math.atan2(v.z, -v.x)
  const lat = 90 - (phi * 180) / Math.PI
  let lng = (theta * 180) / Math.PI - 180
  if (lng < -180) lng += 360
  if (lng > 180) lng -= 360
  return { lat, lng }
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

interface InteractiveGlobeInnerProps {
  onSelectLocation?: (location: GlobePin) => void
  activeLocation?: { lat: number; lng: number; name?: string } | null
  className?: string
}

export function InteractiveGlobeInner({
  onSelectLocation,
  activeLocation,
  className = "",
}: InteractiveGlobeInnerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // WebGL Instance Refs
  const sceneRef = React.useRef<THREE.Scene | null>(null)
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = React.useRef<OrbitControls | null>(null)
  const globeInstanceRef = React.useRef<ThreeGlobe | null>(null)
  const animFrameRef = React.useRef<number | null>(null)
  const isVisibleRef = React.useRef<boolean>(true)

  // Camera Animation Tween state
  const tweenRef = React.useRef<{
    active: boolean
    startTime: number
    duration: number
    startPos: THREE.Vector3
    endPos: THREE.Vector3
  } | null>(null)

  // Pins & Selection State
  const [userPins, setUserPins] = React.useState<GlobePin[]>([])
  const [selectedPin, setSelectedPin] = React.useState<GlobePin | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<any[]>([])

  // Modal State for Click-to-Drop
  const [dropPrompt, setDropPrompt] = React.useState<{ lat: number; lng: number } | null>(null)
  const [customPinName, setCustomPinName] = React.useState("")
  const [customPinCategory, setCustomPinCategory] = React.useState("Custom Discovery")

  // Load Saved Pins from LocalStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("roveo_user_pins")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setUserPins(parsed)
      }
    } catch (e) {
      console.warn("Could not read roveo_user_pins from localStorage", e)
    }
  }, [])

  const allPins = React.useMemo(() => {
    return [...SIGNATURE_SANCTUARIES, ...userPins]
  }, [userPins])

  // Save pins to LocalStorage
  const saveUserPin = (newPin: GlobePin) => {
    const updated = [...userPins, newPin]
    setUserPins(updated)
    try {
      localStorage.setItem("roveo_user_pins", JSON.stringify(updated))
    } catch (e) {
      console.warn("Could not persist pin to localStorage", e)
    }
  }

  // Cinematic Camera Fly-To Function
  const flyTo = React.useCallback((lat: number, lng: number, distance: number = 190) => {
    if (!cameraRef.current || !controlsRef.current) return
    const targetPos = latLngToVector3(lat, lng, distance)
    const currentPos = cameraRef.current.position.clone()

    tweenRef.current = {
      active: true,
      startTime: performance.now(),
      duration: 1200, // 1.2s smooth cubic ease
      startPos: currentPos,
      endPos: targetPos,
    }
  }, [])

  // Update ThreeGlobe Data whenever pins change or active selection updates
  React.useEffect(() => {
    const globe = globeInstanceRef.current
    if (!globe) return

    // Points data
    const pointsData = allPins.map((pin) => ({
      ...pin,
      size: pin.id === selectedPin?.id ? 0.95 : 0.6,
      color:
        pin.id === selectedPin?.id
          ? "#e8d5b5" // Golden champagne when active
          : pin.isUserCreated
          ? "#34d399" // Emerald for user pins
          : "#38bdf8", // Cyan for signatures
    }))

    // Rings data for pulsing wave beacon
    const ringsData = (selectedPin ? [selectedPin] : allPins).map((pin) => ({
      lat: pin.lat,
      lng: pin.lng,
      maxR: pin.id === selectedPin?.id ? 7 : 4,
      propagationSpeed: pin.id === selectedPin?.id ? 2.5 : 1.2,
      repeatPeriod: pin.id === selectedPin?.id ? 1000 : 2000,
      color: () => (pin.id === selectedPin?.id ? "#e8d5b5" : "#38bdf8"),
    }))

    globe
      .pointsData(pointsData)
      .pointAltitude(0.02)
      .pointRadius("size")
      .pointColor("color")
      .ringsData(ringsData)
      .ringColor("color")
      .ringMaxRadius("maxR")
      .ringPropagationSpeed("propagationSpeed")
      .ringRepeatPeriod("repeatPeriod")
  }, [allPins, selectedPin])

  // Respond to incoming external activeLocation prop
  React.useEffect(() => {
    if (activeLocation && activeLocation.lat && activeLocation.lng) {
      flyTo(activeLocation.lat, activeLocation.lng)
      const match = allPins.find(
        (p) =>
          Math.abs(p.lat - activeLocation.lat) < 0.2 &&
          Math.abs(p.lng - activeLocation.lng) < 0.2
      )
      if (match) setSelectedPin(match)
    }
  }, [activeLocation, flyTo, allPins])

  // Initialize WebGL Scene
  React.useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const width = container.clientWidth || 800
    const height = container.clientHeight || 520

    // 1. Scene & Camera
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1500)
    camera.position.set(0, 40, 220)
    cameraRef.current = camera

    // 2. WebGL Renderer with High-Performance & Antialiasing
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer

    // 3. OrbitControls with Damping & Auto-Rotation
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enablePan = false
    controls.minDistance = 125
    controls.maxDistance = 310
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.6
    controlsRef.current = controls

    // Pause auto-rotation on pointer interaction
    const handlePointerDown = () => {
      controls.autoRotate = false
    }
    const handlePointerUp = () => {
      // Resume gentle auto-rotation after 4 seconds of idle
      setTimeout(() => {
        if (controlsRef.current) controlsRef.current.autoRotate = true
      }, 4000)
    }
    canvas.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("pointerup", handlePointerUp)

    // 4. Ambient & Rim Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2) // Cyan rim light
    dirLight1.position.set(-200, 150, 150)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xe8d5b5, 0.85) // Champagne gold fill
    dirLight2.position.set(200, -100, -150)
    scene.add(dirLight2)

    // 5. Glowing Atmosphere Halo Rim Shader
    const atmosphereGeo = new THREE.SphereGeometry(103, 64, 64)
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(0.22, 0.74, 0.97, 1.0) * intensity * 1.6;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    })
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat)
    scene.add(atmosphereMesh)

    // 6. ThreeGlobe Core Configuration
    const globe = new ThreeGlobe()
      .globeImageUrl("") // Procedural obsidian without heavy 50MB texture
      .showGlobe(true)
      .showAtmosphere(false) // We use our custom GPU atmospheric rim shader above
      .arcsData(SANCTUARY_ARCS)
      .arcColor("color")
      .arcAltitude(0.25)
      .arcStroke(0.7)
      .arcDashLength(0.8)
      .arcDashGap(2)
      .arcDashAnimateTime(3500)

    // Apply dark obsidian/slate material (#070d18)
    const globeMesh = globe.children.find(
      (c) => (c as THREE.Mesh).isMesh
    ) as THREE.Mesh | undefined
    if (globeMesh) {
      globeMesh.material = new THREE.MeshStandardMaterial({
        color: 0x070d18,
        roughness: 0.85,
        metalness: 0.15,
      })
    }

    globeInstanceRef.current = globe
    scene.add(globe)

    // 7. Load Lightweight GeoJSON Polygons for Procedural Landmass Hex-Dots
    fetch("/data/world-countries.json")
      .then((res) => res.json())
      .then((countries) => {
        globe
          .hexPolygonsData(countries.features)
          .hexPolygonResolution(3)
          .hexPolygonMargin(0.3)
          .hexPolygonUseDots(true)
          .hexPolygonColor(() => "rgba(56, 189, 248, 0.55)")
      })
      .catch((err) => {
        console.warn("World countries GeoJSON notice:", err)
      })

    // 8. 60–120fps Animation Loop with Delta Capping & Auto-Pause
    let lastTime = performance.now()

    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate)

      if (!isVisibleRef.current) return // Zero CPU/GPU drain when out of viewport

      const delta = Math.min((time - lastTime) / 1000, 0.1) // Delta capped to prevent jumps
      lastTime = time

      // Handle Camera Fly-To Tween
      if (tweenRef.current && tweenRef.current.active) {
        const elapsed = time - tweenRef.current.startTime
        const progress = Math.min(elapsed / tweenRef.current.duration, 1)
        const t = easeInOutCubic(progress)

        camera.position.lerpVectors(
          tweenRef.current.startPos,
          tweenRef.current.endPos,
          t
        )

        if (progress >= 1) {
          tweenRef.current.active = false
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    // 9. IntersectionObserver to preserve laptop battery and mobile performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting
        })
      },
      { threshold: 0.05 }
    )
    observer.observe(container)

    // 10. Responsive Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    })
    resizeObserver.observe(container)

    // Cleanup on Unmount
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      canvas.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("pointerup", handlePointerUp)
      observer.disconnect()
      resizeObserver.disconnect()
      renderer.dispose()
    }
  }, [])

  // Click-to-Drop Raycasting Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const camera = cameraRef.current
    if (!canvas || !camera) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

    const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100)
    const target = new THREE.Vector3()

    if (raycaster.ray.intersectSphere(sphere, target)) {
      const { lat, lng } = vector3ToLatLng(target, 100)

      // Check if user clicked near an existing pin (within ~4 degrees)
      const clickedPin = allPins.find((p) => {
        const dLat = Math.abs(p.lat - lat)
        const dLng = Math.abs(p.lng - lng)
        return dLat < 4.5 && dLng < 4.5
      })

      if (clickedPin) {
        setSelectedPin(clickedPin)
        flyTo(clickedPin.lat, clickedPin.lng)
      } else {
        // Open Click-to-Drop Modal prompt
        setDropPrompt({
          lat: Number(lat.toFixed(4)),
          lng: Number(lng.toFixed(4)),
        })
      }
    }
  }

  // Handle "Drop My Pin" Search Execution
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return

    setIsSearching(true)
    try {
      const res = await fetch(`/api/geo/search?q=${encodeURIComponent(q)}&limit=3`)
      const data = await res.json()
      if (Array.isArray(data.results) && data.results.length > 0) {
        setSearchResults(data.results)
      } else {
        setSearchResults([])
      }
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Pin a searched location onto the globe
  const handlePinSearchResult = (loc: any) => {
    const newPin: GlobePin = {
      id: `user-pin-${Date.now()}`,
      name: loc.name,
      region: loc.displayName || loc.country || "Custom Destination",
      lat: loc.lat,
      lng: loc.lng,
      category: loc.category || "Custom Pin",
      isUserCreated: true,
    }
    saveUserPin(newPin)
    setSelectedPin(newPin)
    flyTo(newPin.lat, newPin.lng)
    setSearchResults([])
    setSearchQuery("")
  }

  // Submit custom location from click-to-drop
  const handleConfirmDropPin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dropPrompt || !customPinName.trim()) return

    const newPin: GlobePin = {
      id: `user-pin-${Date.now()}`,
      name: customPinName.trim(),
      region: `${dropPrompt.lat > 0 ? dropPrompt.lat + "°N" : Math.abs(dropPrompt.lat) + "°S"}, ${dropPrompt.lng > 0 ? dropPrompt.lng + "°E" : Math.abs(dropPrompt.lng) + "°W"}`,
      lat: dropPrompt.lat,
      lng: dropPrompt.lng,
      category: customPinCategory,
      isUserCreated: true,
    }

    saveUserPin(newPin)
    setSelectedPin(newPin)
    flyTo(newPin.lat, newPin.lng)
    setDropPrompt(null)
    setCustomPinName("")
  }

  return (
    <div
      ref={containerRef}
      className={`glass-shell rounded-3xl p-6 lg:p-8 relative overflow-hidden mb-12 select-none ${className}`}
    >
      {/* ─── 1. Header Toolbar: Title & Live Hardware Telemetry ───────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-20">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-[10px] uppercase font-bold tracking-widest text-[#38bdf8]">
            <Globe className="w-3.5 h-3.5 animate-spin text-[#38bdf8]" />
            <span>60–120 FPS WebGL Interactive Globe</span>
          </div>
          <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-white tracking-tight">
            ROVEO Planetary Sanctuary Atlas
          </h3>
          <p className="text-xs text-[#94a3b8] max-w-xl">
            Drag to orbit in 3D space, scroll to zoom. Click anywhere to drop your own persistent pin, or fly directly to signature sanctuaries.
          </p>
        </div>

        {/* Quick Sanctuary Jump Chips */}
        <div className="flex flex-wrap items-center gap-1.5 sm:max-w-md justify-start sm:justify-end">
          {SIGNATURE_SANCTUARIES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedPin(s)
                flyTo(s.lat, s.lng)
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                selectedPin?.id === s.id
                  ? "bg-[#e8d5b5] text-[#050a10] shadow-[0_0_12px_#e8d5b5]"
                  : "glass-pill text-white/80 hover:text-white hover:border-[#38bdf8]/40"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 2. Top-Right "Drop My Pin" Search Bar ────────────────────────── */}
      <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-30 max-w-xs w-full hidden md:block">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Type city (e.g. Kolhapur, Zermatt)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input rounded-full pl-9 pr-8 py-2 text-xs font-semibold placeholder:text-white/40 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-[#38bdf8] absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setSearchResults([])
              }}
              className="absolute right-3 top-2.5 text-white/50 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 glass-dock rounded-2xl p-2 space-y-1 shadow-2xl border border-white/20 animate-in fade-in">
            {searchResults.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handlePinSearchResult(loc)}
                className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between group"
              >
                <div>
                  <strong className="block text-xs text-white group-hover:text-[#e8d5b5]">
                    {loc.name}
                  </strong>
                  <span className="text-[10px] text-white/60 line-clamp-1">
                    {loc.displayName}
                  </span>
                </div>
                <Plus className="w-3.5 h-3.5 text-[#38bdf8]" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── 3. 3D WebGL Canvas Viewport ─────────────────────────────────── */}
      <div className="relative w-full h-[420px] sm:h-[500px] lg:h-[560px] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block"
        />

        {/* Floating Instruction Hint */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <div className="glass-pill px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-ping" />
            <span>Click any location on globe to drop custom pin</span>
          </div>
        </div>

        {/* ─── 4. Selected Pin Liquid-Glass Detail Card ──────────────────── */}
        {selectedPin && (
          <div className="absolute bottom-4 right-4 z-30 max-w-sm w-full glass-dock p-5 rounded-2xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 mb-1">
                  {selectedPin.category}
                </span>
                <h4 className="font-editorial text-2xl font-bold text-white leading-tight">
                  {selectedPin.name}
                </h4>
                <p className="text-xs text-[#94a3b8]">{selectedPin.region}</p>
              </div>

              <button
                onClick={() => setSelectedPin(null)}
                className="text-white/50 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/70 py-2 border-y border-white/10 mb-3">
              <span>Coordinates</span>
              <span className="font-mono text-[#e8d5b5]">
                {selectedPin.lat.toFixed(4)}°, {selectedPin.lng.toFixed(4)}°
              </span>
            </div>

            <button
              onClick={() => {
                if (onSelectLocation) onSelectLocation(selectedPin)
                // Smooth-scroll down to AI Studio if present on page
                const aiStudio = document.getElementById("ai-studio-section")
                if (aiStudio) {
                  aiStudio.scrollIntoView({ behavior: "smooth" })
                }
              }}
              className="w-full btn-luxe py-2.5 text-xs font-semibold gap-1.5 shadow-lg cursor-pointer flex items-center justify-center"
            >
              <span>Plan with AI Concierge</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#050a10]" />
            </button>
          </div>
        )}
      </div>

      {/* ─── 5. Click-to-Drop Confirmation Dialog Modal ─────────────────── */}
      {dropPrompt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-dock max-w-md w-full p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="editorial-tag text-[#e8d5b5]">Drop Pin on 3D Globe</span>
              <button
                onClick={() => setDropPrompt(null)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="font-editorial text-2xl font-bold text-white">
                Name Your Destination
              </h4>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Target coordinates: {dropPrompt.lat}° N, {dropPrompt.lng}° E
              </p>
            </div>

            <form onSubmit={handleConfirmDropPin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-white/70 tracking-wider">
                  Location Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahabaleshwar, Positano, Panhala Fort..."
                  value={customPinName}
                  onChange={(e) => setCustomPinName(e.target.value)}
                  className="w-full glass-input rounded-2xl p-3 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-white/70 tracking-wider">
                  Atmosphere / Category
                </label>
                <select
                  value={customPinCategory}
                  onChange={(e) => setCustomPinCategory(e.target.value)}
                  className="w-full glass-input rounded-2xl p-3 text-xs font-semibold focus:outline-none bg-[#050a10]"
                >
                  <option value="Cultural & Heritage">Cultural & Heritage</option>
                  <option value="Nature Sanctuary">Nature Sanctuary</option>
                  <option value="Coastal Escape">Coastal Escape</option>
                  <option value="Culinary Salon">Culinary Salon</option>
                  <option value="Alpine Retreat">Alpine Retreat</option>
                  <option value="Personal Landmark">Personal Landmark</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDropPrompt(null)}
                  className="glass-pill px-5 py-2 text-xs text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-luxe px-6 py-2 text-xs font-semibold">
                  Pin to Globe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

