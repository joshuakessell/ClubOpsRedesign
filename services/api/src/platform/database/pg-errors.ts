export type PgError = {
  code?: string;
  constraint?: string;
};

export function isUniqueViolation(error: unknown): error is PgError {
  return typeof (error as PgError)?.code === 'string' && (error as PgError).code === '23505';
}
