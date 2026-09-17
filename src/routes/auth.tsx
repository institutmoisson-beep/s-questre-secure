import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ShieldIcon } from "@/components/Icons";
import { Field, btnClass, btnGhostClass, inputClass } from "@/components/AppShell";
import { CITIES } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Séquestre" },
      { name: "description", content: "Connectez-vous à Séquestre pour créer et suivre vos achats protégés." },
      { property: "og:title", content: "Connexion — Séquestre" },
      { property: "og:description", content: "Accédez à vos commandes protégées et à votre portefeuille." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Abidjan");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/mes-commandes" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        await supabase.rpc("ensure_profile", {
          _full_name: fullName,
          _phone: phone,
          _city: city,
        });
        toast.success("Compte créé");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/mes-commandes" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la connexion");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <ShieldIcon className="size-9 text-brand" />
          <h1 className="mt-3 text-2xl font-semibold">Séquestre</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre argent reste bloqué jusqu'à la livraison.
          </p>
        </div>

        <div className="glass space-y-4 rounded-2xl p-5">
          <div className="flex rounded-xl bg-secondary p-1 text-sm">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" ? (
              <>
                <Field label="Nom complet">
                  <input
                    className={inputClass}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    maxLength={100}
                  />
                </Field>
                <Field label="Téléphone">
                  <input
                    className={inputClass}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07 00 00 00 00"
                    required
                    maxLength={20}
                  />
                </Field>
                <Field label="Ville">
                  <select className={inputClass} value={city} onChange={(e) => setCity(e.target.value)}>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            ) : null}
            <Field label="E-mail">
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </Field>
            <Field label="Mot de passe">
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </Field>
            <button className={btnClass} disabled={busy}>
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          <button
            type="button"
            className={btnGhostClass}
            onClick={() =>
              lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })
            }
          >
            Continuer avec Google
          </button>
        </div>
      </div>
    </div>
  );
}
