import { logger, LogTag } from '../../utils/logger';

describe('Logger', () => {
  it('should log without crashing', () => {
    expect(() => logger.info(LogTag.AUTH, 'test')).not.toThrow();
  });
});
