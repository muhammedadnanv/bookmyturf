import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, Users, CalendarDays, Building2, Check, X } from "lucide-react";
import { format } from "date-fns";

const AdminDashboard = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: pendingTurfs, isLoading: loadingTurfs } = useQuery({
    queryKey: ["admin-pending-turfs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("turfs").select("*").eq("status", "pending").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: allBookings } = useQuery({
    queryKey: ["admin-all-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, turfs(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: allPayouts } = useQuery({
    queryKey: ["admin-all-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payout_ledger").select("*");
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = allPayouts?.reduce((s, p) => s + Number(p.total_amount), 0) ?? 0;
  const totalCommission = allPayouts?.reduce((s, p) => s + Number(p.commission_amount), 0) ?? 0;

  const updateTurfStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("turfs").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Turf status updated" });
      qc.invalidateQueries({ queryKey: ["admin-pending-turfs"] });
    },
  });

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><IndianRupee className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="font-display text-xl font-bold">₹{totalRevenue.toFixed(0)}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10"><IndianRupee className="h-5 w-5 text-accent" /></div><div><p className="text-sm text-muted-foreground">Platform Commission</p><p className="font-display text-xl font-bold">₹{totalCommission.toFixed(0)}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><CalendarDays className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Bookings</p><p className="font-display text-xl font-bold">{allBookings?.length ?? 0}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Pending Approvals</p><p className="font-display text-xl font-bold">{pendingTurfs?.length ?? 0}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="approvals">
        <TabsList><TabsTrigger value="approvals">Turf Approvals</TabsTrigger><TabsTrigger value="bookings">All Bookings</TabsTrigger></TabsList>

        <TabsContent value="approvals" className="mt-4">
          {loadingTurfs ? <Skeleton className="h-32 w-full" /> : pendingTurfs && pendingTurfs.length > 0 ? (
            <div className="grid gap-4">
              {pendingTurfs.map(t => (
                <Card key={t.id}>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                    <div>
                      <h3 className="font-semibold">{t.name}</h3>
                      <p className="text-sm text-muted-foreground">{t.area}, {t.city} · {t.sport_type} · ₹{t.hourly_price}/hr</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateTurfStatus.mutate({ id: t.id, status: "approved" })}><Check className="mr-1 h-3 w-3" />Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateTurfStatus.mutate({ id: t.id, status: "rejected" })}><X className="mr-1 h-3 w-3" />Reject</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-12 text-muted-foreground">No pending approvals</p>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          {allBookings && allBookings.length > 0 ? (
            <div className="grid gap-4">
              {allBookings.map(b => (
                <Card key={b.id}>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                    <div>
                      <h3 className="font-semibold">{(b as any).turfs?.name}</h3>
                      <p className="text-sm text-muted-foreground">{format(new Date(b.booking_date), "PPP")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">₹{b.total_amount}</span>
                      <Badge>{b.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-12 text-muted-foreground">No bookings yet</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
