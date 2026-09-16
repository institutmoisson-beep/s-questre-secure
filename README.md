# Séquestre Secure

Prompt à coller dans Lovable / Claude Code

Copiez tout ce qui suit dans le premier message d'un nouveau projet Lovable (ou dans Claude Code avec claude en mode planification). Ne collez pas dans le projet existant "groupage-connect" — c'est une application séparée.

Contexte du projet

Construis une application web mobile-first appelée "Séquestre" (nom provisoire, à me proposer des alternatives) : une plateforme qui permet à n'importe qui d'acheter en toute sécurité un produit trouvé sur les réseaux sociaux (Facebook, Instagram, WhatsApp, TikTok) ou sur un site web externe, en séquestrant l'argent jusqu'à confirmation de la livraison réelle.

Le problème résolu : sur les réseaux sociaux, un acheteur paie souvent avant de recevoir le produit, sans aucune garantie. Cette application insère un tiers de confiance (réseau de points physiques + livreurs) entre l'acheteur et le vendeur, et ne libère l'argent au vendeur qu'après double confirmation de la remise du produit.

Marché cible : Côte d'Ivoire (Abidjan en priorité), transactions en XOF (Franc CFA), paiement cash déposé physiquement chez un agent Mobile Money ou un point "Push-CI".

Stack technique imposée

Frontend : React + TypeScript + Vite + Tailwind CSS

Backend : Supabase (Postgres + Auth + Storage + Row Level Security)

Toute la logique métier sensible (mouvements d'argent, changements de statut de commande, attribution de rôle) doit passer par des fonctions Postgres SECURITY DEFINER appelées en RPC — jamais par des écritures directes de table depuis le client, pour garder le contrôle métier et la sécurité au même endroit.

Chaque table sensible doit avoir des policies RLS explicites dès sa création (pas de "je les ajouterai plus tard") : au minimum une policy SELECT claire, et écritures verrouillées derrière les RPC.

Mobile-first, mais utilisable aussi sur desktop.

Rôles utilisateurs

Acheteur — n'importe quel utilisateur inscrit. Importe un produit, crée une commande séquestre, choisit un point de dépôt, confirme la réception.

Vendeur — peut être un compte complet dans l'app, ou une simple fiche identifiée par téléphone tant qu'il n'a pas encore rejoint l'app. Possède un code vendeur unique, un portefeuille, une réputation publique.

Point d'escrow (agent Mobile Money ou point "Push-CI") — reçoit le dépôt cash de l'acheteur, verrouille les fonds dans le système. Doit s'inscrire avec KYC (pièce d'identité ou registre de commerce) et être approuvé par un admin avant de pouvoir opérer.

Livreur — récupère le produit chez le vendeur, le livre à l'acheteur, gère la double confirmation OTP.

Administrateur — approuve les points d'escrow, supervise les litiges, peut annuler/rembourser une commande, voit toutes les commandes.

Boucle fonctionnelle principale (MVP — à construire en premier, et seulement ceci)

L'acheteur crée une commande en remplissant manuellement les infos du produit (titre, prix, description, jusqu'à 5 photos uploadées, lien source optionnel en simple texte) — pas de scraping automatique en V1, c'est volontairement reporté à plus tard.

L'acheteur renseigne le vendeur : nom, numéro de téléphone, ville. Le système cherche si ce numéro a déjà un code vendeur ; sinon il en génère un nouveau (format VND-XXXXXX).

L'acheteur choisit un point d'escrow dans sa ville (liste simple avec nom, quartier, type — pas besoin de carte interactive en V1, juste un filtre par ville).

Le statut de la commande passe à "en attente de dépôt". Un code de commande unique est généré (ex: SEQ-AB12CD) pour que l'acheteur l'indique au point d'escrow.

Le point d'escrow (connecté à son espace agent) retrouve la commande par son code, confirme avoir reçu le cash, et verrouille les fonds — le statut passe à "fonds verrouillés".

Le vendeur (via son espace, accessible avec son code vendeur + téléphone) voit la commande et confirme la remise du produit au livreur — génère un OTP vendeur→livreur.

Le livreur scanne/saisit cet OTP pour confirmer la prise en charge — statut "en livraison".

À la remise, l'acheteur confirme la réception via un second OTP (généré à l'étape 5, affiché à l'acheteur en texte + QR code) que le livreur scanne ou saisit.

Seulement après cette double confirmation : les fonds sont crédités au portefeuille du vendeur, moins la commission plateforme et la commission point d'escrow (pourcentages configurables par l'admin).

Le vendeur peut retirer son solde : virement Mobile Money (numéro enregistré) ou retrait cash à un point Push-CI (génère un code de retrait à présenter physiquement).

À tout moment avant la double confirmation, l'acheteur peut annuler (remboursement automatique si les fonds étaient déjà verrouillés). L'admin peut aussi forcer une annulation/un remboursement en cas de litige.

Modèle de données de départ (à affiner, mais structure-toi autour de ça)

sellers — id, phone (unique), full_name, city, seller_code (unique), created_at, claimed_by_user_id (nullable, rempli quand le vendeur rejoint l'app), reputation_score

escrow_points — id, owner_user_id, business_name, type (mobile_money / push_ci / both), id_document_url, business_registry_url, phone, city, neighborhood, latitude, longitude, status (pending/approved/suspended), commission_percentage

orders — id, order_code (unique), buyer_id, seller_id, escrow_point_id, courier_id (nullable), product_title, product_description, product_price_xof, delivery_fee_xof, product_image_urls (array), source_link (nullable text), status (enum détaillé ci-dessous), seller_otp, buyer_otp, seller_confirmed_at, delivery_confirmed_at, cancellation_deadline, refund_amount_xof, created_at

order_status enum : pending_deposit, funds_locked, seller_confirmed, in_transit, delivered, cancelled_pending_refund, refunded, disputed

wallets — user_id, balance_xof, updated_at

wallet_transactions — id, wallet_user_id, order_id (nullable), type (credit/debit/withdrawal), amount_xof, description, created_at

withdrawal_requests — id, user_id, amount_xof, method (mobile_money/push_ci), status (pending/completed/rejected), created_at

disputes — id, order_id, raised_by, reason, status (open/resolved), admin_note, resolved_at

Écrans nécessaires (par rôle)

Acheteur

Créer une commande (formulaire produit + vendeur + choix point)

Mes commandes (liste + détail avec statut, OTP/QR, bouton annuler)

Portefeuille (si l'acheteur a aussi un solde, ex. remboursements)

Vendeur

Connexion par téléphone + code vendeur (ou création de compte classique)

Mes ventes (commandes le concernant, à confirmer/suivre)

Portefeuille + demande de retrait

Fiche réputation publique (consultable par les acheteurs)

Point d'escrow

Inscription (formulaire KYC complet)

Tableau de bord : rechercher une commande par code, confirmer un dépôt, verrouiller les fonds

Historique de mes opérations + commissions gagnées

Livreur

Liste des courses assignées

Scanner/saisir OTP vendeur (prise en charge)

Scanner/saisir OTP acheteur (livraison)

Admin

Approuver/rejeter les points d'escrow (voir documents KYC)

Vue d'ensemble de toutes les commandes + filtre par statut

Annuler/rembourser une commande

Gérer les litiges

Configurer les commissions par défaut

Exigences non-fonctionnelles

Toute somme d'argent affichée en FCFA (XOF), formatée avec séparateurs de milliers.

Design orienté confiance/sécurité : utiliser des codes visuels clairs (icônes de cadenas/bouclier), messages rassurants sur le fonctionnement du séquestre.

Tous les OTP à 6 chiffres + QR code équivalent (utiliser une API ouverte de génération de QR, ex. api.qrserver.com, pas de dépendance payante).

Journaliser (timestamp) chaque changement de statut de commande pour pouvoir reconstituer l'historique en cas de litige.

Aucune donnée de paiement Mobile Money réelle stockée en clair — uniquement les numéros de téléphone nécessaires à l'opération.

Ce qu'il NE FAUT PAS construire en V1 (hors scope volontaire)

Pas de scraping automatique de lien (Facebook/Instagram bloquent ça de toute façon) — saisie manuelle uniquement.

Pas de carte interactive géolocalisée pour choisir un point d'escrow — une simple liste filtrée par ville suffit.

Pas de messagerie interne acheteur/vendeur — la négociation reste sur la plateforme d'origine (Facebook, etc.).

Pas de multi-devises, pas de multi-pays.

Comment procéder

Construis d'abord uniquement la boucle fonctionnelle principale décrite plus haut, de bout en bout, avec des écrans simples mais fonctionnels pour chaque rôle. Une fois que ce flux complet fonctionne (créer une commande → dépôt → double OTP → argent crédité → retrait), je te donnerai le feu vert pour ajouter : scraping de lien, carte interactive, messagerie, réputation avancée, etc. Ne saute pas d'étapes et n'ajoute pas de fonctionnalités non demandées.

Ce que vous devez faire, vous (hors du prompt ci-dessus)

Créez un nouveau projet Lovable vide (ne réutilisez pas groupage-connect).

Collez le prompt ci-dessus en premier message.

Une fois le MVP généré, revenez me voir avec le lien du repo GitHub généré — je pourrai alors auditer le code produit (comme je l'ai fait pour ViDa), corriger les éventuels trous de sécurité RLS ou colonnes manquantes, et vous aider à enchaîner les phases suivantes une par une.

Gardez en tête le point réglementaire mentionné précédemment (gestion de fonds en séquestre) — à clarifier indépendamment du développement, avant tout déploiement à grande échelle avec de vrais utilisateurs.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/147c404e-aded-4166-a7fe-d20d3fda2a39).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
