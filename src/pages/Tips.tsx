import React from 'react';
import { Link } from 'wouter';
import { Palette, Star, Users, ArrowRight, Lightbulb, Zap, BookOpen, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const tips = [
  {
    icon: Palette,
    title: 'Use Custom Styles',
    description: 'Create personalized formatting styles for your specific needs',
    link: '/styles',
    color: 'from-purple-500 to-pink-500',
    details: 'Save time by creating reusable formatting templates that match your brand voice and communication style.',
  },
  {
    icon: Star,
    title: 'Save Your Favorites',
    description: 'Access your formatting history anytime and reuse past work',
    link: '/history',
    color: 'from-yellow-500 to-orange-500',
    details: 'Never lose a great format. Browse your history and quickly reuse successful formatting patterns.',
  },
  {
    icon: Users,
    title: 'Share with Team',
    description: 'Collaborate with your team using Enterprise features',
    link: '/pricing',
    color: 'from-blue-500 to-cyan-500',
    details: 'Work together with shared templates and consistent formatting across your entire team.',
  },
  {
    icon: Zap,
    title: 'Keyboard Shortcuts',
    description: 'Speed up your workflow with quick keyboard commands',
    link: '/tips',
    color: 'from-emerald-500 to-teal-500',
    details: 'Use Ctrl+Enter to format quickly, Ctrl+C to copy output, and Escape to clear inputs.',
  },
  {
    icon: BookOpen,
    title: 'Format Best Practices',
    description: 'Learn how to write better input text for optimal results',
    link: '/tips',
    color: 'from-cyan-500 to-blue-500',
    details: 'Clear, concise input produces better formatted output. Use proper grammar and complete sentences.',
  },
  {
    icon: Target,
    title: 'Optimize Character Count',
    description: 'Make the most of your character limits',
    link: '/tips',
    color: 'from-orange-500 to-red-500',
    details: 'Stay within 5000 characters for best results. Break longer content into smaller, focused segments.',
  },
];

export default function Tips() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Quick Tips
              </h1>
            </div>
          </div>
          <p className="text-slate-400 text-lg">
            Learn how to get the most out of your formatting experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <Link key={tip.title} href={tip.link}>
                <Card className="hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer h-full">
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tip.color} p-3 flex items-center justify-center mb-3`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{tip.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-slate-300">
                      {tip.description}
                    </p>
                    <p className="text-sm text-slate-400">
                      {tip.details}
                    </p>
                    <div className="flex items-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors pt-2">
                      <span className="font-medium">Learn more</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="mt-8 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
          <CardHeader>
            <CardTitle className="text-2xl">Need More Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-4">
              Explore our comprehensive documentation or reach out to our support team for personalized assistance.
            </p>
            <div className="flex gap-3">
              <Link href="/dashboard">
                <button className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-lg text-white font-semibold transition-all hover:scale-105">
                  Back to Dashboard
                </button>
              </Link>
              <Link href="/format">
                <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-semibold transition-colors border border-slate-700">
                  Start Formatting
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
