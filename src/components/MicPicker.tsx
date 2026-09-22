import { useCallback, useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { NBBadge } from "@/components/nb";
import { looksLikeMiclessSpeaker } from "@/lib/capture-gain";
import { getSavedMicDeviceId, saveMicDeviceId } from "@/lib/mic-prefs";
import { cn } from "@/lib/utils";

interface MicDeviceInfo {
  deviceId: string;
  label: string;
}

/**
 * Mic input selector for the capture pages.
 *
 * Device labels only appear once the site holds mic permission, so the
 * list populates after the first granted take; before that it offers a
 * single "Default" entry. The choice persists and is passed into
 * capture.start() as an exact deviceId constraint.
 */
export function MicPicker({
  activeLabel,
  className,
}: {
  /** Label of the device the last take actually used ("" if none yet). */
  activeLabel: string;
  className?: string;
}) {
  const [devices, setDevices] = useState<MicDeviceInfo[]>([]);
  const [selected, setSelected] = useState<string>(
    () => getSavedMicDeviceId() ?? "",
  );

  // The saved device id clamped to what's actually plugged in — an id for an
  // unplugged device is treated as "Default input" (derived during render;
  // no cascading setState effect).
  const clampedSelected =
    selected && devices.length > 0 && !devices.some((d) => d.deviceId === selected)
      ? ""
      : selected;

  // Persist the clamp: if the saved device has been unplugged since, drop the
  // stale id from storage — otherwise start() would still request it.
  useEffect(() => {
    if (clampedSelected === selected) return;
    saveMicDeviceId(null);
  }, [clampedSelected, selected]);

  const enumerate = useCallback(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((all) =>
        setDevices(
          all
            .filter((d) => d.kind === "audioinput")
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || `Microphone ${d.deviceId.slice(0, 5)}…`,
            })),
        ),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    enumerate();
    // Devices plug in and out; refresh while the picker is mounted.
    navigator.mediaDevices?.addEventListener?.("devicechange", enumerate);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", enumerate);
    };
  }, [enumerate]);

  const choose = (deviceId: string) => {
    setSelected(deviceId);
    saveMicDeviceId(deviceId || null);
  };

  if (devices.length === 0 && !activeLabel) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <NBBadge className="bg-paper">
        <Mic className="size-3" /> Mic
      </NBBadge>
      <select
        value={clampedSelected}
        onChange={(e) => choose(e.target.value)}
        className="nb max-w-[220px] bg-card px-2 py-1.5 text-xs font-bold"
        aria-label="Microphone input"
      >
        <option value="">Default input</option>
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label}
          </option>
        ))}
      </select>
      {activeLabel && (
        <span className="max-w-[220px] truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Last used: {activeLabel}
        </span>
      )}
      {activeLabel && looksLikeMiclessSpeaker(activeLabel) && (
        <p className="nb w-full bg-sun px-2.5 py-2 text-xs font-medium">
          “{activeLabel}” looks like a Bluetooth speaker — most can't record.
          If the next take comes back empty, power the speaker off or switch
          your phone's audio output back to the phone, then record.
        </p>
      )}
    </div>
  );
}
