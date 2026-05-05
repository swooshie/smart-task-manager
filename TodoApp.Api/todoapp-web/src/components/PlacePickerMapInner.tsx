"use client";

import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

type SearchResult = {
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

type PlacePickerMapInnerProps = {
  latitude?: number;
  longitude?: number;
  onSelect: (selection: {
    name: string;
    latitude: number;
    longitude: number;
  }) => void;
};

function MapClickHandler({
  onSelect,
}: {
  onSelect: (selection: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function MapViewportSync({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: false });

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [latitude, longitude, map]);

  return null;
}

function MapResizeFix() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const runInvalidate = () => {
      map.invalidateSize();
    };

    runInvalidate();

    const timers = [
      window.setTimeout(runInvalidate, 100),
      window.setTimeout(runInvalidate, 300),
      window.setTimeout(runInvalidate, 700),
    ];

    const observer = new ResizeObserver(() => {
      runInvalidate();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [map]);

  return null;
}

export default function PlacePickerMapInner({
  latitude,
  longitude,
  onSelect,
}: PlacePickerMapInnerProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    latitude: latitude ?? 37.7749,
    longitude: longitude ?? -122.4194,
  });

  useEffect(() => {
    if (typeof latitude === "number" && typeof longitude === "number") {
      setMapCenter({ latitude, longitude });
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        // Keep the default center if the user denies location or it is unavailable.
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [latitude, longitude]);

  const selectedLatitude = latitude ?? mapCenter.latitude;
  const selectedLongitude = longitude ?? mapCenter.longitude;

  async function handleSearch() {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      const query = new URLSearchParams({
        q: search,
        format: "jsonv2",
        limit: "5",
        addressdetails: "1",
        bounded: "1",
        viewbox: [
          selectedLongitude - 0.15,
          selectedLatitude + 0.15,
          selectedLongitude + 0.15,
          selectedLatitude - 0.15,
        ].join(","),
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${query.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = (await response.json()) as SearchResult[];
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
          placeholder="Search for a place"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSearch();
            }
          }}
        />

        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={searching}
          className="rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-neutral-100 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {searching ? "Searching..." : "Search map"}
        </button>
      </div>

      {results.length > 0 ? (
        <div className="space-y-2">
          {results.map((result) => (
            <button
              key={`${result.lat}-${result.lon}-${result.display_name}`}
              type="button"
              onClick={() =>
                onSelect({
                  name: buildPrimaryLabel(result),
                  latitude: Number(result.lat),
                  longitude: Number(result.lon),
                })
              }
              className="block w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-left text-sm text-neutral-200 transition hover:bg-neutral-900"
            >
              <span className="block text-sm font-medium text-white">
                {buildPrimaryLabel(result)}
              </span>
              <span className="mt-1 block text-xs text-neutral-400">
                {buildSecondaryLabel(result)}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-neutral-800">
        <MapContainer
          center={[selectedLatitude, selectedLongitude]}
          zoom={13}
          scrollWheelZoom
          className="h-72 w-full"
        >
          <MapResizeFix />

          <MapViewportSync
            latitude={selectedLatitude}
            longitude={selectedLongitude}
          />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            onSelect={({ latitude: nextLatitude, longitude: nextLongitude }) =>
              onSelect({
                name: "Pinned location",
                latitude: nextLatitude,
                longitude: nextLongitude,
              })
            }
          />

          <CircleMarker
            center={[selectedLatitude, selectedLongitude]}
            pathOptions={{
              color: "#f5f5f5",
              fillColor: "#f5f5f5",
              fillOpacity: 0.85,
            }}
            radius={10}
          >
            <Popup>Selected place</Popup>
          </CircleMarker>
        </MapContainer>
      </div>

      <p className="text-xs text-neutral-500">
        Search for a place or click on the map to drop a pin and auto-fill coordinates.
      </p>
    </div>
  );
}

function buildPrimaryLabel(result: SearchResult) {
  const candidate = result.name?.trim();
  if (candidate) {
    return candidate;
  }

  return result.display_name.split(",")[0]?.trim() || "Selected place";
}

function buildSecondaryLabel(result: SearchResult) {
  const address = result.address;
  if (!address) {
    return result.display_name;
  }

  return [
    address.road,
    address.suburb,
    address.city || address.town || address.village,
    address.state,
  ]
    .filter(Boolean)
    .join(", ");
}
