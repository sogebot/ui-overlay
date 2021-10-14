import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';

import introspectionQueryResultData from '~/static/fragmentTypes.json';

const fragmentMatcher = new IntrospectionFragmentMatcher({ introspectionQueryResultData });

const cache = new InMemoryCache({ fragmentMatcher });

export default () => {
  return {
    httpEndpoint: location.origin + '/graphql',

    cache,

    /*
     * For permanent authentication provide `getAuth` function.
     * The string returned will be used in all requests as authorization header
     */
    getAuth: () => 'Bearer ' + localStorage.accessToken,
  };
};
