import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, IndianRupee } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

const PlayerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ["player-bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, turfs(name, city, area, sport_type), turf_slots(start_time, end_time)")
        .eq("player_id", user!.id)
        .order("booking_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleCancel = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    if (error) {
      toast({ title: "Failed to cancel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking cancelled" });
      refetch();
    }
  };

  const upcoming = bookings?.filter(b => b.status === "confirmed" && new Date(b.booking_date) >= new Date(new Date().setHours(0,0,0,0)));
  const past = bookings?.filter(b => b.status !== "confirmed" || new Date(b.booking_date) < new Date(new Date().setHours(0,0,0,0)));

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl font-bold mb-6">My Bookings</h1>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (
        <>
          <h2 className="font-display text-xl font-semibold mb-4">Upcoming</h2>
          {upcoming && upcoming.length > 0 ? (
            <div className="grid gap-4 mb-8">
              {upcoming.map(b => (
                <Card key={b.id}>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                    <div>
                      <h3 className="font-semibold">{(b as any).turfs?.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {(b as any).turfs?.area}, {(b as any).turfs?.city}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(b.booking_date), "PPP")}</span>
                        <span>{(b as any).turf_slots?.start_time?.slice(0,5)} – {(b as any).turf_slots?.end_time?.slice(0,5)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center font-semibold"><IndianRupee className="h-3.5 w-3.5" />{b.total_amount}</span>
                      <Badge className={STATUS_COLORS[b.status]}>{b.status}</Badge>
                      <Button variant="destructive" size="sm" onClick={() => handleCancel(b.id)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mb-8">No upcoming bookings</p>
          )}

          <h2 className="font-display text-xl font-semibold mb-4">Past Bookings</h2>
          {past && past.length > 0 ? (
            <div className="grid gap-4">
              {past.map(b => (
                <Card key={b.id} className="opacity-75">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                    <div>
                      <h3 className="font-semibold">{(b as any).turfs?.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{format(new Date(b.booking_date), "PPP")}</span>
                        <span>{(b as any).turf_slots?.start_time?.slice(0,5)} – {(b as any).turf_slots?.end_time?.slice(0,5)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center font-semibold"><IndianRupee className="h-3.5 w-3.5" />{b.total_amount}</span>
                      <Badge className={STATUS_COLORS[b.status]}>{b.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No past bookings</p>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerDashboard;
