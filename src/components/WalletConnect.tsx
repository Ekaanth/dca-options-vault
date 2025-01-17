import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { Button } from "@/components/ui/button";

export function WalletConnect() {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const connectBraavos = () => {
    const braavosConnector = connectors.find((c) => c.id === "braavos");
    if (braavosConnector) {
      connect({ connector: braavosConnector });
    }
  };

  if (address) {
    return (
      <Button 
        className="bg-[#29296E] hover:bg-[#1a1a4d] text-white border-none font-medium"
        onClick={() => disconnect()}
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button
      className="bg-[#29296E] hover:bg-[#1a1a4d] text-white border-none font-medium"
      onClick={connectBraavos}
    >
      Connect Braavos
    </Button>
  );
} 