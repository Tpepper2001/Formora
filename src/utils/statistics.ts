/**
 * Formora Statistical Analysis Engine
 * Real numerical algorithms for descriptive statistics, hypothesis testing,
 * correlation, and survey reliability.
 */

export interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  mode: number[];
  variance: number;
  standardDeviation: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  confidenceInterval95: [number, number];
}

export interface ChiSquareResult {
  testName: string;
  chiSquare: number;
  degreesOfFreedom: number;
  pValue: number;
  cramersV: number;
  sampleSize: number;
  rows: string[];
  columns: string[];
  observed: number[][];
  expected: number[][];
  interpretation: string;
  assumptionsMet: boolean;
}

export interface TTestResult {
  testName: string;
  tStatistic: number;
  degreesOfFreedom: number;
  pValue: number;
  group1: { name: string; n: number; mean: number; sd: number };
  group2: { name: string; n: number; mean: number; sd: number };
  cohensD: number;
  meanDifference: number;
  confidenceInterval95: [number, number];
  interpretation: string;
}

export interface AnovaResult {
  testName: string;
  fStatistic: number;
  dfBetween: number;
  dfWithin: number;
  pValue: number;
  etaSquared: number;
  groups: { name: string; n: number; mean: number; sd: number }[];
  interpretation: string;
}

export interface CorrelationResult {
  variable1: string;
  variable2: string;
  pearsonR: number;
  pearsonPValue: number;
  spearmanRho: number;
  spearmanPValue: number;
  sampleSize: number;
  interpretation: string;
}

export interface CronbachAlphaResult {
  scaleName: string;
  itemCount: number;
  sampleSize: number;
  alpha: number;
  reliabilityLevel: 'Excellent' | 'Good' | 'Acceptable' | 'Questionable' | 'Poor' | 'Unacceptable';
  itemStats: {
    questionId: string;
    questionTitle: string;
    itemMean: number;
    itemVariance: number;
    alphaIfDeleted: number;
  }[];
  interpretation: string;
}

// -------------------------------------------------------------
// Mathematical Distribution Approximations (Abramowitz & Stegun)
// -------------------------------------------------------------

function erf(x: number): number {
  // Constants for approximation of error function
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// Incomplete Gamma function for Chi-Square and F-distribution
function gammln(xx: number): number {
  let x = xx;
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  const ser =
    1.000000000190015 +
    76.18009172947146 / (y + 1.0) -
    86.50532032941677 / (y + 2.0) +
    24.01409824083091 / (y + 3.0) -
    1.231739572450155 / (y + 4.0) +
    0.1208650973866179e-2 / (y + 5.0) -
    0.5395239384953e-5 / (y + 6.0);
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function gser(a: number, x: number): number {
  const ITMAX = 100;
  const EPS = 3.0e-7;
  const gln = gammln(a);
  if (x <= 0.0) return 0.0;
  let ap = a;
  let del = 1.0 / a;
  let sum = del;
  for (let n = 1; n <= ITMAX; n++) {
    ++ap;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) {
      return sum * Math.exp(-x + a * Math.log(x) - gln);
    }
  }
  return sum * Math.exp(-x + a * Math.log(x) - gln);
}

function gcf(a: number, x: number): number {
  const ITMAX = 100;
  const EPS = 3.0e-7;
  const FPMIN = 1.0e-30;
  const gln = gammln(a);
  let b = x + 1.0 - a;
  let c = 1.0 / FPMIN;
  let d = 1.0 / b;
  let h = d;
  for (let i = 1; i <= ITMAX; i++) {
    const an = -i * (i - a);
    b += 2.0;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - gln) * h;
}

export function gammacdf(a: number, x: number): number {
  if (x < 0.0 || a <= 0.0) return 0.0;
  if (x < a + 1.0) {
    return gser(a, x);
  } else {
    return 1.0 - gcf(a, x);
  }
}

export function chiSquarePValue(chiSq: number, df: number): number {
  if (df <= 0 || chiSq <= 0) return 1.0;
  const p = 1.0 - gammacdf(df / 2.0, chiSq / 2.0);
  return Math.max(0.0, Math.min(1.0, p));
}

// Incomplete beta function for Student's t and ANOVA F distributions
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 100;
  const EPS = 3.0e-7;
  const FPMIN = 1.0e-30;
  const qab = a + b;
  const qap = a + 1.0;
  const qam = a - 1.0;
  let c = 1.0;
  let d = 1.0 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1.0 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < EPS) break;
  }
  return h;
}

function betai(a: number, b: number, x: number): number {
  if (x < 0.0 || x > 1.0) return 0.0;
  let bt = 0.0;
  if (x > 0.0 && x < 1.0) {
    bt = Math.exp(gammln(a + b) - gammln(a) - gammln(b) + a * Math.log(x) + b * Math.log(1.0 - x));
  }
  if (x < (a + 1.0) / (a + b + 2.0)) {
    return (bt * betacf(a, b, x)) / a;
  } else {
    return 1.0 - (bt * betacf(b, a, 1.0 - x)) / b;
  }
}

export function tPValue(t: number, df: number): number {
  if (df <= 0) return 1.0;
  const x = df / (df + t * t);
  const p = betai(0.5 * df, 0.5, x);
  return Math.max(0.0, Math.min(1.0, p));
}

export function fPValue(f: number, df1: number, df2: number): number {
  if (f <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
  const x = df2 / (df2 + df1 * f);
  const p = betai(0.5 * df2, 0.5 * df1, x);
  return Math.max(0.0, Math.min(1.0, p));
}

// -------------------------------------------------------------
// Descriptive Statistics Calculation
// -------------------------------------------------------------

export function calculateDescriptiveStats(numbers: number[]): DescriptiveStats | null {
  const valid = numbers.filter((n) => typeof n === 'number' && !isNaN(n));
  if (valid.length === 0) return null;

  const count = valid.length;
  const sorted = [...valid].sort((a, b) => a - b);
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / count;

  // Median
  const mid = Math.floor(count / 2);
  const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Mode
  const freqMap: Record<number, number> = {};
  let maxFreq = 0;
  for (const num of valid) {
    freqMap[num] = (freqMap[num] || 0) + 1;
    if (freqMap[num] > maxFreq) maxFreq = freqMap[num];
  }
  const mode = Object.keys(freqMap)
    .filter((k) => freqMap[Number(k)] === maxFreq && maxFreq > 1)
    .map(Number);

  // Variance & Standard Deviation
  const variance =
    count > 1
      ? valid.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (count - 1)
      : 0;
  const standardDeviation = Math.sqrt(variance);

  const min = sorted[0];
  const max = sorted[count - 1];
  const range = max - min;

  // Quartiles
  const getPercentile = (p: number) => {
    const index = (count - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (upper >= count) return sorted[count - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };
  const q1 = getPercentile(0.25);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;

  // Skewness and Kurtosis
  let m3 = 0;
  let m4 = 0;
  if (count > 2 && standardDeviation > 0) {
    for (const val of valid) {
      const diff = val - mean;
      m3 += Math.pow(diff, 3);
      m4 += Math.pow(diff, 4);
    }
    m3 /= count;
    m4 /= count;
  }
  const skewness = standardDeviation > 0 ? m3 / Math.pow(standardDeviation, 3) : 0;
  const kurtosis = standardDeviation > 0 ? m4 / Math.pow(standardDeviation, 4) - 3 : 0; // Excess kurtosis

  // 95% Confidence Interval for Mean (t ~ 1.96 for n>30, or scaled)
  const se = standardDeviation / Math.sqrt(count);
  const tCritical = count > 30 ? 1.96 : 2.05;
  const confidenceInterval95: [number, number] = [mean - tCritical * se, mean + tCritical * se];

  return {
    count,
    mean: Number(mean.toFixed(3)),
    median: Number(median.toFixed(3)),
    mode,
    variance: Number(variance.toFixed(3)),
    standardDeviation: Number(standardDeviation.toFixed(3)),
    min,
    max,
    range,
    q1: Number(q1.toFixed(3)),
    q3: Number(q3.toFixed(3)),
    iqr: Number(iqr.toFixed(3)),
    skewness: Number(skewness.toFixed(3)),
    kurtosis: Number(kurtosis.toFixed(3)),
    confidenceInterval95: [
      Number(confidenceInterval95[0].toFixed(3)),
      Number(confidenceInterval95[1].toFixed(3)),
    ],
  };
}

// -------------------------------------------------------------
// Chi-Square Test of Independence
// -------------------------------------------------------------

export function calculateChiSquare(
  rowLabels: string[],
  colLabels: string[],
  contingencyTable: number[][]
): ChiSquareResult {
  const numRows = contingencyTable.length;
  const numCols = contingencyTable[0]?.length || 0;

  const rowTotals = new Array(numRows).fill(0);
  const colTotals = new Array(numCols).fill(0);
  let grandTotal = 0;

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const val = contingencyTable[r][c] || 0;
      rowTotals[r] += val;
      colTotals[c] += val;
      grandTotal += val;
    }
  }

  const expected: number[][] = [];
  let chiSquare = 0;
  let minExpected = Infinity;

  for (let r = 0; r < numRows; r++) {
    expected[r] = [];
    for (let c = 0; c < numCols; c++) {
      const exp = grandTotal > 0 ? (rowTotals[r] * colTotals[c]) / grandTotal : 0;
      expected[r][c] = Number(exp.toFixed(2));
      if (exp < minExpected) minExpected = exp;

      if (exp > 0) {
        const diff = contingencyTable[r][c] - exp;
        chiSquare += (diff * diff) / exp;
      }
    }
  }

  const df = Math.max(1, (numRows - 1) * (numCols - 1));
  const pVal = chiSquarePValue(chiSquare, df);

  // Cramer's V effect size
  const k = Math.min(numRows, numCols);
  const cramersV = grandTotal > 0 && k > 1 ? Math.sqrt(chiSquare / (grandTotal * (k - 1))) : 0;

  const significant = pVal < 0.05;
  const interp = significant
    ? `Statistically significant relationship detected (χ²(${df}) = ${chiSquare.toFixed(2)}, p = ${pVal < 0.001 ? '< .001' : pVal.toFixed(3)}). There is a systematic association between the two categorical variables.`
    : `No statistically significant relationship (χ²(${df}) = ${chiSquare.toFixed(2)}, p = ${pVal.toFixed(3)}). Any observed differences between categories are consistent with random sample variation.`;

  return {
    testName: "Pearson's Chi-Square Test of Independence",
    chiSquare: Number(chiSquare.toFixed(3)),
    degreesOfFreedom: df,
    pValue: Number(pVal.toFixed(4)),
    cramersV: Number(cramersV.toFixed(3)),
    sampleSize: grandTotal,
    rows: rowLabels,
    columns: colLabels,
    observed: contingencyTable,
    expected,
    interpretation: interp,
    assumptionsMet: minExpected >= 5,
  };
}

// -------------------------------------------------------------
// Independent Two-Sample T-Test
// -------------------------------------------------------------

export function calculateIndependentTTest(
  g1Name: string,
  g1Data: number[],
  g2Name: string,
  g2Data: number[]
): TTestResult | null {
  const v1 = g1Data.filter((x) => typeof x === 'number' && !isNaN(x));
  const v2 = g2Data.filter((x) => typeof x === 'number' && !isNaN(x));

  if (v1.length < 2 || v2.length < 2) return null;

  const n1 = v1.length;
  const n2 = v2.length;
  const m1 = v1.reduce((a, b) => a + b, 0) / n1;
  const m2 = v2.reduce((a, b) => a + b, 0) / n2;

  const ss1 = v1.reduce((acc, curr) => acc + Math.pow(curr - m1, 2), 0);
  const ss2 = v2.reduce((acc, curr) => acc + Math.pow(curr - m2, 2), 0);

  const var1 = ss1 / (n1 - 1);
  const var2 = ss2 / (n2 - 1);

  // Welch's t-test (unequal variances assumed)
  const seDiff = Math.sqrt(var1 / n1 + var2 / n2);
  const tStat = seDiff > 0 ? (m1 - m2) / seDiff : 0;

  // Welch-Satterthwaite degrees of freedom
  const num = Math.pow(var1 / n1 + var2 / n2, 2);
  const den =
    Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1);
  const df = den > 0 ? Math.floor(num / den) : n1 + n2 - 2;

  const pVal = tPValue(Math.abs(tStat), df);

  // Cohen's d (pooled standard deviation)
  const pooledSd = Math.sqrt((ss1 + ss2) / (n1 + n2 - 2));
  const cohensD = pooledSd > 0 ? (m1 - m2) / pooledSd : 0;

  const diff = m1 - m2;
  const ci: [number, number] = [diff - 1.96 * seDiff, diff + 1.96 * seDiff];

  const significant = pVal < 0.05;
  const interp = significant
    ? `Significant difference between ${g1Name} (M = ${m1.toFixed(2)}) and ${g2Name} (M = ${m2.toFixed(2)}): t(${df}) = ${tStat.toFixed(2)}, p = ${pVal < 0.001 ? '< .001' : pVal.toFixed(3)}, Cohen's d = ${cohensD.toFixed(2)}.`
    : `No significant difference observed between ${g1Name} (M = ${m1.toFixed(2)}) and ${g2Name} (M = ${m2.toFixed(2)}): t(${df}) = ${tStat.toFixed(2)}, p = ${pVal.toFixed(3)}.`;

  return {
    testName: "Welch's Independent Two-Sample t-Test",
    tStatistic: Number(tStat.toFixed(3)),
    degreesOfFreedom: df,
    pValue: Number(pVal.toFixed(4)),
    group1: { name: g1Name, n: n1, mean: Number(m1.toFixed(2)), sd: Number(Math.sqrt(var1).toFixed(2)) },
    group2: { name: g2Name, n: n2, mean: Number(m2.toFixed(2)), sd: Number(Math.sqrt(var2).toFixed(2)) },
    cohensD: Number(cohensD.toFixed(3)),
    meanDifference: Number(diff.toFixed(3)),
    confidenceInterval95: [Number(ci[0].toFixed(2)), Number(ci[1].toFixed(2))],
    interpretation: interp,
  };
}

// -------------------------------------------------------------
// One-Way ANOVA
// -------------------------------------------------------------

export function calculateOneWayAnova(groups: { name: string; data: number[] }[]): AnovaResult | null {
  const validGroups = groups
    .map((g) => ({
      name: g.name,
      values: g.data.filter((x) => typeof x === 'number' && !isNaN(x)),
    }))
    .filter((g) => g.values.length > 1);

  if (validGroups.length < 2) return null;

  let grandTotal = 0;
  let totalN = 0;

  const groupStats = validGroups.map((g) => {
    const n = g.values.length;
    const sum = g.values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const ss = g.values.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0);
    const sd = Math.sqrt(ss / (n - 1));

    grandTotal += sum;
    totalN += n;

    return { name: g.name, n, mean, ss, sd };
  });

  const grandMean = grandTotal / totalN;

  // Between-group sum of squares (SSB)
  let ssb = 0;
  for (const g of groupStats) {
    ssb += g.n * Math.pow(g.mean - grandMean, 2);
  }

  // Within-group sum of squares (SSW)
  let ssw = 0;
  for (const g of groupStats) {
    ssw += g.ss;
  }

  const k = validGroups.length;
  const dfBetween = k - 1;
  const dfWithin = totalN - k;

  const msb = dfBetween > 0 ? ssb / dfBetween : 0;
  const msw = dfWithin > 0 ? ssw / dfWithin : 0;

  const fStat = msw > 0 ? msb / msw : 0;
  const pVal = fPValue(fStat, dfBetween, dfWithin);
  const etaSquared = ssb + ssw > 0 ? ssb / (ssb + ssw) : 0;

  const significant = pVal < 0.05;
  const interp = significant
    ? `Statistically significant variance across groups: F(${dfBetween}, ${dfWithin}) = ${fStat.toFixed(2)}, p = ${pVal < 0.001 ? '< .001' : pVal.toFixed(3)}, η² = ${etaSquared.toFixed(3)}. At least one group differs significantly.`
    : `No statistically significant differences among group means: F(${dfBetween}, ${dfWithin}) = ${fStat.toFixed(2)}, p = ${pVal.toFixed(3)}.`;

  return {
    testName: 'One-Way Analysis of Variance (ANOVA)',
    fStatistic: Number(fStat.toFixed(3)),
    dfBetween,
    dfWithin,
    pValue: Number(pVal.toFixed(4)),
    etaSquared: Number(etaSquared.toFixed(3)),
    groups: groupStats.map((g) => ({
      name: g.name,
      n: g.n,
      mean: Number(g.mean.toFixed(2)),
      sd: Number(g.sd.toFixed(2)),
    })),
    interpretation: interp,
  };
}

// -------------------------------------------------------------
// Pearson & Spearman Correlation
// -------------------------------------------------------------

export function calculateCorrelation(
  var1Name: string,
  x: number[],
  var2Name: string,
  y: number[]
): CorrelationResult | null {
  const paired: { x: number; y: number }[] = [];
  const minLen = Math.min(x.length, y.length);

  for (let i = 0; i < minLen; i++) {
    if (typeof x[i] === 'number' && !isNaN(x[i]) && typeof y[i] === 'number' && !isNaN(y[i])) {
      paired.push({ x: x[i], y: y[i] });
    }
  }

  const n = paired.length;
  if (n < 4) return null;

  // Pearson r
  const sumX = paired.reduce((acc, curr) => acc + curr.x, 0);
  const sumY = paired.reduce((acc, curr) => acc + curr.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (const p of paired) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const pearsonR = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;
  // Pearson t = r * sqrt((n-2)/(1-r^2))
  const r2 = pearsonR * pearsonR;
  const tStatP = r2 < 1 ? pearsonR * Math.sqrt((n - 2) / (1 - r2)) : 0;
  const pearsonP = tPValue(Math.abs(tStatP), n - 2);

  // Spearman Rho (Rank correlation)
  const getRanks = (arr: number[]) => {
    const indexed = arr.map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val);
    const ranks = new Array(arr.length);
    let i = 0;
    while (i < indexed.length) {
      let j = i;
      while (j < indexed.length - 1 && indexed[j + 1].val === indexed[j].val) {
        j++;
      }
      const rank = (i + 1 + j + 1) / 2;
      for (let k = i; k <= j; k++) {
        ranks[indexed[k].idx] = rank;
      }
      i = j + 1;
    }
    return ranks;
  };

  const rankX = getRanks(paired.map((p) => p.x));
  const rankY = getRanks(paired.map((p) => p.y));

  let dSquaredSum = 0;
  for (let i = 0; i < n; i++) {
    const d = rankX[i] - rankY[i];
    dSquaredSum += d * d;
  }
  const spearmanRho = 1 - (6 * dSquaredSum) / (n * (n * n - 1));
  const rho2 = spearmanRho * spearmanRho;
  const tStatS = rho2 < 1 ? spearmanRho * Math.sqrt((n - 2) / (1 - rho2)) : 0;
  const spearmanP = tPValue(Math.abs(tStatS), n - 2);

  const getStrength = (r: number) => {
    const abs = Math.abs(r);
    const dir = r >= 0 ? 'positive' : 'negative';
    if (abs >= 0.7) return `strong ${dir}`;
    if (abs >= 0.4) return `moderate ${dir}`;
    if (abs >= 0.2) return `weak ${dir}`;
    return 'negligible';
  };

  const interp = `Pearson's r = ${pearsonR.toFixed(3)} (p = ${pearsonP < 0.001 ? '< .001' : pearsonP.toFixed(3)}), indicating a ${getStrength(pearsonR)} linear relationship. Spearman's ρ = ${spearmanRho.toFixed(3)} (p = ${spearmanP < 0.001 ? '< .001' : spearmanP.toFixed(3)}).`;

  return {
    variable1: var1Name,
    variable2: var2Name,
    pearsonR: Number(pearsonR.toFixed(3)),
    pearsonPValue: Number(pearsonP.toFixed(4)),
    spearmanRho: Number(spearmanRho.toFixed(3)),
    spearmanPValue: Number(spearmanP.toFixed(4)),
    sampleSize: n,
    interpretation: interp,
  };
}

// -------------------------------------------------------------
// Cronbach's Alpha (Survey Scale Reliability)
// -------------------------------------------------------------

export function calculateCronbachAlpha(
  scaleName: string,
  items: { id: string; title: string; scores: number[] }[]
): CronbachAlphaResult | null {
  const k = items.length;
  if (k < 2) return null;

  // Align responses row by row
  const n = items[0].scores.length;
  if (n < 3) return null;

  const validRows: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row = items.map((it) => it.scores[i]);
    if (row.every((val) => typeof val === 'number' && !isNaN(val))) {
      validRows.push(row);
    }
  }

  const sampleSize = validRows.length;
  if (sampleSize < 3) return null;

  // Item variances
  const itemVariances: number[] = [];
  const itemMeans: number[] = [];

  for (let col = 0; col < k; col++) {
    const colVals = validRows.map((r) => r[col]);
    const mean = colVals.reduce((a, b) => a + b, 0) / sampleSize;
    const variance =
      colVals.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (sampleSize - 1);
    itemMeans.push(mean);
    itemVariances.push(variance);
  }

  const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);

  // Total scores variance
  const totalScores = validRows.map((row) => row.reduce((a, b) => a + b, 0));
  const totalMean = totalScores.reduce((a, b) => a + b, 0) / sampleSize;
  const totalVariance =
    totalScores.reduce((acc, curr) => acc + Math.pow(curr - totalMean, 2), 0) / (sampleSize - 1);

  let alpha = 0;
  if (totalVariance > 0 && k > 1) {
    alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);
  }

  // Alpha if item deleted
  const itemStats = items.map((it, idx) => {
    const remainingCols = Array.from({ length: k }, (_, i) => i).filter((i) => i !== idx);
    let alphaIfDel = 0;
    if (remainingCols.length > 1) {
      const subVariances = remainingCols.map((c) => itemVariances[c]);
      const subSumVar = subVariances.reduce((a, b) => a + b, 0);
      const subTotals = validRows.map((r) => remainingCols.reduce((sum, c) => sum + r[c], 0));
      const subTotMean = subTotals.reduce((a, b) => a + b, 0) / sampleSize;
      const subTotVar =
        subTotals.reduce((acc, curr) => acc + Math.pow(curr - subTotMean, 2), 0) /
        (sampleSize - 1);
      if (subTotVar > 0) {
        alphaIfDel =
          (remainingCols.length / (remainingCols.length - 1)) * (1 - subSumVar / subTotVar);
      }
    }

    return {
      questionId: it.id,
      questionTitle: it.title,
      itemMean: Number(itemMeans[idx].toFixed(2)),
      itemVariance: Number(itemVariances[idx].toFixed(2)),
      alphaIfDeleted: Number(alphaIfDel.toFixed(3)),
    };
  });

  const boundedAlpha = Math.max(-1, Math.min(1, alpha));
  let level: CronbachAlphaResult['reliabilityLevel'] = 'Unacceptable';
  if (boundedAlpha >= 0.9) level = 'Excellent';
  else if (boundedAlpha >= 0.8) level = 'Good';
  else if (boundedAlpha >= 0.7) level = 'Acceptable';
  else if (boundedAlpha >= 0.6) level = 'Questionable';
  else if (boundedAlpha >= 0.5) level = 'Poor';

  const interp = `Cronbach's α = ${boundedAlpha.toFixed(3)} across ${k} items (n = ${sampleSize}), representing '${level}' internal consistency reliability for this scale.`;

  return {
    scaleName,
    itemCount: k,
    sampleSize,
    alpha: Number(boundedAlpha.toFixed(3)),
    reliabilityLevel: level,
    itemStats,
    interpretation: interp,
  };
}
