import botswanaStory from './botswana-water-week.json';
import countries from './countries.json';

export type StoryState = {
  sceneId: string;
  trust: number;
  service: number;
  budget: number;
  decisions: number;
  pendingConsequence?: string;
};

export type StoryChoice = {
  label: string;
  hint: string;
  consequence: string;
  effects: Partial<Pick<StoryState, 'trust' | 'service' | 'budget'>>;
  next: string;
};

export type StoryScene = {
  id: string;
  title: string;
  location: string;
  body: string;
  choices?: StoryChoice[];
  ending?: {
    title: string;
    summary: string;
  };
};

export type CountryPack = {
  id: string;
  name: string;
  shortName: string;
  packId: string;
  tagline: string;
  primary: string;
  secondary: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  available: boolean;
};

export type StoryPack = {
  id: string;
  countryId: string;
  title: string;
  subtitle: string;
  note: string;
  start: string;
  scenes: Record<string, StoryScene>;
};

export const COUNTRY_PACKS = countries as CountryPack[];
export const PRESIDENTS_SHOES_STORY = botswanaStory as StoryPack;

export function getCountryPack(countryId: string) {
  return COUNTRY_PACKS.find((country) => country.id === countryId && country.available) ?? COUNTRY_PACKS[0];
}

export function getStoryPack(countryId: string) {
  const country = getCountryPack(countryId);
  return country.packId === PRESIDENTS_SHOES_STORY.id ? PRESIDENTS_SHOES_STORY : PRESIDENTS_SHOES_STORY;
}

export function createInitialStoryState(storyPack = PRESIDENTS_SHOES_STORY): StoryState {
  return {
    sceneId: storyPack.start,
    trust: 0,
    service: 0,
    budget: 0,
    decisions: 0,
  };
}

export function getEnding(state: StoryState) {
  const score = state.trust + state.service;

  if (score >= 8 && state.budget >= -4) {
    return {
      title: 'A Strong First Week',
      result: 'MANDATE STRENGTHENED',
      summary: 'Your response leaves a clear public record: people saw action, trade-offs and accountability. The fictional administration finishes its first week with a stronger mandate to continue.',
    };
  }

  if (state.service >= 5 && state.trust < 3) {
    return {
      title: 'Results, With Questions',
      result: 'MANDATE UNDER PRESSURE',
      summary: 'Visible relief arrived quickly, but the public record leaves unanswered questions. You delivered results, but the next week begins with trust to rebuild.',
    };
  }

  if (state.trust >= 5 && state.service < 4) {
    return {
      title: 'Trust on a Slow Road',
      result: 'MANDATE UNDER PRESSURE',
      summary: 'People can follow the reasoning behind the decisions, but the pace of service recovery remains frustrating. Your credibility survives, but the administration must turn its plan into visible results.',
    };
  }

  if (state.budget >= 2) {
    return {
      title: 'The Reserve Survives',
      result: 'MANDATE AT RISK',
      summary: 'The reserve remains healthier, but the slower response has a human cost. Your administration enters the next week with financial room and political pressure.',
    };
  }

  return {
    title: 'The Hard Middle',
    result: 'MANDATE AT RISK',
    summary: 'No single decision solved everything. The week ends with trade-offs still visible: service, trust and money all pulled in different directions.',
  };
}
