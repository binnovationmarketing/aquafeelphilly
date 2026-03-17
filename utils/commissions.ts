/**
 * Aquafeel Commission Engine
 * Handles all role-based commission calculations, differential bonuses, and level progression.
 */

export type HierarchyRole =
  | 'analyst_jr'
  | 'analyst_sr'
  | 'mentor_jr'
  | 'mentor_sr'
  | 'manager_jr'
  | 'manager_sr'
  | 'director_jr'
  | 'director_sr'
  | 'master'
  | 'ambassador';

/** Maximum personal commission per sale for each role */
export const ROLE_COMMISSION: Record<HierarchyRole, number> = {
  analyst_jr:  1500,
  analyst_sr:  1800,
  mentor_jr:   2100,
  mentor_sr:   2400,
  manager_jr:  2700,
  manager_sr:  3000,
  director_jr: 3000,
  director_sr: 3000,
  master:      3000,
  ambassador:  3000,
};

export const ROLE_LABELS_EN: Record<HierarchyRole, string> = {
  analyst_jr:  'Analyst Jr',
  analyst_sr:  'Analyst Sr',
  mentor_jr:   'Mentor Jr',
  mentor_sr:   'Mentor Sr',
  manager_jr:  'Jr Manager',
  manager_sr:  'Sr Manager',
  director_jr: 'Director Jr',
  director_sr: 'Director Sr',
  master:      'Master',
  ambassador:  'Ambassador',
};

export const ROLE_LABELS_PT: Record<HierarchyRole, string> = {
  analyst_jr:  'Analista Jr',
  analyst_sr:  'Analista Sênior',
  mentor_jr:   'Mentor Jr',
  mentor_sr:   'Mentor Sênior',
  manager_jr:  'Gerente Jr',
  manager_sr:  'Gerente Sênior',
  director_jr: 'Diretor Jr',
  director_sr: 'Diretor Sênior',
  master:      'Master',
  ambassador:  'Embaixador',
};

/** Roles that earn flat $200 recruitment bonus per downline sale (instead of differential) */
export const RECRUITMENT_BONUS_ROLES: HierarchyRole[] = ['analyst_jr', 'analyst_sr'];
export const RECRUITMENT_BONUS_AMOUNT = 200;

/** Roles that earn differential bonus on downline sales */
export const DIFFERENTIAL_ROLES: HierarchyRole[] = [
  'mentor_jr', 'mentor_sr', 'manager_jr', 'manager_sr',
  'director_jr', 'director_sr', 'master', 'ambassador',
];

/**
 * Personal commission earned by this role for a direct sale they make.
 */
export const calcPersonalCommission = (role: HierarchyRole): number => {
  return ROLE_COMMISSION[role] ?? 0;
};

/**
 * Differential bonus a leader earns when a downline analyst closes a sale.
 * Result: leaderCommission - analystCommission (always positive, max: $1,500)
 * Returns 0 for analyst_jr / analyst_sr leaders.
 */
export const calcDifferentialBonus = (
  leaderRole: HierarchyRole,
  analystRole: HierarchyRole
): number => {
  if (RECRUITMENT_BONUS_ROLES.includes(leaderRole)) return 0;
  const leaderComm = ROLE_COMMISSION[leaderRole] ?? 0;
  const analystComm = ROLE_COMMISSION[analystRole] ?? 0;
  return Math.max(0, leaderComm - analystComm);
};

/**
 * Recruitment bonus ($200) earned by analyst_jr / analyst_sr
 * for each sale made by their direct recruits.
 */
export const calcRecruitmentBonus = (
  leaderRole: HierarchyRole,
  salesCount: number
): number => {
  if (!RECRUITMENT_BONUS_ROLES.includes(leaderRole)) return 0;
  return salesCount * RECRUITMENT_BONUS_AMOUNT;
};

/** Level progression requirements (total personal sales to unlock next rank) */
export interface LevelGoal {
  current: HierarchyRole;
  next: HierarchyRole | null;
  personalSalesRequired: number;
  teamSalesRequired: number;
  nextCommission: number;
  label: string;
}

export const LEVEL_REQUIREMENTS: Record<HierarchyRole, { personal: number; team: number }> = {
  analyst_jr:  { personal: 3,  team: 0  },
  analyst_sr:  { personal: 6,  team: 3  },
  mentor_jr:   { personal: 12, team: 3  },
  mentor_sr:   { personal: 20, team: 6  },
  manager_jr:  { personal: 30, team: 10 },
  manager_sr:  { personal: 50, team: 20 },
  director_jr: { personal: 75, team: 30 },
  director_sr: { personal: 100, team: 50 },
  master:      { personal: 150, team: 75 },
  ambassador:  { personal: 999, team: 999 }, // Top level
};

const ROLE_ORDER: HierarchyRole[] = [
  'analyst_jr', 'analyst_sr', 'mentor_jr', 'mentor_sr',
  'manager_jr', 'manager_sr', 'director_jr', 'director_sr',
  'master', 'ambassador',
];

/**
 * Returns goal info for the current user's level.
 */
export const getLevelGoal = (role: HierarchyRole, personalSales: number, teamSales: number): {
  nextRole: HierarchyRole | null;
  nextLabel: string | null;
  personalNeeded: number;
  teamNeeded: number;
  personalProgress: number;
  teamProgress: number;
  salesToNext: number;
  nextCommission: number;
  isTopLevel: boolean;
} => {
  const idx = ROLE_ORDER.indexOf(role);
  const nextRole = idx < ROLE_ORDER.length - 1 ? ROLE_ORDER[idx + 1] : null;

  if (!nextRole || role === 'ambassador') {
    return {
      nextRole: null, nextLabel: null,
      personalNeeded: 0, teamNeeded: 0,
      personalProgress: 100, teamProgress: 100,
      salesToNext: 0, nextCommission: ROLE_COMMISSION[role],
      isTopLevel: true,
    };
  }

  const reqs = LEVEL_REQUIREMENTS[nextRole];
  const salesToNext = Math.max(0, reqs.personal - personalSales);
  const personalProgress = Math.min(100, Math.round((personalSales / reqs.personal) * 100));
  const teamProgress = reqs.team > 0
    ? Math.min(100, Math.round((teamSales / reqs.team) * 100))
    : 100;

  return {
    nextRole,
    nextLabel: ROLE_LABELS_PT[nextRole],
    personalNeeded: reqs.personal,
    teamNeeded: reqs.team,
    personalProgress,
    teamProgress,
    salesToNext,
    nextCommission: ROLE_COMMISSION[nextRole],
    isTopLevel: false,
  };
};

/** Color theme per role level */
export const ROLE_COLORS: Record<HierarchyRole, { bg: string; text: string; border: string; badge: string }> = {
  analyst_jr:  { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200',  badge: 'bg-slate-200 text-slate-700'  },
  analyst_sr:  { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700'    },
  mentor_jr:   { bg: 'bg-teal-50',     text: 'text-teal-700',    border: 'border-teal-200',   badge: 'bg-teal-100 text-teal-700'    },
  mentor_sr:   { bg: 'bg-teal-100',    text: 'text-teal-800',    border: 'border-teal-300',   badge: 'bg-teal-200 text-teal-800'    },
  manager_jr:  { bg: 'bg-indigo-50',   text: 'text-indigo-700',  border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700'},
  manager_sr:  { bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-300', badge: 'bg-indigo-200 text-indigo-800'},
  director_jr: { bg: 'bg-purple-50',   text: 'text-purple-700',  border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700'},
  director_sr: { bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-300', badge: 'bg-purple-200 text-purple-800'},
  master:      { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700'  },
  ambassador:  { bg: 'bg-yellow-50',   text: 'text-yellow-700',  border: 'border-yellow-300', badge: 'bg-yellow-100 text-yellow-700'},
};
