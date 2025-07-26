
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  Heart, 
  Smile, 
  Shield, 
  Zap, 
  Users, 
  MessageCircle, 
  Eye,
  Sparkles,
  Headphones
} from 'lucide-react';

export function FeaturesGrid() {
  const features = [
    {
      icon: Brain,
      title: "Emotional Intelligence",
      description: "Mr. Happy detects your emotions through voice and text, adapting his responses to provide comfort, encouragement, or celebration as needed.",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      icon: Heart,
      title: "Empathetic Responses",
      description: "Every interaction is designed with empathy at its core, making you feel truly heard and understood in every conversation.",
      gradient: "from-purple-500 to-violet-500"
    },
    {
      icon: Smile,
      title: "Delightful Interactions",
      description: "Beautiful animations, satisfying haptic feedback, and joyful micro-interactions make every task feel effortless and fun.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Users,
      title: "Relationship Memory",
      description: "Mr. Happy remembers your preferences, past conversations, and emotional patterns to build a genuine, ongoing relationship.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Transparent & Trustworthy",
      description: "Clear privacy controls, honest communication about capabilities, and ethical AI practices you can trust completely.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Headphones,
      title: "Expressive Voice",
      description: "Mr. Happy's voice adapts its tone, pace, and emotion to match the context and your emotional state for natural conversations.",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: Zap,
      title: "Proactive Assistance",
      description: "Anticipates your needs based on patterns and context, offering helpful suggestions before you even ask.",
      gradient: "from-red-500 to-pink-500"
    },
    {
      icon: Eye,
      title: "Context Awareness",
      description: "Understands not just what you say, but the situation you're in, providing contextually relevant and timely help.",
      gradient: "from-teal-500 to-blue-500"
    },
    {
      icon: Sparkles,
      title: "Continuous Learning",
      description: "Grows smarter and more attuned to your preferences over time, making each interaction better than the last.",
      gradient: "from-violet-500 to-purple-500"
    }
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Built on Axzora Principles
          </h2>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Every feature is designed with emotional intelligence, user well-being, and delightful experiences at its core
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 group hover:scale-105"
              >
                <CardHeader className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} p-3 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl group-hover:text-purple-200 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-purple-300 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Emotional AI Philosophy Section */}
        <div className="mt-20 bg-gradient-to-r from-purple-800/20 to-pink-800/20 rounded-3xl p-8 md:p-12 backdrop-blur-sm border border-white/10">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 rounded-full">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              More Than Just AI—A Genuine Companion
            </h3>
            <p className="text-lg text-purple-200 max-w-4xl mx-auto leading-relaxed">
              Mr. Happy 2.0 represents a new paradigm in AI interaction. Instead of treating you as a user to be served, 
              he sees you as a person to be understood, supported, and celebrated. Every conversation builds trust, 
              every interaction brings delight, and every feature prioritizes your emotional well-being alongside functionality.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-purple-200 border border-white/20">
                Emotion-First Design
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-purple-200 border border-white/20">
                Privacy by Design
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-purple-200 border border-white/20">
                Ethical AI Practices
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-purple-200 border border-white/20">
                Well-being Focused
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
