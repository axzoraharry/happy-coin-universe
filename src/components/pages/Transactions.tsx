
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Transactions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">View and manage your transaction history</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-medium">Coffee Purchase</p>
                <p className="text-sm text-muted-foreground">Starbucks • Today</p>
              </div>
              <span className="text-red-600">-$4.50</span>
            </div>
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-medium">Salary Deposit</p>
                <p className="text-sm text-muted-foreground">Company Inc • Yesterday</p>
              </div>
              <span className="text-green-600">+$2,500.00</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
