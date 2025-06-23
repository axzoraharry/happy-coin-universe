
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MessageCircle, CreditCard, Plane, Smartphone, ShoppingCart, Brain, Shield, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LandingPageProps {
  onGetStarted?: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none px-4 py-2 text-lg">
                <Sparkles className="h-5 w-5 mr-2" />
                Axzora's Mr. Happy 2.0
              </Badge>
              <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
                Your AI-Powered
                <br />
                Digital Universe
              </h1>
              <p className="text-xl md:text-2xl text-purple-200 max-w-4xl mx-auto leading-relaxed">
                Experience the future of digital interaction with our unified AI ecosystem. 
                Manage finances, book travel, shop, and more—all through natural conversation 
                powered by Happy Paisa (1 HP = ₹1000).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {onGetStarted ? (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onClick={handleGetStarted}
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Start Your AI Journey
                </Button>
              ) : (
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <Brain className="h-5 w-5 mr-2" />
                    Start Your AI Journey
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="lg"
                className="border-purple-400 text-purple-200 hover:bg-purple-800/30 px-8 py-4 text-lg"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
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

      {/* Key Features */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
            Why Choose Mr. Happy 2.0?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Lightning Fast</h3>
            <p className="text-purple-200">
              Real-time processing with instant responses and seamless interactions 
              across all services and platforms.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">AI-Powered</h3>
            <p className="text-purple-200">
              Advanced machine learning algorithms provide personalized recommendations 
              and predictive insights for better decisions.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Universal Access</h3>
            <p className="text-purple-200">
              One platform for all your digital needs - finance, travel, shopping, 
              and services, accessible from anywhere.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-3xl p-12 border border-purple-500/30">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Join millions of users who trust Axzora's Mr. Happy 2.0 for their digital lifestyle. 
            Start your journey today with our AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {onGetStarted ? (
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
                onClick={handleGetStarted}
              >
                Get Started Free
              </Button>
            ) : (
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
                >
                  Get Started Free
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="lg"
              className="border-purple-400 text-purple-200 hover:bg-purple-800/30 px-8 py-4 text-lg"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
