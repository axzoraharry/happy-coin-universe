
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, CreditCard, Plane, Smartphone, ShoppingCart, Shield } from 'lucide-react';

export function FeaturesGrid() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
          Everything You Need, Powered by AI
        </h2>
        <p className="text-lg text-purple-200 max-w-3xl mx-auto">
          One platform, infinite possibilities. From financial management to travel booking, 
          all integrated with Happy Paisa digital currency.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* AI Chat Interface */}
        <Card className="bg-gradient-to-br from-purple-800/40 to-blue-800/40 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">AI Assistant</CardTitle>
                <CardDescription className="text-purple-200">Natural Language Interface</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-purple-100">
              Chat naturally with Mr. Happy AI to manage all your services, 
              get recommendations, and complete tasks effortlessly.
            </p>
          </CardContent>
        </Card>

        {/* Happy Paisa Wallet */}
        <Card className="bg-gradient-to-br from-yellow-800/40 to-orange-800/40 backdrop-blur-sm border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 group">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Happy Paisa Wallet</CardTitle>
                <CardDescription className="text-yellow-200">Digital Currency (1 HP = ₹1000)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-100">
              Seamlessly manage your Happy Paisa digital currency with 
              instant transfers, payments, and real-time balance tracking.
            </p>
          </CardContent>
        </Card>

        {/* Travel Booking */}
        <Card className="bg-gradient-to-br from-blue-800/40 to-cyan-800/40 backdrop-blur-sm border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Travel Services</CardTitle>
                <CardDescription className="text-blue-200">Flights, Hotels, Packages</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-blue-100">
              Book flights, hotels, and travel packages with AI-powered 
              recommendations and instant Happy Paisa payments.
            </p>
          </CardContent>
        </Card>

        {/* Recharge Services */}
        <Card className="bg-gradient-to-br from-green-800/40 to-emerald-800/40 backdrop-blur-sm border-green-500/30 hover:border-green-400/50 transition-all duration-300 group">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Recharge & Bills</CardTitle>
                <CardDescription className="text-green-200">Mobile, DTH, Utilities</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-green-100">
              Instantly recharge mobiles, pay bills, and manage utilities 
              with automated reminders and smart payment scheduling.
            </p>
          </CardContent>
        </Card>

        {/* E-Commerce */}
        <Card className="bg-gradient-to-br from-red-800/40 to-pink-800/40 backdrop-blur-sm border-red-500/30 hover:border-red-400/50 transition-all duration-300 group">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">E-Commerce</CardTitle>
                <CardDescription className="text-red-200">AI-Curated Shopping</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-100">
              Discover products through AI recommendations, compare prices, 
              and shop with secure Happy Paisa transactions.
            </p>
          </CardContent>
        </Card>

        {/* Security & Trust */}
        <Card className="bg-gradient-to-br from-indigo-800/40 to-purple-800/40 backdrop-blur-sm border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 group">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Enterprise Security</CardTitle>
                <CardDescription className="text-indigo-200">Bank-Grade Protection</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-indigo-100">
              Advanced encryption, multi-factor authentication, and 
              real-time fraud detection keep your data secure.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
