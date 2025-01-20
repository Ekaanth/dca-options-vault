import { ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-4 px-6 border-t border-border/40">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div>
          © {currentYear} Caddy Finance. All rights reserved.
        </div>
        <div className="flex items-center gap-2">
          Powered by{" "}
          <Button 
            variant="link" 
            className="h-auto p-0 text-muted-foreground hover:text-primary"
            onClick={() => window.open('https://pragma.build', '_blank')}
          >
            Pragma <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
          {" "}and{" "}
          <Button
            variant="link"
            className="h-auto p-0 text-muted-foreground hover:text-primary"
            onClick={() => window.open('https://carmine.finance', '_blank')}
          >
            Carmine <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </footer>
  );
} 