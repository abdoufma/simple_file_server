//@ts-check
import { networkInterfaces } from "os";
import { join } from "path";
import { Readable } from "stream";

const PORT = 8080;
const UPLOAD_DIR = "./uploads";

// Create uploads directory if it doesn't exist
await Bun.write(join(UPLOAD_DIR, ".gitkeep"), "");

const noteGenerator = async function* () {
  yield "Do ";
  await Bun.sleep(500);
  yield "Re ";
  await Bun.sleep(500);
  yield "Mi ";
  await Bun.sleep(500);
  yield "Fa ";
  await Bun.sleep(500);
  yield "So ";
  await Bun.sleep(500);
  yield "La ";
  await Bun.sleep(500);
  yield "Ti ";
  await Bun.sleep(500);
  yield "Do!";
};

async function* doSomeHeavyWork(){
  for (let i = 0; i < 100; i++) {
    yield i.toString();
  }
  yield "done"
}


const server = Bun.serve({
  port: PORT,
  routes: {
    "/": () => new Response(Bun.file("index.html")),
    '/notes' : new Response(noteGenerator),
    '/work' : new Response(doSomeHeavyWork),
    '/frontend' : new Response(doSomeHeavyWork),
    '/stream' : new Response(Readable.from(["Hello, ", "world!"]), {
        headers: { "Content-Type": "text/plain" },
      }),
    '/upload' : {
      POST: async (req) => {
        try {
          const formData = await req.formData();
          const uploadedFile = formData.get("file");

          if (!uploadedFile || !(uploadedFile instanceof File)) {
            return Response.json({ error: "No file provided" }, { status: 400 });
          }

          const filepath = join(UPLOAD_DIR, uploadedFile.name);
          await Bun.write(filepath, uploadedFile);

          console.log(`File saved: ${filepath} (${uploadedFile.size} bytes)`);

          return Response.json({
            message: `File "${uploadedFile.name}" uploaded successfully!`,
            path: filepath,
            size: uploadedFile.size,
          });
        } catch (err) {
          console.error("Upload error:", err);
          return Response.json(
            { error: "Upload failed: " + err.message },
            { status: 500 },
          );
        }
      }
    }
  },
  fetch : (req) => new Response("Not found", { status: 404 }),
});

// Display server info
const interfaces = networkInterfaces();
console.log(`\n=== File Upload Server Started ===`);
console.log(`\nAccess from Machine B using any of these URLs:\n`);
console.log(interfaces);
for (let name of Object.keys(interfaces)) {
  for (let iface of interfaces[name]) {
    if (iface.family === "IPv4" && !iface.internal) {
      console.log(`  http://${iface.address}:${PORT}`);
    }
  }
}

console.log(`\nFiles will be saved to: ${join(process.cwd(), UPLOAD_DIR)}\n`);
