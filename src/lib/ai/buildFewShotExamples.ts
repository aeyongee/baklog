import { prisma } from "@/lib/db";

interface FewShotExample {
  rawText: string;
  aiQuadrant: string;
  finalQuadrant: string;
}

/**
 * 사용자의 과거 교정 이력에서 Few-shot 예시를 추출
 * - 최근 30일 내 AI 분류와 사용자 최종 분류가 다른 것만
 * - 교정 패턴별 그룹핑 (예: "Q3→Q1") → 패턴당 최대 2개, 전체 최대 5개
 */
export async function buildFewShotExamples(
  userId: string,
): Promise<FewShotExample[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const feedbacks = await prisma.feedback.findMany({
    where: {
      userId,
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      task: { select: { rawText: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // AI와 사용자 최종 분류가 다른 것만 필터링
  const corrections = feedbacks.filter(
    (f) => f.aiQuadrant !== f.finalQuadrant,
  );

  // 교정 패턴별 그룹핑 (예: "Q3→Q1")
  const patternMap = new Map<string, FewShotExample[]>();
  for (const c of corrections) {
    const pattern = `${c.aiQuadrant}→${c.finalQuadrant}`;
    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, []);
    }
    const group = patternMap.get(pattern)!;
    if (group.length < 2) {
      group.push({
        rawText: c.task.rawText,
        aiQuadrant: c.aiQuadrant,
        finalQuadrant: c.finalQuadrant,
      });
    }
  }

  // 전체 최대 5개 선택
  const examples: FewShotExample[] = [];
  for (const group of patternMap.values()) {
    for (const ex of group) {
      if (examples.length >= 5) break;
      examples.push(ex);
    }
    if (examples.length >= 5) break;
  }

  return examples;
}

/**
 * Few-shot 예시를 프롬프트 텍스트로 포매팅
 */
export function formatFewShotSection(examples: FewShotExample[]): string {
  if (examples.length === 0) return "";

  const lines = examples.map(
    (ex) =>
      `- "${ex.rawText}" → AI: ${ex.aiQuadrant}, 사용자 수정: ${ex.finalQuadrant}`,
  );

  return `\n\n## 사용자 수정 이력 (참고)\n이 사용자는 과거에 아래와 같이 AI 분류를 수정했습니다. 비슷한 작업이 있으면 참고하세요.\n${lines.join("\n")}`;
}
