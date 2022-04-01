module.exports = {
  extends: ['stylelint-config-recommended-vue', 'stylelint-config-standard-scss', 'stylelint-config-html/vue'],
  // add your custom config here
  // https://stylelint.io/user-guide/configuration
  rules:   {
    'selector-class-pattern':    null,
    'property-no-vendor-prefix': null,
    'at-rule-no-vendor-prefix':  null,
    'value-no-vendor-prefix':    null,
    'max-line-length':           null,
  },
};
