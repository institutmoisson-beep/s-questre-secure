import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const [roles, profile, seller, point] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("sellers").select("*").eq("claimed_by_user_id", user.id).maybeSingle(),
        supabase.from("escrow_points").select("*").eq("owner_user_id", user.id).maybeSingle(),
      ]);

      const roleList = (roles.data ?? []).map((r) => r.role);
      return {
        user,
        email: user.email ?? "",
        profile: profile.data ?? null,
        seller: seller.data ?? null,
        escrowPoint: point.data ?? null,
        roles: roleList,
        isAdmin: roleList.includes("admin"),
        isCourier: roleList.includes("courier"),
        isAgent: roleList.includes("agent"),
      };
    },
  });
}
