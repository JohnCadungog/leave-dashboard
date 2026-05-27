import { z } from 'zod'

export const leaveRequestSchema = z
  .object({
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .max(500, 'Reason must be at most 500 characters'),
  })
  .refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  })

export type LeaveRequestValues = z.infer<typeof leaveRequestSchema>
