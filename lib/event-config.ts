export const EVENT_NAME = "KENYATTA UNIVERSITY ORCHESTRA";
export const EVENT_VENUE = "CHINA SQUARE AUDITORIUM";

/** M-Pesa till number shown on tickets; override with MPESA_TILL_NUMBER in .env */
export const TILL_NUMBER =
  process.env.MPESA_TILL_NUMBER?.trim() || "INSERT_TILL_NUMBER";
