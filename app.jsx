/* global window */
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { PolygonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';

// Import variables from variables.json
import variables from './variables.json';

const { max_lon, min_lon_and_initial, max_lat, min_lat_and_initial } = variables;

// Source data CSV
const DATA_URL = {
  BUILDINGS:
    'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS: 'trips.json', // Update with the path to your trip data JSON file
};

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0,
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000],
});

const lightingEffect = new LightingEffect({ ambientLight, pointLight });

const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70],
};

const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material,
  effects: [lightingEffect],
};

const INITIAL_VIEW_STATE = {
  longitude: min_lon_and_initial, // Use the value from variables.json
  latitude: min_lat_and_initial, // Use the value from variables.json
  zoom: 13,
  pitch: 45,
  bearing: 0,
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';

const landCover = [
  [
    [max_lon, min_lat_and_initial], // Use the values from variables.json
    [max_lon, max_lat], // Use the values from variables.json
    [min_lon_and_initial, max_lat], // Use the values from variables.json
    [min_lon_and_initial, min_lat_and_initial], // Use the values from variables.json
  ],
];

const App = ({
  buildings = DATA_URL.BUILDINGS,
  trips = DATA_URL.TRIPS,
  initialViewState = INITIAL_VIEW_STATE,
  mapStyle = MAP_STYLE,
  theme = DEFAULT_THEME,
}) => {
  const [timestamp, setTimestamp] = useState(0);
  const [trailLength, setTrailLength] = useState(180);
  const [animation, setAnimation] = useState({});

  useEffect(() => {
    const animate = () => {
      setTimestamp((t) => (t + 1) % loopLength);
      animation.id = window.requestAnimationFrame(animate);
    };

    animation.id = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animation.id);
  }, [animation]);

  const loopLength = 86399; // Unit corresponds to the timestamp in source data

  const layers = [
    // This is only needed when using shadow effects
    new PolygonLayer({
      id: 'ground',
      data: landCover,
      getPolygon: (f) => f,
      stroked: false,
      getFillColor: [0, 0, 0, 0],
    }),
    new TripsLayer({
      id: 'trips',
      data: trips,
      getPath: (d) => d.path,
      getTimestamps: (d) => d.timestamp,
      getColor: (d) => (d.id === 0 ? theme.trailColor0 : theme.trailColor1),
      opacity: 0.3,
      widthMinPixels: 2,
      rounded: true,
      trailLength,
      currentTime: timestamp,
      shadowEnabled: false,
    }),
    new PolygonLayer({
      id: 'buildings',
      data: buildings,
      extruded: true,
      wireframe: false,
      opacity: 0.5,
      getPolygon: (f) => f.polygon,
      getElevation: (f) => f.height,
      getFillColor: theme.buildingColor,
      material: theme.material,
    }),
  ];

  return (
    <DeckGL layers={layers} effects={theme.effects} initialViewState={initialViewState} controller={true}>
      <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true} />
      <div>
        {/* Timestamp Slider */}
        <input
          type="range"
          min={0}
          max={loopLength}
          step={1}
          value={timestamp}
          onChange={(e) => setTimestamp(Number(e.target.value))}
        />
        <span>Timestamp: {timestamp}</span>
        <br />
        {/* Trail Length Slider */}
        <input
          type="range"
          min={0}
          max={200}
          step={1}
          value={trailLength}
          onChange={(e) => setTrailLength(Number(e.target.value))}
        />
        <span>Trail Length: {trailLength}</span>
      </div>
    </DeckGL>
  );
};

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
