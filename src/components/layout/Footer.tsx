import logoIcon from "@/assets/logo-icon.png";

const Footer = () => (
  <footer className="border-t bg-card py-8 mt-auto">
    <div className="container flex flex-col items-center gap-4 md:flex-row md:justify-between">
      <div className="flex items-center gap-2">
        <img src={logoIcon} alt="BookMyTurf" className="h-7 w-7 rounded-md" />
        <span className="font-display font-semibold">BookMyTurf</span>
      </div>
      <div className="flex flex-col items-center gap-1 md:items-end">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} BookMyTurf. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground">
          Built by{" "}
          <a href="https://adwebcomicagency.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            Ad Web Comic Agency
          </a>
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
