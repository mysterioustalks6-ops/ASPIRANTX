import fs from 'fs';

const files = [
  '.git/lost-found/other/0f385f77e55dfdaa933b58395b6854f564e897e2',
  '.git/lost-found/other/643806838d0cc5369a55e00a795c8c170f2c7baa',
  '.git/lost-found/other/99eca2f87fa1b1354719b55f87e65ec3ed649a4b',
  '.git/lost-found/other/9d767a87242a52b081698520b612fc3b5420567c',
  '.git/lost-found/other/c0c501d8974be037a66e2fe13f78bc9a5a42720a'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    const buf = Buffer.alloc(32);
    const fd = fs.openSync(f, 'r');
    fs.readSync(fd, buf, 0, 32, 0);
    fs.closeSync(fd);
    console.log(f, 'Header ascii:', buf.toString('ascii').replace(/[^\x20-\x7E]/g, '.'));
  }
}
