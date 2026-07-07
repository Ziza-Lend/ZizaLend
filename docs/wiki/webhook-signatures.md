# Webhook Signature Verification

Every outbound webhook delivery from ZizaLend includes an
`X-ZizaLend-Signature` header that allows subscribers to verify the
payload was not tampered with in transit.

## Header format

```
X-ZizaLend-Signature: sha256=<hex-encoded-hmac>
```

The value is `sha256=` followed by the lowercase hex-encoded
HMAC-SHA256 digest of the **raw request body** using the subscriber
secret that was supplied when the subscription was registered.

## Verification recipe

### Node.js

```js
import crypto from "node:crypto";

function verifySignature(secret, rawBody, signatureHeader) {
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  // Use timingSafeEqual to prevent timing attacks
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader ?? "");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Express example — YOUR_SUBSCRIPTION_SECRET is the per-subscription
// secret returned when you registered the webhook, not an env var.
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-ZizaLend-signature"];
  if (!verifySignature(YOUR_SUBSCRIPTION_SECRET, req.body, sig)) {
    return res.status(401).send("Invalid signature");
  }
  // process req.body …
  res.sendStatus(200);
});
```

### Python

```python
import hmac, hashlib

def verify_signature(secret: str, raw_body: bytes, header: str) -> bool:
    digest = "sha256=" + hmac.new(
        secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(digest, header or "")
```

## Notes

- The `Authorization: Bearer <secret>` header is also present for
  backwards compatibility with existing subscribers that have not yet
  adopted HMAC verification, but **`X-ZizaLend-Signature` is the
  authoritative integrity check**.
- Always parse the raw body bytes *before* JSON-decoding; most
  frameworks let you configure a raw-body parser for webhook routes.
- Secrets can be rotated by deleting and re-creating the subscription
  (secret rotation via the API is tracked in a separate issue).
