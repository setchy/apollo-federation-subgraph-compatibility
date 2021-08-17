import { readFileSync } from "fs";
import { resolve } from "path";
import { parse, SchemaDefinitionNode, Source } from "graphql";
import { buildSubgraphSchema } from "@apollo/federation";
import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { getDiff } from "graphql-schema-diff";
import { TestContext } from "./typings";

const EXPECTED = fromFederatedSDLToValidSDL(
  readFileSync(
    resolve(__dirname, "../../implementations/_template_/products.graphql"),
    "utf-8"
  )
);

export const name = "Federated Introspection";
export const description =
  "Checks the subgraph schema returned from the _Service.sdl field.";
export async function test({ productsClient }: TestContext) {
  try {
    const introspectionResp = await productsClient({
      query: "{ _service { sdl } }",
    });

    if (typeof introspectionResp?.data?._service?.sdl !== "string") {
      return false;
    }

    const fullSchema = fromFederatedSDLToValidSDL(
      introspectionResp?.data?._service?.sdl
    );

    const diff = await getDiff(EXPECTED, fullSchema, { sortSchema: true });
    if (!diff) {
      return true;
    } else {
      console.log(diff);
      return false;
    }
  } catch (e) {
    console.log(e);
    return false;
  }
}

/**
 * Take a GraphQL SDL string intended for Apollo Federation and
 * convert it to a valid SDL while preserving Federation directives.
 */
export function fromFederatedSDLToValidSDL(sdl: string | Source) {
  const parsed = parse(sdl);
  const schema = buildSubgraphSchema(parsed);

  // @key isn't currently marked as repeatable
  const keyDirective = schema.getDirective("key");
  if (keyDirective) {
    keyDirective.isRepeatable = true;
    keyDirective.astNode = {
      ...keyDirective.astNode,
      repeatable: true,
    };
  }

  // schema applied directives are lost, but we can add them back
  const originalSchemaDirectives =
    parsed.definitions.find(
      (def): def is SchemaDefinitionNode => def.kind === "SchemaDefinition"
    )?.directives ?? [];

  schema.astNode = {
    // satisfies the type checker
    kind: "SchemaDefinition",
    operationTypes: [],

    ...(schema.astNode ?? {}),
    directives: [
      ...(schema.astNode?.directives ?? []),
      ...originalSchemaDirectives,
    ],
  };

  return printSchemaWithDirectives(schema);
}
