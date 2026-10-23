export interface DogProfile {
  id: 'jackie' | 'tiger' | 'percy';
  name: string;
  role: string;
  coat: string;
  accent: string;
  scale: number;
  build: 'slender' | 'muscular';
  description: string;
  relationship: string;
}

export const DOG_PROFILES: readonly DogProfile[] = [
  {
    id: 'jackie', name: 'Jackie', role: 'QUICK & AGILE',
    coat: '#f5f0df', accent: '#202126', scale: 0.78, build: 'slender',
    description: 'Small, lean, short-haired; white body and legs with black back patches, black ears and face, and a white blaze.',
    relationship: 'Tiger’s mate',
  },
  {
    id: 'tiger', name: 'Tiger', role: 'STRONG & STEADY',
    coat: '#7b452b', accent: '#7b452b', scale: 1.12, build: 'muscular',
    description: 'The largest and most muscular dog; solid brown coat, sturdy body and powerful legs.',
    relationship: 'Jackie’s mate',
  },
  {
    id: 'percy', name: 'Percy', role: 'YOUNG & CURIOUS',
    coat: '#f4edda', accent: '#a75e32', scale: 0.94, build: 'slender',
    description: 'Young and taller than Jackie; white coat, chestnut patches, brown head, white muzzle and floppy ears.',
    relationship: 'Unrelated to Jackie and Tiger',
  },
] as const;
