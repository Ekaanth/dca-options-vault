import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDispatch } from 'react-redux';
import { setConnectionDetails } from "@/store/connectionAction";

export function WalletConnect() {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const dispatch = useDispatch();

  useEffect(() => {
    async function handleUserRecord() {
      if (!address) return;

      try {
                // Dispatch the action to update the Redux store
                dispatch(
                  setConnectionDetails({
                    address: address,
                  })
                );
        console.log('Checking user record for address:', address);
        
        // Check if user exists
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', address)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        const now = new Date().toISOString();

        if (existingUser) {
          console.log('Updating existing user:', existingUser);
          const { error: updateError } = await supabase
            .from('users')
            .update({ last_connected_at: now })
            .eq('wallet_address', address);

          if (updateError) throw updateError;
        } else {
          console.log('Creating new user record');
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              { 
                wallet_address: address,
                first_connected_at: now,
                last_connected_at: now
              }
            ]);

          if (insertError) throw insertError;

          toast({
            title: "Welcome!",
            description: "Your wallet has been connected and registered.",
          });
        }
      } catch (error) {
        console.error('Error managing user record:', error);
        toast({
          title: "Error",
          description: "Failed to sync wallet data",
          variant: "destructive",
        });
      }
    }

    handleUserRecord();
  }, [address, toast]);

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