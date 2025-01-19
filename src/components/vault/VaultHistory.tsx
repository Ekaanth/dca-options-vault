import { useAccount } from "@starknet-react/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function VaultHistory() {
  const { address } = useAccount();
  const { 
    transactions, 
    isLoading, 
    error, 
    hasMore, 
    loadMore,
    page,
    totalCount,
    pageSize
  } = useTransactionHistory(address);

  const handleRowClick = (txHash: string) => {
    window.open(`https://sepolia.starkscan.co/tx/${txHash}`, '_blank');
  };

  if (isLoading && page === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Loading transactions...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Transaction History</span>
          <span className="text-sm text-muted-foreground">
            Showing {Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground">No transactions found</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {transactions.map((tx) => (
                <div
                  key={tx.tx_hash}
                  className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleRowClick(tx.tx_hash)}
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {tx.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-medium ${
                      tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'deposit' ? '+' : '-'}{tx.amount} STRK
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 