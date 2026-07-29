"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  VendingTag,
  shelfLayout,
  type VendableProduct,
  type QueueItem,
} from "@/lib/vending-shared";
import {
  holt,
  fieldInput,
  fieldLabel,
  btnGhost,
  btnGradient,
  btnSecondary,
  btnDanger,
  dashStatus,
  modalBackdrop,
  modal,
  modalTitle,
  modalActions,
  emptyState,
  emptyStateMono,
} from "@/lib/ui";

const LEGACY_ADMIN_URL = "https://vend.makeuoa.nz/admin";

const SECTION =
  "bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] p-5 md:p-7 mb-10";
const TH =
  "text-left px-3 py-2.5 text-[10px] font-bold tracking-[0.12em] uppercase text-ink bg-paper-2 border-b-2 border-black whitespace-nowrap";
const TD = "px-3 py-2.5 border-b border-black/10 align-middle text-sm";
const TAG_CHIP =
  "inline-flex items-center px-2 py-px rounded-full border-2 border-black bg-pop-violet text-white text-[9px] font-bold tracking-[0.06em] uppercase";
const SMALL_BTN =
  "inline-flex items-center justify-center px-3 py-0.5 rounded-full font-semibold text-[11px] border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-[transform,box-shadow] duration-100 disabled:opacity-50";

interface Stats {
  completedPayments: number;
  totalValue: number;
  topItems: {
    product_id: string;
    product_name: string;
    count: number;
    total: number;
    actual_total: number;
  }[];
}

interface AdminData {
  products: VendableProduct[];
  queue: QueueItem[];
  stats: Stats;
  startDate: string;
}

const nzd = (n: number) =>
  n.toLocaleString("en-NZ", { style: "currency", currency: "NZD" });

const dateToInput = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${`0${d.getMonth() + 1}`.slice(-2)}-${`0${d.getDate()}`.slice(-2)}`;
};

function Meter({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-24 bg-paper-3 rounded-full overflow-hidden mt-1">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function VendingAdminPanel() {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [editing, setEditing] = useState<VendableProduct | null>(null);
  const [replacing, setReplacing] = useState<{
    slot: string;
    oldProduct?: VendableProduct;
  } | null>(null);

  const token = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }, []);

  const load = useCallback(
    async (startDate?: string) => {
      setDataLoading(true);
      setError(null);
      try {
        const qs = startDate ? `?startDate=${encodeURIComponent(startDate)}` : "";
        const res = await fetch(`/api/vending/admin${qs}`, {
          headers: { Authorization: `Bearer ${await token()}` },
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to load");
        setData(body);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setDataLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    load();
  }, [load]);

  async function act(fields: Record<string, string>, file?: File | null) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      for (const [k, v] of Object.entries(fields)) form.append(k, v);
      if (file) form.append("image", file);
      if (data?.startDate) form.append("startDate", data.startDate);
      const res = await fetch("/api/vending/admin", {
        method: "POST",
        headers: { Authorization: `Bearer ${await token()}` },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Action failed");
      setData(body);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const stats = data?.stats;
  const topItem = stats?.topItems[0];
  const activeProducts = data?.products.filter((p) => p.active) ?? [];

  return (
    <div>
      {error && (
        <div className="mb-6 border-2 border-black bg-pop-red text-white font-semibold px-4 py-2.5 rounded-[6px] shadow-[2px_2px_0px_0px_#000]">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className={SECTION}>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <h2 className={`${holt} text-xl md:text-2xl text-pop-violet m-0`}>
            Sales
          </h2>
          <label className="flex flex-col gap-1">
            <span className={fieldLabel}>Since</span>
            <input
              type="date"
              className={`${fieldInput} w-auto`}
              value={data ? dateToInput(data.startDate) : ""}
              onChange={(e) => {
                if (e.target.value) load(e.target.value);
              }}
            />
          </label>
        </div>
        {dataLoading || !data ? (
          <p className="font-semibold text-ink-2 m-0">Loading…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-2 border-black rounded-[6px] p-4 bg-paper-2">
              <p className="m-0 text-[10.5px] font-bold tracking-[0.08em] uppercase text-ink-2">
                Total Sales
              </p>
              <p className="m-0 text-3xl font-bold">
                {nzd(stats?.totalValue ?? 0)}
              </p>
              <p className="m-0 text-xs font-semibold text-ink-2">
                From {stats?.completedPayments ?? 0} purchases since{" "}
                {new Date(data.startDate).toLocaleDateString("en-NZ")}
              </p>
            </div>
            <div className="border-2 border-black rounded-[6px] p-4 bg-paper-2">
              <p className="m-0 text-[10.5px] font-bold tracking-[0.08em] uppercase text-ink-2">
                Most Sold
              </p>
              {topItem ? (
                <>
                  <p className="m-0 text-3xl font-bold truncate">
                    {topItem.product_name}
                  </p>
                  <p className="m-0 text-xs font-semibold text-ink-2">
                    {topItem.count} purchases totalling {nzd(topItem.total)}
                  </p>
                </>
              ) : (
                <>
                  <p className="m-0 text-3xl font-bold">Nothing sold :D</p>
                  <p className="m-0 text-xs font-semibold text-ink-2">
                    Once you&apos;ve sold something, it&apos;ll show up here.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Queue */}
      <div className={SECTION}>
        <h2 className={`${holt} text-xl md:text-2xl text-pop-violet mt-0 mb-1`}>
          Queued Items
        </h2>
        <p className="text-xs font-semibold text-ink-2 mt-0 mb-4">
          The machine dispenses these automatically. If something has gone
          wrong you can manually complete (charges the card) or cancel
          (refunds the hold) a transaction here.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={TH}>#</th>
                <th className={TH}>Product</th>
                <th className={TH}>Location</th>
                <th className={TH}>Qty</th>
                <th className={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.queue ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className={`${TD} text-center font-semibold`}>
                    No items in queue!
                  </td>
                </tr>
              )}
              {(data?.queue ?? []).map((item, idx) => (
                <tr key={item.id}>
                  <td className={TD}>{idx + 1}</td>
                  <td className={`${TD} font-semibold`}>
                    {item.product_name ?? `free:${item.id}`}
                    {item.free && (
                      <span className={`${dashStatus} bg-pop-blue text-white ml-2`}>
                        Free
                      </span>
                    )}
                  </td>
                  <td className={TD}>{item.shelf_loc}</td>
                  <td className={TD}>{item.quantity ?? 1}</td>
                  <td className={`${TD} whitespace-nowrap`}>
                    <div className="flex gap-2">
                      <button
                        disabled={busy}
                        className={`${SMALL_BTN} bg-pop-violet text-white`}
                        onClick={() => {
                          if (
                            window.confirm(
                              item.free
                                ? "Mark this free item as dispensed?"
                                : "Complete this transaction and charge the card?",
                            )
                          )
                            act({ action: "complete", id: item.id });
                        }}
                      >
                        {item.free ? "Done" : "Done — charge card"}
                      </button>
                      {!item.free && (
                        <button
                          disabled={busy}
                          className={`${SMALL_BTN} bg-pop-red text-white`}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Cancel this transaction and release the hold?",
                              )
                            )
                              act({ action: "cancel", id: item.id });
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] font-semibold text-ink-2 mt-3 mb-0">
          Need to manually vend an arbitrary slot (keypad)? That still lives
          in the{" "}
          <a className="underline" href={LEGACY_ADMIN_URL}>
            legacy admin
          </a>
          .
        </p>
      </div>

      {/* Shelf view */}
      <div className={SECTION}>
        <h2 className={`${holt} text-xl md:text-2xl text-pop-violet mt-0 mb-4`}>
          Shelf View
        </h2>
        <div className="flex flex-col gap-3">
          {shelfLayout.map((shelf, rowIdx) => (
            <div
              key={rowIdx}
              className="grid grid-flow-col auto-cols-[minmax(10rem,1fr)] gap-3 overflow-x-auto bg-paper-3 border-2 border-black rounded-[6px] p-3"
            >
              {shelf.map((slot) => {
                const product = activeProducts.find(
                  (p) => p.shelf_loc === slot,
                );
                return product ? (
                  <div
                    key={slot}
                    className="relative bg-white border-2 border-black rounded-[6px] p-2.5 flex flex-col gap-1.5 min-h-[9rem]"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`${dashStatus} bg-white`}>{slot}</span>
                      {product.image && (
                        <Image
                          src={product.image}
                          alt=""
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-[4px] border-2 border-black object-cover ml-auto"
                        />
                      )}
                    </div>
                    <p className="m-0 text-[13px] font-bold leading-tight">
                      {product.name}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <span className={`${TAG_CHIP} bg-white text-black`}>
                        {product.price === null
                          ? "Any"
                          : `$${product.price.toFixed(2)}`}
                      </span>
                      {product.tags.map((tag) => (
                        <span key={tag} className={TAG_CHIP}>
                          {tag}
                        </span>
                      ))}
                      {product.stock !== undefined && product.stock <= 0 && (
                        <span className={`${TAG_CHIP} bg-pop-red`}>
                          Out of stock
                        </span>
                      )}
                    </div>
                    <div className="mt-auto flex gap-1.5 pt-1">
                      <button
                        disabled={busy}
                        className={`${SMALL_BTN} bg-white`}
                        onClick={() =>
                          setReplacing({ slot, oldProduct: product })
                        }
                      >
                        Replace
                      </button>
                      <button
                        disabled={busy}
                        className={`${SMALL_BTN} bg-pop-violet text-white`}
                        onClick={() => setEditing(product)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={slot}
                    className="border-2 border-dashed border-black rounded-[6px] p-2.5 flex flex-col items-center justify-center gap-2 min-h-[9rem] bg-white/60"
                  >
                    <span className={`${dashStatus} bg-pop-red text-white`}>
                      {slot}: Empty
                    </span>
                    <button
                      disabled={busy}
                      className={`${SMALL_BTN} bg-white`}
                      onClick={() => setReplacing({ slot })}
                    >
                      Add Product
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* All products */}
      <div className={SECTION}>
        <h2 className={`${holt} text-xl md:text-2xl text-pop-violet mt-0 mb-4`}>
          All Products
        </h2>
        {data && (
          <ProductTable data={data} busy={busy} onEdit={(p) => setEditing(p)} />
        )}
        {!data && dataLoading && (
          <p className="font-semibold text-ink-2 m-0">Loading…</p>
        )}
      </div>

      {!dataLoading && data && data.products.length === 0 && (
        <div className={emptyState}>
          <p className={emptyStateMono}>No vendable products found</p>
        </div>
      )}

      {editing && (
        <EditModal
          product={editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={async (fields, file) => {
            const ok = await act({ action: "saveProduct", ...fields }, file);
            if (ok) setEditing(null);
          }}
          onDispense={async () => {
            if (
              window.confirm(
                "Immediately dispense this product for free from the machine?",
              )
            ) {
              const ok = await act({ action: "dispenseProduct", id: editing.id });
              if (ok) setEditing(null);
            }
          }}
        />
      )}

      {replacing && (
        <ReplaceModal
          slot={replacing.slot}
          oldProduct={replacing.oldProduct}
          products={data?.products ?? []}
          busy={busy}
          onClose={() => setReplacing(null)}
          onConfirm={async (newID) => {
            const fields: Record<string, string> = {
              action: "activateProduct",
              newID,
              slot: replacing.slot,
            };
            if (replacing.oldProduct) fields.oldID = replacing.oldProduct.id;
            const ok = await act(fields);
            if (ok) setReplacing(null);
          }}
        />
      )}
    </div>
  );
}

/* ── All-products table with sortable columns ──────────────────────────── */

type SortKey = "loc" | "total" | "income" | "count" | "stock";

function ProductTable({
  data,
  busy,
  onEdit,
}: {
  data: AdminData;
  busy: boolean;
  onEdit: (p: VendableProduct) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("loc");
  const topItems = data.stats.topItems;
  const item = (id: string) => topItems.find((t) => t.product_id === id);

  const soldSum = data.products.reduce(
    (acc, p) => acc + (item(p.id)?.total || 0),
    0,
  );
  const soldNum = data.products.reduce(
    (acc, p) => acc + (item(p.id)?.count || 0),
    0,
  );

  const sorted = useMemo(() => {
    const arr = [...data.products];
    switch (sortKey) {
      case "loc":
        return arr.sort((a, b) =>
          (a.shelf_loc || "").localeCompare(b.shelf_loc || ""),
        );
      case "total":
        return arr.sort(
          (a, b) => (item(b.id)?.total || 0) - (item(a.id)?.total || 0),
        );
      case "income":
        return arr.sort(
          (a, b) =>
            (item(b.id)?.actual_total || 0) - (item(a.id)?.actual_total || 0),
        );
      case "count":
        return arr.sort(
          (a, b) => (item(b.id)?.count || 0) - (item(a.id)?.count || 0),
        );
      case "stock":
        return arr.sort(
          (a, b) => (a.stock ?? Infinity) - (b.stock ?? Infinity),
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.products, sortKey, topItems]);

  const sortBtn = (key: SortKey, label: string) => (
    <button
      className={`uppercase tracking-[0.12em] text-[10px] font-bold ${sortKey === key ? "text-pop-magenta" : ""}`}
      onClick={() => setSortKey(key)}
    >
      {label} {sortKey === key ? "▾" : ""}
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={TH}>{sortBtn("loc", "Location")}</th>
            <th className={TH}>Product</th>
            <th className={TH}>Price</th>
            <th className={TH}>{sortBtn("total", "$ Sold")}</th>
            <th className={TH}>{sortBtn("income", "$ Income")}</th>
            <th className={TH}>{sortBtn("count", "# Sold")}</th>
            <th className={TH}>{sortBtn("stock", "Stock")}</th>
            <th className={TH}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={8} className={`${TD} text-center font-semibold`}>
                No Products!
              </td>
            </tr>
          )}
          {sorted.map((product) => (
            <tr key={product.id} className={product.active ? "" : "opacity-60"}>
              <td className={TD}>{product.shelf_loc}</td>
              <td className={TD}>
                <div className="flex items-center gap-2.5 min-w-[14rem]">
                  {product.image && (
                    <Image
                      src={product.image}
                      alt=""
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-[4px] border-2 border-black object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="m-0 font-bold leading-tight">
                      {product.name}
                      {!product.active && (
                        <span className={`${dashStatus} bg-paper-2 ml-2`}>
                          Archived
                        </span>
                      )}
                    </p>
                    <p className="m-0 text-xs text-ink-2 max-w-[24ch] truncate">
                      {product.description || ""}
                    </p>
                  </div>
                </div>
              </td>
              <td className={TD}>
                {product.price === null ? "Any" : nzd(product.price)}
              </td>
              <td className={TD}>
                {nzd(item(product.id)?.total || 0)}
                <Meter
                  value={item(product.id)?.total || 0}
                  max={soldSum}
                  color="bg-pop-blue"
                />
              </td>
              <td className={TD}>
                {nzd(item(product.id)?.actual_total || 0)}
                <Meter
                  value={item(product.id)?.actual_total || 0}
                  max={soldSum}
                  color="bg-pop-violet"
                />
              </td>
              <td className={TD}>
                {item(product.id)?.count || 0}
                <Meter
                  value={item(product.id)?.count || 0}
                  max={soldNum}
                  color="bg-pop-magenta"
                />
              </td>
              <td className={TD}>
                {product.stock ?? "∞"}
                <Meter
                  value={product.stock ?? 10}
                  max={10}
                  color="bg-pop-pink"
                />
              </td>
              <td className={TD}>
                <button
                  disabled={busy}
                  className={`${SMALL_BTN} bg-pop-violet text-white`}
                  onClick={() => onEdit(product)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Edit product modal ────────────────────────────────────────────────── */

function EditModal({
  product,
  busy,
  onClose,
  onSave,
  onDispense,
}: {
  product: VendableProduct;
  busy: boolean;
  onClose: () => void;
  onSave: (fields: Record<string, string>, file: File | null) => void;
  onDispense: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [stock, setStock] = useState(
    product.stock !== undefined ? String(product.stock) : "",
  );
  const [shelfLoc, setShelfLoc] = useState(product.shelf_loc ?? "");
  const [price, setPrice] = useState(product.price?.toFixed(2) ?? "0.00");
  const [tags, setTags] = useState<Set<VendingTag>>(new Set(product.tags));
  const [archived, setArchived] = useState(!product.active);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(product.image);
  const [deleteImage, setDeleteImage] = useState(false);

  function pickFile(f: File | null) {
    setFile(f);
    setDeleteImage(false);
    if (f) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    }
  }

  function save() {
    const fields: Record<string, string> = {
      id: product.id,
      name,
      description,
      stock,
      shelf_loc: shelfLoc,
      price,
      "delete-image": deleteImage ? "true" : "",
    };
    for (const tag of tags) fields[tag] = "true";
    if (archived) fields.archive = "archive";
    onSave(fields, file);
  }

  return (
    <div className={modalBackdrop} onClick={onClose}>
      <div
        className={`${modal} max-w-[720px] max-h-[85dvh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={modalTitle}>Edit “{product.name}”</h3>
        <p className="text-[11.5px] font-semibold text-ink-2 mt-0 mb-4">
          These products store purchase stats, so <strong>never</strong> reuse
          one product for more than one real-life item unless it&apos;s by the
          same creator and they&apos;re fine merging the numbers.
        </p>

        <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
          <div className="flex flex-col gap-2">
            <span className={fieldLabel}>Product Photo</span>
            {preview && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={preview}
                alt=""
                className="w-full aspect-square object-cover border-2 border-black rounded-[6px]"
              />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="text-xs font-semibold"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {preview && (
              <button
                className={`${SMALL_BTN} bg-pop-red text-white self-start`}
                onClick={() => {
                  setFile(null);
                  setPreview(undefined);
                  setDeleteImage(true);
                }}
              >
                Remove image
              </button>
            )}
            <p className="text-[10.5px] italic text-ink-2 m-0">
              PNG or JPG under 2MB — ideally under 500kb and 1024×1024.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className={fieldLabel}>Product Name</span>
              <input
                className={fieldInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={fieldLabel}>Description</span>
              <textarea
                className={`${fieldInput} min-h-[70px] resize-y`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1">
                <span className={fieldLabel}>Stock</span>
                <input
                  type="number"
                  className={fieldInput}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={fieldLabel}>Shelf</span>
                <input
                  type="number"
                  className={fieldInput}
                  value={shelfLoc}
                  onChange={(e) => setShelfLoc(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={fieldLabel}>Price (NZD)</span>
                <input
                  type="number"
                  step="0.01"
                  className={fieldInput}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.values(VendingTag).map((tag) => {
                const on = tags.has(tag);
                return (
                  <button
                    key={tag}
                    className={`px-3 py-1 rounded-full border-2 border-black text-[11px] font-semibold tracking-[0.05em] uppercase transition-colors ${
                      on
                        ? "bg-pop-violet text-white shadow-[2px_2px_0px_0px_#000]"
                        : "bg-white text-ink hover:bg-paper-2"
                    }`}
                    onClick={() => {
                      const next = new Set(tags);
                      if (on) next.delete(tag);
                      else next.add(tag);
                      setTags(next);
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
              <button
                className={`px-3 py-1 rounded-full border-2 border-black text-[11px] font-semibold tracking-[0.05em] uppercase transition-colors ${
                  archived
                    ? "bg-pop-red text-white shadow-[2px_2px_0px_0px_#000]"
                    : "bg-white text-ink hover:bg-paper-2"
                }`}
                onClick={() => setArchived(!archived)}
              >
                Archived
              </button>
            </div>
          </div>
        </div>

        <div className={`${modalActions} flex-wrap justify-between`}>
          <button
            disabled={busy || product.price !== 0}
            title={
              product.price !== 0
                ? "Only free-priced products can be dispensed from here — use the legacy admin for paid manual vends."
                : undefined
            }
            className={btnDanger}
            onClick={onDispense}
          >
            Manually Dispense
          </button>
          <div className="flex gap-2.5">
            <button disabled={busy} className={btnGhost} onClick={onClose}>
              Close
            </button>
            <button disabled={busy} className={btnGradient} onClick={save}>
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Add/replace slot modal ────────────────────────────────────────────── */

function ReplaceModal({
  slot,
  oldProduct,
  products,
  busy,
  onClose,
  onConfirm,
}: {
  slot: string;
  oldProduct?: VendableProduct;
  products: VendableProduct[];
  busy: boolean;
  onClose: () => void;
  onConfirm: (newID: string) => void;
}) {
  const [newID, setNewID] = useState("");
  const inSlot = products.filter((p) => p.shelf_loc === slot);
  const others = products.filter((p) => p.shelf_loc !== slot);
  const label = (p: VendableProduct) =>
    `${p.name} ($${p.price?.toFixed(2) || "0.00"})${p.active ? "" : " — archived"}`;

  return (
    <div className={modalBackdrop} onClick={onClose}>
      <div className={modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={modalTitle}>
          {oldProduct ? "Replace" : "Add"} product in slot {slot}
        </h3>
        <p className="text-sm font-medium text-ink-2 mt-0 mb-4">
          Select a product to put in this slot, or create a new one.
          {oldProduct && (
            <> The current product (“{oldProduct.name}”) will be archived.</>
          )}
        </p>
        <select
          className={fieldInput}
          value={newID}
          onChange={(e) => setNewID(e.target.value)}
        >
          <option value="" disabled>
            Activate…
          </option>
          <option value="newProd">Create New Product</option>
          <option disabled>— Previously in this slot —</option>
          {inSlot.map((p) => (
            <option key={p.id} value={p.id}>
              {label(p)}
            </option>
          ))}
          <option disabled>— All products —</option>
          {others.map((p) => (
            <option key={p.id} value={p.id}>
              {label(p)}
            </option>
          ))}
        </select>
        <div className={modalActions}>
          <button disabled={busy} className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            disabled={busy || !newID}
            className={btnSecondary}
            onClick={() => onConfirm(newID)}
          >
            {busy ? "Working…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
