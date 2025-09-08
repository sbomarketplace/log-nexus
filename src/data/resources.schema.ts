import { z } from "zod";

export const ActionSchema = z.object({
  kind: z.enum(["link","phone","email"]),
  label: z.string(),            // e.g., "Website", "Phone", "Email Support", "File a Complaint"
  value: z.string(),            // URL: https://..., tel:+1..., mailto:...
});

export const ResourceItemSchema = z.object({
  id: z.string(),               // kebab-case stable id e.g., "naacp"
  title: z.string(),
  tag: z.string(),              // pill text e.g., "Civil Rights Organization"
  description: z.string(),
  purpose: z.string().optional(),
  actions: z.array(ActionSchema).min(1),
});

export const ResourceGroupSchema = z.object({
  id: z.string(),               // kebab-case e.g., "civil-rights-advocacy"
  title: z.string(),            // e.g., "Civil Rights & Advocacy"
  items: z.array(ResourceItemSchema).min(1),
});

export const ResourcesSchema = z.array(ResourceGroupSchema).min(1);
export type ResourcesData = z.infer<typeof ResourcesSchema>;