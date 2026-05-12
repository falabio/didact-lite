export interface WeeklyPlan {
    week: string;
    topic: string;
    period1: PeriodData;
    period2?: PeriodData;
}

export interface PeriodData {
    periodTitle: string;
    duration: string;
    objectives: string[];
    materials: string;
    reference: string;
    content: string[];
    activities: string[];
    strategies?: string;
    summary?: string;
    evaluation: string[];
    assignment: string;
}

export interface SchemeRow {
    week: string;
    startDate: string;
    endDate: string;
    topic: string;
    objectives: string;
}

export interface LessonPlan {
    schemeOfWork: SchemeRow[];
    weeklyPlans: WeeklyPlan[];
}

export type AppTab = 'planner' | 'tests' | 'exams' | 'bank';
