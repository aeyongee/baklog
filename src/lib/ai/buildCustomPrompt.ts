export interface SurveyAnswers {
  purpose: "work" | "personal" | "mixed";
  personality: "J" | "P";
  importanceCriteria: string[];
  urgencyCriteria: string[];
  workStyle: "big_first" | "small_first" | "urgent_first";
}

const PURPOSE_CONTEXT: Record<SurveyAnswers["purpose"], string> = {
  work: `이 사용자는 업무 중심으로 사용합니다. 업무 관련 작업(회의, 보고, 프로젝트 등)의 중요도를 높게 평가하세요.`,
  personal: `이 사용자는 개인 생활 중심으로 사용합니다. 개인 성장, 건강, 취미 등 개인적 의미가 있는 작업의 중요도를 높게 평가하세요.`,
  mixed: `이 사용자는 업무와 개인 생활을 함께 관리합니다. 업무와 개인 작업 모두 균형있게 중요도를 평가하세요.`,
};

const PERSONALITY_CONTEXT: Record<SurveyAnswers["personality"], string> = {
  J: `이 사용자는 계획적 성향(J)입니다. 마감일과 일정을 엄격하게 반영하고, 계획에서 벗어나는 작업의 긴급도를 높게 평가하세요.`,
  P: `이 사용자는 유연한 성향(P)입니다. 마감일에 대해 약간 여유를 두고 평가하되, 진짜 급한 일은 확실히 구분하세요.`,
};

const IMPORTANCE_LABEL: Record<string, string> = {
  scheduled: "시간이 정해진 일정/미팅",
  work_related: "회사/업무 관련 작업",
  meaningful: "본인이 좋아하고 의미있는 일",
  impact_result: "성과/결과에 직접 영향을 주는 일",
  impact_others: "다른 사람에게 영향을 미치는 일",
};

const URGENCY_LABEL: Record<string, string> = {
  deadline_soon: "마감이 오늘/내일인 일",
  others_waiting: "다른 사람이 기다리고 있는 일",
  penalty: "안 하면 불이익이 생기는 일",
  fixed_time: "약속/미팅 시간이 정해진 일",
};

const WORK_STYLE_CONTEXT: Record<SurveyAnswers["workStyle"], string> = {
  big_first: `이 사용자는 큰 일부터 처리하는 스타일입니다. 규모가 크고 영향력 있는 작업의 중요도를 약간 높게 평가하세요.`,
  small_first: `이 사용자는 작은 일부터 처리하는 스타일입니다. 빠르게 완료 가능한 작업의 긴급도를 약간 높게 평가하세요.`,
  urgent_first: `이 사용자는 긴급한 일부터 처리하는 스타일입니다. 시간 압박이 있는 작업의 긴급도를 더 민감하게 평가하세요.`,
};

const BASE_PROMPT = `당신은 아이젠하워 매트릭스 기반 할 일 분류 전문가입니다.

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
- dateHint: "tomorrow"이면 긴급도 높게, "day_after_tomorrow"이면 약간 높게`;

const RESPONSE_RULES = `## 응답 규칙
- reason은 반드시 100자 이내 한국어로 작성
- confidence는 분류 확신도 (0.0~1.0). 모호한 입력이면 낮게
- 반드시 아래 JSON 형식으로 응답

{ "items": [ { "id": "...", "importance": 0.0, "urgency": 0.0, "quadrant": "Q1", "confidence": 0.0, "reason": "..." } ] }`;

const CATEGORY_RULES = `## 카테고리 분류
각 항목에 대해 업무(work) 또는 개인(personal) 카테고리를 판단하세요.
- work: 회사 업무, 프로젝트, 회의, 보고, 이슈 트래커 관련
- personal: 개인 생활, 건강, 취미, 가사, 자기개발

응답 JSON에 "category" 필드를 추가하세요: "work" 또는 "personal"
{ "items": [ { "id": "...", "importance": 0.0, "urgency": 0.0, "quadrant": "Q1", "confidence": 0.0, "reason": "...", "category": "work" } ] }`;

export function buildCustomPrompt(answers: SurveyAnswers): string {
  const sections: string[] = [BASE_PROMPT];

  // 사용자 맞춤 컨텍스트
  sections.push("\n## 사용자 맞춤 분류 가이드\n");
  sections.push(PURPOSE_CONTEXT[answers.purpose]);
  sections.push(PERSONALITY_CONTEXT[answers.personality]);

  // 중요도 기준
  if (answers.importanceCriteria.length > 0) {
    const labels = answers.importanceCriteria
      .map((key) => IMPORTANCE_LABEL[key])
      .filter(Boolean);
    if (labels.length > 0) {
      sections.push(
        `\n이 사용자가 중요하다고 생각하는 일: ${labels.join(", ")}. 이 기준에 해당하는 작업의 중요도를 높게 평가하세요.`,
      );
    }
  }

  // 긴급도 기준
  if (answers.urgencyCriteria.length > 0) {
    const labels = answers.urgencyCriteria
      .map((key) => URGENCY_LABEL[key])
      .filter(Boolean);
    if (labels.length > 0) {
      sections.push(
        `\n이 사용자가 긴급하다고 느끼는 일: ${labels.join(", ")}. 이 기준에 해당하는 작업의 긴급도를 높게 평가하세요.`,
      );
    }
  }

  // 업무 스타일
  sections.push("\n" + WORK_STYLE_CONTEXT[answers.workStyle]);

  // 응답 규칙
  if (answers.purpose === "mixed") {
    sections.push("\n" + CATEGORY_RULES);
  } else {
    sections.push("\n" + RESPONSE_RULES);
  }

  return sections.join("\n");
}
