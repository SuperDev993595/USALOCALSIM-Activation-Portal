/** Roaming destinations included with Three UK pre-loaded data plans. */
export type ThreeUkCountryGroup = {
  letter: string;
  countries: string[];
};

export const THREE_UK_COVERED_COUNTRY_GROUPS: ThreeUkCountryGroup[] = [
  { letter: "A", countries: ["Aland Islands", "Australia", "Austria", "Azores"] },
  { letter: "B", countries: ["Balearic Islands", "Belgium", "Brazil", "Bulgaria"] },
  {
    letter: "C",
    countries: ["Canary Islands", "Chile", "Colombia", "Costa Rica", "Croatia", "Cyprus", "Czech Republic"],
  },
  { letter: "D", countries: ["Denmark"] },
  { letter: "E", countries: ["El Salvador", "Estonia"] },
  { letter: "F", countries: ["Finland", "France", "French Guiana", "French West Indies"] },
  { letter: "G", countries: ["Germany", "Gibraltar", "Greece", "Guadeloupe", "Guatemala"] },
  { letter: "H", countries: ["Guernsey", "Hong Kong", "Hungary"] },
  {
    letter: "I",
    countries: ["Iceland", "Indonesia", "Ireland", "Isle of Man", "Israel", "Italy"],
  },
  { letter: "J", countries: ["Jersey"] },
  { letter: "L", countries: ["Latvia", "Liechtenstein", "Lithuania", "Luxembourg"] },
  {
    letter: "M",
    countries: [
      "Macau",
      "Madeira",
      "Malta",
      "Martinique",
      "Mayotte",
      "Netherlands",
      "New Zealand",
      "Nicaragua",
      "Norway",
    ],
  },
  { letter: "P", countries: ["Panama", "Peru", "Poland", "Portugal"] },
  { letter: "R", countries: ["Reunion", "Romania"] },
  {
    letter: "S",
    countries: [
      "Saint Barthélemy",
      "Saint Martin",
      "San Marino",
      "Singapore",
      "Slovakia",
      "Slovenia",
      "Spain",
      "Sri Lanka",
      "Sweden",
      "Switzerland",
    ],
  },
  { letter: "U", countries: ["United States (USA)", "Uruguay", "US Virgin Islands"] },
  { letter: "V", countries: ["Vatican City", "Vietnam"] },
];

export const THREE_UK_COVERED_COUNTRY_COUNT = THREE_UK_COVERED_COUNTRY_GROUPS.reduce(
  (sum, group) => sum + group.countries.length,
  0,
);

export function formatThreeUkCountryGroup(group: ThreeUkCountryGroup): string {
  return `${group.letter}: ${group.countries.join(", ")}`;
}
