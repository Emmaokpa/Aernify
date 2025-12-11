import type { User, DailyChallenge, Game, Offer, Product } from './types';
import { getImage } from './placeholder-images';
import { Star, Video, Gamepad2, Gift, Trophy, Crown, Coins as CoinsIcon, ListChecks } from 'lucide-react';
import React from 'react';

export const currentUser: User = {
  name: 'Alex',
  avatarUrl: getImage('userAvatar1').imageUrl,
  coins: 12580,
  isVip: false,
};

export const dailyChallenges: DailyChallenge[] = [
    {
        id: 1,
        title: 'Daily Check-in',
        description: 'Log in for the day to claim your first reward.',
        reward: 20,
        isCompleted: true,
        progress: 100,
        currentValue: 1,
        targetValue: 1,
        difficulty: 'Easy',
        icon: React.createElement(Star),
    },
    {
        id: 2,
        title: 'Ad Watcher',
        description: 'Watch 5 video ads from the "Earn" page.',
        reward: 50,
        isCompleted: false,
        progress: 40,
        currentValue: 2,
        targetValue: 5,
        difficulty: 'Easy',
        icon: React.createElement(Video),
    },
    {
        id: 3,
        title: 'Game Sampler',
        description: 'Play 3 different games.',
        reward: 75,
        isCompleted: false,
        progress: 33,
        currentValue: 1,
        targetValue: 3,
        difficulty: 'Easy',
        icon: React.createElement(Gamepad2),
    },
    {
        id: 4,
        title: 'Offer Explorer',
        description: 'Attempt to complete one affiliate offer.',
        reward: 100,
        isCompleted: false,
        progress: 0,
        currentValue: 0,
        targetValue: 1,
        difficulty: 'Medium',
        icon: React.createElement(ListChecks),
    },
    {
        id: 5,
        title: 'Game Marathon',
        description: 'Play games for a total of 15 minutes.',
        reward: 150,
        isCompleted: false,
        progress: 20,
        currentValue: 3,
        targetValue: 15,
        difficulty: 'Medium',
        icon: React.createElement(Trophy),
    },
    {
        id: 6,
        title: 'Power Player',
        description: 'Earn 200 coins from playing games.',
        reward: 250,
        isCompleted: false,
        progress: 25,
        currentValue: 50,
        targetValue: 200,
        difficulty: 'Hard',
        icon: React.createElement(Crown),
    },
];

export const games: Game[] = [
  { id: 'g1', title: 'Galaxy Invaders', description: 'Classic space shooter', imageUrl: 'https://picsum.photos/seed/g1/400/500', imageHint: 'space arcade', iframeUrl: 'https://playgama.com/game/1', reward: 5 },
  { id: 'g2', title: 'Jungle Run', description: 'Endless runner adventure', imageUrl: 'https://picsum.photos/seed/g2/400/500', imageHint: 'jungle runner', iframeUrl: 'https://playgama.com/game/2', reward: 5 },
  { id: 'g3', title: 'Puzzle Blocks', description: 'Addictive block puzzle', imageUrl: 'https://picsum.photos/seed/g3/400/500', imageHint: 'colorful blocks', iframeUrl: 'https://playgama.com/game/3', reward: 5 },
  { id: 'g4', title: 'Speed Racer', description: 'High-speed racing game', imageUrl: 'https://picsum.photos/seed/g4/400/500', imageHint: 'racing car', iframeUrl: 'https://playgama.com/game/4', reward: 5 },
  { id: 'g5', title: 'Pirate\'s Treasure', description: 'Solve puzzles for loot', imageUrl: 'https://picsum.photos/seed/g5/400/500', imageHint: 'treasure chest', iframeUrl: 'https://playgama.com/game/5', reward: 5 },
  { id: 'g6', title: 'Castle Defense', description: 'Defend your kingdom', imageUrl: 'https://picsum.photos/seed/g6/400/500', imageHint: 'fantasy castle', iframeUrl: 'https://playgama.com/game/6', reward: 5 },
];

export const offers: Offer[] = [
  { id: 'o1', title: 'Complete a Survey', company: 'Survey Junkie', reward: 1200, ...getImage('offer1'), link: '#' },
  { id: 'o2', title: 'Reach Level 10', company: 'RAID: Shadow Legends', reward: 5500, ...getImage('offer2'), link: '#' },
  { id: 'o3', title: 'Sign up and get cashback', company: 'Cashback App', reward: 800, ...getImage('offer3'), link: '#' },
  { id: 'o4', title: 'Install and create a budget', company: 'Finance Tracker', reward: 1500, ...getImage('offer4'), link: '#' },
];

export const products: Product[] = [
  { id: 'p1', name: 'Wireless Earbuds', description: 'High-fidelity sound on the go.', price: 15000, ...getImage('product1') },
  { id: 'p2', name: 'Smartwatch Series 8', description: 'Track your fitness and notifications.', price: 45000, ...getImage('product2') },
  { id: 'p3', name: 'RGB Gaming Mouse', description: 'Precision and customizable lighting.', price: 8000, ...getImage('product3') },
  { id: 'p4', name: 'Mechanical Keyboard', description: 'Tactile feedback for pro gamers.', price: 12000, ...getImage('product4') },
  { id: 'p5', name: '10,000mAh Power Bank', description: 'Charge your devices anywhere.', price: 6000, ...getImage('product5') },
  { id: 'p6', name: 'Pro VR Headset', description: 'Immerse yourself in virtual worlds.', price: 65000, ...getImage('product6') },
];
