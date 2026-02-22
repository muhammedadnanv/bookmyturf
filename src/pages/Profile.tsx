import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setCity(profile.city || "");
    }
  }, [profile]);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ full_name: fullName, phone, city }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Profile updated!" });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="container max-w-lg py-8">
      <h1 className="font-display text-3xl font-bold mb-6">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Profile Details
            {role && <Badge variant="secondary">{role}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
          <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div className="space-y-2"><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} /></div>
          <Button className="w-full" onClick={() => update.mutate()} disabled={update.isPending}>
            {update.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
