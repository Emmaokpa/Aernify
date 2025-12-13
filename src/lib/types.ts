




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
    id: string;
    title: string;
    description: string;
    reward: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    type: 'watchAd' | 'playGame' | 'completeOffer' | 'dailyCheckIn';
    targetValue: number;
    icon?: React.ReactNode;
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
  price: number; // Price will now be in a real currency (e.g., NGN)
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
    id: string;
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
    weeklyCoins: number;
    referralCode: string;
    isAdmin: boolean;
    isVip: boolean;
    currentStreak: number;
    lastLoginDate: string; // YYYY-MM-DD
    wishlist?: string[];
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

export type ChallengeProgress = {
    [key: string]: {
        currentValue: number;
        claimed: boolean;
    }
}

export interface UserChallengeProgress {
    id?: string;
    date: string;
    progress: ChallengeProgress;
}

export interface ShippingInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  userDisplayName: string;
  productId: string;
  productName: string;
  productImageUrl: string;
  coinsSpent: number; // This will likely change to a currency amount
  shippingInfo: ShippingInfo;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  orderedAt: any; // Firestore Timestamp
}

export interface BankDetails {
    bankName: string;
    accountNumber: string;
    accountName: string;
}

export interface WithdrawalRequest {
    id: string;
    userId: string;
    userDisplayName: string;
    coinsToWithdraw: number;
    nairaAmount: number;
    bankDetails: BankDetails;
    status: 'pending' | 'processed' | 'rejected';
    requestedAt: any; // Firestore Timestamp
}
    

    

    
