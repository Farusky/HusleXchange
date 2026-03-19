export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  skillsOffered: string[];
  skillsWanted: string[];
  createdAt: number;
  ratingAverage?: number;
  ratingCount?: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userRating?: number;
  userRatingCount?: number;
  offer: string;
  need: string;
  createdAt: number;
  phone: string;
}

export interface Exchange {
  id: string;
  postId: string;
  requesterId: string;
  requesterName: string;
  providerId: string;
  providerName: string;
  offer: string;
  need: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
  completedAt?: number;
  ratedByRequester?: boolean;
  ratedByProvider?: boolean;
}

export interface Review {
  id: string;
  exchangeId: string;
  fromId: string;
  fromName: string;
  toId: string;
  rating: number;
  comment: string;
  createdAt: number;
}
