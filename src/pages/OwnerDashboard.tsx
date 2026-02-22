import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, IndianRupee, TrendingUp, CalendarDays, MapPin } from "lucide-react";
import { format } from "date-fns";

const AMENITIES = ["Parking", "Changing Room", "Drinking Water", "Floodlights", "Washroom", "Cafeteria", "First Aid", "WiFi"];
const SPORT_OPTIONS = ["cricket", "football", "badminton", "tennis", "basketball", "hockey", "volleyball", "other"] as const;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const OwnerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [sportType, setSportType] = useState<string>("cricket");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [hourlyPrice, setHourlyPrice] = useState("");

  // Slot form state
  const [slotTurfId, setSlotTurfId] = useState<string | null>(null);
  const [slotDay, setSlotDay] = useState("1");
  const [slotStart, setSlotStart] = useState("06:00");
  const [slotEnd, setSlotEnd] = useState("07:00");

  const { data: turfs, isLoading } = useQuery({
    queryKey: ["owner-turfs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turfs")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: bookings } = useQuery({
    queryKey: ["owner-bookings", user?.id],
    queryFn: async () => {
      const turfIds = turfs?.map(t => t.id) ?? [];
      if (turfIds.length === 0) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*, turfs(name), turf_slots(start_time, end_time)")
        .in("turf_id", turfIds)
        .order("booking_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!turfs && turfs.length > 0,
  });

  const { data: payouts } = useQuery({
    queryKey: ["owner-payouts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_ledger")
        .select("*")
        .eq("owner_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalEarnings = payouts?.reduce((sum, p) => sum + Number(p.owner_payout), 0) ?? 0;
  const totalCommission = payouts?.reduce((sum, p) => sum + Number(p.commission_amount), 0) ?? 0;

  const createTurf = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("turfs").insert({
        owner_id: user!.id,
        name, description, city, area, address,
        sport_type: sportType as any,
        amenities,
        hourly_price: Number(hourlyPrice),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Turf created!", description: "It will be visible after admin approval." });
      qc.invalidateQueries({ queryKey: ["owner-turfs"] });
      setShowCreate(false);
      setName(""); setDescription(""); setCity(""); setArea(""); setAddress(""); setAmenities([]); setHourlyPrice("");
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const addSlot = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("turf_slots").insert({
        turf_id: slotTurfId!,
        day_of_week: Number(slotDay),
        start_time: slotStart,
        end_time: slotEnd,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Slot added!" });
      setSlotTurfId(null);
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const STATUS_MAP: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", deactivated: "bg-gray-100 text-gray-800" };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">Owner Dashboard</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1.5 h-4 w-4" />Add Turf</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>Create New Turf</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Turf Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} /></div>
                <div className="space-y-2"><Label>Area</Label><Input value={area} onChange={e => setArea(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Sport Type</Label>
                <Select value={sportType} onValueChange={setSportType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPORT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map(a => (
                    <Badge key={a} variant={amenities.includes(a) ? "default" : "outline"} className="cursor-pointer" onClick={() => setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}>
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2"><Label>Hourly Price (₹)</Label><Input type="number" value={hourlyPrice} onChange={e => setHourlyPrice(e.target.value)} /></div>
              <Button className="w-full" onClick={() => createTurf.mutate()} disabled={createTurf.isPending || !name || !city || !area || !hourlyPrice}>
                {createTurf.isPending ? "Creating..." : "Create Turf"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Revenue Summary */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><IndianRupee className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Earnings</p><p className="font-display text-xl font-bold">₹{totalEarnings.toFixed(0)}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10"><TrendingUp className="h-5 w-5 text-accent" /></div><div><p className="text-sm text-muted-foreground">Commission Paid</p><p className="font-display text-xl font-bold">₹{totalCommission.toFixed(0)}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><CalendarDays className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Bookings</p><p className="font-display text-xl font-bold">{bookings?.length ?? 0}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="turfs">
        <TabsList><TabsTrigger value="turfs">My Turfs</TabsTrigger><TabsTrigger value="bookings">Bookings</TabsTrigger></TabsList>

        <TabsContent value="turfs" className="mt-4">
          {isLoading ? <Skeleton className="h-32 w-full" /> : turfs && turfs.length > 0 ? (
            <div className="grid gap-4">
              {turfs.map(t => (
                <Card key={t.id}>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                    <div>
                      <h3 className="font-semibold">{t.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{t.area}, {t.city}</p>
                      <p className="text-sm mt-1">₹{t.hourly_price}/hr · {t.sport_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_MAP[t.status]}>{t.status}</Badge>
                      <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm" onClick={() => setSlotTurfId(t.id)}>Add Slot</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add Time Slot</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Day</Label>
                              <Select value={slotDay} onValueChange={setSlotDay}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2"><Label>Start</Label><Input type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} /></div>
                              <div className="space-y-2"><Label>End</Label><Input type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} /></div>
                            </div>
                            <Button className="w-full" onClick={() => addSlot.mutate()} disabled={addSlot.isPending}>
                              {addSlot.isPending ? "Adding..." : "Add Slot"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12"><p className="text-muted-foreground">No turfs yet. Create your first one!</p></div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          {bookings && bookings.length > 0 ? (
            <div className="grid gap-4">
              {bookings.map(b => (
                <Card key={b.id}>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                    <div>
                      <h3 className="font-semibold">{(b as any).turfs?.name}</h3>
                      <p className="text-sm text-muted-foreground">{format(new Date(b.booking_date), "PPP")} · {(b as any).turf_slots?.start_time?.slice(0,5)} – {(b as any).turf_slots?.end_time?.slice(0,5)}</p>
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

export default OwnerDashboard;
