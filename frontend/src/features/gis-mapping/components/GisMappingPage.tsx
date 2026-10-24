import { useState } from 'react'
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer } from 'react-leaflet'
import type { Feature, Geometry } from 'geojson'
import type { Layer, PathOptions } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card } from '../../../components/ui/Card'
import { getFarmMapData } from '../services/gisMappingService'
import type { FarmMapRecord, FieldBoundary, FieldProperties } from '../types/gis-mapping.types'

const mapData = getFarmMapData()
const initialFieldId = mapData.fields.features[0]?.properties.fieldId ?? null
const totalFarmAreaAcres = mapData.farms.reduce((total, farm) => total + farm.areaAcres, 0)
const mappedAreaAcres = mapData.fields.features.reduce(
  (total, field) => total + field.properties.areaAcres,
  0,
)
const unmappedAreaAcres = totalFarmAreaAcres - mappedAreaAcres

function getFarmMappedArea(farmId: string) {
  return mapData.fields.features
    .filter((field) => field.properties.farmId === farmId)
    .reduce((total, field) => total + field.properties.areaAcres, 0)
}

function GisMappingPage() {
  const [selectedFarmId, setSelectedFarmId] = useState(mapData.farms[0]?.id ?? '')
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(initialFieldId)
  const selectedFarm = mapData.farms.find((farm) => farm.id === selectedFarmId)
  const selectedField = mapData.fields.features.find(
    (field) => field.properties.fieldId === selectedFieldId,
  )
  const farmFields = mapData.fields.features.filter(
    (field) => field.properties.farmId === selectedFarmId,
  )
  const selectedFarmMappedAreaAcres = getFarmMappedArea(selectedFarmId)
  const selectedFarmUnmappedAreaAcres = (selectedFarm?.areaAcres ?? 0) - selectedFarmMappedAreaAcres

  function selectFarm(farm: FarmMapRecord) {
    setSelectedFarmId(farm.id)
    const firstField = mapData.fields.features.find((field) => field.properties.farmId === farm.id)
    setSelectedFieldId(firstField?.properties.fieldId ?? null)
  }

  function fieldStyle(feature?: Feature<Geometry, FieldProperties>): PathOptions {
    const isSelected = feature?.properties?.fieldId === selectedFieldId
    return {
      color: isSelected ? '#c47b1f' : '#5f8a49',
      fillColor: isSelected ? '#edc16d' : '#8eb875',
      fillOpacity: isSelected ? 0.5 : 0.27,
      weight: isSelected ? 4 : 2,
    }
  }

  function bindField(feature: Feature<Geometry, FieldProperties>, layer: Layer) {
    const properties = feature.properties
    if (properties?.fieldId) {
      layer.on('click', () => {
        setSelectedFieldId(properties.fieldId)
        setSelectedFarmId(properties.farmId)
      })
    }
  }

  function handleFieldFeature(feature: FieldBoundary) {
    setSelectedFieldId(feature.properties.fieldId)
    setSelectedFarmId(feature.properties.farmId)
  }

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations / GIS mapping</p>
          <h1 className="page-title">Explore farms and field boundaries</h1>
          <p className="page-description">
            Select a farm marker or field polygon to inspect its sample location and field details.
          </p>
        </div>
        <span className="tag neutral">Illustrative map data</span>
      </div>
      <div className="notice warning">
        <span aria-hidden="true">i</span>
        <span>
          Farm coordinates, boundaries, acreage, and irrigation statuses are fictional sample data.
          {` ${unmappedAreaAcres} acres have no mapped field boundary; no geometry has been added for them.`}
          {' '}Do not use this map for navigation, land measurement, or farm operations.
        </span>
      </div>

      <div className="section-heading">
        <div>
          <h2>Farm map</h2>
          <p>Pan and zoom the OpenStreetMap basemap; select a marker or polygon</p>
        </div>
        <span className="tag">
          {mapData.farms.length} farms · {mapData.fields.features.length} fields · {mappedAreaAcres} mapped / {totalFarmAreaAcres} total · {unmappedAreaAcres} unmapped ac
        </span>
      </div>

      <div className="gis-layout">
        <Card className="gis-map-card" padding={false}>
          <div aria-label="Interactive farm and field map" className="gis-map">
            <MapContainer
              center={[36.738, -119.788]}
              scrollWheelZoom
              zoom={14}
              zoomControl
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON
                data={mapData.fields}
                key={selectedFieldId ?? 'no-selected-field'}
                onEachFeature={bindField}
                style={fieldStyle}
              />
              {mapData.farms.map((farm) => (
                <CircleMarker
                  center={[farm.coordinates.latitude, farm.coordinates.longitude]}
                  eventHandlers={{ click: () => selectFarm(farm) }}
                  key={farm.id}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: farm.id === selectedFarmId ? '#c47b1f' : '#2c4930',
                    fillOpacity: 1,
                    weight: 2,
                  }}
                  radius={farm.id === selectedFarmId ? 9 : 7}
                >
                  <Popup>
                    <strong>{farm.name}</strong>
                    <br />
                    {farm.location}
                    <br />
                    {farm.areaAcres} sample acres
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <div aria-label="Map legend" className="gis-map-legend">
            <span className="gis-legend-item"><span aria-hidden="true" className="gis-legend-marker" /> Sample farm</span>
            <span className="gis-legend-item"><span aria-hidden="true" className="gis-legend-swatch" /> Field boundary</span>
            <span className="gis-legend-item"><span aria-hidden="true" className="gis-legend-swatch selected" /> Selected field</span>
          </div>
        </Card>

        <aside aria-label="Selected farm and field details" className="gis-side-panel">
          <Card className="gis-panel-card">
            <h2 className="panel-title">Farm locations</h2>
            <p className="panel-subtitle">Select a marker or farm below</p>
            <ul className="gis-farm-list">
              {mapData.farms.map((farm) => (
                <li key={farm.id}>
                  <button
                    aria-pressed={selectedFarmId === farm.id}
                    className={`gis-select-button ${selectedFarmId === farm.id ? 'selected' : ''}`}
                    onClick={() => selectFarm(farm)}
                    type="button"
                  >
                    <strong>{farm.name}</strong>
                    <span>
                      {farm.location} · {farm.areaAcres} total ac · {getFarmMappedArea(farm.id)} mapped ac · {farm.areaAcres - getFarmMappedArea(farm.id)} unmapped ac
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {selectedFarm && (
              <dl className="gis-details">
                <div><dt>Farm ID</dt><dd>{selectedFarm.id}</dd></div>
                <div><dt>Farm area</dt><dd>{selectedFarm.areaAcres} sample acres</dd></div>
                <div><dt>Mapped area</dt><dd>{selectedFarmMappedAreaAcres} sample acres</dd></div>
                <div><dt>Unmapped area</dt><dd>{selectedFarmUnmappedAreaAcres} sample acres</dd></div>
                <div><dt>Latitude</dt><dd>{selectedFarm.coordinates.latitude.toFixed(5)}</dd></div>
                <div><dt>Longitude</dt><dd>{selectedFarm.coordinates.longitude.toFixed(5)}</dd></div>
              </dl>
            )}
          </Card>

          <Card className="gis-panel-card">
            <h2 className="panel-title">Fields · {selectedFarm?.name ?? 'select a farm'}</h2>
            <p className="panel-subtitle">Choose a field to highlight its boundary</p>
            {farmFields.length === 0 ? (
              <p className="table-empty">No sample field boundaries are available for this farm.</p>
            ) : (
              <ul className="gis-field-list">
                {farmFields.map((field) => (
                  <li key={field.properties.fieldId}>
                    <button
                      aria-pressed={selectedFieldId === field.properties.fieldId}
                      className={`gis-select-button ${selectedFieldId === field.properties.fieldId ? 'selected' : ''}`}
                      onClick={() => handleFieldFeature(field)}
                      type="button"
                    >
                      <strong>{field.properties.name} · {field.properties.fieldId}</strong>
                      <span>{field.properties.crop} · {field.properties.areaAcres} sample ac</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedField && (
              <dl className="gis-details">
                <div><dt>Field name</dt><dd>{selectedField.properties.name}</dd></div>
                <div><dt>Field ID</dt><dd>{selectedField.properties.fieldId}</dd></div>
                <div><dt>Area</dt><dd>{selectedField.properties.areaAcres} sample acres</dd></div>
                <div><dt>Crop</dt><dd>{selectedField.properties.crop}</dd></div>
                <div><dt>Irrigation status</dt><dd>{selectedField.properties.irrigationStatus}</dd></div>
                <div><dt>Farm</dt><dd>{selectedFarm?.name ?? 'Unknown farm'}</dd></div>
              </dl>
            )}
          </Card>
        </aside>
      </div>
    </>
  )
}

export { GisMappingPage }
