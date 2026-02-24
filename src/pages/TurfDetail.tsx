import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, IndianRupee, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

const SPORT_LABELS: Record<string, string> = {
  cricket: "🏏 Cricket", football: "⚽ Football", badminton: "🏸 Badminton",
  tennis: "🎾 Tennis", basketball: "🏀 Basketball", hockey: "🏑 Hockey",
  volleyball: "🏐 Volleyball", other: "🎯 Other",
};

const TurfDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const { data: turf, isLoading } = useQuery({
    queryKey: ["turf", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turfs")
        .select("*, turf_images(image_url, display_order)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const dayOfWeek = selectedDate ? selectedDate.getDay() : new Date().getDay();

  const { data: slots } = useQuery({
    queryKey: ["slots", id, dayOfWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turf_slots")
        .select("*")
        .eq("turf_id", id!)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .order("start_time");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: bookedSlots } = useQuery({
    queryKey: ["booked-slots", id, selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("slot_id")
        .eq("turf_id", id!)
        .eq("booking_date", format(selectedDate!, "yyyy-MM-dd"))
        .in("status", ["pending", "confirmed"]);
      if (error) throw error;
      return data.map(b => b.slot_id);
    },
    enabled: !!id && !!selectedDate,
  });

  const handleBook = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!selectedSlot || !selectedDate || !turf) return;

    setBooking(true);
    try {
      const slot = slots?.find(s => s.id === selectedSlot);
      const price = Number(slot?.price_override ?? turf.hourly_price);
      const commission = Math.round(price * 0.1 * 100) / 100;
      const ownerAmount = Math.round((price - commission) * 100) / 100;

      const { data: bookingData, error } = await supabase.from("bookings").insert({
        turf_id: turf.id,
        slot_id: selectedSlot,
        player_id: user.id,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        total_amount: price,
        commission_amount: commission,
        owner_amount: ownerAmount,
        status: "confirmed",
      }).select().single();

      if (error) throw error;

      // Create mock payment
      await supabase.from("payments").insert({
        booking_id: bookingData.id,
        amount: price,
        status: "success",
        transaction_id: `MOCK_${Date.now()}`,
      });

      // Payout ledger entry is auto-created by database trigger

      toast({ title: "Booking confirmed! 🎉", description: `Your slot is booked for ${format(selectedDate, "PPP")}` });
      setSelectedSlot(null);
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  if (isLoading) return (
    <div className="container py-12 space-y-4">
      <Skeleton className="h-64 w-full rounded-lg" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );

  if (!turf) return (
    <div className="container py-12 text-center">
      <h2 className="font-display text-2xl font-bold">Turf not found</h2>
    </div>
  );

  const images = turf.turf_images?.sort((a: any, b: any) => a.display_order - b.display_order) ?? [];

  return (
    <div className="container py-8">
      {/* Images */}
      <div className="mb-6">
        {images.length > 1 ? (
          <Carousel className="w-full">
            <CarouselContent>
              {images.map((img: any, i: number) => (
                <CarouselItem key={i}>
                  <div className="aspect-video overflow-hidden rounded-xl bg-muted">
                    <img src={img.image_url} alt={`${turf.name} - ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        ) : images.length === 1 ? (
          <div className="aspect-video overflow-hidden rounded-xl bg-muted">
            <img src={images[0].image_url} alt={turf.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-6xl">🏟️</div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge>{SPORT_LABELS[turf.sport_type] ?? turf.sport_type}</Badge>
            </div>
            <h1 className="font-display text-3xl font-bold">{turf.name}</h1>
            <div className="mt-2 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {turf.area}, {turf.city} {turf.address && `· ${turf.address}`}
            </div>
          </div>

          {turf.description && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{turf.description}</p>
            </div>
          )}

          {turf.amenities && turf.amenities.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {turf.amenities.map((a: string) => (
                  <Badge key={a} variant="secondary">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg border p-4">
            <IndianRupee className="h-5 w-5 text-primary" />
            <span className="font-display text-2xl font-bold text-primary">₹{turf.hourly_price}</span>
            <span className="text-muted-foreground">/hour</span>
          </div>
        </div>

        {/* Booking Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Book a Slot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} className="rounded-md border" />

            {selectedDate && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Available Slots – {format(selectedDate, "EEE, MMM d")}
                </h4>
                {slots && slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map(slot => {
                      const isBooked = bookedSlots?.includes(slot.id);
                      const isSelected = selectedSlot === slot.id;
                      return (
                        <Button
                          key={slot.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(isSelected ? null : slot.id)}
                          className="text-xs"
                        >
                          {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                          {isBooked && " (Booked)"}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No slots available for this day</p>
                )}
              </div>
            )}

            <Button className="w-full" disabled={!selectedSlot || booking} onClick={handleBook}>
              {booking ? "Booking..." : "Confirm Booking"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TurfDetail;
