import botswanaStory from './botswana-water-week.json';
import countries from './countries.json';

export type StoryState = {
  sceneId: string;
  trust: number;
  service: number;
  budget: number;
  decisions: number;
  pendingConsequence?: string;
  lastEffects?: Partial<Pick<StoryState, 'trust' | 'service' | 'budget'>>;
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
      result: 'PRESIDENCY CONTINUES · MANDATE STRENGTHENED',
      summary: 'You finish the fictional first week as president. Your public record shows action, trade-offs and accountability, leaving the administration with a stronger mandate for week two.',
    };
  }

  if (state.service >= 5 && state.trust < 3) {
    return {
      title: 'Results, With Questions',
      result: 'PRESIDENCY CONTINUES · MANDATE UNDER PRESSURE',
      summary: 'You finish the fictional first week as president, but the public record leaves unanswered questions. You delivered results, while week two begins with trust to rebuild.',
    };
  }

  if (state.trust >= 5 && state.service < 4) {
    return {
      title: 'Trust on a Slow Road',
      result: 'PRESIDENCY CONTINUES · MANDATE UNDER PRESSURE',
      summary: 'You finish the fictional first week as president, but the pace of service recovery remains frustrating. Your credibility survives; the administration must turn its plan into visible results.',
    };
  }

  if (state.budget >= 2) {
    return {
      title: 'The Reserve Survives',
      result: 'PRESIDENCY CONTINUES · MANDATE AT RISK',
      summary: 'You finish the fictional first week as president with financial room, but the slower response has a human cost. Week two starts with political pressure.',
    };
  }

  return {
    title: 'The Hard Middle',
    result: 'PRESIDENCY CONTINUES · MANDATE AT RISK',
    summary: 'You finish the fictional first week as president, but no single decision solved everything. Week two begins with service, trust and money still pulling in different directions.',
  };
}
