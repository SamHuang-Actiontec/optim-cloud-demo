import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DASH_ACCOUNTS, REGION_HEALTH } from '../../data/mockDashboard'
import { useTheme } from '../../context/ThemeContext'

function tileUrl(theme) {
  return theme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
}

const HEALTH_META = {
  healthy: { label: 'Healthy', color: '#22c55e' },
  degraded: { label: 'Degraded', color: '#f59e0b' },
  critical: { label: 'Critical', color: '#ef4444' },
}

const MAP_FEATURES = {
  water: [
    [
      [48.55, -122.85], [48.25, -122.56], [47.95, -122.50], [47.73, -122.42],
      [47.57, -122.36], [47.32, -122.44], [47.10, -122.61], [46.88, -122.74],
      [46.82, -123.05], [48.55, -123.05],
    ],
    [
      [47.79, -122.30], [47.73, -122.23], [47.64, -122.22], [47.55, -122.24],
      [47.49, -122.27], [47.52, -122.31], [47.62, -122.33], [47.73, -122.33],
    ],
  ],
  roads: [
    { name: 'I-5', path: [[48.27, -122.22], [47.98, -122.20], [47.61, -122.32], [47.25, -122.44], [46.98, -122.90]] },
    { name: 'I-90', path: [[47.61, -122.34], [47.59, -122.18], [47.58, -121.96], [47.46, -121.68]] },
    { name: 'SR 520', path: [[47.64, -122.33], [47.64, -122.20], [47.67, -122.11], [47.67, -122.03]] },
  ],
  cities: [
    { name: 'Seattle', lat: 47.61, lng: -122.33 },
    { name: 'Tacoma', lat: 47.25, lng: -122.44 },
    { name: 'Bellevue', lat: 47.61, lng: -122.20 },
    { name: 'Redmond', lat: 47.67, lng: -122.12 },
    { name: 'Olympia', lat: 47.04, lng: -122.90 },
  ],
}

// No offsets — dials sit at region centers so they stay in view when zooming in
const REGION_DIAL_OFFSETS = {}

// Pixel distance at which two dials get merged into one cluster
const CLUSTER_PX = 90

function healthGroup(account) {
  if (account.score < 40 || account.healthStatus === 'offline') return 'critical'
  if (account.score < 70) return 'degraded'
  return 'healthy'
}

function scoreColor(score) {
  if (score < 40) return HEALTH_META.critical.color
  if (score < 70) return HEALTH_META.degraded.color
  return HEALTH_META.healthy.color
}

function seededUnit(seed, salt) {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function accountSeed(account) {
  const digits = account.id.replace(/\D/g, '')
  return Number(digits || 1)
}

function serviceScale(regions) {
  const lats = regions.map((region) => region.lat)
  const lngs = regions.map((region) => region.lng)
  const latSpan = Math.max(...lats) - Math.min(...lats)
  const lngSpan = Math.max(...lngs) - Math.min(...lngs)
  const span = Math.max(latSpan, lngSpan)

  if (span > 18) return 'national'
  if (span > 6) return 'statewide'
  return 'regional'
}

function boundsForRegions(regions) {
  const points = regions.flatMap((region) => {
    const latDelta = region.radiusKm / 111
    const lngDelta = region.radiusKm / (111 * Math.cos(region.lat * Math.PI / 180))
    return [
      [region.lat - latDelta, region.lng - lngDelta],
      [region.lat + latDelta, region.lng + lngDelta],
    ]
  })
  return L.latLngBounds(points)
}

function buildRegionStats(accounts, regions) {
  return regions.map((region) => {
    const regionAccounts = accounts.filter((account) => account.region === region.id)
    const counts = regionAccounts.reduce((acc, account) => {
      acc[healthGroup(account)] += 1
      return acc
    }, { healthy: 0, degraded: 0, critical: 0 })
    const total = regionAccounts.length
    const weighted = total
      ? Math.round((counts.healthy * 100 + counts.degraded * 60 + counts.critical * 20) / total)
      : region.healthScore

    return {
      ...region,
      total,
      ...counts,
      healthScore: weighted,
    }
  })
}

function dialPosition(region) {
  // Pre-computed position for merged clusters
  if (region._dialLat !== undefined) return [region._dialLat, region._dialLng]
  const offset = REGION_DIAL_OFFSETS[region.id] || { lat: 0, lng: 0 }
  return [region.lat + offset.lat, region.lng + offset.lng]
}

// Merge a group of regions whose dials overlap at the current zoom level
function mergeIntoCluster(group) {
  if (group.length === 1) {
    return { ...group[0], _mergedIds: [group[0].id] }
  }

  const positions = group.map((r) => dialPosition(r))
  const centerLat = positions.reduce((s, [la]) => s + la, 0) / positions.length
  const centerLng = positions.reduce((s, [, lo]) => s + lo, 0) / positions.length

  const total = group.reduce((s, r) => s + r.total, 0)
  const critical = group.reduce((s, r) => s + r.critical, 0)
  const degraded = group.reduce((s, r) => s + r.degraded, 0)
  const healthy = total - critical - degraded
  const healthScore = total
    ? Math.round((healthy * 100 + degraded * 60 + critical * 20) / total)
    : 0

  const name = group.length === 2
    ? group.map((r) => r.name.split(' /')[0].trim()).join(' + ')
    : `${group.length} Regions`

  return {
    id: group.map((r) => r.id).join('-'),
    name,
    lat: centerLat,
    lng: centerLng,
    _dialLat: centerLat,
    _dialLng: centerLng,
    total,
    critical,
    degraded,
    healthy,
    healthScore,
    radiusKm: Math.max(...group.map((r) => r.radiusKm)),
    _mergedIds: group.map((r) => r.id),
  }
}

// Connected-component clustering: any two dials within CLUSTER_PX pixels get merged
function clusterByPixel(map, regions) {
  const n = regions.length
  const pts = regions.map((r) => map.latLngToLayerPoint(dialPosition(r)))

  const adj = Array.from({ length: n }, () => [])
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = pts[i].x - pts[j].x
      const dy = pts[i].y - pts[j].y
      if (Math.sqrt(dx * dx + dy * dy) < CLUSTER_PX) {
        adj[i].push(j)
        adj[j].push(i)
      }
    }
  }

  const visited = new Set()
  const clusters = []

  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue
    const component = []
    const queue = [i]
    visited.add(i)
    while (queue.length) {
      const cur = queue.shift()
      component.push(regions[cur])
      adj[cur].forEach((j) => {
        if (!visited.has(j)) {
          visited.add(j)
          queue.push(j)
        }
      })
    }
    clusters.push(mergeIntoCluster(component))
  }

  return clusters
}

function buildAccountPoints(accounts, regions) {
  const regionById = new Map(regions.map((region) => [region.id, region]))

  return accounts.map((account) => {
    const region = regionById.get(account.region) || regions[0]
    const seed = accountSeed(account)
    const angle = seededUnit(seed, 1) * Math.PI * 2
    const distance = Math.sqrt(seededUnit(seed, 2)) * region.radiusKm * 0.82
    const latOffset = Math.cos(angle) * distance / 111
    const lngOffset = Math.sin(angle) * distance / (111 * Math.cos(region.lat * Math.PI / 180))

    return {
      ...account,
      lat: region.lat + latOffset,
      lng: region.lng + lngOffset,
      group: healthGroup(account),
    }
  })
}

function clusterHtml(region) {
  const total = Math.max(region.total, 1)
  const criticalPct = (region.critical / total) * 100
  const degradedPct = (region.degraded / total) * 100
  const healthyPct = Math.max(0, 100 - criticalPct - degradedPct)
  const affectedPct = criticalPct + degradedPct
  const dominant = region.critical > region.degraded && region.critical > region.healthy
    ? 'critical'
    : region.degraded > region.healthy
      ? 'degraded'
      : 'healthy'
  const criticalEnd = criticalPct
  const degradedEnd = criticalPct + degradedPct
  const dial = `conic-gradient(${HEALTH_META.critical.color} 0 ${criticalEnd}%, ${HEALTH_META.degraded.color} ${criticalEnd}% ${degradedEnd}%, ${HEALTH_META.healthy.color} ${degradedEnd}% 100%)`

  return `
    <button class="dashboard-region-dial is-${dominant}" type="button" style="--region-dial:${dial}" aria-label="${region.name} ${region.total} networks">
      <span class="dashboard-region-dial-face">
        <span class="dashboard-region-dial-center">
          <strong>${Math.round(affectedPct)}%</strong>
          <em>affected</em>
        </span>
      </span>
      <span class="dashboard-region-dial-bars" aria-hidden="true">
        <i style="--bar-color:${HEALTH_META.critical.color}; width:${criticalPct}%"></i>
        <i style="--bar-color:${HEALTH_META.degraded.color}; width:${degradedPct}%"></i>
        <i style="--bar-color:${HEALTH_META.healthy.color}; width:${healthyPct}%"></i>
      </span>
      <span class="dashboard-region-dial-label">
        <b>${region.name}</b>
        <small>${region.critical} critical · ${region.total.toLocaleString()} total</small>
      </span>
    </button>
  `
}

function accountPopup(account) {
  return `
    <div class="dashboard-map-popup">
      <strong>${account.accountId}</strong>
      <span>${account.serial} · ${account.model}</span>
      <span>${account.loc} · ${account.tier}</span>
      <em style="color:${scoreColor(account.score)}">${HEALTH_META[account.group].label} · score ${account.score}</em>
    </div>
  `
}

export default function GeoMap({ onRegionSelect, onDeviceSelect }) {
  const { theme } = useTheme()
  const mapElRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({
    tiles: null,
    base: null,
    coverage: null,
    clusters: null,
    accounts: null,
    service: null,
    modeControl: null,
  })

  const regions = useMemo(() => buildRegionStats(DASH_ACCOUNTS, REGION_HEALTH), [])
  const accountPoints = useMemo(() => buildAccountPoints(DASH_ACCOUNTS, regions), [regions])
  const scale = useMemo(() => serviceScale(regions), [regions])

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return

    const bounds = boundsForRegions(regions)
    const map = L.map(mapElRef.current, {
      attributionControl: false,
      maxBoundsViscosity: 0.65,
      scrollWheelZoom: true,
      zoomControl: true,
    })

    // CartoDB tiles — dark_all in dark mode, light_all in light mode; labels baked in below marker z-index
    const tiles = L.tileLayer(tileUrl(theme), {
      subdomains: 'abcd',
      maxZoom: 20,
      opacity: 0.88,
    })
    tiles.addTo(map)
    layersRef.current.tiles = tiles

    map.fitBounds(bounds.pad(0.18), { animate: false })
    map.setMaxBounds(bounds.pad(scale === 'regional' ? 0.55 : 0.28))
    map.setMinZoom(Math.max(5, map.getZoom() - 1))
    map.setMaxZoom(scale === 'national' ? 11 : 13)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [regions, scale])

  // Swap tile layer when theme toggles
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (layersRef.current.tiles) {
      map.removeLayer(layersRef.current.tiles)
    }
    const tiles = L.tileLayer(tileUrl(theme), {
      subdomains: 'abcd',
      maxZoom: 20,
      opacity: 0.88,
    })
    tiles.addTo(map)
    layersRef.current.tiles = tiles
  }, [theme])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const detailZoom = scale === 'national' ? 8 : scale === 'statewide' ? 10 : 11

    function clearLayer(name) {
      const layer = layersRef.current[name]
      if (layer) {
        if (name === 'modeControl') map.removeControl(layer)
        else map.removeLayer(layer)
        layersRef.current[name] = null
      }
    }

    function renderCoverage() {
      clearLayer('base')
      clearLayer('coverage')
      clearLayer('service')

      // Only draw coverage overlays — city labels come from tile layer so no custom markers needed
      const base = L.layerGroup()
      MAP_FEATURES.water.forEach((shape) => {
        L.polygon(shape, {
          className: 'dashboard-map-water-shape',
          color: '#38bdf8',
          weight: 1,
          opacity: 0.20,
          fillColor: '#0ea5e9',
          fillOpacity: 0.11,
          interactive: false,
        }).addTo(base)
      })
      MAP_FEATURES.roads.forEach((road) => {
        L.polyline(road.path, {
          className: 'dashboard-map-road-line',
          color: '#94a3b8',
          weight: 1.4,
          opacity: 0.34,
          interactive: false,
        }).addTo(base)
      })

      const coverage = L.layerGroup()
      regions.forEach((region) => {
        const level = region.healthScore < 50 ? 'critical' : region.healthScore < 75 ? 'degraded' : 'healthy'
        L.circle([region.lat, region.lng], {
          radius: region.radiusKm * 1000,
          color: HEALTH_META[level].color,
          weight: 1.2,
          opacity: 0.42,
          fillColor: HEALTH_META[level].color,
          fillOpacity: 0.06,
          dashArray: '5 7',
          interactive: false,
        }).addTo(coverage)
      })

      const service = L.rectangle(boundsForRegions(regions).pad(0.06), {
        color: '#38bdf8',
        weight: 1,
        opacity: 0.14,
        fill: false,
        interactive: false,
      })

      layersRef.current.base = base.addTo(map)
      layersRef.current.coverage = coverage.addTo(map)
      layersRef.current.service = service.addTo(map)
    }

    function renderClusters() {
      clearLayer('clusters')
      const clusters = L.layerGroup()

      // Merge dials that would overlap at current zoom level
      const displayClusters = clusterByPixel(map, regions)

      displayClusters.forEach((cluster) => {
        const icon = L.divIcon({
          className: 'dashboard-map-cluster-icon',
          html: clusterHtml(cluster),
          iconSize: [112, 98],
          iconAnchor: [56, 49],
        })
        const marker = L.marker(dialPosition(cluster), { icon, keyboard: true })
        marker.on('click', () => {
          // Open the most critical region in the cluster (first mergedId)
          const primaryId = cluster._mergedIds[0]
          const primaryRegion = regions.find((r) => r.id === primaryId)
          onRegionSelect?.(primaryId, primaryRegion?.name ?? cluster.name)
        })
        marker.addTo(clusters)
      })

      layersRef.current.clusters = clusters.addTo(map)
    }

    function renderAccounts() {
      clearLayer('accounts')
      const accounts = L.layerGroup()

      accountPoints.forEach((account) => {
        const marker = L.circleMarker([account.lat, account.lng], {
          radius: account.group === 'critical' ? 4 : 3,
          color: scoreColor(account.score),
          weight: 1,
          opacity: 0.95,
          fillColor: scoreColor(account.score),
          fillOpacity: account.group === 'healthy' ? 0.62 : 0.86,
        })
        marker.bindTooltip(accountPopup(account), {
          className: 'dashboard-map-device-tooltip',
          direction: 'top',
          offset: [0, -5],
          opacity: 0.96,
        })
        marker.on('click', () => {
          const region = regions.find((item) => item.id === account.region)
          onDeviceSelect?.({ ...account, regionName: region?.name })
        })
        marker.addTo(accounts)
      })

      layersRef.current.accounts = accounts.addTo(map)
    }

    function renderModeControl(isDetail) {
      clearLayer('modeControl')

      const control = L.control({ position: 'bottomleft' })
      control.onAdd = () => {
        const el = L.DomUtil.create('div', 'dashboard-map-mode-control')
        el.innerHTML = `
          <strong>${isDetail ? 'Account dots' : 'Health groups'}</strong>
          <span>${isDetail ? 'Colored dots by account health' : 'Regional totals by health group'}</span>
          <em>Zoom ${isDetail ? 'out' : 'in'} to switch view</em>
        `
        L.DomEvent.disableClickPropagation(el)
        return el
      }
      control.addTo(map)
      layersRef.current.modeControl = control
    }

    function render() {
      const isDetail = map.getZoom() >= detailZoom
      renderCoverage()
      clearLayer(isDetail ? 'clusters' : 'accounts')
      if (isDetail) renderAccounts()
      else renderClusters()
      renderModeControl(isDetail)
    }

    render()
    map.on('zoomend', render)
    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      map.off('zoomend', render)
      clearLayer('coverage')
      clearLayer('base')
      clearLayer('service')
      clearLayer('clusters')
      clearLayer('accounts')
      clearLayer('modeControl')
    }
  }, [accountPoints, onDeviceSelect, onRegionSelect, regions, scale])

  return (
    <div className="dashboard-map-wrapper">
      <div ref={mapElRef} className="dashboard-map-container dashboard-region-geo-map" aria-label="Regional service-area health map" />
    </div>
  )
}
