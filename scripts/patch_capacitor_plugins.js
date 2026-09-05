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
        const searchPatternLF = "} else {\n        implementation project(':capacitor-android')";
        const searchPatternCRLF = "} else {\r\n        implementation project(':capacitor-android')";
        const replacementLF = "} else if (findProject(':capacitor-android') != null || rootProject.findProject(':capacitor-android') != null) {\n        implementation project(':capacitor-android')";
        const replacementCRLF = "} else if (findProject(':capacitor-android') != null || rootProject.findProject(':capacitor-android') != null) {\r\n        implementation project(':capacitor-android')";

        if (content.includes(searchPatternLF)) {
          content = content.replace(searchPatternLF, replacementLF);
          fs.writeFileSync(gradleFile, content, 'utf8');
          console.log(`[patch] Successfully protected @capacitor/${entry.name}/android/build.gradle against standalone evaluation.`);
        } else if (content.includes(searchPatternCRLF)) {
          content = content.replace(searchPatternCRLF, replacementCRLF);
          fs.writeFileSync(gradleFile, content, 'utf8');
          console.log(`[patch] Successfully protected @capacitor/${entry.name}/android/build.gradle against standalone evaluation.`);
        }
      }
    }
  }
}
