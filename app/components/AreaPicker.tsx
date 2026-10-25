import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Crosshair,
  MapPin,
} from "lucide-react";
import { lookupArea, type Area, type AreaQuery } from "../area";
import Representative from "./Representative";

export default function AreaPicker({
  initial,
  onChoose,
}: {
  initial?: Area | null;
  onChoose: (area: Area) => void;
}) {
  const [address, setAddress] = useState("");
  const [town, setTown] = useState(initial?.label || "");
  const [result, setResult] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<"choice" | "address" | "town">("choice");
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  function chooseMethod(next: "choice" | "address" | "town") {
    requestId.current++;
    controller.current?.abort();
    setBusy(false);
    setError("");
    setResult(null);
    setMethod(next);
  }
  useEffect(
    () => () => {
      requestId.current++;
      controller.current?.abort();
    },
    [],
  );
  async function lookup(input: AreaQuery, version: number) {
    try {
      controller.current?.abort();
      controller.current = new AbortController();
      const area = await lookupArea(input, controller.current.signal);
      if (version === requestId.current) setResult(area);
    } catch (e) {
      if (version === requestId.current)
        setError(
          e instanceof Error && e.name !== "TimeoutError"
            ? e.message
            : "The lookup took too long. Try an address or enter your town.",
        );
    } finally {
      if (version === requestId.current) setBusy(false);
    }
  }
  function gps() {
    if (!navigator.geolocation) {
      setError("Location is unavailable. Enter a public address below.");
      return;
    }
    const version = ++requestId.current;
    setBusy(true);
    setError("");
    setResult(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (version === requestId.current)
          void lookup({ lat: coords.latitude, lng: coords.longitude }, version);
      },
      () => {
        if (version === requestId.current) {
          setBusy(false);
          setError(
            "Location access was unavailable. You can enter an address instead.",
          );
        }
      },
      { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true },
    );
  }
  function findAddress(event: FormEvent) {
    event.preventDefault();
    if (!address.trim()) {
      setError("Enter a public address, city, and state.");
      return;
    }
    const version = ++requestId.current;
    setError("");
    setResult(null);
    setBusy(true);
    void lookup({ address: address.trim() }, version);
  }
  return (
    <div className="area-picker area-picker-calm">
      {!result && (
        <>
          {method === "choice" ? (
            <div className="area-methods">
              <button
                className="area-method area-location"
                onClick={gps}
                disabled={busy}
              >
                <span className="area-method-icon">
                  {busy ? (
                    <span className="spinner" />
                  ) : (
                    <Crosshair size={22} strokeWidth={1.6} />
                  )}
                </span>
                <span>
                  <b>{busy ? "Finding your area…" : "Use my location"}</b>
                </span>
                <ChevronRight size={17} />
              </button>
              <button
                className="area-method"
                onClick={() => chooseMethod("address")}
              >
                <span className="area-method-icon">
                  <MapPin size={22} strokeWidth={1.6} />
                </span>
                <span>
                  <b>Enter an address</b>
                  <small>Library, school, or public place</small>
                </span>
                <ChevronRight size={17} />
              </button>
              <button
                className="text-button area-town-link"
                onClick={() => chooseMethod("town")}
              >
                Just save my town for now
              </button>
            </div>
          ) : (
            <div className="area-entry-panel" key={method}>
              <button
                className="text-button area-back"
                onClick={() => chooseMethod("choice")}
              >
                <ArrowLeft size={15} /> Other options
              </button>
              {method === "address" ? (
                <form onSubmit={findAddress}>
                  <label className="field-label">
                    Public address
                    <input
                      autoComplete="off"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Street address, city, and state"
                      required
                      maxLength={200}
                    />
                  </label>
                  <p className="area-field-hint">
                    Try a library, school, or another nearby public place.
                  </p>
                  <button className="button-primary full" disabled={busy}>
                    {busy ? "Finding your area…" : "Find my representative"}
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (town.trim()) onChoose({ label: town.trim() });
                    else setError("Enter your town and state.");
                  }}
                >
                  <label className="field-label">
                    Town and state
                    <input
                      autoComplete="off"
                      value={town}
                      onChange={(event) => setTown(event.target.value)}
                      required
                      placeholder="Seattle, WA"
                      maxLength={100}
                    />
                  </label>
                  <p className="area-field-hint">
                    You can find your representative later.
                  </p>
                  <button className="button-primary full">
                    Save area <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="area-result" aria-live="polite">
          <div className="area-result-label">
            <MapPin size={15} />
            <b>{result.label}</b>
          </div>
          <Representative area={result} compact />
          <button
            className="button-primary full"
            onClick={() => onChoose(result)}
          >
            Use this area <Check size={16} />
          </button>
          <small>
            Matched using U.S. Census boundaries and the House Clerk directory.
          </small>
          <button
            className="text-button"
            onClick={() => chooseMethod("choice")}
          >
            Try another location
          </button>
        </div>
      )}
    </div>
  );
}
