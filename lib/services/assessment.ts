// Assessment generation and evaluation service
export interface QuestionGenerationRequest {
  topics: string[]
  difficulty: "easy" | "medium" | "hard"
  count: number
  type: "mcq" | "coding" | "sql"
}

export interface MCQGenerationResponse {
  questions: {
    question: string
    options: string[]
    correctAnswer: number
    topic: string
    difficulty: string
  }[]
}

export interface CodingGenerationResponse {
  questions: {
    title: string
    description: string
    examples: {
      input: string
      output: string
      explanation?: string
    }[]
    constraints: string[]
    testCases: {
      input: string
      expectedOutput: string
      isHidden: boolean
    }[]
    topic: string
    difficulty: string
  }[]
}

export interface SQLGenerationResponse {
  questions: {
    question: string
    schema: string
    expectedOutput: string
    topic: string
    difficulty: string
  }[]
}

// Mock API functions - replace with actual API calls
export async function generateMCQQuestions(request: QuestionGenerationRequest): Promise<MCQGenerationResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const mockQuestions = Array.from({ length: request.count }, (_, i) => ({
    question: `What is the time complexity of binary search in a sorted array? (Question ${i + 1})`,
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    correctAnswer: 1,
    topic: request.topics[0] || "Algorithms",
    difficulty: request.difficulty,
  }))

  return { questions: mockQuestions }
}

export async function generateCodingQuestions(request: QuestionGenerationRequest): Promise<CodingGenerationResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const mockQuestions = Array.from({ length: request.count }, (_, i) => ({
    title: `Two Sum Problem ${i + 1}`,
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    testCases: [
      {
        input: "[2,7,11,15]\n9",
        expectedOutput: "[0,1]",
        isHidden: false,
      },
      {
        input: "[3,2,4]\n6",
        expectedOutput: "[1,2]",
        isHidden: true,
      },
    ],
    topic: request.topics[0] || "Arrays",
    difficulty: request.difficulty,
  }))

  return { questions: mockQuestions }
}

export async function generateSQLQuestions(request: QuestionGenerationRequest): Promise<SQLGenerationResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const mockQuestions = Array.from({ length: request.count }, (_, i) => ({
    question: `Write a SQL query to find all employees with salary greater than 50000. (Question ${i + 1})`,
    schema: `CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  salary DECIMAL(10,2),
  department VARCHAR(50)
);`,
    expectedOutput: "SELECT * FROM employees WHERE salary > 50000;",
    topic: request.topics[0] || "SQL Basics",
    difficulty: request.difficulty,
  }))

  return { questions: mockQuestions }
}

export async function evaluateCode(code: string, language: string, testCases: any[]): Promise<any> {
  // Mock code evaluation - replace with actual code execution service
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const passed = Math.floor(Math.random() * testCases.length) + 1

  return {
    passed,
    total: testCases.length,
    details: testCases.map((testCase, index) => ({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: index < passed ? testCase.expectedOutput : "Wrong output",
      passed: index < passed,
    })),
  }
}

export async function evaluateSQL(query: string, expectedResult: any): Promise<boolean> {
  // Mock SQL evaluation
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return Math.random() > 0.3 // 70% chance of being correct
}
