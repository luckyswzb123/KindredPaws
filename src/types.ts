export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: string;
  weight?: string;
  gender?: string;
  location: string;
  distance: string;
  image: string;
  description: string;
  personality: string[];
  status?: 'new' | 'urgent' | 'none';
  type: 'adoption' | 'foster';
  category?: string;
  fostererName?: string;
  healthStatus: {
    vaccination: boolean;
    neutered: boolean;
    microchipped: boolean;
  };
}

export interface Application {
  id: string;
  petName: string;
  petBreed: string;
  petAge: string;
  petImage: string;
  status: 'approved' | 'reviewing' | 'rejected';
  type: 'adoption' | 'foster';
  applicantName?: string;
  applicantBio?: string;
  petId?: string;
}

export interface Message {
  id: string;
  sender: string;
  time: string;
  subject: string;
  preview: string;
  content?: string;
  icon: string;
  isRead: boolean;
  type: 'notification' | 'adoption' | 'interaction';
}
