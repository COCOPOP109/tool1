export type AccessMethod = {
  type: 'self_gen' | 'direct_ppa' | 'retail_specific' | 'retail_unspecific' | 'standalone_gec' | 'transfer'
  label: string
  weight: number
  greenRatio: number
  greenMwh: number
  traceMethod: string
  timeMatch: number
}

export type TraceMethod = {
  physical: boolean
  measured: boolean
  certificate: boolean
  contract: boolean
}

export type FormData = {
  companyName: string
  disclosureScope: string
  disclosurePeriod: string
  totalElectricity: number
  accessMethods: AccessMethod[]
  traceMethod: TraceMethod
  hasThirdPartyVerify: boolean
  dataMonitoringMonths: number
}

export type EvaluationResult = {
  c1Score: number
  c1Confidence: number
  c2Score: number
  c3Score: number
  individualScores: { label: string; c1: number; c2: number; c3: number; final: number; ratio: number }[]
  totalScore: number
  grade: '深绿' | '绿' | '浅绿' | '不合格'
  gradeColor: string
  greenMwhTotal: number
  greenRatio: number
  overallTrace: string
}

function calcTraceConfidence(t: TraceMethod): number {
  const { physical, measured, certificate, contract } = t
  if (physical && measured) return 95
  if (!physical && (certificate || contract) && (measured || certificate)) return 80
  if (certificate) return 50
  return 0
}

function calcTraceScore(confidence: number): number {
  return Math.round(confidence * 5 / 100 * 100) / 100
}

export function evaluate(data: FormData): EvaluationResult {
  const totalGreen = data.accessMethods.reduce((s, m) => s + m.greenMwh, 0)
  const greenRatio = data.totalElectricity > 0 ? (totalGreen / data.totalElectricity) * 100 : 0

  const confidence = calcTraceConfidence(data.traceMethod)
  const c1Score = calcTraceScore(confidence)

  const individualScores = data.accessMethods.map(m => {
    const c1 = calcTraceScore(confidence)
    const c2 = m.weight
    const c3 = m.timeMatch
    const final = Math.round((c1 + c2 + c3) * 10) / 10
    const ratio = totalGreen > 0 ? (m.greenMwh / totalGreen) * 100 : 0
    return { label: m.label, c1, c2, c3, final, ratio }
  })

  let totalScore: number
  if (data.accessMethods.length === 1) {
    totalScore = individualScores[0]?.final ?? 0
  } else {
    totalScore = individualScores.reduce((s, sc) => s + (sc.final * sc.ratio / 100), 0)
    totalScore = Math.round(totalScore * 10) / 10
  }

  let grade: EvaluationResult['grade']
  let gradeColor: string
  if (totalScore > 10) { grade = '深绿'; gradeColor = '#166534' }
  else if (totalScore > 5) { grade = '绿'; gradeColor = '#15803d' }
  else if (totalScore > 0) { grade = '浅绿'; gradeColor = '#4ade80' }
  else { grade = '不合格'; gradeColor = '#6b7280' }

  const traceLabels: Record<string, string> = {
    physical: '物理溯源',
    measured: '实测溯源',
    certificate: '证书溯源',
    contract: '合约溯源'
  }
  const overallTrace = Object.entries(data.traceMethod)
    .filter(([, v]) => v)
    .map(([k]) => traceLabels[k])
    .join('、')

  return { c1Score, c1Confidence: confidence, c2Score: 0, c3Score: 0, individualScores, totalScore, grade, gradeColor, greenMwhTotal: totalGreen, greenRatio: Math.round(greenRatio * 100) / 100, overallTrace }
}

export const ACCESS_METHODS: { type: AccessMethod['type']; label: string; weight: number }[] = [
  { type: 'self_gen', label: '自发自用（场内）', weight: 5 },
  { type: 'direct_ppa', label: '专线直供电 / 直接签多年期购电协议', weight: 4 },
  { type: 'retail_specific', label: '通过售电公司签订特定电源购电协议', weight: 3 },
  { type: 'retail_unspecific', label: '通过售电公司购电（未约定特定电源）', weight: 2 },
  { type: 'standalone_gec', label: '独立购买绿证', weight: 1 },
  { type: 'transfer', label: '转供电绿电', weight: 2 },
]

export const TIME_MATCH_OPTIONS = [
  { value: 5, label: '按小时负荷曲线定价并执行' },
  { value: 4, label: '按尖峰平谷时段负荷定价并执行' },
  { value: 3, label: '按不同季节或月度负荷特征定价并执行' },
  { value: 2, label: '按年度负荷特征定价并执行' },
  { value: 1, label: '完全没有任何时间匹配要求' },
]
