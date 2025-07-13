import type { PrepStep } from '@/types'
import { GoogleGenAI } from '@google/genai'

let genai: GoogleGenAI | null = null

// Initialize Gemini AI client
function initializeAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (apiKey && !genai) {
    try {
      genai = new GoogleGenAI({ apiKey })
      console.log('✅ Gemini AI initialized')
    } catch (error) {
      console.error('⚠️ Gemini AI init failed:', error)
    }
  }
}

export async function generatePrepSteps(
  title: string,
  dueDate: string,
  category: string
): Promise<PrepStep[]> {
  // Initialize AI if not already done
  initializeAI()

  // Default fallback steps
  const defaultSteps: PrepStep[] = [
    { title: 'Gather materials needed', offsetMinutes: -60, completed: false },
    { title: 'Set up workspace & environment', offsetMinutes: -30, completed: false },
    { title: 'Final review & preparation', offsetMinutes: -15, completed: false },
  ]

  // Category-specific defaults
  if (category === 'work') {
    return [
      { title: 'Review project requirements', offsetMinutes: -90, completed: false },
      { title: 'Prepare workspace and tools', offsetMinutes: -45, completed: false },
      { title: 'Set focus timer and minimize distractions', offsetMinutes: -15, completed: false },
    ]
  } else if (category === 'health') {
    return [
      { title: 'Prepare workout clothes/equipment', offsetMinutes: -30, completed: false },
      { title: 'Set up water and snacks', offsetMinutes: -15, completed: false },
      { title: 'Do quick warm-up or stretches', offsetMinutes: -5, completed: false },
    ]
  }

  // Try AI generation if available
  if (genai) {
    try {
      const prompt = `You are an ADHD productivity coach. Generate 2-3 preparation steps for this task:
      
Title: ${title}
Due: ${dueDate}
Category: ${category}

Return ONLY a JSON array of objects with this format:
[{"title":"Step description","offsetMinutes":-60,"completed":false}]

Make steps ADHD-friendly: specific, actionable, with appropriate time offsets before the task.`

      const response = await genai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      })
      
      const text = response.text?.trim() || ''
      
      // Try to parse the JSON response
      const aiSteps = JSON.parse(text)
      if (Array.isArray(aiSteps) && aiSteps.length > 0) {
        return aiSteps.map(step => ({
          title: step.title,
          offsetMinutes: step.offsetMinutes || step.offset_minutes || -30,
          completed: false
        }))
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    }
  }

  return defaultSteps
}