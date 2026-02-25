import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Clock } from "lucide-react";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ManageSlotsDialogProps {
  turfId: string | null;
  turfName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManageSlotsDialog = ({ turfId, turfName, open, onOpenChange }: ManageSlotsDialogProps) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [slotDay, setSlotDay] = useState("1");
  const [slotStart, setSlotStart] = useState("06:00");
  const [slotEnd, setSlotEnd] = useState("07:00");
  const [priceOverride, setPriceOverride] = useState("");

  const { data: slots, isLoading } = useQuery({
    queryKey: ["turf-slots-manage", turfId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turf_slots")
        .select("*")
        .eq("turf_id", turfId!)
        .order("day_of_week")
        .order("start_time");
      if (error) throw error;
      return data;
    },
    enabled: !!turfId && open,
  });

  const addSlot = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("turf_slots").insert({
        turf_id: turfId!,
        day_of_week: Number(slotDay),
        start_time: slotStart,
        end_time: slotEnd,
        price_override: priceOverride ? Number(priceOverride) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Slot added!" });
      qc.invalidateQueries({ queryKey: ["turf-slots-manage", turfId] });
      setShowAdd(false);
      setSlotStart("06:00");
      setSlotEnd("07:00");
      setPriceOverride("");
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const deleteSlot = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase.from("turf_slots").delete().eq("id", slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Slot deleted" });
      qc.invalidateQueries({ queryKey: ["turf-slots-manage", turfId] });
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const toggleSlot = useMutation({
    mutationFn: async ({ slotId, active }: { slotId: string; active: boolean }) => {
      const { error } = await supabase.from("turf_slots").update({ is_active: active }).eq("id", slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["turf-slots-manage", turfId] });
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  // Group slots by day
  const slotsByDay = DAY_NAMES.map((day, i) => ({
    day,
    dayIndex: i,
    slots: slots?.filter(s => s.day_of_week === i) ?? [],
  })).filter(d => d.slots.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Manage Slots – {turfName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Slot Section */}
          {!showAdd ? (
            <Button variant="outline" className="w-full" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add New Slot
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border p-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={slotDay} onValueChange={setSlotDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((d, i) => (
                      <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Price Override (₹, optional)</Label>
                <Input type="number" placeholder="Leave blank to use turf price" value={priceOverride} onChange={e => setPriceOverride(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => addSlot.mutate()} disabled={addSlot.isPending}>
                  {addSlot.isPending ? "Adding..." : "Add Slot"}
                </Button>
                <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Existing Slots */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading slots...</p>
          ) : slotsByDay.length > 0 ? (
            <div className="space-y-4">
              {slotsByDay.map(({ day, slots: daySlots }) => (
                <div key={day}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">{day}</h4>
                  <div className="space-y-2">
                    {daySlots.map(slot => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={slot.is_active}
                            onCheckedChange={(checked) =>
                              toggleSlot.mutate({ slotId: slot.id, active: checked })
                            }
                          />
                          <div>
                            <span className={`text-sm font-medium ${!slot.is_active ? "text-muted-foreground line-through" : ""}`}>
                              {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                            </span>
                            {slot.price_override && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                ₹{slot.price_override}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteSlot.mutate(slot.id)}
                          disabled={deleteSlot.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No slots yet. Add your first slot above!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSlotsDialog;
