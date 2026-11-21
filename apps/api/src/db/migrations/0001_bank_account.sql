ALTER TABLE businesses ADD COLUMN bankAlias TEXT;
ALTER TABLE businesses ADD COLUMN bankHolderName TEXT;
ALTER TABLE businesses ADD COLUMN bankHolderType TEXT CHECK (bankHolderType IN ('person', 'company'));
ALTER TABLE businesses ADD COLUMN clabeLast4 TEXT;
ALTER TABLE businesses ADD COLUMN bankAccountStatus TEXT NOT NULL DEFAULT 'none'
  CHECK (bankAccountStatus IN ('none', 'pending', 'active', 'rejected'));
