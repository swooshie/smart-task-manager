"use client";

import dynamic from "next/dynamic";

type PlacePickerMapProps = {
  latitude?: number;
  longitude?: number;
  onSelect: (selection: {
    name: string;
    latitude: number;
    longitude: number;
  }) => void;
};

const PlacePickerMapInner = dynamic(() => import("./PlacePickerMapInner"), {
  ssr: false,
  loading: () => (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-400">
      Loading map...
    </div>
  ),
});

export default function PlacePickerMap(props: PlacePickerMapProps) {
  return <PlacePickerMapInner {...props} />;
}
