export interface TestContext {
  productsClient: (
    req: {
      query: string;
      variables?: { [key: string]: any };
      operationName?: string;
    },
    headers?: { [key: string]: string }
  ) => Promise<any>;
}
