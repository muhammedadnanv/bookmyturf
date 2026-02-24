import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface TurfImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
}

const TurfImageUpload = ({ images, onImagesChange }: TurfImageUploadProps) => {
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 5) {
      return;
    }
    const newImages = [...images, ...files];
    onImagesChange(newImages);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {previews.map((src, i) => (
          <div key={i} className="relative aspect-video rounded-md overflow-hidden bg-muted">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <label className="flex aspect-video cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors">
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs">Add Photo</span>
            </div>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{images.length}/5 photos</p>
    </div>
  );
};

export default TurfImageUpload;

export async function uploadTurfImages(turfId: string, files: File[]) {
  const results: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop();
    const path = `${turfId}/${Date.now()}_${i}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("turf-images")
      .upload(path, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("turf-images")
      .getPublicUrl(path);

    // Insert into turf_images table
    await supabase.from("turf_images").insert({
      turf_id: turfId,
      image_url: urlData.publicUrl,
      display_order: i,
    });

    results.push(urlData.publicUrl);
  }
  return results;
}
