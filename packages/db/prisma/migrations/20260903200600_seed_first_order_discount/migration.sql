INSERT INTO "DiscountCode" (
  "id",
  "code",
  "type",
  "value",
  "isActive",
  "firstOrderOnly",
  "createdAt",
  "updatedAt"
)
VALUES (
  'first_order_discount_ilk10',
  'ILK10',
  'PERCENTAGE',
  10,
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;
