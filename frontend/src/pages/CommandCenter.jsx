import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { Play, AlertTriangle, CheckCircle, Users, IndianRupee, PieChart, Shield } from 'lucide-react';

const CommandCenter = () => {
  // State Management
  const [totalBudget, setTotalBudget] = useState(5000000);
  const [meritWeight, setMeritWeight] = useState(0.4);
  const [incomeWeight, setIncomeWeight] = useState(0.4);
  const [policyWeight, setPolicyWeight] = useState(0.2);
  const [useBudget, setUseBudget] = useState(true);
  const [allocationEngine, setAllocationEngine] = useState('greedy');
  const [simulationData, setSimulationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate total weight for validation
  const totalWeight = meritWeight + incomeWeight + policyWeight;
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;

  // API Call Function
  const runSimulation = async () => {
    if (!isWeightValid) {
      setError('Weights must sum to exactly 1.0');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_budget: totalBudget,
          merit_weight: meritWeight,
          income_weight: incomeWeight,
          policy_weight: policyWeight,
          use_budget: useBudget,
          allocation_engine: allocationEngine,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSimulationData(data);
    } catch (err) {
      setError(err.message || 'Failed to run simulation');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Tejas Command Center: Policy Simulator
            </h1>
            <p className="text-slate-400 mt-1">Configure weights and simulate scholarship allocation outcomes</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-mono text-slate-300">Policy Engine v2026.1</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-200">Policy Weights Configuration</h2>
          </div>

          {/* Budget Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Total Master Budget (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                min="0"
                step="100000"
              />
            </div>
          </div>

          {/* Weight Sliders */}
          <div className="space-y-6">
            {/* Merit Weight */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-400">Merit Weight</label>
                <span className="text-sm font-mono text-blue-400">{meritWeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={meritWeight}
                onChange={(e) => setMeritWeight(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Income Weight */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-400">Income Weight</label>
                <span className="text-sm font-mono text-cyan-400">{incomeWeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={incomeWeight}
                onChange={(e) => setIncomeWeight(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Policy Weight */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-400">Policy Bonus Weight</label>
                <span className="text-sm font-mono text-purple-400">{policyWeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={policyWeight}
                onChange={(e) => setPolicyWeight(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* Budget Constraint Toggle */}
          <div className="mb-6 p-4 bg-slate-950 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Enable Strict Budget Constraint</p>
                <p className="text-xs text-slate-500 mt-1">
                  {useBudget 
                    ? 'Budget mode: Allocate top students first until budget exhausted'
                    : 'Relative ranking mode: Top 10% get Tier 1, next 20% get Tier 2'}
                </p>
              </div>
              <button
                onClick={() => setUseBudget(!useBudget)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  useBudget ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    useBudget ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Allocation Engine Toggle */}
          {useBudget && (
            <div className="mb-6 p-4 bg-slate-950 border border-slate-700 rounded-lg">
              <p className="text-sm font-medium text-slate-300 mb-3">Allocation Engine</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAllocationEngine('greedy')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    allocationEngine === 'greedy'
                      ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <p className={`text-sm font-semibold ${allocationEngine === 'greedy' ? 'text-blue-400' : 'text-slate-300'}`}>
                    Greedy (Default)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Top-down fill until budget hits zero
                  </p>
                </button>
                <button
                  onClick={() => setAllocationEngine('knapsack')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    allocationEngine === 'knapsack'
                      ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/20'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <p className={`text-sm font-semibold ${allocationEngine === 'knapsack' ? 'text-amber-400' : 'text-slate-300'}`}>
                    Knapsack (OR)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Maximize total cohort impact score
                  </p>
                </button>
              </div>
              <p className="text-[10px] text-slate-600 mt-2">
                {allocationEngine === 'knapsack'
                  ? '⚡ Optimization: Maximizes SUM(Score × Funding) under budget constraint'
                  : '📋 Standard: Sorts by score, allocates top-down until budget = 0'}
              </p>
            </div>
          )}
          {!isWeightValid && (
            <div className="mt-4 flex items-center gap-2 bg-amber-950/50 border border-amber-800 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-400">
                Weights must sum to exactly 1.0 (Current: {totalWeight.toFixed(2)})
              </p>
            </div>
          )}

          {isWeightValid && (
            <div className="mt-4 flex items-center gap-2 bg-emerald-950/50 border border-emerald-800 rounded-lg p-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-400">Weights sum to 1.0 - Ready to simulate</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-950/50 border border-red-800 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Run Simulation Button */}
          <button
            onClick={runSimulation}
            disabled={isLoading || !isWeightValid}
            className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/25 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                Running Simulation...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Simulation
              </>
            )}
          </button>
        </div>

        {/* Right Column - Impact Dashboard */}
        {simulationData && (
          <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-slate-400">Budget Utilized</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(simulationData.impact_summary?.budget_utilized || 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  of {formatCurrency(totalBudget)} allocated
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-slate-400">Total Students Funded</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  {simulationData.impact_summary?.students_funded || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">across all tiers</p>
              </div>
            </div>

            {/* Allocation Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Allocation Breakdown
              </h3>
              <div className="space-y-4">
                {/* Tier 1 */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-emerald-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <div>
                      <p className="font-medium text-slate-200">Tier 1 - Full Aid (100%)</p>
                      <p className="text-xs text-slate-500">Maximum scholarship allocation</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-400">
                    {simulationData.impact_summary?.tier_breakdown?.tier_1_full_aid || 0}
                  </span>
                </div>

                {/* Tier 2 */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-blue-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium text-slate-200">Tier 2 - Partial Aid (60%)</p>
                      <p className="text-xs text-slate-500">Standard scholarship allocation</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">
                    {simulationData.impact_summary?.tier_breakdown?.tier_2_partial_aid || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Fairness & Bias Audit Panel */}
            <div className={`bg-slate-900 border rounded-xl p-6 ${
              (() => {
                const audit = simulationData.fairness_audit;
                const rate = audit?.overall_selection_rate || 0;
                return rate >= 30
                  ? 'border-emerald-800 shadow-lg shadow-emerald-900/20'
                  : 'border-amber-800 shadow-lg shadow-amber-900/20';
              })()
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Shield className={`w-5 h-5 ${
                    (() => {
                      const audit = simulationData.fairness_audit;
                      const rate = audit?.overall_selection_rate || 0;
                      return rate >= 30 ? 'text-emerald-400' : 'text-amber-400';
                    })()
                  }`} />
                  Fairness & Selection Rate Audit
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  (() => {
                    const audit = simulationData.fairness_audit;
                    const rate = audit?.overall_selection_rate || 0;
                    return rate >= 30
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800';
                  })()
                }`}>
                  {(() => {
                    const audit = simulationData.fairness_audit;
                    const rate = audit?.overall_selection_rate || 0;
                    return `${rate.toFixed(1)}% Selected`;
                  })()}
                </span>
              </div>

              {simulationData.fairness_audit && (
                <div className="space-y-4">
                  {/* Overall Selection Rate */}
                  <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-slate-300">Overall Selection Rate</p>
                      <span className="text-2xl font-bold text-blue-400">
                        {(simulationData.fairness_audit.overall_selection_rate || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                        style={{ width: `${(simulationData.fairness_audit.overall_selection_rate || 0)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Percentage of applicants selected for Tier 1 or Tier 2 funding</p>
                  </div>

                  {/* Gender Selection Rates */}
                  <div className="bg-slate-950 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-pink-400" />
                      Gender Selection Rates
                    </p>
                    {(() => {
                      const genderRates = simulationData.fairness_audit.gender_selection_rate || {};
                      const genders = [
                        { key: 'Male', color: 'bg-blue-500', label: 'Male' },
                        { key: 'Female', color: 'bg-pink-500', label: 'Female' },
                        { key: 'Other', color: 'bg-purple-500', label: 'Other' },
                      ];
                      return (
                        <div className="space-y-3">
                          {genders.map(({ key, color, label }) => {
                            const rate = genderRates[key] || 0;
                            return (
                              <div key={key} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
                                  <span className="text-sm text-slate-300">{label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, rate)}%` }}></div>
                                  </div>
                                  <span className="text-sm font-mono text-slate-200 w-10 text-right">
                                    {rate.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Caste Selection Rates */}
                  <div className="bg-slate-950 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      Caste Category Selection Rates
                    </p>
                    {(() => {
                      const casteRates = simulationData.fairness_audit.caste_selection_rate || {};
                      const castes = [
                        { key: 'General', color: 'bg-emerald-500', label: 'General' },
                        { key: 'OBC', color: 'bg-cyan-500', label: 'OBC' },
                        { key: 'SC', color: 'bg-amber-500', label: 'SC' },
                        { key: 'ST', color: 'bg-rose-500', label: 'ST' },
                      ];
                      return (
                        <div className="space-y-3">
                          {castes.map(({ key, color, label }) => {
                            const rate = casteRates[key] || 0;
                            return (
                              <div key={key} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
                                  <span className="text-sm text-slate-300">{label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, rate)}%` }}></div>
                                  </div>
                                  <span className="text-sm font-mono text-slate-200 w-10 text-right">
                                    {rate.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Audit Notes */}
                  <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <strong className="text-slate-400">Fairness & Compliance:</strong> Selection rates measure what percentage 
                      of each demographic group received Tier 1 or Tier 2 funding. Compare rates across genders and castes to identify and address potential disparities.
                      {useBudget 
                        ? ' (Budget Constraint Mode: selections limited by available budget)' 
                        : ' (Relative Ranking Mode: top 10% Tier 1, next 20% Tier 2)'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!simulationData && (
          <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-900/50 border border-slate-800 rounded-xl border-dashed">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400">Configure weights and click "Run Simulation"</p>
              <p className="text-sm text-slate-600 mt-1">to view impact dashboard</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandCenter;
