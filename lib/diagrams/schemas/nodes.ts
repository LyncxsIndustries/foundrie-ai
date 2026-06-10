import { z } from "zod";

// Base node data schema
export const BaseNodeDataSchema = z.object({
  label: z.string(),
});

// UML nodes
export const ClassNodeDataSchema = BaseNodeDataSchema.extend({
  attributes: z.array(z.string()).optional(),
  methods: z.array(z.string()).optional(),
  stereotype: z.enum(["class", "interface", "abstract"]).optional(),
});

// C4 nodes
export const C4NodeDataSchema = BaseNodeDataSchema.extend({
  description: z.string().optional(),
  technology: z.string().optional(),
  type: z.enum(["person", "system", "container", "database", "external"]),
});

// Sequence nodes
export const SequenceNodeDataSchema = BaseNodeDataSchema.extend({
  type: z.enum(["lifeline", "activation", "actor", "fragment"]),
  fragmentType: z.enum(["alt", "opt", "loop", "par"]).optional(),
});

// ER nodes
export const ERNodeDataSchema = BaseNodeDataSchema.extend({
  type: z.enum(["entity", "weak-entity", "attribute", "relationship"]),
  attributes: z.array(z.string()).optional(),
  primaryKey: z.string().optional(),
});

// Infrastructure nodes
export const InfrastructureNodeDataSchema = BaseNodeDataSchema.extend({
  type: z.enum([
    "microservice",
    "gateway",
    "message-bus",
    "database",
    "load-balancer",
    "cache",
  ]),
  instances: z.number().optional(),
  technology: z.string().optional(),
});

// Export union type
export type ClassNodeData = z.infer<typeof ClassNodeDataSchema>;
export type C4NodeData = z.infer<typeof C4NodeDataSchema>;
export type SequenceNodeData = z.infer<typeof SequenceNodeDataSchema>;
export type ERNodeData = z.infer<typeof ERNodeDataSchema>;
export type InfrastructureNodeData = z.infer<typeof InfrastructureNodeDataSchema>;
