import { createFileRoute, Link } from "@tanstack/react-router";
import { LockIcon, ShieldIcon, TruckIcon, WalletIcon } from "@/components/Icons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Séquestre — Achetez en confiance en Côte d'Ivoire" },
      {
        name: "description",
        content:
          "Séquestre garde votre argent en sécurité jusqu'à la livraison réelle de votre achat trouvé sur les réseaux sociaux. Abidjan, paiement en FCFA.",
      },
      { property: "og:title", content: "Séquestre — Achetez en confiance" },
      {
        property: "og:description",
        content:
          "L'argent n'est versé au vendeur qu'après confirmation de la livraison par double code de sécurité.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    Icon: LockIcon,
    title: "1. Vous déposez",
    text: "Vous créez la commande et déposez le montant en espèces chez un point de dépôt agréé de votre ville.",
  },
  {
    Icon: ShieldIcon,
    title: "2. L'argent est bloqué",
    text: "Les fonds sont verrouillés. Le vendeur voit que l'argent existe, mais ne peut pas y toucher.",
  },
  {
    Icon: TruckIcon,
    title: "3. Double code",
    text: "Un code du vendeur au retrait du colis, un code à vous à la remise. Sans votre code, rien n'est débloqué.",
  },
  {
    Icon: WalletIcon,
    title: "4. Le vendeur est payé",
    text: "Après votre confirmation, le vendeur est crédité et retire par Mobile Money ou en espèces.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <ShieldIcon className="size-6 text-brand" />
          <span className="font-display text-lg font-semibold">Séquestre</span>
        </div>
        <Link
          to="/auth"
          className="rounded-full border border-border px-4 py-2 text-sm text-foreground"
        >
          Connexion
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-5 pt-6 pb-10">
        <p className="mono text-xs text-teal">CÔTE D'IVOIRE · FCFA</p>
        <h1 className="mt-3 text-4xl leading-tight font-semibold">
          Achetez sur les réseaux sociaux <span className="text-brand">sans vous faire arnaquer</span>.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Votre argent est gardé en séquestre par Séquestre. Il n'est remis au vendeur qu'après la
          livraison réelle du produit, confirmée par vous avec un code à 6 chiffres.
        </p>
        <div className="mt-6 space-y-3">
          <Link
            to="/auth"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            <LockIcon className="size-4" /> Créer une commande protégée
          </Link>
          <Link
            to="/auth"
            className="flex w-full items-center justify-center rounded-xl border border-border px-4 py-3.5 text-sm font-medium"
          >
            Je suis vendeur, livreur ou point de dépôt
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-3 px-5 pb-16">
        <h2 className="text-lg font-semibold">Comment ça marche</h2>
        {steps.map(({ Icon, title, text }) => (
          <div key={title} className="glass rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-teal" />
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          </div>
        ))}
        <p className="pt-4 text-center text-xs text-muted-foreground">
          Aucune donnée de paiement Mobile Money n'est stockée en clair.
        </p>
      </section>
    </div>
  );
}
