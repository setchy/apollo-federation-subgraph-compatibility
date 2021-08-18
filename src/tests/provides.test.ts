import { productsRequest } from "../utils/client";

test("@provides", async () => {
  const resp = await productsRequest({
    query: `#graphql
      query ($id: ID!) {
        product(id: $id) {
          createdBy { email totalProductsCreated }
        }
      }`,
    variables: { id: "apollo-federation" },
  });

  expect(resp).toEqual({
    data: {
      product: {
        createdBy: {
          email: "support@apollographql.com",
          totalProductsCreated: 1337,
        },
      },
    },
  });
});
