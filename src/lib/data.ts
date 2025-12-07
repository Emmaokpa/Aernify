import type { User, DailyChallenge, Game, Offer, Product, GiftCard, LeaderboardEntry } from './types';
import { getImage } from './placeholder-images';

export const currentUser: User = {
  name: 'Alex',
  avatarUrl: getImage('userAvatar1').imageUrl,
  coins: 12580,
  isVip: false,
};

export const dailyChallenges: DailyChallenge[] = [
  { id: 1, title: 'Play 3 Games', description: 'Play any three games to completion.', reward: 150, isCompleted: false },
  { id: 2, title: 'Complete a Survey', description: 'Finish one survey from the offer wall.', reward: 500, isCompleted: false },
  { id: 3, title: 'Watch 5 Video Ads', description: 'Watch 5 ads to earn your reward.', reward: 100, isCompleted: true },
  { id: 4, title: 'Refer a Friend', description: 'Invite a friend who signs up.', reward: 1000, isCompleted: false },
];

export const games: Game[] = [
  { id: 'g1', title: 'Galaxy Invaders', provider: 'Playgama', reward: 50, ...getImage('game1') },
  { id: 'g2', title: 'Jungle Run', provider: 'Playgama', reward: 40, ...getImage('game2') },
  { id: 'g3', title: 'Puzzle Blocks', provider: 'Playgama', reward: 60, ...getImage('game3') },
  { id: 'g4', title: 'Speed Racer', provider: 'Playgama', reward: 75, ...getImage('game4') },
  { id: 'g5', title: 'Pirate\'s Treasure', provider: 'Playgama', reward: 55, ...getImage('game5') },
  { id: 'g6', title: 'Castle Defense', provider: 'Playgama', reward: 80, ...getImage('game6') },
];

export const offers: Offer[] = [
  { id: 'o1', title: 'Complete a Survey', company: 'Survey Junkie', reward: 1200, ...getImage('offer1') },
  { id: 'o2', title: 'Reach Level 10', company: 'RAID: Shadow Legends', reward: 5500, ...getImage('offer2') },
  { id: 'o3', title: 'Sign up and get cashback', company: 'Cashback App', reward: 800, ...getImage('offer3') },
  { id: 'o4', title: 'Install and create a budget', company: 'Finance Tracker', reward: 1500, ...getImage('offer4') },
];

export const products: Product[] = [
  { id: 'p1', name: 'Wireless Earbuds', description: 'High-fidelity sound on the go.', price: 15000, ...getImage('product1') },
  { id: 'p2', name: 'Smartwatch Series 8', description: 'Track your fitness and notifications.', price: 45000, ...getImage('product2') },
  { id: 'p3', name: 'RGB Gaming Mouse', description: 'Precision and customizable lighting.', price: 8000, ...getImage('product3') },
  { id: 'p4', name: 'Mechanical Keyboard', description: 'Tactile feedback for pro gamers.', price: 12000, ...getImage('product4') },
  { id: 'p5', name: '10,000mAh Power Bank', description: 'Charge your devices anywhere.', price: 6000, ...getImage('product5') },
  { id: 'p6', name: 'Pro VR Headset', description: 'Immerse yourself in virtual worlds.', price: 65000, ...getImage('product6') },
];

export const giftCards: GiftCard[] = [
  { id: 'gc1', name: 'Amazon Gift Card', value: 10, price: 10000, ...getImage('giftcard1') },
  { id: 'gc2', name: 'Google Play Gift Card', value: 15, price: 15000, ...getImage('giftcard2') },
  { id: 'gc3', name: 'Apple Gift Card', value: 25, price: 25000, ...getImage('giftcard3') },
  { id: 'gc4', name: 'Steam Gift Card', value: 20, price: 20000, ...getImage('giftcard4') },
];

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, user: { name: 'Sophia', avatarUrl: getImage('leaderboardUser1').imageUrl }, score: 154200 },
  { rank: 2, user: { name: 'Jacob', avatarUrl: getImage('leaderboardUser2').imageUrl }, score: 149300 },
  { rank: 3, user: { name: 'CurrentUser', avatarUrl: currentUser.avatarUrl }, score: 125800 },
  { rank: 4, user: { name: 'Emily', avatarUrl: getImage('leaderboardUser3').imageUrl }, score: 110500 },
  { rank: 5, user: { name: 'Michael', avatarUrl: 'https://picsum.photos/seed/leader4/100/100' }, score: 98600 },
  { rank: 6, user: { name: 'Jessica', avatarUrl: 'https://picsum.photos/seed/leader5/100/100' }, score: 95400 },
  { rank: 7, user: { name: 'David', avatarUrl: 'https://picsum.photos/seed/leader6/100/100' }, score: 89300 },
  { rank: 8, user: { name: 'Sarah', avatarUrl: 'https://picsum.photos/seed/leader7/100/100' }, score: 82100 },
];
