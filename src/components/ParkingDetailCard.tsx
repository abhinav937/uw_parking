import { useState } from 'react';
import { Share2, X, Navigation } from 'lucide-react';
import { formatAvailability, getAvailabilityColor } from '../design';
import type { ParkingFacility } from '../types';

interface ParkingDetailCardProps {
  facility: ParkingFacility | null;
  onClose: () => void;
}

export function ParkingDetailCard({ facility, onClose }: ParkingDetailCardProps) {
  const [copied, setCopied] = useState(false);

  if (!facility) return null;

  const color = getAvailabilityColor(facility.availability);
  const value = formatAvailability(facility.availability);
  const isNumeric = typeof facility.availability === 'number';

  const handleNavigate = () => {
    const { lat, lng } = facility.centroid;
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { lat, lng } = facility.centroid;
    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: facility.name,
          text: `${facility.name} (${facility.code}) — navigate to parking`,
          url: mapsUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(mapsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="parking-detail-sheet" role="dialog" aria-label={`Parking details for ${facility.code}`}>
      {/* Tesla-style grab handle */}
      <div className="sheet-grab" />

      <button
        className="sheet-close"
        onClick={onClose}
        aria-label="Close details"
        type="button"
      >
        <X size={16} />
      </button>

      <div className="sheet-header">
        <div className="sheet-code" style={{ color }}>
          {facility.code}
        </div>
        <div className="sheet-name">{facility.name}</div>
        <div className="sheet-region">{facility.region} • {facility.type}</div>
      </div>

      <div className="sheet-availability">
        <div className="sheet-value" style={{ color }}>
          {value}
        </div>
        <div className="sheet-meta">
          {isNumeric ? 'SPOTS OPEN' : value === 'Full' ? 'CURRENTLY FULL' : 'STATUS'}
        </div>
      </div>

      <div className="sheet-actions">
        <button
          className="sheet-btn primary"
          onClick={handleNavigate}
          type="button"
        >
          <Navigation size={15} />
          <span>Navigate</span>
        </button>
        <button
          className="sheet-btn"
          onClick={handleShare}
          type="button"
        >
          <Share2 size={15} />
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      <div className="sheet-hint">
        Tap map to dismiss
      </div>
    </div>
  );
}
