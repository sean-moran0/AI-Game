// Terrain fill colors — must match the exporter in generate.js.
const TERRAIN_COLORS = {
    deepWater: "#163d5c",
    water:     "#2a6f97",
    beach:     "#e0d8a8",
    grass:     "#5a9d4a",
    forest:    "#356a2a",
    mountain:  "#7a6f63",
    snow:      "#f2f2f2",
};

// Game maps use a plain X/Y plane, not geographic lat/lng.
const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -5,
    zoomSnap: 0.25,
});
// Keep zoom buttons clear of the load toolbar (both default to top-left).
map.zoomControl.setPosition("topright");
map.setView([0, 0], 0);

const $status = $("#status");
let layer = null;

function styleFeature(feature) {
    const terrain = feature?.properties?.terrain;
    const color = (terrain && TERRAIN_COLORS[terrain]) || "#888888";
    return {
        fillColor: color,
        fillOpacity: 1,
        weight: 0,
        // No visible stroke, but keep a matching color for anti-alias seams.
        color,
    };
}

function onEachFeature(feature, lyr) {
    const p = feature.properties ?? {};
    lyr.bindPopup(
        `Terrain: ${p.terrain ?? "unknown"}<br>` +
        `Water: ${p.water ?? "—"}<br>` +
        `Elevation: ${p.elevation ?? "—"}`
    );
}

function loadGeoJSON(geojson) {
    if (layer) {
        map.removeLayer(layer);
        layer = null;
    }
    layer = L.geoJSON(geojson, { style: styleFeature, onEachFeature }).addTo(map);
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds);
    const count = geojson.features ? geojson.features.length : 0;
    $status.text(`${count} features loaded`);
}

$("#file").on("change", function () {
    const file = this.files?.[0];
    if (!file) return;
    $status.text(`Loading ${file.name}…`);
    const reader = new FileReader();
    reader.onload = () => {
        try {
            loadGeoJSON(JSON.parse(String(reader.result)));
        } catch (err) {
            $status.text(`Error: ${err.message}`);
        }
    };
    reader.onerror = () => { $status.text("Error reading file"); };
    reader.readAsText(file);
});
