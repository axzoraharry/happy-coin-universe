
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Accounts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Accounts</h1>
        <p className="text-muted-foreground">Manage your linked accounts</p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-medium">Chase Checking</p>
                <p className="text-sm text-muted-foreground">****1234</p>
              </div>
              <span className="font-bold">$8,245.67</span>
            </div>
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-medium">Wells Fargo Savings</p>
                <p className="text-sm text-muted-foreground">****5678</p>
              </div>
              <span className="font-bold">$15,432.10</span>
            </div>
            <Button className="w-full">Add New Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
