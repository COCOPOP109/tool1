import { useState } from 'react'
import { evaluate, ACCESS_METHODS, TIME_MATCH_OPTIONS } from './utils/evaluation'
import type { FormData, AccessMethod, EvaluationResult } from './utils/evaluation'

const STEPS = [
  { id: 1, label: '基本信息', icon: '🏢' },
  { id: 2, label: '绿电获取途径', icon: '⚡' },
  { id: 3, label: '溯源方式', icon: '🔍' },
  { id: 4, label: '消费核算', icon: '📊' },
  { id: 5, label: '质量评价', icon: '⭐' },
  { id: 6, label: '披露报告', icon: '📋' },
]

const defaultForm: FormData = {
  companyName: '',
  disclosureScope: '',
  disclosurePeriod: '',
  totalElectricity: 0,
  accessMethods: [],
  traceMethod: { physical: false, measured: false, certificate: false, contract: false },
  hasThirdPartyVerify: false,
  dataMonitoringMonths: 0,
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500 font-mono">{value.toFixed(1)} / {max}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function GradeCard({ result }: { result: EvaluationResult }) {
  const gradeInfo = {
    '深绿': { bg: 'bg-green-800', text: 'text-white', emoji: '🌲', desc: '高质量绿电消费，对新型电力系统建设和电力系统脱碳贡献显著' },
    '绿': { bg: 'bg-green-600', text: 'text-white', emoji: '🌿', desc: '中等质量绿电消费，具备一定边际贡献' },
    '浅绿': { bg: 'bg-green-300', text: 'text-green-900', emoji: '🌱', desc: '基础绿电消费，有待提升消费质量' },
    '不合格': { bg: 'bg-gray-400', text: 'text-white', emoji: '⚠️', desc: '未达到基本评价要求' },
  }
  const info = gradeInfo[result.grade]
  return (
    <div className={`rounded-2xl p-6 ${info.bg} ${info.text} mb-6`}>
      <div className="flex items-center gap-4 mb-3">
        <span className="text-5xl">{info.emoji}</span>
        <div>
          <div className="text-3xl font-bold">{result.grade}</div>
          <div className="text-sm opacity-80 mt-1">总分 {result.totalScore} / 15</div>
        </div>
      </div>
      <p className="text-sm opacity-90">{info.desc}</p>
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [result, setResult] = useState<EvaluationResult | null>(null)

  const update = (patch: Partial<FormData>) => setForm(f => ({ ...f, ...patch }))

  const addMethod = () => {
    update({ accessMethods: [...form.accessMethods, { type: 'self_gen', label: '自发自用（场内）', weight: 5, greenRatio: 0, greenMwh: 0, traceMethod: '', timeMatch: 1 }] })
  }

  const updateMethod = (i: number, patch: Partial<AccessMethod>) => {
    const methods = [...form.accessMethods]
    methods[i] = { ...methods[i], ...patch }
    update({ accessMethods: methods })
  }

  const removeMethod = (i: number) => {
    update({ accessMethods: form.accessMethods.filter((_, idx) => idx !== i) })
  }

  const handleEvaluate = () => {
    const r = evaluate(form)
    setResult(r)
    setStep(6)
  }

  const totalGreen = form.accessMethods.reduce((s, m) => s + m.greenMwh, 0)
  const greenRatio = form.totalElectricity > 0 ? (totalGreen / form.totalElectricity) * 100 : 0

  const canNext = () => {
    if (step === 1) return form.companyName.trim() !== '' && form.disclosurePeriod !== ''
    if (step === 2) return form.accessMethods.length > 0
    if (step === 3) return Object.values(form.traceMethod).some(Boolean)
    if (step === 4) return form.totalElectricity > 0 && totalGreen > 0
    return true
  }

  const disclosureStatement = result ? `
根据《绿色电力消费信息披露与评价指引》，${form.companyName}（${form.disclosureScope}）在${form.disclosurePeriod}通过${form.accessMethods.map(m => m.label).join('、')}实现绿电消费，并应用${result.overallTrace}进行溯源。经核算，绿电消费总量为${result.greenMwhTotal.toFixed(2)} MWh，绿电消费占比为${result.greenRatio.toFixed(2)}%。根据温室气体核算体系，遵循基于市场的（market-based）方法，前述绿电消费量的碳排放因子记为0 tCO₂/MWh。基于以上结论，本声明中的绿电消费量满足零碳电力消费要求，绿电消费质量评价等级为"${result.grade}"。
  `.trim() : ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs opacity-70 mb-2 font-mono">T/CEPPC 43-2024</div>
          <h1 className="text-2xl font-bold">绿色电力消费质量评价工具</h1>
          <p className="text-green-100 text-sm mt-1">基于《绿色电力消费信息披露与评价指引》团体标准</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center py-3 min-w-[60px]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${step > s.id ? 'bg-green-600 text-white' : step === s.id ? 'bg-green-600 text-white ring-4 ring-green-100' : 'bg-gray-200 text-gray-500'}`}>
                    {step > s.id ? '✓' : s.icon}
                  </div>
                  <div className={`text-xs mt-1 hidden sm:block ${step >= s.id ? 'text-green-700 font-medium' : 'text-gray-400'}`}>{s.label}</div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${step > s.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">披露主体基本信息</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">企业/组织名称 <span className="text-red-500">*</span></label>
                  <input value={form.companyName} onChange={e => update({ companyName: e.target.value })} placeholder="请输入企业或组织全称" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">披露对象类型</label>
                  <select value={form.disclosureScope} onChange={e => update({ disclosureScope: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    <option value="">请选择披露对象类型</option>
                    <option value="自身运营">自身运营层面</option>
                    <option value="价值链">价值链层面</option>
                    <option value="设施">设施层面</option>
                    <option value="产品">产品层面</option>
                    <option value="活动">活动层面</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">披露周期 <span className="text-red-500">*</span></label>
                  <input value={form.disclosurePeriod} onChange={e => update({ disclosurePeriod: e.target.value })} placeholder="如：2024年度、2024年1月-12月" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">数据监测持续时间（月）</label>
                  <input type="number" min="0" value={form.dataMonitoringMonths} onChange={e => update({ dataMonitoringMonths: Number(e.target.value) })} placeholder="电力消费数据收集持续时间" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                  <p className="text-xs text-gray-400 mt-1">注：评价要求数据监测持续时间 ≥ 6个月</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Access Methods */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">绿电获取途径</h2>
              <p className="text-sm text-gray-500 mb-4">请添加该披露对象涉及的所有绿电获取方式，并填写各类别的绿电消费量</p>
              <div className="space-y-4">
                {form.accessMethods.map((m, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-green-700">方式 {i + 1}</span>
                      <button onClick={() => removeMethod(i)} className="text-red-500 text-xs hover:underline">删除</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">获取方式</label>
                        <select value={m.type} onChange={e => {
                          const sel = ACCESS_METHODS.find(x => x.type === e.target.value)
                          if (sel) updateMethod(i, { type: sel.type, label: sel.label, weight: sel.weight })
                        }} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                          {ACCESS_METHODS.map(am => <option key={am.type} value={am.type}>{am.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">时序匹配方式</label>
                        <select value={m.timeMatch} onChange={e => updateMethod(i, { timeMatch: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                          {TIME_MATCH_OPTIONS.map(tm => <option key={tm.value} value={tm.value}>{tm.label}（{tm.value}分）</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">该方式绿电消费量（MWh）</label>
                        <input type="number" min="0" step="0.01" value={m.greenMwh} onChange={e => updateMethod(i, { greenMwh: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">该方式绿电消费占比（%）</label>
                        <input type="number" min="0" max="100" step="0.01" value={m.greenRatio} onChange={e => updateMethod(i, { greenRatio: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addMethod} className="w-full border-2 border-dashed border-green-300 text-green-700 rounded-lg py-3 text-sm hover:border-green-500 hover:bg-green-50 transition-all font-medium">
                  + 添加绿电获取方式
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Traceability */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">绿电溯源方式</h2>
              <p className="text-sm text-gray-500 mb-4">请勾选该披露对象实际采用的溯源方式（可多选）</p>
              <div className="space-y-3">
                {[
                  { key: 'physical', label: '物理溯源', desc: '通过电力系统的物理连接路径，追踪绿电从生产端到消费端的实际流向', score: '95%置信度' },
                  { key: 'measured', label: '实测溯源', desc: '通过对绿电从生产到消费全过程的实际监测和计量数据进行采集、记录和验证', score: '95%置信度' },
                  { key: 'certificate', label: '证书溯源', desc: '通过绿证信息验证并追踪绿电的来源及消费情况', score: '50%置信度' },
                  { key: 'contract', label: '合约溯源', desc: '通过电力中长期交易过程中的协议或记录，对协议及成交的绿电进行追踪与验证', score: '80%置信度' },
                ].map(item => (
                  <label key={item.key} className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${form.traceMethod[item.key as keyof typeof form.traceMethod] ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                    <input type="checkbox" checked={form.traceMethod[item.key as keyof typeof form.traceMethod]} onChange={e => update({ traceMethod: { ...form.traceMethod, [item.key]: e.target.checked } })} className="mt-1 w-4 h-4 accent-green-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 text-sm">{item.label}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{item.score}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>注：</strong>同时通过<span className="font-bold">物理溯源</span>和<span className="font-bold">实测溯源</span>，且能用证书溯源或合约溯源交叉验证 → 置信度95%；无物理溯源但多方式交叉验证 → 80%；仅证书溯源 → 50%。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Accounting */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">绿电消费核算</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">总用电量（MWh） <span className="text-red-500">*</span></label>
                  <input type="number" min="0" step="0.01" value={form.totalElectricity || ''} onChange={e => update({ totalElectricity: Number(e.target.value) })} placeholder="核算周期内全部电力来源的用电量之和" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                  <p className="text-xs text-gray-400 mt-1">涵盖可再生电力和非可再生电力，单位：MWh</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{totalGreen.toFixed(2)}</div>
                    <div className="text-xs text-green-600 mt-1">绿电消费总量（MWh）</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{greenRatio.toFixed(2)}%</div>
                    <div className="text-xs text-green-600 mt-1">绿电消费占比</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{form.accessMethods.length}</div>
                    <div className="text-xs text-blue-600 mt-1">绿电获取方式数量</div>
                  </div>
                </div>
                {greenRatio < 20 && greenRatio > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      ⚠️ 当前绿电消费占比 <strong>{greenRatio.toFixed(2)}%</strong>，低于评价要求（≥20%）。建议提升绿电消费比例后再申请第三方评价。
                    </p>
                  </div>
                )}
                {form.accessMethods.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">各获取方式绿电消费量明细</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-200 px-3 py-2 text-left">获取方式</th>
                            <th className="border border-gray-200 px-3 py-2 text-center">绿电量（MWh）</th>
                            <th className="border border-gray-200 px-3 py-2 text-center">占比（%）</th>
                            <th className="border border-gray-200 px-3 py-2 text-center">时序匹配</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.accessMethods.map((m, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2">{m.label}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-mono">{m.greenMwh.toFixed(2)}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-mono">{(totalGreen > 0 ? (m.greenMwh / totalGreen * 100) : 0).toFixed(2)}%</td>
                              <td className="border border-gray-200 px-3 py-2 text-center">{TIME_MATCH_OPTIONS.find(t => t.value === m.timeMatch)?.label.split('（')[0]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Evaluation Preview */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">📊 质量评价预览</h2>
              <p className="text-sm text-gray-500 mb-4">以下是系统根据您填写的信息自动计算的评价结果（最终结果以第三方机构评价为准）</p>
              <div className="space-y-3">
                {form.accessMethods.length === 1 ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="text-sm font-bold text-green-800 mb-2">单一获取方式评价</div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-lg font-bold text-gray-700">{Object.values(form.traceMethod).filter(Boolean).length >= 2 && form.traceMethod.physical ? 4.75 : form.traceMethod.certificate && !form.traceMethod.physical ? 2.5 : Object.values(form.traceMethod).some(Boolean) ? 4.0 : 0}</div>
                        <div className="text-xs text-gray-500">追溯可信(C1)</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-lg font-bold text-gray-700">{form.accessMethods[0].weight}</div>
                        <div className="text-xs text-gray-500">边际贡献(C2)</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-lg font-bold text-gray-700">{form.accessMethods[0].timeMatch}</div>
                        <div className="text-xs text-gray-500">时序匹配(C3)</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-gray-700">多获取方式加权评价预览</div>
                    {form.accessMethods.map((m, i) => {
                      const ratio = totalGreen > 0 ? (m.greenMwh / totalGreen * 100) : 0
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2">
                          <span className="flex-1 truncate text-gray-600">{m.label}</span>
                          <span className="text-gray-400">×</span>
                          <span className="font-mono text-gray-700">{ratio.toFixed(1)}%</span>
                          <span className="text-gray-400">=</span>
                          <span className="font-mono font-bold text-green-700">{(m.weight + m.timeMatch + 2.5).toFixed(1)}分</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  ℹ️ 以上为系统自动预览结果。正式评价需委托具有资质的第三方机构根据附录B开展现场核查，并出具书面评价报告。
                </p>
              </div>
              <button onClick={handleEvaluate} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors">
                ⭐ 开始正式评价
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Results */}
        {step === 6 && result && (
          <div className="space-y-5">
            <GradeCard result={result} />
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">📊 评分明细</h2>
              <ScoreBar label="追溯可信 (C1)" value={result.c1Score} max={5} color="#22c55e" />
              <ScoreBar label="边际贡献 (C2)" value={result.individualScores[0]?.c2 ?? 0} max={5} color="#16a34a" />
              <ScoreBar label="时序匹配 (C3)" value={result.individualScores[0]?.c3 ?? 0} max={5} color="#15803d" />
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-700">{result.greenMwhTotal.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">绿电总量(MWh)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-700">{result.greenRatio.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">绿电消费占比</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-700">{result.c1Confidence}%</div>
                    <div className="text-xs text-gray-500">追溯置信度</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-700">{result.totalScore.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">综合得分</div>
                  </div>
                </div>
              </div>
            </div>
            {result.individualScores.length > 1 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-3">多方式加权评价</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border px-3 py-2 text-left">获取方式</th>
                        <th className="border px-3 py-2 text-center">占比%</th>
                        <th className="border px-3 py-2 text-center">C1</th>
                        <th className="border px-3 py-2 text-center">C2</th>
                        <th className="border px-3 py-2 text-center">C3</th>
                        <th className="border px-3 py-2 text-center">单项得分</th>
                        <th className="border px-3 py-2 text-center">加权贡献</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.individualScores.map((sc, i) => (
                        <tr key={i}>
                          <td className="border px-3 py-2">{sc.label}</td>
                          <td className="border px-3 py-2 text-center font-mono">{sc.ratio.toFixed(1)}</td>
                          <td className="border px-3 py-2 text-center">{sc.c1.toFixed(1)}</td>
                          <td className="border px-3 py-2 text-center">{sc.c2}</td>
                          <td className="border px-3 py-2 text-center">{sc.c3}</td>
                          <td className="border px-3 py-2 text-center font-bold">{sc.final.toFixed(1)}</td>
                          <td className="border px-3 py-2 text-center font-mono text-green-700">{(sc.final * sc.ratio / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-green-50 font-bold">
                        <td className="border px-3 py-2" colSpan={5}>综合得分</td>
                        <td className="border px-3 py-2 text-center" colSpan={2}>{result.totalScore.toFixed(1)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">📋 零碳电力消费声明（示例）</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{disclosureStatement}</pre>
              </div>
              <button onClick={() => navigator.clipboard.writeText(disclosureStatement)} className="mt-3 w-full border border-green-300 text-green-700 font-medium py-2 rounded-lg hover:bg-green-50 transition-colors text-sm">
                📋 复制声明文本
              </button>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="font-bold text-green-800 mb-2">📌 评价结论与建议</h3>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• 本评价基于 T/CEPPC 43-2024《绿色电力消费信息披露与评价指引》附录B规范性方法计算</li>
                <li>• 追溯可信维度得分：{result.c1Score.toFixed(2)}（{result.c1Confidence}%置信度）</li>
                <li>• 建议委托具有资质的第三方机构开展现场核查并出具正式评价报告</li>
                <li>• 鼓励持续提升绿电消费质量，力争25%以上绿电量达到"深绿"等级（2040年目标）</li>
                <li>• 绿电消费信息披露建议同步参考 T/CCAA96-2024 及 ISSB/IFRS S2 气候相关信息披露要求</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 6 && (
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${step === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              ← 上一步
            </button>
            {step < 5 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${!canNext() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                下一步 →
              </button>
            ) : null}
          </div>
        )}
        {step === 6 && (
          <div className="flex justify-between mt-8">
            <button onClick={() => { setStep(1); setResult(null) }} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
              🔄 重新评价
            </button>
            <button onClick={() => setStep(5)} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors">
              📥 查看评价报告 →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-white mt-8 py-4 text-center text-xs text-gray-400">
        基于 T/CEPPC 43-2024《绿色电力消费信息披露与评价指引》开发 · 评价结果仅供参考，正式评价需委托有资质的第三方机构
      </div>
    </div>
  )
}
