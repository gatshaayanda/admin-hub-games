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
          label: 'Send emergency tankers immediately.',
          hint: 'Fast relief, but the reserve budget takes a hit.',
          effects: { service: 2, trust: 1, budget: -2 },
          next: 'tanker',
        },
        {
          label: 'Wait for a verified engineering assessment.',
          hint: 'Protects the budget, but people wait longer for visible action.',
          effects: { service: 0, trust: -1, budget: 1 },
          next: 'assessment',
        },
        {
          label: 'Release a limited reserve and publish the response plan.',
          hint: 'Acts now while making the trade-offs visible.',
          effects: { service: 1, trust: 2, budget: -1 },
          next: 'reserve',
        },
      ],
    },
    tanker: {
      id: 'tanker',
      title: 'Relief on the Road',
      location: 'Operations Room · Monday, 13:40',
      body: 'The tankers are moving. Your operations team warns that the first convoy can cover only the most affected settlements today. A second convoy would mean delaying another scheduled public works job.',
      choices: [
        {
          label: 'Keep the second convoy focused on the worst-hit settlements.',
          hint: 'Concentrates limited capacity where the disruption is greatest.',
          effects: { service: 1, trust: 1, budget: -1 },
          next: 'public-briefing',
        },
        {
          label: 'Spread the second convoy evenly across the whole district.',
          hint: 'More places see a response, but each receives less.',
          effects: { service: 0, trust: 1, budget: -1 },
          next: 'public-briefing',
        },
      ],
    },
    assessment: {
      id: 'assessment',
      title: 'Waiting for the Numbers',
      location: 'Engineering Desk · Monday, 15:20',
      body: 'The engineering assessment arrives. The damage is larger than the first report suggested, but the repair can be phased. Your team says a clear timetable could prevent rumours from filling the information gap.',
      choices: [
        {
          label: 'Publish the repair timetable and daily update time.',
          hint: 'Makes uncertainty visible instead of pretending it does not exist.',
          effects: { trust: 2, service: 1, budget: 0 },
          next: 'public-briefing',
        },
        {
          label: 'Keep the plan internal until every detail is final.',
          hint: 'Avoids revisions in public, but leaves more room for speculation.',
          effects: { trust: -1, service: 1, budget: 1 },
          next: 'public-briefing',
        },
      ],
    },
    reserve: {
      id: 'reserve',
      title: 'The Reserve Decision',
      location: 'Cabinet Room · Monday, 16:05',
      body: 'The published plan draws attention to one uncomfortable fact: emergency money is limited. Your finance adviser asks whether the reserve should be protected for another possible disruption or used now.',
      choices: [
        {
          label: 'Use part of the reserve now and explain the limit.',
          hint: 'Delivers more relief while acknowledging the constraint.',
          effects: { service: 2, trust: 1, budget: -1 },
          next: 'public-briefing',
        },
        {
          label: 'Protect the reserve and scale the response carefully.',
          hint: 'Leaves more capacity for the next emergency.',
          effects: { service: 0, trust: 1, budget: 1 },
          next: 'public-briefing',
        },
      ],
    },
    'public-briefing': {
      id: 'public-briefing',
      title: 'The Evening Briefing',
      location: 'Public Information Room · Tuesday, 18:30',
      body: 'The next update is due. You can give a confident-sounding statement, or you can show what is known, what is uncertain and what happens next. Your advisers disagree about which approach will calm the room.',
      choices: [
        {
          label: 'Give the clearest confirmed facts and name the remaining uncertainty.',
          hint: 'The audience gets a precise picture without promises you cannot guarantee.',
          effects: { trust: 2, service: 0, budget: 0 },
          next: 'council',
        },
        {
          label: 'Promise that the disruption will be over by tomorrow.',
          hint: 'A strong promise creates a simple message, but raises the cost of being wrong.',
          effects: { trust: -2, service: 1, budget: 0 },
          next: 'council',
        },
        {
          label: 'Keep the statement short and publish the detailed plan afterward.',
          hint: 'Balances speed with a written record people can check.',
          effects: { trust: 1, service: 1, budget: 0 },
          next: 'council',
        },
      ],
    },
    council: {
      id: 'council',
      title: 'The Second-Morning Review',
      location: 'Cabinet Room · Wednesday, 08:00',
      body: 'The district is still dealing with interruptions, but repairs are underway. The team asks for one final decision: spend more now for faster completion, or hold the line and protect the remaining budget.',
      choices: [
        {
          label: 'Fund the faster repair schedule.',
          hint: 'Prioritises speed and visible service recovery.',
          effects: { service: 2, trust: 1, budget: -2 },
          next: 'ending-check',
        },
        {
          label: 'Keep the slower schedule and protect the reserve.',
          hint: 'Accepts a longer disruption in exchange for more financial room.',
          effects: { service: 0, trust: 1, budget: 2 },
          next: 'ending-check',
        },
        {
          label: 'Keep the schedule but publish the remaining milestones.',
          hint: 'Keeps spending controlled while making progress measurable.',
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
