import { IDeductionProfile } from '@/types/deduction';

export interface CalculationInput {
  width: number;
  height: number;
  panelsCount: number;
  mullionsCount: number;
  transomsCount: number;
  quantity: number;
  profile: IDeductionProfile;
  stockBarLength?: number;
  costMatrix: {
    aluminumPerBar: number;
    glassPerSQM: number;
    spacerPerMeter: number;
    siliconePerMeter: number;
    hingeUnitCost: number;
    rollerUnitCost: number;
    lockUnitCost: number;
    gasketPerMeter: number;
    bottomRailCost?: number;
  };
}

export interface CuttingElement {
  label: string;
  length: number;
  count: number;
}

export interface NestingResult {
  barsRequired: number;
  barLength: number;
  bins: { cuts: number[]; usedLength: number; scrap: number }[];
  totalScrapMM: number;
  utilizationPercent: number;
  oversizeCuts: { label: string; length: number }[];
}

export interface CalculationResult {
  aluminumCuttingList: CuttingElement[];
  barsRequired: number;
  /** @deprecated Use barsRequired */
  bars6MRequired: number;
  stockBarLength: number;
  nesting: NestingResult;
  glassDimensions: {
    width: number;
    height: number;
    totalAreaSQM: number;
    panelsCount: number;
    totalSpacerMeters: number;
    totalSiliconeMeters: number;
  };
  hardwareCounts: {
    hinges: number;
    rollers: number;
    locks: number;
    gasketMeters: number;
  };
  costBreakdown: {
    aluminumCost: number;
    glassCost: number;
    hardwareCost: number;
    totalMaterialCost: number;
  };
}

const round = (n: number, d = 2) => Number(n.toFixed(d));

export const DEFAULT_BAR_LENGTH = 5800;

export class CalculationEngine {
  public static optimizeLinearCutting(
    cuts: { length: number; label: string }[],
    barLength = DEFAULT_BAR_LENGTH,
    bladeKerf = 4
  ): NestingResult {
    const oversizeCuts = cuts.filter((c) => c.length > barLength);
    const validCuts = cuts.filter((c) => c.length <= barLength);
    const sorted = [...validCuts].sort((a, b) => b.length - a.length);

    const bins: number[][] = [];
    for (const cut of sorted) {
      let placed = false;
      for (const bin of bins) {
        const used = bin.reduce((s, l) => s + l, 0) + Math.max(bin.length - 1, 0) * bladeKerf;
        const addKerf = bin.length > 0 ? bladeKerf : 0;
        if (used + addKerf + cut.length <= barLength) {
          bin.push(cut.length);
          placed = true;
          break;
        }
      }
      if (!placed) bins.push([cut.length]);
    }

    const binReports = bins.map((bin) => {
      const usedLength = bin.reduce((s, l) => s + l, 0) + Math.max(bin.length - 1, 0) * bladeKerf;
      return { cuts: bin, usedLength, scrap: barLength - usedLength };
    });

    const totalScrapMM = binReports.reduce((s, b) => s + b.scrap, 0);
    const totalRaw = bins.length * barLength;
    const utilizationPercent = totalRaw > 0 ? round(((totalRaw - totalScrapMM) / totalRaw) * 100, 1) : 0;

    return {
      barsRequired: bins.length,
      barLength,
      bins: binReports,
      totalScrapMM,
      utilizationPercent,
      oversizeCuts: oversizeCuts.map(({ label, length }) => ({ label, length })),
    };
  }

  public static calculate(input: CalculationInput): CalculationResult {
    const { width, height, panelsCount, mullionsCount, transomsCount, quantity, profile, costMatrix } = input;
    const barLength = input.stockBarLength ?? DEFAULT_BAR_LENGTH;

    if (width <= 0 || height <= 0) throw new Error('الأبعاد يجب أن تكون موجبة');
    if (quantity < 1) throw new Error('الكمية يجب أن تكون 1 على الأقل');

    const aluminumCuttingList: CuttingElement[] = [];
    const rawCuts: { length: number; label: string }[] = [];

    const addCut = (label: string, length: number, count: number) => {
      if (length <= 0 || count <= 0) return;
      aluminumCuttingList.push({ label, length: round(length, 1), count });
      for (let i = 0; i < count; i++) rawCuts.push({ length, label });
    };

    let sashWidth = 0;
    let sashHeight = height - profile.frameToSashVertical;

    addCut('حلق أفقي (علوي/سفلي)', width, 2 * quantity);
    addCut('حلق رأسي (يمين/يسار)', height, 2 * quantity);

    if (profile.systemType === 'SLIDING') {
      const netW = width - profile.frameToSashHorizontal + profile.overlapAllowance * (panelsCount - 1);
      sashWidth = netW / Math.max(panelsCount, 1);
      addCut('ضلفة أفقية (سحاب)', sashWidth, 2 * panelsCount * quantity);
      addCut('ضلفة رأسية (سحاب)', sashHeight, 2 * panelsCount * quantity);
    } else if (profile.systemType === 'HINGED') {
      sashWidth = (width - profile.frameToSashHorizontal) / Math.max(panelsCount, 1);
      addCut('ضلفة مفصلي أفقية', sashWidth, 2 * panelsCount * quantity);
      addCut('ضلفة مفصلي رأسية', sashHeight, 2 * panelsCount * quantity);
    } else if (profile.systemType === 'DOOR') {
      sashWidth = (width - profile.frameToSashHorizontal) / Math.max(panelsCount, 1);
      addCut('ضلفة باب أفقية', sashWidth, 2 * panelsCount * quantity);
      addCut('ضلفة باب رأسية', sashHeight, 2 * panelsCount * quantity);
      addCut('كعب الباب السفلي', sashWidth, panelsCount * quantity);
    } else {
      sashWidth = width;
      sashHeight = height;
    }

    if (mullionsCount > 0) addCut('مقسم رأسي (تيش)', height - profile.mullionDeduction, mullionsCount * quantity);
    if (transomsCount > 0) addCut('عارض أفقي (قاطع)', width - profile.transomDeduction, transomsCount * quantity);

    const nesting = this.optimizeLinearCutting(rawCuts, barLength, 4);
    const barsRequired = nesting.barsRequired;

    let glassWidth: number, glassHeight: number, totalGlassPanels: number;
    if (['SLIDING', 'HINGED', 'DOOR'].includes(profile.systemType)) {
      glassWidth = sashWidth - profile.glassDeductionHorizontal;
      glassHeight = sashHeight - profile.glassDeductionVertical;
      totalGlassPanels = panelsCount * quantity;
    } else {
      glassWidth = width - profile.glassDeductionHorizontal;
      glassHeight = height - profile.glassDeductionVertical;
      totalGlassPanels = quantity;
    }

    const singleGlassArea = (glassWidth * glassHeight) / 1_000_000;
    const totalGlassAreaSQM = singleGlassArea * totalGlassPanels;
    const perimeterM = (glassWidth * 2 + glassHeight * 2) / 1000;
    const totalSpacerMeters = perimeterM * totalGlassPanels;
    const rules = profile.hardwareFormulaRules;
    const totalSiliconeMeters = totalSpacerMeters * rules.siliconeAndGaskets.wasteMultiplier;

    let totalHinges = 0, totalRollers = 0;
    if (profile.systemType === 'HINGED' || profile.systemType === 'DOOR') {
      const extra = Math.floor(sashHeight / rules.hinges.perHeightLimit);
      totalHinges = (rules.hinges.baseCount + extra) * panelsCount * quantity;
    }
    if (profile.systemType === 'SLIDING') {
      totalRollers = rules.rollers.perPanelCount * panelsCount * quantity;
    }
    const totalLocks = rules.locks.perSashCount * panelsCount * quantity;
    const totalGasketMeters = totalSiliconeMeters;

    const aluminumCost = barsRequired * costMatrix.aluminumPerBar;
    const glassCost =
      totalGlassAreaSQM * costMatrix.glassPerSQM +
      totalSpacerMeters * costMatrix.spacerPerMeter +
      totalSiliconeMeters * costMatrix.siliconePerMeter;
    const hardwareCost =
      totalHinges * costMatrix.hingeUnitCost +
      totalRollers * costMatrix.rollerUnitCost +
      totalLocks * costMatrix.lockUnitCost +
      totalGasketMeters * costMatrix.gasketPerMeter +
      (profile.systemType === 'DOOR' ? panelsCount * quantity * (costMatrix.bottomRailCost ?? 0) : 0);

    return {
      aluminumCuttingList,
      barsRequired,
      bars6MRequired: barsRequired,
      stockBarLength: barLength,
      nesting,
      glassDimensions: {
        width: round(glassWidth, 1),
        height: round(glassHeight, 1),
        totalAreaSQM: round(totalGlassAreaSQM, 3),
        panelsCount: totalGlassPanels,
        totalSpacerMeters: round(totalSpacerMeters),
        totalSiliconeMeters: round(totalSiliconeMeters),
      },
      hardwareCounts: {
        hinges: totalHinges,
        rollers: totalRollers,
        locks: totalLocks,
        gasketMeters: round(totalGasketMeters),
      },
      costBreakdown: {
        aluminumCost: round(aluminumCost),
        glassCost: round(glassCost),
        hardwareCost: round(hardwareCost),
        totalMaterialCost: round(aluminumCost + glassCost + hardwareCost),
      },
    };
  }
}
