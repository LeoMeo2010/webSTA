export type Role = 'admin' | 'student'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type SubmissionStatus = 'pending' | 'graded'

export interface Profile {
  id: string
  full_name: string
  role: Role
  created_at: string
}

export interface Criterion {
  id: string
  exercise_id: string
  label: string      // es. "Correttezza logica"
  max_points: number // es. 10
  order: number
}

export interface Exercise {
  id: string
  created_by: string
  title: string
  description: string
  test_file_url: string | null
  difficulty: Difficulty
  is_published: boolean
  deadline: string | null
  created_at: string
  criteria?: Criterion[]
}

export interface Submission {
  id: string
  exercise_id: string
  student_id: string
  main_code: string
  test_code: string
  status: SubmissionStatus
  submitted_at: string
  exercise?: Exercise
  student?: Profile
  grade?: Grade
}

export interface CriterionGrade {
  id: string
  grade_id: string
  criterion_id: string
  points: number
  criterion?: Criterion
}

export interface Grade {
  id: string
  submission_id: string
  graded_by: string
  total_score: number
  comment: string
  graded_at: string
  criterion_grades?: CriterionGrade[]
}
