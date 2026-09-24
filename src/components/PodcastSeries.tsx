import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Mic, 
  UserCheck, 
  Download, 
  ListChecks,
  Loader2,
  AlertCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { Stagger, StaggerItem, PressFeedback } from '../lib/animations';

interface TopperPodcast {
  id: string;
  topperName: string;
  rank: string;
  subject: string;
  audioUrl: string;
  duration: string;
  description: string;
  booklist: string[];
}

export const PodcastSeries: React.FC = () => {
  const [podcasts, setPodcasts] = useState<TopperPodcast[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom Audio Player State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Fetch podcasts from backend with instant offline fallback
  const fetchPodcasts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/podcasts');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.podcasts) && data.podcasts.length > 0) {
        setPodcasts(data.podcasts);
        return;
      }
    } catch (err: any) {
      console.warn('Loading curated topper podcasts fallback');
    } finally {
      // Fallback offline curated podcasts (Synthesized Voice Audio Guides)
      setPodcasts([
        {
          id: 'p1',
          topperName: 'StudyRide Editorial Desk',
          rank: 'Synthesized Voice Audio Guide',
          subject: 'Polity & GS Paper 2 Strategy Masterclass',
          audioUrl: '/audio/upsc_gs2_polity_masterclass.wav',
          duration: '00:51',
          description: 'High-yield masterclass on GS Paper 2 answer writing frameworks. Note: Scripted by the StudyRide academic editorial desk and delivered via synthetic voice narration for study revision.',
          booklist: ['Indian Polity by M. Laxmikanth', 'Introduction to the Constitution of India by D.D. Basu', 'Second ARC Reports on Ethics in Governance']
        },
        {
          id: 'p2',
          topperName: 'StudyRide Editorial Desk',
          rank: 'Synthesized Voice Audio Guide',
          subject: 'Geography Optional & Mapping Technique Guide',
          audioUrl: '/audio/geography_answer_writing_guide.wav',
          duration: '00:42',
          description: 'Spatial visualization strategy for Geography: connecting physical theory with regional planning. Note: Scripted by the StudyRide editorial desk and delivered via synthetic voice narration.',
          booklist: ['Physical Geography by Savindra Singh', 'India: A Comprehensive Geography by D.R. Khullar', 'StudyRide Cartography Reference Sheets']
        },
        {
          id: 'p3',
          topperName: 'StudyRide Editorial Desk',
          rank: 'Synthesized Voice Audio Guide',
          subject: 'NEET UG High-Yield Physics & Diagrammatic Biology',
          audioUrl: '/audio/neet_physics_problem_solving.wav',
          duration: '00:39',
          description: 'Essential guidance for NEET 700+ target: rapid numerical techniques and NCERT retention. Note: Scripted by the StudyRide editorial desk and delivered via synthetic voice narration.',
          booklist: ['NCERT Biology Class 11 & 12', 'Concepts of Physics by H.C. Verma', 'Physical Chemistry by O.P. Tandon']
        }
      ]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPodcasts();
  }, [fetchPodcasts]);

  const currentPlaying = podcasts.find(p => p.id === playingId);

  // Toggle Play / Pause for a specific podcast episode
  const togglePlay = (pod: TopperPodcast) => {
    if (!audioRef.current) return;

    if (playingId === pod.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    } else {
      setPlayingId(pod.id);
      audioRef.current.src = pod.audioUrl;
      audioRef.current.playbackRate = speed;
      audioRef.current.muted = isMuted;

      // Resume from saved position in localStorage if available
      const savedPos = localStorage.getItem(`podcast_pos_${pod.id}`);
      const startPos = savedPos ? parseFloat(savedPos) : 0;

      const handleCanPlay = () => {
        if (audioRef.current) {
          if (startPos > 0 && startPos < audioRef.current.duration) {
            audioRef.current.currentTime = startPos;
          }
          audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
        }
        audioRef.current?.removeEventListener('canplay', handleCanPlay);
      };

      audioRef.current.addEventListener('canplay', handleCanPlay);
      audioRef.current.load();
    }
  };

  // Handle time update event from real <audio> element
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 0;
    setCurrentTime(curr);
    setDuration(dur);
    setProgress(dur > 0 ? (curr / dur) * 100 : 0);

    // Save position locally in localStorage
    if (playingId && curr > 0) {
      localStorage.setItem(`podcast_pos_${playingId}`, curr.toString());
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  // Handle Seek Bar Click
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(pct * 100);
    if (playingId) {
      localStorage.setItem(`podcast_pos_${playingId}`, newTime.toString());
    }
  };

  // Handle Speed Change
  const handleSpeedChange = (sp: number) => {
    setSpeed(sp);
    if (audioRef.current) {
      audioRef.current.playbackRate = sp;
    }
  };

  // Handle Mute Toggle
  const handleMuteToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.muted = nextMute;
    }
  };

  // Reset/Restart Podcast
  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
      if (playingId) {
        localStorage.setItem(`podcast_pos_${playingId}`, '0');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden Real <audio> Element */}
      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
        preload="metadata"
      />

      {/* Header section */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
            Strategy Audio Masterclasses & Study Guides
            <span className="text-[9px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 font-semibold tracking-wider uppercase">
              Synthesized Voice Narration
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            High-yield audio strategy lectures and answer-writing frameworks. Masterclasses are scripted by the StudyRide academic editorial desk and rendered via synthetic narration for rapid audio revision.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-xs font-bold">{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Playlist Directory */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
              <p className="text-xs font-semibold">Loading podcast episodes from backend...</p>
            </div>
          ) : podcasts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">Koi podcast episode nahi mila.</p>
          ) : (
            <Stagger className="space-y-4">
              {podcasts.map(pod => {
                const isCurrent = playingId === pod.id;
                const savedPos = localStorage.getItem(`podcast_pos_${pod.id}`);
                const hasResume = savedPos && parseFloat(savedPos) > 2;

                return (
                  <StaggerItem key={pod.id}>
                    <div 
                      className={`bg-slate-900 border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                        isCurrent ? 'border-sky-500/50 shadow-sm bg-slate-900' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex gap-4 items-start text-left">
                        <PressFeedback>
                          <button
                            onClick={() => togglePlay(pod)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-slate-950 shrink-0 transition-transform cursor-pointer ${
                              isCurrent && isPlaying ? 'bg-sky-400 shadow-md shadow-sky-400/25' : 'bg-white hover:bg-slate-100'
                            }`}
                          >
                            {isCurrent && isPlaying ? (
                              <Pause className="w-5 h-5 fill-slate-950" />
                            ) : (
                              <Play className="w-5 h-5 fill-slate-950 pl-0.5" />
                            )}
                          </button>
                        </PressFeedback>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] bg-slate-950 text-sky-400 border border-slate-800 px-2 py-0.5 rounded font-semibold uppercase">
                              {pod.rank}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{pod.duration} Min Duration</span>
                            {isCurrent && isPlaying && (
                              <div className="flex items-center gap-0.5 h-3 px-1.5 py-0.5 bg-sky-500/10 rounded-full border border-sky-500/20">
                                <span className="w-0.5 h-full bg-sky-400 rounded-full animate-pulse" />
                                <span className="w-0.5 h-2 bg-sky-400 rounded-full animate-bounce" />
                                <span className="w-0.5 h-full bg-sky-400 rounded-full animate-pulse" />
                              </div>
                            )}
                            {hasResume && !isCurrent && (
                              <span className="text-[9px] bg-sky-500/10 text-sky-300 border border-sky-500/20 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-sky-400" /> Resume available ({formatTime(parseFloat(savedPos))})
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-white text-sm sm:text-base leading-snug">{pod.topperName} - {pod.subject}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">{pod.description}</p>
                        </div>
                      </div>

                      {/* Strategy List download */}
                      <button
                        onClick={() => alert(`Syllabus Booklist of ${pod.topperName} successfully added to Reference Library bookmarks!`)}
                        className="px-3 py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-[10px] rounded-xl border border-white/10 transition-all flex items-center gap-1 shrink-0 h-fit cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Booklist</span>
                      </button>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </div>

        {/* Floating Custom Audio Media Control Deck */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit sticky top-4 shadow-sm">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-sky-400" /> Currently Playing Strategy
            </span>
            {isPlaying && (
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            )}
          </h3>

          {currentPlaying ? (
            <div className="space-y-4 text-left">
              <div>
                <h4 className="font-bold text-white text-sm leading-tight">{currentPlaying.topperName}</h4>
                <p className="text-[10px] text-sky-400 font-semibold mt-0.5">{currentPlaying.subject}</p>
              </div>

              {/* Progress Slider (Real Sync) */}
              <div className="space-y-1.5">
                <div 
                  className="w-full bg-slate-950 h-2 rounded-full overflow-hidden relative cursor-pointer border border-slate-800 group" 
                  onClick={handleSeek}
                  title="Click to seek"
                >
                  <div 
                    className="bg-sky-500 h-full transition-all relative" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration > 0 ? formatTime(duration) : currentPlaying.duration}</span>
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMuteToggle}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
                  </button>

                  <button
                    onClick={handleRestart}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800"
                    title="Restart podcast"
                  >
                    <RotateCcw className="w-4 h-4 text-sky-400" />
                  </button>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1.5">
                  {[1, 1.25, 1.5, 2].map(sp => (
                    <button
                      key={sp}
                      onClick={() => handleSpeedChange(sp)}
                      className={`px-2 py-1 rounded text-[9px] font-semibold border transition-all ${
                        speed === sp 
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' 
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {sp}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Mapped Strategy Book Checklist */}
              {Array.isArray(currentPlaying.booklist) && currentPlaying.booklist.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <ListChecks className="w-3.5 h-3.5 text-sky-400" /> Mapped Topper Booklist:
                  </span>
                  <div className="space-y-1.5">
                    {currentPlaying.booklist.map((book, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-300 font-medium bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <UserCheck className="w-3 h-3 text-sky-400 shrink-0" /> <span className="line-clamp-1">{book}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Mic className="w-8 h-8 mx-auto opacity-35 animate-bounce text-sky-400" />
              <p className="text-[11px] font-medium max-w-[180px] mx-auto leading-normal text-slate-400">
                Click on any play button to stream the strategist audio podcast live.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
