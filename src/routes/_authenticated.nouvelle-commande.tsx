import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Field, Panel, btnClass, inputClass } from "@/components/AppShell";
import { CITIES, formatXof } from "@/lib/format";
import { LockIcon } from "@/components/Icons";

export const Route = createFileRoute("/_authenticated/nouvelle-commande")({
  head: () => ({
    meta: [
      { title: "Nouvelle commande protégée — Séquestre" },
      { name: "description", content: "Créez une commande et bloquez l'argent en sécurité jusqu'à la livraison." },
      { property: "og:title", content: "Nouvelle commande — Séquestre" },
      { property: "og:description", content: "Achetez en toute sécurité un produit vu sur les réseaux sociaux." },
    ],
  }),
  component: NewOrder,
});

function NewOrder() {
  const navigate = useNavigate();
  const [f, setF] = useState({
    title: "", description: "", price: "", fee: "0", link: "",
    sellerName: "", sellerPhone: "", sellerCity: "Abidjan", city: "Abidjan", point: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const { data: points } = useQuery({
    queryKey: ["points", f.city],
    queryFn: async () => {
      const { data } = await supabase.from("escrow_points").select("*").eq("status", "approved").eq("city", f.city);
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (files.length > 5) return setErr("5 photos maximum.");
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const paths: string[] = [];
      for (const file of files) {
        const path = `${u.user!.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const { error } = await supabase.storage.from("product-photos").upload(path, file);
        if (error) throw error;
        paths.push(path);
      }
      const { data, error } = await supabase.rpc("create_escrow_order", {
        _product_title: f.title, _product_description: f.description,
        _product_price_xof: Number(f.price), _delivery_fee_xof: Number(f.fee || 0),
        _product_image_urls: paths, _source_link: f.link,
        _seller_name: f.sellerName, _seller_phone: f.sellerPhone, _seller_city: f.sellerCity,
        _escrow_point_id: f.point,
      });
      if (error) throw error;
      navigate({ to: "/commande/$id", params: { id: (data as { id: string }).id } });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const total = Number(f.price || 0) + Number(f.fee || 0);

  return (
    <AppShell title="Nouvelle commande" subtitle="L'argent reste bloqué jusqu'à ce que vous receviez le colis.">
      <form onSubmit={submit} className="space-y-4">
        <Panel className="space-y-3">
          <h2 className="font-semibold">Le produit</h2>
          <Field label="Titre"><input required className={inputClass} value={f.title} onChange={set("title")} /></Field>
          <Field label="Description"><textarea className={inputClass} rows={3} value={f.description} onChange={set("description")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix (FCFA)"><input required type="number" min={1} className={inputClass} value={f.price} onChange={set("price")} /></Field>
            <Field label="Livraison (FCFA)"><input type="number" min={0} className={inputClass} value={f.fee} onChange={set("fee")} /></Field>
          </div>
          <Field label="Lien de l'annonce (optionnel)"><input className={inputClass} value={f.link} onChange={set("link")} /></Field>
          <Field label="Photos (5 max)">
            <input type="file" accept="image/*" multiple className="text-sm" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))} />
          </Field>
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-semibold">Le vendeur</h2>
          <Field label="Nom"><input required className={inputClass} value={f.sellerName} onChange={set("sellerName")} /></Field>
          <Field label="Téléphone"><input required className={inputClass} value={f.sellerPhone} onChange={set("sellerPhone")} placeholder="07 00 00 00 00" /></Field>
          <Field label="Ville">
            <select className={inputClass} value={f.sellerCity} onChange={set("sellerCity")}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-semibold">Point de dépôt</h2>
          <Field label="Votre ville">
            <select className={inputClass} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value, point: "" })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          {(points ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun point de dépôt approuvé dans cette ville pour l'instant.</p>
          ) : (
            <div className="space-y-2">
              {points!.map((p) => (
                <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${f.point === p.id ? "border-brand" : "border-border"}`}>
                  <input type="radio" name="point" checked={f.point === p.id} onChange={() => setF({ ...f, point: p.id })} />
                  <span><span className="font-medium">{p.business_name}</span><br /><span className="text-xs text-muted-foreground">{p.neighborhood} · {p.phone}</span></span>
                </label>
              ))}
            </div>
          )}
        </Panel>
        {err ? <p className="text-sm text-destructive">{err}</p> : null}
        <button disabled={busy || !f.point} className={btnClass}>
          <LockIcon className="size-4" /> {busy ? "Création…" : `Créer la commande · ${formatXof(total)}`}
        </button>
      </form>
    </AppShell>
  );
}
