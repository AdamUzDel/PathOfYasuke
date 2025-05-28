import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Sword, Shield, Crown, Target, BookOpen, Users, Star, ArrowRight, CheckCircle } from "lucide-react"
import { SamuraiIcon } from "@/public/icons/NavIcons"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yasuke-dark via-background to-yasuke-darker">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-yasuke-crimson rounded-full p-1 flex items-center justify-center">
              
              <SamuraiIcon className="h-10 w-10 text-white" />
            </div>
            <span className="text-xl font-bold yasuke-text-gradient">Path of Yasuke</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Button asChild className="yasuke-gradient hover:opacity-90 transition-opacity">
              <Link href="/auth/signup">Start Your Path</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-10 sm:py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-yasuke-crimson/50 text-yasuke-crimson">
            <Crown className="w-4 h-4 mr-2" />
            Forge Your Destiny
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="yasuke-text-gradient">Forge Discipline.</span>
            <br />
            <span className="text-foreground">Lead with Honor.</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Embark on a journey of self-mastery inspired by the legendary African samurai. Build discipline, cultivate
            wisdom, and achieve personal excellence through gamified growth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild className="yasuke-gradient hover:opacity-90 transition-opacity samurai-shadow">
              <Link href="/auth/signup">
                Begin Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-yasuke-steel hover:bg-yasuke-steel/10">
              <Link href="#features">
                Explore Features
                <Shield className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-4xl mx-auto">
            <div className="float-animation">
              <Card className="bg-card/50 backdrop-blur-sm border-yasuke-crimson/20 samurai-shadow">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yasuke-crimson/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-yasuke-crimson" />
                      </div>
                      <h3 className="font-semibold mb-2">Daily Quests</h3>
                      <p className="text-sm text-muted-foreground">Complete meaningful challenges</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yasuke-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-yasuke-gold" />
                      </div>
                      <h3 className="font-semibold mb-2">Honor Journal</h3>
                      <p className="text-sm text-muted-foreground">Reflect and grow daily</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yasuke-steel/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-yasuke-steel" />
                      </div>
                      <h3 className="font-semibold mb-2">Level Up</h3>
                      <p className="text-sm text-muted-foreground">Track your progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Way of the <span className="yasuke-text-gradient">Modern Samurai</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the tools and practices that will transform your daily routine into a path of honor and
              excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Path Builder",
                description: "Create custom growth paths with goals and daily tasks tailored to your journey.",
                color: "yasuke-crimson",
              },
              {
                icon: BookOpen,
                title: "Honor Journal",
                description: "Daily reflection prompts to cultivate wisdom and track your inner growth.",
                color: "yasuke-gold",
              },
              {
                icon: Crown,
                title: "Virtue System",
                description: "Learn and embody the seven virtues of the samurai through daily practice.",
                color: "yasuke-steel",
              },
              {
                icon: Star,
                title: "XP & Levels",
                description: "Gamified progression system that rewards consistency and achievement.",
                color: "yasuke-crimson",
              },
              {
                icon: Users,
                title: "Community",
                description: "Connect with fellow warriors on the path to self-mastery and excellence.",
                color: "yasuke-gold",
              },
              {
                icon: Shield,
                title: "Resilience Meter",
                description: "Track your mental fortitude and build unshakeable inner strength.",
                color: "yasuke-steel",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-yasuke-crimson/30 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 bg-${feature.color}/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className={`w-6 h-6 text-${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your <span className="yasuke-text-gradient">Path</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free and upgrade when you're ready to unlock your full potential.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Apprentice</h3>
                  <div className="text-3xl font-bold mb-4">Free</div>
                  <p className="text-muted-foreground">Perfect for starting your journey</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "Daily virtue practices",
                    "Basic quest system",
                    "Honor journal (7 days)",
                    "Progress tracking",
                    "Community access",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-yasuke-crimson mr-3" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full" variant="outline" asChild>
                  <Link href="/auth/signup">Start Free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-card/50 backdrop-blur-sm border-yasuke-crimson/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yasuke-gradient text-white px-3 py-1 text-sm font-medium">
                Most Popular
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Samurai</h3>
                  <div className="text-3xl font-bold mb-4">
                    <span className="yasuke-text-gradient">$9.99</span>
                    <span className="text-lg text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground">For serious practitioners</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "Everything in Apprentice",
                    "Unlimited journal history",
                    "Advanced analytics",
                    "Custom themes & avatars",
                    "AI mentor (coming soon)",
                    "Export to PDF/Notion",
                    "Priority support",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-yasuke-gold mr-3" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full yasuke-gradient hover:opacity-90" asChild>
                  <Link href="/auth/signup?plan=pro">Upgrade to Pro</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-yasuke-crimson/10 via-yasuke-gold/10 to-yasuke-crimson/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Begin Your <span className="yasuke-text-gradient">Transformation?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of modern warriors who have chosen the path of discipline, honor, and excellence.
          </p>
          <Button size="lg" asChild className="yasuke-gradient hover:opacity-90 transition-opacity samurai-shadow">
            <Link href="/auth/signup">
              Start Your Journey Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-yasuke-crimson to-yasuke-gold rounded-lg flex items-center justify-center">
                  <Sword className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold yasuke-text-gradient">Path of Yasuke</span>
              </div>
              <p className="text-muted-foreground">
                Forge discipline. Lead with honor. Transform your life through the way of the modern samurai.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-foreground transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/discord" className="hover:text-foreground transition-colors">
                    Discord
                  </Link>
                </li>
                <li>
                  <Link href="/twitter" className="hover:text-foreground transition-colors">
                    Twitter
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Path of Yasuke. All rights reserved. Built with honor and discipline.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
