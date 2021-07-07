export const state = () => ({
  isUILoaded:       false,
  configuration:    null,
});

export const mutations = {
  setConfiguration (storeState: { configuration: any; }, configuration: any) {
    storeState.configuration = configuration;
  },
  setUILoaded (storeState: { isUILoaded: boolean; }) {
    storeState.isUILoaded = true;
  },
  setLoadingMsg () {
    // stub function
  },
};
