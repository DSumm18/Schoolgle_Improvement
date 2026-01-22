"use client"

interface RiskAssessmentMatrixProps {
    selectedImpact?: number
    selectedLikelihood?: number
    // Alternative prop names for compatibility
    riskImpact?: number
    riskLikelihood?: number
    // Interactive mode props
    onRiskImpactChange?: (impact: number) => void
    onRiskLikelihoodChange?: (likelihood: number) => void
    riskScore?: number
}

export function RiskAssessmentMatrix({
    selectedImpact,
    selectedLikelihood,
    riskImpact,
    riskLikelihood,
    onRiskImpactChange,
    onRiskLikelihoodChange,
    riskScore
}: RiskAssessmentMatrixProps) {
    // Support both prop naming conventions
    const currentImpact = riskImpact ?? selectedImpact ?? 0
    const currentLikelihood = riskLikelihood ?? selectedLikelihood ?? 0
    const isInteractive = !!(onRiskImpactChange && onRiskLikelihoodChange)

    // Matrix cell colors
    const getCellColor = (impact: number, likelihood: number) => {
        const score = impact * likelihood

        if (score >= 15) {
            return "bg-red-500 text-white" // Critical
        } else if (score >= 10) {
            return "bg-orange-500 text-white" // High
        } else if (score >= 5) {
            return "bg-yellow-500 text-black" // Medium
        } else {
            return "bg-green-500 text-white" // Low
        }
    }

    // Check if this is the selected cell
    const isSelectedCell = (impact: number, likelihood: number) => {
        return impact === currentImpact && likelihood === currentLikelihood
    }

    const handleCellClick = (impact: number, likelihood: number) => {
        if (isInteractive) {
            onRiskImpactChange?.(impact)
            onRiskLikelihoodChange?.(likelihood)
        }
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
                <thead>
                    <tr>
                        <th className="border p-2 bg-muted/50 w-24"></th>
                        <th colSpan={5} className="border p-2 bg-muted/50 text-center">
                            Likelihood
                        </th>
                    </tr>
                    <tr>
                        <th className="border p-2 bg-muted/50">Impact</th>
                        <th className="border p-2 bg-muted/50 text-center w-16 text-[10px] leading-tight">
                            1<br />
                            Rare
                        </th>
                        <th className="border p-2 bg-muted/50 text-center w-16 text-[10px] leading-tight">
                            2<br />
                            Unlikely
                        </th>
                        <th className="border p-2 bg-muted/50 text-center w-16 text-[10px] leading-tight">
                            3<br />
                            Possible
                        </th>
                        <th className="border p-2 bg-muted/50 text-center w-16 text-[10px] leading-tight">
                            4<br />
                            Likely
                        </th>
                        <th className="border p-2 bg-muted/50 text-center w-16 text-[10px] leading-tight">
                            5<br />
                            Almost Certain
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {[5, 4, 3, 2, 1].map((impact) => (
                        <tr key={impact}>
                            <td className="border p-2 bg-muted/50 font-medium text-center text-[10px]">
                                {impact}{" "}
                                {impact === 5
                                    ? "(Severe)"
                                    : impact === 4
                                        ? "(Major)"
                                        : impact === 3
                                            ? "(Moderate)"
                                            : impact === 2
                                                ? "(Minor)"
                                                : "(Minimal)"}
                            </td>
                            {[1, 2, 3, 4, 5].map((likelihood) => {
                                const score = impact * likelihood
                                return (
                                    <td
                                        key={`${impact}-${likelihood}`}
                                        onClick={() => handleCellClick(impact, likelihood)}
                                        className={`border p-2 text-center text-sm ${getCellColor(impact, likelihood)} ${isSelectedCell(impact, likelihood) ? "ring-2 ring-black dark:ring-white" : ""} ${isInteractive ? "cursor-pointer hover:opacity-80" : ""}`}
                                    >
                                        {score}
                                        {isSelectedCell(impact, likelihood) && <span className="ml-1">★</span>}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex justify-between mt-4 text-[10px]">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500"></div>
                    <span>Low (1-4)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500"></div>
                    <span>Medium (5-9)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500"></div>
                    <span>High (10-14)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500"></div>
                    <span>Critical (15-25)</span>
                </div>
            </div>
        </div>
    )
}
