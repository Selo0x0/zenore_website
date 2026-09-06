-- Existing member orders remain accessible through their account. Existing
-- guest orders intentionally require admin support because their original
-- browser sessions predate guest access tokens and cannot be backfilled.
ALTER TABLE "Order"
ADD COLUMN "guestAccessTokenHash" TEXT,
ADD COLUMN "paymentIframeToken" TEXT;
