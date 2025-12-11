export type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

export type User = {
  name: string;
  avatarUrl: string;
  coins: number;
  isVip: boolean;
  isAdmin?: boolean;
};

export type DailyChallenge = {
  id: number;
  title: string;
  description: string;
  reward: number;
  isCompleted: boolean;
  isVip?: boolean;
  progress: number;
  currentValue: number;
  targetValue: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  icon: React.ReactNode;
};

export type Game = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  iframeUrl: string;
  reward: number;
};

export type Offer = {
  id: string;
  title: string;
  company: string;
  reward: number;
  imageUrl: string;
  imageHint: string;
  link: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageHint: string;
};

export type GiftCard = {
  id:string;
  name: string;
  price: number;
  imageUrl: string;
  imageHint: string;
  value: number;
};

export type LeaderboardEntry = {
  rank: number;
  user: {
    name: string;
    avatarUrl: string;
  };
  score: number;
};

export type WithId<T> = T & { id: string };

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    coins: number;
    referralCode: string;
    isAdmin: boolean;
}

export interface OfferSubmission {
    id: string;
    userId: string;
    userDisplayName: string;
    offerId: string;
    offerTitle: string;
    reward: number;
    proofImageUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: any; // Firestore Timestamp
}

export interface RedemptionRequest {
    id: string;
    userId: string;
    userDisplayName: string;
    giftCardId: string;
    giftCardName: string;
    giftCardValue: number;
    coinsSpent: number;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: any; // Firestore Timestamp
}
