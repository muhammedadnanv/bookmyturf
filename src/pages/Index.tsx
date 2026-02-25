import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, ArrowRight, Shield, Clock, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const SPORT_LABELS: Record<string, string> = {
  cricket: "🏏 Cricket",
  football: "⚽ Football",
  badminton: "🏸 Badminton",
  tennis: "🎾 Tennis",
  basketball: "🏀 Basketball",
  hockey: "🏑 Hockey",
  volleyball: "🏐 Volleyball",
  other: "🎯 Other",
};

const Index = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const { data: turfs, isLoading } = useQuery({
    queryKey: ["turfs", "approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turfs")
        .select("*, turf_images(image_url, display_order)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cities = [...new Set(turfs?.map(t => t.city) ?? [])];

  const filtered = turfs?.filter(t => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.area.toLowerCase().includes(search.toLowerCase());
    const matchesSport = sportFilter === "all" || t.sport_type === sportFilter;
    const matchesCity = cityFilter === "all" || t.city === cityFilter;
    return matchesSearch && matchesSport && matchesCity;
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20 lg:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 text-sm">
              🏟️ India's #1 Turf Booking Platform
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Book Your Perfect
              <span className="text-primary"> Sports Turf</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover and book turfs near you for cricket, football, badminton and more. Instant booking, real-time availability.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={() => document.getElementById("turfs")?.scrollIntoView({ behavior: "smooth" })}>
                <Search className="mr-2 h-4 w-4" />
                Explore Turfs
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth?tab=signup")}>
                List Your Turf
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b py-12">
        <div className="container grid gap-6 sm:grid-cols-3">
          {[
            { icon: Clock, title: "Real-Time Slots", desc: "See live availability and book instantly" },
            { icon: Shield, title: "Verified Turfs", desc: "Every turf is admin-verified for quality" },
            { icon: CreditCard, title: "Easy Payments", desc: "Secure checkout with instant confirmation" },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Turfs Section */}
      <section id="turfs" className="py-12">
        <div className="container">
          <h2 className="font-display text-2xl font-bold mb-6">Browse Turfs</h2>

          {/* Filters */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search turfs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {Object.entries(SPORT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-72 rounded-lg" />
              ))}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(turf => {
                const img = turf.turf_images?.sort((a: any, b: any) => a.display_order - b.display_order)[0]?.image_url;
                return (
                  <Card key={turf.id} className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg" onClick={() => navigate(`/turf/${turf.id}`)}>
                    <div className="relative aspect-video bg-muted">
                      {img ? (
                        <img src={img} alt={turf.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">🏟️</div>
                      )}
                      <Badge className="absolute right-2 top-2">{SPORT_LABELS[turf.sport_type] ?? turf.sport_type}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-display font-semibold text-lg truncate">{turf.name}</h3>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {turf.area}, {turf.city}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-display font-bold text-primary">₹{turf.hourly_price}/hr</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                          <span>New</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <span className="text-4xl mb-3">🏟️</span>
              <h3 className="font-display text-lg font-semibold">No turfs found</h3>
              <p className="text-sm text-muted-foreground mt-1">Check back soon or adjust your filters</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Index;
