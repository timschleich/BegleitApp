export const FEIERTAGE_2026 = [
  { datum: "2026-01-01", name: "Neujahr" },
  { datum: "2026-01-06", name: "Heilige Drei Könige" },
  { datum: "2026-04-03", name: "Karfreitag" },
  { datum: "2026-04-05", name: "Ostersonntag" },
  { datum: "2026-04-06", name: "Ostermontag" },
  { datum: "2026-05-01", name: "Tag der Arbeit" },
  { datum: "2026-05-14", name: "Christi Himmelfahrt" },
  { datum: "2026-05-24", name: "Pfingstsonntag" },
  { datum: "2026-05-25", name: "Pfingstmontag" },
  { datum: "2026-06-04", name: "Fronleichnam" },
  { datum: "2026-08-15", name: "Mariä Himmelfahrt" },
  { datum: "2026-10-03", name: "Tag der Deutschen Einheit" },
  { datum: "2026-11-01", name: "Allerheiligen" },
  { datum: "2026-11-18", name: "Buß- und Bettag" },
  { datum: "2026-12-24", name: "Heiligabend" },
  { datum: "2026-12-25", name: "1. Weihnachtstag" },
  { datum: "2026-12-26", name: "2. Weihnachtstag" },
  { datum: "2026-12-31", name: "Silvester" },
];

export const SCHULFERIEN_2026 = [
  { von: "2026-02-14", bis: "2026-02-22", name: "Winterferien" },
  { von: "2026-02-23", bis: "2026-02-27", name: "Faschingsferien" },
  { von: "2026-03-30", bis: "2026-04-11", name: "Osterferien" },
  { von: "2026-05-26", bis: "2026-06-06", name: "Pfingstferien" },
  { von: "2026-07-30", bis: "2026-09-14", name: "Sommerferien" },
  { von: "2026-10-31", bis: "2026-11-07", name: "Herbstferien" },
  { von: "2026-12-23", bis: "2027-01-09", name: "Weihnachtsferien" },
];

export function istFeiertag(datum) {
  return FEIERTAGE_2026.find(f => f.datum === datum);
}

export function istSchulferien(datum) {
  const d = new Date(datum);
  return SCHULFERIEN_2026.find(f => {
    const von = new Date(f.von);
    const bis = new Date(f.bis);
    return d >= von && d <= bis;
  });
}

export function getTagInfo(datum) {
  const feiertag = istFeiertag(datum);
  const ferien = istSchulferien(datum);
  const wochentag = new Date(datum).getDay();
  const istWE = wochentag === 0 || wochentag === 6;
  if (feiertag) return { frei: true, grund: feiertag.name, typ: "feiertag" };
  if (ferien) return { frei: true, grund: ferien.name, typ: "ferien" };
  if (istWE) return { frei: true, grund: "Wochenende", typ: "wochenende" };
  return { frei: false, grund: null, typ: "arbeitstag" };
}
