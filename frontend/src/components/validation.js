import { todayIso } from '../constants.js'

/** Client-side checks that mirror the backend's validation rules. */
export function validate(values) {
  const errors = {}
  if (!values.company.trim()) errors.company = 'Company is required'
  if (!values.role.trim()) errors.role = 'Role is required'
  if (values.jobUrl && !/^https?:\/\//i.test(values.jobUrl.trim())) {
    errors.jobUrl = 'Link must start with http:// or https://'
  }
  if (values.appliedDate && values.appliedDate > todayIso()) {
    errors.appliedDate = 'Date cannot be in the future'
  }
  return errors
}
