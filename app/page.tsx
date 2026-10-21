
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import ItineraryClient from "./itinerary-client";

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

function getItinerary(): ItineraryRow[] {
  const filePath = path.join(process.cwd(), "data", "itinerary.csv");
  const csv = fs.readFileSync(filePath, "utf8");

  const parsed = Papa.parse<ItineraryRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    console.warn("CSV parsing warnings:", parsed.errors);
  }

  let currentDay = "";
  let currentDate = "";

  return parsed.data
    .map((row) => {
      if (row.Day?.trim()) {
        currentDay = row.Day.trim();
      }

      if (row.Date?.trim()) {
        currentDate = row.Date.trim();
      }

      return {
        ...row,
        Day: currentDay,
        Date: currentDate,
      };
    })
    .filter((row) => row["Activity / Place"]?.trim());
}

export default function Home() {
  const items = getItinerary();

  return <ItineraryClient items={items} />;
}
