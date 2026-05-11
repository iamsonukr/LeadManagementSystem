import { Types } from 'mongoose';

export const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Sales Manager',
  SALES_EXECUTIVE: 'Sales Executive',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export interface RequestUser {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export const isAdmin = (user: RequestUser) => user.role === ROLES.ADMIN;

export const isManager = (user: RequestUser) => user.role === ROLES.MANAGER;

export const isSalesExecutive = (user: RequestUser) =>
  user.role === ROLES.SALES_EXECUTIVE;

export type AssignmentKey = string | Types.ObjectId;

const assignmentKeyToString = (value: unknown) => {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
};

const uniqueStrings = (values: unknown[]) => {
  const seen = new Set<string>();

  return values
    .map((value) => assignmentKeyToString(value).trim())
    .filter((value) => {
      if (!value) {
        return false;
      }

      const key = value.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

export const toObjectId = (value: unknown): Types.ObjectId | null => {
  if (value instanceof Types.ObjectId) {
    return value;
  }

  const raw = assignmentKeyToString(value).trim();
  return Types.ObjectId.isValid(raw) ? new Types.ObjectId(raw) : null;
};

export const userObjectId = (user: RequestUser) => toObjectId(user.id);

export const userAssignmentKeys = (user: RequestUser) =>
  uniqueStrings([user.id, user.email, user.email?.toLowerCase(), user.name]);

export const userAssignmentIds = (user: RequestUser) =>
  [userObjectId(user)].filter(Boolean) as Types.ObjectId[];

export const buildAssignedToMatch = (keys: AssignmentKey[]) => {
  const objectIds: Types.ObjectId[] = [];
  const stringKeys: string[] = [];

  keys.forEach((key) => {
    if (key instanceof Types.ObjectId) {
      objectIds.push(key);
      stringKeys.push(key.toString().toLowerCase());
      return;
    }

    const normalized = assignmentKeyToString(key).trim();
    if (!normalized) {
      return;
    }

    stringKeys.push(normalized.toLowerCase());

    const objectId = toObjectId(normalized);
    if (objectId) {
      objectIds.push(objectId);
    }
  });

  const uniqueObjectIds = Array.from(
    new Map(objectIds.map((id) => [id.toString(), id])).values(),
  );
  const uniqueStringKeys = Array.from(new Set(stringKeys));
  const clauses: Record<string, unknown>[] = [];

  if (uniqueObjectIds.length) {
    clauses.push({ assignedTo: { $in: uniqueObjectIds } });
  }

  if (uniqueStringKeys.length) {
    clauses.push({
      $expr: {
        $in: [
          {
            $toLower: {
              $toString: {
                $ifNull: ['$assignedTo', ''],
              },
            },
          },
          uniqueStringKeys,
        ],
      },
    });
  }

  if (!clauses.length) {
    return { _id: { $exists: false } };
  }

  return clauses.length === 1 ? clauses[0] : { $or: clauses };
};
