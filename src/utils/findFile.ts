import { lstatSync, readdirSync } from "fs";
import { lstat, readdir } from "fs/promises";
import path from "path";



export async function findFile(fileName: string, dirPath: string) {
  const base_path = path.resolve(dirPath)
  const files = await readdir(base_path)
  console.log('getting', ...arguments)

  return (await Promise.all(files.map(file => {
    const child_path = path.join(base_path, file)
    if (lstatSync(child_path).isDirectory())
      return findFile(fileName, child_path)
    else if (fileName === file)
      return child_path
    else
      return false
  }))).filter(Boolean)[0]

}
