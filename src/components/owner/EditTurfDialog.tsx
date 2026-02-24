import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, ImagePlus } from "lucide-react";
import { uploadTurfImages } from "./TurfImageUpload";

const AMENITIES = ["Parking", "Changing Room", "Drinking Water", "Floodlights", "Washroom", "Cafeteria", "First Aid", "WiFi"];
const SPORT_OPTIONS = ["cricket", "football", "badminton", "tennis", "basketball", "hockey", "volleyball", "other"] as const;

interface EditTurfDialogProps {
  turf: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditTurfDialog = ({ turf, open, onOpenChange }: EditTurfDialogProps) => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [sportType, setSportType] = useState("cricket");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [hourlyPrice, setHourlyPrice] = useState("");
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  // Load existing images
  const { data: existingImages, refetch: refetchImages } = useQuery({
    queryKey: ["turf-images", turf?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turf_images")
        .select("*")
        .eq("turf_id", turf.id)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!turf?.id && open,
  });

  useEffect(() => {
    if (turf) {
      setName(turf.name ?? "");
      setDescription(turf.description ?? "");
      setCity(turf.city ?? "");
      setArea(turf.area ?? "");
      setAddress(turf.address ?? "");
      setSportType(turf.sport_type ?? "cricket");
      setAmenities(turf.amenities ?? []);
      setHourlyPrice(String(turf.hourly_price ?? ""));
      setNewImages([]);
      setNewPreviews([]);
    }
  }, [turf, open]);

  const updateTurf = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("turfs").update({
        name, description, city, area, address,
        sport_type: sportType as any,
        amenities,
        hourly_price: Number(hourlyPrice),
      }).eq("id", turf.id);
      if (error) throw error;

      if (newImages.length > 0) {
        const currentCount = existingImages?.length ?? 0;
        await uploadTurfImages(turf.id, newImages);
      }
    },
    onSuccess: () => {
      toast({ title: "Turf updated!" });
      qc.invalidateQueries({ queryKey: ["owner-turfs"] });
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const deleteImage = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase.from("turf_images").delete().eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchImages();
      toast({ title: "Photo removed" });
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const toggleStatus = useMutation({
    mutationFn: async () => {
      const newStatus = turf.status === "deactivated" ? "approved" : "deactivated";
      const { error } = await supabase.from("turfs").update({ status: newStatus }).eq("id", turf.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Status updated!" });
      qc.invalidateQueries({ queryKey: ["owner-turfs"] });
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const total = (existingImages?.length ?? 0) + newImages.length + files.length;
    if (total > 5) {
      toast({ title: "Max 5 photos allowed", variant: "destructive" });
      return;
    }
    setNewImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const canToggle = turf?.status === "approved" || turf?.status === "deactivated";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Edit Turf</DialogTitle></DialogHeader>
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

          {/* Photos management */}
          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="grid grid-cols-3 gap-2">
              {existingImages?.map(img => (
                <div key={img.id} className="relative aspect-video rounded-md overflow-hidden bg-muted">
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => deleteImage.mutate(img.id)} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative aspect-video rounded-md overflow-hidden bg-muted">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {(existingImages?.length ?? 0) + newImages.length < 5 && (
                <label className="flex aspect-video cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-xs">Add</span>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleNewFiles} />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{(existingImages?.length ?? 0) + newImages.length}/5 photos</p>
          </div>

          {/* Active toggle */}
          {canToggle && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active Status</p>
                <p className="text-xs text-muted-foreground">Toggle to deactivate/reactivate this turf</p>
              </div>
              <Switch
                checked={turf.status === "approved"}
                onCheckedChange={() => toggleStatus.mutate()}
                disabled={toggleStatus.isPending}
              />
            </div>
          )}

          <Button className="w-full" onClick={() => updateTurf.mutate()} disabled={updateTurf.isPending || !name || !city || !area || !hourlyPrice}>
            {updateTurf.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTurfDialog;
