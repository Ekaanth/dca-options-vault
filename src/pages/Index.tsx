import { VaultStats } from "@/components/VaultStats";
import { VaultDeposit } from "@/components/VaultDeposit";
import { ActiveOptions } from "@/components/ActiveOptions";

const Index = () => {
  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Option Vault DCA</h1>
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