import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic2, Volume2, Download, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
              <Mic2 className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              Dalsi Voice
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
                <Link href="/generator">
                  <Button className="btn-primary">Generate Voice</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="btn-primary">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Transform Text into Natural Speech
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Experience premium text-to-speech with multiple accents, genders, and voice types. Create professional audio content in seconds.
            </p>
            {isAuthenticated ? (
              <Link href="/generator">
                <Button size="lg" className="btn-primary text-lg px-8 py-6">
                  Start Creating
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="btn-primary text-lg px-8 py-6">
                  Get Started Free
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-16">Premium Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-elegant p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-4">
                <Volume2 className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Multiple Accents</h3>
              <p className="text-muted-foreground">
                Choose from US, UK, Australian, Indian, and more. Each accent is professionally crafted for authenticity.
              </p>
            </Card>

            <Card className="card-elegant p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-4">
                <Mic2 className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Voice Variety</h3>
              <p className="text-muted-foreground">
                Select from male, female, and non-binary voices with different tones: young, mature, professional, or casual.
              </p>
            </Card>

            <Card className="card-elegant p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Easy Download</h3>
              <p className="text-muted-foreground">
                Download your generated audio in MP3 or WAV format. Perfect for videos, podcasts, and presentations.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Usage Limit Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <Card className="card-elegant p-12 text-center">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Generous Limits</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Each session allows you to generate and download up to 2 high-quality audio files. Perfect for testing and creating your perfect voice.
              </p>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">2</div>
                  <div className="text-sm text-muted-foreground">Generations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">5000</div>
                  <div className="text-sm text-muted-foreground">Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">7</div>
                  <div className="text-sm text-muted-foreground">Voice Options</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent/10 to-accent/5">
        <div className="container text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Create?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Sign in to start generating professional voice content today.
          </p>
          {isAuthenticated ? (
            <Link href="/generator">
              <Button size="lg" className="btn-primary text-lg px-8 py-6">
                Open Generator
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="btn-primary text-lg px-8 py-6">
                Sign In Now
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Mic2 className="w-5 h-5 text-accent" />
              <span className="font-semibold">Dalsi Voice</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Dalsi Voice. All rights reserved. | dalsivoice.io
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
