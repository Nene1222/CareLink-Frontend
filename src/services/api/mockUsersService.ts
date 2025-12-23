import { apiClient } from './apiClient'

export interface Doctor {
  _id: string
  name: string
  role: string
  staffId?: string
}

export interface Patient {
  id: string
  name: string
  gender: 'Female' | 'Male' | 'Other'
  dateOfBirth: string
  age: number
}

export const mockUsersService = {
  async getDoctors(): Promise<Doctor[]> {
    const doctors = await apiClient.get<Doctor[]>('/doctors')
    return doctors
  },

  async getPatients(): Promise<Patient[]> {
    const patients = await apiClient.get<Patient[]>('/patients')
    return patients
  }
}

