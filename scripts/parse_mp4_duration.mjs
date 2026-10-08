import fs from 'fs';

const buf = fs.readFileSync('public/assets/videos/relax_highway.mp4');
console.log('File size:', buf.length);

let offset = 0;
while (offset < buf.length - 8) {
  const size = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  if (type === 'moov') {
    let moovOffset = offset + 8;
    while (moovOffset < offset + size - 8) {
      const subSize = buf.readUInt32BE(moovOffset);
      const subType = buf.toString('ascii', moovOffset + 4, moovOffset + 8);
      if (subType === 'mvhd') {
        const version = buf[moovOffset + 8];
        let timescale, duration;
        if (version === 1) {
          timescale = buf.readUInt32BE(moovOffset + 28);
          duration = Number(buf.readBigUInt64BE(moovOffset + 32));
        } else {
          timescale = buf.readUInt32BE(moovOffset + 20);
          duration = buf.readUInt32BE(moovOffset + 24);
        }
        console.log(`Duration: ${(duration / timescale).toFixed(3)}s (timescale: ${timescale}, duration units: ${duration})`);
        break;
      }
      moovOffset += subSize > 0 ? subSize : 1;
    }
    break;
  }
  offset += size > 0 ? size : 1;
}
