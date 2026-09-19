export type StoryState = {
  sceneId: string;
  trust: number;
  service: number;
  budget: number;
  decisions: number;
};

export type StoryChoice = {
  label: string;
  hint: string;
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

export const PRESIDENTS_SHOES_STORY: { id: string; title: string; subtitle: string; note: string; start: string; scenes: Record<string, StoryScene> } = {
  id: 'botswana-water-week',
  title: 'The Water Week',
  subtitle: 'A fictional first week in office',
  note: 'Fictional scenario. Characters, institutions and events are invented for the game.',
  start: 'briefing',
  scenes: {
    briefing: {
      id: 'briefing',
      title: 'The First Briefing',
      location: 'Office of the President · Monday, 07:10',
      body: 'A storm has damaged a fictional district\'s main water line. Several villages have already reported interruptions. Your cabinet team has three options on the table, and the morning is moving quickly.',
      choices: [
        {
          label: 'Send the water bowsers now. Sort the bill later.',
          hint: 'People get water today, but the reserve takes a knock.',
          effects: { service: 2, trust: 1, budget: -2 },
          next: 'tanker',
        },
        {
          label: 'Get the engineers on the ground before spending.',
          hint: 'The numbers will be better, but the neighbourhoods still have to wait.',
          effects: { service: 0, trust: -1, budget: 1 },
          next: 'assessment',
        },
        {
          label: 'Open the reserve, call the kgotla and explain the plan.',
          hint: 'You act now and let people see the trade-off.',
          effects: { service: 1, trust: 2, budget: -1 },
          next: 'reserve',
        },
      ],
    },
    tanker: {
      id: 'tanker',
      title: 'Relief on the Road',
      location: 'Operations Room · Monday, 13:40',
      body: 'The first bowsers are moving. Then the phone rings again: a school needs water before lunch, a clinic needs more, and the same crew was booked to fix a road. Everybody has a reason their problem is urgent.',
      choices: [
        {
          label: 'Send the second convoy to the school and clinic first.',
          hint: 'Kids, patients and staff cannot simply wait for tomorrow.',
          effects: { service: 1, trust: 1, budget: -1 },
          next: 'public-briefing',
        },
        {
          label: 'Split the load between the neighbourhoods.',
          hint: 'Nobody gets everything, but nobody is forgotten.',
          effects: { service: 0, trust: 1, budget: -1 },
          next: 'public-briefing',
        },
      ],
    },
    assessment: {
      id: 'assessment',
      title: 'Waiting for the Numbers',
      location: 'Engineering Desk · Monday, 15:20',
      body: 'The engineering report arrives late. The repair is possible, but not overnight. Meanwhile the WhatsApp groups are doing what WhatsApp groups do: everybody has a different version of what happened.',
      choices: [
        {
          label: 'Tell people exactly when the next update is coming.',
          hint: 'If the answer changes, people know when to check again.',
          effects: { trust: 2, service: 1, budget: 0 },
          next: 'public-briefing',
        },
        {
          label: 'Keep quiet until the whole plan is bulletproof.',
          hint: 'No wrong headline today, but the rumours get the microphone.',
          effects: { trust: -1, service: 1, budget: 1 },
          next: 'public-briefing',
        },
      ],
    },
    reserve: {
      id: 'reserve',
      title: 'The Reserve Decision',
      location: 'Cabinet Room · Monday, 16:05',
      body: 'Your finance adviser points at the reserve. Your community liaison points at the queue outside the clinic. Neither is wrong. You have to choose which pain to carry.',
      choices: [
        {
          label: 'Spend some of the reserve and explain exactly what it buys.',
          hint: 'More help now, less breathing room later.',
          effects: { service: 2, trust: 1, budget: -1 },
          next: 'public-briefing',
        },
        {
          label: 'Protect the reserve and make the slower plan work.',
          hint: 'You keep options for tomorrow, but today's frustration stays real.',
          effects: { service: 0, trust: 1, budget: 1 },
          next: 'public-briefing',
        },
      ],
    },
    'public-briefing': {
      id: 'public-briefing',
      title: 'The Evening Briefing',
      location: 'Public Information Room · Tuesday, 18:30',
      body: 'At the evening briefing, someone asks the question everybody has been asking: 'So when will my tap work again?' You can answer honestly, bluff confidently, or turn the briefing into a practical plan.',
      choices: [
        {
          label: 'Say what you know — and admit what you don't.',
          hint: 'No magic answer. Just a straight one.',
          effects: { trust: 2, service: 0, budget: 0 },
          next: 'council',
        },
        {
          label: 'Promise the taps will be back tomorrow.',
          hint: 'It sounds great. If it fails, everybody remembers.',
          effects: { trust: -2, service: 1, budget: 0 },
          next: 'council',
        },
        {
          label: 'Keep it short, then post the full plan for everyone to check.',
          hint: 'Fast answer now, useful detail afterwards.',
          effects: { trust: 1, service: 1, budget: 0 },
          next: 'council',
        },
      ],
    },
    council: {
      id: 'council',
      title: 'The Second-Morning Review',
      location: 'Cabinet Room · Wednesday, 08:00',
      body: 'Wednesday morning brings the last big call of the week. The repair crew can finish faster if you spend more. Your finance team wants the reserve protected. Outside, people mostly want one thing: for this to be over.',
      choices: [
        {
          label: 'Pay for the faster repair.',
          hint: 'More money now. Less waiting for everyone.',
          effects: { service: 2, trust: 1, budget: -2 },
          next: 'ending-check',
        },
        {
          label: 'Keep the slower repair and protect the reserve.',
          hint: 'You save money now, but people live with the delay.',
          effects: { service: 0, trust: 1, budget: 2 },
          next: 'ending-check',
        },
        {
          label: 'Keep the plan and put every milestone on the wall.',
          hint: 'No grand promise — just dates people can hold you to.',
          effects: { service: 1, trust: 2, budget: 0 },
          next: 'ending-check',
        },
      ],
    },
    'ending-check': {
      id: 'ending-check',
      title: 'A Week Begins',
      location: 'President\'s Office · Wednesday, 17:00',
      body: 'The immediate crisis is not magically solved. What matters now is what your decisions have produced: service progress, public trust and the room left in the budget.',
      ending: { title: 'Outcome', summary: 'The week closes with the consequences of your decisions now visible.' },
    },
  },
};

export function createInitialStoryState(): StoryState {
  return {
    sceneId: PRESIDENTS_SHOES_STORY.start,
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
      title: 'The Measured Response',
      summary: 'The response is not perfect, but people can see what changed, what remains difficult and what happens next. Your administration leaves the first week with a workable plan and a clearer public record.',
    };
  }

  if (state.service >= 5 && state.trust < 3) {
    return {
      title: 'Results, With Questions',
      summary: 'Visible relief arrived quickly, but the public record leaves unanswered questions. The next week will require more explanation as well as continued delivery.',
    };
  }

  if (state.trust >= 5 && state.service < 4) {
    return {
      title: 'Trust on a Slow Road',
      summary: 'People can follow the reasoning behind the decisions, but the pace of service recovery remains frustrating. The challenge now is turning a credible plan into visible results.',
    };
  }

  if (state.budget >= 2) {
    return {
      title: 'The Reserve Survives',
      summary: 'The reserve remains healthier, but the slower response has a human cost. The next decision will have to account for the disruption that was allowed to continue.',
    };
  }

  return {
    title: 'The Hard Middle',
    summary: 'No single decision solved everything. The week ends with trade-offs still visible: service, trust and money all pulled in different directions.',
  };
}
