import { MapPin } from "lucide-react";

const Footer = () => (
  <footer className="border-t bg-card py-8 mt-auto">
    <div className="container flex flex-col items-center gap-4 md:flex-row md:justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <MapPin className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display font-semibold">BookMyTurf</span>
      </div>
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} BookMyTurf. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
