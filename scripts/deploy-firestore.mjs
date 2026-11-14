// Deploys firestore.rules and firestore.indexes.json straight through the Firebase Rules
// and Firestore Admin REST APIs. Used by .github/workflows/firestore-deploy.yml instead of
// `firebase deploy`, which first asks the Service Usage API whether Firestore is enabled
// and so needs an extra permission this project's deploy account does not get.
//
// Needs: GOOGLE_APPLICATION_CREDENTIALS (service account JSON path), PROJECT_ID.
// Roles: Firebase Rules Admin, Cloud Datastore Index Admin. No npm dependencies.
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const projectId = process.env.PROJECT_ID;
const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!projectId || !credsPath) {
  console.error("PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS must be set.");
  process.exit(1);
}
const sa = JSON.parse(readFileSync(credsPath, "utf8"));

async function accessToken() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${JSON.stringify(body)}`);
  return body.access_token;
}

const token = await accessToken();

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, ok: res.ok, data: text ? JSON.parse(text) : {} };
}

function fail(step, r) {
  console.error(`::error::${step} failed (HTTP ${r.status}): ${r.data?.error?.message ?? JSON.stringify(r.data)}`);
  if (r.data?.error?.details) console.error(JSON.stringify(r.data.error.details, null, 2));
  process.exit(1);
}

console.log(`Deploying to ${projectId} as ${sa.client_email}`);

// --- Security rules ---------------------------------------------------------------
const rulesBase = `https://firebaserules.googleapis.com/v1/projects/${projectId}`;
const ruleset = await api("POST", `${rulesBase}/rulesets`, {
  source: { files: [{ name: "firestore.rules", content: readFileSync("firestore.rules", "utf8") }] },
});
if (!ruleset.ok) fail("Creating ruleset", ruleset);

const releaseName = `projects/${projectId}/releases/cloud.firestore`;
const release = { name: releaseName, rulesetName: ruleset.data.name };
let rel = await api("PATCH", `https://firebaserules.googleapis.com/v1/${releaseName}`, { release });
if (rel.status === 404) rel = await api("POST", `${rulesBase}/releases`, release);
if (!rel.ok) fail("Releasing ruleset", rel);
console.log(`✔ Rules released: ${ruleset.data.name}`);

// --- Composite indexes (create-only; existing ones are left as they are) ---------
const { indexes = [], fieldOverrides = [] } = JSON.parse(readFileSync("firestore.indexes.json", "utf8"));
const dbBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)`;
for (const idx of indexes) {
  const label = `${idx.collectionGroup}(${idx.fields.map((f) => f.fieldPath).join(", ")})`;
  const r = await api("POST", `${dbBase}/collectionGroups/${idx.collectionGroup}/indexes`, {
    queryScope: idx.queryScope ?? "COLLECTION",
    fields: idx.fields,
  });
  if (r.status === 409) console.log(`• Index already exists: ${label}`);
  else if (r.ok) console.log(`✔ Index creation started: ${label}`);
  else fail(`Creating index ${label}`, r);
}
if (fieldOverrides.length) {
  console.log(`::warning::${fieldOverrides.length} fieldOverrides in firestore.indexes.json are not deployed by this script.`);
}
console.log("Done.");
