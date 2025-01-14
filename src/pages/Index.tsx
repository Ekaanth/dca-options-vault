import { VaultStats } from "@/components/VaultStats";
import { VaultDeposit } from "@/components/VaultDeposit";
import { ActiveOptions } from "@/components/ActiveOptions";

const Index = () => {
  return (
    <div className="min-h-screen p-6 space-y-6 relative">
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-secondary/10 to-transparent pointer-events-none" />
      
      <header className="mb-8 relative">
        <h1 className="text-4xl font-bold mb-2 value-text">Option Vault DCA</h1>
        <p className="text-muted-foreground">
          Automated covered call strategy with DCA reinvestment
        </p>
      </header>

      <VaultStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveOptions />
        </div>
        <div>
          <VaultDeposit />
        </div>
      </div>
    </div>
  );
};

export default Index;