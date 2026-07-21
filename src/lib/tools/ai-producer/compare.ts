import type { AiProducerRunRecord } from '@/lib/tools/types'

export interface RunComparison {
  previousAt: string
  currentAt: string
  previousProblems: string[] // 前回の問題
  currentProblems: string[] // 今回の問題
  improved: string[] // 改善した項目(前回あって今回消えた)
  continuing: string[] // 継続している課題(両方にある)
  nextFocus: string[] // 次に直す項目(今回の「今すぐ」上位)
}

/** 同じ曲の過去分析と今回分析を、ルールID単位で突き合わせる */
export function compareRuns(
  previous: AiProducerRunRecord,
  current: AiProducerRunRecord,
): RunComparison {
  const prevSuggestions = previous.result.suggestions
  const currSuggestions = current.result.suggestions
  const currIds = new Set(currSuggestions.map((s) => s.ruleId))
  const prevIds = new Set(prevSuggestions.map((s) => s.ruleId))

  return {
    previousAt: previous.createdAt,
    currentAt: current.createdAt,
    previousProblems: prevSuggestions.map((s) => s.problem),
    currentProblems: currSuggestions.map((s) => s.problem),
    improved: prevSuggestions.filter((s) => !currIds.has(s.ruleId)).map((s) => s.problem),
    continuing: currSuggestions.filter((s) => prevIds.has(s.ruleId)).map((s) => s.problem),
    nextFocus: currSuggestions
      .filter((s) => s.priority === 'now')
      .slice(0, 3)
      .map((s) => s.problem),
  }
}
