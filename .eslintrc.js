module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'no-explicit-any': 'error',
    'no-unused-vars': 'error',
    'import/order': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'consistent-type-imports': 'error',
  },
};
