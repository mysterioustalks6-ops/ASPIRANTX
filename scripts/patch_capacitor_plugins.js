import fs from 'fs';
import path from 'path';

const capacitorDir = path.resolve('node_modules', '@capacitor');

if (fs.existsSync(capacitorDir)) {
  const entries = fs.readdirSync(capacitorDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const gradleFile = path.join(capacitorDir, entry.name, 'android', 'build.gradle');
      if (fs.existsSync(gradleFile)) {
        let content = fs.readFileSync(gradleFile, 'utf8');
        const searchPattern = "} else {\n        implementation project(':capacitor-android')";
        const replacement = "} else if (findProject(':capacitor-android') != null || rootProject.findProject(':capacitor-android') != null) {\n        implementation project(':capacitor-android')";
        if (content.includes(searchPattern)) {
          content = content.replace(searchPattern, replacement);
          fs.writeFileSync(gradleFile, content, 'utf8');
          console.log(`[patch] Successfully protected @capacitor/${entry.name}/android/build.gradle against standalone evaluation.`);
        }
      }
    }
  }
}
