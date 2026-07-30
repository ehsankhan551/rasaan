"use client";

import { useRef, useState, useTransition } from "react";
import { bulkUpsertProducts } from "./actions";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_qty: number;
  active: boolean;
  image_url: string | null;
  category: string;
  generic_name: string | null;
};

const HEADERS = ["name", "description", "price", "stock_qty", "image_url", "category", "generic_name", "active"] as const;

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(products: Product[]): string {
  const lines = [HEADERS.join(",")];
  for (const p of products) {
    const row = [
      p.name,
      p.description ?? "",
      String(p.price),
      String(p.stock_qty),
      p.image_url ?? "",
      p.category ?? "",
      p.generic_name ?? "",
      p.active ? "true" : "false",
    ].map((v) => csvEscape(String(v)));
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export default function ImportExportBar({ products }: { products: Product[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleExport() {
    const csv = toCsv(products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const rows = parseCsv(text);
      if (rows.length < 2) {
        setMessage("No product rows found in that file.");
        return;
      }

      const header = rows[0].map((h) => h.trim().toLowerCase());
      const idx = (key: string) => header.indexOf(key);

      const nameIdx = idx("name");
      const descIdx = idx("description");
      const priceIdx = idx("price");
      const stockIdx = idx("stock_qty");
      const imageIdx = idx("image_url");
      const categoryIdx = idx("category");
      const genericIdx = idx("generic_name");
      const activeIdx = idx("active");

      if (nameIdx === -1 || priceIdx === -1) {
        setMessage('CSV must have at least "name" and "price" columns.');
        return;
      }

      const parsedRows = rows.slice(1).map((cols) => ({
        name: cols[nameIdx] ?? "",
        description: descIdx !== -1 ? cols[descIdx] ?? "" : "",
        price: Number(cols[priceIdx] ?? 0),
        stock_qty: stockIdx !== -1 ? Number(cols[stockIdx] ?? 0) : 0,
        image_url: imageIdx !== -1 ? cols[imageIdx] ?? "" : "",
        category: categoryIdx !== -1 ? cols[categoryIdx] ?? "" : "",
        generic_name: genericIdx !== -1 ? cols[genericIdx] ?? "" : "",
        active: activeIdx !== -1 ? cols[activeIdx]?.trim().toLowerCase() !== "false" : true,
      }));

      startTransition(async () => {
        const result = await bulkUpsertProducts(parsedRows);
        if (result) {
          setMessage(
            `Imported: ${result.inserted} added, ${result.updated} updated${
              result.skipped ? `, ${result.skipped} skipped` : ""
            }.`
          );
        }
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button
        onClick={handleExport}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold"
      >
        Export CSV
      </button>
      <button
        disabled={pending}
        onClick={handleImportClick}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Importing..." : "Import CSV"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden"
      />
      {message && <p className="text-xs text-gray-500">{message}</p>}
    </div>
  );
}
