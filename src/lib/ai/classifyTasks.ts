import { openai, OPENAI_MODEL } from "./openai";
import type { ParsedTask } from "@/lib/parseTaskText";
import type { Quadrant } from "@prisma/client";

export interface ClassifyInput {
  id: string;
  rawText: string;
  parsed: ParsedTask | null;
}

export interface ClassifyResult {
  id: string;
  importance: number;
  urgency: number;
  quadrant: Quadrant;
  confidence: number;
  reason: string;
}

export const SYSTEM_PROMPT = `당신은 아이젠하워 매트릭스 기반 할 일 분류 전문가입니다.

사용자가 입력한 할 일 목록을 분석하여 각 항목의 중요도(importance)와 긴급도(urgency)를 판단하세요.

## 분류 기준

중요도(importance): 장기적 목표 달성, 성장, 핵심 업무에 대한 기여도
- 높음(0.7~1.0): 핵심 업무, 커리어/건강/재정에 직접 영향
- 중간(0.4~0.6): 유용하지만 핵심은 아닌 업무
- 낮음(0.0~0.3): 단순 작업, 대체 가능한 일

긴급도(urgency): 시간적 압박, 마감 임박 여부
- 높음(0.7~1.0): 오늘/내일 마감, 즉시 처리 필요
- 중간(0.4~0.6): 이번 주 내 처리, 약간의 여유
- 낮음(0.0~0.3): 마감 없음, 언제든 가능

## 사분면 매핑
- Q1: importance >= 0.5 AND urgency >= 0.5
- Q2: importance >= 0.5 AND urgency < 0.5
- Q3: importance < 0.5 AND urgency >= 0.5
- Q4: importance < 0.5 AND urgency < 0.5

## parsed 필드 활용
- durationMinutes: 소요 시간 힌트
- issueKey: 업무 이슈 트래커 키 (있으면 업무 관련일 가능성 높음)
- dateHint: "tomorrow"이면 긴급도 높게, "day_after_tomorrow"이면 약간 높게

## 응답 규칙
- reason은 반드시 100자 이내 한국어로 작성
- confidence는 분류 확신도 (0.0~1.0). 모호한 입력이면 낮게
- 반드시 아래 JSON 형식으로 응답

{ "items": [ { "id": "...", "importance": 0.0, "urgency": 0.0, "quadrant": "Q1", "confidence": 0.0, "reason": "..." } ] }`;

export async function classifyTasks(
  tasks: ClassifyInput[],
  customPrompt?: string | null,
): Promise<ClassifyResult[]> {
  if (tasks.length === 0) return [];

  const userContent = JSON.stringify(
    tasks.map((t) => ({ id: t.id, rawText: t.rawText, parsed: t.parsed })),
  );

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: customPrompt || SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response");

  const json = JSON.parse(content) as { items?: unknown[] };
  if (!json.items || !Array.isArray(json.items)) {
    throw new Error("OpenAI response missing items array");
  }

  const VALID_QUADRANTS = new Set(["Q1", "Q2", "Q3", "Q4"]);
  const taskIds = new Set(tasks.map((t) => t.id));

  return json.items.map((raw: unknown) => {
    const item = raw as Record<string, unknown>;
    const id = String(item.id);
    if (!taskIds.has(id)) {
      throw new Error(`Unknown task id in response: ${id}`);
    }

    const importance = clamp(Number(item.importance));
    const urgency = clamp(Number(item.urgency));

    let quadrant = String(item.quadrant);
    if (!VALID_QUADRANTS.has(quadrant)) {
      // 자동 보정
      quadrant =
        importance >= 0.5
          ? urgency >= 0.5
            ? "Q1"
            : "Q2"
          : urgency >= 0.5
            ? "Q3"
            : "Q4";
    }

    return {
      id,
      importance,
      urgency,
      quadrant: quadrant as Quadrant,
      confidence: clamp(Number(item.confidence)),
      reason: String(item.reason ?? "").slice(0, 100),
    };
  });
}

function clamp(value: number, min = 0, max = 1): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(max, Math.max(min, value));
}
