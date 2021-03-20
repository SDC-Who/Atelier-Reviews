module.exports = {
  extends: 'airbnb-base',
  rules: {
    'no-console': 'off',
    'prefer-destructuring': ['error', {
      array: true,
      object: true,
    }, {
      enforceForRenamedProperties: false,
    }],
    ignoreDestructuring: true,
  },
};
