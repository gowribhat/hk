"use client";

import { useEffect, useState } from "react";

export type ItineraryRow = {
  Day: string;
  Date: string;
  "Start Time": string;
  "End Time": string;
  "Activity / Place": string;
  Area: string;
  Type: string;
  "Estimated Cost (HKD per person)": string;
  Priority: string;
  Notes: string;
  From: string;
  To: string;
  "Travel Mode": string;
};

type Props = {
  items: ItineraryRow[];
};

const STORAGE_KEY = "hk-itinerary-done";

function makeItemKey(day: string, itemIndex: number, title: string) {
  return `${day}::${itemIndex}::${title}`;
}

function formatCost(cost: string): string {
  const value = (cost || "").trim();

  if (!value) return "Not specified";

  if (value === "0") return "Free";

  if (/^already booked$/i.test(value)) return "Already booked";

  if (/^free\b/i.test(value)) return value;

  if (/transport extra/i.test(value)) return "Transport extra";

  if (/variable/i.test(value)) return "Variable";

  if (/^\$/.test(value)) return value;

  if (/^\d/.test(value)) return `HK$${value}`;

  return value;
}

function formatTime(time: string): string {
  if (!time?.trim()) return "";

  const parts = time.trim().split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23
  ) {
    return time;
  }

  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function isFlight(item: ItineraryRow): boolean {
  return (item.Type || "").toLowerCase() === "flight";
}

function isMustDo(priority: string): boolean {
  return (priority || "").trim().toLowerCase() === "must";
}

function createMapsUrl(item: ItineraryRow): string {
  const from = item.From?.trim();
  const to = item.To?.trim();
  const type = (item.Type || "").toLowerCase();
  const travelMode = (item["Travel Mode"] || "").toLowerCase();

  const hasRoute =
    Boolean(from && to) &&
    (type.includes("transport") ||
      type.includes("logistics") ||
      type.includes("flight logistics"));

  if (hasRoute) {
    const mode =
      travelMode === "walking"
        ? "walking"
        : travelMode === "driving"
          ? "driving"
          : "transit";

    return (
      "https://www.google.com/maps/dir/?api=1" +
      `&origin=${encodeURIComponent(from)}` +
      `&destination=${encodeURIComponent(to)}` +
      `&travelmode=${mode}`
    );
  }

  const query = [item["Activity / Place"], item.Area, "Hong Kong"]
    .filter(Boolean)
    .join(", ");

  return (
    "https://www.google.com/maps/search/?api=1" +
    `&query=${encodeURIComponent(query)}`
  );
}

export default function ItineraryClient({ items }: Props) {
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setDoneIds(stored ? JSON.parse(stored) : []);
    } catch {
      setDoneIds([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doneIds));
    } catch {
      // Ignore storage errors in restricted browsers.
    }
  }, [doneIds, ready]);

  const days = Array.from(
    new Set(items.map((item) => item.Day).filter(Boolean))
  );

  useEffect(() => {
    if (!ready || items.length === 0) return;

    const firstIncomplete = items.find((item, index) => {
      const itemKey = makeItemKey(item.Day, index, item["Activity / Place"]);
      return !doneIds.includes(itemKey);
    });

    if (!firstIncomplete) return;

    const firstIncompleteIndex = items.findIndex(
      (item, index) =>
        item.Day === firstIncomplete.Day &&
        index === items.findIndex((candidate) => candidate === firstIncomplete)
    );

    const itemKey = makeItemKey(
      firstIncomplete.Day,
      firstIncompleteIndex,
      firstIncomplete["Activity / Place"]
    );

    const element = document.getElementById(`activity-${itemKey}`);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [doneIds, items, ready]);

  const toggleDone = (itemKey: string) => {
    setDoneIds((current) =>
      current.includes(itemKey)
        ? current.filter((value) => value !== itemKey)
        : [...current, itemKey]
    );
  };

  return (
    <main className="page" id="top">
      <header className="hero">
        <div className="hero-top">
          <span className="trip-label">YOUR TRAVEL COMPANION</span>
          <span className="hero-flower" aria-hidden="true">
            ✳
          </span>
        </div>

        <h1>Hong Kong</h1>

        <p className="subtitle">
          Five days of good food, city walks and little adventures.
        </p>

        <div className="trip-dates">
          <span>Day 1 to Day 5</span>
          <span className="trip-dot">•</span>
          <span>5-day plan</span>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <strong>{days.length}</strong>
            <span>Days</span>
          </div>

          <div className="stat">
            <strong>{items.length}</strong>
            <span>Activities</span>
          </div>

          <div className="stat">
            <strong>{ready ? doneIds.length : 0}</strong>
            <span>Done</span>
          </div>
        </div>
      </header>

      <nav className="day-nav" aria-label="Jump to a day">
        {days.map((day, index) => (
          <a key={day} href={`#day-${index + 1}`}>
            {day}
          </a>
        ))}
      </nav>

      <section className="intro">
        <span className="intro-icon" aria-hidden="true">
          ☀
        </span>

        <div>
          <h2>Your trip, at a glance</h2>
          <p>
            Tap a place to find it on Maps, or get directions
            for journeys with a starting point and destination.
          </p>
        </div>
      </section>

      <div className="itinerary">
        {days.map((day, index) => {
          const dayItems = items.filter((item) => item.Day === day);

          return (
            <section
              className="day-section"
              id={`day-${index + 1}`}
              key={day}
            >
              <div className="day-heading">
                <div className="day-title-group">
                  <span className="day-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <p className="eyebrow">YOUR ITINERARY</p>
                    <h2>{day}</h2>
                  </div>
                </div>
              </div>

              <div className="timeline">
                {dayItems.map((item, itemIndex) => {
                  const flight = isFlight(item);
                  const mustDo = isMustDo(item.Priority);
                  const mapsUrl = createMapsUrl(item);
                  const itemKey = makeItemKey(
                    day,
                    itemIndex,
                    item["Activity / Place"]
                  );
                  const isDone = doneIds.includes(itemKey);

                  const startTime = formatTime(item["Start Time"]);
                  const endTime = formatTime(item["End Time"]);

                  const hasRoute =
                    Boolean(item.From?.trim() && item.To?.trim()) &&
                    !flight;

                  return (
                    <article
                      id={`activity-${itemKey}`}
                      className={`activity ${isDone ? "activity-done" : ""}`}
                      key={itemKey}
                    >
                      <div className="time-column">
                        <span className="time-start">
                          {startTime || "Time TBC"}
                        </span>

                        {endTime && (
                          <span className="time-end">
                            {endTime}
                          </span>
                        )}

                        <span className="timeline-dot" />
                      </div>

                      <div className="activity-card">
                        <div className="card-topline">
                          <span className="type-label">
                            {item.Type || "Activity"}
                          </span>

                          {mustDo && (
                            <span className="priority-label">
                              MUST DO
                            </span>
                          )}
                        </div>

                        <div className="title-row">
                          <h3>{item["Activity / Place"]}</h3>

                          <label className="done-toggle">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleDone(itemKey)}
                              aria-label={`Mark ${item["Activity / Place"]} as done`}
                            />
                            <span>Done</span>
                          </label>
                        </div>

                        {item.Area?.trim() && (
                          <p className="area">
                            <span aria-hidden="true">📍</span>{" "}
                            {item.Area}
                          </p>
                        )}

                        {hasRoute && (
                          <div className="route-box">
                            <div className="route-point">
                              <span className="route-marker from-marker" />
                              <div>
                                <span className="route-caption">
                                  FROM
                                </span>
                                <p>{item.From}</p>
                              </div>
                            </div>

                            <div className="route-connector" />

                            <div className="route-point">
                              <span className="route-marker to-marker" />
                              <div>
                                <span className="route-caption">
                                  TO
                                </span>
                                <p>{item.To}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {item.Notes?.trim() && (
                          <div className="notes">
                            <span
                              className="notes-icon"
                              aria-hidden="true"
                            >
                              ✦
                            </span>

                            <p>{item.Notes}</p>
                          </div>
                        )}

                        <div className="cost-row">
                          <span>Estimated cost</span>
                          <strong>
                            {formatCost(
                              item["Estimated Cost (HKD per person)"]
                            )}
                          </strong>
                        </div>

                        {!flight && (
                          <a
                            className="map-link"
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span aria-hidden="true">
                              {hasRoute ? "↗" : "⌖"}
                            </span>

                            {hasRoute
                              ? "Get directions"
                              : "Open in Google Maps"}
                          </a>
                        )}

                        {flight && (
                          <div className="flight-note">
                            <span aria-hidden="true">✈</span>
                            Flight details — check your booking
                            confirmation.
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="footer">
        <span className="footer-flower" aria-hidden="true">
          ✳
        </span>

        <p>Made for your Hong Kong adventure.</p>

        <p className="footer-small">
          Costs, routes and timings are estimates. Check opening
          hours and transport information before travelling.
        </p>

        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
