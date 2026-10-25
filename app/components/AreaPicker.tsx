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
  // The button someone pressed disappears when the panel changes, so move
  // focus to the start of what replaced it instead of losing it.
  const root = useRef<HTMLDivElement>(null);
  const focusNext = useRef(false);
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    root.current
      ?.querySelector<HTMLElement>("[data-autofocus]")
      ?.focus({ preventScroll: false });
  }, [method, result]);
  function chooseMethod(next: "choice" | "address" | "town") {
    focusNext.current = true;
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
      if (version === requestId.current) {
        focusNext.current = true;
        setResult(area);
      }
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
    <div className="area-picker area-picker-calm" ref={root}>
      <p className="sr-only" role="status">
        {busy ? "Finding your area…" : ""}
      </p>
      {!result && (
        <>
          {method === "choice" ? (
            <div className="area-methods">
              <button
                className="area-method area-location"
                data-autofocus
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
                  <small>Fastest if you’re there now</small>
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
                      data-autofocus
                      autoComplete="off"
                      aria-describedby="area-address-hint"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Street address, city, and state"
                      required
                      maxLength={200}
                    />
                  </label>
                  <p className="area-field-hint" id="area-address-hint">
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
                      data-autofocus
                      autoComplete="off"
                      aria-describedby="area-town-hint"
                      value={town}
                      onChange={(event) => setTown(event.target.value)}
                      required
                      placeholder="Seattle, WA"
                      maxLength={100}
                    />
                  </label>
                  <p className="area-field-hint" id="area-town-hint">
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
        <div className="area-result">
          <h3 className="area-result-label" tabIndex={-1} data-autofocus>
            <MapPin size={15} aria-hidden="true" />
            {result.label}
          </h3>
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
