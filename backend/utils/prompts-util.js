export const questionAnswerPrompt = (
  role,
  experience,
  topicsToFocus,
  numberOfQuestions,
  jobDescription,
) => {
  const context = jobDescription
    ? `The user has provided this job description to tailor questions to:\n---\n${jobDescription}\n---`
    : `- Role: ${role}\n- Topics to focus on: ${topicsToFocus || "general topics for this role"}`;

  return `You are a senior engineer conducting a technical interview.

Generate exactly ${numberOfQuestions} interview questions for the following profile:
- Experience: ${experience} years
${context}

Rules for each question:
1. The "answer" field must be well-structured using markdown:
   - Use **bold** for key terms
   - Use bullet points or numbered lists where appropriate
   - Add a short \`\`\`js ... \`\`\` code block when relevant (keep it under 10 lines)
   - Break the answer into short paragraphs — never one wall of text
2. Answers should be beginner-friendly but technically accurate.
3. Difficulty should match ${experience} years of experience.
4. The "difficulty" field must be exactly one of: "easy", "medium", or "hard".
   - easy: conceptual or definitional questions
   - medium: applied or design questions
   - hard: system design, optimization, or deep internals

Return ONLY a valid JSON array. No extra text, no markdown wrapper around the JSON.

[
  {
    "question": "...",
    "answer": "**Definition:** ...\\n\\n**Key points:**\\n- Point 1\\n- Point 2\\n\\n\`\`\`js\\n// example\\n\`\`\`",
    "difficulty": "medium"
  }
]`;
};

export const conceptExplainPrompt = (question) => {
  return `You are a senior developer explaining a concept to a junior developer.

Explain the following interview question in depth:
"${question}"

Structure your explanation like this:
1. Start with a **one-line definition** in bold.
2. Explain the concept in 2–3 short paragraphs.
3. Use bullet points for any list of features, pros/cons, or steps.
4. If relevant, include a small code example (under 10 lines) in a \`\`\`js block.
5. End with a **"Key Takeaway"** line summarizing the concept in one sentence.

Return ONLY a valid JSON object in this exact shape. No extra text outside the JSON:

{
  "title": "Short, clear concept title (5 words max)",
  "explanation": "**Definition:** ...\\n\\n Paragraph...\\n\\n**Key Takeaway:** ..."
}`;
};

// Phase 4 — AI Answer Evaluation
/*export const evaluateAnswerPrompt = (question, expectedAnswer, userAnswer) => {
  return `You are a senior technical interviewer evaluating a candidate's answer.

Question: "${question}"

Expected/Model Answer (for reference):
${expectedAnswer}

Candidate's Answer:
${userAnswer}

Evaluate the candidate's answer strictly and fairly. Return ONLY a valid JSON object:

{
  "score": <integer 0–10>,
  "verdict": "<one of: Excellent | Good | Needs Improvement | Insufficient>",
  "strengths": ["<what they got right>", "..."],
  "gaps": ["<what was missing or wrong>", "..."],
  "suggestion": "<one actionable tip to improve their answer in 1-2 sentences>"
}`;
};
*/

// Phase 4 — AI Answer Evaluation
export const evaluateAnswerPrompt = (question, expectedAnswer, userAnswer) => {
  return `
You are a strict but fair senior technical interviewer.

Evaluate the candidate's answer.

Question:
${question}

Reference Answer:
${expectedAnswer}

Candidate Answer:
${userAnswer}

Rules:
- Be strict but fair
- Focus on correctness, clarity, and completeness
- Do NOT include markdown, explanations, or extra text

Return ONLY valid JSON in this exact format:

{
  "score": 0-10,
  "feedback": "max 2 lines explaining performance",
  "improvement": "one clear actionable improvement"
}
`;
};

// Phase 4 — Interview Simulation final feedback
export const simulationFeedbackPrompt = (role, results) => {
  const summary = results.map((r, i) =>
    `Q${i + 1}: "${r.question}"\nScore: ${r.score}/10\nVerdict: ${r.verdict}`
  ).join("\n\n");

  return `You are a senior interviewer providing end-of-interview feedback.

Role: ${role}
Interview Results:
${summary}

Overall scores: ${results.map(r => r.score).join(", ")}
Average: ${(results.reduce((a, r) => a + r.score, 0) / results.length).toFixed(1)}/10

Give a concise, honest, encouraging final assessment. Return ONLY a valid JSON object:

{
  "overallScore": <average as number, 1 decimal>,
  "grade": "<A / B / C / D / F>",
  "headline": "<one punchy sentence summary of performance>",
  "topStrengths": ["<strength 1>", "<strength 2>"],
  "areasToImprove": ["<area 1>", "<area 2>"],
  "finalAdvice": "<2–3 sentences of actionable next steps for this candidate>"
}`;
};

export const regenerateQuestionPrompt = (role, experience, topicsToFocus, existingQuestions) => {
  return `You are a senior engineer conducting a technical interview.

Generate 1 NEW interview question for:
- Role: ${role}
- Experience: ${experience} years
- Topics to focus on: ${topicsToFocus || "general topics for this role"}

Do NOT repeat any of these existing questions:
${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Rules:
1. The "answer" field must use markdown formatting with bold, bullets, and a code block if relevant.
2. The "difficulty" must be exactly one of: "easy", "medium", or "hard".

Return ONLY a valid JSON object (not an array):

{
  "question": "...",
  "answer": "...",
  "difficulty": "medium"
}`;
};
