import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema, type ZodType } from 'zod';

type ValidationSource = 'body' | 'query' | 'params';

const validateSource = (schema: ZodType, source: ValidationSource) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      schema.parse(data);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateBody = (schema: ZodType) => validateSource(schema, 'body');
export const validateQuery = (schema: ZodType) => validateSource(schema, 'query');
export const validateParams = (schema: ZodType) => validateSource(schema, 'params');

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const createSchema = {
  body: <T extends ZodType>(schema: T) => z.object({ body: schema }),
  query: <T extends ZodType>(schema: T) => z.object({ query: schema }),
  params: <T extends ZodType>(schema: T) => z.object({ params: schema }),
};

/**
 * Creates a sanitized string schema with max-length enforcement.
 * Trims whitespace, rejects empty strings after trim, and caps length.
 * Use on all user-supplied string fields to prevent oversized payloads.
 *
 * @param maxLength - Maximum string length (default 5000 chars)
 */
export const sanitizedString = (maxLength = 5000, customLabel?: string) =>
  z
    .string()
    .trim()
    .min(1, customLabel ?? 'must not be empty')
    .max(maxLength, customLabel ?? `must not exceed ${maxLength} characters`);

/**
 * Creates a URL string schema with length enforcement.
 * Use on callbackUrl, webhookUrl and similar fields.
 */
export const sanitizedUrl = z.string().trim().url().max(2048);
