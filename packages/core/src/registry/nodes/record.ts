import { z } from 'zod/v4';

import { extractNodeRole } from '@colanode/core/lib/nodes';
import { hasNodeRole } from '@colanode/core/lib/permissions';
import { richTextContentSchema } from '@colanode/core/registry/documents/rich-text';
import { NodeModel } from '@colanode/core/registry/nodes/core';
import { fieldValueSchema } from '@colanode/core/registry/nodes/field-value';

export const recordAttributesSchema = z.object({
  type: z.literal('record'),
  parentId: z.string(),
  databaseId: z.string(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  fields: z.record(z.string(), fieldValueSchema),
});

export type RecordAttributes = z.infer<typeof recordAttributesSchema>;

export const recordModel: NodeModel = {
  type: 'record',
  attributesSchema: recordAttributesSchema,
  documentSchema: richTextContentSchema,
  canCreate: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'collaborator');
  },
  canUpdateAttributes: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    if (context.node.createdBy === context.user.id) {
      return true;
    }

    return hasNodeRole(role, 'editor');
  },
  canUpdateDocument: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    if (context.node.createdBy === context.user.id) {
      return true;
    }

    return hasNodeRole(role, 'editor');
  },
  canDelete: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    if (context.node.createdBy === context.user.id) {
      return true;
    }

    return hasNodeRole(role, 'admin');
  },
  canReact: () => {
    return false;
  },
  extractText: (id, attributes) => {
    if (attributes.type !== 'record') {
      throw new Error('Invalid node type');
    }

    const texts: string[] = [];
    for (const field of Object.values(attributes.fields)) {
      if (field.type === 'string') {
        texts.push(field.value);
      }
    }

    return {
      name: attributes.name,
      attributes: texts.join('\n'),
    };
  },
  extractMentions: () => {
    return [];
  },
};
