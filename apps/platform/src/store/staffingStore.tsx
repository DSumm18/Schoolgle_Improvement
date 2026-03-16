"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  SchoolSettings,
  StaffPost,
  StaffingScenario,
  ScenarioPost,
  PayAssumption,
  ICFPMetrics,
  Tier,
  ScenarioPostStatus,
} from "@/types/staffing";

// ─── State ──────────────────────────────────────────────────────────

interface StaffingState {
  schoolSettings: SchoolSettings | null;
  staffPosts: StaffPost[];
  scenarios: StaffingScenario[];
  activeScenarioId: string | null;
  scenarioPosts: (ScenarioPost & { staff_post: StaffPost })[];
  payAssumptions: PayAssumption[];
  loading: boolean;
}

const initialState: StaffingState = {
  schoolSettings: null,
  staffPosts: [],
  scenarios: [],
  activeScenarioId: null,
  scenarioPosts: [],
  payAssumptions: [],
  loading: true,
};

// ─── Constants ──────────────────────────────────────────────────────

const DEFAULT_TIER: Tier = "support";

// ─── Actions ────────────────────────────────────────────────────────

type StaffingAction =
  | { type: "SET_SCHOOL_SETTINGS"; payload: SchoolSettings | null }
  | { type: "SET_STAFF_POSTS"; payload: StaffPost[] }
  | { type: "SET_SCENARIOS"; payload: StaffingScenario[] }
  | { type: "SET_ACTIVE_SCENARIO"; payload: string }
  | { type: "SET_SCENARIO_POSTS"; payload: (ScenarioPost & { staff_post: StaffPost })[] }
  | { type: "SET_PAY_ASSUMPTIONS"; payload: PayAssumption[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "UPDATE_SCENARIO_POST"; payload: { id: string; status: ScenarioPostStatus } }
  | { type: "ADD_SCENARIO_POST"; payload: ScenarioPost & { staff_post: StaffPost } }
  | {
      type: "INIT";
      payload: {
        schoolSettings: SchoolSettings | null;
        staffPosts: StaffPost[];
        scenarios: StaffingScenario[];
        activeScenarioId: string | null;
        scenarioPosts: (ScenarioPost & { staff_post: StaffPost })[];
        payAssumptions: PayAssumption[];
      };
    };

function staffingReducer(state: StaffingState, action: StaffingAction): StaffingState {
  switch (action.type) {
    case "INIT":
      return { ...state, ...action.payload, loading: false };
    case "SET_SCHOOL_SETTINGS":
      return { ...state, schoolSettings: action.payload };
    case "SET_STAFF_POSTS":
      return { ...state, staffPosts: action.payload };
    case "SET_SCENARIOS":
      return { ...state, scenarios: action.payload };
    case "SET_ACTIVE_SCENARIO":
      return { ...state, activeScenarioId: action.payload };
    case "SET_SCENARIO_POSTS":
      return { ...state, scenarioPosts: action.payload };
    case "SET_PAY_ASSUMPTIONS":
      return { ...state, payAssumptions: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "UPDATE_SCENARIO_POST":
      return {
        ...state,
        scenarioPosts: state.scenarioPosts.map((sp) =>
          sp.id === action.payload.id ? { ...sp, status: action.payload.status } : sp,
        ),
      };
    case "ADD_SCENARIO_POST":
      return {
        ...state,
        scenarioPosts: [...state.scenarioPosts, action.payload],
      };
    default:
      return state;
  }
}

// ─── Cost calculation helper ────────────────────────────────────────

function postCost(
  sp: ScenarioPost & { staff_post: StaffPost },
): number {
  const fte = sp.override_fte ?? sp.staff_post.fte;
  const salary = sp.override_salary ?? sp.staff_post.salary;
  return fte * salary * (1 + sp.staff_post.on_cost_rate);
}

// ─── Computed Metrics ───────────────────────────────────────────────

function computeMetrics(
  activePosts: (ScenarioPost & { staff_post: StaffPost })[],
  schoolSettings: SchoolSettings | null,
  baselineCost: number,
): ICFPMetrics {
  const tiers: Tier[] = ["headteacher", "slt", "teachers", "tas", "support", "volunteers"];
  const tierBreakdown = {} as Record<Tier, { cost: number; fte: number; count: number }>;

  for (const t of tiers) {
    tierBreakdown[t] = { cost: 0, fte: 0, count: 0 };
  }

  let totalCost = 0;
  let totalFte = 0;
  let teacherFte = 0;

  for (const sp of activePosts) {
    const post = sp.staff_post;
    const fte = sp.override_fte ?? post.fte;
    const cost = postCost(sp);

    totalCost += cost;
    totalFte += fte;

    const tier = post.tier ?? DEFAULT_TIER;
    tierBreakdown[tier].cost += cost;
    tierBreakdown[tier].fte += fte;
    tierBreakdown[tier].count += 1;

    if (tier === "teachers") {
      teacherFte += fte;
    }
  }

  const roll = schoolSettings?.roll ?? 420;
  const gagPerPupil = schoolSettings?.gag_per_pupil ?? 5200;
  const totalIncome = roll * gagPerPupil;

  const staffingPct = totalIncome > 0 ? (totalCost / totalIncome) * 100 : 0;
  const ptr = teacherFte > 0 ? roll / teacherFte : 0;
  const averageTeacherCost =
    tierBreakdown.teachers.count > 0
      ? tierBreakdown.teachers.cost / tierBreakdown.teachers.count
      : 0;

  const sltCost = tierBreakdown.headteacher.cost + tierBreakdown.slt.cost;
  const sltPct = totalCost > 0 ? (sltCost / totalCost) * 100 : 0;
  const teachersPct = totalCost > 0 ? (tierBreakdown.teachers.cost / totalCost) * 100 : 0;
  const tasPct = totalCost > 0 ? (tierBreakdown.tas.cost / totalCost) * 100 : 0;
  const supportPct = totalCost > 0 ? (tierBreakdown.support.cost / totalCost) * 100 : 0;

  return {
    totalIncome,
    totalStaffingCost: totalCost,
    baselineCost,
    staffingPct,
    pupilTeacherRatio: ptr,
    averageTeacherCost,
    sltPct,
    teachersPct,
    tasPct,
    supportPct,
    totalFte,
    teacherFte,
    tierBreakdown,
  };
}

// ─── Derived post lists ─────────────────────────────────────────────

type ScenarioPostWithStaff = ScenarioPost & { staff_post: StaffPost };

function derivePostLists(scenarioPosts: ScenarioPostWithStaff[]) {
  const activePosts: ScenarioPostWithStaff[] = [];
  const releasedPosts: ScenarioPostWithStaff[] = [];
  const addedPosts: ScenarioPostWithStaff[] = [];
  const postsByTier = new Map<Tier, ScenarioPostWithStaff[]>();

  for (const sp of scenarioPosts) {
    if (sp.status === "released") {
      releasedPosts.push(sp);
    } else {
      activePosts.push(sp);
      if (sp.status === "added") addedPosts.push(sp);
      const tier = sp.staff_post.tier ?? DEFAULT_TIER;
      const arr = postsByTier.get(tier);
      if (arr) arr.push(sp);
      else postsByTier.set(tier, [sp]);
    }
  }

  return { activePosts, releasedPosts, addedPosts, postsByTier };
}

// ─── Context ────────────────────────────────────────────────────────

interface DerivedPosts {
  activePosts: ScenarioPostWithStaff[];
  releasedPosts: ScenarioPostWithStaff[];
  addedPosts: ScenarioPostWithStaff[];
  postsByTier: Map<Tier, ScenarioPostWithStaff[]>;
}

interface StaffingContextValue {
  state: StaffingState;
  computedMetrics: ICFPMetrics;
  derived: DerivedPosts;
  dispatch: React.Dispatch<StaffingAction>;
  switchScenario: (scenarioId: string) => void;
  releasePost: (scenarioPostId: string) => void;
  restorePost: (scenarioPostId: string) => void;
  addPost: (scenarioPost: ScenarioPostWithStaff) => void;
  updatePayAssumptions: (assumptions: PayAssumption[]) => void;
}

const StaffingContext = createContext<StaffingContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────

interface StaffingProviderProps {
  children: ReactNode;
  initialData?: {
    schoolSettings: SchoolSettings | null;
    staffPosts: StaffPost[];
    scenarios: StaffingScenario[];
    activeScenarioId: string | null;
    scenarioPosts: ScenarioPostWithStaff[];
    payAssumptions: PayAssumption[];
  };
}

export function StaffingProvider({ children, initialData }: StaffingProviderProps) {
  const [state, dispatch] = useReducer(
    staffingReducer,
    initialData
      ? { ...initialState, ...initialData, loading: false }
      : initialState,
  );

  const switchScenario = useCallback(
    (scenarioId: string) => dispatch({ type: "SET_ACTIVE_SCENARIO", payload: scenarioId }),
    [],
  );

  const releasePost = useCallback(
    (scenarioPostId: string) =>
      dispatch({ type: "UPDATE_SCENARIO_POST", payload: { id: scenarioPostId, status: "released" } }),
    [],
  );

  const restorePost = useCallback(
    (scenarioPostId: string) =>
      dispatch({ type: "UPDATE_SCENARIO_POST", payload: { id: scenarioPostId, status: "active" } }),
    [],
  );

  const addPost = useCallback(
    (scenarioPost: ScenarioPostWithStaff) =>
      dispatch({ type: "ADD_SCENARIO_POST", payload: scenarioPost }),
    [],
  );

  const updatePayAssumptions = useCallback(
    (assumptions: PayAssumption[]) =>
      dispatch({ type: "SET_PAY_ASSUMPTIONS", payload: assumptions }),
    [],
  );

  // Derive post lists once — consumed by all views
  const derived = useMemo(
    () => derivePostLists(state.scenarioPosts),
    [state.scenarioPosts],
  );

  // Compute baseline cost from raw staffPosts (the "before" state)
  const baselineCost = useMemo(
    () => state.staffPosts.reduce((a, p) => a + p.salary * p.fte * (1 + p.on_cost_rate), 0),
    [state.staffPosts],
  );

  const computedMetrics = useMemo(
    () => computeMetrics(derived.activePosts, state.schoolSettings, baselineCost),
    [derived.activePosts, state.schoolSettings, baselineCost],
  );

  const value = useMemo<StaffingContextValue>(
    () => ({
      state,
      computedMetrics,
      derived,
      dispatch,
      switchScenario,
      releasePost,
      restorePost,
      addPost,
      updatePayAssumptions,
    }),
    [state, computedMetrics, derived, switchScenario, releasePost, restorePost, addPost, updatePayAssumptions],
  );

  return (
    <StaffingContext.Provider value={value}>{children}</StaffingContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useStaffing() {
  const ctx = useContext(StaffingContext);
  if (!ctx) {
    throw new Error("useStaffing must be used within a StaffingProvider");
  }
  return ctx;
}
