
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Profile Information
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Security & Privacy
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Notification Preferences
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>App Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Theme Settings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Language
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Currency
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
