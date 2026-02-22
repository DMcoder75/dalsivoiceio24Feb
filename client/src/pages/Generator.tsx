import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Volume2, Download, Play, Pause, RotateCcw, Mic2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface VoiceProfile {
  id: number;
  name: string;
  accent: string;
  gender: "male" | "female" | "non-binary";
  voiceType: string;
  avatarUrl: string;
  description: string;
}

export default function Generator() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const [text, setText] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState<number | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch voice profiles
  const { data: voiceProfiles = [] } = trpc.voice.getAllProfiles.useQuery();

  // Initialize session
  const initSessionMutation = trpc.voice.initSession.useMutation();
  const generateMutation = trpc.voice.generate.useMutation();

  useEffect(() => {
    const initSession = async () => {
      try {
        const result = await initSessionMutation.mutateAsync();
        setSessionToken(result.sessionToken);
      } catch (error) {
        toast.error("Failed to initialize session");
      }
    };

    if (isAuthenticated) {
      initSession();
    }
  }, [isAuthenticated]);

  const { data: sessionInfo, refetch: refetchSession } = trpc.voice.getSession.useQuery(
    { sessionToken: sessionToken || "" },
    { enabled: !!sessionToken }
  );

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }

    if (!selectedVoiceId) {
      toast.error("Please select a voice");
      return;
    }

    if (!sessionToken) {
      toast.error("Session not initialized");
      return;
    }

    if (!sessionInfo?.canGenerate) {
      toast.error("Generation limit reached for this session");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({
        sessionToken,
        voiceProfileId: selectedVoiceId,
        text,
      });

      setAudioUrl(result.audioUrl);
      toast.success("Audio generated successfully!");

      refetchSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate audio");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedVoice = voiceProfiles.find((v) => v.id === selectedVoiceId);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic2 className="w-6 h-6 text-accent" />
            <span className="text-xl font-bold">Dalsi Voice Generator</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {sessionInfo && (
              <span>
                Remaining: <span className="font-semibold text-accent">{sessionInfo.remainingGenerations}</span> / 2
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Voice Selection */}
          <div className="lg:col-span-1">
            <Card className="card-elegant p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Select Voice</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">Gender</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">Accent</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Accents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accents</SelectItem>
                      <SelectItem value="US">US</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="Australian">Australian</SelectItem>
                      <SelectItem value="Indian">Indian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">Voice Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="young">Young</SelectItem>
                      <SelectItem value="mature">Mature</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {voiceProfiles.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoiceId(voice.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedVoiceId === voice.id
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50 bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={voice.avatarUrl}
                        alt={voice.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{voice.name}</div>
                        <div className="text-xs text-muted-foreground">{voice.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Panel - Text Input & Generation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <Card className="card-elegant p-6">
              <h2 className="text-2xl font-bold mb-4">Your Text</h2>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech (max 5000 characters)..."
                className="min-h-48 resize-none"
                maxLength={5000}
              />
              <div className="mt-2 text-sm text-muted-foreground">
                {text.length} / 5000 characters
              </div>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !sessionInfo?.canGenerate || !selectedVoiceId || !text.trim()}
              size="lg"
              className="w-full btn-primary text-lg py-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5 mr-2" />
                  Generate Speech
                </>
              )}
            </Button>

            {/* Audio Preview */}
            {audioUrl && (
              <Card className="card-elegant p-6">
                <h2 className="text-2xl font-bold mb-4">Preview & Download</h2>

                {selectedVoice && (
                  <div className="flex items-center gap-4 mb-6 p-4 bg-accent/5 rounded-lg">
                    <img
                      src={selectedVoice.avatarUrl}
                      alt={selectedVoice.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{selectedVoice.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedVoice.description}</div>
                    </div>
                  </div>
                )}

                {/* Audio Player */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <audio
                    src={audioUrl}
                    controls
                    className="w-full"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>

                {/* Download Buttons */}
                <div className="flex gap-3">
                  <Button className="flex-1 btn-primary" onClick={() => {
                    const a = document.createElement("a");
                    a.href = audioUrl;
                    a.download = `dalsi-voice-${Date.now()}.mp3`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Download MP3
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    const a = document.createElement("a");
                    a.href = audioUrl;
                    a.download = `dalsi-voice-${Date.now()}.wav`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Download WAV
                  </Button>
                </div>

                {/* Reset Button */}
                <Button
                  variant="ghost"
                  className="w-full mt-3"
                  onClick={() => {
                    setAudioUrl(null);
                    setText("");
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Create Another
                </Button>
              </Card>
            )}

            {/* Info Card */}
            {!audioUrl && (
              <Card className="card-elegant p-6 bg-accent/5 border-accent/20">
                <div className="flex gap-3">
                  <Volume2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-2">How it works</h3>
                    <ol className="text-sm text-muted-foreground space-y-1">
                      <li>1. Select a voice profile with your preferred accent and tone</li>
                      <li>2. Enter the text you want to convert to speech</li>
                      <li>3. Click "Generate Speech" to create your audio</li>
                      <li>4. Preview and download in MP3 or WAV format</li>
                      <li>5. You have 2 generations per session</li>
                    </ol>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
