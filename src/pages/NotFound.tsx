import { Shield, Home } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h1 className="text-6xl font-bold font-mono text-primary mb-2">404</h1>
      <p className="text-muted-foreground font-mono text-sm mb-6">ACCESS DENIED — ROUTE NOT FOUND</p>
      <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
        <Home className="h-4 w-4" />
        Return to SOC
      </Link>
    </div>
  );
};

export default NotFound;
