import type { Database } from "@/integrations/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_deposit: "En attente de dépôt",
  funds_locked: "Fonds verrouillés",
  seller_confirmed: "Colis remis au livreur",
  in_transit: "En livraison",
  delivered: "Livré et payé",
  cancelled_pending_refund: "Annulée — remboursement en cours",
  refunded: "Remboursée",
  disputed: "Litige ouvert",
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  pending_deposit: "text-amber",
  funds_locked: "text-teal",
  seller_confirmed: "text-teal",
  in_transit: "text-brand",
  delivered: "text-teal",
  cancelled_pending_refund: "text-amber",
  refunded: "text-muted-foreground",
  disputed: "text-destructive",
};

export const FLOW: OrderStatus[] = [
  "pending_deposit",
  "funds_locked",
  "seller_confirmed",
  "in_transit",
  "delivered",
];

export const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  completed: "Payé",
  rejected: "Rejeté",
};

export const TX_TYPE_LABELS: Record<string, string> = {
  credit: "Crédit vente",
  debit: "Débit",
  withdrawal: "Retrait",
  refund: "Remboursement",
  commission: "Commission",
};

export const POINT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente de validation",
  approved: "Approuvé",
  suspended: "Suspendu",
};
