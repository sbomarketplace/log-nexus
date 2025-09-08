import { ResourcesSchema } from "../src/data/resources.schema";
import { RESOURCES } from "../src/data/resources";

const parsed = ResourcesSchema.safeParse(RESOURCES);
if (!parsed.success) {
  console.error("❌ Resources validation failed:\n", parsed.error.format());
  process.exit(1);
}

const groups = RESOURCES.map(g => `${g.title}: ${g.items.length}`).join("\n");
console.log("✅ Resources validation passed.\nCounts by group:\n" + groups);

// Optional: basic URL format checks (don't fetch network in CI by default)
const bad = [];
for (const g of RESOURCES) {
  for (const it of g.items) {
    for (const a of it.actions) {
      if (a.kind === "link" && !/^https?:\/\/|^#|^\//.test(a.value)) bad.push({ id: it.id, action: a });
      if (a.kind === "phone" && !/^tel:/i.test(a.value)) bad.push({ id: it.id, action: a });
      if (a.kind === "email" && !/^mailto:/i.test(a.value)) bad.push({ id: it.id, action: a });
    }
  }
}
if (bad.length) {
  console.warn("⚠️ Some actions have suspicious values:", bad);
}

// Coverage report
const totalItems = RESOURCES.reduce((sum, g) => sum + g.items.length, 0);
const missingPurpose = RESOURCES.flatMap(g => g.items).filter(i => !i.purpose);
const singleAction = RESOURCES.flatMap(g => g.items).filter(i => i.actions.length === 1);

console.log(`\n📊 Coverage Report:
- Total groups: ${RESOURCES.length}
- Total items: ${totalItems}
- Items missing purpose: ${missingPurpose.length}
- Items with single action: ${singleAction.length}
`);

if (missingPurpose.length > 0) {
  console.log("Items missing purpose:", missingPurpose.map(i => i.id));
}