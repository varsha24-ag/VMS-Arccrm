type CsvValue = string | number | boolean | null | undefined;

function escapeCsvValue(value: CsvValue) {
  if (value === null || value === undefined) return "";
  const raw = String(value);
  const shouldQuote = /[",\n\r]/.test(raw);
  const escaped = raw.replaceAll('"', '""');
  return shouldQuote ? `"${escaped}"` : escaped;
}

export function buildCsv<T extends Record<string, CsvValue>>(
  rows: T[],
  options: {
    headers?: Array<{ key: keyof T; label: string }>;
  } = {}
) {
  const headers = options.headers ?? (Object.keys(rows[0] ?? {}) as Array<keyof T>).map((key) => ({ key, label: String(key) }));
  const headerLine = headers.map((h) => escapeCsvValue(h.label)).join(",");
  const lines = rows.map((row) => headers.map((h) => escapeCsvValue(row[h.key])).join(","));
  return [headerLine, ...lines].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

