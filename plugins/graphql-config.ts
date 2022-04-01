export default function ({ $graphql }: any) {
  $graphql.default.setHeader('authorization', 'Bearer ' + localStorage.accessToken);

  setInterval(() => {
    $graphql.default.setHeader('authorization', 'Bearer ' + localStorage.accessToken);
  }, 1000);
}
