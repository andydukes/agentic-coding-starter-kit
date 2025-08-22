// Types aligned to docs/schemas/model.json
export type DomainCategorical = {
  type: string; // e.g., "DomainC"
  values: string[];
};

export type DomainReal = {
  type?: string; // e.g., "DomainR"
  lower: number;
  upper: number;
  discrete: boolean;
  interval?: number; // default 1
};

export type Prediction = {
  domain: DomainCategorical;
  name: string;
  question: string;
  type: string; // e.g., "Nominal"
};

export type AttributeItem = {
  domain: DomainCategorical | DomainReal;
  name: string;
  question: string;
  type: string; // e.g., "Continuous"
};

export type ModelAttributes = {
  name: string;
  description: string;
  metadata: {
    prediction: Prediction;
    attributes: AttributeItem[];
  };
  publisher: string;
  "publish-date": string;
};

export type Model = {
  id: string;
  type: string; // "model"
  modelId: string; // upstream model id
  userId: string;
  attributes: ModelAttributes;
  // Legacy fields retained in DB for migration; optional in type for compatibility
  name?: string;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};
