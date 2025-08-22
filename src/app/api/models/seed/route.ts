import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  model,
  endpointDefinitions,
  endpointOperations,
  attributeDefinitions,
  responses,
} from "@/lib/schema";
import type { AttributeItem } from "@/lib/types";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const samples = [
    (() => {
      const attributes = {
        name: "Server Alarm V2 - Reduce Load true or false",
        description:
          "Disk temperature warning - take permeative action based on server room environment, HVAC status and ventilation speed, outside temperature and forecast high for the day.",
        metadata: {
          prediction: {
            domain: {
              type: "DomainC",
              values: ["true", "false"],
            },
            name: "INPUTVAR0",
            question: "Should we reduce server load?",
            type: "Nominal",
          },
          attributes: [
            {
              domain: {
                type: "DomainR",
                lower: 0,
                upper: 100,
                discrete: false,
                interval: 1,
              },
              name: "INPUTVAR1",
              question: "How old are you?",
              type: "Continuous",
            },
            {
              domain: {
                type: "DomainC",
                values: ["on", "off"],
              },
              name: "INPUTVAR2",
              question: "Is HVAC on?",
              type: "Nominal",
            },
          ],
        },
        publisher: "Model Publisher",
        "publish-date": "2024-01-01",
      } as const;
      return {
        id: crypto.randomUUID(),
        userId,
        type: "model",
        modelId: "64b5fb610a0b7a621acb1e4b",
        attributes,
        // legacy fields populated for compatibility with existing DB columns
        name: attributes.name,
        description: attributes.description,
      };
    })(),
    (() => {
      const attributes = {
        name: "Churn Predictor",
        description: "Predicts likelihood of user churn based on activity and tenure.",
        metadata: {
          prediction: {
            domain: {
              type: "DomainC",
              values: ["churn", "retain"],
            },
            name: "PREDICT_CHURN",
            question: "Will the user churn?",
            type: "Nominal",
          },
          attributes: [
            {
              domain: {
                type: "DomainR",
                lower: 0,
                upper: 3650,
                discrete: false,
                interval: 1,
              },
              name: "TENURE_DAYS",
              question: "How many days since signup?",
              type: "Continuous",
            },
            {
              domain: {
                type: "DomainC",
                values: ["low", "medium", "high"],
              },
              name: "ENGAGEMENT",
              question: "Engagement level?",
              type: "Ordinal",
            },
          ],
        },
        publisher: "Model Publisher",
        "publish-date": "2024-03-15",
      } as const;
      return {
        id: crypto.randomUUID(),
        userId,
        type: "model",
        modelId: "64b5fb610a0b7a621acb1e4c",
        attributes,
        name: attributes.name,
        description: attributes.description,
      };
    })(),
    (() => {
      const attributes = {
        name: "Fraud Detector",
        description: "Flags anomalous transactions using rules and statistical features.",
        metadata: {
          prediction: {
            domain: {
              type: "DomainC",
              values: ["fraud", "legit"],
            },
            name: "PREDICT_FRAUD",
            question: "Is this transaction fraudulent?",
            type: "Nominal",
          },
          attributes: [
            {
              domain: {
                type: "DomainR",
                lower: 0,
                upper: 100000,
                discrete: false,
                interval: 0.01,
              },
              name: "AMOUNT",
              question: "Transaction amount?",
              type: "Continuous",
            },
            {
              domain: {
                type: "DomainC",
                values: ["domestic", "international"],
              },
              name: "ORIGIN",
              question: "Transaction origin?",
              type: "Nominal",
            },
          ],
        },
        publisher: "Model Publisher",
        "publish-date": "2024-05-20",
      } as const;
      return {
        id: crypto.randomUUID(),
        userId,
        type: "model",
        modelId: "64b5fb610a0b7a621acb1e4d",
        attributes,
        name: attributes.name,
        description: attributes.description,
      };
    })(),
  ];

  try {
    // Seed models
    await db.insert(model).values(samples).onConflictDoNothing();

    // Seed endpoint definitions and operations
    const epId = crypto.randomUUID();
    const opId = crypto.randomUUID();
    await db
      .insert(endpointDefinitions)
      .values({
        id: epId,
        name: "OpenAI Chat Completions",
        provider: "openai",
        baseUrlTemplate: "https://api.openai.com",
        authRef: "OPENAI_API_KEY", // resolved by server-side secret manager
        defaultHeaders: { "content-type": "application/json" },
      })
      .onConflictDoNothing();

    await db
      .insert(endpointOperations)
      .values({
        id: opId,
        endpointDefinitionId: epId,
        operationName: "chat.completions",
        httpMethod: "POST",
        pathTemplate: "/v1/chat/completions",
        requestSchema: {
          type: "object",
          properties: {
            model: { type: "string" },
            messages: { type: "array" },
            temperature: { type: "number" },
          },
        },
        responseSchema: {
          type: "object",
          properties: { id: { type: "string" }, choices: { type: "array" } },
        },
        options: { defaultModel: "gpt-4o-mini", timeoutMs: 20000 },
      })
      .onConflictDoNothing();

    // Create attribute_definitions from the embedded JSON attributes for each model
    const attrRows = samples.flatMap((m) => {
      const attrsRO = (m.attributes as {
        metadata: { attributes: ReadonlyArray<AttributeItem> };
      }).metadata.attributes;
      const attrs = Array.from(attrsRO);
      return attrs.map((a, idx) => ({
        id: crypto.randomUUID(),
        modelId: m.id,
        name: a.name,
        question: a.question,
        type: a.type,
        domain: a.domain,
        // Link first attribute of first model to the OpenAI op as an example
        endpointDefinitionId:
          m.modelId === "64b5fb610a0b7a621acb1e4b" && idx === 0 ? epId : null,
        operationId:
          m.modelId === "64b5fb610a0b7a621acb1e4b" && idx === 0 ? opId : null,
        execBaseUrl:
          m.modelId === "64b5fb610a0b7a621acb1e4b" && idx === 0
            ? "https://api.openai.com"
            : null,
        execPathParams: null,
        execQueryParams: null,
      }));
    });

    await db.insert(attributeDefinitions).values(attrRows).onConflictDoNothing();

    // Insert a sample response for the linked attribute
    const linkedAttr = attrRows.find((r) => r.operationId === opId);
    if (linkedAttr) {
      await db.insert(responses).values({
        id: crypto.randomUUID(),
        attributeDefinitionId: linkedAttr.id,
        endpointDefinitionId: epId,
        operationId: opId,
        requestUrl: "https://api.openai.com/v1/chat/completions",
        requestHeaders: { "content-type": "application/json" },
        requestQuery: null,
        requestBody: {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Hello" }],
          temperature: 0.2,
        },
        responseStatus: 200,
        responseHeaders: { "content-type": "application/json" },
        responseBody: { id: "mock", choices: [{ message: { content: "Hi" } }] },
        error: null,
        latencyMs: 123,
        tokensIn: 5,
        tokensOut: 3,
        cost: "0.0001",
      });
    }

    return Response.json({
      modelsInserted: samples.length,
      endpointDefinitionsInserted: 1,
      endpointOperationsInserted: 1,
      attributeDefinitionsInserted: attrRows.length,
      sampleResponseInserted: Boolean(linkedAttr),
    });
  } catch (err) {
    console.error("POST /api/models/seed error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
