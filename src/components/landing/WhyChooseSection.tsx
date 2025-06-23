
import { Zap, Brain, Globe } from 'lucide-react';

export function WhyChooseSection() {
  return (
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
  );
}
