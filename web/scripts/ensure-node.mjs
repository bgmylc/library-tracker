const requiredMajor = 22;
const current = process.versions.node;
const major = Number(current.split('.')[0]);

if (major !== requiredMajor) {
  console.error(`\n[library-tracker] Node ${requiredMajor}.x is required. Current: ${current}`);
  console.error("Run: export PATH=\"/opt/homebrew/opt/node@22/bin:$PATH\"");
  console.error("Then run npm run dev again.\n");
  process.exit(1);
}
