/** Roaming destinations for Orange Europe ULTRA bundles (41 countries). */
export type OrangeEuropeCountryGroup = {
  letter: string;
  countries: string[];
};

export const ORANGE_EUROPE_COVERED_COUNTRY_GROUPS: OrangeEuropeCountryGroup[] = [
  { letter: "A", countries: ["Aland Islands", "Andorra", "Austria"] },
  { letter: "B", countries: ["Belgium", "Bulgaria"] },
  { letter: "C", countries: ["Croatia", "Cyprus", "Czech Republic"] },
  { letter: "D", countries: ["Denmark"] },
  { letter: "E", countries: ["Estonia"] },
  { letter: "F", countries: ["Faroe Islands", "Finland", "France"] },
  { letter: "G", countries: ["Germany", "Gibraltar", "Greece", "Guernsey"] },
  { letter: "H", countries: ["Hungary"] },
  { letter: "I", countries: ["Iceland", "Ireland", "Isle of Man", "Italy"] },
  { letter: "J", countries: ["Jersey"] },
  { letter: "L", countries: ["Latvia", "Liechtenstein", "Lithuania", "Luxembourg"] },
  { letter: "M", countries: ["Malta"] },
  { letter: "N", countries: ["Netherlands", "Norway"] },
  { letter: "P", countries: ["Poland", "Portugal"] },
  { letter: "R", countries: ["Romania"] },
  { letter: "S", countries: ["San Marino", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland"] },
  { letter: "U", countries: ["United Kingdom"] },
  { letter: "V", countries: ["Vatican City"] },
];

export const ORANGE_EUROPE_COVERED_COUNTRY_COUNT = ORANGE_EUROPE_COVERED_COUNTRY_GROUPS.reduce(
  (sum, group) => sum + group.countries.length,
  0,
);
