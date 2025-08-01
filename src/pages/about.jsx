
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Atom, Music, Share2, Palette, Zap, ListMusic, Move, Sparkles, PlayCircle } from 'lucide-react';
import Logo from '@/components/Logo';

export default function AboutPage() {
  const features = [
    {
      icon: <Atom className="w-8 h-8 text-sky-400" />,
      title: 'Interactive 3D Scene',
      description: 'Manipulate spheres in a fully 3D environment. Drag, rotate, and transform your musical structure in real-time.'
    },
    {
      icon: <Music className="w-8 h-8 text-violet-400" />,
      title: 'Advanced Audio Engine',
      description: 'Experience a powerful Web Audio and MIDI synthesis engine with customizable waveforms, envelopes, and effects.'
    },
    {
      icon: <Sparkles className="w-8 h-8 text-yellow-400" />,
      title: 'AI-Powered Creativity',
      description: 'Let AI generate compelling rhythms and musical moods to kickstart your creative process or inspire new directions.'
    },
    {
      icon: <PlayCircle className="w-8 h-8 text-orange-400" />,
      title: 'Preset Sequencer',
      description: 'Chain your saved presets together to create evolving compositions. Control the duration and order of each step for dynamic, full-song structures.'
    },
    {
      icon: <Share2 className="w-8 h-8 text-green-400" />,
      title: 'Save & Share',
      description: 'Save your musical creations as presets and MIDI files. Export and share your compositions with the world.'
    },
    {
      icon: <Palette className="w-8 h-8 text-pink-400" />,
      title: 'Visual Feedback',
      description: 'Watch your music come to life with real-time visual feedback, color-coded notes, and dynamic lighting effects.'
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      title: 'Real-time Performance',
      description: 'Connect your favorite DAW to capture live performance with low-latency MIDI processing and responsive controls for expressive play.'
    },
    {
      icon: <ListMusic className="w-8 h-8 text-blue-400" />,
      title: 'Musical Scales',
      description: 'Explore various musical scales from major and minor to exotic world scales like Arabic, Persian, and Japanese.'
    },
    {
      icon: <Move className="w-8 h-8 text-indigo-400" />,
      title: 'Molecular Geometry',
      description: 'Use molecular shapes like tetrahedral, octahedral, and trigonal bipyramidal to create unique harmonic structures.'
    }
  ];

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <Logo />
          </div>
          <h1 className="text-5xl font-bold tracking-tighter mb-3 bg-gradient-to-t from-slate-400 to-white bg-clip-text text-transparent pt-2 pb-2">
            Visual Music <br />
            Tangible Sound
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Spher8 is a revolutionary 3D musical instrument and sequencer that transforms abstract concepts of harmony and geometry into a tangible, interactive experience.
          </p>
        </div>

        {/* Global Composition Section */}
        <div className="mt-20 text-center">
          <div className="glass-panel p-8 rounded-xl border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-4">A Symphony of Creativity</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
              Every note played on Spher8 contributes to a growing global composition. Join our collective community of musicians from around the world.
            </p>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-10">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="glass-panel border-white/10 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {feature.icon}
                    <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Create?</h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Start your musical journey with Spher8. Whether you're a seasoned musician or just beginning to explore the world of sound, Spher8 provides an intuitive and powerful platform for musical expression.
          </p>
          <div className="glass-panel p-6 rounded-xl border border-white/10 max-w-2xl mx-auto">
            <p className="text-slate-300">
              Experience the future of music creation. Transform mathematical concepts into beautiful melodies, explore the relationship between geometry and harmony, and create compositions that are both visually stunning and musically rich.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
