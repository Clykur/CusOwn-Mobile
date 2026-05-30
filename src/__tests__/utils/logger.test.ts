import { logger } from '../../utils/logger';

describe('Logger', () => {
  it('should log without crashing', () => {
    expect(() => logger.info('test')).not.toThrow();
  });
});
