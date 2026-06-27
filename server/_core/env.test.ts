import { describe, expect, it } from 'vitest';
import { getEnvValidationIssues } from './env';

describe('getEnvValidationIssues', () => {
  it('returns missing variables for a partially configured environment', () => {
    const issues = getEnvValidationIssues({
      VITE_APP_ID: 'app',
      JWT_SECRET: '',
      DATABASE_URL: '',
      OWNER_OPEN_ID: 'owner',
    });

    expect(issues).toEqual(expect.arrayContaining(['JWT_SECRET', 'DATABASE_URL']));
  });
});
