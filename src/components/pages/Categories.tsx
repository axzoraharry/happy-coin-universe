
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Categories() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground">Organize your transactions with categories</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                🍔
              </div>
              <span className="text-sm font-medium">Food & Dining</span>
              <Badge variant="secondary" className="mt-1">24 transactions</Badge>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                🚗
              </div>
              <span className="text-sm font-medium">Transportation</span>
              <Badge variant="secondary" className="mt-1">8 transactions</Badge>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                🛒
              </div>
              <span className="text-sm font-medium">Shopping</span>
              <Badge variant="secondary" className="mt-1">12 transactions</Badge>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                🎬
              </div>
              <span className="text-sm font-medium">Entertainment</span>
              <Badge variant="secondary" className="mt-1">6 transactions</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
