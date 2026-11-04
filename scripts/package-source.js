import {mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const {version}=JSON.parse(readFileSync('package.json','utf8'));await mkdir('release',{recursive:true});
// git archive only includes reviewed tracked source, never user data or ignored files.
execFileSync('git',['archive','--format=zip',`--prefix=PhyCalendar-${version}/`,`--output=release/PhyCalendar-${version}-source.zip`,'HEAD']);
execFileSync('python3',['-c',`from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
with ZipFile('release/PhyCalendar-${version}-PWA.zip','w',ZIP_DEFLATED) as z:
 for p in sorted(Path('dist').rglob('*')):
  if p.is_file(): z.write(p,str(p.relative_to('dist')))
`]);
console.log('Packaged reviewed source and PWA assets (not native installers).');
