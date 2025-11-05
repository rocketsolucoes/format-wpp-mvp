import React from 'react';
import { Link } from 'wouter';
import { Palette, Star, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent } from './ui/Card';

const tips = [
  {
    icon: Palette,
    title: 'Use Custom Styles',
    description: 'Create personalized formatting styles for your specific needs',
    link: '/styles',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Star,
    title: 'Save Your Favorites',
    description: 'Access your formatting history anytime and reuse past work',
    link: '/history',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Share with Team',
    description: 'Collaborate with your team using Enterprise features',
    link: '/dashboard',
    color: 'from-blue-500 to-cyan-500',
  },
];

export function QuickTips() {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Quick Tips</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <Link key={tip.title} href={tip.link}>
              <Card className="hover:border-slate-700 transition-colors cursor-pointer h-full">
                <CardContent className="space-y-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tip.color} p-3 flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{tip.title}</h3>
                    <p className="text-sm text-slate-400">{tip.description}</p>
                  </div>
                  <div className="flex items-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
