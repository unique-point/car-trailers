PRAGMA foreign_keys = ON;
CREATE TABLE catalogue (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, body TEXT NOT NULL CHECK(json_valid(body)), updated_at INTEGER NOT NULL);
CREATE TABLE inventory (product_id TEXT PRIMARY KEY, available INTEGER CHECK(available IS NULL OR available>=0));
CREATE TABLE orders (id TEXT PRIMARY KEY, request_key TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, token_hash TEXT NOT NULL, email TEXT NOT NULL, snapshot TEXT NOT NULL CHECK(json_valid(snapshot)), total_cents INTEGER NOT NULL CHECK(total_cents>0), due_cents INTEGER NOT NULL CHECK(due_cents>0), paid_cents INTEGER NOT NULL DEFAULT 0, refunded_cents INTEGER NOT NULL DEFAULT 0, payment_status TEXT NOT NULL DEFAULT 'awaiting_payment', fulfilment_status TEXT NOT NULL DEFAULT 'awaiting_confirmation', reservation_state TEXT NOT NULL DEFAULT 'held' CHECK(reservation_state IN ('held','captured','released')), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE order_lines (order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL REFERENCES inventory(product_id), quantity INTEGER NOT NULL CHECK(quantity>0), revision INTEGER NOT NULL, PRIMARY KEY(order_id,product_id));
CREATE TRIGGER reserve_stock BEFORE INSERT ON order_lines BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM catalogue WHERE id=NEW.product_id AND revision=NEW.revision AND json_extract(body,'$.enabled')=1) THEN RAISE(ABORT,'stale_catalogue') END;
 SELECT CASE WHEN (SELECT available FROM inventory WHERE product_id=NEW.product_id) < NEW.quantity THEN RAISE(ABORT,'insufficient_stock') END;
 UPDATE inventory SET available=available-NEW.quantity WHERE product_id=NEW.product_id AND available IS NOT NULL;
END;
CREATE TRIGGER release_stock AFTER UPDATE OF reservation_state ON orders WHEN OLD.reservation_state='held' AND NEW.reservation_state='released' BEGIN
 UPDATE inventory SET available=available+(SELECT quantity FROM order_lines WHERE order_id=NEW.id AND product_id=inventory.product_id) WHERE available IS NOT NULL AND product_id IN (SELECT product_id FROM order_lines WHERE order_id=NEW.id);
END;
CREATE TABLE checkouts (id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),kind TEXT NOT NULL CHECK(kind IN ('initial','balance')),amount_cents INTEGER NOT NULL CHECK(amount_cents>0),session_id TEXT UNIQUE,payment_intent TEXT UNIQUE,status TEXT NOT NULL DEFAULT 'creating',created_at INTEGER NOT NULL,UNIQUE(order_id,kind));
CREATE TABLE payment_events (id TEXT PRIMARY KEY,type TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE refunds (id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),checkout_id TEXT NOT NULL REFERENCES checkouts(id),amount_cents INTEGER NOT NULL CHECK(amount_cents>0),reason TEXT NOT NULL,actor TEXT NOT NULL,status TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE quotes (id TEXT PRIMARY KEY,body TEXT NOT NULL CHECK(json_valid(body)),status TEXT NOT NULL DEFAULT 'new',created_at INTEGER NOT NULL);
CREATE TABLE audit_log (id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,detail TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE outbox (id TEXT PRIMARY KEY,kind TEXT NOT NULL,target TEXT NOT NULL,body TEXT NOT NULL CHECK(json_valid(body)),state TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,locked_until INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
CREATE TABLE rate_limits (id TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE INDEX idx_checkouts_status_created ON checkouts(status,created_at);
CREATE INDEX idx_quotes_created ON quotes(created_at);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_outbox_state_lock ON outbox(state,locked_until);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_rates_expiry ON rate_limits(expires_at);
CREATE TRIGGER catalogue_revision BEFORE UPDATE ON catalogue WHEN NEW.revision!=OLD.revision+1 BEGIN SELECT RAISE(ABORT,'stale_catalogue_revision'); END;
CREATE TRIGGER paid_total_limit BEFORE UPDATE OF paid_cents ON orders WHEN NEW.paid_cents>NEW.total_cents BEGIN SELECT RAISE(ABORT,'payment_exceeds_contract'); END;
