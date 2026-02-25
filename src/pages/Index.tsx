import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, ArrowRight, Shield, Clock, CreditCard, Users, Trophy, Zap } from "lucide-react";
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

const DEMO_TURFS = [
  { id: "demo-1", name: "Green Arena Cricket Ground", area: "Koramangala", city: "Bangalore", sport_type: "cricket", hourly_price: 1200, description: "Premium cricket ground with floodlights", emoji: "🏏" },
  { id: "demo-2", name: "Goal Rush Football Turf", area: "Andheri West", city: "Mumbai", sport_type: "football", hourly_price: 1500, description: "FIFA-standard synthetic turf", emoji: "⚽" },
  { id: "demo-3", name: "Smash Point Badminton", area: "HSR Layout", city: "Bangalore", sport_type: "badminton", hourly_price: 800, description: "Indoor air-conditioned courts", emoji: "🏸" },
  { id: "demo-4", name: "Ace Tennis Academy", area: "Banjara Hills", city: "Hyderabad", sport_type: "tennis", hourly_price: 1000, description: "Clay and hard court surfaces", emoji: "🎾" },
  { id: "demo-5", name: "Dunk Zone Basketball", area: "Whitefield", city: "Bangalore", sport_type: "basketball", hourly_price: 900, description: "Full-size indoor basketball court", emoji: "🏀" },
  { id: "demo-6", name: "Champions Hockey Field", area: "Sector 62", city: "Noida", sport_type: "hockey", hourly_price: 1100, description: "Astroturf with changing rooms", emoji: "🏑" },
];

const STATS = [
  { label: "Turfs Listed", value: "500+", icon: Trophy },
  { label: "Happy Players", value: "12K+", icon: Users },
  { label: "Cities Covered", value: "25+", icon: MapPin },
  { label: "Bookings Done", value: "50K+", icon: Zap },
];

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

  const hasRealTurfs = turfs && turfs.length > 0;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.06),transparent_40%)]" />
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 text-sm animate-fade-in">
              🏟️ India's #1 Turf Booking Platform
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl animate-fade-in">
              Find Your Game.
              <span className="text-primary"> Book Your Turf.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground animate-fade-in">
              Discover and book turfs near you for cricket, football, badminton and more. Instant booking, real-time availability, zero hassle.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center animate-fade-in">
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

      {/* Stats Bar */}
      <section className="border-b bg-card py-8">
        <div className="container grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map(s => (
            <div key={s.label} className="flex items-center gap-3 justify-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
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
            <div key={f.title} className="flex items-start gap-3 rounded-lg border p-4 transition-all hover:shadow-md hover:border-primary/30">
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

      {/* Demo Turfs – show when no real turfs */}
      {!hasRealTurfs && !isLoading && (
        <section className="py-12 bg-gradient-to-b from-background to-muted/30">
          <div className="container">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-3">✨ Featured Turfs</Badge>
              <h2 className="font-display text-3xl font-bold">Popular Turfs Across India</h2>
              <p className="text-muted-foreground mt-2">Top-rated venues loved by thousands of players</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_TURFS.map((turf, i) => (
                <Card
                  key={turf.id}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                  onClick={() => navigate("/auth?tab=signup")}
                >
                  <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10">
                    <div className="flex h-full items-center justify-center">
                      <span className="text-6xl transition-transform group-hover:scale-110">{turf.emoji}</span>
                    </div>
                    <Badge className="absolute right-2 top-2">{SPORT_LABELS[turf.sport_type]}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-display font-semibold text-lg truncate">{turf.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{turf.description}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {turf.area}, {turf.city}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-display font-bold text-primary">₹{turf.hourly_price}/hr</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                        <span>4.{5 + (i % 4)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button size="lg" onClick={() => navigate("/auth?tab=signup")}>
                Sign Up to Book Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Real Turfs Section */}
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
                  <Card key={turf.id} className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary/30" onClick={() => navigate(`/turf/${turf.id}`)}>
                    <div className="relative aspect-video bg-muted">
                      {img ? (
                        <img src={img} alt={turf.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
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

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold mb-3">Own a Turf? List It Free!</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Join hundreds of turf owners earning more. Get bookings from thousands of players with zero listing fees.
          </p>
          <Button size="lg" onClick={() => navigate("/auth?tab=signup")}>
            Register as Owner
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  );
};

export default Index;
