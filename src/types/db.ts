import { ObjectId } from 'mongodb';

export interface Participant {
  _id?: ObjectId;
  publicId: string;
  name?: string;
  sessionToken: string;
  createdAt: Date;
}

export interface GameWord {
  _id?: ObjectId;
  wordName: string;
  secretWord: string; // e.g. 'QUANTA'
  position: number;
}

export interface GameLetter {
  _id?: ObjectId;
  wordId: ObjectId;
  position: number;
  letterValue: string;
}

export interface QRChallenge {
  _id?: ObjectId;
  publicToken: string;
  type: 'REAL' | 'DUMMY';
  observationPoint: string;
  locationClue: string;
  locationSignal: string;
  challengeType: string;
  prompt: string;
  options?: string[]; // For MCQs
  hint: string;
  answerHash: string; // the lowercase alphanumeric normalized hash of the answer
  active: boolean;
  letterId?: ObjectId;
}

export interface ParticipantChallenge {
  _id?: ObjectId;
  participantId: ObjectId;
  challengeId: ObjectId;
  status: 'ATTEMPTED' | 'SOLVED';
  attempts: number;
}

export interface ParticipantLetter {
  _id?: ObjectId;
  participantId: ObjectId;
  letterId: ObjectId;
  discoveredAt: Date;
}

export interface ParticipantWord {
  _id?: ObjectId;
  participantId: ObjectId;
  wordId: ObjectId;
  completedAt: Date;
}

export interface HuntEvent {
  _id?: ObjectId;
  participantId: ObjectId;
  eventType: string;
  challengeId?: ObjectId;
  metadata?: string;
  createdAt: Date;
}
