"use client";

import { CircleMarker, Popup, Tooltip } from "react-leaflet";

const researchStations = [
  {
    name: "Rothera Research Station",
    country: "United Kingdom",
    lat: -67.5681,
    lng: -68.1300,
    region: "Antarctic Peninsula",
    status: "Year-round",
    focus: "Climate science, glaciology, biology and atmospheric research",
  },
  {
    name: "Halley VI Research Station",
    country: "United Kingdom",
    lat: -75.605,
    lng: -26.209,
    region: "Brunt Ice Shelf",
    status: "Year-round",
    focus: "Atmospheric science, climate monitoring and meteorology",
  },
  {
    name: "Neumayer Station III",
    country: "Germany",
    lat: -70.674,
    lng: -8.274,
    region: "Queen Maud Land",
    status: "Year-round",
    focus: "Atmospheric, geophysical and meteorological research",
  },
  {
    name: "SANAE IV",
    country: "South Africa",
    lat: -71.674,
    lng: 2.841,
    region: "Queen Maud Land",
    status: "Year-round",
    focus: "Earth sciences, atmospheric science and space physics",
  },
  {
    name: "Troll Research Station",
    country: "Norway",
    lat: -72.011,
    lng: 2.535,
    region: "Queen Maud Land",
    status: "Year-round",
    focus: "Climate, atmospheric and environmental research",
  },
  {
    name: "Maitri Station",
    country: "India",
    lat: -70.7697,
    lng: 11.7333,
    region: "Schirmacher Oasis",
    status: "Year-round",
    focus: "Earth sciences, atmospheric science and biological research",
  },
  {
    name: "Bharati Station",
    country: "India",
    lat: -69.413,
    lng: 76.190,
    region: "Larsemann Hills",
    status: "Year-round",
    focus: "Glaciology, oceanography, geology and climate research",
  },
  {
    name: "Mawson Station",
    country: "Australia",
    lat: -67.6027,
    lng: 62.8797,
    region: "Mac. Robertson Land",
    status: "Year-round",
    focus: "Atmospheric, biological and geophysical research",
  },
  {
    name: "Davis Station",
    country: "Australia",
    lat: -68.5766,
    lng: 77.9674,
    region: "Princess Elizabeth Land",
    status: "Year-round",
    focus: "Climate, glaciology, biology and atmospheric research",
  },
  {
    name: "Casey Station",
    country: "Australia",
    lat: -66.2821,
    lng: 110.5276,
    region: "Wilkes Land",
    status: "Year-round",
    focus: "Climate, glaciology, biology and geoscience",
  },
  {
    name: "Vostok Station",
    country: "Russia",
    lat: -78.4645,
    lng: 106.834,
    region: "East Antarctic Plateau",
    status: "Year-round",
    focus: "Ice-core, climate and geophysical research",
  },
  {
    name: "Concordia Station",
    country: "France / Italy",
    lat: -75.100,
    lng: 123.350,
    region: "Dome C",
    status: "Year-round",
    focus: "Climate, astronomy, atmospheric and glaciological research",
  },
  {
    name: "Dumont d'Urville Station",
    country: "France",
    lat: -66.663,
    lng: 140.001,
    region: "Adélie Land",
    status: "Year-round",
    focus: "Biology, geophysics, meteorology and oceanography",
  },
  {
    name: "McMurdo Station",
    country: "United States",
    lat: -77.8419,
    lng: 166.6863,
    region: "Ross Island",
    status: "Year-round",
    focus: "Earth sciences, biology, atmospheric and marine research",
  },
  {
    name: "Amundsen-Scott South Pole Station",
    country: "United States",
    lat: -90.0,
    lng: 0,
    region: "South Pole",
    status: "Year-round",
    focus: "Atmospheric science, astronomy, astrophysics and geophysics",
  },
  {
    name: "Scott Base",
    country: "New Zealand",
    lat: -77.8498,
    lng: 166.7685,
    region: "Ross Island",
    status: "Year-round",
    focus: "Glaciology, biology, geology and climate research",
  },
  {
    name: "Jang Bogo Station",
    country: "South Korea",
    lat: -74.619,
    lng: 164.222,
    region: "Terra Nova Bay",
    status: "Year-round",
    focus: "Glaciology, biology, geology and atmospheric science",
  },
  {
    name: "Zhongshan Station",
    country: "China",
    lat: -69.373,
    lng: 76.377,
    region: "Larsemann Hills",
    status: "Year-round",
    focus: "Earth sciences, atmospheric science and oceanography",
  },
  {
    name: "Syowa Station",
    country: "Japan",
    lat: -69.006,
    lng: 39.590,
    region: "East Antarctica",
    status: "Year-round",
    focus: "Geophysics, meteorology, biology and atmospheric science",
  },
  {
    name: "Progress Station",
    country: "Russia",
    lat: -69.373,
    lng: 76.385,
    region: "Larsemann Hills",
    status: "Year-round",
    focus: "Geophysical, meteorological and glaciological research",
  },
  {
    name: "Mirny Station",
    country: "Russia",
    lat: -66.555,
    lng: 93.009,
    region: "Queen Mary Land",
    status: "Year-round",
    focus: "Meteorology, geophysics and glaciology",
  },
  {
    name: "Palmer Station",
    country: "United States",
    lat: -64.774,
    lng: -64.053,
    region: "Anvers Island",
    status: "Year-round",
    focus: "Marine biology, oceanography and atmospheric research",
  },
  {
    name: "Vernadsky Research Base",
    country: "Ukraine",
    lat: -65.245,
    lng: -64.257,
    region: "Galindez Island",
    status: "Year-round",
    focus: "Meteorology, geophysics, biology and atmospheric science",
  },
  {
    name: "Esperanza Base",
    country: "Argentina",
    lat: -63.398,
    lng: -56.996,
    region: "Antarctic Peninsula",
    status: "Year-round",
    focus: "Meteorology, geology, biology and environmental research",
  },
  {
    name: "Marambio Base",
    country: "Argentina",
    lat: -64.238,
    lng: -56.631,
    region: "Seymour Island",
    status: "Year-round",
    focus: "Meteorology, geology and atmospheric research",
  },
  {
    name: "King Sejong Station",
    country: "South Korea",
    lat: -62.224,
    lng: -58.787,
    region: "King George Island",
    status: "Year-round",
    focus: "Biology, geology, oceanography and atmospheric science",
  },
];

function StationIcon({ country }) {
  const isIndia = country === "India";

  return (
    <div
      style={{
        width: isIndia ? "16px" : "12px",
        height: isIndia ? "16px" : "12px",
        borderRadius: "50%",
        background: isIndia ? "#22d3ee" : "#f8fafc",
        border: isIndia
          ? "3px solid rgba(34,211,238,0.25)"
          : "2px solid #22d3ee",
        boxShadow: isIndia
          ? "0 0 12px rgba(34,211,238,0.9)"
          : "0 0 7px rgba(34,211,238,0.7)",
      }}
    />
  );
}

export default function ResearchStationsLayer() {
  return (
    <>
      {researchStations.map((station) => (
        <CircleMarker
          key={station.name}
          center={[station.lat, station.lng]}
          radius={station.country === "India" ? 7 : 5}
          pathOptions={{
            color: "#22d3ee",
            weight: 2,
            fillColor:
              station.country === "India" ? "#22d3ee" : "#f8fafc",
            fillOpacity: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -5]}>
            {station.name}
          </Tooltip>

          <Popup>
            <div
              style={{
                minWidth: "230px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                {station.name}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginBottom: "12px",
                }}
              >
                {station.country}
              </div>

              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "10px",
                  fontSize: "12px",
                  lineHeight: "1.7",
                }}
              >
                <div>
                  <strong>Coordinates:</strong>{" "}
                  {station.lat.toFixed(3)}°,{" "}
                  {station.lng.toFixed(3)}°
                </div>

                <div>
                  <strong>Region:</strong> {station.region}
                </div>

                <div>
                  <strong>Status:</strong> {station.status}
                </div>

                <div style={{ marginTop: "8px" }}>
                  <strong>Research:</strong>
                  <br />
                  {station.focus}
                </div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}